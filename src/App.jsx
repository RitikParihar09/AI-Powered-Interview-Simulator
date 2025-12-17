import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import InterviewSetup from './components/InterviewSetup';
import PredefinedInterviews from './components/PredefinedInterviews';
import LoginModal from './components/LoginModal';
import SignupModal from './components/SignupModal';
import InterviewSession from './components/InterviewSession';
import LoadingScreen from './components/LoadingScreen';
import InterviewReport from './components/InterviewReport'; 
import Dashboard from './components/Dashboard'; 

export default function App() {
    const [activeModal, setActiveModal] = useState(null);
    const [interviewState, setInterviewState] = useState('setup'); 
    const [interviewData, setInterviewData] = useState(null);
    const [conversationHistory, setConversationHistory] = useState([]);

    useEffect(() => {
        if (activeModal) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeModal]);

    const handleStartInterview = (data) => {
        setInterviewData(data);
        setConversationHistory([]); 
        setInterviewState('loading');
        setTimeout(() => { setInterviewState('in_progress'); }, 3000); 
    };

    const handleEndInterview = (history) => {
        setConversationHistory(history);
        setInterviewState('report');
    };
    
    const handleRestart = () => {
        setInterviewState('setup');
    };

    const handleCloseModal = () => setActiveModal(null);

    // --- RENDER LOGIC ---
    if (interviewState === 'loading') return <LoadingScreen interviewData={interviewData} />;
    if (interviewState === 'in_progress') return <InterviewSession interviewData={interviewData} onEndInterview={handleEndInterview} />;
    if (interviewState === 'report') return <InterviewReport conversationHistory={conversationHistory} interviewData={interviewData} onRestart={handleRestart} />;
    if (interviewState === 'dashboard') return <Dashboard onBack={handleRestart} />;

    return (
        <div className="bg-white text-gray-800 font-sans">
            <Header 
                onLoginClick={() => setActiveModal('login')} 
                onSignupClick={() => setActiveModal('signup')}
                onDashboardClick={() => setInterviewState('dashboard')} 
            />

            <main>
                <div className="relative bg-white">
                    {/* 👇 CHANGED THIS LINE: Reduced top padding (pt-4) to move Hero up */}
                    <div className="container mx-auto px-6 pt-2 pb-8 lg:pt-6 lg:pb-16 flex flex-col items-center text-center gap-4">
                        <Hero />
                        <InterviewSetup onStart={handleStartInterview} />
                    </div>
                </div>
                <PredefinedInterviews onStart={handleStartInterview} />
            </main>

            {activeModal === 'login' && <LoginModal onClose={handleCloseModal} onSwitchToSignup={() => setActiveModal('signup')} />}
            {activeModal === 'signup' && <SignupModal onClose={handleCloseModal} onSwitchToLogin={() => setActiveModal('login')} />}
        </div>
    );
}