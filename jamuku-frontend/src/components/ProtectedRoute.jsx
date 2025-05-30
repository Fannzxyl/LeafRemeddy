import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Fungsi utilitas untuk membersihkan item login dari localStorage
  const clearAuthItems = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
  };

  // Jika belum login, arahkan ke halaman login dengan state untuk redirect
  if (!token) {
    console.log("ProtectedRoute: Token tidak ditemukan, mengarahkan ke login.");
    clearAuthItems(); // Pastikan item login dihapus jika token tidak ada
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada requiredRole spesifik dan role tidak sesuai
  if (requiredRole && role !== requiredRole) {
    console.log(`ProtectedRoute: Akses ditolak untuk role ${role}, membutuhkan ${requiredRole}.`);
    clearAuthItems(); // Hapus item login jika role tidak sesuai untuk rute ini
    // Redirect berdasarkan role yang ada (jika role itu sendiri tidak sesuai dengan rute)
    const redirectPath = role === "STAZ"
      ? "/dashboard-staz"
      : role === "MANAGER"
      ? "/dashboard-manager"
      : "/login"; // Default ke login jika role aneh
    
    return <Navigate to={redirectPath} replace />;
  }

  // Jika menggunakan allowedRoles array
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    console.log(`ProtectedRoute: Akses ditolak untuk role ${role}, hanya mengizinkan ${allowedRoles.join(', ')}.`);
    clearAuthItems(); // Hapus item login jika role tidak diizinkan untuk rute ini
    const redirectPath = role === "STAZ"
      ? "/dashboard-staz"
      : role === "MANAGER"
      ? "/dashboard-manager"
      : "/login";
    
    return <Navigate to={redirectPath} replace />;
  }

  // Validasi token masih valid (opsional - bisa tambahkan API call)
  try {
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    // Cek apakah token expired
    if (tokenPayload.exp && Date.now() >= tokenPayload.exp * 1000) {
      console.log("ProtectedRoute: Token kadaluarsa, mengarahkan ke login.");
      clearAuthItems(); // Hapus item login jika token kadaluarsa
      return <Navigate to="/login" replace />;
    }
    // Opsional: Cek apakah role di token payload sama dengan role di localStorage
    // if (tokenPayload.role !== role) {
    //   console.log("ProtectedRoute: Role di token tidak sesuai dengan di localStorage, mengarahkan ke login.");
    //   clearAuthItems();
    //   return <Navigate to="/login" replace />;
    // }

  } catch (error) {
    // Jika token tidak valid format (misalnya string acak, bukan JWT), hapus dan redirect
    console.error("ProtectedRoute: Error saat memverifikasi token lokal:", error);
    clearAuthItems(); // Hapus item login jika token formatnya rusak
    return <Navigate to="/login" replace />;
  }

  // Jika semua validasi passed, tampilkan halaman
  return children;
};

export default ProtectedRoute;