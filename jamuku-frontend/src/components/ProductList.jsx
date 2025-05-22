import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import DashboardLayout from "../layouts/DashboardLayout";

// Gunakan variabel lingkungan agar mudah pindah ke production nanti
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ProductList() {
  const { mutate } = useSWRConfig();

  const fetcher = async () => {
    const res = await axios.get(`${API_BASE}/api/products`);
    return res.data;
  };

  const { data, error } = useSWR("products", fetcher);

  if (error)
    return (
      <DashboardLayout>
        <p className="text-red-500 p-4">Gagal memuat data produk.</p>
      </DashboardLayout>
    );

  if (!data)
    return (
      <DashboardLayout>
        <p className="p-4">Loading...</p>
      </DashboardLayout>
    );

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus produk ini?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/products/${id}`);
      mutate("products");
    } catch (err) {
      alert("Gagal menghapus produk.");
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-700">Daftar Produk</h2>
          <Link
            to="/add"
            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded shadow"
          >
            Tambah Produk
          </Link>
        </div>

        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase">
              <tr>
                <th className="p-3 text-center">No</th>
                <th className="p-3">Nama Produk</th>
                <th className="p-3">Harga</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((product, index) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-center">{index + 1}</td>
                  <td className="p-3">{product.name}</td>
                  <td className="p-3">Rp {product.price.toLocaleString()}</td>
                  <td className="p-3 text-center space-x-2">
                    <Link
                      to={`/edit/${product.id}`}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => deleteProduct(product.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {data.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    Belum ada produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
