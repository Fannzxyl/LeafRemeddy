import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET || 'rahasia123';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log('Authorization Header:', authHeader); // Debug

  if (!authHeader) {
    return res.status(403).json({ message: 'Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  console.log('Token:', token); // Debug

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('Token verification failed:', err); // Debug
      return res.status(401).json({ message: 'Token tidak valid' });
    }

    console.log('Decoded token payload:', decoded); // Debug
    req.user = decoded; // Pastikan payload ada role
    next();
  });
};

export const requireManager = (req, res, next) => {
  if (!req.user || req.user.role !== 'MANAGER') {
    return res.status(403).json({ message: 'Hanya Manager yang boleh mengakses' });
  }
  next();
};
