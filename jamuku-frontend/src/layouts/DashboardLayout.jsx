// src/layouts/DashboardLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function DashboardLayout({ children }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main className={`transition-all duration-300 min-h-screen ${
                isMobile ? 'ml-0' : (isCollapsed ? 'ml-20' : 'ml-64')
            }`}>
                <div className="transition-all duration-300 ease-in-out">
                    <div className="max-w-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}