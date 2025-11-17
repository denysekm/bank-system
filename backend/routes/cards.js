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

    // 3) Limit: pouze jedna debetní karta na uživatele
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

    // 4) Bonus: 1000 Kč za vytvoření debetní karty
    let initialBalance = 0.0;
    if (finalType === "debetní") {
      initialBalance = 1000.0;
    }

    // 5) Generování údajů pro novou kartu
    const cardNumber = await generateUniqueCardNumber();
    const cvv = randomDigits(3);

    const endDateObj = new Date();
    endDateObj.setFullYear(endDateObj.getFullYear() + 5);
    const endDateSql = endDateObj.toISOString().slice(0, 10); // YYYY-MM-DD

    // 6) Uložení nové karty do databáze (včetně bonusu)
    const [result] = await pool.query(
      `INSERT INTO bank_card
        (BankAccountID, CardNumber, CVV, EndDate, CardType, Brand, Balance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [accountId, cardNumber, cvv, endDateSql, finalType, finalBrand, initialBalance]
    );

    // 7) Odpověď pro frontend
    res.status(201).json({
      id: result.insertId,
      cardNumber,
      cvv,
      endDate: endDateSql,
      balance: initialBalance.toFixed(2), // "1000.00" nebo "0.00"
      cardType: finalType,
      brand: finalBrand,
    });
  } catch (err) {
    console.error("POST /api/cards error:", err);
    res.status(500).json({ error: "Server error při vytváření karty" });
  }
});



//
// --- DOPLNĚNÉ AKCE: DOBITÍ / PŘEVOD / MOBIL ---
//

// pomoc: načti kartu s FOR UPDATE (kvůli transakcím) + BankAccountID
async function findCardLocked(conn, cardNumber) {
  const [rows] = await conn.query(
    "SELECT ID, BankAccountID, CardNumber, Balance FROM bank_card WHERE CardNumber = ? FOR UPDATE",
    [cardNumber]
  );
  return rows[0] || null;
}

// helper: aktuální bankovní účet z auth
function currentBankAccountId(req) {
  return req.user?.ID ?? req.user?.id ?? req.user?.bankAccountId ?? null;
}

// POST /api/cards/replenish
router.post("/replenish", requireAuth, async (req, res) => {
  const { card, amount, paymentMethod } = req.body || {};
  if (!card || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const cardRow = await findCardLocked(conn, card);
    if (!cardRow) throw new Error("CARD_NOT_FOUND");

    // (volitelné) autorizace: dobití může dělat jen vlastník karty
    const me = currentBankAccountId(req);
    if (me && Number(cardRow.BankAccountID) !== Number(me)) {
      throw new Error("FORBIDDEN_CARD");
    }

    await conn.query(
      "UPDATE bank_card SET Balance = Balance + ? WHERE CardNumber = ?",
      [amount, card]
    );

    // ⬇️ doplněno BankAccountID (vlastník dobíjené karty / iniciátor)
    await conn.query(
      "INSERT INTO payment_transaction (BankAccountID, sender, receiver, Amount, Note) VALUES (?, ?, ?, ?, ?)",
      [cardRow.BankAccountID, paymentMethod || "TOPUP", card, amount, `Replenish via ${paymentMethod || "UNKNOWN"}`]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("POST /replenish error:", e);
    res.status(400).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

// POST /api/cards/transfer
router.post("/transfer", requireAuth, async (req, res) => {
  const { fromCard, toCard, amount, description } = req.body || {};
  if (!fromCard || !toCard || fromCard === toCard || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const from = await findCardLocked(conn, fromCard);
    if (!from) throw new Error("FROM_NOT_FOUND");

    const to = await findCardLocked(conn, toCard);
    if (!to) throw new Error("TO_NOT_FOUND");

    // autorizace: z karty může odesílat jen její vlastník
    const me = currentBankAccountId(req);
    if (me && Number(from.BankAccountID) !== Number(me)) {
      throw new Error("FORBIDDEN_CARD");
    }

    if (Number(from.Balance) < amount) throw new Error("INSUFFICIENT_FUNDS");

    await conn.query(
      "UPDATE bank_card SET Balance = Balance - ? WHERE CardNumber = ?",
      [amount, fromCard]
    );
    await conn.query(
      "UPDATE bank_card SET Balance = Balance + ? WHERE CardNumber = ?",
      [amount, toCard]
    );

    // ⬇️ BankAccountID = vlastník fromCard (iniciátor)
    await conn.query(
      "INSERT INTO payment_transaction (BankAccountID, sender, receiver, Amount, Note) VALUES (?, ?, ?, ?, ?)",
      [from.BankAccountID, fromCard, toCard, amount, description || "Card to card transfer"]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("POST /transfer error:", e);
    res.status(400).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

// POST /api/cards/mobile
router.post("/mobile", requireAuth, async (req, res) => {
  const { fromCard, phone, amount } = req.body || {};
  if (!fromCard || !phone || typeof amount !== "number" || amount <= 0) {
    return res.status(400).json({ ok: false, error: "INVALID_INPUT" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const from = await findCardLocked(conn, fromCard);
    if (!from) throw new Error("FROM_NOT_FOUND");

    // autorizace
    const me = currentBankAccountId(req);
    if (me && Number(from.BankAccountID) !== Number(me)) {
      throw new Error("FORBIDDEN_CARD");
    }

    if (Number(from.Balance) < amount) throw new Error("INSUFFICIENT_FUNDS");

    await conn.query(
      "UPDATE bank_card SET Balance = Balance - ? WHERE CardNumber = ?",
      [amount, fromCard]
    );

    // ⬇️ BankAccountID = vlastník fromCard; receiver jako PHONE:<číslo>
    await conn.query(
      "INSERT INTO payment_transaction (BankAccountID, sender, receiver, Amount, Note) VALUES (?, ?, ?, ?, ?)",
      [from.BankAccountID, fromCard, `PHONE:${phone}`, amount, "Mobile transfer"]
    );

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("POST /mobile error:", e);
    res.status(400).json({ ok: false, error: e.message });
  } finally {
    conn.release();
  }
});

export default router;
