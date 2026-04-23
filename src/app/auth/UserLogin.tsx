import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { ArrowLeft, User, Lock, Eye, EyeOff, Church, Flower2 } from "lucide-react";

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
      navigate("/auth/language"); 
    }, 1500);
  };

  return (
    <AuthBackground showMandala={true}>

      <div className="flex-1 flex flex-col px-6 pt-10 pb-10 z-10 w-full max-w-xl mx-auto items-center">
        {/* 🏛️ Logo Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-32 h-32 rounded-full bg-white flex items-center justify-center shadow-[0_10px_40px_rgba(0,0,0,0.03)] border border-slate-50 mb-10 overflow-hidden p-6"
        >
           <img src="/icons/Main logo.svg" alt="Panchajanya Logo" className="w-full h-full object-contain" />
        </motion.div>

        {/* 📜 Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-blue-950 font-serif mb-3 tracking-tighter uppercase italic">
            Login
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium tracking-wide">
            Welcome back to the sanctuary
          </p>
        </motion.div>

        {/* 🥛 Auth Form */}
        <form onSubmit={handleLogin} className="w-full space-y-7 max-w-md">
          <AuthInputField
            topLabel="Email or Mobile"
            label="Email / Number"
            icon={<User />}
            value={formData.identifier}
            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            error={errors.identifier}
            autoComplete="username"
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
                className="text-[10px] font-black text-blue-900/40 hover:text-blue-900 transition-colors uppercase tracking-widest"
                onClick={() => navigate("/auth/recover")}
              >
                Forgot?
              </button>
            }
          />

          <div className="pt-6">
            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-landing-primary hover:opacity-90 shadow-xl rounded-2xl"
              variant="primary"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  Login <Church className="w-5 h-5 fill-current" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* ... divider and social button ... */}

        {/* 🌸 Footer Link */}
        <p className="mt-8 py-8 text-slate-400 font-medium text-sm text-center">
            New initiate?{" "}
            <button 
              onClick={() => navigate("/auth/onboarding")}
              className="text-primary font-black uppercase tracking-widest hover:underline underline-offset-8 decoration-2"
            >
              Register
            </button>
        </p>
      </div>
    </AuthBackground>
  );
}
