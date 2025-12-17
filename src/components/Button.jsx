// --- src/components/Button.jsx ---
import React from 'react';

const Button = ({ children, className, ...props }) => {
    return (
        <button
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-transform transform hover:scale-105 ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;