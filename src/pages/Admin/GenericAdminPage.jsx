import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    collection, query, onSnapshot, getDocs, 
    deleteDoc, doc, writeBatch, where, addDoc, serverTimestamp 
} from 'firebase/firestore';
import { Plus, Search, MoreVertical, Edit2, Trash2, Loader2, CheckCircle2, HelpCircle, AlertCircle, X } from 'lucide-react';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { useTheme } from '../../context/ThemeContext';

const GenericAdminPage = ({ title, description, fieldName, targetCollection, icon: Icon }) => {
    const { theme } = useTheme();
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeMenu, setActiveMenu] = useState(null);
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

    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newItemName, setNewItemName] = useState('');

    const handleAddNew = async () => {
        if (!newItemName.trim()) return;

        try {
            await addDoc(collection(db, targetCollection), {
                name: newItemName.trim(),
                createdAt: serverTimestamp()
            });
            showSuccess("Added", `${newItemName} has been added to your ${title.toLowerCase()}.`);
            setIsAddingNew(false);
            setNewItemName('');
        } catch (error) {
            showError("Error", "Failed to add new item.");
        }
    };

    const handleDeleteAction = async (item) => {
        const titleText = item.isMaster ? `Delete ${title.slice(0, -1)}` : "Bulk Delete Questions";
        const messageText = item.isMaster 
            ? `Are you sure you want to delete "${item.name}" from the master list? (Questions will remain but unlinked)`
            : `Are you sure you want to delete ALL ${item.count} questions associated with "${item.name}"? This cannot be undone.`;

        showConfirm(
            titleText,
            messageText,
            async () => {
                try {
                    // 1. If it's a master item, delete from master collection
                    if (item.id) {
                        await deleteDoc(doc(db, targetCollection, item.id));
                    }
                    
                    // 2. If it's NOT a master item OR user wants to wipe questions, we delete questions
                    // For now, let's make it so if it's NOT a master item, it deletes the questions.
                    if (!item.isMaster) {
                        const q = query(collection(db, 'questions'));
                        const snapshot = await getDocs(q);
                        const batch = writeBatch(db);
                        let count = 0;

                        snapshot.docs.forEach((doc) => {
                            const data = doc.data();
                            const matches = fieldName === 'tags' 
                                ? (data.tags || []).includes(item.name)
                                : data[fieldName] === item.name;

                            if (matches) {
                                batch.delete(doc.ref);
                                count++;
                            }
                        });

                        await batch.commit();
                        showSuccess("Deleted", `Successfully removed ${count} questions.`);
                    } else {
                        showSuccess("Deleted", "Item removed from master list.");
                    }
                } catch (error) {
                    showError("Error", "Failed to perform deletion.");
                }
            }
        );
        setActiveMenu(null);
    };

    const handleEditSection = (itemName) => {
        const paramKey = fieldName === 'role' ? 'role' : fieldName === 'company' ? 'company' : 'tag';
        navigate(`/admin-panel/questions?${paramKey}=${encodeURIComponent(itemName)}`);
    };


    useEffect(() => {
        setLoading(true);
        const itemsQuery = query(collection(db, targetCollection));
        const questionsQuery = query(collection(db, 'questions'));

        let allQuestions = [];
        let masterItems = [];

        const updateData = () => {
            const counts = {};
            const questionValues = new Set();

            if (fieldName === 'tags') {
                allQuestions.forEach(q => {
                    (q.tags || []).forEach(tag => {
                        counts[tag] = (counts[tag] || 0) + 1;
                        questionValues.add(tag);
                    });
                });
            } else {
                allQuestions.forEach(q => {
                    const val = q[fieldName];
                    if (val) {
                        counts[val] = (counts[val] || 0) + 1;
                        questionValues.add(val);
                    }
                });
            }

            // Combine Master Items with values found in Questions
            const masterNames = new Set(masterItems.map(m => m.name));
            const allNames = new Set([...masterNames, ...questionValues]);

            const formattedItems = Array.from(allNames).map(name => {
                const masterItem = masterItems.find(m => m.name === name);
                return {
                    id: masterItem?.id || null, // null if only exists in questions
                    name,
                    count: counts[name] || 0,
                    isMaster: !!masterItem
                };
            }).sort((a, b) => b.count - a.count);

            setItems(formattedItems);
            setLoading(false);
        };

        const unsubItems = onSnapshot(itemsQuery, (snap) => {
            masterItems = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            updateData();
        });

        const unsubQuestions = onSnapshot(questionsQuery, (snap) => {
            allQuestions = snap.docs.map(d => d.data());
            updateData();
        });

        return () => { unsubItems(); unsubQuestions(); };
    }, [fieldName, targetCollection]);

    const filteredItems = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <AdminLayout>
            {popup.show && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setPopup(p => ({ ...p, show: false }))} />
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800' : 'bg-white border-slate-200'} border rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative text-center`}>
                        <div className={`w-20 h-20 rounded-3xl mb-6 mx-auto flex items-center justify-center ${
                            popup.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-indigo-500/10 text-indigo-400'
                        }`}>
                            {popup.type === 'success' ? <CheckCircle2 className="w-10 h-10" /> : <HelpCircle className="w-10 h-10" />}
                        </div>
                        <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} mb-2`}>{popup.title}</h3>
                        <p className="text-slate-500 mb-8 font-medium">{popup.message}</p>
                        <div className="flex gap-4">
                            {popup.type === 'confirm' ? (
                                <>
                                    <button onClick={() => setPopup(p => ({ ...p, show: false }))} className="flex-1 py-4 rounded-2xl text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
                                    <button onClick={() => { popup.onConfirm(); setPopup(p => ({ ...p, show: false })); }} className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold">Confirm</button>
                                </>
                            ) : (
                                <button onClick={() => setPopup(p => ({ ...p, show: false }))} className={`w-full py-4 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-900'} rounded-2xl font-bold`}>Dismiss</button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* CUSTOM ADD MODAL */}
            {isAddingNew && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsAddingNew(false)} />
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800' : 'bg-white border-slate-200'} border rounded-[40px] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300 relative`}>
                        <div className="w-20 h-20 rounded-3xl mb-6 mx-auto bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                            <Plus className="w-10 h-10" />
                        </div>
                        <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} text-center mb-2`}>New {title.slice(0, -1)}</h3>
                        <p className="text-slate-500 text-center mb-8 font-medium">Enter the name for your new {title.slice(0, -1).toLowerCase()}.</p>
                        
                        <div className="space-y-4">
                            <input 
                                type="text"
                                placeholder={`e.g. ${title === 'Companies' ? 'Google' : title === 'Roles' ? 'Frontend' : 'React'}`}
                                value={newItemName}
                                onChange={(e) => setNewItemName(e.target.value)}
                                autoFocus
                                className={`w-full ${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl px-6 py-4 focus:border-indigo-500 outline-none transition-all`}
                            />
                            <div className="flex gap-4">
                                <button onClick={() => setIsAddingNew(false)} className="flex-1 py-4 rounded-2xl text-slate-400 hover:text-white font-bold transition-colors">Cancel</button>
                                <button 
                                    onClick={handleAddNew}
                                    disabled={!newItemName.trim()}
                                    className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold shadow-lg shadow-indigo-600/20 transition-all"
                                >
                                    Add Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className={`text-3xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>{title}</h2>
                        <p className="text-slate-500 mt-1 font-medium">{description}</p>
                    </div>
                    <button 
                        onClick={() => setIsAddingNew(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20 transform hover:scale-105 active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        Add New {title.slice(0, -1)}
                    </button>
                </div>

                <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50' : 'bg-white border-slate-200 shadow-xl'} border rounded-3xl min-h-[400px]`}>
                    <div className={`p-8 border-b ${theme === 'dark' ? 'border-slate-800/50' : 'border-slate-100'}`}>
                        <div className="relative w-full max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder={`Search ${title.toLowerCase()}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`${theme === 'dark' ? 'bg-[#020617] border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'} border rounded-2xl pl-12 pr-6 py-3.5 text-sm focus:border-indigo-500 outline-none transition-all w-full`}
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <p className="text-slate-500 font-bold animate-pulse">Syncing with Firestore...</p>
                        </div>
                    ) : (
                        <div className="p-6 pb-40 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-visible">
                            {filteredItems.length === 0 ? (
                                <div className="col-span-full py-20 text-center text-slate-600 font-bold italic">
                                    No {title.toLowerCase()} found in your questions.
                                </div>
                            ) : (
                                filteredItems.map((item, i) => (
                                    <div key={i} className={`${theme === 'dark' ? 'bg-[#020617] border-slate-800/50' : 'bg-white border-slate-200 shadow-md hover:shadow-lg'} border p-6 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all relative`}>
                                        <div 
                                            className="flex items-center gap-4 cursor-pointer flex-1"
                                            onClick={() => handleEditSection(item.name)}
                                        >
                                            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                <Icon className="w-6 h-6 text-indigo-400 group-hover:text-white" />
                                            </div>
                                            <div>
                                                <h4 className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-600 transition-colors`}>{item.name}</h4>
                                                <p className="text-xs text-slate-500 font-medium group-hover:text-slate-400 transition-colors">{item.count} Questions</p>
                                            </div>
                                        </div>


                                        <div className="relative">
                                            <button 
                                                onClick={() => setActiveMenu(activeMenu === i ? null : i)}
                                                className={`p-2 ${theme === 'dark' ? 'text-slate-600 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'} transition-colors rounded-lg`}
                                            >
                                                <MoreVertical className="w-5 h-5" />
                                            </button>

                                            {activeMenu === i && (
                                                <div className={`absolute right-0 mt-2 w-48 ${theme === 'dark' ? 'bg-[#0b1121] border-slate-800' : 'bg-white border-slate-200 shadow-2xl'} border rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in duration-200`}>
                                                    <button 
                                                        onClick={() => handleEditSection(item.name)}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold ${theme === 'dark' ? 'text-slate-300 hover:bg-indigo-600' : 'text-slate-600 hover:bg-indigo-50'} hover:text-white transition-colors`}
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                        Edit Questions
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteAction(item)}
                                                        className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-rose-500 hover:bg-rose-500 hover:text-white transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        {item.isMaster ? `Delete ${title.slice(0, -1)}` : "Delete All Questions"}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default GenericAdminPage;
