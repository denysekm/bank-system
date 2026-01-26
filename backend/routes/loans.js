import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// Interest parameters (Fixed for now)
const FIXED_INTEREST_RATE = 5.00; // 5%
const FIXED_APR = 5.20; // 5.2%

// Evaluation constants
const MAX_INSTALLMENT_RATIO = 0.4; // 40%

/**
 * POST /api/loans/apply
 * Applies for a new loan and evaluates eligibility.
 */
router.post("/apply", requireAuth, async (req, res) => {
    const { amount, duration, income, obligations } = req.body || {};
    const bankAccountId = req.user.id;

    if (!amount || amount <= 0 || !duration || duration <= 0 || !income || income <= 0) {
        return res.status(400).json({ error: "Vyplňte všechna pole s platnými hodnotami." });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 0. Age check: minors cannot take loans
        const [clientRows] = await conn.query(
            "SELECT IsMinor FROM client WHERE ID = ?",
            [req.user.clientId]
        );
        if (clientRows.length > 0 && clientRows[0].IsMinor) {
            await conn.rollback();
            return res.status(403).json({ error: "Dětské účty nemohou žádat o půjčku." });
        }

        // 0b. Credit card check: must have a credit card to apply
        const [creditCards] = await conn.query(
            "SELECT ID, CardNumber FROM bank_card WHERE BankAccountID = ? AND (LOWER(TRIM(CardType)) = 'kreditní' OR LOWER(TRIM(CardType)) = 'credit') LIMIT 1",
            [bankAccountId]
        );

        if (creditCards.length === 0) {
            await conn.rollback();
            return res.status(400).json({ error: "Pro získání půjčky musíte mít aktivní kreditní kartu." });
        }
        const targetCreditCard = creditCards[0];

        // 1. Installment calculation (Simple: (Principal * (1 + (Rate/100))) / Duration)
        // More realistic: Amortization formula, but keeping it simple as per request
        const totalToRepay = amount * (1 + (FIXED_INTEREST_RATE / 100));
        const estimatedInstallment = totalToRepay / duration;

        // 3. Debt-to-income check
        const availableIncome = income - (obligations || 0);
        if (estimatedInstallment > availableIncome * MAX_INSTALLMENT_RATIO) {
            await conn.query(
                "INSERT INTO loan_applications (BankAccountID, RequestedAmount, DurationMonths, MonthlyIncome, OtherObligations, Status, RejectionReason) VALUES (?, ?, ?, ?, ?, 'REJECTED', ?)",
                [bankAccountId, amount, duration, income, obligations || 0, "Měsíční splátka by překročila 40 % vašeho disponibilního příjmu."]
            );
            await conn.commit();
            return res.status(400).json({ status: "REJECTED", error: "Splátka je příliš vysoká vzhledem k vašemu příjmu." });
        }

        // 4. APPROVED - Save application
        const [appResult] = await conn.query(
            "INSERT INTO loan_applications (BankAccountID, RequestedAmount, DurationMonths, MonthlyIncome, OtherObligations, Status) VALUES (?, ?, ?, ?, ?, 'APPROVED')",
            [bankAccountId, amount, duration, income, obligations || 0]
        );
        const applicationId = appResult.insertId;

        // 5. Create Loan
        const [loanResult] = await conn.query(
            "INSERT INTO loans (ApplicationID, BankAccountID, PrincipalAmount, RemainingAmount, InterestRate, APR, DurationMonths, MonthlyInstallment, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE')",
            [applicationId, bankAccountId, amount, totalToRepay, FIXED_INTEREST_RATE, FIXED_APR, duration, estimatedInstallment]
        );
        const loanId = loanResult.insertId;

        // 6. Generate Installments (first one is due in 1 month)
        for (let i = 1; i <= duration; i++) {
            const dueDate = new Date();
            dueDate.setMonth(dueDate.getMonth() + i);
            await conn.query(
                "INSERT INTO loan_installments (LoanID, InstallmentNumber, DueDate, Amount, Status) VALUES (?, ?, ?, ?, 'PENDING')",
                [loanId, i, dueDate.toISOString().slice(0, 10), estimatedInstallment]
            );
        }

        // 7. Disburse funds directly to credit card
        await conn.query("UPDATE bank_card SET Balance = Balance + ? WHERE ID = ?", [amount, targetCreditCard.ID]);
        const disbursementTarget = "CARD";
        const targetDetail = targetCreditCard.CardNumber;

        // 8. Log transaction
        const [accRows] = await conn.query("SELECT AccountNumber FROM bank_account WHERE ID = ?", [bankAccountId]);
        const accNum = accRows[0].AccountNumber;

        await conn.query(
            "INSERT INTO payment_transaction (BankAccountID, Sender, Receiver, Amount, Note) VALUES (?, 'BANK_LOAN_SYSTEM', ?, ?, ?)",
            [
                bankAccountId,
                disbursementTarget === "CARD" ? targetDetail : accNum,
                amount,
                `LOAN_DISBURSEMENT (${disbursementTarget === "CARD" ? 'Credit Card' : 'Bank Account'})`
            ]
        );

        await conn.commit();
        res.json({ ok: true, status: "APPROVED", loanId, disbursedTo: disbursementTarget });
    } catch (err) {
        await conn.rollback();
        console.error("Loan apply error:", err);
        const msg = err.code === 'ER_NO_SUCH_TABLE'
            ? "Databázové tabulky pro půjčky neexistují. Prosím, spusťte SQL skript loans_schema.sql."
            : "Server error při zpracování půjčky.";
        res.status(500).json({ error: msg });
    } finally {
        conn.release();
    }
});

/**
 * GET /api/loans/active
 * Returns user's active loan and next installment.
 */
router.get("/active", requireAuth, async (req, res) => {
    try {
        const bankAccountId = req.user.id;
        const [loans] = await pool.query(
            "SELECT * FROM loans WHERE BankAccountID = ? AND Status = 'ACTIVE' LIMIT 1",
            [bankAccountId]
        );

        if (loans.length === 0) {
            return res.json({ activeLoan: null });
        }

        const loan = loans[0];
        const [installments] = await pool.query(
            "SELECT * FROM loan_installments WHERE LoanID = ? ORDER BY DueDate ASC",
            [loan.ID]
        );

        const nextInstallment = installments.find(inst => inst.Status === 'PENDING');

        res.json({
            activeLoan: loan,
            installments,
            nextInstallment
        });
    } catch (err) {
        console.error("GET /loans/active error:", err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json({ activeLoan: null, error: "TABLES_MISSING" });
        }
        res.status(500).json({ error: "Server error." });
    }
});

/**
 * GET /api/loans/history
 * Returns user's loan application history.
 */
router.get("/history", requireAuth, async (req, res) => {
    try {
        const bankAccountId = req.user.id;
        const [history] = await pool.query(
            "SELECT * FROM loan_applications WHERE BankAccountID = ? ORDER BY CreatedAt DESC",
            [bankAccountId]
        );
        res.json(history);
    } catch (err) {
        console.error("GET /loans/history error:", err);
        if (err.code === 'ER_NO_SUCH_TABLE') {
            return res.json([]);
        }
        res.status(500).json({ error: "Server error." });
    }
});

/**
 * POST /api/loans/repay
 * Pays the next pending installment.
 */
router.post("/repay", requireAuth, async (req, res) => {
    const bankAccountId = req.user.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Find active loan
        const [loans] = await conn.query(
            "SELECT * FROM loans WHERE BankAccountID = ? AND Status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [bankAccountId]
        );
        if (loans.length === 0) throw new Error("Nemáte žádnou aktivní půjčku.");
        const loan = loans[0];

        // 1b. Get account and debit card balances (combined pool)
        const [accRows] = await conn.query(
            "SELECT Balance, AccountNumber FROM bank_account WHERE ID = ? FOR UPDATE",
            [bankAccountId]
        );
        const accountBalance = Number(accRows[0].Balance);
        const accNum = accRows[0].AccountNumber;

        const [debitCards] = await conn.query(
            "SELECT ID, Balance FROM bank_card WHERE BankAccountID = ? AND (LOWER(TRIM(CardType)) = 'debetní' OR LOWER(TRIM(CardType)) = 'debit') LIMIT 1 FOR UPDATE",
            [bankAccountId]
        );
        if (debitCards.length === 0) {
            throw new Error("Splácení půjčky je možné pouze pokud máte aktivní debetní kartu.");
        }
        const debitCard = debitCards[0];
        const cardBalance = Number(debitCard.Balance);

        // 2. Find next installment
        const [installments] = await conn.query(
            "SELECT * FROM loan_installments WHERE LoanID = ? AND Status = 'PENDING' ORDER BY DueDate ASC LIMIT 1 FOR UPDATE",
            [loan.ID]
        );
        if (installments.length === 0) throw new Error("Žádná čekající splátka.");
        const installment = installments[0];
        const installmentAmount = Number(installment.Amount);

        // 3. Check combined total
        const totalAvailable = accountBalance + cardBalance;

        if (totalAvailable < installmentAmount) {
            throw new Error(`Nedostatek prostředků (účet + karta). Vyžadováno: ${installmentAmount.toFixed(2)} CZK, k dispozici celkem: ${totalAvailable.toFixed(2)} CZK.`);
        }

        // 4. Deduct logic: Card first, then Account
        let amountFromCard = Math.min(cardBalance, installmentAmount);
        let amountFromAccount = installmentAmount - amountFromCard;

        if (amountFromCard > 0) {
            await conn.query("UPDATE bank_card SET Balance = Balance - ? WHERE ID = ?", [amountFromCard, debitCard.ID]);
        }
        if (amountFromAccount > 0) {
            await conn.query("UPDATE bank_account SET Balance = Balance - ? WHERE ID = ?", [amountFromAccount, bankAccountId]);
        }

        // 5. Update installment
        await conn.query(
            "UPDATE loan_installments SET Status = 'PAID', PaidDate = NOW() WHERE ID = ?",
            [installment.ID]
        );

        // 6. Update loan remaining amount
        const newRemaining = Number(loan.RemainingAmount) - installmentAmount;
        const isFinished = newRemaining <= 0;
        await conn.query(
            "UPDATE loans SET RemainingAmount = ?, Status = ? WHERE ID = ?",
            [Math.max(0, newRemaining), isFinished ? 'PAID' : 'ACTIVE', loan.ID]
        );

        // 7. Log transaction
        await conn.query(
            "INSERT INTO payment_transaction (BankAccountID, Sender, Receiver, Amount, Note) VALUES (?, ?, 'BANK_LOAN_SYSTEM', ?, 'LOAN_REPAYMENT')",
            [bankAccountId, accNum, installmentAmount]
        );

        await conn.commit();
        res.json({ ok: true, isFinished });
    } catch (err) {
        await conn.rollback();
        console.error("Loan repay error:", err);
        res.status(400).json({ error: err.message || "Chyba při splácení." });
    } finally {
        conn.release();
    }
});

/**
 * POST /api/loans/repay-all
 * Pays the entire remaining loan amount.
 */
router.post("/repay-all", requireAuth, async (req, res) => {
    const bankAccountId = req.user.id;
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Find active loan
        const [loans] = await conn.query(
            "SELECT * FROM loans WHERE BankAccountID = ? AND Status = 'ACTIVE' LIMIT 1 FOR UPDATE",
            [bankAccountId]
        );
        if (loans.length === 0) throw new Error("Nemáte žádnou aktivní půjčku.");
        const loan = loans[0];

        // 2. Get account and debit card balances (combined pool)
        const [accRows] = await conn.query(
            "SELECT Balance, AccountNumber FROM bank_account WHERE ID = ? FOR UPDATE",
            [bankAccountId]
        );
        const accountBalance = Number(accRows[0].Balance);
        const accNum = accRows[0].AccountNumber;

        const [debitCards] = await conn.query(
            "SELECT ID, Balance FROM bank_card WHERE BankAccountID = ? AND (LOWER(TRIM(CardType)) = 'debetní' OR LOWER(TRIM(CardType)) = 'debit') LIMIT 1 FOR UPDATE",
            [bankAccountId]
        );
        if (debitCards.length === 0) {
            throw new Error("Splácení je možné pouze pokud máte aktivní debetní kartu.");
        }
        const debitCard = debitCards[0];
        const cardBalance = Number(debitCard.Balance);

        const remainingTotal = Number(loan.RemainingAmount);
        const totalAvailable = accountBalance + cardBalance;

        if (totalAvailable < remainingTotal) {
            throw new Error(`Nedostatek prostředků (účet + karta) pro úplné splacení. Vyžadováno: ${remainingTotal.toFixed(2)} CZK, k dispozici celkem: ${totalAvailable.toFixed(2)} CZK.`);
        }

        // 3. Deduct logic: Card first, then Account
        let amountFromCard = Math.min(cardBalance, remainingTotal);
        let amountFromAccount = remainingTotal - amountFromCard;

        if (amountFromCard > 0) {
            await conn.query("UPDATE bank_card SET Balance = Balance - ? WHERE ID = ?", [amountFromCard, debitCard.ID]);
        }
        if (amountFromAccount > 0) {
            await conn.query("UPDATE bank_account SET Balance = Balance - ? WHERE ID = ?", [amountFromAccount, bankAccountId]);
        }

        // 4. Mark all installments as PAID
        await conn.query(
            "UPDATE loan_installments SET Status = 'PAID', PaidDate = NOW() WHERE LoanID = ? AND Status = 'PENDING'",
            [loan.ID]
        );

        // 5. Finish loan
        await conn.query(
            "UPDATE loans SET RemainingAmount = 0, Status = 'PAID' WHERE ID = ?",
            [loan.ID]
        );

        // 6. Log transaction
        await conn.query(
            "INSERT INTO payment_transaction (BankAccountID, Sender, Receiver, Amount, Note) VALUES (?, ?, 'BANK_LOAN_SYSTEM', ?, 'LOAN_FULL_PAYOFF')",
            [bankAccountId, accNum, remainingTotal]
        );

        await conn.commit();
        res.json({ ok: true, isFinished: true });
    } catch (err) {
        await conn.rollback();
        console.error("Loan repay-all error:", err);
        res.status(400).json({ error: err.message || "Chyba při úplném splacení." });
    } finally {
        conn.release();
    }
});

export default router;
