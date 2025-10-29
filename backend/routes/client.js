import { Router } from "express";
import { pool } from "../db.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

// GET /api/client/me
router.get("/me", requireAuth, async (req, res) => {
  try {
    // req.user.clientId = ID v tabulce client
    const clientId = req.user.clientId;

    // 1) vytáhneme údaje o klientovi z tabulky client
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

    // 2) spočítáme celkový zůstatek na všech jeho kartách
    const [sumRows] = await pool.query(
      `SELECT COALESCE(SUM(Balance), 0) AS totalBalance
       FROM bank_card
       WHERE BankAccountID = ?`,
      [req.user.id] // bank_account.ID
    );

    const totalBalance = sumRows[0].totalBalance || 0;

    // 3) pošleme frontend friendly JSON
    res.json({
      fullName: c.FullName,
      birthDate: c.BirthDate,
      passportNumber: c.PassportNumber,
      address: c.address,
      phone: c.phone,
      clientType: c.ClientType,
      totalBalance: Number(totalBalance).toFixed(2),
      login: req.user.login,
    });
  } catch (err) {
    console.error("GET /api/client/me error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
