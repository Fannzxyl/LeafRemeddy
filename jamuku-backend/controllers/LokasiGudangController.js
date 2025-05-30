// backend/controllers/LokasiGudangController.js
import db from "../db.js";

export const getLocations = (req, res) => {
    const sql = "SELECT * FROM locations ORDER BY id DESC";
    db.query(sql, (err, results) => {
        if (err) {
            console.error("Error fetching locations:", err);
            return res.status(500).json({ message: "Gagal mengambil data lokasi" });
        }
        res.json(results);
    });
};

export const createLocation = (req, res) => {
    const { nama, alamat } = req.body;
    // Basic validation
    if (!nama || !alamat) {
        return res.status(400).json({ message: "Nama dan Alamat lokasi wajib diisi." });
    }

    const sql = "INSERT INTO locations (nama, alamat) VALUES (?, ?)";
    db.query(sql, [nama, alamat], (err, result) => {
        if (err) {
            console.error("Error creating location:", err);
            return res.status(500).json({ message: "Gagal menambahkan lokasi" });
        }
        res.status(201).json({ message: "Lokasi berhasil ditambahkan", id: result.insertId });
    });
};

export const updateLocation = (req, res) => {
    const { id } = req.params;
    const { nama, alamat } = req.body;
    // Basic validation
    if (!nama || !alamat) {
        return res.status(400).json({ message: "Nama dan Alamat lokasi wajib diisi." });
    }

    const sql = "UPDATE locations SET nama = ?, alamat = ? WHERE id = ?";
    db.query(sql, [nama, alamat, id], (err, result) => {
        if (err) {
            console.error("Error updating location:", err);
            return res.status(500).json({ message: "Gagal mengupdate lokasi" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }
        res.json({ message: "Lokasi berhasil diupdate" });
    });
};

export const deleteLocation = (req, res) => {
    const { id } = req.params;
    const sql = "DELETE FROM locations WHERE id = ?";
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error("Error deleting location:", err);
            // Tambahkan penanganan untuk foreign key constraint jika lokasi digunakan
            if (err.code === 'ER_ROW_IS_REFERENCED_2') {
                return res.status(400).json({ message: "Gagal menghapus lokasi karena sedang digunakan oleh inventaris atau data lain." });
            }
            return res.status(500).json({ message: "Gagal menghapus lokasi" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }
        res.json({ message: "Lokasi berhasil dihapus" });
    });
};