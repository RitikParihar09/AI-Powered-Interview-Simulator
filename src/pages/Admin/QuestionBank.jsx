import React, { useState, useEffect } from 'react';
import { 
    Plus, Search, Filter, MoreHorizontal, Edit2, Trash2, 
    Download, ChevronLeft, ChevronRight, RotateCcw, 
    Save, X, CheckCircle2, Loader2, AlertCircle, HelpCircle 
} from 'lucide-react';
import { 
    collection, addDoc, getDocs, deleteDoc, 
    doc, onSnapshot, query, orderBy 
} from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';

import { useSearchParams } from 'react-router-dom';

const QuestionBank = () => {
    const [searchParams] = useSearchParams();
    const initialRole = searchParams.get('role') || 'All Roles';
    const initialCompany = searchParams.get('company') || 'All Companies';
    const initialTag = searchParams.get('tag') || '';



    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [addMode, setAddMode] = useState('form'); // 'form' or 'json'
    const [jsonInput, setJsonInput] = useState('');
    const [isEditing, setIsEditing] = useState(null);
    
    // Form state
    const [formData, setFormData] = useState({
        role: 'Frontend',
        company: 'TCS',
        difficulty: 'Easy',
        question: '',
        expectedAnswer: '',
        hints: ['hooks', 'virtual DOM'],
        tags: ['react', 'library', 'javascript']
    });

    // Custom Popup State
    const [popup, setPopup] = useState({ show: false, type: 'success', title: '', message: '', onConfirm: null });

    const showSuccess = (title, message) => {
        setPopup({ show: true, type: 'success', title, message, onConfirm: null });
        setTimeout(() => setPopup(p => ({ ...p, show: false })), 3000);
    };

    const showError = (title, message) => {
        setPopup({ show: true, type: 'error', title, message, onConfirm: null });
    };

    const showConfirm = (title, message, onConfirm) => {
        setPopup({ show: true, type: 'confirm', title, message, onConfirm });
    };

    const handleJsonImport = async () => {
        try {
            const data = JSON.parse(jsonInput);
            
            if (Array.isArray(data)) {
                showConfirm(
                    "Bulk Import", 
                    `Found ${data.length} questions. Do you want to bulk import them all now?`,
                    async () => {
                        let successCount = 0;
                        for (const item of data) {
                            try {
                                await addDoc(collection(db, 'questions'), {
                                    role: item.role || 'Frontend',
                                    company: item.company || 'TCS',
                                    difficulty: item.difficulty || 'Easy',
                                    question: item.question || '',
                                    expectedAnswer: item.expectedAnswer || '',
                                    hints: item.hints || [],
                                    tags: item.tags || [],
                                    createdAt: new Date().toISOString()
                                });
                                successCount++;
                            } catch (err) { console.error(err); }
                        }
                        showSuccess("Import Complete", `Successfully added ${successCount} questions.`);
                        setIsAdding(false);
                        setJsonInput('');
                    }
                );
                return;
            }

            setFormData({
                role: data.role || 'Frontend',
                company: data.company || 'TCS',
                difficulty: data.difficulty || 'Easy',
                question: data.question || '',
                expectedAnswer: data.expectedAnswer || '',
                hints: data.hints || [],
                tags: data.tags || []
            });
            setAddMode('form');
            showSuccess("Imported", "JSON data ready for review.");
        } catch (e) {
            showError("JSON Error", "Invalid JSON format. Please check your syntax.");
        }
    };

    const handleDeleteQuestion = async (docId) => {
        showConfirm(
            "Delete Question",
            "Are you sure you want to permanently delete this question?",
            async () => {
                try {
                    await deleteDoc(doc(db, 'questions', docId));
                    showSuccess("Deleted", "Question removed successfully.");
                } catch (error) {
                    showError("Error", "Failed to delete question.");
                }
            }
        );
    };

    const handleSave = async () => {
        if (!formData.question || !formData.expectedAnswer) {
            showError("Missing Fields", "Please fill in all required fields.");
            return;
        }

        try {
            if (isEditing) {
                const { updateDoc } = await import('firebase/firestore');
                await updateDoc(doc(db, 'questions', isEditing), {
                    ...formData,
                    updatedAt: new Date().toISOString()
                });
                showSuccess("Updated", "Question updated successfully.");
            } else {
                await addDoc(collection(db, 'questions'), {
                    ...formData,
                    createdAt: new Date().toISOString()
                });
                showSuccess("Saved", "New question added to bank.");
            }
            
            setIsAdding(false);
            setIsEditing(null);
            setFormData({
                role: 'Frontend',
                company: 'TCS',
                difficulty: 'Easy',
                question: '',
                expectedAnswer: '',
                hints: ['hooks', 'virtual DOM'],
                tags: ['react', 'library', 'javascript']
            });
        } catch (error) {
            showError("Save Failed", "Could not connect to Firestore.");
        }
    };

    // Fetch questions from Firestore on mount
    React.useEffect(() => {
        setLoading(true);
        const q = query(collection(db, 'questions'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, 
            (snapshot) => {
                const fetchedQuestions = snapshot.docs.map(doc => ({
                    docId: doc.id,
                    ...doc.data()
                }));
                setQuestions(fetchedQuestions);
                setLoading(false);
            },
            (error) => {
                console.error("Firestore error:", error);
                setLoading(false);
            }
        );
        return unsubscribe;
    }, []);

    const handleEditQuestion = (q) => {
        setFormData({
            role: q.role,
            company: q.company,
            difficulty: q.difficulty,
            question: q.question,
            expectedAnswer: q.expectedAnswer,
            hints: q.hints || [],
            tags: q.tags || []
        });
        setIsEditing(q.docId);
        setIsAdding(true);
    };

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Master Lists State
    const [masterLists, setMasterLists] = useState({ roles: [], companies: [], tags: [] });

    useEffect(() => {
        const unsubRoles = onSnapshot(collection(db, 'roles'), s => 
            setMasterLists(prev => ({ ...prev, roles: s.docs.map(d => d.data().name) })));
        const unsubCompanies = onSnapshot(collection(db, 'companies'), s => 
            setMasterLists(prev => ({ ...prev, companies: s.docs.map(d => d.data().name) })));
        const unsubTags = onSnapshot(collection(db, 'tags'), s => 
            setMasterLists(prev => ({ ...prev, tags: s.docs.map(d => d.data().name) })));
        
        return () => { unsubRoles(); unsubCompanies(); unsubTags(); };
    }, []);

    // Derive filter options from the questions themselves to ensure they are always populated
    const roleOptions = Array.from(new Set([
        ...masterLists.roles,
        ...questions.map(q => q.role)
    ].filter(Boolean))).sort();

    const companyOptions = Array.from(new Set([
        ...masterLists.companies,
        ...questions.map(q => q.company)
    ].filter(Boolean))).sort();



    const [hintInput, setHintInput] = useState('');
    const [tagInput, setTagInput] = useState('');

    const handleAddHint = (e) => {
        if (e.key === 'Enter' && hintInput.trim()) {
            e.preventDefault();
            if (!formData.hints.includes(hintInput.trim())) {
                setFormData({ ...formData, hints: [...formData.hints, hintInput.trim()] });
            }
            setHintInput('');
        }
    };

    const handleRemoveHint = (hintToRemove) => {
        setFormData({ ...formData, hints: formData.hints.filter(h => h !== hintToRemove) });
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            e.preventDefault();
            if (!formData.tags.includes(tagInput.trim())) {
                setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
            }
            setTagInput('');
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) });
    };

    const [roleFilter, setRoleFilter] = useState(initialRole);
    const [companyFilter, setCompanyFilter] = useState(initialCompany);
    const [difficultyFilter, setDifficultyFilter] = useState('All Difficulties');
    const [searchQuery, setSearchQuery] = useState(initialTag);


    const filteredQuestions = questions.filter(q => {
        // 1. Search Query Logic (Search in Question, Role, Company, Difficulty, and Tags)
        const query = searchQuery.toLowerCase().trim();
        const matchesSearch = 
            q.question.toLowerCase().includes(query) ||
            q.role.toLowerCase().includes(query) ||
            q.company.toLowerCase().includes(query) ||
            q.difficulty.toLowerCase().includes(query) ||
            (q.tags && q.tags.some(tag => tag.toLowerCase().includes(query)));

        // 2. Filter Dropdown Logic
        const matchesRole = roleFilter === 'All Roles' || q.role === roleFilter;
        const matchesCompany = companyFilter === 'All Companies' || q.company === companyFilter;
        const matchesDifficulty = difficultyFilter === 'All Difficulties' || q.difficulty === difficultyFilter;

        return matchesSearch && matchesRole && matchesCompany && matchesDifficulty;
    });

    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredQuestions.length);
    const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);


    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                {/* Custom Popup Modal */}
                {popup.show && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPopup(p => ({ ...p, show: false }))} />
                        <div className="bg-[#0b1121] border border-slate-800 rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative">
                            <div className={`w-20 h-20 rounded-3xl mb-6 mx-auto flex items-center justify-center ${
                                popup.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 
                                popup.type === 'error' ? 'bg-rose-500/10 text-rose-400' : 
                                'bg-indigo-500/10 text-indigo-400'
                            }`}>
                                {popup.type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : 
                                 popup.type === 'error' ? <AlertCircle className="w-10 h-10" /> : 
                                 <HelpCircle className="w-10 h-10" />}
                            </div>
                            
                            <h3 className="text-2xl font-black text-white text-center mb-2">{popup.title}</h3>
                            <p className="text-slate-400 text-center mb-8 font-medium">{popup.message}</p>
                            
                            <div className="flex gap-4">
                                {popup.type === 'confirm' ? (
                                    <>
                                        <button 
                                            onClick={() => setPopup(p => ({ ...p, show: false }))}
                                            className="flex-1 py-4 rounded-2xl text-slate-400 hover:text-white font-bold transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            onClick={() => {
                                                popup.onConfirm();
                                                setPopup(p => ({ ...p, show: false }));
                                            }}
                                            className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20"
                                        >
                                            Confirm
                                        </button>
                                    </>
                                ) : (
                                    <button 
                                        onClick={() => setPopup(p => ({ ...p, show: false }))}
                                        className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-bold transition-all"
                                    >
                                        Dismiss
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* HEADER */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Question Bank</h2>
                        <p className="text-slate-500 mt-1">Add, edit and manage interview questions</p>
                    </div>
                    <button 
                        onClick={() => setIsAdding(!isAdding)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20 transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add New Question
                    </button>
                </div>



                {/* ADD / EDIT FORM */}
                {isAdding && (
                    <div className="bg-[#0b1121] border border-slate-800/50 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-top-4 duration-500">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-6">
                                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                                    <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center">
                                        {isEditing ? <Edit2 className="w-4 h-4 text-indigo-400" /> : <Plus className="w-4 h-4 text-indigo-400" />}
                                    </div>
                                    {isEditing ? 'Edit Question' : 'Add New Question'}
                                </h3>
                                
                                {!isEditing && (
                                    <div className="flex bg-[#020617] p-1 rounded-xl border border-slate-800">
                                        <button 
                                            onClick={() => setAddMode('form')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${addMode === 'form' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Form Mode
                                        </button>
                                        <button 
                                            onClick={() => setAddMode('json')}
                                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${addMode === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            JSON Mode
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setIsAdding(false)} className="p-2 text-slate-500 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {addMode === 'json' && !isEditing ? (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Paste Question JSON</label>
                                    <textarea 
                                        className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-indigo-400 font-mono text-sm focus:border-indigo-500 transition-all outline-none min-h-[300px] resize-none"
                                        placeholder='{ "question": "...", "expectedAnswer": "...", "role": "...", "tags": [...] }'
                                        value={jsonInput}
                                        onChange={(e) => setJsonInput(e.target.value)}
                                    />
                                </div>
                                <button 
                                    onClick={handleJsonImport}
                                    className="w-full py-4 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl font-bold hover:bg-indigo-600 hover:text-white transition-all"
                                >
                                    Preview & Import JSON
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role *</label>
                                        <input 
                                            type="text"
                                            list="role-options"
                                            placeholder="Select or type role..."
                                            value={formData.role}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <datalist id="role-options">
                                            {roleOptions.map(r => <option key={r} value={r} />)}
                                        </datalist>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company *</label>
                                        <input 
                                            type="text"
                                            list="company-options"
                                            placeholder="Select or type company..."
                                            value={formData.company}
                                            onChange={(e) => setFormData({...formData, company: e.target.value})}
                                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none"
                                        />
                                        <datalist id="company-options">
                                            {companyOptions.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Difficulty *</label>
                                        <select 
                                            value={formData.difficulty}
                                            onChange={(e) => setFormData({...formData, difficulty: e.target.value})}
                                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                        >
                                            <option>Easy</option>
                                            <option>Medium</option>
                                            <option>Hard</option>
                                        </select>
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Question *</label>
                                        <textarea 
                                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-white focus:border-indigo-500 transition-all outline-none min-h-[120px] resize-none"
                                            placeholder="Enter the interview question..."
                                            value={formData.question}
                                            onChange={(e) => setFormData({...formData, question: e.target.value})}
                                        />
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-bold text-slate-600">{formData.question.length}/500</span>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Expected Answer *</label>
                                        <textarea 
                                            className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-6 py-5 text-white focus:border-indigo-500 transition-all outline-none min-h-[160px] resize-none"
                                            placeholder="Enter the detailed expected answer..."
                                            value={formData.expectedAnswer}
                                            onChange={(e) => setFormData({...formData, expectedAnswer: e.target.value})}
                                        />
                                        <div className="flex justify-end">
                                            <span className="text-[10px] font-bold text-slate-600">{formData.expectedAnswer.length}/2000</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Follow Up Hints *</label>
                                            <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 min-h-[120px] space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    {formData.hints.map((hint, i) => (
                                                        <span key={i} className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/20">
                                                            {hint}
                                                            <X className="w-3 h-3 cursor-pointer hover:text-indigo-300" onClick={() => handleRemoveHint(hint)} />
                                                        </span>
                                                    ))}
                                                </div>
                                                <input 
                                                    className="w-full bg-transparent border-none outline-none text-sm text-slate-400"
                                                    placeholder="Add hint and press Enter"
                                                    value={hintInput}
                                                    onChange={(e) => setHintInput(e.target.value)}
                                                    onKeyDown={handleAddHint}
                                                />
                                            </div>
                                            <p className="text-[10px] text-slate-600 font-medium ml-1">Press Enter to add more hints</p>
                                        </div>
                                    </div>

                                    <div className="md:col-span-3 space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Tags</label>
                                        <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 space-y-3">
                                            <div className="flex flex-wrap gap-2">
                                                {formData.tags.map((tag, i) => (
                                                    <span key={i} className="flex items-center gap-2 bg-purple-500/10 text-purple-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-purple-500/20">
                                                        {tag}
                                                        <X className="w-3 h-3 cursor-pointer hover:text-purple-300" onClick={() => handleRemoveTag(tag)} />
                                                    </span>
                                                ))}
                                            </div>
                                            <input 
                                                className="w-full bg-transparent border-none outline-none text-sm text-slate-400"
                                                placeholder="Add tag and press Enter"
                                                value={tagInput}
                                                onChange={(e) => setTagInput(e.target.value)}
                                                onKeyDown={handleAddTag}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-600 font-medium ml-1">Press Enter to add more tags</p>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-4 mt-10">
                                    <button 
                                        onClick={() => setIsAdding(false)}
                                        className="px-8 py-3.5 rounded-2xl text-slate-400 hover:text-white font-bold transition-colors"
                                    >
                                        Reset
                                    </button>
                                    <button 
                                        onClick={handleSave}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20"
                                    >
                                        <Save className="w-5 h-5" />
                                        {isEditing ? 'Update Question' : 'Save Question'}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ALL QUESTIONS TABLE */}
                <div className="bg-[#0b1121] border border-slate-800/50 rounded-3xl overflow-hidden shadow-2xl">
                    <div className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800/50">
                        <h3 className="text-xl font-bold text-white tracking-tight">All Questions</h3>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            {/* SEARCH */}
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                                <input 
                                    type="text"
                                    placeholder="Search questions..."
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setCurrentPage(1); // Reset to page 1 on search
                                    }}
                                    className="bg-[#020617] border border-slate-800 rounded-2xl pl-12 pr-6 py-3.5 text-sm text-white focus:border-indigo-500 outline-none transition-all w-64"
                                />
                            </div>

                            {/* FILTERS */}
                            <select 
                                value={roleFilter}
                                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-[#020617] border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                            >
                                <option>All Roles</option>
                                {roleOptions.map(role => <option key={role} value={role}>{role}</option>)}
                            </select>
                            
                            <select 
                                value={companyFilter}
                                onChange={(e) => { setCompanyFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-[#020617] border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                            >
                                <option>All Companies</option>
                                {companyOptions.map(company => <option key={company} value={company}>{company}</option>)}
                            </select>

 
                            <select 
                                value={difficultyFilter}
                                onChange={(e) => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
                                className="bg-[#020617] border border-slate-800 rounded-2xl px-5 py-3.5 text-sm text-white focus:border-indigo-500 outline-none cursor-pointer"
                            >
                                <option>All Difficulties</option>
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>

                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-4">
                                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                                <p className="text-slate-500 font-bold animate-pulse">Syncing with Firestore...</p>
                            </div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-800/50">
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest w-16">#</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Question</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Company</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Difficulty</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest">Tags</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedQuestions.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-8 py-20 text-center text-slate-600 font-bold italic">
                                                No questions found. Add your first question above!
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedQuestions.map((q, i) => (
                                            <tr key={q.docId} className="border-b border-slate-800/30 hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-8 py-6 text-sm font-bold text-slate-500">{startIndex + i + 1}</td>
                                                <td className="px-8 py-6">
                                                    <p className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">{q.question}</p>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg text-xs font-bold border border-indigo-500/20">
                                                        {q.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-sm font-semibold text-slate-400">{q.company}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                                                        q.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-500' : 
                                                        q.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 
                                                        'bg-rose-500/10 text-rose-500'
                                                    }`}>
                                                        {q.difficulty}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex gap-2">
                                                        {q.tags?.slice(0, 2).map((tag, idx) => (
                                                            <span key={idx} className="bg-slate-800 text-slate-400 px-2 py-1 rounded-md text-[10px] font-bold">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                        {q.tags?.length > 2 && (
                                                            <span className="bg-slate-800 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">
                                                                +{q.tags.length - 2}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex items-center justify-end gap-3">
                                                        <button 
                                                            onClick={() => handleEditQuestion(q)}
                                                            className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeleteQuestion(q.docId)}
                                                            className="p-2 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* PAGINATION */}
                    <div className="flex items-center justify-between px-8 py-5 bg-[#0b1121] border-t border-slate-800/50">
                        <p className="text-xs font-bold text-slate-500">
                            Page <span className="text-white">{currentPage}</span> of <span className="text-white">{totalPages || 1}</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg bg-slate-800/50 transition-all ${currentPage === 1 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            
                            <div className="flex gap-2">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button 
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-800/50 text-slate-500 hover:text-white hover:bg-slate-700'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages || totalPages === 0}
                                className={`p-2 rounded-lg bg-slate-800/50 transition-all ${currentPage === totalPages || totalPages === 0 ? 'text-slate-700 cursor-not-allowed' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default QuestionBank;
