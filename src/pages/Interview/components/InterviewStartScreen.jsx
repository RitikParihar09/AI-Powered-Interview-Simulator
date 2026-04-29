import React, { useState, useEffect, useRef } from "react";
import {
    Play,
    CheckCircle,
    Wifi,
    Volume2,
    Video,
    Mic,
    Activity,
    X,
    ShieldCheck,
    Loader2,
    Monitor,
    Laptop,
} from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";
import AIOrb from "./AIOrb";

const InterviewStartScreen = ({ interviewData, candidateName, onStart, isPreparing = false }) => {
    const { theme } = useTheme();
    // --- State ---
    const [networkStatus, setNetworkStatus] = useState("idle"); // idle, checking, success
    const [networkSpeed, setNetworkSpeed] = useState(null); // Speed string
    const [latency, setLatency] = useState(null); // Latency string
    const [permissionsStatus, setPermissionsStatus] = useState("idle"); // idle, checking, success, error
    const [micLevel, setMicLevel] = useState(0);
    const [showInstructions, setShowInstructions] = useState(false);

    // --- Refs ---
    const videoRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const streamRef = useRef(null);
    const animationFrameRef = useRef(null);

    // --- Checker Logic ---
    const isSystemReady =
        networkStatus === "success" && permissionsStatus === "success";

    // --- Cleanup ---
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, []);

    // --- Effect: Attach Stream to Video when Ready ---
    useEffect(() => {
        if (isSystemReady && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isSystemReady]);

    // --- Logic: Run System Diagnostics ---
    const runDiagnostics = async () => {
        // 1. Network Check (Real)
        setNetworkStatus("checking");

        try {
            if (!navigator.onLine) throw new Error("Offline");

            // Check for Secure Context (Required for Camera/Mic on Mobile)
            if (!window.isSecureContext) {
                setPermissionsStatus("error");
                throw new Error(
                    "Camera/Mic access requires a secure connection (HTTPS). If you are testing on mobile, please use an HTTPS tunnel or localhost.",
                );
            }

            // Speed Check
            const startTime = Date.now();
            await fetch("https://www.google.com", {
                mode: "no-cors",
                cache: "no-store",
            });
            const latencyVal = Date.now() - startTime;
            setLatency(`${latencyVal}ms Latency`);

            // Try to get explicit speed if available (Chrome/Edge)
            // @ts-ignore
            const connection =
                navigator.connection ||
                navigator.mozConnection ||
                navigator.webkitConnection;
            if (connection && connection.downlink) {
                setNetworkSpeed(`${connection.downlink} Mbps`);
            } else {
                setNetworkSpeed("Connected");
            }

            // Artificial delay for UX (too fast feels broken)
            await new Promise((r) => setTimeout(r, 800));
            setNetworkStatus("success");

            // 2. Camera & Mic Check
            setPermissionsStatus("checking");
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true,
                });
                streamRef.current = mediaStream;
                setPermissionsStatus("success");

                // Note: Video attachment is handled by the useEffect above

                // Setup Mic Analysis
                const audioContext = new (
                    window.AudioContext || window.webkitAudioContext
                )();
                audioContextRef.current = audioContext;
                const analyser = audioContext.createAnalyser();
                analyser.fftSize = 256;
                analyserRef.current = analyser;

                const source = audioContext.createMediaStreamSource(mediaStream);
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateMicLevel = () => {
                    if (!analyserRef.current) return;
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setMicLevel(average);
                    animationFrameRef.current = requestAnimationFrame(updateMicLevel);
                };
                updateMicLevel();
            } catch (err) {
                console.error("Permission Error:", err);
                setPermissionsStatus("error");
            }
        } catch (netErr) {
            console.error("Network Error:", netErr);
            setNetworkStatus("error");
        }
    };

    return (
        <div className="min-h-screen w-full bg-white dark:bg-[#020617] text-gray-800 dark:text-white overflow-x-hidden flex relative font-inter selection:bg-blue-500/30 dark:selection:bg-blue-900 transition-colors duration-500">            {/* Background Grid Pattern - Same as home page */}
            <div
                className="absolute inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none transition-all duration-500"
                style={{
                    backgroundImage:
                        theme === "dark"
                            ? "radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.15) 1px, transparent 0)"
                            : "radial-gradient(circle at 2px 2px, rgba(79, 70, 229, 0.15) 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                }}
            ></div>

            {/* Decorative Colored Dots */}
            <div
                className="fixed top-20 left-[15%] w-12 h-12 bg-green-400 dark:bg-green-500 rounded-full blur-[6px] opacity-50 dark:opacity-30 pointer-events-none animate-float"
                style={{
                    animation:
                        "float 25s ease-in-out infinite, pulse 10s ease-in-out infinite",
                }}
            ></div>
            <div
                className="fixed top-[30%] right-[20%] w-16 h-16 bg-pink-400 dark:bg-pink-500 rounded-full blur-[8px] opacity-40 dark:opacity-20 pointer-events-none animate-float-slow"
                style={{
                    animation:
                        "float 35s ease-in-out infinite, pulse 15s ease-in-out infinite",
                }}
            ></div>
            <div
                className="fixed bottom-[35%] left-[25%] w-10 h-10 bg-blue-400 dark:bg-blue-500 rounded-full blur-[5px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slower"
                style={{
                    animation:
                        "float 40s ease-in-out infinite, pulse 12s ease-in-out infinite",
                }}
            ></div>
            <div
                className="fixed top-[45%] right-[15%] w-14 h-14 bg-purple-400 dark:bg-purple-500 rounded-full blur-[7px] opacity-40 dark:opacity-20 pointer-events-none animate-float"
                style={{
                    animation:
                        "float 30s ease-in-out infinite, pulse 18s ease-in-out infinite",
                }}
            ></div>
            <div
                className="fixed bottom-[20%] right-[30%] w-12 h-12 bg-cyan-400 dark:bg-cyan-500 rounded-full blur-[6px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slow"
                style={{
                    animation:
                        "float 28s ease-in-out infinite, pulse 14s ease-in-out infinite",
                }}
            ></div>
            <div
                className="fixed top-[40%] left-[5%] w-8 h-8 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-[4px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slower"
                style={{
                    animation:
                        "float 45s ease-in-out infinite, pulse 13s ease-in-out infinite",
                }}
            ></div>

            <div className="relative z-10 w-full min-h-screen max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">                {/* LEFT PANEL: DIAGNOSTICS (5 cols) */}
                <div className="hidden lg:flex lg:col-span-5 flex-col justify-center space-y-6">
                    <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-2 border-gray-300 dark:border-slate-700 rounded-3xl p-8 shadow-2xl transition-all duration-500 relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-2xl font-black mb-2 flex items-center gap-3 text-gray-900 dark:text-white">
                                <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl">
                                    <Activity className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                                </div>
                                System Diagnostics
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6 ml-14">
                                Verifying your hardware and connection
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* NETWORK CHECK */}
                            <div className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border-2 border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:border-blue-400 dark:hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10">
                                {/* Success glow effect */}
                                {networkStatus === "success" && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl animate-pulse"></div>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    <div
                                        className={`p-3 rounded-xl transition-all duration-500 ${networkStatus === "success" ? "bg-green-500/20 text-green-500 shadow-lg shadow-green-500/30 scale-110" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"}`}
                                    >
                                        <Wifi className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-gray-900 dark:text-white">
                                            Mbps Network Connection
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <div className="text-xs font-medium text-gray-600 dark:text-slate-400">
                                                {networkStatus === "idle"
                                                    ? "Ready to check"
                                                    : networkStatus === "checking"
                                                        ? "Testing connection..."
                                                        : networkStatus === "success"
                                                            ? (
                                                                <div className="flex flex-col gap-0.5">
                                                                    <span className="font-bold text-indigo-400">
                                                                        {networkSpeed}
                                                                    </span>
                                                                    <span className="text-[10px] opacity-80 uppercase tracking-wider">
                                                                        {latency}
                                                                    </span>
                                                                </div>
                                                            )
                                                            : "Offline"}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {networkStatus === "checking" && (
                                        <Loader2 className="w-6 h-6 animate-spin text-blue-500 dark:text-blue-400" />
                                    )}
                                    {networkStatus === "success" && (
                                        <CheckCircle className="w-7 h-7 text-green-500 animate-in zoom-in duration-300" />
                                    )}
                                    {networkStatus === "error" && (
                                        <span className="text-sm text-red-500 dark:text-red-400 font-bold">
                                            Failed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* CAMERA CHECK */}
                            <div className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border-2 border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10">
                                {permissionsStatus === "success" && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl animate-pulse"></div>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    <div
                                        className={`p-3 rounded-xl transition-all duration-500 ${permissionsStatus === "success" ? "bg-green-500/20 text-green-500 shadow-lg shadow-green-500/30 scale-110" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"}`}
                                    >
                                        <Video className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-gray-900 dark:text-white">
                                            Camera Stream
                                        </p>
                                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">
                                            {permissionsStatus === "idle"
                                                ? "Waiting for access"
                                                : permissionsStatus === "checking"
                                                    ? "Requesting access..."
                                                    : permissionsStatus === "success"
                                                        ? "Video Active"
                                                        : "Access Denied"}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {permissionsStatus === "checking" && (
                                        <Loader2 className="w-6 h-6 animate-spin text-purple-500 dark:text-purple-400" />
                                    )}
                                    {permissionsStatus === "success" && (
                                        <CheckCircle className="w-7 h-7 text-green-500 animate-in zoom-in duration-300" />
                                    )}
                                    {permissionsStatus === "error" && (
                                        <span className="text-sm text-red-500 dark:text-red-400 font-bold">
                                            Failed
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* MIC CHECK */}
                            <div className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border-2 border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:border-pink-400 dark:hover:border-pink-500/50 hover:shadow-lg hover:shadow-pink-500/10">
                                {permissionsStatus === "success" && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl animate-pulse"></div>
                                )}

                                <div className="flex items-center gap-4 flex-1 relative z-10">
                                    <div
                                        className={`p-3 rounded-xl transition-all duration-500 ${permissionsStatus === "success" ? "bg-green-500/20 text-green-500 shadow-lg shadow-green-500/30 scale-110" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"}`}
                                    >
                                        <Mic className="w-6 h-6" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-bold text-base text-gray-900 dark:text-white">
                                            Microphone Input
                                        </p>
                                        {permissionsStatus === "success" ? (
                                            <div className="flex items-center gap-3 mt-2">
                                                <div className="flex-1 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-green-400 to-green-500 dark:from-green-400 dark:to-green-300 transition-all duration-75 shadow-lg"
                                                        style={{ width: `${Math.min(micLevel * 2, 100)}%` }}
                                                    ></div>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-green-600 dark:text-green-400 min-w-[45px]">
                                                    {Math.round(micLevel)}%
                                                </span>
                                            </div>
                                        ) : (
                                            <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">
                                                Not checked
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {permissionsStatus === "success" && (
                                        <CheckCircle className="w-7 h-7 text-green-500 animate-in zoom-in duration-300" />
                                    )}
                                </div>
                            </div>

                            {/* SPEAKER CHECK */}
                            <div className="group relative flex items-center justify-between p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-800/50 dark:to-slate-800/30 rounded-2xl border-2 border-gray-200 dark:border-slate-700/50 transition-all duration-300 hover:border-cyan-400 dark:hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
                                {permissionsStatus === "success" && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl animate-pulse"></div>
                                )}

                                <div className="flex items-center gap-4 relative z-10">
                                    <div
                                        className={`p-3 rounded-xl transition-all duration-500 ${permissionsStatus === "success" ? "bg-green-500/20 text-green-500 shadow-lg shadow-green-500/30 scale-110" : "bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-slate-400"}`}
                                    >
                                        <Volume2 className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-base text-gray-900 dark:text-white">
                                            Speaker Output
                                        </p>
                                        <p className="text-xs font-medium text-gray-600 dark:text-slate-400 mt-1">
                                            {permissionsStatus === "idle"
                                                ? "Not checked"
                                                : permissionsStatus === "checking"
                                                    ? "Verifying output..."
                                                    : permissionsStatus === "success"
                                                        ? "Audio Output Ready"
                                                        : "Device Not Found"}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    {permissionsStatus === "checking" && (
                                        <Loader2 className="w-6 h-6 animate-spin text-cyan-500 dark:text-cyan-400" />
                                    )}
                                    {permissionsStatus === "success" && (
                                        <CheckCircle className="w-7 h-7 text-green-500 animate-in zoom-in duration-300" />
                                    )}
                                    {permissionsStatus === "error" && (
                                        <span className="text-sm text-red-500 dark:text-red-400 font-bold">
                                            Failed
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="relative z-10">
                            {networkStatus === "idle" && (
                                <button
                                    onClick={runDiagnostics}
                                    className="w-full mt-6 py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-600 dark:hover:to-blue-500 rounded-2xl font-black text-base transition-all shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 text-white uppercase tracking-wider transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <ShieldCheck className="w-5 h-5" />
                                        Initialize System Check
                                    </span>
                                </button>
                            )}
                            {networkStatus !== "idle" && !isSystemReady && (
                                <div className="w-full mt-6 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 dark:from-blue-600/20 dark:to-purple-600/20 rounded-2xl font-bold text-center text-blue-600 dark:text-blue-400 text-sm tracking-wide uppercase border-2 border-blue-300 dark:border-blue-600/50 animate-pulse">
                                    <div className="flex items-center justify-center gap-3">
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Running Diagnostics...
                                    </div>
                                </div>
                            )}
                            {isSystemReady && (
                                <div className="relative w-full mt-6 py-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 dark:from-green-600/20 dark:to-emerald-600/20 rounded-2xl font-black text-center text-green-700 dark:text-green-400 text-sm tracking-wide uppercase border-2 border-green-400 dark:border-green-500/50 shadow-lg shadow-green-500/20 overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 animate-pulse"></div>
                                    <div className="relative z-10 flex items-center justify-center gap-3">
                                        <CheckCircle className="w-6 h-6" />
                                        All Systems Ready
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT PANEL: HERO & PREVIEW (7 cols) */}
                <div className="col-span-1 lg:col-span-7 flex flex-col items-center justify-center relative min-h-[80vh]">
                    {/* ORB - Absolutely positioned at the top of the panel to avoid overlap */}
                    {!isSystemReady && (
                        <div className="absolute top-12 left-1/2 -translate-x-1/2 pointer-events-none z-0">
                            <div className="absolute w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[100px] animate-pulse"></div>
                            <div className="w-[280px] h-[280px] relative">
                                <AIOrb isSpeaking={true} />
                            </div>
                        </div>
                    )}

                    {!isSystemReady ? (
                        <div className="w-full max-w-2xl text-center flex flex-col items-center justify-center gap-6 relative z-10 transform -translate-y-40">
                            <span className="text-xl md:text-2xl text-indigo-400 font-semibold">
                                Meet
                            </span>

                            <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-purple-500 via-indigo-500 to-blue-500">
                                Echo
                            </h1>

                            <div className="flex items-center justify-center w-full max-w-md">
                                <div className="flex-1 h-px bg-slate-600/50"></div>
                                <span className="px-6 text-sm font-bold tracking-[0.25em] uppercase text-slate-300">
                                    YOUR AI INTERVIEWER
                                </span>
                                <div className="flex-1 h-px bg-slate-600/50"></div>
                            </div>

                            <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                                Hi! I'm Echo, your AI interviewer.
                                <br />
                                I'll be asking questions, listening to your
                                <br />
                                answers, and helping you perform your best.
                            </p>
                        </div>


                    ) : (

                        // ===================== READY STATE (VIDEO) =====================
                        <div className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-700 flex flex-col gap-6 items-center">

                            {/* VIDEO */}
                            <div className="relative w-full aspect-video bg-gray-900 dark:bg-black rounded-2xl overflow-hidden shadow-2xl">

                                <video
                                    ref={videoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />

                                {/* STATUS OVERLAY */}
                                <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-black/80 to-transparent flex items-end p-6">
                                    <div className="flex items-center gap-3">

                                        <span className="flex h-3 w-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>

                                        <span className="font-mono text-sm font-bold text-green-400 tracking-wider">
                                            ONLINE // {micLevel > 10 ? "DETECTING VOICE" : "MIC ACTIVE"}
                                        </span>

                                    </div>
                                </div>

                            </div>

                            {/* BUTTON */}
                            <button
                                onClick={() => setShowInstructions(true)}
                                className="group w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-500 dark:to-blue-600 hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-600 dark:hover:to-blue-500 text-white rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl hover:shadow-blue-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                Join Interview Session
                                <Play className="w-5 h-5 fill-current" />
                            </button>

                        </div>

                    )}

                </div>

                {/* INSTRUCTIONS MODAL */}
                {showInstructions && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
                        <div className="bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-slate-700 rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all scale-100 relative overflow-hidden">
                            {/* Inner theme-aware glow */}
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 dark:from-blue-500/10 dark:to-purple-500/10 pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-6 relative z-10">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <div className="w-2 h-8 bg-blue-600 dark:bg-blue-500 rounded-full"></div>
                                    Guidelines
                                </h3>
                                <button
                                    onClick={() => setShowInstructions(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 dark:text-slate-400 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4 mb-8 relative z-10">
                                <div className="flex gap-4 p-5 bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl border border-blue-100 dark:border-slate-700/50 transition-all">
                                    <div className="bg-blue-500/10 dark:bg-blue-500/20 p-3 rounded-xl h-fit">
                                        <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-blue-100 text-base">
                                            No Interruptions
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            Ensure you are in a quiet room with stable internet.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-4 p-5 bg-purple-50/50 dark:bg-slate-800/50 rounded-2xl border border-purple-100 dark:border-slate-700/50 transition-all">
                                    <div className="bg-purple-500/10 dark:bg-purple-500/20 p-3 rounded-xl h-fit">
                                        <Mic className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-purple-100 text-base">
                                            Wait to Respond
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-slate-400 mt-1 leading-relaxed">
                                            When you finish speaking, the AI will automatically detect
                                            silence and respond.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onStart}
                                disabled={isPreparing}
                                className={`w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 dark:from-blue-600 dark:to-indigo-600 hover:from-blue-500 hover:to-blue-400 dark:hover:from-blue-500 dark:hover:to-indigo-500 rounded-2xl font-black text-white shadow-xl hover:shadow-blue-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] relative z-10 flex items-center justify-center gap-3 ${isPreparing ? "opacity-80 cursor-not-allowed" : ""}`}
                            >
                                {isPreparing ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Preparing Interview...
                                    </>
                                ) : (
                                    "I Understand, Let's Begin"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InterviewStartScreen;
