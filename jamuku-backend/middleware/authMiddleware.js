// middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'rahasia123';

export const verifyToken = (req, res, next) => {
    console.log("VerifyToken: Function called.");
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log("VerifyToken: No token or invalid format.");
        return res.status(403).json({ message: 'Token tidak ditemukan atau format tidak valid.' });
    }

    const token = authHeader.split(' ')[1];
    console.log("VerifyToken: Token received:", token.substring(0, 30) + "...");

    jwt.verify(token, ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            console.error("VerifyToken: Token verification failed:", err.message);
            return res.status(401).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
        }

        req.user = decoded;
        req.userIdFromToken = decoded.userId;
        req.userRoleFromToken = decoded.userRole; // Pastikan ini 'MANAGER' atau 'STAZ'

        console.log("VerifyToken: Token decoded successfully. Payload:", req.user);
        console.log("VerifyToken: Decoded userRole (from payload):", req.user.userRole);
        console.log("VerifyToken: req.userIdFromToken set to:", req.userIdFromToken);
        console.log("VerifyToken: req.userRoleFromToken set to:", req.userRoleFromToken);
        next();
    });
};

export const verifyUser = (req, res, next) => {
    console.log("VerifyUser: Function called. req.user:", req.user);
    console.log("VerifyUser: Role from req.user:", req.user?.userRole);
    console.log("VerifyUser: req.userIdFromToken:", req.userIdFromToken);

    if (!req.user || !req.userIdFromToken || !req.userRoleFromToken) {
        return res.status(401).json({ message: "Tidak diizinkan: Data pengguna tidak ditemukan setelah verifikasi token." });
    }
    next();
};

export const verifyManager = (req, res, next) => {
    // MENULIS ULANG STRING 'MANAGER' SECARA MANUAL
    const userRoleFromToken = String(req.userRoleFromToken || '').trim();
    const expectedRole = 'MANAGER'; // <--- TULIS ULANG INI SECARA MANUAL (jangan copy-paste)

    console.log("VerifyManager: Function called.");
    console.log("VerifyManager: req.user object (full):", req.user);
    console.log("VerifyManager: userRoleFromToken (trimmed & stringified):", `'${userRoleFromToken}'`);
    console.log("VerifyManager: Expected role:", `'${expectedRole}'`);
    console.log("VerifyManager: Result of comparison (userRoleFromToken !== expectedRole):", userRoleFromToken !== expectedRole);

    // Tambahkan log detail jika perbandingan gagal, fokus pada character codes
    if (userRoleFromToken !== expectedRole) {
        console.log("VerifyManager: -- MISMATCH DETECTED --");
        console.log("VerifyManager: userRoleFromToken length:", userRoleFromToken.length);
        console.log("VerifyManager: Expected role length:", expectedRole.length);
        for (let i = 0; i < Math.max(userRoleFromToken.length, expectedRole.length); i++) {
            const charUser = userRoleFromToken.charAt(i);
            const codeUser = userRoleFromToken.charCodeAt(i);
            const charExpected = expectedRole.charAt(i);
            const codeExpected = expectedRole.charCodeAt(i);
            console.log(`Char ${i}: '${charUser}' (${codeUser}) vs '${charExpected}' (${codeExpected})`);
        }
    }

    if (userRoleFromToken !== expectedRole) {
        console.log("VerifyManager: Access denied block executed. Current role:", userRoleFromToken);
        return res.status(403).json({ message: "Akses ditolak. Hanya Manager yang bisa melakukan aksi ini." });
    }
    console.log("VerifyManager: Access granted block executed.");
    next();
};