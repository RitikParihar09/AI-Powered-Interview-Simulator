import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Send, Keyboard, Loader2, Play, Clock, Briefcase, User, Sparkles, Sun, Moon } from 'lucide-react';
import { getInitialQuestion, getNextQuestion, parseResumeText, getQuestionBankQuestions, generateFollowUpQuestions, parseResumeToJSON, generateResumeBasedQuestions } from '../../services/llmService';
import aiImg from '../../assets/ai.png';
import Timer from './components/Timer';
import AIOrb from './components/AIOrb';
import InterviewStartScreen from './components/InterviewStartScreen';
import InterviewReport from '../Report/InterviewReport';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// -----------------------------------------------------------
const DEEPGRAM_API_KEY = import.meta.env.VITE_DEEPGRAM_API_KEY;
// -----------------------------------------------------------

const InterviewSession = ({ interviewData, onEndInterview }) => {
    // --- State ---
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const [history, setHistory] = useState([]);
    const [currentQuestion, setCurrentQuestion] = useState("");
    const [displayedQuestion, setDisplayedQuestion] = useState(""); // 🚀 For Typewriter effect
    const [currentQuestionData, setCurrentQuestionData] = useState(null);

    // Question Bank State
    const [questionBankQuestions, setQuestionBankQuestions] = useState([]);
    const [questionBankIndex, setQuestionBankIndex] = useState(0);

    // Follow-up Question Tracking (Resume-based interviews)
    const [followUpCount, setFollowUpCount] = useState(0);

    // UI/Device State
    const [isVideoOn, setIsVideoOn] = useState(true);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [showTextInput, setShowTextInput] = useState(false);
    const [textInput, setTextInput] = useState("");
    const [showEndConfirmation, setShowEndConfirmation] = useState(false);

    // Data State
    const [transcript, setTranscript] = useState("");
    const [interimTranscript, setInterimTranscript] = useState(""); // 🚀 Added back
    const [resumeText, setResumeText] = useState(null); // 🚀 Added back
    const [questionQueue, setQuestionQueue] = useState([]);
    const [status, setStatus] = useState("Initializing...");
    
    // 🚀 NEW: Background Preparation State
    const [isPreparing, setIsPreparing] = useState(true);
    const [preparedQueue, setPreparedQueue] = useState([]);
    const [apiCallCount, setApiCallCount] = useState(0);
    const [dbQuestionCount, setDbQuestionCount] = useState(0);
    const [isIntro, setIsIntro] = useState(false); // 🚀 Track if we are in greeting phase
    
    // ⏱️ SESSION LIMITS BASED ON DURATION
    const getSessionLimits = () => {
        const mins = parseInt(interviewData?.duration || '15');
        if (mins <= 15) return { maxDb: 3, maxAi: 2 };
        if (mins <= 30) return { maxDb: 6, maxAi: 3 };
        if (mins <= 45) return { maxDb: 8, maxAi: 4 };
        return { maxDb: 10, maxAi: 5 };
    };
    const limits = getSessionLimits();

    // Debugging Helper
    const logQueue = (stage, queueData) => {
        const targetQueue = queueData || questionQueue;
        if (!targetQueue || !Array.isArray(targetQueue)) {
            console.log(`📦 QUEUE STATE (${stage}): Empty or invalid`);
            return;
        }
        console.log(`📦 QUEUE STATE (${stage})`);
        console.table(targetQueue.map((q, i) => ({
            index: i,
            question: q.question || (typeof q === 'string' ? q : 'Complex Object')
        })));
    };

    // ==========================================
    // 0. PREVENT REFRESH / ACCIDENTAL NAVIGATION (Only during active session)
    // ==========================================
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (isSessionActive && !isFinished) { // 🚩 Only warn if session is active
                e.preventDefault();
                e.returnValue = ''; 
            }
        };

        const handlePopState = (e) => {
            if (isSessionActive && !isFinished) {
                if (!window.confirm("An interview is in progress. Are you sure you want to leave? Your progress will be lost.")) {
                    window.history.pushState(null, "", window.location.href);
                }
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('popstate', handlePopState);
        
        // Push state for popstate detection
        if (isSessionActive && !isFinished) {
            window.history.pushState(null, "", window.location.href);
        }

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isSessionActive, isFinished]);

    // Auto-scroll refs
    const answerRef = useRef(null);

    // User Info
    const { currentUser } = useAuth();
    const candidateName = currentUser?.email ? currentUser.email.split('@')[0] : "Candidate";
    const displayName = candidateName.charAt(0).toUpperCase() + candidateName.slice(1);

    // Theme
    const { theme, toggleTheme } = useTheme();

    // --- Refs ---
    const hasStartedFetch = useRef(false);
    const mediaRecorderRef = useRef(null);
    const socketRef = useRef(null);
    const videoRef = useRef(null);
    const audioRef = useRef(null);
    const isEndedRef = useRef(false);
    const isProcessingRef = useRef(false); // 🚩 ADDED THIS
    const timeLeftRef = useRef(900); // Default to 15 mins (900s)

    // --- VAD Refs ---
    const silenceTimerRef = useRef(null);
    const fullTranscriptRef = useRef("");

    // Sync ref with state for access inside timeouts
    useEffect(() => {
        fullTranscriptRef.current = (transcript + " " + interimTranscript).trim();
    }, [transcript, interimTranscript]);

    // ==========================================
    // 1. AUTO SCROLL LOGIC
    // ==========================================
    useLayoutEffect(() => {
        if (answerRef.current) {
            answerRef.current.scrollTop = answerRef.current.scrollHeight;
        }
    }, [transcript, interimTranscript]);

    // ==========================================
    // 2. CRITICAL: FINISH SESSION & CLEANUP
    // ==========================================

    const finishSession = () => {
        isEndedRef.current = true;
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        if (socketRef.current) { socketRef.current.close(); socketRef.current = null; }
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            if (mediaRecorderRef.current.stream) mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        if (videoRef.current && videoRef.current.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        setIsListening(false);
        setIsAiSpeaking(false);
        setIsSessionActive(false);
        setIsFinished(true);
    };

    // ==========================================
    // 3. VAD HELPER LOGIC
    // ==========================================

    const performAutoSubmit = () => {
        console.log("Auto-submitting due to 10s silence...");
        stopDeepgram(); // Stop listening

        setTimeout(() => {
            const finalAnswer = fullTranscriptRef.current;
            if (finalAnswer && finalAnswer.length > 0) {
                handleUserAnswer(finalAnswer);
            } else {
                console.log("Silence detected but transcript empty. Staying ready.");
                setStatus("Ready.");
            }
        }, 200);
    };

    const resetSilenceTimer = () => {
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

        // 🚩 GUARD: Don't track silence if the AI is still talking
        if (isAiSpeaking) return;

        // "Smart VAD": Wait 10 seconds. If no new speech, auto-submit.
        silenceTimerRef.current = setTimeout(() => {
            performAutoSubmit();
        }, 10000);
    };

    // Trigger silence timer start/reset when AI finishes speaking
    useEffect(() => {
        if (!isAiSpeaking && isListening) {
            resetSilenceTimer();
        }
    }, [isAiSpeaking, isListening]);

    // ==========================================
    // 4. DEEPGRAM STT & TTS
    // ==========================================

    const startDeepgram = async () => {
        if (isEndedRef.current) return;
        if (!DEEPGRAM_API_KEY) { alert("Deepgram API Key is missing!"); return; }

        setIsConnecting(true);
        setStatus("Listening...");
        fullTranscriptRef.current = ""; // Reset transcript tracker

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (isEndedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

            const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            // Using nova-2 with smart_format
            const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true&utterance_end_ms=1000&vad_events=true', ['token', DEEPGRAM_API_KEY]);

            socket.onopen = () => {
                if (isEndedRef.current) { socket.close(); return; }
                setIsListening(true);
                setIsConnecting(false);
                resetSilenceTimer(); // Start tracking silence immediately

                mediaRecorder.addEventListener('dataavailable', async (event) => {
                    if (event.data.size > 0 && socket.readyState === 1) socket.send(event.data);
                });
                mediaRecorder.start(250);
            };

            socket.onmessage = (message) => {
                const received = JSON.parse(message.data);
                const text = received.channel?.alternatives?.[0]?.transcript;

                if (text) {
                    resetSilenceTimer(); // Reset timer if any text detected
                    if (received.is_final) {
                        setTranscript(prev => prev + " " + text);
                        setInterimTranscript("");
                    } else {
                        setInterimTranscript(text);
                    }
                }
            };

            socket.onclose = () => {
                if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
                if (!isEndedRef.current) setIsListening(false);
                setIsConnecting(false);
            };

            socket.onerror = (error) => { console.error('Deepgram Error', error); setStatus("Connection Error"); setIsConnecting(false); };

            socketRef.current = socket;
            mediaRecorderRef.current = mediaRecorder;

        } catch (error) {
            console.error("Mic Error", error); setStatus("Mic Error"); setIsConnecting(false);
        }
    };

    const stopDeepgram = () => {
        setStatus("Processing...");
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); // Stop VAD

        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (socketRef.current && socketRef.current.readyState === 1) {
            socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
            socketRef.current.close();
        }
        setIsListening(false);
    };

    // 🚀 NEW: Typewriter Effect Watcher (Stable Substring Version)
    useEffect(() => {
        if (!currentQuestion) {
            setDisplayedQuestion("");
            return;
        }
        
        // Skip typewriter for intro
        if (isIntro) {
            setDisplayedQuestion(currentQuestion);
            return;
        }

        let index = 0;
        setDisplayedQuestion("");
        
        const interval = setInterval(() => {
            index++;
            if (index <= currentQuestion.length) {
                setDisplayedQuestion(currentQuestion.substring(0, index));
            } else {
                clearInterval(interval);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [currentQuestion, isIntro]);

    const toggleMic = () => {
        if (isListening) {
            stopDeepgram();
            // Manual stop = Immediate submit
            setTimeout(() => {
                const fullAnswer = fullTranscriptRef.current;
                if (fullAnswer) handleUserAnswer(fullAnswer);
            }, 500);
        } else {
            if (audioRef.current) { audioRef.current.pause(); setIsAiSpeaking(false); }
            setTranscript("");
            setInterimTranscript("");
            startDeepgram();
        }
    };

    const speak = async (text, onEnded = null) => { // 🚀 Added onEnded callback
        if (!text || isEndedRef.current) return;
        stopDeepgram();
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

        setStatus("AI Speaking...");
        setIsAiSpeaking(true);

        try {
            const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-asteria-en', { // ⚡ Fast model
                method: 'POST',
                headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ text })
            });

            if (isEndedRef.current) return;
            if (!response.ok) throw new Error("TTS Failed");

            const blob = await response.blob();
            const audioUrl = URL.createObjectURL(blob);
            const audio = new Audio(audioUrl);
            audioRef.current = audio;

            audio.onended = () => {
                if (isEndedRef.current) return;
                setIsAiSpeaking(false);
                setStatus("Ready.");

                // 🚀 Execute callback if provided
                if (onEnded) {
                    onEnded();
                    return;
                }

                // IF TIME IS UP, DON'T RESTART LISTENING
                if (timeLeftRef.current <= 0) {
                    finishSession();
                    return;
                }

                setTimeout(() => {
                    if (!isEndedRef.current) {
                        setTranscript("");
                        setInterimTranscript("");
                        startDeepgram();
                    }
                }, 500);
            };
            await audio.play();
        } catch (error) {
            console.error("TTS Error:", error);
            if (!isEndedRef.current) { setStatus("Audio Error"); setIsAiSpeaking(false); }
        }
    };

    // ==========================================
    // 5. AI CALL CONTROL
    // ==========================================
    const maybeGenerateFollowups = async (question, answer, tags = []) => {
        const keywords = ["react", "hooks", "state", "api", "async", "javascript", "css", "html", "node", "firebase", "database", "sql"];
        const detected = keywords.filter(k => answer.toLowerCase().includes(k));
        
        console.log("🧠 Keywords Detected:", detected);
        if (answer.length < 15 && detected.length === 0) return [];

        if (apiCallCount >= 5) {
            console.log("🚫 AI API LIMIT REACHED");
            return [];
        }

        try {
            const followups = await generateFollowUpQuestions(question, answer, tags);
            return followups;
        } catch (error) {
            console.error("Failed to generate follow-ups", error);
            return [];
        }
    };

    // ==========================================
    // 6. INTERVIEW LOGIC
    // ==========================================

    // ==========================================
    // 🚀 BACKGROUND PREPARATION (Pre-fetch while user is on start screen)
    // ==========================================
    useEffect(() => {
        const prepareInterviewData = async () => {
            if (hasStartedFetch.current) return;
            hasStartedFetch.current = true;
            setIsPreparing(true);
            console.log("🧠 Background Preparation Started...");

            let resumeQuestions = [];
            let dbQuestions = [];

            // 1. Parse Resume
            if (interviewData?.resume) {
                try {
                    const rawResume = await parseResumeText(interviewData.resume);
                    const structuredResume = await parseResumeToJSON(rawResume);
                    
                    // ⏳ Small delay to prevent API "burst" rate limiting (429)
                    await new Promise(r => setTimeout(r, 1000)); 

                    resumeQuestions = await generateResumeBasedQuestions(
                        structuredResume,
                        interviewData?.role || "Developer",
                        interviewData?.company || "Target Company"
                    );
                } catch (err) { console.error("Resume pre-fetch failed:", err); }
            }

            // 2. Fetch DB Questions
            try {
                const bankQuestions = await getQuestionBankQuestions(
                    interviewData?.company,
                    interviewData?.role,
                    interviewData?.difficulty || "Medium"
                );
                if (bankQuestions?.length > 0) {
                    dbQuestions = [...bankQuestions].sort(() => 0.5 - Math.random()).slice(0, limits.maxDb);
                }
            } catch (err) { console.error("DB pre-fetch failed:", err); }

            const combined = [...resumeQuestions, ...dbQuestions];
            setPreparedQueue(combined);
            setIsPreparing(false);
            console.log(`✅ Preparation Complete. ${combined.length} questions ready.`);
        };

        prepareInterviewData();
    }, [interviewData]);

    useEffect(() => {
        const startWebcam = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (videoRef.current) videoRef.current.srcObject = stream;
            } catch (e) { console.error(e); }
        };
        if (isSessionActive && isVideoOn && !isFinished && !isEndedRef.current) startWebcam();
    }, [isSessionActive, isVideoOn, isFinished]);

    const startSession = async () => {
        console.log("🚀 INTERVIEW STARTING...");
        isEndedRef.current = false;
        setIsSessionActive(true); 
        setApiCallCount(0);
        setDbQuestionCount(0);
        
        // 1. USE PREPARED QUEUE
        const queueToUse = preparedQueue.length > 0 ? [...preparedQueue] : [];
        setQuestionQueue(queueToUse);

        // 2. GET OPENING QUESTION & START WITH GREETING
        try {
            const queueCopy = [...queueToUse];
            const firstData = queueCopy.shift(); 
            setQuestionQueue(queueCopy);
            
            const firstQuestionText = firstData ? (firstData.question || firstData) : "Tell me about yourself.";
            
            // 🎙️ STEP 1: GREETING (Static)
            const candidateName = currentUser?.displayName?.split(' ')[0] || "there";
            const greeting = `Hi ${candidateName}, I'm Echo, your AI interviewer. Today's interview is for the ${interviewData?.role || 'Developer'} role. I'll be asking you a series of questions and may follow up based on your answers. Feel free to take a moment before answering. Let's begin.`;
            
            setIsIntro(true);
            setCurrentQuestion(greeting);
            
            // 🎙️ STEP 2: SPEAK GREETING -> THEN FIRST QUESTION
            speak(greeting, () => {
                // This runs when greeting audio ends
                setIsIntro(false); // Enable typewriter for questions
                const firstQuestionText = firstData ? (firstData.question || firstData) : "Tell me about yourself.";
                
                setHistory([{ 
                    role: "model", 
                    parts: [{ text: greeting + " " + firstQuestionText }],
                    expectedAnswer: firstData?.expectedAnswer || "General introduction."
                }]);

                setCurrentQuestion(firstQuestionText);
                setCurrentQuestionData(firstData || { question: firstQuestionText, source: 'ai' });
                speak(firstQuestionText);
                setStatus("Ready");
            });

        } catch (e) {
            const fallback = "Hi, I'm Echo. Let's start with your background. Tell me about yourself.";
            setIsIntro(false);
            setCurrentQuestion(fallback);
            speak(fallback);
        }
    };

    const handleUserAnswer = async (answer) => {
        if (!answer.trim() || isProcessingRef.current || isEndedRef.current) return;
        isProcessingRef.current = true;
        setStatus("Thinking...");

        // 1. Update History with context
        const currentMeta = {
            question: currentQuestion,
            expectedAnswer: currentQuestionData?.expectedAnswer || currentQuestionData?.answer || "N/A",
            source: currentQuestionData?.source || (currentQuestionData?.id ? 'database' : 'ai')
        };

        const updatedHistory = [...history, { 
            role: "user", 
            parts: [{ text: answer }],
            meta: currentMeta
        }];
        setHistory(updatedHistory);

        let nextQData = null;

        // 2. 🧠 HYBRID FLOW: Dynamic Refill & Injection
        // A. Check for pre-generated batch follow-up
        if (currentQuestionData?.followUp && answer.length > 40) {
            console.log("💉 Injecting pre-generated batch follow-up...");
            nextQData = { ...currentQuestionData.followUp, source: 'ai_batch' };
            // 🚩 FIX: Do NOT push to queue, because we are asking it RIGHT NOW.
        } 
        // B. Real-time AI Follow-up fallback
        else if (apiCallCount < limits.maxAi && dbQuestionCount % 2 === 0 && answer.length > 40) {
            try {
                console.log(`🤖 Requesting Real-time AI Follow-up...`);
                const followups = await maybeGenerateFollowups(currentQuestion, answer);
                if (followups && followups.length > 0) {
                    nextQData = { ...followups[0], source: 'ai_realtime' };
                    
                    // 🚩 FIX: Only push to queue if there is MORE than 1 follow-up generated
                    if (followups.length > 1) {
                        const rest = followups.slice(1).map(f => ({ ...f, source: 'ai_realtime' }));
                        setQuestionQueue(prev => [...rest, ...prev]);
                    }
                    
                    setApiCallCount(prev => prev + 1);
                }
            } catch (err) { console.warn("AI Follow-up failed", err); }
        }

        // 3. 🔄 DYNAMIC REFILL: If queue is getting low, fetch more from DB
        if (questionQueue.length < 2 && !isEndedRef.current) {
            console.log("🔄 Queue low. Refilling from DB...");
            try {
                const moreQuestions = await getQuestionBankQuestions(
                    interviewData?.company,
                    interviewData?.role,
                    interviewData?.difficulty || "Medium"
                );
                if (moreQuestions.length > 0) {
                    // 🚩 FIX: Filter out questions already in history OR already in the queue
                    const freshOnes = moreQuestions.filter(q => 
                        !updatedHistory.some(h => h.meta?.question === q.question) &&
                        !questionQueue.some(qq => qq.question === q.question)
                    ).slice(0, 3);
                    
                    if (freshOnes.length > 0) {
                        setQuestionQueue(prev => [...prev, ...freshOnes]);
                        console.log(`✅ Refilled with ${freshOnes.length} FRESH DB questions.`);
                    }
                }
            } catch (err) { console.error("Refill failed", err); }
        }

        // 4. 🎯 SELECTION: Pick the next question from queue
        if (!nextQData) {
            if (questionQueue.length > 0) {
                const remaining = [...questionQueue];
                nextQData = remaining.shift();
                setQuestionQueue(remaining);
                setDbQuestionCount(prev => prev + 1);
                logQueue("NEXT QUESTION (POPPED)", remaining);
            } 
            else {
                // 🔴 ABSOLUTE FALLBACK: AI-generated next question
                console.log("🪹 Queue empty. Generating AI fallback...");
                try {
                    const aiNext = await getNextQuestion({
                        lastAnswer: answer,
                        history: updatedHistory,
                        difficulty: interviewData?.difficulty || "Medium"
                    });
                    nextQData = { question: aiNext, source: 'ai_fallback' };
                } catch (e) {
                    console.log("🏁 All fallbacks failed. Ending session.");
                    finishSession();
                    isProcessingRef.current = false;
                    return;
                }
            }
        }

        // 5. Update State & Speak
        if (nextQData) {
            const nextQText = typeof nextQData === 'string' ? nextQData : nextQData.question;
            setCurrentQuestion(nextQText);
            setCurrentQuestionData(nextQData);
            setHistory(prev => [...prev, { role: "model", parts: [{ text: nextQText }] }]);
            speak(nextQText);
            setStatus("Ready");
        }

        isProcessingRef.current = false;
    };

    // ==========================================
    // 6. RENDER
    // ==========================================

    if (isFinished) return <InterviewReport conversationHistory={history} interviewData={interviewData} onRestart={onEndInterview} />;

    // --- START SCREEN (NO COUNTDOWN) ---
    if (!isSessionActive) {
        return (
            <InterviewStartScreen
                interviewData={interviewData}
                candidateName={candidateName}
                onStart={startSession}
                isPreparing={isPreparing}
            />
        );
    }

    // --- INTERVIEW SESSION UI ---
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-500 overflow-hidden">

            {/* Top Left - Controls (Theme Toggle, Timer) */}
            <div className="fixed top-6 left-6 z-50 flex items-center gap-4">
                {/* Theme Toggle Button - Circular */}
                <button
                    onClick={toggleTheme}
                    className="w-14 h-14 rounded-full bg-white/20 dark:bg-gray-800/50 backdrop-blur-xl border-2 border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 transition-all transform hover:scale-110 shadow-xl flex items-center justify-center group relative overflow-hidden"
                    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {theme === 'dark' ? <Sun className="w-6 h-6 relative z-10" /> : <Moon className="w-6 h-6 relative z-10" />}
                </button>

                {/* Timer Display */}
                <Timer durationString={interviewData?.duration || "15"} active={isSessionActive} onTimeUp={finishSession} timeLeftRef={timeLeftRef} />
            </div>

            {/* Top Right - Webcam View */}
            <div className="fixed top-6 right-6 z-50">
                <div className="relative w-56 md:w-64 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl transition-all duration-300 hover:scale-105">
                    {isVideoOn ? (
                        <>
                            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                            {/* Active indicator */}
                            <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-full">
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                </span>
                                <span className="text-xs text-white font-bold">LIVE</span>
                            </div>
                        </>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-900 dark:to-black text-gray-400 dark:text-gray-500 gap-2">
                            <VideoOff className="w-6 h-6 opacity-50" />
                            <span className="text-xs font-medium">Camera Off</span>
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN LAYOUT CONTAINER */}
            <div className="h-screen flex flex-col">

                {/* AI ORB SECTION - TOP CENTER */}
                <div className="w-full flex items-center justify-center pt-2 pb-4 shrink-0 -mt-[47px] relative top-[-160px] z-20">
                    <div className="w-40 h-40 flex items-center justify-center scale-[1.8]">
                        <AIOrb isSpeaking={isAiSpeaking} isListening={isListening} />
                    </div>
                </div>

                {/* CONVERSATION CARDS SECTION - MIDDLE CENTER */}
                <div className="flex-1 w-full flex items-center justify-center px-6 pb-32 mt-32">
                    {/* SIDE-BY-SIDE CONVERSATION CARDS */}
                    <div className="w-full max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">

                        {/* QUESTION CARD - LEFT */}
                        <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-5 rounded-2xl border-2 border-blue-400/20 dark:border-blue-500/20 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden h-[320px]">
                            {/* Subtle blue inner glow */}
                            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col h-full min-h-0">
                                <div className="flex items-center justify-center gap-2 mb-4 shrink-0">
                                    <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg">
                                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <h3 className="text-blue-700 dark:text-blue-300 text-xs font-black uppercase tracking-wider">Interviewer Question</h3>
                                </div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0">
                                    <div className="flex items-center justify-center py-2">
                                        <div className="text-gray-900 dark:text-white text-lg md:text-xl font-medium leading-relaxed max-h-[250px] overflow-y-auto pr-4 custom-scrollbar">
                                            {displayedQuestion || "Waiting for Echo..."}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ANSWER CARD - RIGHT */}
                        <div className="relative bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl p-5 rounded-2xl border-2 border-blue-400/20 dark:border-blue-500/20 shadow-2xl transition-all duration-300 flex flex-col overflow-hidden h-[320px]">
                            {/* Subtle blue inner glow */}
                            <div className="absolute inset-0 bg-blue-500/5 rounded-2xl pointer-events-none"></div>

                            <div className="relative z-10 flex flex-col h-full min-h-0">
                                <div className="flex items-center justify-between mb-3 shrink-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded-lg ${isListening
                                            ? 'bg-green-500/20 dark:bg-green-500/30'
                                            : 'bg-gray-200 dark:bg-gray-800'
                                            }`}>
                                            <User className={`w-4 h-4 ${isListening
                                                ? 'text-green-600 dark:text-green-400'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`} />
                                        </div>
                                        <h3 className={`text-xs font-black uppercase tracking-wider ${isListening
                                            ? 'text-green-700 dark:text-green-300'
                                            : 'text-gray-700 dark:text-gray-300'
                                            }`}>Your Response</h3>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {isListening && (
                                            <div className="flex items-center gap-1">
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                </span>
                                            </div>
                                        )}
                                        <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded-full ${isListening
                                            ? 'text-green-700 dark:text-green-300 bg-green-200/50 dark:bg-green-500/20'
                                            : 'text-gray-500 dark:text-gray-400 bg-gray-200/50 dark:bg-gray-800'
                                            }`}>
                                            {status}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 min-h-0" ref={answerRef}>
                                    <div className="flex items-center justify-center py-2">
                                        <p className="text-base md:text-lg text-gray-900 dark:text-gray-100 font-light leading-relaxed text-center w-full">
                                            {transcript} <span className="text-gray-500 dark:text-gray-400 italic">{interimTranscript}</span>
                                            {(!transcript && !interimTranscript) && (
                                                <span className="text-gray-400 dark:text-gray-500 italic text-sm flex items-center gap-2 justify-center">
                                                    {isListening ? (
                                                        <>
                                                            <Mic className="w-5 h-5 animate-pulse" />
                                                            Listening... speak now
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Mic className="w-5 h-5 opacity-50" />
                                                            Click the mic to start answering
                                                        </>
                                                    )}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* GLASSMORPHIC FLOATING ACTION DOCK */}
            <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-30">
                <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-2xl rounded-full px-8 py-3 flex items-center justify-center gap-5 shadow-2xl border border-white/20 dark:border-gray-700/50 transition-all duration-500">

                    {/* Video Button */}
                    <button
                        onClick={() => setIsVideoOn(!isVideoOn)}
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 hover:-translate-y-1 shadow-xl border-2 ${isVideoOn
                            ? 'bg-white dark:bg-gray-800 border-blue-100 dark:border-blue-900/50 text-blue-600 dark:text-blue-400'
                            : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 border-red-200 dark:border-red-500/50'
                            }`}
                        title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
                    >
                        {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                    </button>

                    {showTextInput ? (
                        <div className="flex items-center gap-3 animate-in slide-in-from-bottom-2">
                            <input
                                type="text"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUserAnswer(textInput)}
                                placeholder="Type your answer..."
                                className="w-96 bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-xl border-2 border-gray-300/50 dark:border-gray-700/50 rounded-full px-6 py-3 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 outline-none text-base font-medium transition-all"
                                autoFocus
                            />
                            <button
                                onClick={() => handleUserAnswer(textInput)}
                                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center transition-all transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-blue-500/40"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setShowTextInput(false)}
                                className="w-12 h-12 rounded-full bg-gray-100/80 dark:bg-gray-800/80 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400 flex items-center justify-center transition-all transform hover:scale-110 hover:-translate-y-1"
                            >
                                <Mic className="w-5 h-5" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-5">
                            {/* Mic Button - Primary Action */}
                            <button
                                onClick={toggleMic}
                                disabled={isConnecting}
                                className={`w-16 h-16 rounded-full flex items-center justify-center transition-all transform hover:scale-110 hover:-translate-y-1 shadow-xl ${isListening
                                    ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/50'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/50'
                                    } ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={isListening ? 'Stop recording' : 'Start recording'}
                            >
                                {isConnecting ? (
                                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                                ) : isListening ? (
                                    <MicOff className="w-7 h-7 text-white" />
                                ) : (
                                    <Mic className="w-7 h-7 text-white" />
                                )}
                            </button>

                            {/* Keyboard Button */}
                            <button
                                onClick={() => { stopDeepgram(); setShowTextInput(true); }}
                                className="w-14 h-14 rounded-full bg-white dark:bg-gray-800 border-2 border-blue-100 dark:border-blue-900/50 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center transition-all transform hover:scale-110 hover:-translate-y-1 shadow-xl"
                                title="Switch to text input"
                            >
                                <Keyboard className="w-6 h-6" />
                            </button>
                        </div>
                    )}

                    {/* End Call Button */}
                    <button
                        onClick={() => setShowEndConfirmation(true)}
                        className="w-14 h-14 rounded-full bg-red-100/80 dark:bg-red-600/20 text-red-600 dark:text-red-500 border-2 border-red-300/50 dark:border-red-600/50 hover:bg-red-600 hover:text-white hover:border-red-600 dark:hover:bg-red-600 dark:hover:border-red-600 flex items-center justify-center transition-all transform hover:scale-110 hover:-translate-y-1 shadow-lg hover:shadow-red-500/30"
                        title="End interview"
                    >
                        <PhoneOff className="w-6 h-6" />
                    </button>
                </div>
            </div >

            {/* END SESSION CONFIRMATION MODAL */}
            {showEndConfirmation && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-gray-800 transform animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PhoneOff className="w-10 h-10 text-red-600 dark:text-red-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white text-center mb-2 tracking-tight">End Interview?</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 leading-relaxed">
                            Are you sure you want to end this session? You will receive your feedback report immediately.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setShowEndConfirmation(false)}
                                className="py-3 px-6 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => { setShowEndConfirmation(false); finishSession(); }}
                                className="py-3 px-6 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/20 transition-all"
                            >
                                Yes, End
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM SCROLLBAR STYLE */}
            < style > {`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 20px;
            border: 2px solid transparent;
            background-clip: content-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            background-clip: content-box;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.2);
            background-clip: content-box;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
            background-clip: content-box;
        }
      `}</style >
        </div >
    );
};

export default InterviewSession;