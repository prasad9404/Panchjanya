import React from "react";
import { motion } from "framer-motion";

interface AuthBackgroundProps {
  children: React.ReactNode;
  showMandala?: boolean;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ children, showMandala = true }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#FDFCF7] overflow-y-auto overflow-x-hidden flex flex-col">
      {/* 🌤️ Heavenly Glows */}
      {/* Top Amber Cloud Light */}
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full bg-amber-200/40 blur-[100px] pointer-events-none opacity-60" />
      
      {/* Bottom Blue Cloud Light */}
      <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[120%] h-[60%] rounded-full bg-blue-100/40 blur-[100px] pointer-events-none opacity-60" />

      {/* ⚪ Frosted Floating Orbs */}
      <motion.div 
        animate={{ 
          y: [0, -30, 0],
          x: [0, 20, 0],
          rotate: [0, 15, 0]
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[15%] right-[10%] w-40 h-40 rounded-full bg-white/40 blur-lg border border-slate-200/50 pointer-events-none shadow-sm" 
      />
      
      <motion.div 
        animate={{ 
          y: [0, 40, 0],
          x: [0, -20, 0]
        }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[20%] left-[5%] w-64 h-64 rounded-full bg-blue-50/30 blur-2xl border border-blue-100/30 pointer-events-none" 
      />

      {/* ⚛️ Subtle Sacrad Mandala Pattern (Blue-Grey Ink) */}
      {showMandala && (
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 240, repeat: Infinity, ease: "linear" }}
            className="w-[180vw] h-[180vw] sm:w-[150%] sm:h-[150%] text-blue-900"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="2 4" />
            <circle cx="100" cy="100" r="12" fill="none" stroke="currentColor" strokeWidth="0.5" />
            
            {[...Array(24)].map((_, i) => (
              <g key={i} transform={`rotate(${i * 15} 100 100)`}>
                <path d="M100 8 C115 35, 125 45, 100 70 C75 45, 85 35, 100 8" fill="none" stroke="currentColor" strokeWidth="0.2" />
                <circle cx="100" cy="22" r="1.5" fill="currentColor" />
                <path d="M100 85 L108 95 L92 95 Z" fill="none" stroke="currentColor" strokeWidth="0.2" />
                <line x1="100" y1="100" x2="100" y2="8" stroke="currentColor" strokeWidth="0.05" opacity="0.4" />
              </g>
            ))}
            
            {[...Array(10)].map((_, i) => (
              <circle 
                key={`c-${i}`} 
                cx="100" 
                cy="100" 
                r={25 + i * 7} 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="0.1" 
                strokeDasharray={i % 2 === 0 ? "8 8" : "2 6"} 
              />
            ))}
          </motion.svg>
        </div>
      )}

      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>

      {/* 📜 Traditional Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    </div>
  );
};
