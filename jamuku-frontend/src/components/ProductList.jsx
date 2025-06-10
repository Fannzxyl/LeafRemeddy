import React from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useSWR, { useSWRConfig } from "swr";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function ProductList() {
  const { mutate } = useSWRConfig();

  const fetcher = async (url) => {
    const token = localStorage.getItem('token');

    if (!token) {
      const authError = new Error("Token tidak ditemukan. Silakan login.");
      authError.status = 403;
      throw authError;
    }

    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  };

  const { data, error, isLoading } = useSWR(`${API_BASE}/api/inventory`, fetcher);

  if (error) {
    let errorMessage = "Gagal memuat data produk.";
    if (error.response?.status === 403 || error.status === 403) {
      errorMessage = "Akses ditolak. Anda tidak memiliki izin atau sesi Anda telah berakhir. Silakan login kembali.";
    } else if (error.response?.status === 401 || error.status === 401) {
      errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
    } else {
      errorMessage += ` ${error.message}`;
    }
    return (
      <DashboardLayout>
        <div className="p-6 text-red-600">
          {errorMessage}
        </div>
      </DashboardLayout>
    );
  }

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
      const token = localStorage.getItem('token');
      if (!token) {
        alert("Anda tidak memiliki izin untuk menghapus produk. Silakan login.");
        return;
      }
      await axios.delete(`${API_BASE}/api/inventory/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      mutate(`${API_BASE}/api/inventory`);
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
              {/* PERBAIKAN UTAMA: Hapus spasi/newline di antara <th> */}
              <tr>
                <th className="p-3 text-center">No</th><th className="p-3">Nama Produk</th><th className="p-3">Kategori</th><th className="p-3">Stok</th><th className="p-3">Satuan</th><th className="p-3">Status</th><th className="p-3">Lokasi</th><th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data && data.length > 0 ? (
                data.map((product, index) => (
                  <tr key={product.id} className="border-t hover:bg-gray-50">
                    {/* PERBAIKAN: Hapus spasi/newline di antara <td> */}
                    <td className="p-3 text-center">{index + 1}</td><td className="p-3">{product.name}</td><td className="p-3">{product.kategori}</td><td className="p-3">{product.stok}</td><td className="p-3">{product.satuan}</td><td className="p-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          product.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}
                      >
                        {product.status}
                      </span>
                    </td><td className="p-3">{product.lokasi}</td><td className="p-3 text-center space-x-2">
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
                  <td colSpan="8" className="text-center p-4 text-gray-500">
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