import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { 
  ArrowLeft, User, Lock, Mail, Sparkles, 
  Info, Compass, ChevronRight, ArrowRight,
  MapPin, Phone
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function UserRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    gender: "",
    state: "",
    district: "",
    taluka: "",
    city: "",
    whatsapp: "",
    mobile: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const newErrors: { [key: string]: string } = {};
    if (!formData.firstName) newErrors.firstName = "Required";
    if (!formData.lastName) newErrors.lastName = "Required";
    if (!formData.mobile) newErrors.mobile = "Required";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/auth/verify-identity"); 
    }, 1500);
  };

  return (
    <AuthBackground showMandala={true}>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-12 z-10 w-full max-w-lg mx-auto items-center">
        {/* ⚛️ Logo Container - Consistent with Welcome Page */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative w-24 h-24 mb-6 group flex items-center justify-center"
        >
           <div className="absolute inset-[-10px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-xl opacity-40" />
           <img 
            src="/icons/Main logo.svg" 
            alt="Logo" 
            className="w-full h-full object-contain relative z-10 drop-shadow-md" 
            style={{ mixBlendMode: 'multiply' }}
           />
        </motion.div>

        {/* 📜 Welcome Text */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-blue-950 font-serif mb-2 bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
            Begin Your Journey
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
            Create your profile for a divine experience
          </p>
        </div>

        {/* 🥛 Registration Form */}
        <form onSubmit={handleRegister} className="w-full space-y-5 max-w-[22rem] pb-10">
          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="FIRST NAME"
              label="Siddharth"
              icon={<User />}
              value={formData.firstName}
              onChange={e => setFormData({...formData, firstName: e.target.value})}
              error={errors.firstName}
            />
            <AuthInputField
              topLabel="LAST NAME"
              label="Sharma"
              icon={<User />}
              value={formData.lastName}
              onChange={e => setFormData({...formData, lastName: e.target.value})}
              error={errors.lastName}
            />
          </div>

          <div className="space-y-2 px-1">
            <label className="text-[9px] font-black text-blue-900/40 uppercase tracking-widest ml-1">GENDER</label>
            <div className="flex gap-3">
              {["Male", "Female"].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={cn(
                    "flex-1 h-11 rounded-xl border font-bold text-xs transition-all",
                    formData.gender === g 
                      ? "border-amber-500 bg-amber-50 text-amber-900 shadow-sm" 
                      : "border-slate-100 bg-white/50 text-slate-400"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="STATE"
              label="Maharashtra"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.state}
              onChange={e => setFormData({...formData, state: e.target.value})}
              error={errors.state}
            />
            <AuthInputField
              topLabel="DISTRICT"
              label="Sambhajinagar"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.district}
              onChange={e => setFormData({...formData, district: e.target.value})}
              error={errors.district}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="TALUKA"
              label="Paithan"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.taluka}
              onChange={e => setFormData({...formData, taluka: e.target.value})}
              error={errors.taluka}
            />
            <AuthInputField
              topLabel="CITY / VILLAGE"
              label="Paithan"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.city}
              onChange={e => setFormData({...formData, city: e.target.value})}
              error={errors.city}
            />
          </div>

          <AuthInputField
            topLabel="WHATSAPP NUMBER"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            value={formData.whatsapp}
            onChange={e => setFormData({...formData, whatsapp: e.target.value})}
            error={errors.whatsapp}
          />

          <AuthInputField
            topLabel="MOBILE NUMBER"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            value={formData.mobile}
            onChange={e => setFormData({...formData, mobile: e.target.value})}
            error={errors.mobile}
          />

          <div className="pt-4">
            <GradientButton 
              type="submit"
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.12em] uppercase text-white">CONTINUE TO VERIFY</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* 🌸 Footer Link */}
        <div className="mt-auto py-4">
          <p className="text-slate-400 font-medium text-xs text-center">
            Already part of the heritage?
          </p>
          <button 
            onClick={() => navigate("/auth/login")}
            className="flex items-center gap-1.5 mx-auto mt-2 text-primary font-black uppercase tracking-widest text-[11px] hover:underline underline-offset-4"
          >
            Back to Login <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AuthBackground>
  );
}

