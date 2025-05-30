// backend/routes/LokasiGudangRoute.js
import express from "express";
import { verifyToken, verifyUser, verifyManager } from "../middleware/authMiddleware.js"; // Import middleware otorisasi

const router = express.Router();

// Asumsi Anda memiliki controller untuk Lokasi Gudang
// Jika belum ada, Anda perlu membuat file controllers/LokasiGudangController.js
// dengan fungsi-fungsi berikut (contoh struktur):
/*
// controllers/LokasiGudangController.js
import db from "../db.js";

export const getLocations = (req, res) => {
    const sql = "SELECT * FROM locations";
    db.query(sql, (err, results) => {
        if (err) { console.error(err); return res.status(500).json({ message: "Gagal mengambil lokasi" }); }
        res.json(results);
    });
};

export const createLocation = (req, res) => {
    const { nama, alamat } = req.body;
    const sql = "INSERT INTO locations (nama, alamat) VALUES (?, ?)";
    db.query(sql, [nama, alamat], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: "Gagal menambah lokasi" }); }
        res.status(201).json({ message: "Lokasi berhasil ditambahkan", id: result.insertId });
    });
};

export const updateLocation = (req, res) => {
    const { id } = req.params;
    const { nama, alamat } = req.body;
    const sql = "UPDATE locations SET nama = ?, alamat = ? WHERE id = ?";
    db.query(sql, [nama, alamat, id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: "Gagal mengupdate lokasi" }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        res.json({ message: "Lokasi berhasil diupdate" });
    });
};

export const deleteLocation = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM locations WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) { console.error(err); return res.status(500).json({ message: "Gagal menghapus lokasi" }); }
        if (result.affectedRows === 0) return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        res.json({ message: "Lokasi berhasil dihapus" });
    });
};
*/
// Import fungsi controller Lokasi Gudang
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../controllers/LokasiGudangController.js"; // Pastikan Anda memiliki file ini

// GET semua lokasi (Bisa diakses oleh STAZ & MANAGER)
router.get("/locations", verifyToken, verifyUser, getLocations);

// POST tambah lokasi (Hanya MANAGER)
router.post("/locations", verifyToken, verifyManager, createLocation);

// PUT update lokasi (Hanya MANAGER)
router.put("/locations/:id", verifyToken, verifyManager, updateLocation);

// DELETE lokasi (Hanya MANAGER)
router.delete("/locations/:id", verifyToken, verifyManager, deleteLocation);

export default router;