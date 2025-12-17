// Timer.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

// Robust parser for "10 mins", "5", "10:00"
const parseDuration = (d) => {
  if (!d) return 900; // Default to 15 mins if undefined
  const s = String(d).toLowerCase().trim();
  
  // Handle "mm:ss" format (e.g. "10:30")
  if (s.includes(':')) {
    const [m, sec] = s.split(':').map(Number);
    return (m || 0) * 60 + (sec || 0);
  }

  // Handle "10 mins", "10m", "10" (Assumes minutes)
  const num = parseInt(s, 10);
  if (isNaN(num)) return 900;
  
  return num * 60; 
};

const formatTime = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const Timer = ({ durationString, onTimeUp, active = false }) => {
  const [remaining, setRemaining] = useState(() => parseDuration(durationString));
  const intervalRef = useRef(null);

  // Reset timer whenever the duration string changes (e.g. new interview selected)
  useEffect(() => {
    setRemaining(parseDuration(durationString));
  }, [durationString]);

  // Countdown Logic
  useEffect(() => {
    if (active && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            if (onTimeUp) onTimeUp(); // End the interview!
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [active, onTimeUp]);

  // Visual Logic
  const isCritical = remaining <= 30 && remaining > 0;
  const isFinished = remaining === 0;

  return (
    <div className="absolute top-6 left-6 z-50">
      <div className={`flex items-center gap-3 px-5 py-3 rounded-xl backdrop-blur-md border-2 shadow-2xl transition-all duration-500 ${
        isCritical 
          ? 'bg-red-900/40 border-red-500 text-white animate-pulse shadow-red-900/50' 
          : isFinished
            ? 'bg-gray-800/80 border-gray-600 text-gray-400'
            : 'bg-gray-900/60 border-white/10 text-cyan-400 shadow-cyan-900/20'
      }`}>
        {isCritical ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Clock className="w-5 h-5" />}
        
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest opacity-70">
            {isCritical ? 'HURRY UP' : 'TIME LEFT'}
          </span>
          <span className="text-2xl font-mono font-black tracking-wider tabular-nums leading-none">
            {formatTime(remaining)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Timer;