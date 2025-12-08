import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";
import bcrypt from "bcryptjs";

const router = Router();

// GET /api/client/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    const clientId = req.user.clientId;

    const [clientRows] = await pool.query(
      `SELECT FullName, BirthDate, PassportNumber, address, phone, ClientType
       FROM client
       WHERE ID = ?
       LIMIT 1`,
      [clientId]
    );

    if (clientRows.length === 0) {
      return res.status(404).json({ error: "Klient nenalezen" });
    }

    const c = clientRows[0];

    const [sumRows] = await pool.query(
      `SELECT COALESCE(SUM(Balance), 0) AS totalBalance
       FROM bank_card
       WHERE BankAccountID = ?`,
      [req.user.id]
    );
    const totalBalance = sumRows[0].totalBalance || 0;

    const [accRows] = await pool.query(
      `SELECT MustChangeCredentials
       FROM bank_account
       WHERE ID = ?
       LIMIT 1`,
      [req.user.id]
    );

    const mustChange =
      accRows.length > 0 ? !!accRows[0].MustChangeCredentials : false;

    res.json({
      fullName: c.FullName,
      birthDate: c.BirthDate,
      passportNumber: c.PassportNumber,
      address: c.address,
      phone: c.phone,
      clientType: c.ClientType,
      totalBalance: Number(totalBalance).toFixed(2),
      login: req.user.login,
      mustChangeCredentials: mustChange,
    });
  } catch (err) {
    console.error("GET /api/client/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Pomocná funkce: z rodného čísla vytáhne datum narození (velmi zjednodušeně)
function birthDateFromBirthNumber(birthNumber) {
  const clean = birthNumber.replace("/", "").trim();
  if (!/^\d{9,10}$/.test(clean)) return null;

  let year = parseInt(clean.slice(0, 2), 10);
  let month = parseInt(clean.slice(2, 4), 10);
  const day = parseInt(clean.slice(4, 6), 10);

  if (month > 50) {
    month -= 50;
  }

  const currentYear = new Date().getFullYear();
  const currentTwoDigits = currentYear % 100;
  const century = year <= currentTwoDigits ? 2000 : 1900;

  const date = new Date(century + year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function calculateAgeFromDate(date) {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const m = today.getMonth() - date.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

// POST /api/client/children/invite
// Rodič vytvoří dětský účet (login = email dítěte, heslo = kód)
router.post("/children/invite", requireAuth, async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const parentAccountId = req.user.id; // bank_account.ID
    const { fullName, birthNumber, email } = req.body || {};

    if (!fullName || !birthNumber || !email) {
      return res.status(400).json({ error: "Chybí povinná pole." });
    }

    const birthDate = birthDateFromBirthNumber(birthNumber);
    if (!birthDate) {
      return res.status(400).json({ error: "Neplatné rodné číslo." });
    }

    const age = calculateAgeFromDate(birthDate);
    if (age >= 18) {
      return res
        .status(400)
        .json({ error: "Dítě musí být mladší 18 let." });
    }

    // 6-místný kód jako první heslo
    const code = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    await conn.beginTransaction();

    // 🔴 TADY OPRAVA: PassportNumber = birthNumber (NE NULL)
    const [clientRes] = await conn.query(
      `INSERT INTO client (FullName, BirthDate, PassportNumber, address, phone, ClientType, IsMinor)
       VALUES (?, ?, ?, NULL, NULL, 'Fyzická osoba', 1)`,
      [fullName, birthDate.toISOString().slice(0, 10), birthNumber]
    );
    const childClientId = clientRes.insertId;

    const hash = await bcrypt.hash(code, 10);

    await conn.query(
      `INSERT INTO bank_account (ClientID, login, password, role, ParentAccountID, MustChangeCredentials)
       VALUES (?, ?, ?, 'ROLE_USER', ?, 1)`,
      [childClientId, email, hash, parentAccountId]
    );

    await conn.commit();

    console.log("========================================");
    console.log("POZVÁNKA PRO DÍTĚ");
    console.log("Email (login):", email);
    console.log("První heslo (kód):", code);
    console.log("Dítě se poprvé přihlásí na /login:");
    console.log("  login =", email);
    console.log("  heslo =", code);
    console.log("========================================");

    return res.json({ ok: true });
  } catch (err) {
    await (conn?.rollback?.().catch(() => {}));
    console.error("POST /client/children/invite error:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

// GET /api/client/children – seznam dětských účtů přihlášeného rodiče
router.get("/children", requireAuth, async (req, res) => {
  try {
    const parentAccountId = req.user.id;

    const [rows] = await pool.query(
      `SELECT
         ba.ID            AS BankAccountID,
         c.ID             AS ClientID,
         c.FullName       AS FullName,
         c.BirthDate      AS BirthDate
       FROM bank_account ba
       JOIN client c ON ba.ClientID = c.ID
       WHERE ba.ParentAccountID = ?`,
      [parentAccountId]
    );

    res.json(rows);
  } catch (err) {
    console.error("GET /client/children error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
