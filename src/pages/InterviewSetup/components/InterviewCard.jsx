import { Play, Clock, Building2 } from 'lucide-react';
import Button from '../../../components/ui/Button';

const InterviewCard = ({ role, company, topics, duration, difficulty, onStart }) => {
    return (
        <div className="group relative rounded-[2rem] p-[2px] bg-gradient-to-r from-blue-600/30 via-indigo-500/30 to-purple-600/30 hover:from-blue-600 hover:via-indigo-500 hover:to-purple-600 transition-all duration-500 shadow-xl hover:shadow-2xl transform hover:-translate-y-2">
            <div className="bg-white dark:bg-slate-900 rounded-[1.9rem] p-6 h-full flex flex-col relative overflow-hidden transition-colors duration-300">
                {/* Difficulty Label - Top Right Corner */}
                {difficulty && (
                    <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest z-20 shadow-sm ${
                        difficulty === 'Easy' ? 'bg-green-100/80 dark:bg-green-500/20 text-green-700 dark:text-green-400' :
                        difficulty === 'Medium' ? 'bg-amber-100/80 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' :
                        'bg-red-100/80 dark:bg-red-500/20 text-red-700 dark:text-red-400'
                    }`}>
                        {difficulty}
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-4 mb-2">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight pr-12">
                            {role}
                        </h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-[10px] font-black uppercase tracking-wider whitespace-nowrap mt-5">
                            <Clock className="w-3.5 h-3.5" /> {duration}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 mb-4">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm font-semibold">{company}</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-8">
                        {topics.map((topic, i) => (
                            <span 
                                key={topic} 
                                className="px-2.5 py-1 bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-tight border border-gray-100 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-900 transition-colors"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>

                    <div className="mt-auto">
                        <Button 
                            onClick={onStart}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transform hover:scale-[1.02]"
                        >
                            <Play className="w-4 h-4 fill-current" /> Start Interview
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default InterviewCard;
