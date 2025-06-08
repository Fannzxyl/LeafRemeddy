// src/App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Import komponen-komponen halaman
import LoadingPage from "./pages/LoadingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardManager from "./pages/DashboardManager";
import DashboardStaz from "./pages/DashboardStaz";
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import EditProduct from "./components/EditProduct";
import LokasiGudang from "./components/LokasiGudang";
import UserList from "./pages/UserList";
import TransactionList from "./pages/TransactionList";
import AddTransaction from "./components/AddTransaction";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!loadingComplete) {
    return <LoadingPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Rute awal akan dialihkan ke /login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rute autentikasi */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboard Routes - Role Specific */}
        {/* Pastikan `requiredRole` atau `allowedRoles` dilewatkan sebagai string atau array literals.
           Jika error di baris ini, kemungkinan ada kesalahan penulisan di `requiredRole="MANAGER"` */}
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

        {/* Inventory Routes - STAZ & MANAGER dapat akses */}
        <Route
          path="/inventory"
          element={
            // Pastikan array [ "STAZ", "MANAGER" ] ditulis dengan benar
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

        {/* Transaction Routes - STAZ & MANAGER dapat akses */}
        <Route
          path="/transactions"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <TransactionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute allowedRoles={["STAZ", "MANAGER"]}>
              <AddTransaction />
            </ProtectedRoute>
          }
        />

        {/* Manager Only Routes */}
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
              {/* Ini adalah children dari ProtectedRoute */}
              <RedirectToDashboard /> 
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Komponen Pembantu: RedirectToDashboard
const RedirectToDashboard = () => {
  const role = localStorage.getItem("userRole"); 
  
  if (role === "MANAGER") {
    return <Navigate to="/dashboard-manager" replace />;
  } else if (role === "STAZ") {
    return <Navigate to="/dashboard-staz" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default App;