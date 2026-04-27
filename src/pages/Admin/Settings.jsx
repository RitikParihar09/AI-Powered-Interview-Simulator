import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { 
    Settings as SettingsIcon, 
    Shield, 
    Bell, 
    Database, 
    Globe, 
    Key,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    Users,
    X
} from 'lucide-react';


const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [config, setConfig] = useState({
        siteName: 'Interview Buddy',
        adminEmail: 'ritikparihar2040@gmail.com',
        adminEmails: [],
        maintenanceMode: false,
        allowSignup: true,
        maxInterviewDuration: '60',
        apiModel: 'google/gemini-2.0-flash-001'
    });

    const [newAdminEmail, setNewAdminEmail] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, 'settings', 'platform');
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setConfig(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (error) {
                console.error("Error fetching settings:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleAddAdmin = (e) => {
        if (e.key === 'Enter' && newAdminEmail.trim()) {
            e.preventDefault();
            if (!config.adminEmails.includes(newAdminEmail.trim())) {
                setConfig({ ...config, adminEmails: [...config.adminEmails, newAdminEmail.trim()] });
            }
            setNewAdminEmail('');
        }
    };

    const handleRemoveAdmin = (email) => {
        setConfig({ ...config, adminEmails: config.adminEmails.filter(e => e !== email) });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'platform'), {
                ...config,
                updatedAt: new Date().toISOString()
            });
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 3000);
        } catch (error) {
            alert("Failed to save settings: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                    <p className="text-slate-500 font-bold animate-pulse">Loading Configuration...</p>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
                        <p className="text-slate-500 mt-1">Manage your platform configuration</p>
                    </div>
                    <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3.5 rounded-2xl font-bold flex items-center gap-3 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {showSuccess && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400 animate-in slide-in-from-top-2">
                        <CheckCircle2 className="w-5 h-5" />
                        <p className="font-bold">Settings saved successfully!</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* GENERAL SETTINGS */}
                    <div className="bg-[#0b1121] border border-slate-800/50 p-8 rounded-[40px] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center">
                                <Globe className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">General Settings</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Site Name</label>
                                <input 
                                    type="text"
                                    value={config.siteName}
                                    onChange={(e) => setConfig({...config, siteName: e.target.value})}
                                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Primary Admin Email</label>
                                    <span className="text-[10px] font-black text-amber-500/80 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10">System Default</span>
                                </div>
                                <input 
                                    type="email"
                                    value={config.adminEmail}
                                    readOnly
                                    className="w-full bg-[#020617] border border-slate-800/50 rounded-2xl px-5 py-4 text-slate-500 cursor-not-allowed transition-all outline-none"
                                />
                                <p className="text-[10px] text-slate-600 font-medium ml-1">Managed via environment variables (.env)</p>
                            </div>

                        </div>
                    </div>

                    {/* ADMIN PERMISSIONS */}
                    <div className="bg-[#0b1121] border border-slate-800/50 p-8 rounded-[40px] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                <Users className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Additional Admins</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Authorized Emails</label>
                                <div className="bg-[#020617] border border-slate-800 rounded-2xl p-4 min-h-[120px] space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {config.adminEmails.map((email, i) => (
                                            <span key={i} className="flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/20">
                                                {email}
                                                <X className="w-3 h-3 cursor-pointer hover:text-indigo-300" onClick={() => handleRemoveAdmin(email)} />
                                            </span>
                                        ))}
                                    </div>
                                    <input 
                                        className="w-full bg-transparent border-none outline-none text-sm text-slate-400"
                                        placeholder="Add email and press Enter"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                        onKeyDown={handleAddAdmin}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-600 font-medium ml-1">These users will have full admin panel access</p>
                            </div>
                        </div>
                    </div>


                    {/* API CONFIGURATION */}
                    <div className="bg-[#0b1121] border border-slate-800/50 p-8 rounded-[40px] space-y-6">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                <Key className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">AI Configuration</h3>
                        </div>
                        
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Default LLM Model</label>
                                <select 
                                    value={config.apiModel}
                                    onChange={(e) => setConfig({...config, apiModel: e.target.value})}
                                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none appearance-none cursor-pointer"
                                >
                                    <option value="google/gemini-2.0-flash-001">Gemini 2.0 Flash</option>
                                    <option value="google/gemini-pro">Gemini Pro</option>
                                    <option value="openai/gpt-4o">GPT-4o</option>
                                    <option value="anthropic/claude-3-sonnet">Claude 3.5 Sonnet</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Max Interview Duration (Mins)</label>
                                <input 
                                    type="number"
                                    value={config.maxInterviewDuration}
                                    onChange={(e) => setConfig({...config, maxInterviewDuration: e.target.value})}
                                    className="w-full bg-[#020617] border border-slate-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 transition-all outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* PERMISSIONS */}
                    <div className="bg-[#0b1121] border border-slate-800/50 p-8 rounded-[40px] md:col-span-2">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                                <Shield className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="text-xl font-bold text-white">Platform Permissions</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="flex items-center justify-between p-6 bg-[#020617] border border-slate-800 rounded-3xl">
                                <div>
                                    <p className="font-bold text-white">Allow New Signups</p>
                                    <p className="text-xs text-slate-500 mt-1">Enable or disable registration of new accounts</p>
                                </div>
                                <button 
                                    onClick={() => setConfig({...config, allowSignup: !config.allowSignup})}
                                    className={`w-14 h-8 rounded-full transition-all relative ${config.allowSignup ? 'bg-indigo-600' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.allowSignup ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-[#020617] border border-slate-800 rounded-3xl">
                                <div>
                                    <p className="font-bold text-white">Maintenance Mode</p>
                                    <p className="text-xs text-slate-500 mt-1">Disable front-end access for users</p>
                                </div>
                                <button 
                                    onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                                    className={`w-14 h-8 rounded-full transition-all relative ${config.maintenanceMode ? 'bg-rose-600' : 'bg-slate-800'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config.maintenanceMode ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default Settings;

