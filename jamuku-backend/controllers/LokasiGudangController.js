// backend/controllers/LokasiGudangController.js
import db from "../db.js"; // db sekarang adalah instance pool yang berbasis Promise

// Fungsi untuk mendapatkan semua lokasi gudang
export const getLocations = async (req, res) => {
    try {
        const sql = "SELECT id, nama, alamat FROM locations ORDER BY id DESC"; // Tidak perlu alias 'name' atau 'address' di sini jika frontend tidak membutuhkannya
        // Menggunakan await db.query()
        const [results] = await db.query(sql);
        res.json(results);
    } catch (err) {
        console.error("Error fetching locations (from LokasiGudangController):", err);
        res.status(500).json({ message: "Gagal mengambil data lokasi", error: err.message });
    }
};

// Fungsi untuk membuat lokasi baru
export const createLocation = async (req, res) => {
    try {
        const { nama, alamat } = req.body;
        // Basic validation
        if (!nama || !alamat) {
            return res.status(400).json({ message: "Nama dan Alamat lokasi wajib diisi." });
        }

        const sql = "INSERT INTO locations (nama, alamat) VALUES (?, ?)";
        // Menggunakan await db.query()
        const [result] = await db.query(sql, [nama, alamat]);
        res.status(201).json({ message: "Lokasi berhasil ditambahkan", id: result.insertId });
    } catch (err) {
        console.error("Error creating location:", err);
        res.status(500).json({ message: "Gagal menambahkan lokasi", error: err.message });
    }
};

// Fungsi untuk memperbarui lokasi
export const updateLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, alamat } = req.body;
        // Basic validation
        if (!nama || !alamat) {
            return res.status(400).json({ message: "Nama dan Alamat lokasi wajib diisi." });
        }

        const sql = "UPDATE locations SET nama = ?, alamat = ? WHERE id = ?";
        // Menggunakan await db.query()
        const [result] = await db.query(sql, [nama, alamat, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan atau tidak ada perubahan" });
        }
        res.json({ message: "Lokasi berhasil diupdate" });
    } catch (err) {
        console.error("Error updating location:", err);
        res.status(500).json({ message: "Gagal mengupdate lokasi", error: err.message });
    }
};

// Fungsi untuk menghapus lokasi
export const deleteLocation = async (req, res) => {
    try {
        const { id } = req.params;
        const sql = "DELETE FROM locations WHERE id = ?";
        // Menggunakan await db.query()
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Lokasi tidak ditemukan" });
        }
        res.json({ message: "Lokasi berhasil dihapus" });
    } catch (err) {
        console.error("Error deleting location:", err);
        // Tambahkan penanganan untuk foreign key constraint jika lokasi digunakan
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ message: "Gagal menghapus lokasi karena sedang digunakan oleh inventaris atau data lain." });
        }
        res.status(500).json({ message: "Gagal menghapus lokasi", error: err.message });
    }
};