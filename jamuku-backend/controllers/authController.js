import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getUserByUsername } from '../models/userModel.js'; // kamu harus punya ini

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

export const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await getUserByUsername(username);
    if (!user) return res.status(404).json({ message: "User tidak ditemukan" });

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: "Password salah" });

    // Generate token
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      message: "Login berhasil",
      token,
      username: user.username,
      role: user.role
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Terjadi kesalahan saat login" });
  }
};
