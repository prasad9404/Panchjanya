import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { 
  ArrowLeft, User, Lock, Mail, Sparkles, 
  Info, Compass, ChevronRight, ArrowRight
} from "lucide-react";

export default function UserRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { [key: string]: string } = {};
    if (!formData.name) newErrors.name = "Required";
    if (!formData.email) newErrors.email = "Required";
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

      <div className="flex-1 flex flex-col px-6 pt-6 pb-12 z-10 w-full max-w-xl mx-auto items-center">
        {/* ⚛️ Logo Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="w-32 h-32 rounded-full border border-amber-100 flex items-center justify-center mb-6 bg-white shadow-sm p-6"
        >
           <img src="/icons/Main logo.svg" alt="Logo" className="w-full h-full object-contain" />
        </motion.div>

        {/* 📜 Welcome Text */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-black text-blue-950 font-serif mb-2">
            Begin Your Journey
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium">
            Create your profile for a divine experience
          </p>
        </div>

        {/* 🥛 Registration Form */}
        <form onSubmit={handleRegister} className="w-full space-y-7 max-w-md">
          <AuthInputField
            topLabel="FULL NAME"
            label="Siddharth Sharma"
            icon={<User />}
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            error={errors.name}
          />

          <AuthInputField
            topLabel="EMAIL ADDRESS"
            label="name@heritage.com"
            type="email"
            icon={<Mail />}
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            error={errors.email}
          />

          <AuthInputField
            topLabel="SECURE PASSWORD"
            label="........"
            type="password"
            icon={<Lock />}
            value={formData.password}
            onChange={e => setFormData({...formData, password: e.target.value})}
            error={errors.password}
          />

          <p className="text-[10px] text-slate-300 text-center px-4 leading-relaxed mt-4 font-semibold">
            By registering, you agree to our <span className="text-blue-900">Terms of Service</span> and <span className="text-blue-900">Privacy Policy</span>.
          </p>

          <div className="pt-6">
            <GradientButton 
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-landing-primary hover:opacity-90 shadow-xl rounded-2xl"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  REGISTER NOW <Sparkles className="w-5 h-5 fill-current" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* 🕊️ Social Divider */}
        <div className="w-full max-w-md my-10 flex items-center gap-4">
           <div className="flex-1 h-[1px] bg-slate-100" />
           <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-300 whitespace-nowrap">Or Join Through</span>
           <div className="flex-1 h-[1px] bg-slate-100" />
        </div>

        {/* 📱 Social Button */}
        <button className="w-full max-w-md h-16 bg-white border border-slate-200 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm mb-12">
           <svg className="w-5 h-5" viewBox="0 0 24 24">
             <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
             <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
             <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
             <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
           </svg>
           <span className="text-sm font-bold text-blue-950">Continue with Google</span>
        </button>

        {/* 🌸 Footer Link */}
        <div className="mt-auto">
          <p className="text-slate-400 font-medium text-sm text-center">
            Already part of the heritage?
          </p>
          <button 
            onClick={() => navigate("/auth/login")}
            className="flex items-center gap-2 mx-auto mt-2 text-primary font-black uppercase tracking-widest hover:underline underline-offset-8 decoration-2"
          >
            Back to Login <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </AuthBackground>
  );
}

