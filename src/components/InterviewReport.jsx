import React, { useState, useEffect } from 'react';
import { Download, Printer, ChevronDown, ChevronUp, Award, AlertCircle, CheckCircle, Loader2, FileText, RefreshCw } from 'lucide-react';
// 👇 1. NEW IMPORTS FOR FIREBASE
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// -----------------------------------------------------------
// 🔴 YOUR OPENROUTER API KEY (MOVE TO .env LATER)
const OPENROUTER_API_KEY = "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";
// -----------------------------------------------------------

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

    // 👇 2. GET USER & SAVING STATE
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


    useEffect(() => {
        const generateReport = async () => {
            if (!conversationHistory || conversationHistory.length === 0) {
                setReportData(getFallbackData());
                setIsLoading(false);
                return;
            }

            const transcript = buildTranscript();

            try {
                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "google/gemini-2.0-flash-001",
                        messages: [
                            {
                                role: "system",
                                content: `
You are an experienced but fair technical interview panelist.

Your job:
1. Extract every question asked by the Interviewer.
2. Pair each question with the next Candidate answer.
3. Grade realistically on 0–10 with partial credit.
4. Produce a clean, structured, and human-like interview report.

SCORING:
- No answer / [NO SPEECH DETECTED] / "I don't know" → 0–2
- Poor / very weak → 3–4
- Partial but acceptable → 5–6
- Good answer → 7–8
- Excellent → 9–10

FAIRNESS:
- Do not be unnecessarily harsh.
- If the answer is mostly correct, do NOT score below 5.
- Only silence or totally wrong answers should be 0–2.

OUTPUT:
ONLY return valid JSON. No markdown. No backticks.
                                `
                            },
                            {
                                role: "user",
                                content: `
TRANSCRIPT:
${transcript}

TASK:
Generate JSON using this schema:

{
  "overall_score": number,
  "summary": string,
  "categories": [{"label": string, "score": number, "note": string}],
  "strengths": [string],
  "weaknesses": [string],
  "questions_analysis": [
    {"question": string, "answer": string, "feedback": string, "score": number}
  ],
  "recommendations": [string]
}

Special notes:
- Treat "[NO SPEECH DETECTED]" as silence = 0–2.
- Give fair and slightly generous scoring overall.
- Summary = 2–5 sentences, realistic.
                                `
                            }
                        ]
                    })
                });

                const result = await response.json();
                if (result.error) throw new Error(result.error.message);

                let rawContent = result.choices[0].message.content
                    .replace(/```json/g, "")
                    .replace(/```/g, "")
                    .trim();

                const data = JSON.parse(rawContent);
                setReportData(data);

            } catch (error) {
                console.error("OpenRouter Report Error:", error);
                setReportData(getFallbackData());
            } finally {
                setIsLoading(false);
            }
        };

        generateReport();
    }, [conversationHistory]);


    // -------------------------
    // BETTER REALISTIC FALLBACK
    // -------------------------
    const getFallbackData = (rawTranscript = "") => ({
        overall_score: 5,
        summary: "Automatic analysis failed. This fallback report is generated without evaluating the interview performance.",
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
                        role: interviewData?.role || "General",
                        date: serverTimestamp(),
                        score: reportData.overall_score,
                        feedback: reportData.summary,
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
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                                    <button onClick={handlePrintPDF}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 border-b border-gray-100">
                                        <Printer className="w-4 h-4 text-blue-600" /> Download PDF
                                    </button>

                                    <button onClick={downloadJSON}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-green-600" /> Download JSON
                                    </button>
                                </div>
                            )}
                        </div>

                        <button
                            onClick={() => window.location.reload()}
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
                            <p className="text-gray-600 text-lg leading-relaxed">
                                {reportData?.summary}
                            </p>
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
                                {reportData?.weaknesses?.map((w, i) => (
                                    <li key={i} className="flex items-start gap-2 text-red-700">
                                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2" /> {w}
                                    </li>
                                ))}
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
                                        <div className="bg-gray-50 p-4 space-y-3 border-t">
                                            <div>
                                                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Answer</p>
                                                <p className="text-gray-700 italic">"{qa.answer}"</p>
                                            </div>

                                            <div className="p-3 bg-blue-50 rounded-lg border">
                                                <p className="text-xs font-bold text-blue-700 uppercase mb-1">Feedback</p>
                                                <p className="text-blue-900">{qa.feedback}</p>
                                            </div>
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
