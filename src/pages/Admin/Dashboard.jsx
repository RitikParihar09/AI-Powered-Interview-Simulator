import React from 'react';
import { collection, query, onSnapshot, collectionGroup, orderBy, limit, writeBatch, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import AdminLayout from './AdminLayout';
import { useTheme } from '../../context/ThemeContext';
import { 
    Users, 
    MessageSquare, 
    BookOpen, 
    Building2, 
    UserCircle, 
    Tag,
    Calendar,
    TrendingUp,
    RefreshCw
} from 'lucide-react';

const DifficultyPieChart = ({ questions }) => {
    const { theme } = useTheme();
    const [hovered, setHovered] = React.useState(null);

    const counts = {
        Easy: questions.filter(q => q.difficulty === 'Easy').length,
        Medium: questions.filter(q => q.difficulty === 'Medium').length,
        Hard: questions.filter(q => q.difficulty === 'Hard').length,
        Total: questions.length
    };

    const radius = 40;
    const strokeWidth = 10;
    const circumference = 2 * Math.PI * radius;

    const getData = () => {
        const data = [];
        let accumulatedPercentage = 0;
        
        ['Easy', 'Medium', 'Hard'].forEach(level => {
            const count = counts[level];
            const percentage = counts.Total > 0 ? (count / counts.Total) : 0;
            const length = percentage * circumference;
            
            data.push({
                level,
                count,
                length,
                offset: - (accumulatedPercentage * circumference),
                color: level === 'Easy' ? '#10b981' : level === 'Medium' ? '#f59e0b' : '#f43f5e'
            });
            accumulatedPercentage += percentage;
        });
        return data;
    };

    return (
        <div className="relative w-44 h-44 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Track */}
                <circle cx="50" cy="50" r={radius} fill="transparent" stroke={theme === 'dark' ? '#1e293b' : '#f1f5f9'} strokeWidth={strokeWidth} />
                
                {/* Segments */}
                {getData().map((slice, i) => (
                    <circle
                        key={i} cx="50" cy="50" r={radius}
                        fill="transparent" 
                        stroke={slice.color} 
                        strokeWidth={strokeWidth}
                        strokeDasharray={`${slice.length} ${circumference}`}
                        strokeDashoffset={slice.offset}
                        strokeLinecap={slice.length > 0 ? "round" : "butt"}
                        className="transition-all duration-700 cursor-pointer"
                        style={{ 
                            opacity: hovered && hovered !== slice.level ? 0.3 : 1,
                            filter: hovered === slice.level ? `drop-shadow(0 0 8px ${slice.color}44)` : 'none'
                        }}
                        onMouseEnter={() => setHovered(slice.level)}
                        onMouseLeave={() => setHovered(null)}
                    />
                ))}
            </svg>
            
            {/* Dynamic Center Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                <div className="flex flex-col items-center leading-none">
                    <span className={`text-4xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                        {hovered ? `${counts[hovered]}` : counts.Total}
                        {hovered && <span className="text-lg text-slate-500 font-bold ml-0.5">/{counts.Total}</span>}
                    </span>
                    <span className={`text-[9px] font-black uppercase tracking-[0.15em] mt-2 transition-colors ${
                        hovered === 'Easy' ? 'text-emerald-500' : 
                        hovered === 'Medium' ? 'text-amber-500' : 
                        hovered === 'Hard' ? 'text-rose-500' : 
                        theme === 'dark' ? 'text-slate-600' : 'text-slate-400'
                    }`}>
                        {hovered || 'Questions'}
                    </span>
                </div>
            </div>
        </div>
    );
};



const AdminDashboard = () => {
    const { theme } = useTheme();

    const [stats, setStats] = React.useState({
        questions: 0,
        companies: 0,
        roles: 0,
        tags: 0,
        users: 0,
        interviews: 0
    });
    const [questions, setQuestions] = React.useState([]);
    const [recentInterviews, setRecentInterviews] = React.useState([]);

    React.useEffect(() => {
        // 1. Listen to Questions
        const qQuestions = query(collection(db, 'questions'));
        const unsubQuestions = onSnapshot(qQuestions, (snapshot) => {
            const allQuestions = snapshot.docs.map(doc => doc.data());
            setQuestions(allQuestions);
            
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
        { label: 'Total Companies', value: stats.companies.toString(), icon: Building2, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        { label: 'Total Roles', value: stats.roles.toString(), icon: UserCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        { label: 'Total Tags', value: stats.tags.toString(), icon: Tag, color: 'text-rose-500', bg: 'bg-rose-500/10' },
    ];


    return (
        <AdminLayout>
            <div className="p-8 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700 pb-20">
                <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
                    <div>
                        <h2 className={`text-5xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>Admin Dashboard</h2>
                        <p className="text-slate-500 mt-2 text-lg font-medium">Real-time overview of platform activity and metrics</p>
                    </div>

                    {/* TOP DIFFICULTY PIE CHART */}
                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50' : 'bg-white border-slate-200 shadow-xl'} border p-8 rounded-[40px] flex flex-col items-center gap-6 relative overflow-hidden group`}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[80px] -mr-16 -mt-16 group-hover:bg-indigo-500/10 transition-colors" />
                        
                        <div className="w-full flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-slate-500 tracking-tight uppercase opacity-50">Questions</h3>
                        </div>


                        <div className="flex items-center gap-10">
                            <DifficultyPieChart questions={questions} />
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Easy</span>
                                        <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-bold`}>{questions.filter(q => q.difficulty === 'Easy').length}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Medium</span>
                                        <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-bold`}>{questions.filter(q => q.difficulty === 'Medium').length}</span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hard</span>
                                        <span className={`${theme === 'dark' ? 'text-white' : 'text-slate-900'} font-bold`}>{questions.filter(q => q.difficulty === 'Hard').length}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {statCards.map((stat, i) => (
                        <div key={i} className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50' : 'bg-white border-slate-200 shadow-lg'} border p-6 rounded-[32px] hover:border-indigo-500/50 transition-all group relative overflow-hidden`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${stat.bg}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-500 tracking-tight">{stat.label}</p>
                                    <h3 className={`text-2xl font-black ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tighter`}>
                                        {stat.value}
                                    </h3>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>


                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500/10 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-indigo-400" />
                            </div>
                            <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} tracking-tight`}>Recent Activity</h3>
                        </div>
                        <button className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/5 px-4 py-2 rounded-xl">View All</button>
                    </div>

                    <div className={`${theme === 'dark' ? 'bg-[#0b1121] border-slate-800/50' : 'bg-white border-slate-200 shadow-xl'} border rounded-[40px] overflow-hidden`}>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className={`border-b ${theme === 'dark' ? 'border-slate-800/50 bg-slate-800/20' : 'border-slate-100 bg-slate-50'}`}>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Candidate</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest">Job Role</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-center">Score</th>
                                        <th className="px-8 py-5 text-xs font-black text-slate-500 uppercase tracking-widest text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className={`divide-y ${theme === 'dark' ? 'divide-slate-800/30' : 'divide-slate-100'}`}>
                                    {recentInterviews.length > 0 ? (
                                        recentInterviews.map((interview) => (
                                            <tr key={interview.id} className={`${theme === 'dark' ? 'hover:bg-slate-800/20' : 'hover:bg-slate-50'} transition-colors group`}>
                                                <td className="px-8 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl ${theme === 'dark' ? 'bg-gradient-to-br from-slate-700 to-slate-800' : 'bg-gradient-to-br from-slate-100 to-slate-200'} flex items-center justify-center ${theme === 'dark' ? 'text-white' : 'text-slate-700'} font-bold shadow-sm border ${theme === 'dark' ? 'border-slate-600' : 'border-slate-200'}`}>
                                                            {interview.userEmail?.[0].toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <p className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} group-hover:text-indigo-600 transition-colors`}>
                                                                {interview.userEmail || 'Anonymous User'}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">Verified User</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6">
                                                    <span className={`${theme === 'dark' ? 'bg-slate-800/50 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-600 border-slate-200'} px-4 py-2 rounded-xl text-xs font-bold border`}>
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
                                                        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {interview.date?.seconds ? new Date(interview.date.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Completed</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className={`w-20 h-20 ${theme === 'dark' ? 'bg-slate-800/30' : 'bg-slate-100'} rounded-full flex items-center justify-center`}>
                                                        <MessageSquare className="w-10 h-10 text-slate-500" />
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
