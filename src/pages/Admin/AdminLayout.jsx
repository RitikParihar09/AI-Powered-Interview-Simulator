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
    ChevronDown
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children }) => {
    const { isAdmin, logout, currentUser, loading } = useAuth();
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
        <div className="flex h-screen bg-[#020617] text-slate-300 font-inter overflow-hidden">
            {/* SIDEBAR */}
            <aside className="w-72 bg-[#0b1121] border-r border-slate-800/50 flex flex-col">
                {/* LOGO */}
                <div className="p-8">
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight text-center">Interview Buddy</h1>
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
                                    : 'hover:bg-slate-800/50 text-slate-400 hover:text-white'
                                }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                                <span className="font-semibold text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* USER PROFILE */}
                <div className="p-6 border-t border-slate-800/50">
                    <div className="bg-slate-800/40 rounded-2xl p-4 flex items-center justify-between group cursor-pointer hover:bg-slate-800/60 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md">
                                {currentUser?.email?.[0].toUpperCase() || 'A'}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-sm font-bold text-white truncate">Admin User</p>
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
            <main className="flex-1 overflow-y-auto bg-[#020617] scroll-smooth">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
