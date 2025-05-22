import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaList,
  FaSignOutAlt,
  FaHome,
  FaBoxOpen,
  FaEdit,
} from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="w-64 h-screen bg-green-800 text-white p-6 flex flex-col justify-between fixed top-0 left-0 z-50">
      <div>
        <h1 className="text-2xl font-bold mb-8">Warehouse System</h1>

        <nav className="space-y-4">
          {/* Dashboard */}
          <button
            onClick={() =>
              navigate(role === "MANAGER" ? "/dashboard-manager" : "/dashboard-staz")
            }
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaHome />
            <span>Dashboard</span>
          </button>

          {/* User List (hanya untuk MANAGER) */}
          {role === "MANAGER" && (
            <button
              onClick={() => navigate("/users")}
              className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
            >
              <FaUser />
              <span>User List</span>
            </button>
          )}

          {/* Transaksi */}
          <button
            onClick={() => navigate("/transactions")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaList />
            <span>Transactions</span>
          </button>

          {/* Produk */}
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaBoxOpen />
            <span>Product List</span>
          </button>

          {/* (Opsional) Edit Produk Pertama */}
          <button
            onClick={() => navigate("/edit/1")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaEdit />
            <span>Crud</span>
          </button>
        </nav>
      </div>

      {/* Logout */}
      <div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full p-2 rounded hover:bg-red-700 cursor-pointer mt-4"
        >
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}
