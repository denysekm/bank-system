import { Router } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../db.js";

const router = Router();

/**
 * POST /api/auth/register
 * Vytvoří nového klienta + bankovní účet
 */
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

    // 1) základní validace
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

    // 2) OCHRANA: dovol jen hodnoty, které chceme mít v DB v češtině
    //    Tohle přebije jakékoli PERSONAL/BUSINESS, které by sem případně přišlo.
    let normalizedType;
    if (clientType === "Fyzická osoba") {
      normalizedType = "Fyzická osoba";
    } else if (clientType === "Právnická osoba") {
      normalizedType = "Právnická osoba";
    } else {
      // pokud přijde cokoliv jiného (třeba "PERSONAL"), taky ho přemapujeme
      // ať se nám do DB nestrká anglické slovo
      normalizedType = "Fyzická osoba";
    }

    // 3) unikátní login?
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

    // 4) vytvoříme klienta (pozor: ukládáme normalizedType)
    const [clientRes] = await conn.query(
      `INSERT INTO client (FullName, BirthDate, PassportNumber, address, phone, ClientType)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        fullName,
        birthDate, // YYYY-MM-DD
        passportNumber,
        address || null,
        phone || null,
        normalizedType,   // <<< TADY JE TEN ROZDÍL
      ]
    );
    const clientId = clientRes.insertId;

    // 5) vytvoříme bankovní účet
    await conn.query(
      `INSERT INTO bank_account (ClientID, login, password, role)
       VALUES (?, ?, ?, 'ROLE_USER')`,
      [clientId, login, hash]
    );

    await conn.commit();
    return res.status(201).json({ ok: true, clientId });
  } catch (err) {
    await (conn?.rollback?.().catch(() => {}));
    console.error("Register error:", err);
    return res.status(500).json({
      error:
        err?.sqlMessage || err?.message || "Server error při registraci",
    });
  } finally {
    conn?.release?.();
  }
});

/**
 * POST /api/auth/login
 * Zkontroluje přihlašovací údaje a vrátí info o uživateli.
 */
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

export default router;
