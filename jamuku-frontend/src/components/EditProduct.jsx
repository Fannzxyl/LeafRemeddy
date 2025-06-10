// components/EditProduct.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import useSWR from "swr"; // Impor useSWR
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function EditProduct() {
  const { id } = useParams(); // Mengambil ID produk dari URL
  const navigate = useNavigate();
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [locations, setLocations] = useState([]); // Untuk dropdown lokasi
  const [userRole, setUserRole] = useState(''); // Untuk menampilkan atau menyembunyikan status bagi manager

  const fetcher = async (url) => {
    const token = localStorage.getItem('token');
    if (!token) {
      const authError = new Error("Token tidak ditemukan. Silakan login.");
      authError.status = 403; // Memberikan status 403 untuk error autentikasi
      throw authError;
    }
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    return res.data;
  };

  // Mengambil data produk berdasarkan ID menggunakan SWR
  const { data: productData, error: fetchError, isLoading: isProductLoading } = useSWR(`${API_BASE}/api/inventory/${id}`, fetcher);

  const [formData, setFormData] = useState({
    namaProduk: "",
    kategori: "",
    stok: "",
    satuan: "",
    status: "", 
    id_lokasi: ""
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUserRole(payload.role);
    }

    const fetchLocations = async () => {
      try {
        const token = localStorage.getItem('token'); 
        const response = await axios.get(`${API_BASE}/api/locations`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setLocations(response.data);
      } catch (error) {
        console.error("Error fetching locations:", error);
        alert("Gagal memuat data lokasi");
      }
    };
    fetchLocations();
  }, []);

  // Mengisi formData saat productData berhasil dimuat
  useEffect(() => {
    if (productData) {
      // PERBAIKAN PENTING: Gunakan nullish coalescing (??) untuk menyediakan nilai default string kosong
      // jika properti dari productData adalah null atau undefined.
      setFormData({
        namaProduk: productData.namaProduk ?? '', // ?? '' akan memastikan nilai selalu string
        kategori: productData.kategori ?? '',
        stok: productData.stok ?? '', 
        satuan: productData.satuan ?? '',
        status: productData.status ?? '',
        id_lokasi: productData.id_lokasi ?? ''
      });
    }
  }, [productData]); // Jalankan efek ini setiap kali productData berubah

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoadingUpdate(true);
    try {
      if (!formData.namaProduk || !formData.kategori || !formData.stok || !formData.satuan || !formData.id_lokasi) {
        alert("Semua field wajib diisi!");
        setLoadingUpdate(false);
        return;
      }
      if (isNaN(formData.stok) || parseInt(formData.stok) < 0) {
        alert("Stok harus berupa angka positif!");
        setLoadingUpdate(false);
        return;
      }

      const token = localStorage.getItem('token'); 
      if (!token) {
        alert("Anda tidak memiliki izin. Silakan login.");
        setLoadingUpdate(false);
        return;
      }

      await axios.put(`${API_BASE}/api/inventory/${id}`, {
        namaProduk: formData.namaProduk,
        kategori: formData.kategori,
        stok: parseInt(formData.stok),
        satuan: formData.satuan,
        status: formData.status,
        id_lokasi: parseInt(formData.id_lokasi)
      }, {
        headers: { Authorization: `Bearer ${token}` } 
      });
      alert("Produk berhasil diupdate!");
      navigate("/products");
    } catch (error) {
      console.error("Error updating product:", error);
      const errorMessage = error.response?.data?.message || "Gagal mengupdate produk";
      alert(errorMessage);
    } finally {
      setLoadingUpdate(false);
    }
  };

  if (fetchError) {
    let errorMessage = "Gagal memuat data produk.";
    if (fetchError.response?.status === 403 || fetchError.status === 403) {
      errorMessage = "Akses ditolak. Anda tidak memiliki izin atau sesi Anda telah berakhir. Silakan login kembali.";
    } else if (fetchError.response?.status === 401 || fetchError.status === 401) {
      errorMessage = "Sesi Anda telah berakhir. Silakan login kembali.";
    } else {
      errorMessage += ` ${fetchError.message}`;
    }
    return (
      <DashboardLayout>
        <div className="p-6 text-red-600">
          {errorMessage}
        </div>
      </DashboardLayout>
    );
  }

  if (isProductLoading || !productData) {
    return (
      <DashboardLayout>
        <div className="p-6 text-gray-700">
          Loading data produk...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Edit Produk</h1>
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Produk
              </label>
              <input
                type="text"
                name="namaProduk"
                value={formData.namaProduk}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan nama produk"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kategori
              </label>
              <select
                name="kategori"
                value={formData.kategori}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Kategori</option>
                <option value="Herbal">Herbal</option>
                <option value="Imunitas">Imunitas</option>
                <option value="Pegal Linu">Pegal Linu</option>
                <option value="Stamina">Stamina</option>
                <option value="Detox">Detox</option>
                <option value="Pencernaan">Pencernaan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stok
              </label>
              <input
                type="number"
                name="stok"
                value={formData.stok}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="Masukkan jumlah stok"
                min="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Satuan
              </label>
              <select
                name="satuan"
                value={formData.satuan}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Satuan</option>
                <option value="botol">Botol</option>
                <option value="box">Box</option>
                <option value="pcs">Pcs</option>
                <option value="kg">Kg</option>
                <option value="gram">Gram</option>
              </select>
            </div>
            {userRole === 'MANAGER' && ( // Hanya tampilkan Status jika user adalah Manager
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lokasi Gudang
              </label>
              <select
                name="id_lokasi"
                value={formData.id_lokasi}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Pilih Lokasi Gudang</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.nama} - {location.alamat}
                  </option>
                ))}
              </select>
            </div>
            {locations.length === 0 && (
              <div className="text-yellow-600 text-sm">
                Loading lokasi gudang...
              </div>
            )}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loadingUpdate}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  loadingUpdate ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {loadingUpdate ? "Menyimpan..." : "Update Produk"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/products")}
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
