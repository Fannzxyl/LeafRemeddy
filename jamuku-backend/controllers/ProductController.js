import db from '../db.js';

// GET all products
export const getProducts = (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) return res.status(500).json({ msg: err.message });
    res.status(200).json(results);
  });
};

// GET product by ID
export const getProductById = (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM products WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ msg: err.message });
    if (results.length === 0) return res.status(404).json({ msg: 'Produk tidak ditemukan' });
    res.status(200).json(results[0]);
  });
};

// CREATE product
export const createProduct = (req, res) => {
  const { name, price } = req.body;
  db.query('INSERT INTO products (name, price) VALUES (?, ?)', [name, price], (err, result) => {
    if (err) return res.status(400).json({ msg: err.message });
    res.status(201).json({ msg: 'Produk berhasil ditambahkan', id: result.insertId });
  });
};

// UPDATE product
export const updateProduct = (req, res) => {
  const { name, price } = req.body;
  const id = req.params.id;
  db.query(
    'UPDATE products SET name = ?, price = ? WHERE id = ?',
    [name, price, id],
    (err, result) => {
      if (err) return res.status(400).json({ msg: err.message });
      res.status(200).json({ msg: 'Produk berhasil diperbarui' });
    }
  );
};

// DELETE product
export const deleteProduct = (req, res) => {
  const id = req.params.id;
  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(400).json({ msg: err.message });
    res.status(200).json({ msg: 'Produk berhasil dihapus' });
  });
};