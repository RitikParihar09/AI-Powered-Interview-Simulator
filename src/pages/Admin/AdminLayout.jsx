import React from 'react';
import { 
    LayoutDashboard, 
    BookOpen, 
    Grid, 
    Building2, 
    UserCircle, 
    Tag, 
    FileText, 
    BarChart3, 
    Users, 
    Settings, 
    LogOut,
    ChevronDown,
    Sun,
    Moon,
    Layout
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const AdminLayout = ({ children }) => {
    const { isAdmin, logout, currentUser, loading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const location = useLocation();
    const navigate = useNavigate();

    
    React.useEffect(() => {
        if (!loading && !isAdmin) {
            navigate('/');
        }
    }, [isAdmin, loading, navigate]);

    if (loading || !isAdmin) {
        return null; // Wait for loading or block if not admin
    }



    const menuItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin-panel/dashboard' },
        { icon: Layout, label: 'Presets', path: '/admin-panel/presets' },
        { icon: BookOpen, label: 'Question Bank', path: '/admin-panel/questions' },
        { icon: Building2, label: 'Companies', path: '/admin-panel/companies' },
        { icon: UserCircle, label: 'Roles', path: '/admin-panel/roles' },
        { icon: Tag, label: 'Tags', path: '/admin-panel/tags' },
        { icon: Settings, label: 'Settings', path: '/admin-panel/settings' },
    ];

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to log out", error);
        }
    };

    return (
        <div className={`flex h-screen ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'} text-slate-300 font-inter overflow-hidden transition-colors duration-500`}>
            {/* SIDEBAR */}
            <aside className={`w-72 ${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50' : 'bg-white border-slate-200'} border-r flex flex-col transition-colors duration-500`}>
                {/* LOGO */}
                <div className="p-8">
                    <div>
                        <h1 className={`text-xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight text-center`}>Interview Buddy</h1>
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest text-center">Admin Panel</p>
                    </div>
                </div>

                {/* NAV */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
                                    isActive 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                    : theme === 'dark' 
                                        ? 'hover:bg-slate-800/50 text-slate-400 hover:text-white' 
                                        : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : theme === 'dark' ? 'text-slate-500' : 'text-slate-400'}`} />
                                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* THEME TOGGLE & USER PROFILE */}
                <div className={`p-6 border-t ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-200'}`}>
                    
                    {/* Theme Toggle Slider */}
                    <div className={`mb-6 p-1 rounded-2xl flex items-center justify-between ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-100'}`}>
                        <button 
                            onClick={() => theme !== 'light' && toggleTheme()}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            <Sun className="w-3.5 h-3.5" />
                            Light
                        </button>
                        <button 
                            onClick={() => theme !== 'dark' && toggleTheme()}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${theme === 'dark' ? 'bg-slate-900 text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-600'}`}
                        >
                            <Moon className="w-3.5 h-3.5" />
                            Dark
                        </button>
                    </div>

                    <div className={`${theme === 'dark' ? 'bg-slate-800/40 hover:bg-slate-800/60' : 'bg-slate-100 hover:bg-slate-200'} rounded-2xl p-4 flex items-center justify-between group cursor-pointer transition-colors`}>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {currentUser?.email?.[0].toUpperCase() || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Admin User</p>
                                <p className="text-[10px] text-slate-500 truncate lowercase">{currentUser?.email}</p>
                            </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                    </div>

                    <button 
                        onClick={handleLogout}
                        className="w-full mt-4 flex items-center gap-4 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-all duration-300 group"
                    >
                        <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="font-bold text-sm">Logout</span>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <main className={`flex-1 overflow-y-auto ${theme === 'dark' ? 'bg-[#020617]' : 'bg-slate-50'} transition-colors duration-500 scroll-smooth`}>
                {children}
            </main>
        </div>

    );
};

export default AdminLayout;
