// controllers/ProductController.js
import db from "../db.js";

export const getProducts = (req, res) => {
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ message: "Gagal mengambil produk" });
    res.json(results);
  });
};

export const createProduct = (req, res) => {
  const { name, price } = req.body;
  db.query("INSERT INTO products (name, price) VALUES (?, ?)", [name, price], (err, result) => {
    if (err) return res.status(500).json({ message: "Gagal menambah produk" });
    res.status(201).json({ message: "Produk berhasil ditambahkan", id: result.insertId });
  });
};