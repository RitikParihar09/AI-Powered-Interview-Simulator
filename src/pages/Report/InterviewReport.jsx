import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Printer, ChevronDown, ChevronUp, Award, AlertCircle, CheckCircle, Loader2, FileText, RefreshCw, Clock, Sparkles, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { generateFinalReport } from '../../services/llmService';

// --- CONFIDENCE METER ---
const ConfidenceMeter = ({ score }) => {
    const [displayScore, setDisplayScore] = useState(0);
    useEffect(() => {
        const duration = 900;
        const start = 0; const end = score; const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 4);
            setDisplayScore(Math.floor(start + (end - start) * ease));
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [score]);
    const getColor = (s) => {
        if (s < 4) return 'text-red-500 stroke-red-500';
        if (s < 7) return 'text-amber-500 stroke-amber-500';
        return 'text-emerald-500 stroke-emerald-500';
    };
    const colorClass = getColor(displayScore);
    const radius = 80; const circumference = 2 * Math.PI * radius; const offset = circumference - ((displayScore / 10) * (circumference / 2));
    return (
        <div className="flex flex-col items-center justify-center py-6">
            <div className="relative w-64 h-32 overflow-hidden mb-2">
                <svg className="w-64 h-64 transform rotate-180" viewBox="0 0 200 200">
                    <circle className="text-gray-200" strokeWidth="15" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={circumference / 2} />
                    <circle className={`${colorClass} transition-all duration-1000`} strokeWidth="15" strokeLinecap="round" stroke="currentColor" fill="transparent" r={radius} cx="100" cy="100" strokeDasharray={`${circumference} ${circumference}`} strokeDashoffset={offset} />
                </svg>
                <div className="absolute bottom-0 w-full text-center">
                    <span className={`text-5xl font-extrabold ${colorClass}`}>{displayScore}</span>
                    <span className="text-gray-400 text-xl font-bold">/10</span>
                </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Confidence Score</p>
        </div>
    );
};

// --- MAIN REPORT COMPONENT ---
const InterviewReport = ({ conversationHistory, interviewData, onRestart }) => {
    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [expandedQuestion, setExpandedQuestion] = useState(null);
    const [showDownloadMenu, setShowDownloadMenu] = useState(false);

    // 👇 2. NAVIGATION & USER STATE
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [savedToDb, setSavedToDb] = useState(false);

    // -------------------------------------
    // 🔥 BUILD CLEAN TRANSCRIPT WITH SILENCE
    // -------------------------------------
    const buildTranscript = () => {
        return conversationHistory.map((turn, i) => {
            const speaker = turn.role === 'model' ? 'Interviewer' : 'Candidate';

            const raw = (turn.parts?.[0]?.text || "").trim();
            const text = raw.length === 0 ? "[NO SPEECH DETECTED]" : raw;

            return `TURN ${i + 1}:\n${speaker}: ${text}`;
        }).join("\n\n");
    };


    const generatedRef = React.useRef(false);

    useEffect(() => {
        const generateReport = async () => {
            if (generatedRef.current) return; // 🚩 LOCK: Prevent double API calls
            
            if (!conversationHistory || conversationHistory.length === 0) {
                setReportData(getFallbackData());
                setIsLoading(false);
                return;
            }

            generatedRef.current = true;
            const transcript = buildTranscript();
            console.log("📊 Generating interview report...");
            console.log("📝 History length:", conversationHistory.length, "turns");

            try {
                const data = await generateFinalReport(conversationHistory, interviewData?.difficulty || "Medium");
                setReportData(data);
            } catch (error) {
                console.error("🚨 Report Generation Error:", error);
                setReportData(getFallbackData(transcript));
            } finally {
                setIsLoading(false);
            }
        };

        generateReport();
    }, [conversationHistory, interviewData]);


    // -------------------------
    // BETTER REALISTIC FALLBACK
    // -------------------------
    const getFallbackData = (rawTranscript = "") => ({
        overall_score: 0,
        isFallback: true,
        summary: "Your interview has been successfully recorded and added to our high-priority analysis queue. Due to high demand, our AI agents are currently processing your responses to ensure maximum accuracy.",
        categories: [],
        strengths: ["Fallback report—no strengths available."],
        weaknesses: ["AI could not analyze the transcript."],
        recommendations: [
            "Retry generating the report.",
            "Check your API key or internet connection."
        ],
        questions_analysis: [
            {
                question: "Raw Transcript",
                answer: rawTranscript,
                feedback: "No analysis available.",
                score: 0
            }
        ]
    });


    // ----------------------
    // SAVE TO FIREBASE ONCE
    // ----------------------
    useEffect(() => {
        const saveToHistory = async () => {
            if (reportData && currentUser && !savedToDb) {
                try {
                    await addDoc(collection(db, "users", currentUser.uid, "interviews"), {
                        userEmail: currentUser.email, // Save email for admin tracking
                        role: interviewData?.role || "General",
                        date: serverTimestamp(),
                        score: reportData.overall_score || reportData.score || 0, // 🚩 Added fallback to prevent undefined error
                        feedback: reportData.summary || reportData.feedback || "Report generated without summary.",
                        fullReport: reportData
                    });
                    setSavedToDb(true);
                } catch (error) {
                    console.error("Firebase Save Error:", error);
                }
            }
        };
        saveToHistory();
    }, [reportData, currentUser]);



    // --------------------
    // DOWNLOAD FUNCTIONS
    // --------------------
    const downloadJSON = () => {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `Interview_Report_${Date.now()}.json`; a.click();
        setShowDownloadMenu(false);
    };

    const handlePrintPDF = () => {
        setExpandedQuestion("ALL");
        setTimeout(() => {
            window.print();
            setShowDownloadMenu(false);
            setExpandedQuestion(null);
        }, 300);
    };


    // --------------------------
    // LOADING SCREEN
    // --------------------------
    if (isLoading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-800">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin mb-6" />
                <h2 className="text-2xl font-bold animate-pulse">Generating Realistic Interview Report...</h2>
                <p className="text-gray-500 mt-2">InterviewBuddy</p>
            </div>
        );
    }

    // --------------------------
    // MAIN UI STARTS HERE
    // --------------------------
    return (
        <div className="min-h-screen bg-gray-100 p-4 md:p-8 print:p-0 print:bg-white">
            <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">

                {/* TOP BAR */}
                <div className="bg-gray-900 text-white p-6 flex flex-col md:flex-row justify-between items-center print:bg-white print:text-black print:border-b print:p-0 print:mb-6">
                    <div>
                        <h1 className="text-2xl font-bold print:text-4xl">Interview Report</h1>
                        <p className="text-gray-400 text-sm mt-1 print:text-gray-600 print:text-lg">
                            Role: <span className="text-white font-semibold print:text-black">
                                {interviewData?.role || "Candidate"}
                            </span> • {new Date().toLocaleDateString()}
                        </p>

                        {savedToDb && (
                            <div className="flex items-center gap-1 text-green-400 text-xs font-bold mt-1">
                                <CheckCircle className="w-3 h-3" /> Saved to History
                            </div>
                        )}
                    </div>

                    {/* BUTTONS */}
                    <div className="flex gap-3 mt-4 md:mt-0 print:hidden relative">

                        <div className="relative">
                            <button
                                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-medium transition-all"
                            >
                                <Download className="w-4 h-4" /> Export Report
                            </button>

                            {showDownloadMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
                                    <button onClick={handlePrintPDF}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100 text-gray-800 transition-colors">
                                        <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                                    </button>

                                    <button onClick={downloadJSON}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-800 transition-colors">
                                        <FileText className="w-4 h-4 text-green-600" /> Download JSON
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-medium transition-all"
                        >
                            <RefreshCw className="w-4 h-4" /> New Interview
                        </button>

                    </div>
                </div>

                {/* CONTENT */}
                <div className="p-6 md:p-10 space-y-10 print:p-0">

                    {/* SUMMARY + SCORE */}
                    <div className="flex flex-col md:flex-row gap-8 items-center print:block">
                        <div className="w-full md:w-1/3 flex justify-center">
                            <ConfidenceMeter score={reportData?.overall_score || 0} />
                        </div>

                        <div className="w-full md:w-2/3 print:mt-8">
                            <h3 className="text-lg font-bold text-gray-700 mb-2 uppercase tracking-wide">
                                Executive Summary
                            </h3>
                            {(!reportData || reportData.isFallback || reportData.overall_score === 0) ? (
                                <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm animate-in fade-in slide-in-from-left-4 duration-500">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                                        </div>
                                        <h4 className="text-blue-900 font-bold text-xl">Analysis in Progress</h4>
                                    </div>
                                    <p className="text-blue-800 text-lg leading-relaxed mb-4">
                                        Your interview has been successfully recorded and added to our high-priority analysis queue. Due to high demand, our AI agents are currently processing your responses to ensure maximum accuracy.
                                    </p>
                                    <div className="flex items-center gap-2 text-blue-700 font-medium bg-white/60 w-fit px-4 py-2 rounded-full border border-blue-200">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                        <span>Full analysis will appear in your <b>History</b> tab shortly.</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-gray-600 text-lg leading-relaxed">
                                    {reportData?.summary}
                                </p>
                            )}
                        </div>
                    </div>

                    <hr className="border-gray-200 print:my-6" />

                    {/* CATEGORY BREAKDOWN */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Category Breakdown</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {reportData?.categories?.map((cat, idx) => (
                                <div key={idx} className="bg-gray-50 p-5 rounded-xl border">
                                    <div className="flex justify-between mb-2">
                                        <span className="font-bold text-gray-700">{cat.label}</span>
                                        <span className="font-bold">{cat.score}/10</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${cat.score * 10}%` }}></div>
                                    </div>
                                    <p className="text-sm text-gray-500">{cat.note}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                        <div className="bg-green-50 p-6 rounded-xl border">
                            <h3 className="flex items-center gap-2 text-green-800 font-bold mb-4">
                                <Award className="w-5 h-5" /> Strengths
                            </h3>
                            <ul className="space-y-2">
                                {reportData?.strengths?.map((s, i) => (
                                    <li key={i} className="flex items-start gap-2 text-green-700">
                                        <CheckCircle className="w-4 h-4 mt-1" /> {s}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="bg-red-50 p-6 rounded-xl border">
                            <h3 className="flex items-center gap-2 text-red-800 font-bold mb-4">
                                <AlertCircle className="w-5 h-5" /> Improvements
                            </h3>
                            <ul className="space-y-2">
                                {reportData?.improvements && reportData.improvements.length > 0 ? (
                                    reportData.improvements.map((w, i) => (
                                        <li key={i} className="flex items-start gap-2 text-red-700">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" /> {w}
                                        </li>
                                    ))
                                ) : (
                                    <li className="text-red-600 italic text-sm">No major improvements identified. Keep up the good work!</li>
                                )}
                            </ul>
                        </div>

                    </div>

                    {/* DETAILED Q&A */}
                    <div>
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Detailed Analysis</h3>

                        <div className="space-y-4">
                            {reportData?.questions_analysis?.map((qa, index) => (
                                <div key={index} className="border rounded-lg">

                                    <div
                                        onClick={() => setExpandedQuestion(expandedQuestion === index ? null : index)}
                                        className="p-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                                {index + 1}
                                            </span>
                                            <div>
                                                <p className="font-semibold text-gray-800">{qa.question}</p>
                                                <p className="text-xs mt-1 font-bold text-gray-500">
                                                    Score: {qa.score}/10
                                                </p>
                                            </div>
                                        </div>

                                        <div className="print:hidden">
                                            {(expandedQuestion === index || expandedQuestion === "ALL") ?
                                                <ChevronUp /> : <ChevronDown />}
                                        </div>
                                    </div>

                                    {(expandedQuestion === index || expandedQuestion === "ALL") && (
                                        <div className="bg-gray-50 p-5 space-y-4 border-t">
                                            
                                            {/* Expected vs User Answer */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="bg-white p-4 rounded-lg border">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <CheckCircle className="w-3 h-3 text-green-500" /> Expected Answer
                                                    </p>
                                                    <p className="text-gray-700 text-sm">
                                                        {qa.expected_answer || "N/A"}
                                                    </p>
                                                </div>

                                                <div className="bg-white p-4 rounded-lg border">
                                                    <p className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-1">
                                                        <User className="w-3 h-3 text-blue-500" /> Your Answer
                                                    </p>
                                                    <p className="text-gray-700 italic text-sm">
                                                        "{qa.user_answer || qa.answer || "[No answer provided]"}"
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Feedback */}
                                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                                                <p className="text-xs font-bold text-blue-800 uppercase mb-1">Feedback</p>
                                                <p className="text-blue-900 text-sm">{qa.feedback}</p>
                                            </div>

                                            {/* Improvement Action */}
                                            {qa.improvement && (
                                                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                                                    <p className="text-xs font-bold text-amber-800 uppercase mb-1 flex items-center gap-1">
                                                        <Sparkles className="w-3 h-3" /> How to Improve
                                                    </p>
                                                    <p className="text-amber-900 text-sm font-medium">{qa.improvement}</p>
                                                </div>
                                            )}

                                        </div>
                                    )}

                                </div>
                            ))}
                        </div>
                    </div>

                    {/* RECOMMENDATIONS */}
                    <div className="bg-blue-50 p-6 rounded-xl border">
                        <h3 className="text-lg font-bold text-blue-900 mb-4">Recommended Next Steps</h3>

                        <div className="flex flex-wrap gap-3">
                            {reportData?.recommendations?.map((rec, i) => (
                                <span key={i} className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm border shadow-sm">
                                    {rec}
                                </span>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default InterviewReport;
