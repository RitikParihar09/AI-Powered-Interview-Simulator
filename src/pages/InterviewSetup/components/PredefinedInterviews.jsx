import React from 'react';
import InterviewCard from './InterviewCard';

const PredefinedInterviews = ({ onStart }) => {
    const interviews = [
        // --- CORE CSE SUBJECTS ---
        {
            role: 'DBMS Specialist',
            company: 'General',
            topics: ['SQL', 'Normalization', 'ACID Properties', 'Indexing'],
            duration: '10 mins',
            difficulty: 'Medium'
        },
        {
            role: 'Operating Systems',
            company: 'Microsoft',
            topics: ['Process Mgmt', 'Deadlocks', 'Semaphores', 'Memory'],
            duration: '10 mins',
            difficulty: 'Hard'
        },
        {
            role: 'Computer Networks',
            company: 'Cisco',
            topics: ['OSI Model', 'TCP/IP', 'HTTP/HTTPS', 'DNS'],
            duration: '10 mins',
            difficulty: 'Medium'
        },
        {
            role: 'SDE - DSA Round',
            company: 'Amazon',
            topics: ['Arrays', 'Linked Lists', 'Trees', 'Dynamic Programming'],
            duration: '15 mins',
            difficulty: 'Hard'
        },

        // --- BEHAVIORAL ---
        {
            role: 'HR & Behavioral',
            company: 'Any Company',
            topics: ['Strengths', 'Weaknesses', 'Teamwork', 'Leadership'],
            duration: '10 mins',
            difficulty: 'Easy'
        },

        // --- TECH ROLES ---
        {
            role: 'Java Developer',
            company: 'Oracle',
            topics: ['Java Core', 'OOPs', 'Multithreading', 'Spring'],
            duration: '10 mins',
            difficulty: 'Hard'
        },
        {
            role: 'Machine Learning Intern',
            company: 'NVIDIA',
            topics: ['Machine Learning', 'Python', 'TensorFlow'],
            duration: '10 mins',
            difficulty: 'Medium'
        },
        {
            role: 'Frontend Developer',
            company: 'Vercel',
            topics: ['React', 'JavaScript', 'UI/UX'],
            duration: '7 mins',
            difficulty: 'Easy'
        },
        {
            role: 'Backend Engineer',
            company: 'Stripe',
            topics: ['System Design', 'Databases', 'APIs'],
            duration: '12 mins',
            difficulty: 'Hard'
        },
        {
            role: 'Java',
            company: 'Testing',
            topics: ['Java', 'oops'],
            duration: '1 mins',
            difficulty: 'Easy'
        },
        // --- NEW PRESETS ---
        {
            role: 'Python Developer',
            company: 'Netflix',
            topics: ['Python', 'Django', 'FastAPI', 'Scripting'],
            duration: '12 mins',
            difficulty: 'Medium'
        },
        {
            role: 'React Native Dev',
            company: 'Uber',
            topics: ['Mobile Dev', 'React Native', 'Redux', 'Native Modules'],
            duration: '15 mins',
            difficulty: 'Medium'
        },
        {
            role: 'DevOps Engineer',
            company: 'AWS',
            topics: ['CI/CD', 'Docker', 'Kubernetes', 'Terraform'],
            duration: '15 mins',
            difficulty: 'Hard'
        },
        {
            role: 'Cyber Security',
            company: 'CrowdStrike',
            topics: ['Network Security', 'Ethical Hacking', 'OWASP', 'Cryptography'],
            duration: '15 mins',
            difficulty: 'Hard'
        },
        {
            role: 'Product Manager',
            company: 'Spotify',
            topics: ['Product Strategy', 'User Research', 'Agile', 'Roadmapping'],
            duration: '20 mins',
            difficulty: 'Medium'
        },
    ];

    return (
        <div id="presets-section" className="py-12 lg:py-20 relative">

            {/* Divider Line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

            <div className="container mx-auto px-6">
                <div className="text-center mb-16 pt-6">
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white">
                        Jump Into a <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Pre-set Role</span>
                    </h2>
                    <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
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