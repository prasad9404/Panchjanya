import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { Globe, Check, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

const LANGUAGES = [
  { code: "mr", label: "मराठी", subLabel: "Marathi", icon: "म" },
  { code: "hi", label: "हिंदी", subLabel: "Hindi", icon: "हिं" },
  { code: "en", label: "English", subLabel: "English", icon: "En" },
];

export default function UserLanguage() {
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<string>("mr");

  const handleContinue = () => {
    localStorage.setItem("i18nextLng", selectedLang); // Native i18next key
    localStorage.setItem("panchajanya_lang", selectedLang);
    i18n.changeLanguage(selectedLang);
    navigate("/auth/welcome");
  };

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col items-center pt-16 sm:pt-24 px-6 z-10 w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16 w-full"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
             <Globe className="w-3.5 h-3.5" />
             Select Sacred Tongue
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif mb-4 leading-tight">
            Divine <br/> <span className="text-amber-500">Communication</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg font-medium tracking-wide">
            Your journey begins in your chosen language.
          </p>
        </motion.div>

        <div className="w-full space-y-5">
          {LANGUAGES.map((lang, index) => {
            const isSelected = selectedLang === lang.code;
            return (
              <motion.button
                key={lang.code}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -2 }}
                onClick={() => setSelectedLang(lang.code)}
                className={cn(
                  "group relative w-full flex items-center gap-5 p-5 sm:p-6 rounded-[2rem] bg-gradient-to-br backdrop-blur-2xl border-2 text-left transition-all duration-500",
                  isSelected 
                    ? "border-amber-400 bg-white ring-8 ring-amber-400/5 shadow-[0_15px_40px_rgba(245,158,11,0.1)]" 
                    : "border-slate-100 bg-white/40 hover:border-slate-200 shadow-sm shadow-black/5"
                )}
              >
                <div className={cn(
                  "w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-700 shadow-sm",
                  isSelected ? "bg-amber-400 text-white scale-110 rotate-3" : "bg-white text-slate-300"
                )}>
                  <span className="font-serif font-black text-lg uppercase">{lang.icon}</span>
                </div>
                
                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-xl sm:text-2xl font-serif font-black italic transition-colors duration-500",
                      isSelected ? "text-blue-950" : "text-slate-700"
                    )}
                  >
                    {lang.label}
                  </h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-black uppercase tracking-widest">{lang.subLabel}</p>
                </div>
                
                <div 
                  className={cn(
                    "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                    isSelected ? "border-amber-400 bg-amber-400 shadow-[0_0_15px_#F59E0B]" : "border-slate-100 bg-slate-50"
                  )}
                >
                  {isSelected ? <Check className="w-6 h-6 text-white" /> : <Shield className="w-4 h-4 text-slate-100" />}
                </div>
              </motion.button>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full mt-auto mb-10 pt-10 sm:pt-14"
        >
          <GradientButton
            onClick={handleContinue}
            className="w-full h-16 shadow-[0_15px_35px_rgba(30,58,138,0.1)] mb-8"
          >
            Continue Initiation
          </GradientButton>

          <div className="text-center space-y-4">
            <p className="text-slate-400 font-bold tracking-wide text-sm sm:text-base">
              Already a devotee?{" "}
              <button 
                onClick={() => navigate("/auth/login")}
                className="text-blue-900 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all hover:scale-105 active:scale-95 px-4"
              >
                Sign In
              </button>
            </p>
            <p className="text-slate-300 font-medium tracking-widest text-[10px] uppercase">
              OR
            </p>
            <p className="text-slate-400 font-bold tracking-wide text-sm sm:text-base">
              New here?{" "}
              <button 
                onClick={() => navigate("/auth/register")}
                className="text-amber-600 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all hover:scale-105 active:scale-95 px-4"
              >
                Sign Up
              </button>
            </p>
          </div>
        </motion.div>
      </div>
    </AuthBackground>
  );
}
