import React from "react";
import { motion } from "framer-motion";

interface AuthBackgroundProps {
  children: React.ReactNode;
  showMandala?: boolean;
}

export const AuthBackground: React.FC<AuthBackgroundProps> = ({ children, showMandala = true }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#fdfcf7] overflow-y-auto overflow-x-hidden flex flex-col">
      {/* 🌤️ Heavenly Royal Glows */}
      <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[50%] rounded-full bg-amber-200/20 blur-[120px] pointer-events-none opacity-50 animate-pulse" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[70%] h-[50%] rounded-full bg-blue-100/10 blur-[120px] pointer-events-none opacity-30" />
      <div className="absolute top-[20%] left-[-5%] w-[40%] h-[30%] rounded-full bg-amber-100/10 blur-[80px] pointer-events-none" />

      {/* ⚛️ Refined Lotus Mandala Pattern */}
      {showMandala && (
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center overflow-hidden">
          <motion.svg
            animate={{ rotate: 360 }}
            transition={{ duration: 400, repeat: Infinity, ease: "linear" }}
            className="w-[200vw] h-[200vw] sm:w-[130%] sm:h-[130%] text-blue-900"
            viewBox="0 0 200 200"
            xmlns="http://www.w3.org/2000/svg"
          >
            {[...Array(12)].map((_, i) => (
              <g key={i} transform={`rotate(${i * 30} 100 100)`}>
                <path 
                  d="M100 10 C115 40, 130 70, 100 100 C70 70, 85 40, 100 10" 
                  fill="currentColor" 
                  opacity="0.4"
                />
                <circle cx="100" cy="40" r="1.5" fill="currentColor" />
              </g>
            ))}
            <circle cx="100" cy="100" r="10" fill="none" stroke="currentColor" strokeWidth="0.3" strokeDasharray="1 1" />
            <circle cx="100" cy="100" r="35" fill="none" stroke="currentColor" strokeWidth="0.4" />
            <circle cx="100" cy="100" r="65" fill="none" stroke="currentColor" strokeWidth="0.15" strokeDasharray="8 4" />
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="0.1" />
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
