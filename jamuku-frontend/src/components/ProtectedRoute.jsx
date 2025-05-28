import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRole, allowedRoles = [] }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const location = useLocation();

  // Jika belum login, arahkan ke halaman login dengan state untuk redirect
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada requiredRole spesifik dan role tidak sesuai
  if (requiredRole && role !== requiredRole) {
    // Redirect berdasarkan role yang ada
    const redirectPath = role === "STAZ" 
      ? "/dashboard-staz" 
      : role === "MANAGER" 
      ? "/dashboard-manager" 
      : "/login";
    
    return <Navigate to={redirectPath} replace />;
  }

  // Jika menggunakan allowedRoles array
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const redirectPath = role === "STAZ" 
      ? "/dashboard-staz" 
      : role === "MANAGER" 
      ? "/dashboard-manager" 
      : "/login";
    
    return <Navigate to={redirectPath} replace />;
  }

  // Validasi token masih valid (opsional - bisa tambahkan API call)
  try {
    // Cek apakah token expired (jika menggunakan JWT)
    const tokenPayload = JSON.parse(atob(token.split('.')[1]));
    if (tokenPayload.exp && Date.now() >= tokenPayload.exp * 1000) {
      localStorage.clear();
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    // Jika token tidak valid format, hapus dan redirect
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // Jika semua validasi passed, tampilkan halaman
  return children;
};

export default ProtectedRoute;