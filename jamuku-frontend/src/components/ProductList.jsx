import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ProductList() {
  const { mutate } = useSWRConfig();

  const fetcher = async () => {
    const res = await axios.get(`${API_BASE}/api/inventory`);
    return res.data;
  };

  const { data, error, isLoading } = useSWR("inventory", fetcher);

  if (error) return (
    <DashboardLayout>
      <div className="p-6 text-red-600">
        Gagal memuat data produk: {error.message}
      </div>
    </DashboardLayout>
  );

  if (isLoading || !data) return (
    <DashboardLayout>
      <div className="p-6 text-gray-700">
        Loading...
      </div>
    </DashboardLayout>
  );

  const deleteProduct = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus produk ini?");
    if (!confirmDelete) return;

    try {
      await axios.delete(`${API_BASE}/api/inventory/${id}`);
      mutate("inventory");
      alert("Produk berhasil dihapus!");
    } catch (err) {
      alert("Gagal menghapus produk: " + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Daftar Produk</h1>
        <Link
          to="/add-product"
          className="inline-block bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow mb-6"
        >
          Tambah Produk
        </Link>
        <div className="overflow-x-auto bg-white shadow rounded">
          <table className="min-w-[900px] text-sm text-left text-gray-700">
            <thead className="bg-gray-100 text-xs uppercase">
              <tr>
                <th className="p-3 text-center">No</th>
                <th className="p-3">Nama Produk</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Stok</th>
                <th className="p-3">Satuan</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((product, index) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-center">{index + 1}</td>
                    <td className="p-3">{product.namaProduk}</td>
                    <td className="p-3">{product.kategori}</td>
                    <td className="p-3">{product.stok}</td>
                    <td className="p-3">{product.satuan}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-500">
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