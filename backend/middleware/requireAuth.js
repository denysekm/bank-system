import { pool } from "../db.js";
import bcrypt from "bcryptjs";

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    // header by měl být "Basic base64(login:password)"
    if (!header.startsWith("Basic ")) {
      return res.status(401).json({ error: "Chybí autorizace" });
    }

    const base64part = header.slice("Basic ".length);
    const decoded = Buffer.from(base64part, "base64").toString("utf8"); // "login:password"

    const [login, plainPass] = decoded.split(":");
    if (!login || !plainPass) {
      return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
    }

    // najdeme účet
    const [rows] = await pool.query(
      "SELECT ID, ClientID, login, password, role FROM bank_account WHERE login = ? LIMIT 1",
      [login]
    );

    const acc = rows[0];
    if (!acc) {
      return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
    }

    const ok = await bcrypt.compare(plainPass, acc.password);
    if (!ok) {
      return res.status(401).json({ error: "Neplatné přihlašovací údaje" });
    }

    // uložíme info o userovi do requestu → ostatní routy to pak použijí
    req.user = {
      id: acc.ID,            // bank_account.ID
      clientId: acc.ClientID, // client.ID
      login: acc.login,
      role: acc.role,
    };

    next();
  } catch (err) {
    console.error("Auth chyba:", err);
    return res.status(500).json({ error: "Server auth error" });
  }
}
