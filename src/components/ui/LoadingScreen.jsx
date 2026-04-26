import React, { useState, useEffect } from 'react';
import { Bot, Cpu, ShieldCheck, Database, Radio, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const LoadingScreen = ({ interviewData }) => {
    const { theme } = useTheme();
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    const role = interviewData?.role || "Candidate";
    const company = interviewData?.company || "System";

    const loadingSteps = [
        `Establishing secure connection to ${company} servers...`,
        `Analyzing requirements for ${role} role...`,
        "Calibrating AI Interviewer parameters...",
        "Loading behavioral & technical modules...",
        "System initialization complete."
    ];

    useEffect(() => {
        // Duration to reach 100% in ~5 seconds (100 ticks at 50ms each)
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Increment for 5s duration: ~1% per tick (average)
                const increment = Math.random() * 0.8 + 0.6; // Random between 0.6 and 1.4
                return Math.min(prev + increment, 100);
            });
        }, 50);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Map progress (0-100) to steps (0 - length-1)
        const stepIndex = Math.floor((progress / 100) * (loadingSteps.length));
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));
    }, [progress]);

    return (
        <div className="fixed inset-0 bg-white dark:bg-[#020617] z-50 flex flex-col items-center justify-center overflow-hidden font-sans transition-colors duration-500">

            {/* Background Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none transition-all duration-500"
                style={{
                    backgroundImage: theme === 'dark'
                        ? 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)'
                        : 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            ></div>

            {/* Decorative Colored Dots - Same as home page */}
            <div className="absolute top-20 left-[15%] w-3 h-3 bg-green-400 dark:bg-green-500 rounded-full blur-[2px] opacity-60 dark:opacity-40 pointer-events-none animate-pulse"></div>
            <div className="absolute top-[30%] right-[20%] w-2.5 h-2.5 bg-pink-400 dark:bg-pink-500 rounded-full blur-[2px] opacity-60 dark:opacity-40 pointer-events-none" style={{ animation: 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="absolute bottom-[35%] left-[25%] w-2 h-2 bg-blue-400 dark:bg-blue-500 rounded-full blur-[1px] opacity-60 dark:opacity-40 pointer-events-none animate-pulse"></div>
            <div className="absolute top-[45%] right-[15%] w-3 h-3 bg-purple-400 dark:bg-purple-500 rounded-full blur-[2px] opacity-50 dark:opacity-30 pointer-events-none" style={{ animation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="absolute bottom-[20%] right-[30%] w-2.5 h-2.5 bg-cyan-400 dark:bg-cyan-500 rounded-full blur-[2px] opacity-60 dark:opacity-40 pointer-events-none animate-pulse"></div>
            <div className="absolute top-[15%] right-[35%] w-2 h-2 bg-emerald-400 dark:bg-emerald-500 rounded-full blur-[1px] opacity-50 dark:opacity-35 pointer-events-none animate-pulse"></div>
            <div className="absolute bottom-[45%] right-[10%] w-3 h-3 bg-rose-400 dark:bg-rose-500 rounded-full blur-[2px] opacity-60 dark:opacity-40 pointer-events-none" style={{ animation: 'pulse 3.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="absolute top-[60%] left-[10%] w-2.5 h-2.5 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-[2px] opacity-55 dark:opacity-35 pointer-events-none animate-pulse"></div>
            <div className="absolute top-[35%] left-[40%] w-2 h-2 bg-teal-400 dark:bg-teal-500 rounded-full blur-[1px] opacity-60 dark:opacity-40 pointer-events-none" style={{ animation: 'pulse 4.5s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="absolute bottom-[28%] left-[8%] w-3 h-3 bg-fuchsia-400 dark:bg-fuchsia-500 rounded-full blur-[2px] opacity-50 dark:opacity-30 pointer-events-none animate-pulse"></div>
            <div className="absolute top-[50%] right-[40%] w-2.5 h-2.5 bg-lime-400 dark:bg-lime-500 rounded-full blur-[2px] opacity-55 dark:opacity-35 pointer-events-none" style={{ animation: 'pulse 3.2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}></div>
            <div className="absolute bottom-[50%] right-[25%] w-2 h-2 bg-amber-400 dark:bg-amber-500 rounded-full blur-[1px] opacity-60 dark:opacity-40 pointer-events-none animate-pulse"></div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center max-w-2xl w-full px-6">

                {/* AI CORE ANIMATION */}
                <div className="relative mb-12">
                    {/* Pulsing Rings */}
                    <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900 rounded-full animate-ping opacity-20 duration-[2000ms]"></div>
                    <div className="absolute inset-[-12px] border border-blue-200 dark:border-blue-800 rounded-full animate-[spin_4s_linear_infinite] border-t-transparent border-l-transparent"></div>
                    <div className="absolute inset-[-24px] border border-indigo-100 dark:border-indigo-900 rounded-full animate-[spin_6s_linear_infinite_reverse] border-b-transparent border-r-transparent"></div>

                    {/* Central Orb */}
                    <div className="relative w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/30 animate-pulse">
                        <Bot className="w-10 h-10 text-white" />
                    </div>

                    {/* Orbiting Particles */}
                    <div className="absolute top-0 right-0 w-3 h-3 bg-green-400 rounded-full shadow-[0_0_10px_rgba(74,222,128,0.8)] animate-bounce" style={{ animationDuration: '2s' }}></div>
                    <div className="absolute bottom-2 left-[-10px] w-2 h-2 bg-purple-400 rounded-full shadow-[0_0_8px_rgba(192,132,252,0.8)] animate-bounce" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
                </div>

                {/* Status Text Area */}
                <div className="text-center w-full space-y-6">
                    <div>
                        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-400 tracking-tight mb-2">
                            SYSTEM INITIALIZATION
                        </h2>
                        <div className="h-8 flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 font-mono text-sm font-medium">
                            <Radio className="w-4 h-4 animate-pulse" />
                            <span className="typing-effect">{loadingSteps[currentStep]}</span>
                        </div>
                    </div>

                    {/* High-Tech Progress Bar */}
                    <div className="w-full max-w-md mx-auto relative h-2 bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="absolute top-0 left-0 h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.6)] transition-all duration-100 ease-out"
                            style={{ width: `${progress}%` }}
                        >
                            <div className="absolute right-0 top-0 bottom-0 w-[2px] bg-white opacity-50"></div>
                        </div>
                    </div>

                    {/* Stats / Badges */}
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-4 opacity-80">
                        <Badge icon={Cpu} label="AI Core" isActive={progress > 20} />
                        <Badge icon={Database} label="Knowledge Base" isActive={progress > 50} />
                        <Badge icon={ShieldCheck} label="Secure Tunnel" isActive={progress > 80} />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-component for badges
const Badge = ({ icon: Icon, label, isActive }) => (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all duration-500 ${isActive
        ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 scale-100 opacity-100'
        : 'bg-gray-50 dark:bg-slate-800/50 border-gray-100 dark:border-slate-700 text-gray-300 dark:text-gray-600 scale-95 opacity-60'
        }`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
        {isActive && <CheckCircle2 className="w-3 h-3 text-blue-600 dark:text-blue-400 ml-1" />}
    </div>
);

export default LoadingScreen;