import express from "express";
import db from "../db.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Ambil semua user (hanya untuk MANAGER)
router.get("/users", verifyToken, authorizeRoles("MANAGER"), (req, res) => {
  db.query("SELECT id, username, role FROM users", (err, results) => {
    if (err) return res.status(500).json({ message: "Gagal mengambil data user" });
    res.json(results);
  });
});

export default router;
