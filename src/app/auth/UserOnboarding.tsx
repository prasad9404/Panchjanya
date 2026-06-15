import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import {
  ChevronRight, ChevronLeft, Camera,
  CheckCircle2, Sparkles, ArrowRight, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import type { SpiritualProfile } from "@/auth/userService";
import { useTranslation } from "react-i18next";

export default function UserOnboarding() {
  const navigate = useNavigate();
  const { completeSpiritualOnboarding, user } = useAuth();
  const { i18n } = useTranslation();
  const selectedLanguage = localStorage.getItem("panchajanya_lang") || i18n.language || "mr";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [globalError, setGlobalError] = useState("");

  // Form State
  const [formData, setFormData] = useState<SpiritualProfile & { agreedToTerms: boolean }>({
    status: "" as "Naam Dharak" | "Vasnik" | "Bhikshuk" | "",
    naamMantra: false,
    guruvaryaName: "",
    guruvaryaPlace: "",
    guruvaryaYear: "",
    vidyaKnowledge: "",
    vidyaGuruvaryaName: "",
    vidyaGuruvaryaPlace: "",
    vidyaGuruvaryaYear: "",
    vidyaStudiedMode: "" as "Observable" | "Online" | "",
    dikshaGuruvaryaName: "",
    dikshaGuruvaryaPlace: "",
    dikshaGuruvaryaYear: "",
    agreedToTerms: false,
  });

  const nextStep = () => setStep((p) => p + 1);
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  // Called on the final step when user taps "Complete Registration"
  const handleCompleteOnboarding = async () => {
    if (!formData.agreedToTerms) return;
    setGlobalError("");
    setIsLoading(true);

    try {
      const { agreedToTerms, ...spiritualProfile } = formData;
      await completeSpiritualOnboarding(spiritualProfile, selectedLanguage);
      // Advance to success screen (step 4)
      nextStep();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save details. Please try again.";
      setGlobalError(message);
      console.error("❌ [UserOnboarding] Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col z-10 w-full max-w-lg mx-auto px-6 pt-10 pb-12 overflow-y-auto no-scrollbar">

        {/* 📊 Progress Indicator */}
        {step < 5 && (
          <div className="mb-6">
            <div className="h-1 w-full bg-blue-900/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-950 to-blue-700 rounded-full"
              />
            </div>
          </div>
        )}

        {/* 🏛️ Consistent Brand Header (Steps 2-4) */}
        {step > 1 && step < 5 && (
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-amber-100/20 blur-3xl rounded-full scale-150 animate-pulse" />
                <img 
                  src="/icons/Homepage logo.svg" 
                  alt="Panchjanya Logo" 
                  className="h-36 sm:h-44 w-auto object-contain relative z-10 drop-shadow-sm" 
                  style={{ mixBlendMode: 'multiply' }}
                />
              </div>
            </motion.div>
          </div>
        )}

        {/* 🚨 Global Error Banner */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-red-700 leading-relaxed">{globalError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {/* ─── STEP 1: Spiritual Status ─────────────────────────────────── */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* 1. Brand Welcome at Top */}
              <div className="text-center space-y-1">
                <motion.span 
                  initial={{ opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ opacity: 1, letterSpacing: "0.4em" }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="block text-amber-700/60 font-black uppercase text-[10px] tracking-[0.35em] mb-2"
                >
                  Welcome to
                </motion.span>
                
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 bg-amber-100/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <img 
                      src="/icons/Homepage logo.svg" 
                      alt="Panchjanya Logo" 
                      className="h-36 sm:h-44 w-auto object-contain relative z-10 drop-shadow-sm" 
                      style={{ mixBlendMode: 'multiply' }}
                    />
                  </div>
                </motion.div>
              </div>

              {/* 2. Passage Content Block */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="p-5 sm:p-7 bg-white/40 backdrop-blur-md rounded-[1.5rem] border border-white/60 text-center relative overflow-hidden shadow-sm"
              >
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Sparkles className="w-8 h-8 text-blue-900" />
                  </div>
                  <p className="text-xs sm:text-sm text-blue-900/80 leading-relaxed font-medium font-serif max-w-sm mx-auto">
                    This app is specially made for the followers of the Mahanubhav Panth only.
                    To confirm your participation, please provide the following spiritual details
                    to enable us to serve the level of information according to your knowledge
                    of Bramhavidhya. We appreciate your support. Thanking you !
                  </p>
                </motion.div>

                <div className="space-y-4 pt-2">
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="text-[9px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-4 text-center"
                  >
                    Select Your Spiritual Status
                  </motion.h3>
                  <div className="grid gap-3">
                    {(["Naam Dharak", "Vasnik", "Bhikshuk"] as const).map((status, index) => (
                      <motion.button
                        key={status}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1 + (index * 0.1) }}
                        type="button"
                        onClick={() => setFormData({ ...formData, status })}
                        className={cn(
                          "w-full h-14 px-5 rounded-[1.2rem] border flex items-center justify-between group transition-all duration-500",
                          formData.status === status
                            ? "border-amber-500 bg-amber-50 shadow-[0_4px_12px_rgba(245,158,11,0.1)] scale-[1.02]"
                            : "border-slate-100 bg-white/50 backdrop-blur-sm hover:border-amber-200 hover:bg-white"
                        )}
                      >
                        <span className={cn(
                          "text-base font-black font-serif transition-colors",
                          formData.status === status ? "text-blue-950" : "text-slate-400 group-hover:text-blue-900"
                        )}>{status}</span>
                        <div className={cn(
                          "w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500",
                          formData.status === status 
                            ? "border-amber-600 bg-amber-600 text-white rotate-0" 
                            : "border-slate-100 text-transparent -rotate-90 group-hover:border-amber-200"
                        )}>
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

              <div className="pt-6">
                <GradientButton 
                  onClick={nextStep} 
                  disabled={!formData.status} 
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Continue</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 2: Spiritual Details ───────────────────────────────── */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center relative">
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-1 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">Spiritual Details</h2>
                <p className="text-amber-700/60 text-[10px] uppercase tracking-[0.2em] font-black">Sanctuary Entrance • {formData.status}</p>
              </div>

              <div className="space-y-5">
                {formData.status === "Naam Dharak" && (
                  <div className="p-5 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[1.5rem] space-y-5 shadow-sm">
                    <div className="flex items-center justify-between p-4 bg-blue-900/5 rounded-2xl border border-blue-900/5 transition-all group-hover:bg-blue-900/10">
                      <div className="flex flex-col">
                        <span className="font-bold text-[11px] text-blue-950 uppercase tracking-wider">Taken Naam Mantra?</span>
                        <span className="text-[9px] text-slate-400 font-medium">Spiritual Initiation Status</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, naamMantra: !formData.naamMantra })}
                        className={cn("w-12 h-7 rounded-full p-1 transition-all duration-500", formData.naamMantra ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" : "bg-slate-200")}
                      >
                        <div className={cn("w-5 h-5 rounded-full bg-white transition-all duration-500 shadow-md transform", formData.naamMantra ? "translate-x-5" : "translate-x-0")} />
                      </button>
                    </div>
                    <AuthInputField topLabel="In Which Year?" label="Year (YYYY)" type="number" value={formData.guruvaryaYear} onChange={e => setFormData({ ...formData, guruvaryaYear: e.target.value })} />
                    <AuthInputField topLabel="GURUVARYA NAME" label="P. Pu. ..." value={formData.guruvaryaName} onChange={e => setFormData({ ...formData, guruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City, State..." value={formData.guruvaryaPlace} onChange={e => setFormData({ ...formData, guruvaryaPlace: e.target.value })} />
                  </div>
                )}

                {formData.status === "Vasnik" && (
                  <div className="space-y-5">
                    <div className="p-5 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[1.5rem] space-y-5 shadow-sm">
                      <div className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl">
                        <span className="font-bold text-xs text-blue-950 uppercase tracking-tight">Taken Naam Mantra?</span>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, naamMantra: !formData.naamMantra })}
                          className={cn("w-10 h-6 rounded-full p-1 transition-all", formData.naamMantra ? "bg-amber-500" : "bg-slate-200")}
                        >
                          <div className={cn("w-4 h-4 rounded-full bg-white transition-all shadow-sm", formData.naamMantra ? "ml-4" : "ml-0")} />
                        </button>
                      </div>
                      <AuthInputField topLabel="In Which Year?" label="Year (YYYY)" type="number" value={formData.guruvaryaYear} onChange={e => setFormData({ ...formData, guruvaryaYear: e.target.value })} />
                      <AuthInputField topLabel="GURUVARYA NAME" label="P. Pu. ..." value={formData.guruvaryaName} onChange={e => setFormData({ ...formData, guruvaryaName: e.target.value })} />
                      <AuthInputField topLabel="PLACE" label="Ashram, City, State..." value={formData.guruvaryaPlace} onChange={e => setFormData({ ...formData, guruvaryaPlace: e.target.value })} />
                    </div>

                    <div className="p-5 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[1.5rem] space-y-5 shadow-sm">
                      <AuthInputField topLabel="KNOWLEDGE OF BRAMHAVIDYA" label="Describe your studies ..." value={formData.vidyaKnowledge} onChange={e => setFormData({ ...formData, vidyaKnowledge: e.target.value })} />
                      <AuthInputField topLabel="VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />
                      <AuthInputField topLabel="PLACE" label="Ashram, City, State..." value={formData.vidyaGuruvaryaPlace} onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })} />
                      
                      <div className="flex flex-col gap-3">
                        <span className="text-[9px] font-black text-blue-900/40 uppercase tracking-[0.2em] px-1">Studied Mode?</span>
                        <div className="flex gap-3">
                          {(["Observable", "Online"] as const).map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setFormData({ ...formData, vidyaStudiedMode: mode })}
                              className={cn(
                                "flex-1 py-3 rounded-xl border font-bold text-xs transition-all",
                                formData.vidyaStudiedMode === mode 
                                  ? "border-amber-500 bg-amber-50 text-amber-600 shadow-sm" 
                                  : "border-slate-50 bg-slate-50/50 text-slate-400"
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>

                      <AuthInputField topLabel="Studied Since?" label="Year (YYYY)" type="number" value={formData.vidyaGuruvaryaYear} onChange={e => setFormData({ ...formData, vidyaGuruvaryaYear: e.target.value })} />
                    </div>
                  </div>
                )}

                {formData.status === "Bhikshuk" && (
                  <div className="p-5 bg-white/60 backdrop-blur-md border border-slate-100 rounded-[1.5rem] space-y-5 shadow-sm">
                    <AuthInputField topLabel="Diksha taken in Year?" label="Year (YYYY)" type="number" value={formData.dikshaGuruvaryaYear} onChange={e => setFormData({ ...formData, dikshaGuruvaryaYear: e.target.value })} />
                    <AuthInputField topLabel="DIKSHA GURUVARYA NAME" label="P. Pu. ..." value={formData.dikshaGuruvaryaName} onChange={e => setFormData({ ...formData, dikshaGuruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City, State..." value={formData.dikshaGuruvaryaPlace} onChange={e => setFormData({ ...formData, dikshaGuruvaryaPlace: e.target.value })} />
                    
                    <AuthInputField topLabel="VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City, State..." value={formData.vidyaGuruvaryaPlace} onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="pt-4">
                <GradientButton 
                  onClick={nextStep} 
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Save & Continue</span>
                    <ChevronRight className="w-4 h-4 text-white" />
                  </div>
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 3: Photo + Terms ────────────────────────────────────── */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center relative">
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-1 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">Final Verification</h2>
                <p className="text-amber-700/60 text-[10px] uppercase tracking-[0.2em] font-black">Capture your divine identity</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                  <div className="absolute inset-[-20px] bg-gradient-to-tr from-amber-400/20 via-amber-200/5 to-transparent rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  <div className="w-44 h-44 rounded-[2.5rem] border-2 border-dashed border-slate-200 bg-white/50 backdrop-blur-md flex items-center justify-center relative overflow-hidden transition-all duration-500 group-hover:border-amber-400 group-hover:bg-white/80 shadow-sm">
                    <div className="flex flex-col items-center gap-3">
                      <Camera className="w-12 h-12 text-slate-300 group-hover:text-amber-500 transition-all duration-500 transform group-hover:scale-110" />
                      <span className="text-[10px] font-black text-slate-400 group-hover:text-amber-600 uppercase tracking-widest">Click to Capture</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-white/40 backdrop-blur-md border border-slate-100 rounded-[1.5rem]">
                <div className="flex items-start gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })}
                    className={cn(
                      "w-5 h-5 rounded-md border transition-all flex items-center justify-center shrink-0 mt-0.5",
                      formData.agreedToTerms ? "bg-blue-900 border-blue-900 text-white" : "border-slate-200 bg-white"
                    )}
                    aria-label="Agree to terms"
                  >
                    {formData.agreedToTerms && <CheckCircle2 className="w-3 h-3" />}
                  </button>
                  <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                    I confirm that the information provided is accurate and I agree to the <span className="text-blue-900 font-bold">Terms & Conditions</span>.
                  </p>
                </div>
              </div>

              <div className="pt-4">
                <GradientButton
                  onClick={handleCompleteOnboarding}
                  disabled={!formData.agreedToTerms || isLoading}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.12em] uppercase text-white">Complete Registration</span>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                    </div>
                  )}
                </GradientButton>
              </div>
            </motion.div>
          )}

          {/* ─── STEP 4: Success ─────────────────────────────────────────── */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-6 py-8"
            >
              <div className="relative">
                <div className="absolute inset-[-30px] bg-amber-400/20 blur-3xl rounded-full animate-pulse" />
                <div className="w-28 h-28 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-full flex items-center justify-center shadow-[0_15px_35px_rgba(217,119,6,0.3)] relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                  >
                    <CheckCircle2 className="w-14 h-14 text-white" strokeWidth={2.5} />
                  </motion.div>
                </div>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C] uppercase italic">Registration Successful!</h2>
                <p className="text-slate-400 font-medium text-base">Your spiritual profile is ready.</p>
              </div>
              <GradientButton 
                onClick={() => navigate("/dashboard", { replace: true })} 
                className="w-full max-w-[18rem] h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Enter Sanctuary</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </div>
              </GradientButton>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 1 && step < 4 && (
          <button
            type="button"
            onClick={prevStep}
            disabled={isLoading}
            className="mt-8 mx-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-900 transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Go Back
          </button>
        )}
      </div>
    </AuthBackground>
  );
}
