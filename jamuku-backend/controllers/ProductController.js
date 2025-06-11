// controllers/ProductController.js
const db = require('../db'); // Ini berfungsi untuk mengimpor koneksi database pool yang berbasis Promise.

// Ini berfungsi untuk membuat item produk baru dalam inventaris.
exports.createProduct = async (req, res) => {
    try {
        // Ini berfungsi untuk mendapatkan detail produk dari body request.
        // Catatan: 'harga' dan 'deskripsi' tidak ada di tabel 'inventories' Anda.
        // Jika Anda masih menerimanya dari frontend, pastikan tidak digunakan di query ini.
        const { namaProduk, kategori, stok, satuan, status, id_lokasi } = req.body; // Menggunakan namaProduk, id_lokasi sesuai skema DB

        // Ini berfungsi untuk membuat query SQL untuk menyisipkan data produk baru.
        // Status diatur ke 'active' dan timestamp otomatis diisi (jika kolom ada).
        // Saya asumsikan created_at dan updated_at ada di DB Anda meskipun tidak di screenshot inventories.
        const query = `
            INSERT INTO inventories (namaProduk, kategori, stok, satuan, status, id_lokasi, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;
        
        // Ini berfungsi untuk mengeksekusi query sisipan data produk.
        const [result] = await db.execute(query, [
            namaProduk, 
            kategori, 
            stok, 
            satuan, 
            status || 'active', // Menggunakan 'active' sebagai default
            id_lokasi 
        ]);

        // Ini berfungsi untuk mengirim respons sukses setelah produk berhasil dibuat.
        res.status(201).json({
            message: 'Product created successfully',
            productId: result.insertId,
            status: 'active'
        });

    } catch (error) {
        // Ini berfungsi untuk menangani error jika gagal membuat produk.
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
};

// Ini berfungsi untuk memperbarui status item produk (misalnya, menjadi 'active' atau 'inactive').
exports.updateProductStatus = async (req, res) => {
    try {
        // Ini berfungsi untuk mendapatkan ID produk dari parameter URL dan status baru dari body request.
        const { id } = req.params;
        const { status } = req.body;

        // Ini berfungsi untuk memvalidasi status yang diberikan.
        if (!['active', 'inactive'].includes(status.toLowerCase())) {
          return res.status(400).json({ error: 'Invalid status. Must be active or inactive' });
        }

        // Ini berfungsi untuk membuat query SQL untuk memperbarui status produk.
        // Saya asumsikan updated_at ada di DB Anda meskipun tidak di screenshot inventories.
        const query = `UPDATE inventories SET status = ?, updated_at = NOW() WHERE id = ?`;
        await db.execute(query, [status.toLowerCase(), id]);

        // Ini berfungsi untuk mengirim respons sukses setelah status produk berhasil diperbarui.
        res.json({ message: 'Product status updated successfully', status: status.toLowerCase() });
    } catch (error) {
        // Ini berfungsi untuk menangani error jika gagal memperbarui status produk.
        console.error('Error updating product status:', error);
        res.status(500).json({ error: 'Failed to update product status' });
    }
};