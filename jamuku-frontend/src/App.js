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

  // Fitur tambahan
  import UserList from "./pages/UserList";
  import TransactionList from "./pages/TransactionList";

  function App() {
    const [loadingComplete, setLoadingComplete] = useState(false);

    useEffect(() => {
      const timer = setTimeout(() => {
        setLoadingComplete(true);
      }, 2500); // durasi loading 2.5 detik

      return () => clearTimeout(timer);
    }, []);

    if (!loadingComplete) {
      return <LoadingPage />;
    }

    return (
      <BrowserRouter>
        <Routes>
          {/* Setelah loading selesai, langsung arahkan ke login */}
          <Route path="/" element={<Navigate to="/login" />} />

          {/* Auth */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Dashboard berdasarkan role */}
          <Route path="/dashboard-manager" element={<DashboardManager />} />
          <Route path="/dashboard-staz" element={<DashboardStaz />} />

          {/* CRUD Produk */}
          <Route path="/products" element={<ProductList />} />
          <Route path="/add" element={<AddProduct />} />
          <Route path="/edit/:id" element={<EditProduct />} />

          {/* Fitur tambahan */}
          <Route path="/users" element={<UserList />} />
          <Route path="/transactions" element={<TransactionList />} />
        </Routes>
      </BrowserRouter>
    );
  }

  export default App;
