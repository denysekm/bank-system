const express = require("express");
const cors = require("cors");


const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Testovací route
app.get("/", (req, res) => {
  res.send("✅ Server běží správně!");
});

// Spuštění serveru
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server běží na portu ${PORT}`));
