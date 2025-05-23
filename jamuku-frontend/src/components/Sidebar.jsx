import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaList,
  FaSignOutAlt,
  FaHome,
  FaBoxOpen,
  FaWarehouse,
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
          <button
            onClick={() =>
              navigate(role === "MANAGER" ? "/dashboard-manager" : "/dashboard-staz")
            }
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaHome />
            <span>Dashboard</span>
          </button>

          {role === "MANAGER" && (
            <button
              onClick={() => navigate("/users")}
              className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
            >
              <FaUser />
              <span>User List</span>
            </button>
          )}

          <button
            onClick={() => navigate("/transactions")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaList />
            <span>Transactions</span>
          </button>

          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaBoxOpen />
            <span>Product List</span>
          </button>

          <button
            onClick={() => navigate("/gudang")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaWarehouse />
            <span>Lokasi Gudang</span>
          </button>

          {/* Tambahan Stok Barang */}
          <button
            onClick={() => navigate("/stok-produk")}
            className="flex items-center gap-2 w-full p-2 rounded hover:bg-green-700 cursor-pointer"
          >
            <FaBoxOpen />
            <span>Stok Barang</span>
          </button>
        </nav>
      </div>

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