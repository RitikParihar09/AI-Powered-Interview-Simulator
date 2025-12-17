import React from 'react';
import { LogOut, History, User, LayoutGrid } from 'lucide-react'; 
import { useAuth } from '../context/AuthContext'; 

const Header = ({ onLoginClick, onSignupClick, onDashboardClick }) => {
    const { currentUser, logout } = useAuth(); 

    const handleLogout = async () => {
        try {
            await logout();
            window.location.reload(); 
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
    const separatorClass = "border-r border-gray-300 pr-4 mr-2";

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm z-30">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo */}
                <div 
                    className="flex items-center space-x-1 cursor-pointer" 
                    onClick={() => window.location.reload()}
                >
                    <span className="text-2xl font-bold text-gray-800">
                        Interview <span className="text-blue-600">Buddy</span>
                    </span>
                </div>

                <div className="flex items-center">
                    
                    {currentUser ? (
                        // ✅ LOGGED IN VIEW
                        <>
                            {/* 1. User Name + Separator */}
                            <span className={`hidden md:flex items-center gap-2 text-sm text-gray-500 font-medium ${separatorClass}`}>
                                <User className="w-4 h-4" />
                                {currentUser.email?.split('@')[0]}
                            </span>

                            {/* 2. PRESETS BUTTON + Separator */}
                            <button 
                                onClick={scrollToPresets}
                                className={`hidden md:flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium ${separatorClass}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Presets
                            </button>

                            {/* 3. History Button + Separator */}
                            <button 
                                onClick={onDashboardClick} 
                                className={`text-gray-600 hover:text-blue-600 transition-colors font-semibold flex items-center gap-2 ${separatorClass}`}
                            >
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">History</span>
                            </button>
                            
                            {/* 4. Logout Button (No Separator) */}
                            <button 
                                onClick={handleLogout} 
                                className="bg-gray-100 text-gray-700 font-semibold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
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
                                className={`hidden md:flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-semibold ${separatorClass}`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Presets
                            </button>

                            <div className="flex items-center space-x-4">
                                <button 
                                    onClick={onLoginClick} 
                                    className="text-gray-600 hover:text-blue-600 transition-colors font-semibold"
                                >
                                    Login
                                </button>
                                <button 
                                    onClick={onSignupClick} 
                                    className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Sign Up
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;