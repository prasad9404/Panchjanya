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
        <form onSubmit={handleRegister} className="w-full space-y-6 max-w-md pb-20">
          <div className="grid grid-cols-2 gap-4">
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

          <div className="space-y-3 px-1">
            <label className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest ml-4">GENDER</label>
            <div className="flex gap-4">
              {["Male", "Female"].map(g => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setFormData({ ...formData, gender: g })}
                  className={cn(
                    "flex-1 h-12 rounded-2xl border-2 font-bold text-sm transition-all",
                    formData.gender === g ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-100 bg-white text-slate-500"
                  )}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

          <div className="grid grid-cols-2 gap-4">
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
                  CONTINUE TO VERIFY <ArrowRight className="w-5 h-5" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

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

