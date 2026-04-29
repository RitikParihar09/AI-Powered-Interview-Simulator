import React, { useState, useEffect } from 'react';
import InterviewCard from './InterviewCard';
import { db } from '../../../firebase/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const PredefinedInterviews = ({ onStart }) => {
    const [interviews, setInterviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const FALLBACK_INTERVIEWS = [
        { role: 'DBMS Specialist', company: 'General', topics: ['SQL', 'Normalization', 'ACID'], duration: '10 mins', difficulty: 'Medium', useQuestionBank: true },
        { role: 'Operating Systems', company: 'Microsoft', topics: ['Process Mgmt', 'Deadlocks'], duration: '10 mins', difficulty: 'Hard', useQuestionBank: true },
        { role: 'Computer Networks', company: 'Cisco', topics: ['OSI Model', 'TCP/IP'], duration: '10 mins', difficulty: 'Medium', useQuestionBank: true },
        { role: 'SDE - DSA Round', company: 'Amazon', topics: ['Arrays', 'DP', 'Trees'], duration: '15 mins', difficulty: 'Hard', useQuestionBank: true },
        { role: 'HR & Behavioral', company: 'Any Company', topics: ['Soft Skills', 'Leadership'], duration: '10 mins', difficulty: 'Easy', useQuestionBank: false },
        { role: 'Java Developer', company: 'Oracle', topics: ['Java Core', 'OOPs'], duration: '10 mins', difficulty: 'Hard', useQuestionBank: true },
        { role: 'Frontend Developer', company: 'Vercel', topics: ['React', 'JavaScript'], duration: '7 mins', difficulty: 'Easy', useQuestionBank: true },
        { role: 'Backend Engineer', company: 'Stripe', topics: ['System Design', 'APIs'], duration: '12 mins', difficulty: 'Hard', useQuestionBank: true }
    ];

    useEffect(() => {
        const fetchPresets = async () => {
            try {
                const q = query(collection(db, "presets"), orderBy("role", "asc"));
                const querySnapshot = await getDocs(q);
                const dbPresets = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (dbPresets.length > 0) {
                    setInterviews(dbPresets);
                } else {
                    setInterviews(FALLBACK_INTERVIEWS);
                }
            } catch (error) {
                console.error("Error fetching presets:", error);
                setInterviews(FALLBACK_INTERVIEWS);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPresets();
    }, []);

    return (
        <div id="presets-section" className="py-12 lg:py-20 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16 pt-6">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Jump Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Pre-set Role</span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                        Practice Core CSE subjects, HR rounds, and specific tech roles instantly from our dynamic database.
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                        {interviews.map((interview, index) => (
                            <InterviewCard
                                key={interview.id || index}
                                {...interview}
                                onStart={() => onStart(interview)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default PredefinedInterviews;