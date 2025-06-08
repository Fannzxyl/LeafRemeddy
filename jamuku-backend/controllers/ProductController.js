// controllers/ProductController.js
const db = require('../db');

// CREATE Product
exports.createProduct = async (req, res) => {
  try {
    const { namaProduk, kategori, harga, stok, deskripsi, lokasi_gudang_id } = req.body;
    
    const query = `
      INSERT INTO inventories (namaProduk, kategori, harga, stok, deskripsi, lokasi_gudang_id, status, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NOW(), NOW())
    `;
    
    const [result] = await db.execute(query, [
      namaProduk, 
      kategori, 
      harga, 
      stok, 
      deskripsi, 
      lokasi_gudang_id
    ]);

    res.status(201).json({
      message: 'Product created successfully',
      productId: result.insertId,
      status: 'ACTIVE'
    });

  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
};

// UPDATE Product Status
exports.updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'INACTIVE'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be ACTIVE or INACTIVE' });
    }

    const query = `UPDATE inventories SET status = ?, updated_at = NOW() WHERE id = ?`;
    await db.execute(query, [status, id]);

    res.json({ message: 'Product status updated successfully', status });
  } catch (error) {
    console.error('Error updating product status:', error);
    res.status(500).json({ error: 'Failed to update product status' });
  }
};