// controllers/TransactionController.js
import db from "../db.js"; // Ini berfungsi untuk mengimpor koneksi database pool yang berbasis Promise.

// Ini berfungsi untuk mengambil semua data transaksi dari database.
// Data transaksi diperkaya dengan informasi nama user dan lokasi terkait.
export const getTransactions = async (req, res) => {
    try {
        const query = `
            SELECT
                t.id, t.id_inventories AS product_id, t.jumlah, t.tipe, t.status, t.tanggal, t.transaction_type,
                t.namaProduk, t.requested_stok, t.id_lokasi,
                u.username AS created_by_name,
                a.username AS approved_by_name,
                l.nama AS lokasi_nama,
                l.alamat AS lokasi_alamat
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            LEFT JOIN users a ON t.approved_by = a.id
            LEFT JOIN locations l ON t.id_lokasi = l.id
            ORDER BY t.tanggal DESC, t.id DESC
        `;

        const [results] = await db.query(query); // Ini berfungsi untuk mengeksekusi query database.

        res.json(results); // Ini berfungsi untuk mengirimkan daftar transaksi sebagai respons JSON.
    } catch (err) {
        // Ini berfungsi untuk menangani kesalahan saat mengambil data transaksi.
        console.error("getTransactions: Error fetching transactions:", err);
        // Menambahkan penanganan error untuk req.user tidak terdefinisi (jika rute ini dilindungi)
        if (err instanceof TypeError && (err.message.includes("Cannot read properties of undefined (reading 'userId')") || err.message.includes("Cannot destructure property 'userRole'"))) {
            return res.status(401).json({ message: "Tidak terautentikasi atau sesi berakhir. Silakan login kembali.", error: err.message });
        }
        res.status(500).json({ message: "Gagal mengambil data transaksi. Silakan cek log server untuk detail.", error: err.message });
    }
};

// Ini berfungsi untuk membuat transaksi baru (stok masuk/keluar) atau permintaan penambahan produk.
export const createTransaction = async (req, res) => {
    // Mendapatkan detail transaksi dari body request.
    const { productId, jumlah, tipe, lokasiId } = req.body;
    // Mengekstrak ID user pembuat dan perannya dari token yang sudah didekode.
    const created_by = req.user.userId;
    const userRole = req.user.userRole;

    // Melakukan validasi input dasar.
    if (!productId || !jumlah || !tipe || !lokasiId) {
        return res.status(400).json({ message: "Semua field wajib diisi (Produk, Jumlah, Tipe, Lokasi)." });
    }
    if (jumlah <= 0) {
        return res.status(400).json({ message: "Jumlah harus lebih dari 0." });
    }
    if (!['masuk', 'keluar'].includes(tipe)) {
        return res.status(400).json({ message: "Tipe transaksi tidak valid (harus 'masuk' atau 'keluar')." });
    }

    let connection; // Mendeklarasikan variabel koneksi untuk transaksi.

    try {
        connection = await db.getConnection(); // Mendapatkan koneksi database dari pool.
        await connection.beginTransaction(); // Memulai transaksi database.

        // Mengambil detail produk dari tabel 'inventories'.
        const [productCheckRows] = await connection.execute(
            'SELECT id, namaProduk, stok, satuan, id_lokasi, kategori FROM inventories WHERE id = ?',
            [productId]
        );

        // Memeriksa apakah produk ditemukan.
        if (productCheckRows.length === 0) {
            await connection.rollback(); // Mengembalikan transaksi.
            connection.release(); // Melepaskan koneksi.
            return res.status(404).json({ message: "Produk tidak ditemukan." });
        }
        const product = productCheckRows[0];

        // Memeriksa konsistensi lokasi produk dengan lokasi transaksi yang diinput.
        if (product.id_lokasi !== lokasiId) {
             console.warn(`Produk ID ${productId} sebenarnya di lokasi ${product.id_lokasi}, tapi transaksi dicatat untuk lokasi ${lokasiId}.`);
        }

        let transactionStatus = 'pending'; // Status default untuk transaksi adalah 'pending'.
        let transactionType = 'normal_stock_change'; // Tipe transaksi default.

        // Menentukan status dan membarui stok jika Manager yang membuat transaksi.
        if (userRole === 'MANAGER') {
            transactionStatus = 'approved'; // Manager dapat langsung menyetujui transaksi.

            let newStock = product.stok;
            if (tipe === 'masuk') {
                newStock += jumlah;
            } else if (tipe === 'keluar') {
                newStock -= jumlah;
                // Memeriksa ketersediaan stok untuk transaksi keluar.
                if (newStock < 0) {
                    await connection.rollback(); // Mengembalikan transaksi jika stok tidak mencukupi.
                    connection.release(); // Melepaskan koneksi.
                    return res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar ini." });
                }
            }

            // Memperbarui stok di tabel 'inventories'.
            // HAPUS updated_at=NOW() jika tidak ada di tabel
            await connection.execute(
                'UPDATE inventories SET stok = ? WHERE id = ?',
                [newStock, productId]
            );

        } else {
            // Untuk staf (STAZ), transaksi selalu 'pending' untuk approval.
            transactionStatus = 'pending';
        }

        // Menyisipkan data transaksi ke tabel 'transactions'.
        const insertTransactionQuery = `
            INSERT INTO transactions (id_inventories, jumlah, tipe, status, tanggal, created_by, id_lokasi, transaction_type, namaProduk, kategori, satuan, requested_stok)
            VALUES (?, ?, ?, ?, CURDATE(), ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            productId,
            jumlah,
            tipe,
            transactionStatus,
            created_by,
            lokasiId,
            transactionType,
            product.namaProduk, // Menggunakan namaProduk dari product object
            product.kategori, // Menggunakan kategori dari product object
            product.satuan, // Menggunakan satuan dari product object
            jumlah // Ini adalah requested_stok
        ];

        const [insertResult] = await connection.execute(insertTransactionQuery, params); // Mengeksekusi query sisipan transaksi.

        await connection.commit(); // Mengkonfirmasi (commit) semua operasi dalam transaksi.

        // Mengambil username dari user yang membuat transaksi untuk respons.
        const [userResRows] = await db.execute('SELECT username FROM users WHERE id = ?', [created_by]);
        const created_by_name = userResRows[0]?.username || 'Unknown User';

        // Mengirim respons sukses setelah transaksi dicatat.
        res.status(201).json({
            message: `Transaksi berhasil dicatat dengan status: ${transactionStatus}.`,
            transaction: {
                id: insertResult.insertId,
                product_id: productId,
                jumlah: jumlah,
                tipe: tipe,
                status: transactionStatus,
                tanggal: new Date().toISOString().split('T')[0], // Mengirim tanggal hari ini
                created_by: created_by,
                lokasi_id: lokasiId,
                transaction_type: transactionType,
                namaProduk: product.namaProduk,
                kategori: product.kategori,
                satuan: product.satuan,
                requested_stok: jumlah,
                created_by_name: created_by_name
            },
            type: userRole === 'MANAGER' ? 'direct' : 'approval_needed' // Menandakan apakah langsung atau butuh approval
        });

    } catch (error) {
        // Menangani kesalahan selama transaksi.
        if (connection) {
            await connection.rollback(); // Mengembalikan transaksi jika terjadi error.
        }
        console.error('createTransaction: Error during transaction:', error.message);
        // Menambahkan penanganan error untuk req.user tidak terdefinisi
        if (error instanceof TypeError && (error.message.includes("Cannot read properties of undefined (reading 'userId')") || error.message.includes("Cannot destructure property 'userRole'"))) {
            return res.status(401).json({ message: "Tidak terautentikasi atau sesi berakhir. Silakan login kembali.", error: error.message });
        }
        res.status(500).json({ message: 'Server error saat mencatat transaksi.', error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Melepaskan koneksi database kembali ke pool.
        }
    }
};

// Ini berfungsi untuk menyetujui atau menolak (approve/reject) transaksi yang 'pending'.
export const approveTransaction = async (req, res) => {
    // Mendapatkan ID transaksi dari parameter URL dan aksi (approve/reject) dari body request.
    const { id } = req.params;
    const { action } = req.body;
    // Mengekstrak ID user yang menyetujui dan perannya (harus MANAGER).
    const approved_by = req.user.userId;
    const managerRole = req.user.userRole;

    // Memeriksa izin: hanya Manager yang dapat menyetujui/menolak transaksi.
    if (managerRole !== "MANAGER") {
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }

    let connection; // Mendeklarasikan variabel koneksi untuk transaksi.

    try {
        connection = await db.getConnection(); // Mendapatkan koneksi database.
        await connection.beginTransaction(); // Memulai transaksi.

        // Mengambil detail transaksi yang 'pending' dan stok produk terkait.
        const [transactionsRows] = await connection.execute(
            `SELECT t.*, inv.stok AS current_inventory_stok,
                    inv.status AS product_status,
                    inv.namaProduk, inv.kategori, inv.satuan, inv.id_lokasi
             FROM transactions t
             LEFT JOIN inventories inv ON t.id_inventories = inv.id
             WHERE t.id = ? AND t.status = 'pending'`,
            [id]
        );

        // Memeriksa apakah transaksi ditemukan dan berstatus 'pending'.
        if (transactionsRows.length === 0) {
            await connection.rollback(); // Mengembalikan transaksi.
            connection.release(); // Melepaskan koneksi.
            return res.status(404).json({ message: "Transaksi tidak ditemukan atau sudah diproses." });
        }

        const transaction = transactionsRows[0]; // Mendapatkan detail transaksi.

        // Memperbarui status transaksi menjadi 'approved' atau 'rejected'.
        const updateTransactionStatusQuery = `
            UPDATE transactions SET status = ?, approved_by = ?, approved_at = NOW() WHERE id = ?
        `;
        const newStatus = action === "approve" ? "approved" : "rejected"; // Menentukan status baru.

        await connection.execute(updateTransactionStatusQuery, [newStatus, approved_by, id]); // Mengeksekusi update status transaksi.

        // Melakukan aksi lanjutan berdasarkan hasil approval.
        if (action === "approve") {
            // Logika untuk persetujuan transaksi 'add_product'.
            if (transaction.transaction_type === "add_product") {
                // Mengaktifkan produk dan memperbarui stoknya.
                // HAPUS updated_at=NOW() jika tidak ada di tabel
                const activateProductQuery = `
                    UPDATE inventories SET status = 'active', stok = ?, id_lokasi = ?,
                                            namaProduk = ?, kategori = ?, satuan = ?
                    WHERE id = ?
                `;
                await connection.execute(activateProductQuery, [
                    transaction.requested_stok, // Stok yang diminta STAZ
                    transaction.id_lokasi, // Lokasi yang diminta STAZ (asumsi ini adalah id_lokasi dari transaksi)
                    transaction.namaProduk, // Nama produk dari transaksi
                    transaction.kategori, // Kategori dari transaksi
                    transaction.satuan, // Satuan dari transaksi
                    transaction.id_inventories // ID produk yang akan diupdate (nilai dari transaction.id_inventories harus sesuai dengan inventories.id)
                ]);
                await connection.commit();
                connection.release();
                res.json({ message: "Produk baru berhasil disetujui dan diaktifkan." });
            } else { // Menangani transaksi 'normal_stock_change'.
                let newStock = transaction.tipe === "masuk"
                    ? transaction.current_inventory_stok + transaction.jumlah
                    : transaction.current_inventory_stok - transaction.jumlah;

                // Memeriksa ketersediaan stok sebelum update untuk transaksi keluar.
                if (newStock < 0) {
                    await connection.rollback();
                    connection.release();
                    return res.status(400).json({ message: "Stok tidak mencukupi untuk transaksi keluar yang disetujui." });
                }

                // Memperbarui stok produk di tabel 'inventories'.
                // HAPUS updated_at=NOW() jika tidak ada di tabel
                await connection.execute("UPDATE inventories SET stok = ? WHERE id = ?", [newStock, transaction.id_inventories]);

                await connection.commit();
                connection.release();
                res.json({ message: "Transaksi stok berhasil disetujui dan stok diperbarui." });
            }
        } else if (action === "reject") {
            // Logika untuk penolakan transaksi 'add_product'.
            if (transaction.transaction_type === "add_product") {
                // Mengatasi Foreign Key Constraint Failure.
                // Langkah 1: Null-kan referensi Foreign Key di tabel `transactions` terlebih dahulu.
                // Ini akan memutus ikatan antara transaksi ini dan inventaris yang akan dihapus.
                await connection.execute("UPDATE transactions SET id_inventories = NULL WHERE id = ?", [id]);
                
                // Langkah 2: Sekarang aman untuk menghapus inventaris karena tidak ada lagi transaksi yang mereferensikannya.
                await connection.execute("DELETE FROM inventories WHERE id = ?", [transaction.id_inventories]);
                
                await connection.commit();
                connection.release();
                res.json({ message: "Permintaan produk ditolak dan produk dihapus." });
            } else {
                // Untuk transaksi stok normal yang ditolak, tidak ada perubahan stok, hanya status transaksi.
                await connection.commit();
                connection.release();
                res.json({ message: "Transaksi stok ditolak." });
            }
        } else {
            // Menangani aksi yang tidak valid.
            connection.release();
            res.status(400).json({ message: "Aksi tidak valid (harus 'approve' atau 'reject')." });
        }
    } catch (error) {
        // Menangani kesalahan selama pemrosesan transaksi.
        if (connection) {
            await connection.rollback(); // Mengembalikan transaksi jika terjadi error.
        }
        console.error("approveTransaction: Error during transaction processing:", error);
        // Menambahkan penanganan error untuk req.user tidak terdefinisi
        if (error instanceof TypeError && (error.message.includes("Cannot read properties of undefined (reading 'userId')") || error.message.includes("Cannot destructure property 'userRole'"))) {
            return res.status(401).json({ message: "Tidak terautentikasi atau sesi berakhir. Silakan login kembali.", error: error.message });
        }
        res.status(500).json({ message: "Gagal memproses approval.", error: error.message });
    } finally {
        if (connection) {
            connection.release(); // Melepaskan koneksi database kembali ke pool.
        }
    }
};


// Ini berfungsi untuk mengalihkan permintaan 'rejectTransaction' ke fungsi 'approveTransaction'
// dengan secara otomatis mengatur aksi menjadi 'reject'.
export const rejectTransaction = async (req, res) => {
    req.body.action = 'reject'; // Menyetel aksi ke 'reject'.
    await approveTransaction(req, res); // Memanggil fungsi approveTransaction.
};