import db from "../db.js";

// GET semua inventory dengan lokasi
export const getInventory = (req, res) => {
  const sql = `SELECT inventories.*, locations.nama AS lokasi, locations.alamat 
              FROM inventories 
              LEFT JOIN locations ON inventories.id_lokasi = locations.id 
              ORDER BY inventories.id DESC`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error getting inventory:", err);
      return res.status(500).json({ message: "Gagal mengambil data inventory", error: err });
    }
    res.json(result);
  });
};

// GET inventory by ID
export const getInventoryById = (req, res) => {
  const id = req.params.id;
  const sql = `SELECT inventories.*, locations.nama AS lokasi, locations.alamat 
              FROM inventories 
              LEFT JOIN locations ON inventories.id_lokasi = locations.id 
              WHERE inventories.id = ?`;
  
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error getting inventory by ID:", err);
      return res.status(500).json({ message: "Gagal mengambil produk" });
    }
    if (result.length === 0) return res.status(404).json({ message: "Produk tidak ditemukan" });
    res.json(result[0]);
  });
};

// CREATE inventory
export const createInventory = (req, res) => {
  const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;

  // Validasi input
  if (!namaProduk || !kategori || !stok || !satuan || !id_lokasi) {
    return res.status(400).json({ 
      message: "Semua field wajib diisi",
      required: ["namaProduk", "kategori", "stok", "satuan", "id_lokasi"]
    });
  }

  // Cek apakah lokasi exists
  const checkLocationSql = "SELECT id FROM locations WHERE id = ?";
  db.query(checkLocationSql, [id_lokasi], (err, locationResult) => {
    if (err) {
      console.error("Error checking location:", err);
      return res.status(500).json({ message: "Gagal validasi lokasi", error: err });
    }

    if (locationResult.length === 0) {
      return res.status(400).json({ 
        message: "ID Lokasi tidak valid", 
        availableLocations: "Silahkan pilih lokasi yang tersedia" 
      });
    }

    // Insert inventory
    const sql = `INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi) VALUES (?, ?, ?, ?, ?, ?)`;
    const values = [namaProduk, kategori, parseInt(stok), satuan, status || "ACTIVE", parseInt(id_lokasi)];

    db.query(sql, values, (err, result) => {
      if (err) {
        console.error("Error creating inventory:", err);
        return res.status(500).json({ message: "Gagal menambahkan produk", error: err });
      }
      res.status(201).json({ 
        message: "Produk berhasil ditambahkan", 
        id: result.insertId,
        data: {
          id: result.insertId,
          namaProduk,
          kategori,
          stok: parseInt(stok),
          satuan,
          status: status || "ACTIVE",
          id_lokasi: parseInt(id_lokasi)
        }
      });
    });
  });
};

// UPDATE inventory
export const updateInventory = (req, res) => {
  const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body;
  const id = req.params.id;

  // Validasi input
  if (!namaProduk || !kategori || !stok || !satuan || !id_lokasi) {
    return res.status(400).json({ 
      message: "Semua field wajib diisi" 
    });
  }

  // Cek apakah lokasi exists
  const checkLocationSql = "SELECT id FROM locations WHERE id = ?";
  db.query(checkLocationSql, [id_lokasi], (err, locationResult) => {
    if (err) {
      console.error("Error checking location:", err);
      return res.status(500).json({ message: "Gagal validasi lokasi", error: err });
    }

    if (locationResult.length === 0) {
      return res.status(400).json({ 
        message: "ID Lokasi tidak valid" 
      });
    }

    const sql = `UPDATE inventories SET namaProduk = ?, kategori = ?, stok = ?, satuan = ?, status = ?, id_lokasi = ? WHERE id = ?`;
    const values = [namaProduk, kategori, parseInt(stok), satuan, status, parseInt(id_lokasi), parseInt(id)];

    db.query(sql, values, (err) => {
      if (err) {
        console.error("Error updating inventory:", err);
        return res.status(500).json({ message: "Gagal mengupdate produk", error: err });
      }
      res.json({ message: "Produk berhasil diupdate" });
    });
  });
};

// DELETE inventory
export const deleteInventory = (req, res) => {
  const id = req.params.id;
  
  db.query("DELETE FROM inventories WHERE id = ?", [parseInt(id)], (err) => {
    if (err) {
      console.error("Error deleting inventory:", err);
      return res.status(500).json({ message: "Gagal menghapus produk", error: err });
    }
    res.json({ message: "Produk berhasil dihapus" });
  });
};

// GET semua locations untuk dropdown
export const getLocations = (req, res) => {
  const sql = "SELECT * FROM locations ORDER BY nama ASC";
  
  db.query(sql, (err, result) => {
    if (err) {
      console.error("Error getting locations:", err);
      return res.status(500).json({ message: "Gagal mengambil data lokasi", error: err });
    }
    res.json(result);
  });
};