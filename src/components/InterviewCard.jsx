import React from 'react';
import { Play } from 'lucide-react'; 

const InterviewCard = ({ role, company, topics = [], duration, onStart }) => {
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col items-start shadow-md hover:shadow-xl hover:-translate-y-1 hover:border-blue-600 transition-all duration-300">
            <h3 className="text-xl font-bold text-gray-800 mb-1">{role}</h3>
            <p className="text-sm text-gray-500 mb-2">{company}</p>
            <div className="flex flex-wrap gap-2 mb-2">
                {topics.map((topic, i) => (
                    <span key={i} className="text-xs text-white bg-blue-600 px-2 py-1 rounded-full">
                        {topic}
                    </span>
                ))}
            </div>
            <p className="text-xs text-gray-400 mb-4">Duration: {duration}</p>
            
            <button
                onClick={onStart}
                // Changed rounded-lg to rounded-full
                className="w-full mt-auto bg-blue-600 text-white font-semibold py-2 rounded-full hover:bg-blue-700 transition-colors"
            >
                Start Interview
            </button>

        </div>
    );
};

export default InterviewCard;