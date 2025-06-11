import React, { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

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

    const menuItems = useMemo(() => [
        { path: dashboardPath, icon: '🏠', label: 'Dashboard' },
        { path: '/inventory', icon: '📦', label: 'Inventory' },
        { path: '/transactions', icon: '📋', label: 'Transaksi' },
        ...(role === 'MANAGER' ? [
            { path: '/users', icon: '👥', label: 'User List' },
            { path: '/lokasi-gudang', icon: '🏢', label: 'Lokasi Gudang' }
        ] : [])
    ], [dashboardPath, role]);

    return (
        <>
            {isMobile && isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 opacity-100"
                    onClick={toggleMobileSidebar}
                ></div>
            )}

            <div className={`
                fixed left-0 top-0 h-full bg-gradient-to-b from-green-800 to-green-900 text-white shadow-2xl
                transition-all duration-300 ease-in-out z-50 overflow-hidden flex flex-col
                ${isMobile
                    ? (isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full')
                    : (isCollapsed ? 'w-20' : 'w-64')
                }
                ${!isMobile && 'block'}
            `}>
                {/* Header Sidebar with logo above text */}
                <div className="p-4 border-b border-green-700 relative">
                    <div className={`flex flex-col items-center transition-all duration-300
                        ${isCollapsed && !isMobile ? 'pt-2' : ''}
                    `}>
                        <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-xl shadow-lg">
                            🌿
                        </div>
                        <div className={`
                            overflow-hidden whitespace-nowrap transition-all duration-300 ease-in-out text-center
                            ${!isCollapsed || (isMobile && isSidebarOpen) ? 'max-w-xs opacity-100 mt-2' : 'max-w-0 opacity-0'}
                        `}>
                            <h1 className="text-xl font-bold">Warehouse System</h1>
                            <p className="text-green-300 text-sm">Jamu Tradisional</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={isMobile ? toggleMobileSidebar : () => setIsCollapsed(!isCollapsed)}
                        className={`
                            p-2 hover:bg-green-700 rounded-lg transition-colors duration-200 absolute top-3 right-3
                            ${isMobile ? 'block md:hidden' : 'hidden md:block'}
                        `}
                        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {isMobile ? (
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"></path></svg>
                        ) : (
                            <svg className={`w-5 h-5 text-white transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                            </svg>
                        )}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={isMobile ? toggleMobileSidebar : undefined}
                            className={`
                                relative flex items-center gap-3 py-3 rounded-lg transition-all duration-200
                                hover:bg-green-700 hover:shadow-lg group whitespace-nowrap overflow-hidden
                                ${location.pathname.startsWith(item.path)
                                    ? 'bg-green-700 shadow-lg border-l-4 border-green-400'
                                    : ''
                                }
                                ${!isCollapsed || (isMobile && isSidebarOpen) ? 'px-6' : 'px-0 justify-center'}
                            `}
                        >
                            <span className="text-lg flex-shrink-0">
                                {item.icon}
                            </span>
                            <span className={`
                                font-medium transition-opacity duration-300 ease-in-out
                                ${!isCollapsed || (isMobile && isSidebarOpen) ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}
                            `}>
                                {item.label}
                            </span>
                            {isCollapsed && !isMobile && (
                                <div className="absolute left-full ml-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                    {item.label}
                                </div>
                            )}
                        </Link>
                    ))}
                </nav>

                {/* Logout Button */}
                <div className="p-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className={`
                            w-full flex items-center gap-3 py-3 rounded-lg bg-red-600 hover:bg-red-700
                            transition-colors duration-200 shadow-lg flex-shrink-0
                            ${isCollapsed && (!isMobile) ? 'justify-center' : ''}
                            ${!isCollapsed || (isMobile && isSidebarOpen) ? 'px-6' : 'px-0'}
                        `}
                    >
                        <span className="text-lg flex-shrink-0">
                            🚪
                        </span>
                        <span className={`
                            font-medium transition-opacity duration-300 ease-in-out
                            ${!isCollapsed || (isMobile && isSidebarOpen) ? 'opacity-100 max-w-xs' : 'opacity-0 max-w-0'}
                        `}>
                            Logout
                        </span>
                        {isCollapsed && !isMobile && (
                            <div className="absolute left-full ml-3 px-3 py-1 bg-gray-800 text-white text-sm rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                                Logout
                            </div>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};

export default Sidebar;