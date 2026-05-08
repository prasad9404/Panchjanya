import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { ArrowLeft, User, Lock, Eye, EyeOff, Church, Flower2, Phone } from "lucide-react";

export default function UserLogin() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ identifier: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { [key: string]: string } = {};
    if (!formData.identifier) newErrors.identifier = "Required";
    if (!formData.password) newErrors.password = "Required";
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard"); 
    }, 1500);
  };

  return (
    <AuthBackground showMandala={true}>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-10 z-10 w-full max-w-lg mx-auto items-center">
        {/* 🏛️ Logo Container - Consistent with Welcome Page */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative w-24 h-24 mb-8 group flex items-center justify-center"
        >
           <div className="absolute inset-[-10px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-xl opacity-40" />
           <img 
            src="/icons/Main logo.svg" 
            alt="Panchajanya Logo" 
            className="w-full h-full object-contain relative z-10 drop-shadow-md" 
            style={{ mixBlendMode: 'multiply' }}
           />
        </motion.div>

        {/* 📜 Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
            Login
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide max-w-[240px] mx-auto leading-relaxed">
            Welcome back to the sanctuary
          </p>
        </motion.div>

        {/* 🥛 Auth Form */}
        <form onSubmit={handleLogin} className="w-full space-y-6 max-w-[20rem]">
          <AuthInputField
            topLabel="Mobile Number"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            error={errors.identifier}
            autoComplete="tel"
          />

          <AuthInputField
            topLabel="Password"
            label="••••••••"
            type={showPassword ? "text" : "password"}
            icon={<Lock />}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            autoComplete="current-password"
            rightElement={
              <button 
                type="button" 
                className="text-[9px] font-black text-blue-900/40 hover:text-blue-900 transition-colors uppercase tracking-widest"
                onClick={() => navigate("/auth/recover")}
              >
                Forgot?
              </button>
            }
          />

          <div className="pt-4">
            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] hover:opacity-90 shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
              variant="primary"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Login</span>
                  <Church className="w-4 h-4 text-white" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* 🌸 Footer Link */}
        <div className="mt-8 py-4 text-center">
          <p className="text-slate-400 font-medium text-xs">
              New initiate?{" "}
              <button 
                onClick={() => navigate("/auth/register")}
                className="text-primary font-black uppercase tracking-widest hover:underline underline-offset-4 ml-1"
              >
                Register
              </button>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}
