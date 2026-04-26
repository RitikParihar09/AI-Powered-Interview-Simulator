import React from 'react';
import Hero from './components/Hero';
import InterviewSetup from '../InterviewSetup/InterviewSetup';
import PredefinedInterviews from '../InterviewSetup/components/PredefinedInterviews';
import Header from './components/Header';
import Footer from './components/Footer';

const Home = ({ handleStartInterview, onLoginClick, onSignupClick, onDashboardClick, theme }) => {
    return (
        <div className="relative">
            {/* Background Grid Pattern */}
            <div
                className="fixed inset-0 opacity-[0.08] dark:opacity-[0.12] pointer-events-none transition-all duration-500"
                style={{
                    backgroundImage: theme === 'dark'
                        ? 'linear-gradient(rgba(255, 255, 255, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.5) 1px, transparent 1px)'
                        : 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
                    backgroundSize: '40px 40px',
                    backgroundPosition: '0 30px'
                }}
            ></div>

            {/* Decorative Colored Dots */}
            <div className="fixed top-20 left-[15%] w-12 h-12 bg-green-400 dark:bg-green-500 rounded-full blur-[6px] opacity-50 dark:opacity-30 pointer-events-none animate-float" style={{ animation: 'float 25s ease-in-out infinite, pulse 10s ease-in-out infinite' }}></div>
            <div className="fixed top-[30%] right-[20%] w-16 h-16 bg-pink-400 dark:bg-pink-500 rounded-full blur-[8px] opacity-40 dark:opacity-20 pointer-events-none animate-float-slow" style={{ animation: 'float 35s ease-in-out infinite, pulse 15s ease-in-out infinite' }}></div>
            <div className="fixed bottom-[35%] left-[25%] w-10 h-10 bg-blue-400 dark:bg-blue-500 rounded-full blur-[5px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slower" style={{ animation: 'float 40s ease-in-out infinite, pulse 12s ease-in-out infinite' }}></div>
            <div className="fixed top-[45%] right-[15%] w-14 h-14 bg-purple-400 dark:bg-purple-500 rounded-full blur-[7px] opacity-40 dark:opacity-20 pointer-events-none animate-float" style={{ animation: 'float 30s ease-in-out infinite, pulse 18s ease-in-out infinite' }}></div>
            <div className="fixed bottom-[20%] right-[30%] w-12 h-12 bg-cyan-400 dark:bg-cyan-500 rounded-full blur-[6px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slow" style={{ animation: 'float 28s ease-in-out infinite, pulse 14s ease-in-out infinite' }}></div>
            
            {/* New Left-side Dot */}
            <div className="fixed top-[40%] left-[5%] w-8 h-8 bg-indigo-400 dark:bg-indigo-500 rounded-full blur-[4px] opacity-50 dark:opacity-30 pointer-events-none animate-float-slower" style={{ animation: 'float 45s ease-in-out infinite, pulse 13s ease-in-out infinite' }}></div>

            <div className="relative z-10">
                <Header 
                    onLoginClick={onLoginClick} 
                    onSignupClick={onSignupClick} 
                    onDashboardClick={onDashboardClick} 
                />
                <main>
                    <div className="relative">
                        <div className="container mx-auto px-6 pt-10 pb-8 lg:pt-6 lg:pb-16 flex flex-col items-center text-center gap-4">
                            <Hero />
                            <InterviewSetup onStart={handleStartInterview} />
                        </div>
                    </div>
                    <PredefinedInterviews onStart={handleStartInterview} />
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default Home;
