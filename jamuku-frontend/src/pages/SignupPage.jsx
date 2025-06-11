import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Ini berfungsi untuk navigasi dan link antar halaman.
import { motion } from "framer-motion"; // Ini berfungsi untuk animasi UI.
import Particles from "react-tsparticles"; // Ini berfungsi untuk efek partikel latar belakang.
import { loadFull } from "tsparticles"; // Ini berfungsi untuk memuat konfigurasi partikel.
import GlitterEffect from "./GlitterEffect"; // Pastikan path ini benar. Ini berfungsi untuk efek kilauan.
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // Ini berfungsi untuk ikon mata (show/hide password).
import axios from "axios"; // Ini berfungsi untuk membuat permintaan HTTP ke API backend.

// Ini berfungsi untuk menentukan base URL API backend.
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

// Ini berfungsi untuk halaman pendaftaran (Sign Up) pengguna baru.
export default function SignupPage() {
    // Ini berfungsi untuk mengarahkan pengguna ke halaman lain.
    const navigate = useNavigate();
    // Ini berfungsi untuk menyimpan konfigurasi partikel latar belakang.
    const [particlesOptions, setParticlesOptions] = useState({});
    // Ini berfungsi untuk mengontrol visibilitas password.
    const [showPassword, setShowPassword] = useState(false);

    // Ini berfungsi untuk menyimpan nilai input username.
    const [username, setUsername] = useState("");
    // Ini berfungsi untuk menyimpan nilai input password.
    const [password, setPassword] = useState("");
    // Ini berfungsi untuk menyimpan nilai input konfirmasi password.
    const [confPassword, setConfPassword] = useState("");
    // Ini berfungsi untuk menyimpan status checkbox "Ingat saya".
    const [rememberMe, setRememberMe] = useState(false); // Meskipun tidak digunakan di backend untuk signup, ini bisa relevan untuk login.
    // Ini berfungsi untuk menampilkan pesan sukses atau error kepada pengguna.
    const [msg, setMsg] = useState("");

    // Ini berfungsi untuk menginisialisasi library particles.
    const particlesInit = async (main) => {
        await loadFull(main);
    };

    // Ini berfungsi untuk memuat konfigurasi partikel dari file JSON.
    useEffect(() => {
        fetch("/particles.json")
            .then((res) => res.json())
            .then((data) => setParticlesOptions(data));
    }, []); // Dependency kosong, berjalan sekali saat mount.

    // Ini berfungsi untuk menangani proses pendaftaran pengguna baru.
    const handleRegister = async (e) => {
        e.preventDefault(); // Mencegah perilaku default form submit (reload halaman).
        setMsg(""); // Bersihkan pesan sebelumnya.

        // Ini berfungsi untuk validasi panjang password.
        if (password.length < 6) {
            const errorMessage = "Password minimal 6 karakter.";
            setMsg(errorMessage);
            alert(errorMessage);
            return;
        }

        // Ini berfungsi untuk validasi kesesuaian password dan konfirmasi password.
        if (password !== confPassword) {
            const errorMessage = "Password dan konfirmasi password tidak cocok.";
            setMsg(errorMessage);
            alert(errorMessage);
            return;
        }

        try {
            // Ini berfungsi untuk mengirim permintaan POST ke endpoint '/api/register' di backend.
            const response = await axios.post(`${API_BASE}/api/register`, {
                username: username,
                password: password,
                confPassword: confPassword, // Kirim konfirmasi password untuk validasi backend.
                role: "STAZ" // Tetapkan role default sebagai STAZ saat pendaftaran.
            });

            setMsg(response.data.message); // Set pesan sukses dari respons backend.
            alert(response.data.message); // Tampilkan alert juga untuk konfirmasi.

            // Ini berfungsi untuk mengarahkan pengguna ke halaman login setelah pendaftaran berhasil.
            // Jika status adalah "pending_approval", berikan informasi kepada pengguna.
            setTimeout(() => {
                navigate("/login");
            }, 3000); // Redirect setelah 3 detik.

        } catch (error) {
            // Ini berfungsi untuk menangani error dari permintaan HTTP.
            if (error.response) {
                // Jika ada respons dari server (misal status 4xx atau 5xx).
                setMsg(error.response.data.message); // Ambil pesan error dari respons backend.
                alert(error.response.data.message); // Tampilkan alert error.
            } else {
                // Jika tidak ada respons dari server (misal masalah jaringan).
                setMsg("Terjadi kesalahan jaringan atau server.");
                alert("Terjadi kesalahan jaringan atau server.");
            }
            console.error("Error during registration:", error); // Log error lengkap ke konsol untuk debugging.
        }
    };

    return (
        <div className="relative w-full h-full min-h-screen m-0 p-0">
            <div
                className="fixed inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://i.pinimg.com/736x/b2/29/1c/b2291c7633bcfe69cb7b3b7ba0d814ab.jpg')" }}
            />
            <div className="fixed inset-0 bg-black/50" />
            <Particles
                id="tsparticles"
                init={particlesInit}
                options={particlesOptions}
                className="fixed inset-0"
            />

            <div className="fixed inset-0 flex items-center justify-center">
                <motion.div
                    className="relative z-20 bg-black/10 rounded-2xl p-8 w-[350px] border border-green-400/30 backdrop-blur-sm text-white"
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <GlitterEffect className="absolute -top-2 -left-2" />
                    <GlitterEffect className="absolute -bottom-2 -right-2" />

                    <h2 className="text-3xl font-bold text-center mb-6">Sign Up</h2>
                    {msg && ( // Ini berfungsi untuk menampilkan pesan sukses/error.
                        <p className={`text-center mb-4 ${msg.includes("berhasil") ? "text-green-400" : "text-red-400"}`}>
                            {msg}
                        </p>
                    )}
                    <form onSubmit={handleRegister}> {/* Ini berfungsi untuk menangani submit form pendaftaran. */}
                        <div className="mb-4">
                            <label className="block mb-1">Username</label>
                            <input
                                name="username"
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400"
                                required
                            />
                        </div>

                        <div className="mb-4">
                            <label className="block mb-1">Password</label>
                            <div className="relative">
                                <input
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400 pr-10"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white text-xl"
                                >
                                    {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
                                </button>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block mb-1">Konfirmasi Password</label>
                            <input
                                type="password"
                                value={confPassword}
                                onChange={(e) => setConfPassword(e.target.value)}
                                className="w-full px-3 py-2 rounded bg-gray-900/30 focus:outline-none focus:ring-2 focus:ring-green-400"
                                required
                            />
                        </div>

                        <div className="mb-6 flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="rememberMe"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="accent-green-400"
                            />
                            <label htmlFor="rememberMe" className="text-sm text-white">
                                Ingat saya
                            </label>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded transition-transform transform hover:scale-105"
                        >
                            Sign Up
                        </button>
                    </form>
                    <p className="text-center text-sm text-white mt-4">
                        Sudah punya akun? <Link to="/login" className="text-green-400 hover:underline">Login di sini</Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}