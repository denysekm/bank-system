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

export default router;
