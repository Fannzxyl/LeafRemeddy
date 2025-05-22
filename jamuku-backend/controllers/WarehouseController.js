import db from "../db.js";

// GET all warehouses
export const getAllWarehouses = (req, res) => {
  db.query("SELECT * FROM warehouses", (err, results) => {
    if (err) return res.status(500).json({ message: "Gagal mengambil data", error: err });
    res.json(results);
  });
};

// POST new warehouse
export const createWarehouse = (req, res) => {
  const { nama, alamat } = req.body;
  if (!nama || !alamat) {
    return res.status(400).json({ message: "Nama dan alamat wajib diisi" });
  }
  db.query(
    "INSERT INTO warehouses (nama, alamat) VALUES (?, ?)",
    [nama, alamat],
    (err) => {
      if (err) return res.status(500).json({ message: "Gagal menambahkan", error: err });
      res.status(201).json({ message: "Lokasi gudang berhasil ditambahkan" });
    }
  );
};

// PUT update warehouse
export const updateWarehouse = (req, res) => {
  const { id } = req.params;
  const { nama, alamat } = req.body;

  db.query(
    "UPDATE warehouses SET nama = ?, alamat = ? WHERE id = ?",
    [nama, alamat, id],
    (err) => {
      if (err) return res.status(500).json({ message: "Gagal mengubah", error: err });
      res.json({ message: "Lokasi gudang berhasil diupdate" });
    }
  );
};

// DELETE warehouse
export const deleteWarehouse = (req, res) => {
  const { id } = req.params;

  db.query("DELETE FROM warehouses WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Gagal menghapus", error: err });
    res.json({ message: "Lokasi gudang berhasil dihapus" });
  });
};
