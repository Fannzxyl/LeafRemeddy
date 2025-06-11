import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import DashboardLayout from "../layouts/DashboardLayout";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AddProduct() {
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [formData, setFormData] = useState({
    namaProduk: "",
    kategori: "",
    stok: "",
    satuan: "",
    status: "ACTIVE", // Default untuk Manager, akan diabaikan/diubah untuk STAZ di backend
    id_lokasi: ""
  });

  useEffect(() => {
    // Ini berfungsi untuk mendapatkan peran user dari token di localStorage.
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.userRole);
      } catch (e) {
        console.error("Error parsing token in AddProduct:", e); // Tetap log error penting
      }
    }

    // Ini berfungsi untuk mengambil daftar lokasi dari backend.
    const fetchLocations = async () => {
      // console.log("AddProduct - Mencoba mengambil data lokasi..."); // Dihapus
      try {
        const response = await axios.get(`${API_BASE}/api/locations`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        // console.log("AddProduct - Data lokasi mentah dari server:", response.data); // Dihapus
        
        // Ini berfungsi untuk memvalidasi dan memfilter data lokasi yang valid.
        if (Array.isArray(response.data)) {
          const validLocations = response.data.filter(loc => 
            loc && loc.id && loc.nama // Menggunakan 'nama' sesuai skema DB
          );
          
          // console.log("AddProduct - Lokasi valid setelah filter:", validLocations); // Dihapus
          
          if (validLocations.length > 0) {
            setLocations(validLocations); 
            // console.log("AddProduct - State locations berhasil diupdate dengan data:", validLocations); // Dihapus
          } else {
            console.error("AddProduct - Tidak ada lokasi valid yang ditemukan"); // Tetap log error penting
            alert("Tidak ada lokasi valid yang ditemukan di database.");
          }
        } else {
          console.error("AddProduct - Data yang diterima bukan array:", typeof response.data, response.data); // Tetap log error penting
          alert("Gagal memuat data lokasi: Format data tidak sesuai (bukan array).");
        }
      } catch (error) {
        console.error("Error saat mengambil data lokasi (AddProduct frontend):", error.response?.data?.message || error.message); // Tetap log error penting
        alert("Gagal memuat data lokasi dari server. Periksa koneksi atau hubungi administrator.");
      }
    };
    
    fetchLocations();
  }, []); // Dependency kosong, hanya berjalan sekali saat mount.

  // Ini berfungsi untuk memperbarui state formData saat input berubah.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Ini berfungsi untuk menangani submit form penambahan produk.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Mencegah reload halaman.
    setLoading(true); // Menampilkan indikator loading.
    
    try {
      // Ini berfungsi untuk validasi form sebelum mengirim request.
      if (!formData.namaProduk || !formData.kategori || !formData.stok || !formData.satuan || !formData.id_lokasi) {
        alert("Semua field wajib diisi!");
        setLoading(false);
        return;
      }
      
      if (isNaN(formData.stok) || parseInt(formData.stok) < 0) {
        alert("Stok harus berupa angka positif!");
        setLoading(false);
        return;
      }

      // Ini berfungsi untuk mengirim permintaan POST ke endpoint '/api/inventory'.
      const response = await axios.post(`${API_BASE}/api/inventory`, {
        namaProduk: formData.namaProduk,
        kategori: formData.kategori,
        stok: parseInt(formData.stok),
        satuan: formData.satuan,
        status: formData.status, // Status hanya relevan untuk Manager, akan diabaikan/diubah backend untuk STAZ
        id_lokasi: parseInt(formData.id_lokasi)
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      // Ini berfungsi untuk menampilkan pesan sukses dan mengarahkan pengguna.
      if (response.data.type === 'direct') {
        alert("Produk berhasil ditambahkan!");
        navigate("/inventory");
      } else if (response.data.type === 'approval_needed') {
        alert("Permintaan penambahan produk telah dikirim untuk approval. Manager akan meninjau permintaan Anda.");
        navigate("/transactions"); // Arahkan ke halaman transaksi pending
      }
    } catch (error) {
      // Ini berfungsi untuk menangani error dari permintaan HTTP.
      console.error("Error saat menambahkan produk:", error.response?.data?.message || error.message); // Tetap log error penting
      const errorMessage = error.response?.data?.message || "Gagal menambahkan produk";
      alert(errorMessage);
    } finally {
      setLoading(false); // Mengakhiri indikator loading.
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Tambah Produk</h1>
        
        {userRole === 'STAZ' && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
            <strong>Info:</strong> Sebagai Staff, produk yang Anda tambahkan akan memerlukan persetujuan dari Manager terlebih dahulu.
          </div>
        )}
        
        <div className="bg-white shadow rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Produk */}
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

            {/* Kategori */}
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

            {/* Stok */}
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

            {/* Satuan */}
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

            {/* Status (hanya untuk Manager) */}
            {userRole === 'MANAGER' && (
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

            {/* Lokasi Gudang - PERBAIKAN UTAMA DI SINI */}
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
                {/* Pastikan `location.id` dan `location.nama` sesuai dengan respons API dari backend */}
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.nama} - {location.alamat} {/* Menggunakan 'nama' dan 'alamat' sesuai skema DB */}
                  </option>
                ))}
              </select>
              
              {/* Indikator loading atau kosong */}
              {locations.length === 0 && (
                <div className="text-yellow-600 text-sm mt-2">
                  Loading lokasi gudang... (atau tidak ada data lokasi)
                </div>
              )}
              
              {/* Indikator sukses load data */}
              {locations.length > 0 && (
                <div className="text-green-600 text-sm mt-2">
                  {locations.length} lokasi gudang berhasil dimuat
                </div>
              )}
            </div>

            {/* Tombol Submit dan Batal */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`px-6 py-3 rounded-md text-white font-medium ${
                  loading ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                }`}
              >
                {loading ? "Menyimpan..." : userRole === 'STAZ' ? "Kirim Permintaan" : "Tambah Produk"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/inventory")}
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