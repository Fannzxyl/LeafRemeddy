// src/pages/AddTransaction.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AddTransaction() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productId: "",
    jumlah: "",
    tipe: "masuk",
    lokasiId: "",
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.userRole);
      } catch (e) {
        console.error("Error parsing token:", e);
      }
    }

    const fetchInitialData = async () => {
      setLoading(true);
      const currentToken = localStorage.getItem('token');
      if (!currentToken) {
        showCustomAlert("Token tidak ditemukan. Silakan login.");
        setLoading(false);
        return;
      }

      try {
        const productsRes = await axios.get(`${API_BASE}/api/inventory`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        setProducts(productsRes.data);
        console.log("Fetched products:", productsRes.data);

        const locationsRes = await axios.get(`${API_BASE}/api/locations`, {
          headers: { Authorization: `Bearer ${currentToken}` }
        });
        if (Array.isArray(locationsRes.data)) {
          setLocations(locationsRes.data.filter(loc => loc && loc.id && loc.nama));
          console.log("Fetched locations:", locationsRes.data);
        } else {
          console.error("Format data lokasi tidak sesuai (bukan array).");
        }

      } catch (error) {
        console.error("Error fetching initial data for AddTransaction:", error.response?.data?.message || error.message);
        showCustomAlert("Gagal memuat data produk atau lokasi. Pastikan backend berjalan dan Anda memiliki izin.");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("Nilai formData saat submit (dari frontend):", JSON.stringify(formData, null, 2));

    let missingFields = [];
    if (!formData.productId) missingFields.push("Produk");
    if (!formData.jumlah) missingFields.push("Jumlah");
    if (!formData.tipe) missingFields.push("Tipe Transaksi");
    if (!formData.lokasiId) missingFields.push("Lokasi Gudang");

    if (missingFields.length > 0) {
      const errorMessage = `Harap lengkapi field berikut: ${missingFields.join(", ")}.`;
      console.error(errorMessage);
      showCustomAlert(errorMessage);
      setLoading(false);
      return;
    }

    if (isNaN(formData.jumlah) || parseInt(formData.jumlah) <= 0) {
      showCustomAlert("Jumlah harus berupa angka positif!");
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      showCustomAlert("Anda tidak memiliki izin. Silakan login.");
      setLoading(false);
      return;
    }

    // === PERBAIKAN PENTING DI SINI: Ubah nama kunci payload ke camelCase ===
    const payload = {
      productId: parseInt(formData.productId), // Menggunakan productId (camelCase)
      jumlah: parseInt(formData.jumlah),
      tipe: formData.tipe,
      lokasiId: parseInt(formData.lokasiId),   // Menggunakan lokasiId (camelCase)
    };
    // =====================================================================

    try {
      const response = await axios.post(`${API_BASE}/api/transactions`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.type === 'direct') {
        showCustomAlert("Transaksi berhasil dicatat dan stok diperbarui!");
        navigate("/transactions");
      } else if (response.data.type === 'approval_needed') {
        showCustomAlert("Permintaan transaksi stok telah dikirim untuk persetujuan Manager.");
        navigate("/transactions");
      }
    } catch (error) {
      console.error("Error saat menambahkan transaksi:", error.response?.data?.message || error.message);
      const errorMessage = error.response?.data?.message || "Gagal mencatat transaksi";
      showCustomAlert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const showCustomAlert = (message) => {
    console.log("ALERT MESSAGE:", message);
    alert(message);
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Catat Transaksi Stok</h1>

        {userRole === 'STAZ' && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <strong>Info:</strong> Sebagai Staff, transaksi stok yang Anda catat akan memerlukan persetujuan dari Manager terlebih dahulu.
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Produk
              </label>
              <select
                id="productId"
                name="productId"
                value={formData.productId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading || products.length === 0}
              >
                <option value="">-- Pilih Produk --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stok saat ini: {product.stok} {product.satuan}) - Lokasi: {product.lokasi}
                  </option>
                ))}
              </select>
              {products.length === 0 && !loading && (
                <p className="text-red-500 text-sm mt-1">Tidak ada produk ditemukan. Pastikan Anda telah menambah produk di Inventaris.</p>
              )}
            </div>

            <div>
              <label htmlFor="tipe" className="block text-sm font-medium text-gray-700 mb-2">
                Tipe Transaksi
              </label>
              <select
                id="tipe"
                name="tipe"
                value={formData.tipe}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="masuk">Stok Masuk</option>
                <option value="keluar">Stok Keluar</option>
              </select>
            </div>

            <div>
              <label htmlFor="jumlah" className="block text-sm font-medium text-gray-700 mb-2">
                Jumlah
              </label>
              <input
                id="jumlah"
                type="number"
                name="jumlah"
                value={formData.jumlah}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah stok"
                min="1"
                required
              />
            </div>

            <div>
              <label htmlFor="lokasiId" className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Gudang
              </label>
              <select
                id="lokasiId"
                name="lokasiId"
                value={formData.lokasiId}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
                disabled={loading || locations.length === 0}
              >
                <option value="">-- Pilih Lokasi Gudang --</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.nama} - {location.alamat}
                  </option>
                ))}
              </select>
              {locations.length === 0 && !loading && (
                <p className="text-red-500 text-sm mt-1">Tidak ada lokasi ditemukan. Pastikan Anda telah menambah lokasi gudang.</p>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loading ? "Memproses..." : "Catat Transaksi"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
