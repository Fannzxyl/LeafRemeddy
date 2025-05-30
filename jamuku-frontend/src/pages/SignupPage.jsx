import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Tambahkan Link
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import GlitterEffect from "./GlitterEffect"; // Pastikan path ini benar
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import axios from "axios"; // Tambahkan import axios

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000"; // Pastikan API_BASE ada

export default function SignupPage() {
  const navigate = useNavigate();
  const [particlesOptions, setParticlesOptions] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Menggunakan state untuk input form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confPassword, setConfPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [msg, setMsg] = useState(""); // State untuk pesan sukses/error

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  useEffect(() => {
    fetch("/particles.json")
      .then((res) => res.json())
      .then((data) => setParticlesOptions(data));
  }, []);

  // Handler untuk proses pendaftaran
  const handleRegister = async (e) => {
    e.preventDefault();
    setMsg(""); // Bersihkan pesan sebelumnya

    if (password.length < 6) {
      setMsg("Password minimal 6 karakter.");
      alert("Password minimal 6 karakter.");
      return;
    }

    if (password !== confPassword) {
      setMsg("Password dan konfirmasi password tidak cocok.");
      alert("Password dan konfirmasi password tidak cocok.");
      return;
    }

    try {
      // Menggunakan axios untuk mengirim permintaan
      const response = await axios.post(`${API_BASE}/api/register`, {
        username: username,
        password: password,
        confPassword: confPassword, // Kirim konfirmasi password
        role: "STAZ" // Kirim role sebagai STAZ secara eksplisit
      });

      setMsg(response.data.message); // Set pesan sukses dari backend
      alert(response.data.message); // Tampilkan alert juga

      // Redirect berdasarkan status approval
      if (response.data.status === "pending_approval") {
        setTimeout(() => {
          navigate("/login"); // Redirect ke halaman login
        }, 3000); // Redirect setelah 3 detik
      } else {
        setTimeout(() => {
          navigate("/login"); // Redirect ke halaman login
        }, 3000);
      }
    } catch (error) {
      if (error.response) {
        setMsg(error.response.data.message); // Ambil pesan error dari respons backend
        alert(error.response.data.message); // Tampilkan alert error
      } else {
        setMsg("Terjadi kesalahan jaringan atau server.");
        alert("Terjadi kesalahan jaringan atau server.");
      }
      console.error(error); // Log error lengkap ke konsol
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
          {msg && ( // Tampilkan pesan dari state msg
            <p className={`text-center mb-4 ${msg.includes("berhasil") ? "text-green-400" : "text-red-400"}`}>
              {msg}
            </p>
          )}
          <form onSubmit={handleRegister}> {/* Panggil handlerRegister */}
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