import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function UserSplash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/auth/welcome");
    }, 3500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[#FDFCF7]">
      {/* 🌤️ Morning Sky Heavenly Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-100/50 via-[#FDFCF7] to-white pointer-events-none" />
      
      {/* ✨ Floating Golden Glints (Divine Morning Particles) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: [0, -120, 0],
            opacity: [0, 0.6, 0],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 8 + i * 2,
            repeat: Infinity,
            delay: i * 1,
          }}
          className="absolute w-1.5 h-1.5 bg-amber-600 rounded-full blur-[2px] pointer-events-none"
          style={{
            left: `${5 + i * 12}%`,
            top: `${90 - i * 8}%`,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        className="z-10 flex flex-col items-center"
      >
        <div className="relative">
          {/* Sacrad Geometry Glow */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-[-60px] opacity-10 border-2 border-dashed border-blue-900 rounded-full"
          />
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 1.2 }}
            className="w-56 h-56 md:w-72 md:h-72 bg-white/60 backdrop-blur-3xl rounded-[4rem] shadow-[0_20px_60px_rgba(30,58,138,0.1)] flex items-center justify-center p-8 border border-white relative overflow-hidden group"
          >
             {/* Subtle Surface Shine */}
             <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none" />
             
            <img 
              src="/icons/Main logo.svg" 
              alt="Panchajanya Logo" 
              className="w-full h-full object-contain filter drop-shadow-sm group-hover:scale-105 transition-transform duration-700"
            />
          </motion.div>
        </div>
        
      </motion.div>

      {/* Cloud-like Depth Layer at Bottom */}
      <div className="absolute bottom-[-10%] left-1/2 -translate-x-1/2 w-full h-[40%] bg-white/60 blur-[120px] pointer-events-none rounded-full" />
    </div>
  );
}
