import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext'; // Import Auth

export default function LoginModal({ onClose, onSwitchToSignup }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    const { login } = useAuth(); // Get login function

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setError("");
            setLoading(true);
            await login(email, password); // Call Firebase
            onClose(); // Close modal
            // No need to reload, the AuthContext will update the Header automatically
        } catch (err) {
            setError("Failed to login: " + err.message);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                    <p className="text-gray-500 mb-6">Sign in to access your interview history.</p>
                    
                    {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{error}</div>}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input 
                                type="email" required 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input 
                                type="password" required 
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 mt-2"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>
                </div>
                <div className="bg-gray-50 px-8 py-4 text-center text-sm text-gray-600 border-t border-gray-100">
                    Don't have an account? <button onClick={onSwitchToSignup} className="text-blue-600 font-semibold hover:underline">Sign up</button>
                    <div className="mt-2"><button onClick={onClose} className="text-gray-400 hover:text-gray-600">Cancel</button></div>
                </div>
            </div>
        </div>
    );
}