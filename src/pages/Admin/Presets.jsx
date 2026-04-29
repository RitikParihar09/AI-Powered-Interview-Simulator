
import React, { useState, useEffect } from 'react';
import { 
    collection, query, onSnapshot, addDoc, 
    deleteDoc, doc, updateDoc, serverTimestamp, orderBy,
    writeBatch
} from 'firebase/firestore';
import { 
    Plus, Search, Edit2, Trash2, Loader2, 
    CheckCircle2, X, Layout, Clock, Gauge, Tag, Building2,
    FileJson, Upload
} from 'lucide-react';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { useTheme } from '../../context/ThemeContext';

const Presets = () => {
    const { theme } = useTheme();
    const [presets, setPresets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
    const [jsonInput, setJsonInput] = useState('');
    const [isImporting, setIsImporting] = useState(false);
    const [editingPreset, setEditingPreset] = useState(null);
    const [popup, setPopup] = useState({ show: false, title: '', message: '' });

    const handleBulkImport = async () => {
        try {
            const data = JSON.parse(jsonInput);
            if (!Array.isArray(data)) throw new Error("Input must be a JSON Array [ ]");

            setIsImporting(true);
            const batch = writeBatch(db);
            
            data.forEach((preset) => {
                const newDocRef = doc(collection(db, "presets"));
                batch.set(newDocRef, {
                    ...preset,
                    topics: Array.isArray(preset.topics) ? preset.topics : preset.topics?.split(',').map(t => t.trim()) || [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            });

            await batch.commit();
            showSuccess("Imported", `Successfully added ${data.length} presets.`);
            setIsJsonModalOpen(false);
            setJsonInput('');
        } catch (error) {
            alert("Invalid JSON format! Please check your syntax.\n\nError: " + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    const [formData, setFormData] = useState({
        role: '',
        company: 'General',
        difficulty: 'Medium',
        duration: '10 mins',
        topics: '',
        useQuestionBank: true
    });

    useEffect(() => {
        const q = query(collection(db, 'presets'), orderBy('role', 'asc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPresets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const showSuccess = (title, message) => {
        setPopup({ show: true, title, message });
        setTimeout(() => setPopup({ show: false, title: '', message: '' }), 3000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const topicsArray = formData.topics.split(',').map(t => t.trim()).filter(t => t);
        const finalData = { ...formData, topics: topicsArray, updatedAt: serverTimestamp() };

        try {
            if (editingPreset) {
                await updateDoc(doc(db, 'presets', editingPreset.id), finalData);
                showSuccess("Updated", "Preset has been updated successfully.");
            } else {
                await addDoc(collection(db, 'presets'), { ...finalData, createdAt: serverTimestamp() });
                showSuccess("Added", "New preset added to the database.");
            }
            handleCloseModal();
        } catch (error) {
            alert("Error saving preset: " + error.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this preset?")) return;
        try {
            await deleteDoc(doc(db, 'presets', id));
            showSuccess("Deleted", "Preset removed successfully.");
        } catch (error) {
            alert("Error deleting preset: " + error.message);
        }
    };

    const handleOpenEdit = (preset) => {
        setEditingPreset(preset);
        setFormData({
            role: preset.role,
            company: preset.company,
            difficulty: preset.difficulty,
            duration: preset.duration,
            topics: preset.topics.join(', '),
            useQuestionBank: preset.useQuestionBank
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingPreset(null);
        setFormData({
            role: '',
            company: 'General',
            difficulty: 'Medium',
            duration: '10 mins',
            topics: '',
            useQuestionBank: true
        });
    };

    const filteredPresets = presets.filter(p => 
        p.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.company.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            {/* POPUP NOTIFICATION */}
            {popup.show && (
                <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right duration-300">
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-emerald-500/50' : 'bg-white border-emerald-500'} border-l-4 rounded-xl p-4 shadow-2xl flex items-center gap-4`}>
                        <div className="bg-emerald-500/10 p-2 rounded-lg">
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <h4 className={`font-bold text-sm ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>{popup.title}</h4>
                            <p className="text-xs text-slate-500">{popup.message}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD/EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleCloseModal} />
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800' : 'bg-white border-slate-200'} border rounded-[40px] p-10 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300`}>
                        <button onClick={handleCloseModal} className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-500">
                            <X className="w-6 h-6" />
                        </button>

                        <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>
                            {editingPreset ? 'Edit Preset' : 'New Interview Preset'}
                        </h3>
                        <p className="text-slate-500 mb-8 font-medium italic">Configure the details for this dynamic role.</p>

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Job Role</label>
                                <input 
                                    required value={formData.role} 
                                    onChange={e => setFormData({...formData, role: e.target.value})}
                                    className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all`}
                                    placeholder="e.g. SDE - Intern"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Company</label>
                                <input 
                                    required value={formData.company} 
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                    className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all`}
                                    placeholder="e.g. Google"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Difficulty</label>
                                <select 
                                    value={formData.difficulty} 
                                    onChange={e => setFormData({...formData, difficulty: e.target.value})}
                                    className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all cursor-pointer`}
                                >
                                    <option>Easy</option>
                                    <option>Medium</option>
                                    <option>Hard</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Duration</label>
                                <input 
                                    required value={formData.duration} 
                                    onChange={e => setFormData({...formData, duration: e.target.value})}
                                    className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all`}
                                    placeholder="e.g. 15 mins"
                                />
                            </div>

                            <div className="col-span-full space-y-2">
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Topics (Comma separated)</label>
                                <textarea 
                                    required value={formData.topics} 
                                    onChange={e => setFormData({...formData, topics: e.target.value})}
                                    rows="3"
                                    className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all resize-none`}
                                    placeholder="React, SQL, OS, Networking..."
                                />
                            </div>

                            <div className="col-span-full pt-4">
                                <button type="submit" className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-600/20 transition-all transform hover:scale-[1.02] active:scale-95">
                                    {editingPreset ? 'Update Preset' : 'Create Preset'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* BULK JSON MODAL */}
            {isJsonModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsJsonModalOpen(false)} />
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800' : 'bg-white border-slate-200'} border rounded-[40px] p-10 max-w-3xl w-full shadow-2xl relative animate-in zoom-in-95 duration-300`}>
                        <button onClick={() => setIsJsonModalOpen(false)} className="absolute top-6 right-6 p-2 hover:bg-slate-800 rounded-full text-slate-500">
                            <X className="w-6 h-6" />
                        </button>

                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-indigo-500/10 rounded-2xl">
                                <FileJson className="w-8 h-8 text-indigo-400" />
                            </div>
                            <div>
                                <h3 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>Bulk JSON Import</h3>
                                <p className="text-slate-500 font-medium">Paste an array of presets to import them all at once.</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <textarea 
                                    value={jsonInput}
                                    onChange={(e) => setJsonInput(e.target.value)}
                                    placeholder='[ { "role": "Example", "company": "Google", "difficulty": "Hard", "duration": "15 mins", "topics": ["React", "UI"], "useQuestionBank": true } ]'
                                    className={`w-full h-80 ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-emerald-400 font-mono' : 'bg-slate-50 border-slate-200 text-slate-900 font-mono'} border rounded-3xl p-8 outline-none focus:border-indigo-500 transition-all resize-none text-sm`}
                                />
                                <div className="absolute bottom-4 right-6 text-[10px] font-black text-slate-500 uppercase tracking-widest opacity-30">JSON FORMAT REQUIRED</div>
                            </div>

                            <button 
                                onClick={handleBulkImport}
                                disabled={isImporting || !jsonInput.trim()}
                                className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-[24px] font-black text-lg shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-3"
                            >
                                {isImporting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Upload className="w-6 h-6" />}
                                {isImporting ? 'Importing Data...' : 'Start Bulk Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>Interview Presets</h2>
                        <p className="text-slate-500 mt-1 font-medium italic">Manage the "Jump Start" roles available to users.</p>
                    </div>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setIsJsonModalOpen(true)}
                            className={`${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'} px-6 py-4 rounded-[24px] font-bold flex items-center gap-3 transition-all hover:bg-indigo-600 hover:text-white active:scale-95`}
                        >
                            <FileJson className="w-5 h-5" />
                            Bulk JSON
                        </button>
                        <button 
                            onClick={() => setIsModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-[24px] font-bold flex items-center gap-3 transition-all shadow-xl shadow-indigo-600/20 transform hover:scale-105 active:scale-95"
                        >
                            <Plus className="w-6 h-6" />
                            New Preset
                        </button>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="relative w-full max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text"
                        placeholder="Search roles or companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800 text-white' : 'bg-white border-slate-200 shadow-md text-slate-900'} border rounded-2xl pl-12 pr-6 py-4 text-sm focus:border-indigo-500 outline-none transition-all w-full`}
                    />
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
                        <p className="text-slate-500 font-black tracking-widest animate-pulse">SYNCING PRESETS...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredPresets.map((preset) => (
                            <div key={preset.id} className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50 hover:border-indigo-500/50' : 'bg-white border-slate-100 shadow-xl hover:shadow-2xl'} border p-8 rounded-[40px] transition-all group relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 p-6 flex gap-2">
                                    <button onClick={() => handleOpenEdit(preset)} className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(preset.id)} className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="flex items-start gap-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500/10 to-blue-500/10 rounded-3xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                        <Layout className="w-8 h-8" />
                                    </div>
                                    <div className="flex-1 pr-16">
                                        <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{preset.role}</h3>
                                        <div className="flex flex-wrap items-center gap-4 mt-3">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Building2 className="w-3.5 h-3.5" /> {preset.company}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500">
                                                <Clock className="w-3.5 h-3.5" /> {preset.duration}
                                            </span>
                                            <span className={`flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${
                                                preset.difficulty === 'Hard' ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' :
                                                preset.difficulty === 'Medium' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                                                'bg-emerald-500/5 text-emerald-500 border-emerald-500/20'
                                            }`}>
                                                <Gauge className="w-3 h-3" /> {preset.difficulty}
                                            </span>
                                        </div>

                                        <div className="mt-6 flex flex-wrap gap-2">
                                            {preset.topics.map((topic, idx) => (
                                                <span key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-slate-500/5 border border-slate-500/10 rounded-full text-[10px] font-bold text-slate-500">
                                                    <Tag className="w-2.5 h-2.5 opacity-50" /> {topic}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};

export default Presets;
