import { Heart, Github, Twitter, Linkedin, Star, Terminal, Zap, Shield, Sparkles } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative mt-32 border-t border-gray-200/50 dark:border-slate-800 bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl overflow-hidden">
            {/* Decorative Background Glows */}
            <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/5 dark:bg-purple-400/5 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-6 py-16 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
                    {/* Brand Section */}
                    <div className="md:col-span-5 space-y-6">
                        <div className="flex items-center space-x-2">
                            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                                Interview <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Buddy</span>
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 text-lg leading-relaxed max-w-md">
                            The ultimate AI interview simulator designed to turn nervous candidates into confident professionals.
                        </p>
                    </div>

                    {/* Features/Quick Links */}
                    <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Product</h4>
                            <ul className="space-y-3">
                                <li><a href="#presets-section" className="text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Interview Presets</a></li>
                                <li><a href="#" className="text-gray-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">Custom Setup</a></li>
                            </ul>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Support</h4>
                            <div className="bg-blue-600/5 dark:bg-blue-400/5 rounded-2xl p-4 border border-blue-200/20 dark:border-blue-500/10">
                                <p className="text-xs text-gray-500 dark:text-slate-400 font-medium mb-3">Found a bug? Help us improve!</p>
                                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                                    <Star className="w-3 h-3 fill-current" /> Star on GitHub
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-gray-200/50 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium flex items-center gap-2">
                            © {currentYear} Interview Buddy. Built with <Heart className="w-4 h-4 text-rose-500 fill-current animate-pulse" />
                        </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-100 dark:bg-slate-800/50 rounded-full border border-gray-200/50 dark:border-slate-700/50">
                        <Terminal className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-tighter">
                            Designed by Ritik Parihar & Team
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
