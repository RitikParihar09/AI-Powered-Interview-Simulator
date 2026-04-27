import React from 'react';
import { collection, query, onSnapshot, collectionGroup, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { 
    Users, 
    MessageSquare, 
    BookOpen, 
    Building2, 
    UserCircle, 
    Tag,
    Calendar,
    TrendingUp
} from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = React.useState({
        questions: 0,
        companies: 0,
        roles: 0,
        tags: 0,
        users: 0,
        interviews: 0
    });
    const [recentInterviews, setRecentInterviews] = React.useState([]);

    React.useEffect(() => {
        // 1. Listen to Questions
        const qQuestions = query(collection(db, 'questions'));
        const unsubQuestions = onSnapshot(qQuestions, (snapshot) => {
            const allQuestions = snapshot.docs.map(doc => doc.data());
            const uniqueCompanies = new Set(allQuestions.map(q => q.company)).size;
            const uniqueRoles = new Set(allQuestions.map(q => q.role)).size;
            const allTags = allQuestions.flatMap(q => q.tags || []);
            const uniqueTags = new Set(allTags).size;

            setStats(prev => ({
                ...prev,
                questions: snapshot.size,
                companies: uniqueCompanies,
                roles: uniqueRoles,
                tags: uniqueTags
            }));
        });

        // 2. Listen to Total Users
        const qUsers = query(collection(db, 'users'));
        const unsubUsers = onSnapshot(qUsers, (snapshot) => {
            console.log("👥 Users found:", snapshot.size);
            setStats(prev => ({ ...prev, users: snapshot.size }));
        }, (err) => console.error("❌ Users count error:", err));

        // 3. Listen to Total Interviews (Simple count - no index needed)
        const qInterviewsTotal = query(collectionGroup(db, 'interviews'));
        const unsubInterviewsTotal = onSnapshot(qInterviewsTotal, (snapshot) => {
            console.log("🎙️ Total interviews found:", snapshot.size);
            setStats(prev => ({ ...prev, interviews: snapshot.size }));
        }, (err) => console.error("❌ Total interviews count error:", err));

        // 4. Listen to Recent Interviews (Needs Index if ordering)
        // We use a separate query for the list to avoid breaking the main count if index is missing
        const qRecent = query(collectionGroup(db, 'interviews'), orderBy('date', 'desc'), limit(5));
        const unsubRecent = onSnapshot(qRecent, (snapshot) => {
            const latest = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setRecentInterviews(latest);
        }, (err) => {
            console.warn("⚠️ Recent activity query failed (likely missing index):", err.message);
            // Fallback: try without ordering if sorted fails
            const qFallback = query(collectionGroup(db, 'interviews'), limit(5));
            onSnapshot(qFallback, (s) => {
                setRecentInterviews(s.docs.map(d => ({ id: d.id, ...d.data() })));
            });
        });

        return () => {
            unsubQuestions();
            unsubUsers();
            unsubInterviewsTotal();
            unsubRecent();
        };

    }, []);

    const statCards = [
        { label: 'Total Users', value: stats.users.toString(), icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
        { label: 'Total Interviews', value: stats.interviews.toString(), icon: MessageSquare, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { label: 'Total Questions', value: stats.questions.toString(), icon: BookOpen, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { label: 'Total Companies', value: stats.companies.toString(), icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Roles', value: stats.roles.toString(), icon: UserCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Total Tags', value: stats.tags.toString(), icon: Tag, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ];

    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tight">Admin Dashboard</h2>
                    <p className="text-slate-500 mt-1">Real-time overview of platform activity and metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

                {/* RECENT ACTIVITY SECTION */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white tracking-tight">Recent Activity</h3>
                        </div>
                        <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 px-4 py-2 rounded-xl">View All</button>
                    </div>

                    <div className="bg-[#0b1121] border border-slate-800/50 rounded-[40px] overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-slate-800/50 bg-slate-800/20">
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Job Role</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Score</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/30">
                                    {recentInterviews.length > 0 ? (
                                        recentInterviews.map((interview) => (
                                            <tr key={interview.id} className="hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {interview.userEmail?.[0].toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                                                                {interview.userEmail || 'Anonymous User'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Verified User</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className="px-4 py-2 bg-slate-800/50 rounded-xl text-xs font-bold text-slate-300 border border-slate-700/50">
                                                        {interview.role}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-center">
                                                    <span className={`text-xl font-black ${
                                                        interview.score >= 7 ? 'text-emerald-500' : 
                                                        interview.score >= 4 ? 'text-amber-500' : 'text-rose-500'
                                                    }`}>
                                                        {interview.score}/10
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <div className="flex flex-col items-end">
                                                        <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {interview.date?.seconds ? new Date(interview.date.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                        </div>
                                                        <p className="text-[10px] text-slate-600 font-black uppercase mt-1">Completed</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="w-20 h-20 bg-slate-800/30 rounded-full flex items-center justify-center">
                                                        <MessageSquare className="w-10 h-10 text-slate-600" />
                                                    </div>
                                                    <p className="text-slate-500 font-bold">No interviews recorded yet</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;


