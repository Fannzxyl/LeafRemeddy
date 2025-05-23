import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Loading Page
import LoadingPage from "./pages/LoadingPage";

// Halaman Auth
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Dashboard berdasarkan role
import DashboardManager from "./pages/DashboardManager";
import DashboardStaz from "./pages/DashboardStaz";

// CRUD Produk
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import EditProduct from "./components/EditProduct";

// Lokasi Gudang
import WarehouseLocation from "./components/WarehouseLocation";

// Fitur tambahan
import UserList from "./pages/UserList";
import TransactionList from "./pages/TransactionList";
import AddTransaction from "./components/AddTransaction"; // ✅ Tambahkan ini

// Proteksi akses
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  const [loadingComplete, setLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingComplete(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (!loadingComplete) return <LoadingPage />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          path="/dashboard-manager"
          element={
            <ProtectedRoute>
              <DashboardManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard-staz"
          element={
            <ProtectedRoute>
              <DashboardStaz />
            </ProtectedRoute>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <ProductList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add"
          element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit/:id"
          element={
            <ProtectedRoute>
              <EditProduct />
            </ProtectedRoute>
          }
        />

        <Route
          path="/gudang"
          element={
            <ProtectedRoute>
              <WarehouseLocation />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UserList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-transaction"
          element={
            <ProtectedRoute>
              <AddTransaction />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;