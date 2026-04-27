import React, { useState, useEffect } from 'react';
import LoginModal from './components/ui/LoginModal';
import SignupModal from './components/ui/SignupModal';
import MobileRestrictionModal from './components/ui/MobileRestrictionModal';
import MaintenanceScreen from './components/ui/MaintenanceScreen';
import AppRoutes from './routes/AppRoutes';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from './firebase/firebase';

import { useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';

export default function App() {
    return (
        <ThemeProvider>
            <AppContent />
        </ThemeProvider>
    );
}
function AppContent() {
    const { currentUser, isAdmin, loading } = useAuth();
    const { theme } = useTheme();
    const navigate = useNavigate();
    const [activeModal, setActiveModal] = useState(null);
    const [interviewState, setInterviewState] = useState('setup');
    const [interviewData, setInterviewData] = useState(null);
    const [conversationHistory, setConversationHistory] = useState([]);
    
    // Maintenance Mode State
    const [isMaintenance, setIsMaintenance] = useState(false);

    // Listen for Maintenance Mode
    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'platform'), (doc) => {
            if (doc.exists()) {
                setIsMaintenance(doc.data().maintenanceMode || false);
            }
        });
        return unsub;
    }, []);

    useEffect(() => {
        if (activeModal) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = 'unset';
        return () => { document.body.style.overflow = 'unset'; };
    }, [activeModal]);

    const handleStartInterview = (data) => {
        if (window.innerWidth < 1024) {
            setActiveModal('mobile-restriction');
            return;
        }
        if (!currentUser) {
            setActiveModal('login');
            return;
        }
        setInterviewData(data);
        setConversationHistory([]);
        setInterviewState('loading');
        navigate('/interview');
        setTimeout(() => { setInterviewState('in_progress'); }, 5000);
    };

    const handleEndInterview = (history) => {
        setConversationHistory(history);
        setInterviewState('report');
        navigate('/report');
    };

    const handleRestart = () => {
        setInterviewState('setup');
        navigate('/');
    };

    const handleCloseModal = () => setActiveModal(null);

    // If maintenance is on AND the user is not the admin, block access
    // Wait for loading to finish so we don't accidentally block the admin
    if (!loading && isMaintenance && !isAdmin) {
        return <MaintenanceScreen />;
    }




    return (
        <div className="min-h-screen bg-white dark:bg-[#020617] text-gray-800 dark:text-gray-100 font-sans relative selection:bg-blue-100 dark:selection:bg-blue-900 transition-colors duration-500">
            <div className="relative z-10">
                <AppRoutes 
                    interviewState={interviewState}
                    interviewData={interviewData}
                    conversationHistory={conversationHistory}
                    handleStartInterview={handleStartInterview}
                    handleEndInterview={handleEndInterview}
                    handleRestart={handleRestart}
                    onLoginClick={() => setActiveModal('login')}
                    onSignupClick={() => setActiveModal('signup')}
                    onDashboardClick={() => {
                        setInterviewState('dashboard');
                        navigate('/dashboard');
                    }}
                    theme={theme}
                />

                {activeModal === 'login' && (
                    <LoginModal 
                        onClose={handleCloseModal} 
                        onSwitchToSignup={() => setActiveModal('signup')} 
                    />
                )}
                {activeModal === 'signup' && (
                    <SignupModal 
                        onClose={handleCloseModal} 
                        onSwitchToLogin={() => setActiveModal('login')} 
                    />
                )}
                {activeModal === 'mobile-restriction' && (
                    <MobileRestrictionModal 
                        isOpen={true}
                        onClose={handleCloseModal}
                    />
                )}
            </div>
        </div>
    );
}