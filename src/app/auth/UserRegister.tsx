import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { 
  ArrowLeft, User, Lock, Mail, CheckCircle2, ChevronRight, 
  Sparkles, BookOpen, MapPin, Calendar, Users, Home,
  UploadCloud, Check, Shield, Flower2, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const MeditationIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 9v5" />
    <path d="m9 14 3-1 3 1" />
    <path d="M16 10c-1.3-1-2.7-1-4-1s-2.7 0-4 1" />
    <path d="m5 18 2-1 3 1h4l3-1 2 1" />
    <path d="M9 16h6" />
  </svg>
);

const DivineSelect = ({ label, icon, value, options, onChange, error }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((o: any) => o.value === value);

  return (
    <div className="relative group w-full">
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative h-16 w-full flex items-center pl-16 pr-10 rounded-2xl border transition-all duration-500 cursor-pointer bg-white/40 backdrop-blur-xl overflow-hidden",
          isOpen ? "border-amber-400 bg-white/80 ring-4 ring-amber-400/5 shadow-lg" : "border-slate-200/60 hover:border-slate-300",
          error ? "border-red-400" : ""
        )}
      >
        <div className={cn(
          "absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-500",
          isOpen || value ? "text-amber-500" : "text-slate-400"
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-6 h-6" })}
        </div>
        
        <div className="flex-1 flex flex-col justify-center min-w-0">
           {value && (
             <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-900/60 mb-0.5 transform -translate-y-1">
               {label}
             </span>
           )}
           <span className={cn(
             "text-xs sm:text-sm font-bold uppercase tracking-wider transition-all truncate",
             value ? "text-blue-950" : "text-slate-400"
           )}>
             {selectedOption ? selectedOption.label : label}
           </span>
        </div>
        
        <ChevronDown className={cn("w-5 h-5 text-slate-300 transition-transform duration-500", isOpen && "rotate-180 text-amber-500")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 p-2 bg-white/95 backdrop-blur-3xl rounded-[2rem] border border-white shadow-2xl overflow-hidden"
          >
            {options.map((opt: any) => (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group/opt text-left",
                  value === opt.value ? "bg-amber-50 text-blue-900" : "hover:bg-slate-50 text-slate-600"
                )}
              >
                <span className="font-black uppercase tracking-widest text-xs">{opt.label}</span>
                {value === opt.value && <Check className="w-4 h-4 text-amber-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};


export default function UserRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration State
  const [formData, setFormData] = useState({
    name: "",
    identifier: "",
    password: "",
    otp: "",
    role: "", 
    age: "",
    gender: "",
    address: ""
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const nextStep = () => {
    setErrors({});
    
    // Step 1 Validation
    if (step === 1) {
      const newErrors: { [key: string]: string } = {};
      if (!formData.name) newErrors.name = "Required";
      if (!formData.identifier) newErrors.identifier = "Required";
      if (!formData.password) newErrors.password = "Required";
      
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
      setStep(2);
      return;
    }
    
    // Step 2 Validation: OTP
    if (step === 2) {
      if (formData.otp.length < 4) {
        setErrors({ otp: "Invalid Code" });
        return;
      }
      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        setStep(3);
      }, 1000);
      return;
    }

    // Step 3 Validation: Role Selection
    if (step === 3) {
      if (!formData.role) {
        setErrors({ role: "Select a path" });
        return;
      }
      setStep(4);
      return;
    }
  };

  const prevStep = () => {
    if (step === 1) navigate(-1);
    else setStep(prev => prev - 1);
    setErrors({});
  };

  const handleRegister = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep(5); // Success step
    }, 2000);
  };

  const ROLES = [
    { 
      id: "grahasth", 
      title: "Grahasth", 
      desc: "Connect with the community",
      icon: <Home className="w-9 h-9" />,
      color: "from-blue-50 to-white border-blue-100",
      accent: "text-blue-600",
      glow: "shadow-[0_10px_30px_rgba(30,58,138,0.05)]"
    },
    { 
      id: "vasanik", 
      title: "Vasanik", 
      desc: "Deeper sacred knowledge",
      icon: <BookOpen className="w-9 h-9" />,
      color: "from-blue-50 to-amber-50 border-amber-100",
      accent: "text-amber-600",
      glow: "shadow-[0_10px_30px_rgba(245,158,11,0.05)]"
    },
    { 
      id: "bhikshuk", 
      title: "Bhikshuk", 
      desc: "Complete spiritual immersion",
      icon: <MeditationIcon className="w-10 h-10" />,
      color: "from-amber-100 to-white border-amber-200 shadow-[0_10px_35px_rgba(245,158,11,0.1)]",
      accent: "text-amber-700",
      glow: "shadow-[0_10px_40px_rgba(255,179,0,0.15)]"
    }
  ];

  const pageVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 }
  };

  return (
    <AuthBackground showMandala={step === 1 || step === 5}>
      {/* 🧭 Ivory Header & Segmented Progress */}
      {step < 5 && (
        <div className="pt-12 px-6 pb-6 z-20 w-full max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-8 sm:mb-10">
            <motion.button 
              whileHover={{ x: -4, backgroundColor: "rgba(255,255,255,1)" }}
              onClick={prevStep}
              className="w-12 h-12 bg-white/80 backdrop-blur-3xl rounded-[1.25rem] flex items-center justify-center text-blue-900 border border-white shadow-sm"
            >
              <ArrowLeft className="w-6 h-6" />
            </motion.button>
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate("/auth/splash")}>
               <img src="/icons/Main logo.svg" className="w-9 h-9 sm:w-11 sm:h-11" alt="Logo" />
               <span className="font-serif font-black text-blue-950 text-xs sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase">Panchajanya</span>
            </div>
            <div className="w-12 h-12" />
          </div>

          {/* 💎 Segmented Progress markers */}
          <div className="flex gap-3 px-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className="flex-1 relative h-1.5 rounded-full bg-slate-200/50 overflow-hidden"
              >
                 <motion.div 
                   initial={false}
                   animate={{ 
                     width: s <= step ? "100%" : "0%",
                     backgroundColor: s === step ? "#F59E0B" : "#1E3A8A" 
                   }}
                   className={cn(
                     "absolute inset-0 transition-colors duration-500",
                     s === step ? "shadow-[0_0_8px_rgba(245,158,11,0.3)]" : ""
                   )}
                 />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 px-6 pb-12 relative overflow-x-hidden pt-6 w-full max-w-xl mx-auto z-10">
        <AnimatePresence mode="wait">
          
          {/* -------------------- STEP 1: IDENTITY -------------------- */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif mb-4 leading-tight tracking-tight">Create Your <br/> <span className="text-amber-500">Sacred Identity</span></h1>
              <p className="text-slate-400 text-base sm:text-lg font-medium mb-8 sm:mb-12 tracking-wide">Enter the lineage of Panchajanya.</p>

              <div className="space-y-6">
                <AuthInputField
                  label="Full Name of Devotee"
                  icon={<User className="w-5 h-5" />}
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  error={errors.name}
                  autoComplete="name"
                />

                <AuthInputField
                  label="Email or Mobile Sanctum"
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.identifier}
                  onChange={e => setFormData({...formData, identifier: e.target.value})}
                  error={errors.identifier}
                />

                <AuthInputField
                  label="Private Key (Password)"
                  type="password"
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  error={errors.password}
                  autoComplete="new-password"
                />

                <div className="pt-10 w-full">
                  <GradientButton 
                    onClick={nextStep}
                    className="w-full h-16 shadow-[0_15px_35px_rgba(30,58,138,0.1)]"
                  >
                    Continue Initiation
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* -------------------- STEP 2: VERIFICATION -------------------- */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif mb-4 leading-tight">Verify <br/> <span className="text-amber-500">Connection</span></h1>
              <p className="text-slate-400 text-base sm:text-lg font-medium mb-8 sm:mb-12 tracking-wide">
                Secret code sent to your sanctum contact.
              </p>

              <div className="space-y-10">
                <AuthInputField
                  label="6-Digit Seal"
                  maxLength={6}
                  value={formData.otp}
                  onChange={e => setFormData({...formData, otp: e.target.value})}
                  error={errors.otp}
                  icon={<Shield className="w-5 h-5" />}
                  className="text-center tracking-[0.8em] font-black text-2xl uppercase placeholder:tracking-widest"
                />

                <div className="text-center space-y-6">
                  <p className="text-xs text-slate-300 font-extrabold tracking-widest uppercase">Seal not received?</p>
                  <button className="px-10 py-3 rounded-2xl bg-white border border-slate-100 text-blue-900 font-black text-[10px] hover:bg-slate-50 transition-all tracking-[0.3em] uppercase shadow-sm">
                    Resend Seal
                  </button>
                </div>

                <div className="pt-10 w-full">
                  <GradientButton 
                    onClick={nextStep}
                    disabled={isLoading}
                    className="w-full h-16 shadow-[0_15px_35px_rgba(30,58,138,0.1)]"
                  >
                    {isLoading ? <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" /> : "Confirm Seal"}
                  </GradientButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* -------------------- STEP 3: ROLE SELECTION (DIVINE CARDS) -------------------- */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif mb-4 leading-tight">Choose Your <br/> <span className="text-amber-500">Sacred Path</span></h1>
              <p className="text-slate-400 text-base sm:text-lg font-medium mb-8 sm:mb-10 tracking-wide">Selecting your spiritual level.</p>

              <div className="grid gap-6">
                {ROLES.map((r, i) => {
                  const isSelected = formData.role === r.id;
                  return (
                    <motion.button
                      key={r.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02, y: -4 }}
                      onClick={() => {
                        setFormData({...formData, role: r.id});
                        setErrors({});
                      }}
                      className={cn(
                        "group relative w-full flex items-center gap-6 p-7 rounded-[2.5rem] bg-gradient-to-br backdrop-blur-2xl border-2 text-left transition-all duration-500",
                        isSelected 
                          ? "border-amber-400 bg-white ring-8 ring-amber-400/5 shadow-[0_15px_40px_rgba(245,158,11,0.1)]" 
                          : `${r.color} hover:border-slate-200 shadow-sm shadow-black/5`
                      )}
                    >
                      <div className={cn(
                        "p-5 rounded-3xl transition-all duration-700 shadow-sm shadow-black/5",
                        isSelected ? "bg-amber-400 text-white scale-110 rotate-6" : "bg-white text-slate-300"
                      )}>
                        {r.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={cn(
                          "font-serif font-black text-2xl italic tracking-tight transition-colors duration-500",
                          isSelected ? "text-blue-950" : "text-slate-700"
                        )}>
                          {r.title}
                        </h3>
                        <p className="text-slate-400 text-[10px] mt-2 font-black uppercase tracking-widest leading-loose">{r.desc}</p>
                      </div>
                      
                      <div className={cn(
                        "w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                        isSelected ? "border-amber-400 bg-amber-400 shadow-[0_0_15px_#F59E0B]" : "border-slate-100 bg-slate-50"
                      )}>
                        {isSelected ? <Check className="w-7 h-7 text-white" /> : <Shield className="w-5 h-5 text-slate-100" />}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              <div className="pt-14 w-full px-4">
                <GradientButton 
                  onClick={nextStep}
                  disabled={!formData.role}
                  className={cn("w-full h-16", !formData.role ? "opacity-30 grayscale" : "shadow-[0_15px_35px_rgba(30,58,138,0.1)]")}
                >
                  Ascend to Profile
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* -------------------- STEP 4: PROFILE COMPLETION -------------------- */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="flex items-center justify-between mb-8">
                 <h1 className="text-3xl sm:text-5xl font-black text-blue-950 font-serif tracking-tight leading-tight">Divine <br/> <span className="text-amber-400">Expansion</span></h1>
                 <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black tracking-[0.4em] uppercase text-amber-500">Optional</span>
                    <div className="h-1 w-12 bg-amber-500/20 mt-1 rounded-full" />
                 </div>
              </div>
              <p className="text-slate-400 text-base sm:text-lg font-medium mb-8 sm:mb-12 tracking-wide">Enhance your spiritual presence.</p>

              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <AuthInputField
                      label="Era (Age)"
                      type="number"
                      icon={<Calendar className="w-5 h-5" />}
                      value={formData.age}
                      onChange={e => setFormData({...formData, age: e.target.value})}
                    />
                  </div>
                  <div className="flex-[1.5]">
                    <DivineSelect
                      label="Nature (Gender)"
                      icon={<Users />}
                      value={formData.gender}
                      onChange={(val: string) => setFormData({...formData, gender: val})}
                      options={[
                        { label: "Male Devotee", value: "male" },
                        { label: "Female Devotee", value: "female" },
                        { label: "Divine Spirit", value: "other" }
                      ]}
                      error={errors.gender}
                    />
                  </div>
                </div>

                <AuthInputField
                  label="Sacred Location (City/Village)"
                  icon={<MapPin className="w-5 h-5" />}
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                />

                {/* 📸 Light Theme Upload Box */}
                <div className="group font-black">
                   <label className="text-[10px] uppercase tracking-[0.4em] text-slate-300 ml-5 mb-3 block">Divine Portrait</label>
                   <div className="relative border-4 border-dashed border-slate-50 rounded-[3rem] p-12 flex flex-col items-center justify-center bg-white/40 hover:bg-white/80 hover:border-amber-100 transition-all cursor-pointer group-hover:scale-[1.01] shadow-inner">
                      <motion.div 
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="w-20 h-20 rounded-[2rem] bg-gradient-to-tr from-amber-400 to-amber-500 flex items-center justify-center shadow-lg mb-6 text-white group-hover:rotate-6 transition-transform"
                      >
                         <UploadCloud className="w-10 h-10" />
                      </motion.div>
                      <p className="text-xs font-black uppercase tracking-widest text-slate-400 text-center">Capture or Upload Portrait</p>
                      <p className="text-[10px] text-slate-200 uppercase mt-3 tracking-[0.2em]">Sanctum approved formats</p>
                   </div>
                </div>

                <div className="pt-10 flex flex-col gap-6">
                  <GradientButton 
                    onClick={handleRegister} 
                    disabled={isLoading} 
                    isPill={true}
                    className="w-full h-20 shadow-[0_20px_50px_rgba(30,58,138,0.15)]"
                  >
                    {isLoading ? (
                      <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        Final Ascension 
                        <Sparkles className="w-7 h-7 ml-2 drop-shadow-[0_0_8px_white]" />
                      </>
                    )}
                  </GradientButton>
                  <button onClick={handleRegister} className="text-[10px] font-black uppercase tracking-[0.6em] text-slate-200 hover:text-blue-900 transition-colors py-2">Skip Initiation</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* -------------------- STEP 5: SUCCESS (PETALS) -------------------- */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto w-full flex flex-col items-center justify-center pt-8 text-center"
            >
              {/* 🌸 Sacred Petals Animation (Replacing Stars for Light theme) */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(12)].map((_, i) => (
                   <motion.div
                     key={i}
                     initial={{ y: -100, x: Math.random() * 600 - 300, opacity: 0, rotate: 0 }}
                     animate={{ y: 800, opacity: [0, 1, 1, 0], rotate: 360, x: Math.random() * 400 - 200 }}
                     transition={{ duration: 6 + Math.random() * 4, repeat: Infinity, delay: i * 0.5 }}
                     className="absolute left-1/2 top-0 text-pink-200/60"
                   >
                     <Flower2 className="w-8 h-8" />
                   </motion.div>
                ))}
              </div>

              <div className="relative mb-14">
                 <motion.div 
                   animate={{ scale: [1, 1.05, 1] }}
                   transition={{ duration: 6, repeat: Infinity }}
                   className="w-56 h-56 rounded-[4.5rem] bg-gradient-to-br from-blue-50 to-blue-100 p-1 flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.03)]"
                 >
                    <div className="w-full h-full bg-white rounded-[4.3rem] flex items-center justify-center border-4 border-white border-dashed">
                       <motion.div
                         initial={{ scale: 0, rotate: -45 }}
                         animate={{ scale: 1, rotate: 0 }}
                         transition={{ type: "spring", delay: 0.6 }}
                       >
                         <CheckCircle2 className="w-28 h-28 text-blue-900 drop-shadow-sm" />
                       </motion.div>
                    </div>
                 </motion.div>
              </div>
              
              <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-950 via-blue-800 to-blue-950 font-serif mb-6 leading-tight italic tracking-tighter drop-shadow-sm">
                Ascension <br/> Complete
              </h1>
              <p className="text-slate-400 text-lg sm:text-xl font-medium mb-12 sm:mb-16 px-4 sm:px-8 leading-relaxed tracking-wide">
                Your spiritual lineage is now woven into the fabric of <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-900 to-blue-600 font-extrabold shadow-sm">Panchajanya</span>.
              </p>
              
              <div className="w-full px-6">
                <GradientButton 
                  onClick={() => navigate("/auth/login")}
                  className="w-full h-20 shadow-[0_20px_50px_rgba(30,58,138,0.15)]"
                >
                  Enter the Sanctuary
                </GradientButton>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </AuthBackground>
  );
}
