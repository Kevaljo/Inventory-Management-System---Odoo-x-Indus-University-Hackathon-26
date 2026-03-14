import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiBox, FiTrendingUp, FiLogOut, FiTrendingDown, FiRefreshCw, FiLayers, FiMapPin, FiActivity, FiSettings } from 'react-icons/fi';

const Layout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/', label: 'Dashboard', icon: FiHome },
        { path: '/products', label: 'Products', icon: FiBox },
        { path: '/categories', label: 'Categories', icon: FiLayers },
        { path: '/receipts', label: 'Receipts', icon: FiTrendingDown },
        { path: '/deliveries', label: 'Deliveries', icon: FiTrendingUp },
        { path: '/transfers', label: 'Transfers', icon: FiRefreshCw },
        { path: '/adjustments', label: 'Adjustments', icon: FiActivity },
        { path: '/warehouses', label: 'Warehouses', icon: FiMapPin },
        { path: '/moves', label: 'Stock Moves', icon: FiTrendingUp },
    ];

    return (
        <div className="flex h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-slate-950 to-black text-slate-100 overflow-hidden relative font-['Plus_Jakarta_Sans']">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-[20%] w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] pointer-events-none"></div>

            {/* Sidebar */}
            <aside className="w-64 glass-panel border-r border-white/5 flex flex-col relative z-20 shadow-2xl">
                <div className="h-16 flex items-center px-6 font-bold text-xl border-b border-white/10 tracking-tight">
                    <span className="text-indigo-400 mr-1 text-glow">Core</span><span className="font-light tracking-wide text-white">Inventory</span>
                </div>

                <div className="p-4 border-b border-white/10 bg-white/5 backdrop-blur-md">
                    <div className="text-[10px] text-indigo-300 uppercase tracking-widest mb-1 font-semibold">Active Company</div>
                    <div className="font-medium truncate text-white">{user?.company?.name || 'My Company'}</div>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-thin">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 ${isActive ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 translate-x-1 border border-white/20' : 'text-slate-400 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
                        >
                            <item.icon className={`w-5 h-5 ${item.path === location.pathname ? 'animate-pulse' : ''}`} />
                            <span className="font-medium text-sm">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-white/10 bg-black/20 backdrop-blur-xl">
                    <div className="flex items-center space-x-3 px-4 mb-4">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold shadow-lg shadow-purple-500/30 text-white">
                            {user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <div className="text-sm font-semibold truncate text-white">{user?.name}</div>
                            <div className="text-xs text-indigo-300 truncate">{user?.email}</div>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="group flex items-center justify-center space-x-3 w-full px-4 py-2.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 border border-transparent hover:border-rose-500/20 rounded-xl transition-all duration-300">
                        <FiLogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-medium text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                <header className="h-16 glass-card border-b border-white/5 flex items-center px-8 justify-between sticky top-0 z-30">
                    <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-purple-300 tracking-tight text-glow">Odoo Hackathon '26</h2>
                    <div className="flex items-center gap-4">
                       <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div>
                       <span className="text-xs font-medium text-emerald-400">System Online</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin">
                    <div className="animate-fade-in-up">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
