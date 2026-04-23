import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, ShieldCheck, Flower2 } from "lucide-react";

export default function UserAuthWelcome() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || localStorage.getItem("panchajanya_lang") || "mr";

  const t = {
    mr: {
      tagline: "महानुभाव पंथ अनुयायांसाठी एक आध्यात्मिक व्यासपीठ",
      getStarted: "सुरू करा",
      login: "लॉगिन करा"
    },
    hi: {
      tagline: "महानुभाव पंथ अनुयायियों के लिए एक आध्यात्मिक मंच",
      getStarted: "शुरू करें",
      login: "लॉगिन करें"
    },
    en: {
      tagline: "A spiritual platform for Mahanubhav Panth followers",
      getStarted: "Get Started",
      login: "Login"
    }
  }[lang] || {
    tagline: "A spiritual platform for Mahanubhav Panth followers",
    getStarted: "Get Started",
    login: "Login"
  };

  // 🖱️ Interactive Tilt Effect
  const x = useMotionValue(200);
  const y = useMotionValue(200);
  const rotateX = useTransform(y, [0, 400], [10, -10]);
  const rotateY = useTransform(x, [0, 400], [-10, 10]);

  function handleMouse(event: React.MouseEvent) {
    const rect = event.currentTarget.getBoundingClientRect();
    x.set(event.clientX - rect.left);
    y.set(event.clientY - rect.top);
  }

  return (
    <AuthBackground>
      <div 
        className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden"
        onMouseMove={handleMouse}
      >
        {/* ✨ Floating Divine Particles */}
        <div className="absolute inset-0 pointer-events-none">
           {[...Array(6)].map((_, i) => (
             <motion.div
               key={i}
               animate={{ 
                 y: [0, -40, 0], 
                 x: [0, i % 2 === 0 ? 20 : -20, 0],
                 opacity: [0.1, 0.3, 0.1] 
               }}
               transition={{ duration: 10 + i * 2, repeat: Infinity }}
               className="absolute text-amber-500/10"
               style={{ 
                 left: `${15 + i * 15}%`, 
                 top: `${20 + (i % 3) * 20}%` 
               }}
             >
               <Flower2 className="w-12 h-12" />
             </motion.div>
           ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center z-10 w-full max-w-lg"
        >
          {/* 🛡️ Branding Context */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/50 backdrop-blur-md border border-blue-100/50 text-blue-900/50 text-[10px] font-black uppercase tracking-[0.3em] mb-12"
          >
             <ShieldCheck className="w-3.5 h-3.5" />
             Personalized Sanctuary
          </motion.div>

          {/* 💎 3D Interactive Logo Card */}
          <div className="perspective-1000 mb-16 h-40">
            <motion.div 
              style={{ rotateX, rotateY }}
              className="relative mx-auto w-40 h-40 group"
            >
              <div className="absolute inset-[-20px] bg-gradient-to-tr from-amber-200/40 to-blue-200/40 rounded-[3rem] blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />
              <div className="relative w-full h-full bg-white/80 backdrop-blur-3xl rounded-[2.8rem] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.06)] p-7 border border-white overflow-hidden">
                 <img 
                   src="/icons/Main logo.svg" 
                   alt="Logo" 
                   className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-700"
                 />
              </div>
            </motion.div>
          </div>

          {/* 📜 App Name & Tagline */}
          <div className="mb-16 space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black text-blue-950 font-serif leading-tight tracking-tight uppercase">
                Panchjanya
            </h1>
            
            <p className="text-slate-400 text-base sm:text-lg font-medium px-8 leading-relaxed max-w-sm mx-auto">
              {t.tagline}
            </p>
          </div>

          {/* ⚡ Action Hub */}
          <div className="space-y-5 w-full px-8">
            <GradientButton 
              onClick={() => navigate("/auth/onboarding")}
              className="w-full h-16 bg-landing-primary shadow-xl shadow-blue-900/10"
            >
              <div className="flex items-center gap-3">
                 {t.getStarted} <Sparkles className="w-5 h-5 fill-white/20" />
              </div>
            </GradientButton>
            
            <GradientButton 
              variant="secondary"
              onClick={() => navigate("/auth/login")}
              className="w-full h-16"
            >
              <div className="flex items-center gap-3 text-blue-900">
                 {t.login} <ArrowRight className="w-5 h-5" />
              </div>
            </GradientButton>
          </div>

          {/* 🕊️ Footer Credential */}
          <div className="mt-20 flex items-center justify-center gap-4 opacity-30">
             <div className="h-[1px] w-12 bg-slate-400" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em]">Divine Legacy</span>
             <div className="h-[1px] w-12 bg-slate-400" />
          </div>
        </motion.div>
      </div>
    </AuthBackground>
  );
}
