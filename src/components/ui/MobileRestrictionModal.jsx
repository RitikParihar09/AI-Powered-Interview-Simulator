import React from 'react';
import { Monitor, Laptop, X, ShieldCheck, Info } from 'lucide-react';

const MobileRestrictionModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-sm bg-[#0a1128] rounded-[2rem] p-[1.5px] bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-blue-500/50 shadow-[0_0_50px_rgba(37,99,235,0.2)] overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="bg-[#0a1128] rounded-[1.95rem] p-8 flex flex-col items-center text-center relative">
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-slate-800/40 hover:bg-slate-800/60 rounded-full text-slate-400 hover:text-white transition-all shadow-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* Illustration */}
                    <div className="relative mb-8 mt-6">
                        <div className="flex items-end justify-center relative">
                            {/* Device Icons with matching style */}
                            <div className="relative">
                                <Laptop className="w-24 h-24 text-slate-500/50" />
                            </div>
                            <div className="relative -ml-10 mb-2">
                                <Monitor className="w-32 h-32 text-slate-400/50" />
                            </div>
                            
                            {/* Alert Circle Overlay */}
                            <div className="absolute top-[55%] left-[42%] -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.6)] ring-4 ring-[#0a1128] z-20">
                                <span className="text-white font-black text-xl leading-none pb-0.5">!</span>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-black text-white mb-4 tracking-tight">
                        Better on Desktop
                    </h2>
                    
                    <p className="text-slate-300/80 text-[15px] leading-relaxed mb-8 px-2">
                        For the best interview experience with camera, audio, typing and AI feedback, <span className="text-blue-400 font-bold block mt-1">please use a laptop or desktop.</span>
                    </p>

                    <button 
                        onClick={onClose}
                        className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 mb-8 transition-all transform active:scale-[0.98]"
                    >
                        <Monitor className="w-5 h-5" />
                        Continue on Desktop
                    </button>

                    <div className="flex items-start gap-3 text-slate-400/70 text-[12px] font-medium text-left bg-slate-900/30 p-4 rounded-2xl border border-slate-800/50">
                        <ShieldCheck className="w-5 h-5 text-blue-500/40 shrink-0" />
                        <p>We recommend a stable connection and larger screen for the best experience.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MobileRestrictionModal;
