import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Loading Page
import LoadingPage from "./pages/LoadingPage";

// Auth Pages
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";

// Role-based Dashboards
import DashboardManager from "./pages/DashboardManager";
import DashboardStaz from "./pages/DashboardStaz";

// Inventory CRUD Components
import ProductList from "./components/ProductList";
import AddProduct from "./components/AddProduct";
import EditProduct from "./components/EditProduct";

// Warehouse Location
import LokasiGudang from "./components/LokasiGudang";

// Additional Features
import UserList from "./pages/UserList";
import TransactionList from "./pages/TransactionList";
import AddTransaction from "./components/AddTransaction";

// Route Protection
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
        {/* Rute awal akan dialihkan ke /login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rute autentikasi */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Dashboard Routes - Role Specific */}
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

        {/* Catch all - redirect to appropriate dashboard */}
        <Route
          path="*"
          element={
            <ProtectedRoute>
              <RedirectToDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

// Component untuk redirect ke dashboard yang sesuai
const RedirectToDashboard = () => {
  const role = localStorage.getItem("role");
  
  if (role === "MANAGER") {
    return <Navigate to="/dashboard-manager" replace />;
  } else if (role === "STAZ") {
    return <Navigate to="/dashboard-staz" replace />;
  } else {
    return <Navigate to="/login" replace />;
  }
};

export default App;