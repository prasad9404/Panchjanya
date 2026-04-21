import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { ArrowLeft, User, Lock, Eye, EyeOff, Sparkles, ShieldCheck } from "lucide-react";

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
      navigate("/"); 
    }, 1500);
  };

  return (
    <AuthBackground showMandala={false}>
      <div className="pt-12 px-6 flex items-center justify-between z-20 w-full max-w-xl mx-auto">
        <motion.button 
          whileHover={{ x: -4, backgroundColor: "rgba(255,255,255,1)" }}
          onClick={() => navigate(-1)}
          className="w-12 h-12 bg-white/80 backdrop-blur-3xl rounded-[1.25rem] flex items-center justify-center text-blue-900 shadow-sm border border-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </motion.button>
        
        <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/auth/splash")}>
           <img src="/icons/Main logo.svg" className="w-9 h-9 sm:w-11 sm:h-11 transition-transform group-hover:scale-105" alt="Logo" />
           <span className="font-serif font-black text-blue-900 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase">Panchajanya</span>
        </div>
        <div className="w-12 h-12" />
      </div>

      <div className="flex-1 flex flex-col px-6 pt-12 pb-10 z-10 w-full max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-900 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-sm">
             <ShieldCheck className="w-3.5 h-3.5" />
             Sanctum Access Only
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif mb-4 leading-tight">
            Divine <br/> <span className="text-amber-500">Reconnection</span>
          </h1>
          <p className="text-slate-400 text-base sm:text-lg font-medium tracking-wide">
            Your sacred space awaits your return.
          </p>
        </motion.div>

        {/* 🥛 Frosted Card Form */}
        <motion.div
           initial={{ opacity: 0, scale: 0.98 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative p-1 bg-gradient-to-b from-white/80 to-white/20 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)]"
        >
          <div className="bg-white/40 backdrop-blur-3xl rounded-[2.4rem] p-8 space-y-8 border border-white/60">
            <form onSubmit={handleLogin} className="space-y-6">
              <AuthInputField
                label="Identity Identifier"
                icon={<User className="w-5 h-5" />}
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                error={errors.identifier}
                autoComplete="username"
              />

              <div className="space-y-4">
                <AuthInputField
                  label="Private Key (Password)"
                  type={showPassword ? "text" : "password"}
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={errors.password}
                  autoComplete="current-password"
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-300 hover:text-blue-900 transition-colors mr-2"
                    >
                      {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
                    </button>
                  }
                />
                
                <div className="flex justify-end pr-2">
                  <button 
                    type="button" 
                    className="text-xs font-black uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors hover:scale-105"
                  >
                    Soul Recovery?
                  </button>
                </div>
              </div>

              <div className="pt-6">
                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-16 shadow-[0_15px_35px_rgba(30,58,138,0.1)]"
                  variant="primary"
                >
                  {isLoading ? (
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      Enter Sanctuary
                      <Sparkles className="w-5 h-5 ml-2" />
                    </>
                  )}
                </GradientButton>
              </div>
            </form>
          </div>
        </motion.div>

        <div className="mt-auto pt-10 sm:pt-14 text-center">
          <p className="text-slate-400 font-bold tracking-wide text-sm sm:text-base">
            New initiate?{" "}
            <button 
              onClick={() => navigate("/auth/register")}
              className="text-blue-900 font-black uppercase tracking-widest hover:underline decoration-2 underline-offset-8 transition-all hover:scale-105 active:scale-95 px-4"
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}
