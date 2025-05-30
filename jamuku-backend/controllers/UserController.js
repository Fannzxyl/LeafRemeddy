    // controllers/UserController.js
    import db from "../db.js";

    // ... (fungsi getUsers tetap sama) ...

    export const getUsers = (req, res) => {
    const { role: requesterRole, id: requesterId } = req.user;

    let query = `
        SELECT id, username, role, status, created_at, approved_by, approved_at
        FROM users
    `;
    let values = [];

    if (requesterRole === "STAZ") {
        query += ` WHERE status = 'active'`;
    }

    query += ` ORDER BY id DESC`;

    db.query(query, values, (err, results) => {
        if (err) {
        console.error("Error fetching users:", err);
        return res.status(500).json({ message: "Gagal mengambil daftar pengguna" });
        }
        res.json(results);
    });
    };


    export const approveUserRequest = (req, res) => {
    const { id } = req.params; // ID user yang akan di-approve/reject
    const { action } = req.body; // 'approve' atau 'reject'
    const managerId = req.user.id; // ID manager yang melakukan aksi

    if (req.user.userRole !== "MANAGER") { // Menggunakan userRole untuk konsistensi
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }

    // PERUBAHAN DI SINI: Dapatkan koneksi dari pool untuk transaksi
    db.getConnection((err, connection) => {
        if (err) {
        console.error("approveUserRequest: Gagal mendapatkan koneksi dari pool:", err);
        return res.status(500).json({ message: "Gagal memulai transaksi (koneksi database)." });
        }

        connection.beginTransaction((err) => { // Gunakan 'connection.beginTransaction'
        if (err) {
            connection.release(); // Lepaskan koneksi jika beginTransaction gagal
            console.error("approveUserRequest: Transaction begin error:", err);
            return res.status(500).json({ message: "Gagal memulai transaksi." });
        }

        const getUserQuery = `
            SELECT id, username, role, status FROM users WHERE id = ? AND status = 'pending'
        `;
        connection.query(getUserQuery, [id], (err, results) => { // Gunakan 'connection.query'
            if (err) {
            return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi setelah rollback
                console.error("approveUserRequest: Error fetching user for approval:", err);
                res.status(500).json({ message: "Gagal mengambil detail pengguna." });
            });
            }

            if (results.length === 0) {
            return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi setelah rollback
                res.status(404).json({ message: "Permintaan pengguna tidak ditemukan atau sudah diproses." });
            });
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
            return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi jika aksi tidak valid
                res.status(400).json({ message: "Aksi tidak valid. Gunakan 'approve' atau 'reject'." });
            });
            }

            const updateStatusQuery = `
            UPDATE users
            SET status = ?, approved_by = ?, approved_at = NOW()
            WHERE id = ?
            `;

            connection.query(updateStatusQuery, [newStatus, managerId, id], (err) => { // Gunakan 'connection.query'
            if (err) {
                return connection.rollback(() => {
                connection.release(); // Lepaskan koneksi setelah rollback
                console.error("approveUserRequest: Error updating user status:", err);
                res.status(500).json({ message: "Gagal memperbarui status pengguna." });
                });
            }

            connection.commit((err) => { // Gunakan 'connection.commit'
                if (err) {
                return connection.rollback(() => {
                    connection.release(); // Lepaskan koneksi setelah rollback
                    console.error("approveUserRequest: Transaction commit error for user approval:", err);
                    res.status(500).json({ message: "Gagal menyelesaikan proses persetujuan pengguna." });
                });
                }
                connection.release(); // PENTING: Lepaskan koneksi setelah commit sukses
                res.json({ message: successMessage });
            });
            });
        });
        });
    });
    };