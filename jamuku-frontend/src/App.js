// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import komponen-komponen halaman
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardManager from "./pages/DashboardManager";
import DashboardStaz from "./pages/DashboardStaz";
// KOREKSI: Mengembalikan path ke components/ karena file kemungkinan masih di sana
import ProductList from "./components/ProductList"; // <-- PATH KEMBALI KE components/
import AddProduct from "./components/AddProduct";   // <-- PATH KEMBALI KE components/
import EditProduct from "./components/EditProduct"; // Tetap di components/
import LokasiGudang from "./components/LokasiGudang"; // Tetap di components/
import UserList from "./pages/UserList";
import TransactionList from "./pages/TransactionList";
// KOREKSI: Mengembalikan path ke components/ untuk AddTransaction juga
import AddTransaction from "./components/AddTransaction"; // <-- PATH KEMBALI KE components/
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  // Efek untuk menampilkan LoadingPage selama beberapa waktu
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2500); // Tampilkan loading selama 2.5 detik
    return () => clearTimeout(timer); // Bersihkan timer saat komponen unmount
  }, []);

  // Jika loading belum selesai, tampilkan LoadingPage
  if (!loadingComplete) {
    return <LoadingPage />;
  }

  return (
    // PERBAIKAN: Menambahkan `future` prop untuk menghilangkan React Router Future Flag Warnings
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Rute awal akan dialihkan ke /login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rute autentikasi */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboard Routes - Spesifik untuk peran (role) */}
        <Route
          path="/dashboard-manager"
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <DashboardManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-staz"
          element={
            <ProtectedRoute requiredRole="STAZ">
              <DashboardStaz />
            </ProtectedRoute>
          }
        />

        {/* Inventory Routes - Dapat diakses oleh STAZ & MANAGER */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-product"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        {/* Transaction Routes - Dapat diakses oleh STAZ & MANAGER */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <TransactionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-transaction" // <-- RUTE BARU UNTUK TAMBAH TRANSAKSI
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <AddTransaction />
            </ProtectedRoute>
          }
        />

        {/* Rute Khusus Manager */}
        <Route
          path="/users"
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/lokasi-gudang"
          element={
            <ProtectedRoute requiredRole="MANAGER">
              <LokasiGudang />
            </ProtectedRoute>
          }
        />

        {/* Catch all - rute fallback jika tidak ada yang cocok, akan dialihkan ke dashboard sesuai peran */}
        <Route
          path="*" 
          element={
            <ProtectedRoute>
              {/* Komponen pembantu untuk mengarahkan ke dashboard yang benar */}
              <RedirectToDashboard /> 
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Komponen Pembantu: RedirectToDashboard
// Bertanggung jawab untuk mengarahkan pengguna ke dashboard yang sesuai berdasarkan perannya
const RedirectToDashboard = () => {
  const role = localStorage.getItem("userRole"); 
  
  if (role === "MANAGER") {
    return <Navigate to="/dashboard-manager" replace />;
  } else if (role === "STAZ") {
    return <Navigate to="/dashboard-staz" replace />;
  } else {
    return <Navigate to="/login" replace />; // Jika tidak ada role atau tidak dikenal, arahkan ke login
  }
};

export default App;