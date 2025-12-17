import React from 'react';
import InterviewCard from './InterviewCard';
import { Sparkles } from 'lucide-react';

const PredefinedInterviews = ({ onStart }) => {
    const interviews = [
        // --- CORE CSE SUBJECTS ---
        { 
            role: 'DBMS Specialist', 
            company: 'General', 
            topics: ['SQL', 'Normalization', 'ACID Properties', 'Indexing'], 
            duration: '10 mins' 
        },
        { 
            role: 'Operating Systems', 
            company: 'Microsoft', 
            topics: ['Process Mgmt', 'Deadlocks', 'Semaphores', 'Memory'], 
            duration: '10 mins' 
        },
        { 
            role: 'Computer Networks', 
            company: 'Cisco', 
            topics: ['OSI Model', 'TCP/IP', 'HTTP/HTTPS', 'DNS'], 
            duration: '10 mins' 
        },
        { 
            role: 'SDE - DSA Round', 
            company: 'Amazon', 
            topics: ['Arrays', 'Linked Lists', 'Trees', 'Dynamic Programming'], 
            duration: '15 mins' 
        },
        
        // --- BEHAVIORAL ---
        { 
            role: 'HR & Behavioral', 
            company: 'Any Company', 
            topics: ['Strengths', 'Weaknesses', 'Teamwork', 'Leadership'], 
            duration: '10 mins' 
        },

        // --- TECH ROLES ---
        { 
            role: 'Java Developer', 
            company: 'Oracle', 
            topics: ['Java Core', 'OOPs', 'Multithreading', 'Spring'], 
            duration: '10 mins' 
        },
        { 
            role: 'Machine Learning Intern', 
            company: 'NVIDIA', 
            topics: ['Machine Learning', 'Python', 'TensorFlow'], 
            duration: '10 mins' 
        },
        { 
            role: 'Frontend Developer', 
            company: 'Vercel', 
            topics: ['React', 'JavaScript', 'UI/UX'], 
            duration: '7 mins' 
        },
        { 
            role: 'Backend Engineer', 
            company: 'Stripe', 
            topics: ['System Design', 'Databases', 'APIs'], 
            duration: '12 mins' 
        },
        { 
            role: 'Java', 
            company: 'Testing', 
            topics: ['Java', 'oops'], 
            duration: '1 mins' 
        },
    ];

    return (
        <div id="presets-section" className="py-12 lg:py-20 bg-white relative">
            
            {/* Divider Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider mb-4">
                        <Sparkles className="w-3 h-3" /> Popular Presets
                    </div>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900">
                        Jump Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Pre-set Role</span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
                        Practice Core CSE subjects, HR rounds, and specific tech roles instantly.
                    </p>
                </div>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
                    {interviews.map((interview, index) => (
                        <InterviewCard
                            key={index}
                            {...interview}
                            onStart={() => onStart(interview)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PredefinedInterviews;