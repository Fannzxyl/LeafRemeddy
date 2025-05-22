import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia123';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(403).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    req.user = decoded;
    next();
  });
};
