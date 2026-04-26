import { useNavigate } from "react-router-dom";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { useTranslation } from "react-i18next";
import { Sparkles, ArrowRight, Flower2 } from "lucide-react";

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

          {/* 💎 3D Interactive Logo Card */}
          <div className="perspective-1000 mb-12 h-40">
            <motion.div
              style={{ rotateX, rotateY }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative mx-auto w-40 h-40 group cursor-pointer"
            >
              <div className="absolute inset-[-20px] bg-gradient-to-tr from-amber-300/40 via-amber-200/20 to-blue-200/40 rounded-[3rem] blur-3xl opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative w-full h-full bg-white/90 backdrop-blur-3xl rounded-[2.8rem] flex items-center justify-center shadow-[0_20px_50px_rgba(217,119,6,0.08)] p-7 border border-white/60 overflow-hidden group-hover:border-amber-500/50 group-hover:shadow-[0_20px_60px_rgba(217,119,6,0.15)] transition-all duration-500">
                <img
                  src="/icons/Main logo.svg"
                  alt="Logo"
                  className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-700"
                />
              </div>
            </motion.div>
          </div>

          {/* 📜 App Name & Tagline */}
          <div className="mb-12 space-y-4">
            <motion.h1
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className="text-5xl sm:text-7xl font-black font-serif leading-tight tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-blue-800"
            >
              Panchjanya
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                textShadow: [
                  "0 0 0px rgba(217, 119, 6, 0)",
                  "0 0 12px rgba(217, 119, 6, 0.3)",
                  "0 0 0px rgba(217, 119, 6, 0)"
                ]
              }}
              transition={{
                opacity: { delay: 0.4, duration: 0.8 },
                y: { delay: 0.4, duration: 0.8 },
                textShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="text-amber-600/90 text-base sm:text-xl font-semibold px-8 leading-relaxed max-w-sm mx-auto tracking-wide italic"
            >
              {t.tagline}
            </motion.p>
          </div>

          {/* ⚡ Action Hub */}
          <div className="space-y-4 w-full px-8 sm:px-12 max-w-[24rem] mx-auto">
            <GradientButton
              onClick={() => navigate("/auth/onboarding")}
              className="w-full h-[56px] sm:h-[60px] px-0 bg-[#133E7C] shadow-[0_15px_30px_rgba(19,62,124,0.15)] hover:shadow-[0_20px_40px_rgba(19,62,124,0.25)] hover:scale-[1.02] transition-all duration-500 rounded-2xl border-none"
            >
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-white whitespace-nowrap">
                  {t.getStarted}
                </span>
                <Sparkles className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-white" strokeWidth={2} />
              </div>
            </GradientButton>

            <GradientButton
              variant="secondary"
              onClick={() => navigate("/auth/login")}
              className="w-full h-[56px] sm:h-[60px] px-0 border border-white/60 bg-white/40 backdrop-blur-md shadow-[0_8px_20px_rgba(0,0,0,0.02)] hover:bg-white/60 hover:shadow-[0_12px_25px_rgba(0,0,0,0.05)] hover:scale-[1.02] transition-all duration-500 rounded-2xl"
            >
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] sm:tracking-[0.2em] uppercase text-[#133E7C] whitespace-nowrap">
                  {t.login}
                </span>
                <ArrowRight className="w-[18px] h-[18px] sm:w-[20px] sm:h-[20px] text-[#133E7C]" strokeWidth={2.5} />
              </div>
            </GradientButton>
          </div>

        </motion.div>
      </div>
    </AuthBackground>
  );
}
