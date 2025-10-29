import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "bank_app",   // uprav podle .env
  password: process.env.DB_PASSWORD || "1234",
  database: process.env.DB_NAME || "bank",   // UJISTI SE, že tahle DB existuje
  waitForConnections: true,
  connectionLimit: 10,
});

export async function ping() {
  const c = await pool.getConnection();
  try { await c.ping(); } finally { c.release(); }
}
