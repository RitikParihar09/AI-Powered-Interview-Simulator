import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import LoadingScreen from '../components/ui/LoadingScreen';
import InterviewSession from '../pages/Interview/InterviewSession';
import InterviewReport from '../pages/Report/InterviewReport';
import Dashboard from '../pages/Dashboard/Dashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Home from '../pages/Home/Home';

const SessionExpired = () => (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-500/10">
                <AlertCircle className="w-12 h-12 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="space-y-3">
                <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Session Interrupted</h2>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                    It looks like the page was refreshed or the connection was lost. For security and stability, you'll need to re-configure your interview settings.
                </p>
            </div>
            <Link 
                to="/" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-600/20 transition-all transform hover:scale-105"
            >
                <ArrowLeft className="w-5 h-5" />
                Go Back to Setup
            </Link>
        </div>
    </div>
);

const AppRoutes = ({ 
    interviewState, 
    interviewData, 
    conversationHistory, 
    handleStartInterview, 
    handleEndInterview, 
    handleRestart,
    onLoginClick,
    onSignupClick,
    onDashboardClick,
    theme
}) => {
    return (
        <Routes>
            <Route path="/" element={
                <Home 
                    handleStartInterview={handleStartInterview} 
                    onLoginClick={onLoginClick}
                    onSignupClick={onSignupClick}
                    onDashboardClick={onDashboardClick}
                    theme={theme} 
                />
            } />
            
            <Route path="/interview" element={
                interviewState === 'loading' ? (
                    <LoadingScreen interviewData={interviewData} />
                ) : interviewState === 'in_progress' ? (
                    <ErrorBoundary>
                        <InterviewSession interviewData={interviewData} onEndInterview={handleEndInterview} />
                    </ErrorBoundary>
                ) : (
                    <SessionExpired />
                )
            } />
            
            <Route path="/report" element={
                interviewState === 'report' ? (
                    <InterviewReport 
                        conversationHistory={conversationHistory} 
                        interviewData={interviewData} 
                        onRestart={handleRestart} 
                    />
                ) : (
                    <SessionExpired />
                )
            } />
            
            <Route path="/dashboard" element={
                <Dashboard onBack={handleRestart} />
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRoutes;
