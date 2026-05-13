import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

const LANGUAGES = [
  { code: "mr", label: "मराठी", subLabel: "Marathi", icon: "म" },
  { code: "hi", label: "हिंदी", subLabel: "Hindi", icon: "हि" },
  { code: "en", label: "English", subLabel: "English", icon: "EN" },
];

export default function UserLanguage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string>(i18n.language || "mr");

  const handleContinue = () => {
    localStorage.setItem("i18nextLng", selectedLang);
    localStorage.setItem("panchajanya_lang", selectedLang);
    i18n.changeLanguage(selectedLang);
    navigate("/auth/onboarding");
  };

  return (
    <AuthBackground showMandala={true}>
      {/* 🌿 Main Container */}
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* ⚛️ Logo Container - Standard Circular Version */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative w-44 h-44 sm:w-56 sm:h-56 mb-8 group flex items-center justify-center mx-auto mt-12"
        >
           <div className="absolute inset-[-10px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-xl opacity-40" />
           <img 
            src="/icons/Main logo.svg" 
            alt="Logo" 
            className="w-full h-full object-contain relative z-10 drop-shadow-md" 
            style={{ mixBlendMode: 'multiply' }}
           />
        </motion.div>

        {/* 🏛️ Header Section */}
        <div className="pb-6 px-8 text-center z-10">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] uppercase tracking-[0.4em] text-amber-700/60 font-black mb-3 block"
          >
            Divine Communication
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-2xl sm:text-3xl font-black text-blue-950 font-serif mb-2 tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]"
          >
            Choose Your Language
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-xs sm:text-sm font-medium max-w-[240px] mx-auto leading-relaxed"
          >
            Select the language you’d like to continue with
          </motion.p>
        </div>

        {/* 📋 Language Selection List */}
        <div className="flex-1 px-8 space-y-3.5 max-w-[22rem] mx-auto w-full pt-2 z-10">
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.code;
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * index + 0.3 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedLang(lang.code)}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-[1.2rem] border transition-all duration-300 text-left",
                  isSelected 
                    ? "border-amber-500 bg-amber-50 shadow-sm" 
                    : "border-slate-100 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:border-slate-200"
                )}
              >
                {/* Abbreviation Icon */}
                <div className={cn(
                  "w-10 h-10 flex items-center justify-center rounded-full font-serif font-bold text-base transition-colors",
                  isSelected ? "bg-amber-600 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  {lang.icon}
                </div>

                {/* Labels */}
                <div className="flex-1">
                  <p className={cn(
                    "font-bold text-base leading-tight transition-colors",
                    isSelected ? "text-blue-950" : "text-slate-600"
                  )}>
                    {lang.label}
                  </p>
                  <p className="text-slate-400 text-[10px] mt-0.5">{lang.subLabel}</p>
                </div>

                {/* Radio Indicator */}
                <div className={cn(
                  "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                  isSelected ? "border-amber-600 bg-amber-600" : "border-slate-200"
                )}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-3 h-3 text-white" strokeWidth={4} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 🚀 Bottom Button */}
        <div className="p-8 pb-10 max-w-[22rem] mx-auto w-full z-10">
            <GradientButton
              onClick={handleContinue}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Continue</span>
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
           </GradientButton>
        </div>

      </div>
    </AuthBackground>
  );
}
