
// --- src/components/ResumeDropzone.jsx ---
import React, { useState, useCallback } from 'react';
import { UploadCloudIcon, FileIcon } from './Icons';

const ResumeDropzone = ({ onFileChange }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState('');
    const fileInputRef = React.useRef(null);

    const handleDragEvents = (e, isEntering) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(isEntering);
    };
    
    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const file = e.dataTransfer.files[0];
            setFileName(file.name);
            onFileChange(file);
            e.dataTransfer.clearData();
        }
    }, [onFileChange]);

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            setFileName(file.name);
            onFileChange(file);
        }
    };

    return (
        <div
            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 h-full
                ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400 bg-white'}`}
            onDragEnter={(e) => handleDragEvents(e, true)}
            onDragLeave={(e) => handleDragEvents(e, false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current.click()}
        >
            <input
                type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect}
                accept=".pdf,.doc,.docx"
            />
            {fileName ? (
                <div className="text-center">
                    <FileIcon className="w-10 h-10 mx-auto text-green-500 mb-2" />
                    <p className="text-sm font-medium text-gray-800">{fileName}</p>
                    <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                </div>
            ) : (
                <div className="text-center">
                    <UploadCloudIcon className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-600">
                        <span className="text-blue-600 font-semibold">Click to upload</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX</p>
                </div>
            )}
        </div>
    );
};

export default ResumeDropzone;

