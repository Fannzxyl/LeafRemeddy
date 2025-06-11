// src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); // State baru untuk sidebar di mobile

    useEffect(() => {
        const handleResize = () => {
            const mobileThreshold = 768; // Tailwind's 'md' breakpoint
            setIsMobile(window.innerWidth < mobileThreshold);
            // Di desktop, jika kembali dari mobile, pastikan sidebar tidak tersembunyi sepenuhnya
            if (window.innerWidth >= mobileThreshold) {
                setIsSidebarOpen(true); // Selalu buka di desktop
            } else {
                setIsSidebarOpen(false); // Tutup secara default di mobile
            }
        };

        handleResize(); // Set initial state
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect untuk menangani collapse di desktop dan overlay di mobile
    useEffect(() => {
        if (!isMobile) {
            // Jika di desktop, atur isSidebarOpen berdasarkan isCollapsed
            setIsSidebarOpen(!isCollapsed);
        }
    }, [isMobile, isCollapsed]);


    // Fungsi untuk toggle sidebar di mobile
    const toggleMobileSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    // Efek untuk mengelola overflow body saat sidebar mobile terbuka/tertutup
    useEffect(() => {
        if (isMobile && isSidebarOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = ''; // Cleanup saat komponen di-unmount
        };
    }, [isMobile, isSidebarOpen]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            {/* Overlay untuk mobile saat sidebar terbuka */}
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
                    onClick={toggleMobileSidebar} // Tutup sidebar saat overlay diklik
                ></div>
            )}

            <Sidebar
                isCollapsed={isCollapsed}
                setIsCollapsed={setIsCollapsed}
                isMobile={isMobile} // Teruskan state mobile ke Sidebar
                isSidebarOpen={isSidebarOpen} // Teruskan state sidebar open ke Sidebar
                toggleMobileSidebar={toggleMobileSidebar} // Teruskan fungsi toggle
            />

            <main className={`
                transition-all duration-300 min-h-screen
                ${isMobile ?
                    'ml-0' : // Di mobile, main tidak punya margin kiri tetap (sidebar overlay)
                    (isCollapsed ? 'ml-20' : 'ml-64') // Di desktop, margin sesuai sidebar
                }
            `}>
                {/* Tombol Hamburger untuk Mobile */}
                {isMobile && (
                    <button
                        onClick={toggleMobileSidebar}
                        className="fixed top-4 left-4 z-30 p-2 bg-green-600 text-white rounded-md shadow-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                )}

                <div className="transition-all duration-300 ease-in-out">
                    {/* Atur padding di sini agar tidak tertimpa tombol hamburger */}
                    <div className={`max-w-full ${isMobile ? 'pt-16 px-4' : ''}`}> {/* Tambahkan padding atas untuk mobile */}
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}