// controllers/UserController.js
import db from "../db.js"; // db sekarang adalah instance pool yang berbasis Promise

export const getUsers = async (req, res) => { // Mengubah ke async
    try {
        // PERBAIKAN: Menggunakan req.user.userRole (dari decoded token)
        const { userRole: requesterRole } = req.user; 

        let query = `
            SELECT id, username, role, status, created_at, approved_by, approved_at
            FROM users
        `;
        let values = []; // Parameter untuk query jika ada WHERE clause

        // Jika user adalah STAZ, hanya tampilkan user dengan status 'active'
        if (requesterRole === "STAZ") {
            query += ` WHERE status = 'active'`;
        }

        query += ` ORDER BY id DESC`;

        // Menggunakan await db.query() untuk Promise-based query
        const [results] = await db.query(query, values); // Gunakan 'values' meskipun kosong untuk konsistensi

        res.json(results);
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ message: "Gagal mengambil daftar pengguna", error: err.message });
    }
};


export const approveUserRequest = async (req, res) => { // Mengubah ke async
    const { id } = req.params; // ID user yang akan di-approve/reject
    const { action } = req.body; // 'approve' atau 'reject'
    // PERBAIKAN PENTING: Menggunakan req.userIdFromToken dan menambahkan ?? null
    const managerId = req.userIdFromToken ?? null; 
    // PERBAIKAN PENTING: Menggunakan req.userRoleFromToken
    const managerRole = req.userRoleFromToken; 

    if (managerRole !== "MANAGER") { 
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }

    let connection; // Deklarasikan connection di luar try

    try {
        connection = await db.getConnection(); // Dapatkan koneksi berbasis Promise
        await connection.beginTransaction(); // Mulai transaksi

        const getUserQuery = `
            SELECT id, username, role, status FROM users WHERE id = ? AND status = 'pending'
        `;
        // Menggunakan await connection.execute()
        const [results] = await connection.execute(getUserQuery, [id]);

        if (results.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: "Permintaan pengguna tidak ditemukan atau sudah diproses." });
        }

        const userRequest = results[0];
        let newStatus;
        let successMessage;

        if (action === 'approve') {
            newStatus = 'active';
            successMessage = `Pengguna '${userRequest.username}' berhasil disetujui dan diaktifkan.`;
        } else if (action === 'reject') {
            newStatus = 'rejected';
            successMessage = `Permintaan pengguna '${userRequest.username}' berhasil ditolak.`;
        } else {
            await connection.rollback();
            connection.release();
            return res.status(400).json({ message: "Aksi tidak valid. Gunakan 'approve' atau 'reject'." });
        }

        const updateStatusQuery = `
            UPDATE users
            SET status = ?, approved_by = ?, approved_at = NOW()
            WHERE id = ?
        `;

        // Menggunakan await connection.execute()
        await connection.execute(updateStatusQuery, [newStatus, managerId, id]); // managerId sekarang akan menjadi null jika undefined

        await connection.commit(); // Commit transaksi
        res.json({ message: successMessage });

    } catch (err) {
        if (connection) { // Pastikan connection ada sebelum rollback
            await connection.rollback(); // Rollback transaksi jika ada error
        }
        console.error("approveUserRequest: Error during user approval transaction:", err);
        res.status(500).json({ message: "Gagal memproses persetujuan pengguna.", error: err.message });
    } finally {
        if (connection) { // Pastikan connection ada sebelum dilepaskan
            connection.release(); // Lepaskan koneksi
        }
    }
};
