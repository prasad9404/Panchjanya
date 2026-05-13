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
        className="flex-1 flex flex-col items-center justify-center px-6 relative overflow-hidden py-10"
        onMouseMove={handleMouse}
      >
        {/* ✨ Floating Divine Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                y: [0, -30, 0],
                x: [0, i % 2 === 0 ? 15 : -15, 0],
                opacity: [0.05, 0.2, 0.05]
              }}
              transition={{ duration: 12 + i * 2, repeat: Infinity }}
              className="absolute text-amber-600/10"
              style={{
                left: `${15 + i * 15}%`,
                top: `${15 + (i % 3) * 20}%`
              }}
            >
              <Flower2 className="w-10 h-10" />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="text-center z-10 w-full max-w-md flex flex-col items-center"
        >

          {/* 💎 3D Interactive Logo - Standardized Size */}
          <div className="perspective-1000 mb-8 h-44 sm:h-56 flex items-center justify-center">
            <motion.div
              style={{ rotateX, rotateY }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-44 h-44 sm:w-56 sm:h-56 group cursor-pointer flex items-center justify-center"
            >
              {/* Royal Glow Effect */}
              <div className="absolute inset-[-15px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Logo Container - Transparent Background */}
              <div className="relative w-full h-full flex items-center justify-center transition-all duration-500">
                <img
                  src="/icons/Main logo.svg"
                  alt="Logo"
                  className="w-full h-full object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.1)] group-hover:scale-110 transition-transform duration-700"
                  style={{ mixBlendMode: 'multiply' }} // Ensures any residual white background in the image is removed
                />
              </div>
            </motion.div>
          </div>

          {/* 📜 App Name & Tagline - Scaled down for mobile */}
          <div className="mb-10 space-y-3">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{
                opacity: 1,
                y: 0,
                textShadow: [
                  "0 0 0px rgba(217, 119, 6, 0)",
                  "0 0 10px rgba(217, 119, 6, 0.2)",
                  "0 0 0px rgba(217, 119, 6, 0)"
                ]
              }}
              transition={{
                opacity: { delay: 0.4, duration: 0.8 },
                y: { delay: 0.4, duration: 0.8 },
                textShadow: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="text-amber-700/80 text-sm sm:text-base font-medium px-4 leading-relaxed max-w-[280px] mx-auto tracking-wide italic"
            >
              {t.tagline}
            </motion.p>
          </div>

          {/* ⚡ Action Hub - More compact buttons */}
          <div className="space-y-4 w-full px-6 sm:px-10 max-w-[20rem] mx-auto">
            <GradientButton
              onClick={() => navigate("/auth/register")}
              className="w-full h-12 sm:h-14 px-0 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] hover:shadow-[0_12px_30px_rgba(19,62,124,0.25)] hover:-translate-y-0.5 transition-all duration-500 border border-white/10 rounded-[1.2rem]"
            >
              <div className="flex items-center justify-center gap-2.5 w-full">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white whitespace-nowrap">
                  {t.getStarted}
                </span>
                <Sparkles className="w-4 h-4 text-amber-300" strokeWidth={2} />
              </div>
            </GradientButton>

            <GradientButton
              variant="secondary"
              onClick={() => navigate("/auth/login")}
              className="w-full h-12 sm:h-14 px-0 border border-blue-900/10 bg-white/60 backdrop-blur-md shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:bg-white/80 hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-500 rounded-[1.2rem]"
            >
              <div className="flex items-center justify-center gap-2.5 w-full">
                <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-[#133E7C] whitespace-nowrap">
                  {t.login}
                </span>
                <ArrowRight className="w-4 h-4 text-[#133E7C]" strokeWidth={2.5} />
              </div>
            </GradientButton>
          </div>

        </motion.div>
      </div>
    </AuthBackground>
  );
}
