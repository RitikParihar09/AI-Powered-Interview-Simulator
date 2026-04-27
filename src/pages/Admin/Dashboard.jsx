import React from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { LayoutDashboard, Users, MessageSquare, TrendingUp, BookOpen, Building2, Grid, UserCircle, Tag } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = React.useState({
        questions: 0,
        companies: 0,
        categories: 0,
        roles: 0,
        tags: 0
    });

    React.useEffect(() => {
        const q = query(collection(db, 'questions'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allQuestions = snapshot.docs.map(doc => doc.data());
            
            // Calculate unique values
            const uniqueCompanies = new Set(allQuestions.map(q => q.company)).size;
            const uniqueRoles = new Set(allQuestions.map(q => q.role)).size;
            
            // For tags, we need to flatten the array first
            const allTags = allQuestions.flatMap(q => q.tags || []);
            const uniqueTags = new Set(allTags).size;

            setStats({
                questions: snapshot.size,
                companies: uniqueCompanies,
                categories: uniqueRoles, // Using Roles as Categories for now
                roles: uniqueRoles,
                tags: uniqueTags
            });
        });
        return unsubscribe;
    }, []);

    const statCards = [
        { label: 'Total Questions', value: stats.questions.toString(), icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Companies', value: stats.companies.toString(), icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Roles', value: stats.roles.toString(), icon: UserCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Total Tags', value: stats.tags.toString(), icon: Tag, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ];

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
                <div>
                    <h2 className="text-3xl font-black text-white tracking-tight">Admin Dashboard</h2>
                    <p className="text-slate-500 mt-1">Overview of your interview platform metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                    {statCards.map((stat, i) => (
                        <div key={i} className="bg-[#0b1121] border border-slate-800/50 p-10 rounded-[40px] shadow-2xl hover:border-indigo-500/50 transition-all group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className={`p-5 rounded-3xl ${stat.bg} shadow-inner`}>
                                    <stat.icon className={`w-10 h-10 ${stat.color}`} />
                                </div>
                                <span className="text-[12px] font-black text-slate-500 uppercase tracking-widest bg-slate-800/50 px-4 py-2 rounded-xl">Realtime</span>
                            </div>
                            
                            <div className="space-y-1">
                                <h3 className="text-6xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left">
                                    {stat.value}
                                </h3>
                                <p className="text-lg font-bold text-slate-500 tracking-tight">{stat.label}</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
