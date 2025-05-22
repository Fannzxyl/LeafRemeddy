import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./db.js";



// Import semua routes
import ProductRoute from "./routes/ProductRoute.js";
import AuthRoute from "./routes/AuthRoute.js";
import ManagerRoute from "./routes/ManagerRoute.js";
import TranscationRoute from "./routes/TransactionRoute.js";
import WarehouseRoute from "./routes/WarehouseRoute.js";

// Load .env config
dotenv.config();

// Inisialisasi express
const app = express();
const PORT = process.env.APP_PORT || 5000;

// Middleware global
app.use(cors()); // Izinkan cross-origin request
app.use(express.json()); // Parse JSON body
app.use("/api", WarehouseRoute);

// Tes koneksi database
db.connect((err) => {
  if (err) {
    console.error("❌ Gagal koneksi ke database:", err.message);
  } else {
    console.log("✅ Terkoneksi ke database MySQL");
  }
});

// Gunakan semua route dengan prefix /api
app.use("/api", ProductRoute);
app.use("/api", AuthRoute);
app.use("/api", ManagerRoute);
app.use("/api", TranscationRoute);

// Middleware penanganan error fallback
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("❌ Terjadi kesalahan di server.");
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});
