import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { useTranslation } from "react-i18next";

const TRANSLATIONS: Record<string, any> = {
  mr: {
    welcome: "पंचजन्ये मध्ये आपले स्वागत आहे",
    desc: "पवित्र मंदिर शोधासाठी सर्वात प्रीमियम अभयारण्यात सुरक्षितपणे प्रवेश करा.",
    signIn: "साइन इन करा",
    register: "नोंदणी सुरू करा",
    legacy: "एक संपूर्ण वारसा"
  },
  hi: {
    welcome: "पंचजन्य में आपका स्वागत है",
    desc: "पवित्र मंदिरों की खोज के लिए सबसे प्रीमियम स्थान में सुरक्षित रूप से प्रवेश करें।",
    signIn: "साइन इन करें",
    register: "पंजीकरण शुरू करें",
    legacy: "एक पूर्ण विरासत"
  },
  en: {
    welcome: "Welcome to Panchajanya",
    desc: "Securely enter the most premium sanctuary for sacred temple discovery.",
    signIn: "Sign In",
    register: "Start Registration",
    legacy: "An Absolute Legacy"
  }
};

export default function UserAuthWelcome() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const lang = i18n.language || localStorage.getItem("panchajanya_lang") || "mr";
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  return (
    <AuthBackground>
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="text-center z-10 w-full max-w-md"
        >
          {/* 💎 Ivory Icon Card */}
          <div className="relative mx-auto w-36 h-36 mb-12">
            <motion.div 
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 bg-gradient-to-tr from-amber-200 to-blue-200 rounded-[2.5rem] blur-2xl opacity-40"
            />
            <div className="relative w-full h-full bg-white/70 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center shadow-[0_15px_40px_rgba(0,0,0,0.05)] p-6 border border-white overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
               
               <img 
                 src="/icons/Main logo.svg" 
                 alt="Panchajanya" 
                 className="w-full h-full object-contain drop-shadow-sm transition-transform duration-700 group-hover:scale-105"
               />
            </div>
          </div>
          
          <div className="space-y-4 mb-10 sm:mb-14">
            <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif leading-tight tracking-tight uppercase">
              {t.welcome.split("Panchajanya")[0]}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 via-blue-700 to-blue-950 italic drop-shadow-sm">
                {lang === 'hi' || lang === 'mr' ? (t.welcome.includes("पंचजन्ये") ? "पंचजन्ये" : "पंचजन्य") : "Panchajanya"}
              </span>
              {t.welcome.split("Panchajanya")[1]}
              {t.welcome.split("पंचजन्ये")[1]}
              {t.welcome.split("पंचजन्य")[1]}
            </h1>
            
            <p className="text-slate-500 text-base sm:text-lg font-medium px-4 leading-relaxed tracking-wide">
              {t.desc}
            </p>
          </div>

          <div className="space-y-5 w-full px-6">
            <GradientButton 
              onClick={() => navigate("/auth/login")}
              className="w-full h-16"
            >
              {t.signIn}
            </GradientButton>
            
            <GradientButton 
              variant="outline"
              onClick={() => navigate("/auth/register")}
              className="w-full h-16 border-slate-200/60"
            >
              {t.register}
            </GradientButton>
          </div>
        </motion.div>

        {/* 🕊️ Heavenly Signature */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="mt-20 text-center w-full z-10"
        >
          <div className="flex items-center justify-center gap-4 mb-3">
             <div className="h-[0.5px] w-8 bg-slate-200" />
             <p className="text-[10px] text-slate-400 font-extrabold tracking-[0.5em] uppercase">
                {t.legacy}
             </p>
             <div className="h-[0.5px] w-8 bg-slate-200" />
          </div>
          <div className="flex justify-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
             <div className="w-1.5 h-1.5 rounded-full bg-blue-900/10" />
             <div className="w-1.5 h-1.5 rounded-full bg-amber-400/40" />
          </div>
        </motion.div>
      </div>
    </AuthBackground>
  );
}
