import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { ping } from "./db.js";
import auth from "./routes/auth.js";
import client from "./routes/client.js";
import cards from "./routes/cards.js";
import transactions from "./routes/transactions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express(); // 🟢 musí být tady dřív než app.use()

/* 1) security + parsers */
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());

/* 2) rate limit */
app.use(rateLimit({ windowMs: 60_000, max: 100 }));

/* 3) health endpoint */
app.get("/api/health", async (_req, res) => {
  try {
    await ping();
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false });
  }
});

/* 4) API routy */
app.use("/api/auth", auth);
app.use("/api/client", client);
app.use("/api/cards", cards);
app.use("/api/transactions", transactions);

/* 5) start server */
const port = Number(process.env.PORT || 5000);
app.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server běží na http://0.0.0.0:${port}`);
});
