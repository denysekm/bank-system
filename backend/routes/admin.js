import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

/**
 * GET /api/admin/users
 * Vrátí seznam uživatelů (client + bank_account) pro tabulku
 */
router.get("/users", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT
        c.ID              AS clientId,
        c.FullName        AS fullName,
        c.BirthDate       AS birthDate,
        c.PassportNumber  AS passportNumber,
        ba.ID             AS accountId,
        ba.login          AS login,
        ba.role           AS role
      FROM client c
      JOIN bank_account ba ON ba.ClientID = c.ID
      WHERE ba.role <> 'ROLE_ADMIN'
      ORDER BY c.ID DESC
    `);

    res.json({ users: rows });
  } catch (e) {
    console.error("GET /admin/users error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * DELETE /api/admin/users/:clientId
 * Smaže uživatele + navázaná data
 */
router.delete("/users/:clientId", async (req, res) => {
  const clientId = Number(req.params.clientId);
  if (!clientId) return res.status(400).json({ error: "Neplatné clientId" });

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Najdi bankovní účty uživatele (může jich být víc)
    const [accRows] = await conn.query(
      "SELECT ID FROM bank_account WHERE ClientID = ?",
      [clientId]
    );
    const accountIds = accRows.map(r => r.ID);

    // Smazat child klienty (pokud existují) + jejich účty
    // (v tvém projektu se používá ParentAccountID)
    // 1) najdi dětské účty
    const childAccountIds = [];
    for (const accId of accountIds) {
      const [childAcc] = await conn.query(
        "SELECT ID, ClientID FROM bank_account WHERE ParentAccountID = ?",
        [accId]
      );
      for (const r of childAcc) childAccountIds.push(r.ID);

      // smaž child klienty (pokud se používá client.ParentClientID, přidej i to – dle DB)
      // tady jedeme přes účty: smažeme navázané věci na childAcc a pak bank_account + client
      for (const r of childAcc) {
        await conn.query("DELETE FROM child_invitation WHERE ChildID = ?", [r.ClientID]);
        await conn.query("DELETE FROM payment_transaction WHERE ClientID = ?", [r.ClientID]);
        await conn.query("DELETE FROM credit WHERE ClientID = ?", [r.ClientID]);
        await conn.query("DELETE FROM bank_card WHERE AccountID = ?", [r.ID]);
        await conn.query("DELETE FROM bank_account WHERE ID = ?", [r.ID]);
        await conn.query("DELETE FROM client WHERE ID = ?", [r.ClientID]);
      }
    }

    // Smazat navázaná data dospělého uživatele
    await conn.query("DELETE FROM child_invitation WHERE ParentID = ?", [clientId]);
    await conn.query("DELETE FROM payment_transaction WHERE ClientID = ?", [clientId]);
    await conn.query("DELETE FROM credit WHERE ClientID = ?", [clientId]);

    // Karty patří na bank_account
    for (const accId of accountIds) {
      await conn.query("DELETE FROM bank_card WHERE AccountID = ?", [accId]);
    }

    // Účty (nejdřív ty, co mají ParentAccountID)
    for (const childAccId of childAccountIds) {
      await conn.query("DELETE FROM bank_account WHERE ID = ?", [childAccId]);
    }
    for (const accId of accountIds) {
      await conn.query("DELETE FROM bank_account WHERE ID = ?", [accId]);
    }

    // Klient
    await conn.query("DELETE FROM client WHERE ID = ?", [clientId]);

    await conn.commit();
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback();
    console.error("DELETE /admin/users/:clientId error:", e);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
