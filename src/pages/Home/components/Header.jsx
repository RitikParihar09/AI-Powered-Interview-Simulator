import { LogOut, History, User, LayoutGrid, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Header = ({ onLoginClick, onSignupClick, onDashboardClick }) => {
    const { currentUser, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error("Failed to logout", error);
        }
    };

    // SCROLL FUNCTION
    const scrollToPresets = () => {
        const element = document.getElementById('presets-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Common separator style
    const separatorClass = "border-r border-gray-300 dark:border-gray-700 pr-4 mr-2";

    return (
        <header className="sticky top-2 md:top-4 mx-2 md:mx-auto max-w-7xl bg-white/70 dark:bg-slate-900/70 backdrop-blur-md shadow-lg z-30 transition-all duration-300 border border-gray-200/50 dark:border-slate-800 rounded-xl md:rounded-2xl overflow-hidden">
            <div className="container mx-auto px-4 md:px-6 py-3 md:py-4 flex justify-between items-center">
                {/* Logo */}
                <div
                    className="flex items-center space-x-1 cursor-pointer shrink-0"
                    onClick={() => navigate('/')}
                >
                    <span className="text-lg md:text-2xl font-black tracking-tight text-gray-800 dark:text-white">
                        Interview <span className="text-blue-600 dark:text-blue-400">Buddy</span>
                    </span>
                </div>

                <div className="flex items-center gap-1.5 md:gap-2">

                    {currentUser ? (
                        // ✅ LOGGED IN VIEW
                        <>
                            {/* 1. User Name + Separator */}
                            <span className={`hidden lg:flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium ${separatorClass}`}>
                                <User className="w-4 h-4" />
                                {currentUser.email?.split('@')[0]}
                            </span>

                            {/* 2. PRESETS BUTTON + Separator */}
                            <button
                                onClick={scrollToPresets}
                                className={`hidden lg:flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium ${separatorClass}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Presets
                            </button>

                            {/* 3. History Button + Separator */}
                            <button
                                onClick={onDashboardClick}
                                className={`text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold flex items-center gap-1.5 md:gap-2 ${separatorClass}`}
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">History</span>
                            </button>

                            {/* 4. Logout Button */}
                            <button
                                onClick={handleLogout}
                                className="bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 font-semibold px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2 mr-1 md:mr-2 text-sm md:text-base"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </>
                    ) : (
                        // ✅ GUEST VIEW
                        <>
                            {/* Presets + Separator */}
                            <button
                                onClick={scrollToPresets}
                                className={`hidden lg:flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold ${separatorClass}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Presets
                            </button>

                            <div className="flex items-center space-x-3 md:space-x-4 pr-3 md:pr-4 border-r border-gray-300 dark:border-gray-700 mr-1 md:mr-2">
                                <button
                                    onClick={onLoginClick}
                                    className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold text-sm md:text-base"
                                >
                                    Login
                                </button>
                                <button
                                    onClick={onSignupClick}
                                    className="bg-blue-600 text-white font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base whitespace-nowrap"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </>
                    )}

                    {/* 5. NIGHT MODE TOGGLE (Last Item) */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all transform hover:scale-105 shadow-sm shrink-0"
                        aria-label="Toggle Dark Mode"
                    >
                        {theme === 'dark' ? (
                            <Sun className="w-4 h-4 md:w-5 md:h-5 fill-current" />
                        ) : (
                            <Moon className="w-4 h-4 md:w-5 md:h-5 fill-current text-slate-600" />
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;