import { pool } from "./db.js";

async function migrate() {
    console.log("Starting migration...");
    const conn = await pool.getConnection();

    try {
        // 1. Check if columns exist
        const [columns] = await conn.query("SHOW COLUMNS FROM bank_account");
        const columnNames = columns.map(c => c.Field);

        if (!columnNames.includes("AccountNumber")) {
            console.log("Adding AccountNumber column...");
            await conn.query("ALTER TABLE bank_account ADD COLUMN AccountNumber VARCHAR(15) UNIQUE");
        }

        if (!columnNames.includes("Balance")) {
            console.log("Adding Balance column...");
            await conn.query("ALTER TABLE bank_account ADD COLUMN Balance DECIMAL(15, 2) DEFAULT 0.00");
        }

        if (!columnNames.includes("LastUsernameChange")) {
            console.log("Adding LastUsernameChange column...");
            await conn.query("ALTER TABLE bank_account ADD COLUMN LastUsernameChange DATETIME DEFAULT NULL");
        }


        // 2. Generate AccountNumbers for existing accounts and migrate balances
        console.log("Migrating existing data...");
        const [accounts] = await conn.query("SELECT ID, AccountNumber FROM bank_account");

        for (const acc of accounts) {
            if (acc.AccountNumber) continue; // Skip if already has one

            const accNum = "2000" + Math.floor(100000 + Math.random() * 900000);

            // Calculate total balance from cards
            const [cards] = await conn.query("SELECT SUM(Balance) as total FROM bank_card WHERE BankAccountID = ?", [acc.ID]);
            const initialBalance = cards[0]?.total || 0;

            console.log(`Setting AccountNumber ${accNum} and Balance ${initialBalance} for account ID ${acc.ID}`);
            await conn.query(
                "UPDATE bank_account SET AccountNumber = ?, Balance = ? WHERE ID = ?",
                [accNum, initialBalance, acc.ID]
            );
        }

        console.log("Migration finished successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        conn.release();
        process.exit();
    }
}

migrate();
