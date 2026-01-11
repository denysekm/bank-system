import bcrypt from "bcrypt";
import { pool } from "../db.js";

export async function ensureAdminExists() {
  const ADMIN_LOGIN = "admin";
  const ADMIN_PASS = "admin1234";

  const conn = await pool.getConnection();

  try {
    const [acc] = await conn.query(
      "SELECT ID, ClientID, role FROM bank_account WHERE login = ? LIMIT 1",
      [ADMIN_LOGIN]
    );

    if (acc.length > 0) {
      if (acc[0].role !== "ROLE_ADMIN") {
        await conn.query(
          "UPDATE bank_account SET role = 'ROLE_ADMIN' WHERE login = ?",
          [ADMIN_LOGIN]
        );
      }
      console.log("✅ Admin účet už existuje.");
      return;
    }

    await conn.beginTransaction();

    const [clientRes] = await conn.query(
        "INSERT INTO client (FullName, BirthDate, PassportNumber, ClientType) VALUES (?, ?, ?, ?)",
        ["Admin", "1990-01-01", "ADMIN-SEED", "ADULT"]
    );


    const clientId = clientRes.insertId;

    const hash = await bcrypt.hash(ADMIN_PASS, 10);

    await conn.query(
      "INSERT INTO bank_account (ClientID, login, password, role) VALUES (?, ?, ?, ?)",
      [clientId, ADMIN_LOGIN, hash, "ROLE_ADMIN"]
    );

    await conn.commit();
    console.log("✅ Admin účet byl vytvořen: admin / admin1234");
  } catch (e) {
    await conn.rollback();
    console.error("❌ ensureAdminExists error:", e);
  } finally {
    conn.release();
  }
}
