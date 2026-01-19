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
 * Smaže klienta + všechny jeho účty + všechny navázané (child) účty rekurzivně
 * + související data (karty, transakce, kredity, pozvánky)
 *
 * DB (dle Dump20260111.sql):
 * - bank_account.ParentAccountID -> bank_account.ID
 * - bank_card.BankAccountID -> bank_account.ID
 * - payment_transaction.BankAccountID -> bank_account.ID
 * - child_invitation.ParentAccountID -> bank_account.ID
 * - credit.ClientID -> client.ID, credit.BankAccountID -> bank_account.ID
 */
router.delete("/users/:clientId", async (req, res) => {
  const clientId = Number(req.params.clientId);
  if (!Number.isInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ error: "Neplatné clientId" });
  }

  const conn = await pool.getConnection();

  // malý helper: vyrobíme unikátní pole
  const uniq = (arr) => [...new Set(arr)];

  try {
    await conn.beginTransaction();

    // 1) Najdi všechny parent účty tohoto klienta
    const [parentAccRows] = await conn.query(
      "SELECT ID FROM bank_account WHERE ClientID = ?",
      [clientId]
    );
    const parentAccountIds = parentAccRows.map((r) => r.ID);

    if (parentAccountIds.length === 0) {
      // klient existuje? když ne, smaž client stejně (nebo vrať 404)
      const [clientRows] = await conn.query(
        "SELECT ID FROM client WHERE ID = ?",
        [clientId]
      );
      if (clientRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: "Uživatel nenalezen" });
      }

      // klient bez účtů -> smažeme jen klienta
      await conn.query("DELETE FROM client WHERE ID = ?", [clientId]);
      await conn.commit();
      return res.json({ ok: true, deletedClientOnly: true });
    }

    // 2) Rekurzivně najdi všechny child účty (i více úrovní)
    //    a zároveň si uložíme "depth", abychom účty mazali od nejhlubších.
    const accountDepth = new Map(); // accountId -> depth
    const allAccountIds = [];
    const queue = [];

    for (const id of parentAccountIds) {
      accountDepth.set(id, 0);
      allAccountIds.push(id);
      queue.push(id);
    }

    while (queue.length > 0) {
      const currentParentId = queue.shift();
      const parentDepth = accountDepth.get(currentParentId) ?? 0;

      const [childRows] = await conn.query(
        "SELECT ID FROM bank_account WHERE ParentAccountID = ?",
        [currentParentId]
      );

      for (const row of childRows) {
        const childId = row.ID;
        if (!accountDepth.has(childId)) {
          accountDepth.set(childId, parentDepth + 1);
          allAccountIds.push(childId);
          queue.push(childId);
        }
      }
    }

    const accountIds = uniq(allAccountIds);

    // 3) Z účtů zjisti všechny klienty, kterým tyto účty patří (parent i child klienti)
    const [clientIdRows] = await conn.query(
      "SELECT DISTINCT ClientID FROM bank_account WHERE ID IN (?)",
      [accountIds]
    );
    const clientIdsToDelete = uniq([
      clientId,
      ...clientIdRows.map((r) => r.ClientID),
    ]);

    // 4) Smaž závislá data (nejdřív tabulky co odkazují na bank_account / client)

    // Transakce (navázané na účty)
    await conn.query(
      "DELETE FROM payment_transaction WHERE BankAccountID IN (?)",
      [accountIds]
    );

    // Karty (navázané na účty)
    await conn.query("DELETE FROM bank_card WHERE BankAccountID IN (?)", [
      accountIds,
    ]);

    // Pozvánky na dětské účty (navázané na ParentAccountID = účet)
    await conn.query("DELETE FROM child_invitation WHERE ParentAccountID IN (?)", [
      accountIds,
    ]);

    // Kredity (mají FK na client i bank_account -> smažeme podle obou)
    await conn.query(
      "DELETE FROM credit WHERE BankAccountID IN (?) OR ClientID IN (?)",
      [accountIds, clientIdsToDelete]
    );

    // 5) Smaž účty od nejhlubších (child před parent) kvůli self-FK ParentAccountID
    const accountIdsSorted = [...accountIds].sort((a, b) => {
      const da = accountDepth.get(a) ?? 0;
      const db = accountDepth.get(b) ?? 0;
      return db - da; // větší depth první
    });

    // můžeme mazat po jednom (jednoduché a bezpečné)
    for (const accId of accountIdsSorted) {
      await conn.query("DELETE FROM bank_account WHERE ID = ?", [accId]);
    }

    // 6) Smaž klienty (parent i child), kterým jsme smazali účty
    //    (pokud by některý klient měl ještě jiné účty mimo tento strom, tak ho nemažeme)
    const [stillHasAccounts] = await conn.query(
      "SELECT DISTINCT ClientID FROM bank_account WHERE ClientID IN (?)",
      [clientIdsToDelete]
    );
    const clientsWithRemainingAccounts = new Set(
      stillHasAccounts.map((r) => r.ClientID)
    );
    const finalClientIds = clientIdsToDelete.filter(
      (id) => !clientsWithRemainingAccounts.has(id)
    );

    if (finalClientIds.length > 0) {
      await conn.query("DELETE FROM client WHERE ID IN (?)", [finalClientIds]);
    }

    await conn.commit();

    res.json({
      ok: true,
      deleted: {
        accounts: accountIdsSorted.length,
        clients: finalClientIds.length,
      },
    });
  } catch (e) {
    await conn.rollback();
    console.error("DELETE /admin/users/:clientId error:", e);
    res.status(500).json({ error: "Server error" });
  } finally {
    conn.release();
  }
});

export default router;
