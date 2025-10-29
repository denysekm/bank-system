import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// pomocná funkce na generování náhodných čísel
function randomDigits(len) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 10)
  ).join("");
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
    const [rows] = await pool.query(
      `SELECT ID, CardNumber, CVV, EndDate, CardType, Balance
       FROM bank_card
       WHERE BankAccountID = ?`,
      [accountId]
    );

    const cards = rows.map((card) => ({
      id: card.ID,
      cardNumber: card.CardNumber,
      cvv: card.CVV,
      endDate: card.EndDate,
      balance: Number(card.Balance).toFixed(2),
      cardType: card.CardType,
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
    const { cardType } = req.body || {};

    // dovolíme jen DEBIT nebo CREDIT
    const finalType = cardType === "CREDIT" ? "CREDIT" : "DEBIT";

    const cardNumber = await generateUniqueCardNumber();
    const cvv = randomDigits(3);

    // expirace = dnes + 5 let
    const endDateObj = new Date();
    endDateObj.setFullYear(endDateObj.getFullYear() + 5);
    const endDateSql = endDateObj.toISOString().slice(0, 10); // YYYY-MM-DD

    const [result] = await pool.query(
      `INSERT INTO bank_card
        (BankAccountID, CardNumber, CVV, EndDate, CardType, Balance)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [accountId, cardNumber, cvv, endDateSql, finalType, 0.0]
    );

    res.status(201).json({
      id: result.insertId,
      cardNumber,
      cvv,
      endDate: endDateSql,
      balance: "0.00",
      cardType: finalType,
    });
  } catch (err) {
    console.error("POST /api/cards error:", err);
    res
      .status(500)
      .json({ error: "Server error při vytváření karty" });
  }
});

export default router;
