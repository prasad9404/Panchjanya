import React from "react";
import { motion } from "framer-motion";

interface AuthBackgroundProps {
  children: React.ReactNode;
  showMandala?: boolean;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ children, showMandala = true }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#fdfcf7] overflow-y-auto overflow-x-hidden flex flex-col">
      {/* 🌤️ Heavenly Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full bg-amber-100/30 blur-[100px] pointer-events-none opacity-40 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] rounded-full bg-blue-50/20 blur-[100px] pointer-events-none opacity-30" />

      {/* ⚛️ Refined Lotus Mandala Pattern */}
      {showMandala && (
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 300, repeat: Infinity, ease: "linear" }}
            className="w-[200vw] h-[200vw] sm:w-[120%] sm:h-[120%] text-blue-900"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            {[...Array(8)].map((_, i) => (
              <g key={i} transform={`rotate(${i * 45} 100 100)`}>
                <path 
                  d="M100 20 C120 50, 140 80, 100 100 C60 80, 80 50, 100 20" 
                  fill="currentColor" 
                  opacity="0.5"
                />
                <circle cx="100" cy="50" r="2" fill="currentColor" />
              </g>
            ))}
            <circle cx="100" cy="100" r="15" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
            <circle cx="100" cy="100" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="100" cy="100" r="70" fill="none" stroke="currentColor" strokeWidth="0.2" strokeDasharray="10 5" />
          </motion.svg>
        </div>
      )}

      {/* 🌸 Bottom Fixed Mandala (Optional decoration) */}
      <div className="absolute -bottom-20 -left-20 w-80 h-80 opacity-[0.03] pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-full h-full text-amber-900">
           <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="0.2" />
           {[...Array(12)].map((_, i) => (
             <path key={i} d="M50 50 L50 10" transform={`rotate(${i * 30} 50 50)`} stroke="currentColor" strokeWidth="0.1" />
           ))}
        </svg>
      </div>


      {/* Content Layer */}
      <div className="relative z-10 flex-1 flex flex-col">
        {children}
      </div>

      {/* 📜 Traditional Paper Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
    </div>
  );
};
