import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

/**
 * GET /api/transactions/me
 * Vrátí poslední transakce účtu.
 * Tady hodně záleží, jak máš tabulku pojmenovanou.
 * Udělám předpoklad: transactions má sloupce:
 *   ID, Sender, Receiver, Amount, Note, TransactionDate, BankAccountID
 */
router.get("/me", requireAuth, async (req, res) => {
  const accountId = req.user.id;

  const [rows] = await pool.query(
    `SELECT ID, Sender, Receiver, Amount, Note, TransactionDate
   FROM payment_transaction
   WHERE BankAccountID = ?
   ORDER BY TransactionDate DESC
   LIMIT 20`,
    [accountId]
  );

  const tx = rows.map((t) => ({
    id: t.ID,
    sender: t.Sender,
    receiver: t.Receiver,
    amount: Number(t.Amount).toFixed(2),
    note: t.Note,
    transactionDate: t.TransactionDate,
  }));

  res.json(tx);
});


// POST /api/transactions/transfer
router.post("/transfer", requireAuth, async (req, res) => {
  const { toAccountNumber, amount, note } = req.body || {};
  const fromAccountId = req.user.id;

  if (!toAccountNumber || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get source account (and lock it)
    const [fromRows] = await conn.query(
      "SELECT ID, AccountNumber, Balance FROM bank_account WHERE ID = ? FOR UPDATE",
      [fromAccountId]
    );
    const fromAcc = fromRows[0];

    if (!fromAcc) throw new Error("Zdrojový účet nebyl nalezen.");
    if (fromAcc.Balance < amount) throw new Error("Nedostatek prostředků na účtu.");
    if (fromAcc.AccountNumber === toAccountNumber) throw new Error("Nelze poslat peníze na stejný účet.");

    // 2. Get destination account (and lock it)
    const [toRows] = await conn.query(
      "SELECT ID, AccountNumber, Balance FROM bank_account WHERE AccountNumber = ? FOR UPDATE",
      [toAccountNumber]
    );
    const toAcc = toRows[0];

    if (!toAcc) throw new Error("Cílový účet neexistuje nebo je číslo nesprávné.");

    // 3. Perform transfer
    await conn.query(
      "UPDATE bank_account SET Balance = Balance - ? WHERE ID = ?",
      [amount, fromAccountId]
    );
    await conn.query(
      "UPDATE bank_account SET Balance = Balance + ? WHERE AccountNumber = ?",
      [amount, toAccountNumber]
    );

    // 4. Record transaction
    await conn.query(
      "INSERT INTO payment_transaction (BankAccountID, sender, receiver, Amount, Note) VALUES (?, ?, ?, ?, ?)",
      [fromAccountId, fromAcc.AccountNumber, toAccountNumber, amount, note || "Transfer"]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("Transfer error:", e);
    res.status(400).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

export default router;
