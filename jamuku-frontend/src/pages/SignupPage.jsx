import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";
import GlitterEffect from "./GlitterEffect";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";

export default function SignupPage() {
  const navigate = useNavigate();
  const [particlesOptions, setParticlesOptions] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const particlesInit = async (main) => {
    await loadFull(main);
  };

  useEffect(() => {
    fetch("/particles.json")
      .then((res) => res.json())
      .then((data) => setParticlesOptions(data));
  }, []);

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
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const username = e.target.username.value;
              const password = e.target.password.value;

              if (password.length < 6) {
                alert("Password minimal 6 karakter.");
                return;
              }

              if (password !== confirmPassword) {
                alert("Password dan konfirmasi tidak cocok.");
                return;
              }

              try {
                const response = await fetch("/api/signup", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (!response.ok) {
                  alert(data.message || "Signup gagal");
                  return;
                }

                alert(data.message);
                if (rememberMe) localStorage.setItem("rememberedUsername", username);
                navigate("/");
              } catch (err) {
                alert("Terjadi kesalahan saat signup.");
                console.error(err);
              }
            }}
          >
            <div className="mb-4">
              <label className="block mb-1">Username</label>
              <input
                name="username"
                type="text"
                defaultValue={localStorage.getItem("rememberedUsername") || ""}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
        </motion.div>
      </div>
    </div>
  );
}