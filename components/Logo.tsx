import React from 'react';

export const Logo: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="main-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" /> {/* Indigo-600 */}
          <stop offset="50%" stopColor="#d946ef" /> {/* Fuchsia-500 */}
          <stop offset="100%" stopColor="#ec4899" /> {/* Pink-500 */}
        </linearGradient>
        <filter id="soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
          <feMerge>
             <feMergeNode in="coloredBlur" />
             <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main Container - Rounded Squircle */}
      <rect 
        x="12" 
        y="12" 
        width="76" 
        height="76" 
        rx="22" 
        stroke="url(#main-grad)" 
        strokeWidth="5" 
        strokeLinecap="round"
        fill="none" 
        className="opacity-90"
      />
      
      {/* Decorative Nodes */}
      <circle cx="12" cy="50" r="4" fill="#4f46e5" />
      <circle cx="88" cy="50" r="4" fill="#ec4899" />
      <circle cx="50" cy="12" r="4" fill="#8b5cf6" />
      <circle cx="50" cy="88" r="4" fill="#8b5cf6" />

      {/* Central AI Spark */}
      <path 
        d="M50 28 L55 45 L72 50 L55 55 L50 72 L45 55 L28 50 L45 45 Z" 
        fill="url(#main-grad)" 
        filter="url(#soft-glow)"
      />
      
      {/* Inner Orbit Line */}
      <path
        d="M70 50 A20 20 0 1 1 30 50"
        stroke="url(#main-grad)"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
};