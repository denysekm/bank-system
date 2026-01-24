import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

function calculateAge(birthDateStr) {
  const birth = new Date(birthDateStr);
  if (Number.isNaN(birth.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();

  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  return age;
}

// POST /api/auth/register – registrace dospělého
router.post("/register", async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const {
      login,
      password,
      fullName,
      birthDate,
      passportNumber,
      address,
      phone,
      clientType,
    } = req.body || {};

    if (
      !login ||
      !password ||
      !fullName ||
      !birthDate ||
      !passportNumber ||
      !clientType
    ) {
      return res.status(400).json({ error: "Chybí povinná pole." });
    }

    const age = calculateAge(birthDate);
    if (age == null) {
      return res.status(400).json({ error: "Neplatné datum narození." });
    }
    if (age < 18) {
      return res
        .status(400)
        .json({ error: "Pro registraci musíš být starší 18 let." });
    }

    let normalizedType;
    if (clientType === "Fyzická osoba") {
      normalizedType = "Fyzická osoba";
    } else if (clientType === "Právnická osoba") {
      normalizedType = "Právnická osoba";
    } else {
      normalizedType = "Fyzická osoba";
    }

    const [exists] = await pool.query(
      "SELECT ID FROM bank_account WHERE login = ? LIMIT 1",
      [login]
    );
    if (exists.length > 0) {
      return res
        .status(400)
        .json({ error: "Uživatel s tímto loginem už existuje." });
    }

    await conn.beginTransaction();

    const hash = await bcrypt.hash(password, 10);

    // Generate unique AccountNumber
    let accountNumber;
    let accExists = true;
    while (accExists) {
      accountNumber = "2000" + Math.floor(100000 + Math.random() * 900000);
      const [check] = await conn.query("SELECT 1 FROM bank_account WHERE AccountNumber = ? LIMIT 1", [accountNumber]);
      accExists = check.length > 0;
    }

    const [clientRes] = await conn.query(
      `INSERT INTO client (FullName, BirthDate, PassportNumber, address, phone, ClientType, IsMinor)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [fullName, birthDate, passportNumber, address || null, phone || null, normalizedType]
    );
    const clientId = clientRes.insertId;

    // Bonus for new account (set to 0, bonus is given for debit card creation instead)
    const initialBalance = 0.00;

    await conn.query(
      `INSERT INTO bank_account (ClientID, login, password, role, ParentAccountID, MustChangeCredentials, AccountNumber, Balance)
       VALUES (?, ?, ?, 'ROLE_USER', NULL, 0, ?, ?)`,
      [clientId, login, hash, accountNumber, initialBalance]
    );

    await conn.commit();
    return res.status(201).json({ ok: true, clientId, accountNumber });
  } catch (err) {
    await (conn?.rollback?.().catch(() => { }));
    console.error("Register error:", err);
    return res.status(500).json({
      error:
        err?.sqlMessage || err?.message || "Server error při registraci",
    });
  } finally {
    conn?.release?.();
  }
});

// POST /api/auth/login – běžné přihlášení (login + heslo)
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body || {};
    if (!login || !password) {
      return res.status(400).json({ error: "Chybí login nebo heslo" });
    }

    const [rows] = await pool.query(
      "SELECT ID, ClientID, login, password, role FROM bank_account WHERE login = ? LIMIT 1",
      [login]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);

    if (!ok) {
      return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
    }

    return res.json({
      message: "Přihlášení úspěšné",
      user: {
        id: user.ID,
        clientId: user.ClientID,
        role: user.role,
        login: user.login,
      },
    });
  } catch (err) {
    console.error("Auth login error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// POST /api/auth/change-credentials
// Přihlášený uživatel změní login + heslo (dítě po prvním přihlášení)
router.post("/change-credentials", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id; // bank_account.ID
    const { newLogin, newPassword } = req.body || {};

    if (!newLogin || !newPassword) {
      return res.status(400).json({ error: "Chybí nový login nebo heslo." });
    }

    // kontrola, že login ještě neexistuje u někoho jiného
    const [exists] = await pool.query(
      "SELECT ID FROM bank_account WHERE login = ? AND ID <> ? LIMIT 1",
      [newLogin, userId]
    );
    if (exists.length > 0) {
      return res.status(400).json({ error: "Login už existuje." });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE bank_account
       SET login = ?, password = ?, MustChangeCredentials = 0
       WHERE ID = ?`,
      [newLogin, hash, userId]
    );

    return res.json({ ok: true });
  } catch (err) {
    console.error("Auth change-credentials error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
