import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

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
    <AuthBackground showMandala={false}>
      {/* 🌿 Main Container */}
      <div className="flex-1 flex flex-col bg-[#F8F7F4] min-h-screen">
        
        {/* 🏛️ Header Section */}
        <div className="pt-16 pb-8 px-8 text-center">
          <motion.span 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[10px] uppercase tracking-[0.4em] text-[#E6A23C] font-black mb-4 block"
          >
            Divine Communication
          </motion.span>
          
          <motion.h1 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] font-serif mb-3 tracking-tight"
          >
            Choose Your Language
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-sm sm:text-base font-medium"
          >
            Select the language you’d like to continue with
          </motion.p>
        </div>

        {/* 📋 Language Selection List */}
        <div className="flex-1 px-8 space-y-4 max-w-md mx-auto w-full pt-4">
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
                  "w-full flex items-center gap-5 p-5 rounded-[1.5rem] border-2 transition-all duration-300 text-left",
                  isSelected 
                    ? "border-[#E6A23C] bg-[#E6A23C]/5 shadow-md" 
                    : "border-white bg-white shadow-sm hover:border-slate-100"
                )}
              >
                {/* Abbreviation Icon */}
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-full font-serif font-bold text-lg transition-colors",
                  isSelected ? "bg-[#E6A23C] text-white" : "bg-slate-50 text-slate-400"
                )}>
                  {lang.icon}
                </div>

                {/* Labels */}
                <div className="flex-1">
                  <p className={cn(
                    "font-bold text-lg leading-tight transition-colors",
                    isSelected ? "text-[#1E3A5F]" : "text-slate-700"
                  )}>
                    {lang.label}
                  </p>
                  <p className="text-slate-400 text-xs mt-0.5">{lang.subLabel}</p>
                </div>

                {/* Radio Indicator */}
                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected ? "border-[#E6A23C] bg-[#E6A23C]" : "border-slate-200"
                )}>
                  <AnimatePresence>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={4} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* 🚀 Fixed Bottom Button */}
        <div className="p-8 pb-10 max-w-md mx-auto w-full">
           <GradientButton
             onClick={handleContinue}
             className="w-full h-16 bg-[#1E3A5F] hover:bg-[#152943] text-white shadow-[0_8px_20px_rgba(30,58,95,0.2)] rounded-2xl font-bold tracking-widest uppercase text-sm"
           >
             Continue
           </GradientButton>
        </div>

      </div>
    </AuthBackground>
  );
}
