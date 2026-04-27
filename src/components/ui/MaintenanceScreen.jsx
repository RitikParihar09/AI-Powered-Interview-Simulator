import React from 'react';
import { Hammer, AlertTriangle, Globe } from 'lucide-react';

const MaintenanceScreen = () => {
    return (
        <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center p-6 text-center">
            <div className="relative mb-8">
                <div className="absolute inset-0 bg-amber-500/20 blur-[100px] rounded-full" />
                <div className="relative w-32 h-32 bg-amber-500/10 border-2 border-amber-500/20 rounded-[40px] flex items-center justify-center animate-bounce duration-[3000ms]">
                    <Hammer className="w-16 h-16 text-amber-500" />
                </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-4 uppercase">
                Under Maintenance
            </h1>
            
            <p className="max-w-md text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-10">
                We're currently performing some scheduled upgrades to improve your interview experience. We'll be back shortly!
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-800/50 rounded-full border border-slate-700/50">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span className="text-sm font-bold text-slate-300">Interview Buddy</span>
                </div>
                <div className="flex items-center gap-2 px-5 py-2.5 bg-amber-500/10 rounded-full border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-bold text-amber-500 uppercase tracking-widest">Priority 1 Update</span>
                </div>
            </div>
            
            <div className="mt-20">
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">
                    Estimated downtime: ~30 minutes
                </p>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
