import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// pomocná funkce na generování náhodných čísel
function randomDigits(len) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join("");
}

// vygeneruje jedinečné číslo karty (16 číslic)
async function generateUniqueCardNumber() {
  let num;
  let exists = true;
  while (exists) {
    num = randomDigits(16);
    const [check] = await pool.query(
      "SELECT 1 FROM bank_card WHERE CardNumber = ? LIMIT 1",
      [num]
    );
    exists = check.length > 0;
  }
  return num;
}

// GET /api/cards/me – získání všech karet přihlášeného účtu
router.get("/me", requireAuth, async (req, res) => {
  try {
    const accountId = req.user.id; // bank_account.ID

    // Načteme karty a balance z účtu
    const [rows] = await pool.query(
      `SELECT bc.ID, bc.CardNumber, bc.CVV, bc.EndDate, bc.CardType, bc.Brand, bc.Balance
       FROM bank_card bc
       WHERE bc.BankAccountID = ?`,
      [accountId]
    );

    const cards = rows.map((card) => ({
      id: card.ID,
      cardNumber: card.CardNumber,
      cvv: card.CVV,
      endDate: card.EndDate,
      balance: Number(card.Balance).toFixed(2),
      cardType: card.CardType,
      brand: card.Brand,
    }));

    res.json(cards);
  } catch (err) {
    console.error("GET /api/cards/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /api/cards – vytvoření nové karty pro přihlášeného uživatele
router.post("/", requireAuth, async (req, res) => {
  try {
    const accountId = req.user.id; // bank_account.ID
    const { cardType, brand } = req.body || {};

    // 1) Validace a normalizace typu karty (debetní / kreditní)
    let finalType;
    if (cardType === "debetní" || cardType === "DEBIT") {
      finalType = "debetní";
    } else if (cardType === "kreditní" || cardType === "CREDIT") {
      finalType = "kreditní";
    } else {
      return res.status(400).json({ error: "Neplatný typ karty" });
    }

    // 2) Validace a normalizace brandu (VISA / MASTERCARD)
    let finalBrand;
    if (brand === "VISA" || brand === "Visa") {
      finalBrand = "VISA";
    } else if (brand === "MASTERCARD" || brand === "Mastercard") {
      finalBrand = "MASTERCARD";
    } else {
      return res.status(400).json({ error: "Neplatná značka karty" });
    }

    // 3) Limit: pouze jedna debetní / jedna kreditní karta na uživatele
    if (finalType === "debetní") {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM bank_card
         WHERE BankAccountID = ? AND CardType = 'debetní'`,
        [accountId]
      );

      if (rows[0].cnt >= 1) {
        return res.status(400).json({ error: "Už máte debetní kartu" });
      }
    }

    if (finalType === "kreditní") {
      const [rows] = await pool.query(
        `SELECT COUNT(*) AS cnt
         FROM bank_card
         WHERE BankAccountID = ? AND CardType = 'kreditní'`,
        [accountId]
      );

      if (rows[0].cnt >= 1) {
        return res.status(400).json({ error: "Už máte kreditní kartu" });
      }
    }

    // 4) Bonus: 1000 Kč za vytvoření debetní karty
    let initialBalance = 0.0;
    if (finalType === "debetní") {
      initialBalance = 1000000.0;
    }

    // 5) Generování údajů pro novou kartu
    const cardNumber = await generateUniqueCardNumber();
    const cvv = randomDigits(3);

    const endDateObj = new Date();
    endDateObj.setFullYear(endDateObj.getFullYear() + 5);
    const endDateSql = endDateObj.toISOString().slice(0, 10); // YYYY-MM-DD

    // 6) Začneme transakci pro vložení karty a případný bonus
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO bank_card
          (BankAccountID, CardNumber, CVV, EndDate, CardType, Brand, Balance)
         VALUES (?, ?, ?, ?, ?, ?, 0)`,
        [accountId, cardNumber, cvv, endDateSql, finalType, finalBrand]
      );

      // Bonus goes to the CARD balance, not the account
      if (finalType === "debetní") {
        await conn.query(
          "UPDATE bank_card SET Balance = Balance + ? WHERE ID = ?",
          [initialBalance, result.insertId]
        );
      }

      await conn.commit();

      res.status(201).json({
        id: result.insertId,
        cardNumber,
        cvv,
        endDate: endDateSql,
        balance: Number(initialBalance).toFixed(2),
        cardType: finalType,
        brand: finalBrand,
      });
    } catch (e) {
      await conn.rollback();
      throw e;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("POST /api/cards error:", err);
    res.status(500).json({ error: "Server error při vytváření karty" });
  }
});


export default router;
