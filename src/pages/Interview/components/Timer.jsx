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

const Timer = ({ durationString, onTimeUp, active = false, timeLeftRef }) => {
  const [remaining, setRemaining] = useState(() => parseDuration(durationString));
  const intervalRef = useRef(null);

  // Reset timer whenever the duration string changes (e.g. new interview selected)
  useEffect(() => {
    const val = parseDuration(durationString);
    setRemaining(val);
    if (timeLeftRef) timeLeftRef.current = val;
  }, [durationString, timeLeftRef]);

  // Countdown Logic
  useEffect(() => {
    if (active && remaining > 0) {
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          const newValue = prev - 1;
          if (timeLeftRef) timeLeftRef.current = newValue;

          if (newValue <= 0) {
            clearInterval(intervalRef.current);
            if (onTimeUp) onTimeUp(); // End the interview!
            return 0;
          }
          return newValue;
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
    <div className="relative group">
      <div className={`flex items-center gap-4 px-6 py-3 rounded-2xl backdrop-blur-xl border-2 shadow-2xl transition-all duration-500 overflow-hidden ${isCritical
        ? 'bg-red-500/10 border-red-500/50 text-red-600 dark:text-red-400 animate-pulse shadow-red-500/20'
        : isFinished
          ? 'bg-gray-100/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-700 text-gray-500'
          : 'bg-indigo-50/50 dark:bg-indigo-900/30 border-indigo-200/50 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/10'
        }`}>

        {/* Decorative background glow */}
        <div className={`absolute -inset-4 opacity-20 blur-2xl transition-all duration-700 group-hover:opacity-40 rounded-full ${isCritical ? 'bg-red-500' : 'bg-indigo-500'}`}></div>

        <div className="relative flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isCritical ? 'bg-red-500/20' : 'bg-indigo-500/10 dark:bg-indigo-500/20'}`}>
            {isCritical ? <AlertTriangle className="w-5 h-5 animate-bounce" /> : <Clock className="w-5 h-5" />}
          </div>

          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 leading-tight">
              {isCritical ? 'URGENT' : 'SESSION TIME'}
            </span>
            <span className="text-2xl font-mono font-black tracking-widest tabular-nums leading-none mt-1">
              {formatTime(remaining)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;