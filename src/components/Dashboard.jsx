import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Calendar, User, ChevronLeft, Loader2, Clock } from 'lucide-react';

export default function Dashboard({ onBack }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const { currentUser } = useAuth();

    useEffect(() => {
        async function fetchHistory() {
            if (!currentUser) return;
            try {
                // Query Firestore: Get 'interviews' collection for this specific user
                const q = query(
                    collection(db, "users", currentUser.uid, "interviews"),
                    orderBy("date", "desc")
                );
                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistory(data);
            } catch (error) {
                console.error("Error fetching history:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [currentUser]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Back Button */}
                <button 
                    onClick={onBack} 
                    className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6 font-medium transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" /> Back to Home
                </button>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">Interview History</h1>
                <p className="text-gray-500 mb-8">Track your progress and review past feedback.</p>
                
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600 w-8 h-8" /></div>
                ) : (
                    <div className="grid gap-4">
                        {history.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 text-lg">No interviews found yet.</p>
                                <p className="text-gray-400 text-sm">Complete an interview to see it here!</p>
                            </div>
                        ) : (
                            history.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <User className="w-4 h-4 text-blue-600" />
                                                <h3 className="text-lg font-bold text-gray-800">{item.role || "Mock Interview"}</h3>
                                            </div>
                                            <div className="flex items-center gap-2 text-gray-500 text-sm">
                                                <Calendar className="w-3 h-3" />
                                                {/* Handle timestamp conversion safely */}
                                                {item.date?.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : "Just now"}
                                            </div>
                                        </div>
                                        
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 uppercase font-bold">Score</p>
                                            <span className={`text-2xl font-bold ${item.score >= 7 ? 'text-green-600' : item.score < 4 ? 'text-red-500' : 'text-amber-500'}`}>
                                                {item.score}/10
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Feedback Snippet */}
                                    <div className="mt-4 bg-gray-50 p-3 rounded-lg text-sm text-gray-700 border border-gray-100 italic">
                                        "{item.feedback}"
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}