import React, { useState } from 'react';
import ResumeDropzone from './components/ResumeDropzone';
import Button from '../../components/ui/Button';
import { Briefcase, Building2, FileText, Clock, Play, AlertCircle, X, HelpCircle, Gauge } from 'lucide-react';

const InterviewSetup = ({ onStart }) => {
    const [formData, setFormData] = useState({
        role: '',
        company: '',
        description: '',
        resume: null,
        duration: '15',
        difficulty: 'Medium'
    });
    const [error, setError] = useState(null);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (error) setError(null);
    };

    const handleFileChange = (file) => {
        setFormData(prev => ({ ...prev, resume: file }));
        if (error) setError(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.role && !formData.description) {
            setError("Please provide a Target Role or Job Description to initialize system.");
            return;
        }
        onStart(formData);
    };

    return (
        <div className="w-full max-w-5xl mx-auto rounded-[2rem] p-[3px] bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 shadow-2xl shadow-blue-900/20 relative mt-8">
            {/* VALIDATION MODAL (Replaces toast) */}
            {error && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md animate-in fade-in duration-300 p-4">
                    <div className="bg-white dark:bg-slate-900 border-2 border-red-100 dark:border-red-900/30 rounded-3xl w-full max-w-md p-8 shadow-2xl transform transition-all scale-100 relative overflow-hidden">
                        {/* Decorative background glow */}
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-amber-500/5 pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-100 dark:bg-red-500/20 rounded-xl">
                                    <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 dark:text-white">Attention Required</h3>
                            </div>
                            <button onClick={() => setError(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 dark:text-slate-400 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6 relative z-10">
                            <p className="text-gray-600 dark:text-slate-300 font-medium leading-relaxed">
                                {error}
                            </p>

                            <div className="p-5 bg-amber-50 dark:bg-slate-800/80 rounded-2xl border border-amber-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-2 mb-2">
                                    <HelpCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    <span className="text-xs font-black uppercase tracking-wider text-amber-700 dark:text-amber-400">Example</span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-slate-400 font-medium italic">
                                    "Frontend Developer at Google - Focus on React, System Design, and Problem Solving."
                                </p>
                            </div>

                            <button
                                onClick={() => setError(null)}
                                className="w-full py-4 bg-gradient-to-r from-gray-900 to-slate-800 dark:from-blue-600 dark:to-indigo-600 hover:opacity-90 rounded-2xl font-black text-white shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                            >
                                Got it, I'll fill it!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[1.9rem] px-6 pt-5 pb-6 h-full w-full relative overflow-hidden transition-colors duration-300">
                <form onSubmit={handleSubmit} className="space-y-5 relative z-10 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Upload Resume
                            </label>
                            <div className="h-[180px]">
                                <ResumeDropzone onFileChange={handleFileChange} />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label htmlFor="role" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Target Role
                                </label>
                                <input
                                    type="text" name="role" id="role" value={formData.role} onChange={handleInputChange}
                                    className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium ${error && !formData.role ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 dark:border-slate-700 hover:border-blue-300'}`}
                                    placeholder="e.g., Full Stack Developer"
                                />
                            </div>

                            <div>
                                <label htmlFor="company" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                    <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Target Company
                                </label>
                                <input
                                    type="text" name="company" id="company" value={formData.company} onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium hover:border-indigo-300"
                                    placeholder="e.g., Google, Amazon"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="duration" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        <Clock className="w-4 h-4 text-green-600 dark:text-green-400" /> Duration
                                    </label>
                                    <select
                                        name="duration" id="duration" value={formData.duration} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer font-medium hover:border-green-300"
                                    >
                                        <option value="15">15 Mins</option>
                                        <option value="30">30 Mins</option>
                                        <option value="45">45 Mins</option>
                                        <option value="60">60 Mins</option>
                                    </select>
                                </div>
                                <div>
                                    <label htmlFor="difficulty" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                        <Gauge className="w-4 h-4 text-orange-600 dark:text-orange-400" /> Difficulty
                                    </label>
                                    <select
                                        name="difficulty" id="difficulty" value={formData.difficulty} onChange={handleInputChange}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-gray-100 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer font-medium hover:border-orange-300"
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col">
                            <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Job Description
                            </label>
                            <textarea
                                name="description" id="description" rows="6" value={formData.description} onChange={handleInputChange}
                                className={`w-full flex-1 px-4 py-3 bg-gray-50 dark:bg-slate-800 border rounded-xl text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed ${error && !formData.description ? 'border-amber-400 ring-2 ring-amber-100' : 'border-gray-200 dark:border-slate-700 hover:border-purple-300'}`}
                                placeholder="Paste the job description here ..."
                            ></textarea>
                        </div>
                    </div>

                    <div className="text-center pt-0">
                        <Button
                            type="submit"
                            className="w-full md:w-auto mx-auto bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-3.5 text-lg font-bold tracking-wide rounded-full shadow-xl shadow-blue-600/20 transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-3"
                        >
                            <Play className="w-5 h-5 fill-current" /> Start Interview
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InterviewSetup;