import express from "express";
import cors from "cors"; // Diperbaiki dari 'core'
import dotenv from "dotenv";
import db from "./db.js"; // Diperbaiki path

import ProductRoute from "./routes/ProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import ManagerRoute from "./routes/ManagerRoute.js";

dotenv.config();

const app = express();
const PORT = process.env.APP_PORT || 5000; // Diperbaiki dari 'POST'

// Middleware
app.use(cors()); // Diperbaiki dari 'cons()'
app.use(express.json());

// Koneksi Database
db.connect((err) => {
  if (err) {
    console.error("❌ Gagal koneksi ke database:", err.message);
  } else {
    console.log("✅ Terkoneksi ke database MySQL");
  }
});

// Routes dengan prefix /api
app.use("/api", ProductRoute);
app.use("/api", AuthRoute);
app.use("/api", ManagerRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});