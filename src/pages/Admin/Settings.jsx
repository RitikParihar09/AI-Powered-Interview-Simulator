import React from 'react';
import AdminLayout from './AdminLayout';
import { Settings as SettingsIcon, Shield, Bell, Database, Globe, Key } from 'lucide-react';

const Settings = () => {
    const sections = [
        { title: 'General Settings', description: 'Configure platform name, logo and basic details', icon: Globe },
        { title: 'Security & Auth', description: 'Manage login methods and admin permissions', icon: Shield },
        { title: 'Notifications', description: 'Configure email and system notifications', icon: Bell },
        { title: 'Database & Storage', description: 'View storage usage and database backups', icon: Database },
        { title: 'API Configuration', description: 'Manage LLM and external service keys', icon: Key },
    ];

    return (
        <AdminLayout>
            <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Settings</h2>
                    <p className="text-slate-500 mt-1">Manage your platform configuration</p>
                </div>

                <div className="space-y-4">
                    {sections.map((section, i) => (
                        <div key={i} className="bg-[#0b1121] border border-slate-800/50 p-8 rounded-3xl flex items-center justify-between group hover:border-indigo-500/50 transition-all cursor-pointer">
                            <div className="flex items-center gap-6">
                                <div className="w-14 h-14 bg-slate-800/50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-colors">
                                    <section.icon className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-white tracking-tight">{section.title}</h4>
                                    <p className="text-sm text-slate-500">{section.description}</p>
                                </div>
                            </div>
                            <div className="w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-slate-600 group-hover:border-indigo-500/50 group-hover:text-indigo-400 transition-all">
                                →
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AdminLayout>
    );
};

export default Settings;
