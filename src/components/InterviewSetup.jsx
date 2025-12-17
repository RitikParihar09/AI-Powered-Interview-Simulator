import React, { useState } from 'react';
import ResumeDropzone from './ResumeDropzone';
import Button from './Button';
import { Briefcase, Building2, FileText, Clock } from 'lucide-react'; 

const InterviewSetup = ({ onStart }) => {
    const [formData, setFormData] = useState({ 
        role: '', 
        company: '', 
        description: '', 
        resume: null,
        duration: '15' 
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (file) => setFormData(prev => ({ ...prev, resume: file }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.role && !formData.description) {
            alert("Please provide a Target Role or a Job Description to start.");
            return;
        }
        onStart(formData);
    };

    return (
        // Main Container: Super rounded, soft shadow, clean border
        <div className="w-full max-w-5xl mx-auto bg-white border border-gray-100 rounded-[2rem] p-8 shadow-2xl shadow-blue-900/5 transition-all duration-500 hover:shadow-blue-900/10 relative overflow-hidden">
            
            <form onSubmit={handleSubmit} className="space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    
                    {/* Column 1: Resume Upload */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wider">
                            <FileText className="w-4 h-4 text-blue-500" /> Upload Resume
                        </label>
                        <div className="h-full max-h-[220px]"> 
                            <ResumeDropzone onFileChange={handleFileChange} />
                        </div>
                    </div>

                    {/* Column 2: Role, Company, Timer */}
                    <div className="space-y-5">
                        {/* Target Role */}
                        <div>
                            <label htmlFor="role" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Briefcase className="w-4 h-4 text-blue-500" /> Target Role
                            </label>
                            <input
                                type="text" name="role" id="role" value={formData.role} onChange={handleInputChange}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="e.g., Full Stack Developer"
                            />
                        </div>

                        {/* Target Company */}
                        <div>
                            <label htmlFor="company" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Building2 className="w-4 h-4 text-indigo-500" /> Target Company
                            </label>
                            <input
                                type="text" name="company" id="company" value={formData.company} onChange={handleInputChange}
                                className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-medium"
                                placeholder="e.g., Google, Amazon"
                            />
                        </div>
                        
                        {/* Duration Timer */}
                        <div>
                            <label htmlFor="duration" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                                <Clock className="w-4 h-4 text-green-500" /> Duration
                            </label>
                            <div className="relative">
                                <select
                                    name="duration"
                                    id="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    className="w-full px-5 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all appearance-none cursor-pointer font-medium"
                                >
                                    <option value="15">15 Minutes (Short)</option>
                                    <option value="30">30 Minutes (Standard)</option>
                                    <option value="45">45 Minutes (Extended)</option>
                                    <option value="60">60 Minutes (Deep Dive)</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
                                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Column 3: Description */}
                    <div className="flex flex-col">
                        <label htmlFor="description" className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                            Job Description
                        </label>
                        <textarea
                            name="description" id="description" 
                            rows="8" 
                            value={formData.description} onChange={handleInputChange}
                            className="w-full flex-1 px-5 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none text-sm leading-relaxed"
                            placeholder="Paste the job description here to get tailored questions..."
                        ></textarea>
                    </div>
                </div>
                
                {/* Button Area */}
                <div className="text-center ">
                    <Button
                        type="submit"
                        // HEAVY BUTTON STYLING: Extra bold, shadow-lg, scale effect
                        className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-extrabold tracking-wide rounded-full shadow-xl shadow-blue-600/30 transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300"
                    >
                        Start Interview
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default InterviewSetup;