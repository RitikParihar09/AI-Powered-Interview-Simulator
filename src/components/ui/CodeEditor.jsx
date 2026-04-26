import React from 'react';

const CodeEditor = () => {
    return (
        <div className="w-full h-full bg-[#282c34] rounded-lg p-4 flex flex-col">
            
            <textarea
                className="w-full flex-grow bg-transparent text-gray-200 font-mono resize-none focus:outline-none"
                placeholder="Write your code here..."
                spellCheck="false"
            />
        </div>
    );
};

export default CodeEditor;
