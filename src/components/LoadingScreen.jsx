import React, { useState, useEffect } from 'react';
// 1. Changed import from BrainCircuit to Bot
import { Bot, Sparkles, Cpu } from 'lucide-react';

const LoadingScreen = ({ interviewData }) => {
    const [progress, setProgress] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);

    const loadingSteps = [
        "Analyzing role requirements...",
        `Reviewing ${interviewData?.role || "Developer"} key topics...`,
        "Generating technical questions...",
        "Calibrating AI personality...",
        "Ready to start!"
    ];

    useEffect(() => {
        // We need to reach 100% in about 2.5 seconds (since App.jsx waits 3 seconds)
        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) {
                    clearInterval(interval);
                    return 100;
                }
                // Much faster increment: 2-5% every 50ms
                const increment = Math.random() * 3 + 1; 
                return Math.min(prev + increment, 100);
            });
        }, 50); // Runs every 50ms (very smooth/fast)

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        // Switch text based on progress percentage
        const stepIndex = Math.floor((progress / 100) * (loadingSteps.length - 1));
        setCurrentStep(Math.min(stepIndex, loadingSteps.length - 1));
    }, [progress]);

    return (
        <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
            
            {/* Central Animation Container */}
            <div className="relative mb-12">
                {/* Outer Spinning Ring */}
                <div className="w-32 h-32 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                
                {/* Inner Pulsing Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-blue-50 p-4 rounded-full animate-pulse">
                        {/* 2. Replaced BrainCircuit with Bot icon */}
                        <Bot className="w-12 h-12 text-blue-600" />
                    </div>
                </div>

                {/* Floating Sparkles */}
                <Sparkles className="absolute -top-4 -right-4 w-6 h-6 text-yellow-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <Cpu className="absolute -bottom-2 -left-4 w-5 h-5 text-purple-400 animate-bounce" style={{ animationDelay: '0.5s' }} />
            </div>

            {/* Text Content */}
            <div className="text-center max-w-md w-full space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Preparing Your Interview
                    </h2>
                    <p className="text-gray-500 flex items-center justify-center gap-2 min-h-[1.5rem]">
                        {progress < 100 && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>}
                        {loadingSteps[currentStep]}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden relative shadow-inner">
                    <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-100 ease-out"
                        style={{ width: `${progress}%` }}
                    >
                        {/* Shiny effect moving across the bar */}
                        <div className="absolute inset-0 bg-white/30 w-full h-full animate-[shimmer_1s_infinite] transform -skew-x-12"></div>
                    </div>
                </div>

                {/* Role Badge */}
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">
                    Selected Role: <span className="text-gray-900 font-bold">{interviewData?.role || "Software Engineer"}</span>
                </div>
            </div>

            {/* CSS for Shimmer Effect */}
            <style>{`
                @keyframes shimmer {
                    from { transform: translateX(-100%) skewX(-15deg); }
                    to { transform: translateX(200%) skewX(-15deg); }
                }
            `}</style>
        </div>
    );
};

export default LoadingScreen;