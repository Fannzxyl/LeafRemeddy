import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

// Menerima props baru dari DashboardLayout
const Sidebar = ({ isCollapsed, setIsCollapsed, isMobile, isSidebarOpen, toggleMobileSidebar }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [dashboardPath, setDashboardPath] = useState('/dashboard-manager');
    const [role, setRole] = useState(null);

    useEffect(() => {
        const userRole = localStorage.getItem('role');
        setRole(userRole);

        if (userRole === 'STAZ') {
            setDashboardPath('/dashboard-staz');
        } else {
            setDashboardPath('/dashboard-manager');
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('role');
        navigate('/login');
    };

    const menuItems = [
        { path: dashboardPath, icon: '🏠', label: 'Dashboard' },
        { path: '/inventory', icon: '📦', label: 'Inventory' },
        { path: '/transactions', icon: '📋', label: 'Transaksi' },
        ...(role === 'MANAGER' ? [
            { path: '/users', icon: '👥', label: 'User List' },
            { path: '/lokasi-gudang', icon: '🏢', label: 'Lokasi Gudang' }
        ] : [])
    ];

    return (
        <div className={`
            fixed left-0 top-0 h-full bg-gradient-to-b from-green-800 to-green-900 text-white shadow-2xl
            transition-all duration-300 z-50
            ${isMobile ?
                (isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full') :
                (isCollapsed ? 'w-20' : 'w-64')
            }
            ${!isMobile && 'block'}
        `}>
            {/* Header */}
            <div className="p-6 border-b border-green-700">
                <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-3 ${isCollapsed && (!isMobile) ? 'justify-center' : ''}`}> {/* Perbaikan di sini */}
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-xl shadow-lg">
                            🌿
                        </div>
                        {/* Judul & Subjudul hanya terlihat saat tidak collapsed atau di mobile saat sidebar terbuka */}
                        {(!isCollapsed || (isMobile && isSidebarOpen)) && ( /* Perbaikan di sini */
                            <div>
                                <h1 className="text-xl font-bold">Warehouse System</h1>
                                <p className="text-green-300 text-sm">Jamu Tradisional</p>
                            </div>
                        )}
                    </div>
                    {/* Tombol Toggle Sidebar (untuk desktop atau menutup di mobile) */}
                    <button
                        onClick={isMobile ? toggleMobileSidebar : () => setIsCollapsed(!isCollapsed)}
                        className="p-2 hover:bg-green-700 rounded-lg transition-colors hidden md:block" // Tombol ini hanya untuk desktop
                    >
                        <svg className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                    {/* Tombol X untuk menutup di mobile (saat sidebar terbuka) */}
                    {(isMobile && isSidebarOpen) && ( /* Perbaikan di sini */
                        <button
                            onClick={toggleMobileSidebar}
                            className="p-2 hover:bg-green-700 rounded-lg transition-colors absolute top-4 right-4" // Posisi relatif terhadap sidebar
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
                {menuItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 hover:bg-green-700 hover:shadow-lg group ${
                            location.pathname.startsWith(item.path)
                                ? 'bg-green-700 shadow-lg border-l-4 border-green-400'
                                : ''
                        }`}
                        title={isCollapsed && (!isMobile) ? item.label : ''} // Tooltip hanya di desktop saat collapsed
                    >
                        <span className="text-lg">{item.icon}</span>
                        {/* Label hanya terlihat saat tidak collapsed dan bukan mobile, atau saat mobile dan sidebar terbuka */}
                        {(!isCollapsed || (isMobile && isSidebarOpen)) && <span className="font-medium">{item.label}</span>} {/* Perbaikan di sini */}
                        {isCollapsed && (!isMobile) && ( /* Perbaikan di sini */
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                {item.label}
                            </div>
                        )}
                    </Link>
                ))}
            </nav>

            {/* Logout Button */}
            <div className="p-4">
                <button
                    onClick={handleLogout}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-600 hover:bg-red-700 transition-colors duration-200 shadow-lg ${
                        isCollapsed && (!isMobile) ? 'justify-center' : '' /* Perbaikan di sini */
                    }`}
                    title={isCollapsed && (!isMobile) ? 'Logout' : ''} // Tooltip hanya di desktop saat collapsed
                >
                    <span className="text-lg">🚪</span>
                    {(!isCollapsed || (isMobile && isSidebarOpen)) && <span className="font-medium">Logout</span>} {/* Perbaikan di sini */}
                </button>
            </div>
        </div>
    );
};

export default Sidebar;