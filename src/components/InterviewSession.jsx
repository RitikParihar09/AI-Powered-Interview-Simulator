import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { Mic, MicOff, PhoneOff, Video, VideoOff, Send, Keyboard, Loader2, Play, Clock, Briefcase, User, Sparkles } from 'lucide-react';
import { getInitialQuestion, getNextQuestion } from '../services/llmService'; 
import aiImg from '../assets/ai.png'; 
import Timer from './Timer'; 
import InterviewReport from './InterviewReport'; 
import { useAuth } from '../context/AuthContext'; 

// -----------------------------------------------------------
// 🔴 DEEPGRAM API KEY
const DEEPGRAM_API_KEY = 'd65aac4a5b405a50b073dde284c8b92bae29a1be'; 
// -----------------------------------------------------------

const InterviewSession = ({ interviewData, onEndInterview }) => {
  // --- State ---
  const [currentQuestion, setCurrentQuestion] = useState("Connecting to AI Interviewer...");
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [history, setHistory] = useState([]); 
  const [isFinished, setIsFinished] = useState(false); 
  
  // UI/Device State
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false); 
  const [textInput, setTextInput] = useState("");
  
  // Data State
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState(""); 
  const [status, setStatus] = useState("Ready");

  // Auto-scroll refs
  const answerRef = useRef(null);

  // User Info
  const { currentUser } = useAuth();
  const candidateName = currentUser?.email ? currentUser.email.split('@')[0] : "Candidate";
  const displayName = candidateName.charAt(0).toUpperCase() + candidateName.slice(1);

  // --- Refs ---
  const mediaRecorderRef = useRef(null);
  const socketRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const isEndedRef = useRef(false);

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
  // 3. DEEPGRAM STT & TTS
  // ==========================================

  const startDeepgram = async () => {
    if (isEndedRef.current) return;
    if (!DEEPGRAM_API_KEY) { alert("Deepgram API Key is missing!"); return; }

    setIsConnecting(true);
    setStatus("Listening...");

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (isEndedRef.current) { stream.getTracks().forEach(t => t.stop()); return; }

        const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        const socket = new WebSocket('wss://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&interim_results=true', ['token', DEEPGRAM_API_KEY]);

        socket.onopen = () => {
            if (isEndedRef.current) { socket.close(); return; }
            setIsListening(true);
            setIsConnecting(false);
            mediaRecorder.addEventListener('dataavailable', async (event) => {
                if (event.data.size > 0 && socket.readyState === 1) socket.send(event.data);
            });
            mediaRecorder.start(250);
        };

        socket.onmessage = (message) => {
            const received = JSON.parse(message.data);
            const text = received.channel?.alternatives[0]?.transcript;
            
            if (text) {
                if (received.is_final) {
                    setTranscript(prev => prev + " " + text);
                    setInterimTranscript(""); 
                } else {
                    setInterimTranscript(text);
                }
            }
        };

        socket.onclose = () => { if (!isEndedRef.current) setIsListening(false); setIsConnecting(false); };
        socket.onerror = (error) => { console.error('Deepgram Error', error); setStatus("Connection Error"); setIsConnecting(false); };

        socketRef.current = socket;
        mediaRecorderRef.current = mediaRecorder;

    } catch (error) {
        console.error("Mic Error", error); setStatus("Mic Error"); setIsConnecting(false);
    }
  };

  const stopDeepgram = () => {
    setStatus("Processing...");
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
    if (socketRef.current && socketRef.current.readyState === 1) {
        socketRef.current.send(JSON.stringify({ type: 'CloseStream' }));
        socketRef.current.close();
    }
    setIsListening(false);
  };

  const toggleMic = () => {
    if (isListening) {
        stopDeepgram();
        setTimeout(() => { 
            const fullAnswer = (transcript + " " + interimTranscript).trim();
            if (fullAnswer) handleUserAnswer(fullAnswer); 
        }, 1000);
    } else {
        if (audioRef.current) { audioRef.current.pause(); setIsAiSpeaking(false); }
        setTranscript("");
        setInterimTranscript(""); 
        startDeepgram();
    }
  };

  const speak = async (text) => {
    if (!text || isEndedRef.current) return;
    stopDeepgram();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    setStatus("AI Speaking...");
    setIsAiSpeaking(true);

    try {
        const response = await fetch('https://api.deepgram.com/v1/speak?model=aura-2-draco-en', {
            method: 'POST',
            headers: { 'Authorization': `Token ${DEEPGRAM_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });

        if (isEndedRef.current) return;
        if (!response.ok) throw new Error("TTS Failed");

        const blob = await response.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audioRef.current = audio;

        audio.onended = () => {
            if (isEndedRef.current) return;
            setIsAiSpeaking(false);
            setStatus("Ready.");
             setTimeout(() => { if (!isEndedRef.current) { 
                 setTranscript(""); 
                 setInterimTranscript("");
                 startDeepgram(); 
            } }, 500);
        };
        await audio.play();
    } catch (error) {
        console.error("TTS Error:", error);
        if (!isEndedRef.current) { setStatus("Audio Error"); setIsAiSpeaking(false); }
    }
  };

  // ==========================================
  // 4. LOGIC
  // ==========================================

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
    isEndedRef.current = false; 
    setIsSessionActive(true); // 🟢 DIRECT START: No countdown
    try {
        const q = await getInitialQuestion(interviewData?.role || "Developer");
        if (isEndedRef.current) return;
        setCurrentQuestion(q);
        setHistory([{ role: "model", parts: [{ text: q }] }]);
        speak(q);
    } catch (e) {
        const f = "Tell me about yourself.";
        if (!isEndedRef.current) { setCurrentQuestion(f); speak(f); }
    }
  };

  const handleUserAnswer = async (answer) => {
    if (!answer.trim() || isEndedRef.current) return;
    setStatus("Thinking...");
    setTranscript("");
    setInterimTranscript("");
    setTextInput("");
    
    const updatedHistory = [...history, { role: "user", parts: [{ text: answer }] }];
    setHistory(updatedHistory); 

    try {
        const nextQ = await getNextQuestion({ lastQuestion: currentQuestion, lastAnswer: answer, history: updatedHistory });
        if (isEndedRef.current) return; 
        setCurrentQuestion(nextQ);
        setHistory(prev => [...prev, { role: "model", parts: [{ text: nextQ }] }]); 
        speak(nextQ);
    } catch (e) { if (!isEndedRef.current) setStatus("Error fetching question."); }
  };

  // ==========================================
  // 5. RENDER
  // ==========================================

  if (isFinished) return <InterviewReport conversationHistory={history} interviewData={interviewData} onRestart={onEndInterview} />;

  // --- START SCREEN (NO COUNTDOWN) ---
  if (!isSessionActive) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
            <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-4000"></div>
        </div>

        <div className="z-10 flex flex-col items-center max-w-2xl w-full px-4">
            <div className="w-full bg-gray-800/50 backdrop-blur-md border border-gray-700 p-8 rounded-3xl shadow-2xl animate-in fade-in zoom-in duration-500">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-28 h-28 bg-gray-700 rounded-full p-1 border-4 border-blue-500 shadow-lg mb-4">
                            <img src={aiImg} alt="Alex" className="w-full h-full object-cover rounded-full"/>
                    </div>
                    <h2 className="text-3xl font-bold">Hi, I'm Alex.</h2>
                    <p className="text-blue-400 font-medium">Your AI Interviewer</p>
                </div>
                <div className="grid grid-cols-3 gap-4 mb-8 w-full">
                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                        <Briefcase className="w-6 h-6 text-blue-400 mb-2" />
                        <p className="text-xs text-gray-500 uppercase font-bold">Role</p>
                        <p className="font-semibold text-sm md:text-base truncate w-full">{interviewData?.role || "General"}</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                        <Clock className="w-6 h-6 text-green-400 mb-2" />
                        <p className="text-xs text-gray-500 uppercase font-bold">Duration</p>
                        <p className="font-semibold text-sm md:text-base">{interviewData?.duration || "15"} Mins</p>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-2xl border border-gray-700 flex flex-col items-center text-center">
                        <User className="w-6 h-6 text-purple-400 mb-2" />
                        <p className="text-xs text-gray-500 uppercase font-bold">Candidate</p>
                        <p className="font-semibold text-sm md:text-base truncate w-full">{displayName}</p>
                    </div>
                </div>
                <p className="text-gray-400 text-center mb-8 text-sm">
                    I'll be asking you technical and behavioral questions. Please ensure your microphone is ready.
                </p>
                <button onClick={startSession} className="w-full group relative px-8 py-4 bg-green-600 hover:bg-green-500 rounded-full text-xl font-bold shadow-[0_0_40px_-10px_rgba(22,163,74,0.5)] transition-all transform hover:scale-105">
                    <span className="flex items-center justify-center gap-3">Begin Interview <Play className="w-5 h-5 fill-current" /></span>
                </button>
            </div>
        </div>
      </div>
    );
  }

  // --- INTERVIEW SESSION UI ---
  return (
    <div className="h-screen w-full bg-gray-900 flex flex-col relative overflow-hidden animate-in fade-in duration-1000">
      <Timer durationString={interviewData?.duration || "15"} active={isSessionActive} onTimeUp={finishSession} />

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col items-center justify-start p-4 pt-6 space-y-6 max-w-5xl mx-auto w-full pb-32">
        
        {/* 1. INTERVIEWER SECTION */}
        <div className="w-full flex flex-col items-center space-y-4">
            {/* AVATAR */}
            <div className={`relative w-40 h-40 md:w-56 md:h-56 rounded-full overflow-hidden border-4 transition-all duration-300 shadow-xl ${isAiSpeaking ? 'border-blue-400 scale-105' : 'border-gray-700'}`}>
                <img src={aiImg} alt="AI" className="w-full h-full object-cover"/>
                {isAiSpeaking && <div className="absolute inset-0 bg-blue-500/10 animate-pulse rounded-full pointer-events-none" />}
            </div>

            {/* QUESTION BOX */}
            <div className="bg-gray-800/90 backdrop-blur-md p-7 rounded-2xl border border-blue-500/30 shadow-lg w-full text-center transition-all max-h-[150px] md:max-h-[200px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-center gap-2 mb-2 sticky top-0">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    <h3 className="text-blue-400 text-xs font-bold uppercase tracking-wider">Alex (Interviewer)</h3>
                </div>
                <p className="text-lg md:text-2xl text-white font-medium leading-relaxed">{currentQuestion}</p>
            </div>
        </div>

        {/* 2. CANDIDATE SECTION (YOUR ANSWER) */}
        <div className="w-full">
             <div className={`bg-black/60 backdrop-blur-md p-6 rounded-2xl border transition-all duration-300 w-full h-[170px] flex flex-col ${isListening ? 'border-green-500/50 bg-green-900/10' : 'border-gray-800'}`}>
                
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider">Your Answer</h3>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {isListening && <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>}
                        <span className={`text-xs font-bold uppercase ${isListening ? 'text-green-400' : 'text-gray-600'}`}>
                            {status}
                        </span>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar" ref={answerRef}>
                    <p className="text-xl md:text-2xl text-gray-100 font-light leading-relaxed">
                        {transcript} <span className="text-gray-400">{interimTranscript}</span>
                        {(!transcript && !interimTranscript) && (
                            <span className="text-gray-600 italic text-lg">
                                {isListening ? "Speak now..." : "Click the mic to answer..."}
                            </span>
                        )}
                    </p>
                </div>
            </div>
        </div>

      </div>

      {/* Webcam View */}
      <div className="absolute top-6 right-6 w-50 md:w-70 aspect-video bg-black rounded-lg overflow-hidden border border-gray-700 shadow-2xl z-10">
        {isVideoOn ? <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover transform scale-x-[-1]" /> : <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-gray-500 gap-2"><VideoOff className="w-6 h-6 opacity-50"/><span className="text-xs">Camera Off</span></div>}
      </div>

      {/* CONTROLS */}
      <div className="fixed bottom-0 left-0 w-full bg-gray-900/90 backdrop-blur-lg p-4 flex items-center justify-center gap-4 shadow-2xl z-20 border-t border-gray-800"> 
        
        {/* Video Button */}
        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`p-3 rounded-full transition-all duration-200 ${isVideoOn ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-red-500/20 text-red-500 border border-red-500/50'}`}>
            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {showTextInput ? (
             <div className="flex-1 max-w-2xl flex gap-2 animate-in slide-in-from-bottom-2">
                <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleUserAnswer(textInput)} placeholder="Type your answer..." className="flex-1 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 outline-none text-sm" autoFocus />
                <button onClick={() => handleUserAnswer(textInput)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full font-medium text-sm">Send</button>
                <button onClick={() => setShowTextInput(false)} className="p-3 bg-gray-800 hover:bg-gray-700 rounded-full text-gray-400"><Mic className="w-5 h-5" /></button>
            </div>
        ) : (
            <div className="flex items-center gap-4"> 
                {/* Mic Button */}
                <button onClick={toggleMic} disabled={isConnecting} className={`p-3 rounded-full transition-all transform hover:scale-105 shadow-lg ring-4 ring-offset-4 ring-offset-gray-900 ${isListening ? 'bg-red-500 ring-red-500/30 shadow-red-500/50' : 'bg-blue-600 ring-blue-600/30 shadow-blue-600/50'} ${isConnecting ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {isConnecting ? <Loader2 className="w-8 h-8 text-white animate-spin"/> : (isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-8 h-8 text-white" />)}
                </button>
                {/* Keyboard Button */}
                <button onClick={() => { stopDeepgram(); setShowTextInput(true); }} className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-white transition-all hover:scale-105">
                    <Keyboard className="w-5 h-5" />
                </button>
            </div>
        )}
        {/* End Call Button */}
        <button onClick={finishSession} className="p-3 rounded-full bg-red-600/10 text-red-500 border border-red-600/50 hover:bg-red-600 hover:text-white transition-all hover:scale-105">
            <PhoneOff className="w-5 h-5" />
        </button>
      </div>

      {/* CUSTOM SCROLLBAR STYLE */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
        }
      `}</style>
    </div>
  );
};

export default InterviewSession;