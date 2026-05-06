import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import {
  User, Mail, Lock, Phone, MapPin,
  ChevronRight, ChevronLeft, Camera,
  CheckCircle2, AlertCircle, Info,
  Fingerprint, Heart, ShieldCheck, Sparkles, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export default function UserOnboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
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
    selfie: null as string | null,
    agreedToTerms: false
  });

  const nextStep = () => setStep((p) => p + 1);
  const prevStep = () => setStep((p) => Math.max(p - 1, 1));

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col z-10 w-full max-w-xl mx-auto px-6 pt-12 pb-20 overflow-y-auto no-scrollbar">

        {/* 📊 Progress Indicator */}
        {step < 5 && (
          <div className="mb-6">
            <div className="h-1.5 w-full bg-blue-900/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / 4) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-900 to-blue-700 rounded-full"
              />
            </div>
          </div>
        )}

        {/* 🏛️ Consistent Brand Header (Steps 2-4) */}
        {step > 1 && step < 5 && (
          <div className="flex flex-col items-center mb-10">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <div className="absolute inset-0 -inset-x-20 bg-amber-100/20 blur-3xl rounded-full scale-150 animate-pulse" />
              <img 
                src="/icons/Homepage logo.svg" 
                alt="Panchjanya Logo" 
                className="h-12 opacity-80 object-contain relative z-10" 
              />
            </motion.div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              {/* 1. Brand Welcome at Top */}
              <div className="text-center space-y-6">
                <motion.span 
                  initial={{ opacity: 0, letterSpacing: "0.2em" }}
                  animate={{ opacity: 1, letterSpacing: "0.5em" }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="block text-amber-700/60 font-black uppercase text-[10px] tracking-[0.5em]"
                >
                  Welcome to
                </motion.span>
                
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex justify-center"
                >
                  <div className="relative group">
                    <div className="absolute inset-0 -inset-x-20 bg-amber-100/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <img 
                      src="/icons/Homepage logo.svg" 
                      alt="Panchjanya Logo" 
                      className="h-20 sm:h-24 object-contain relative z-10" 
                    />
                  </div>
                </motion.div>
              </div>

              {/* 2. Passage Content Block below Logo */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="p-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 text-left relative overflow-hidden shadow-sm"
              >
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Sparkles className="w-12 h-12 text-blue-900" />
                  </div>
                  <p className="text-sm sm:text-base text-blue-900/80 leading-relaxed font-medium font-serif">
                    This app is specially made for the followers of the Mahanubhav Panth only.
                    To confirm your participation, please provide the following spiritual details
                    to enable us to serve the level of information according to your knowledge
                    of Bramhavidhya. Please cooprate us to answer a Small Quiz. We appreciate
                    your support. Thanking you !
                  </p>
                </motion.div>

                <div className="space-y-4 pt-4">
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.3em] mb-6 text-center"
                  >
                    Select Your Spiritual Status
                  </motion.h3>
                  <div className="grid gap-4">
                    {["Naam Dharak", "Vasnik", "Bhikshuk"].map((status, index) => (
                      <motion.button
                        key={status}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.2 + (index * 0.1) }}
                        onClick={() => setFormData({ ...formData, status: status as any })}
                        className={cn(
                          "w-full p-6 rounded-[1.5rem] border-2 flex items-center justify-between group transition-all duration-500",
                          formData.status === status
                            ? "border-amber-600 bg-amber-50 shadow-lg shadow-amber-900/5 scale-[1.02]"
                            : "border-slate-50 bg-white/50 backdrop-blur-sm hover:border-amber-200 hover:bg-white hover:scale-[1.01] hover:shadow-md"
                        )}
                      >
                        <span className={cn(
                          "text-lg font-black font-serif transition-colors",
                          formData.status === status ? "text-blue-950" : "text-slate-400 group-hover:text-blue-900"
                        )}>{status}</span>
                        <div className={cn(
                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                          formData.status === status 
                            ? "border-amber-600 bg-amber-600 text-white rotate-0" 
                            : "border-slate-100 text-transparent -rotate-90 group-hover:border-amber-200"
                        )}>
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} disabled={!formData.status} className="w-full h-16 rounded-[1.5rem]">
                  CONTINUE <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Spiritual Details</h2>
                <p className="text-slate-400 font-medium">For {formData.status}</p>
              </div>

              <div className="space-y-6">
                {formData.status === "Naam Dharak" && (
                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6 shadow-sm">
                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                      <span className="font-bold text-sm text-blue-950">Taken Naam Mantra?</span>
                      <button
                        onClick={() => setFormData({ ...formData, naamMantra: !formData.naamMantra })}
                        className={cn("w-12 h-7 rounded-full p-1 transition-all", formData.naamMantra ? "bg-amber-600" : "bg-slate-200")}
                      >
                        <div className={cn("w-5 h-5 rounded-full bg-white transition-all shadow-sm", formData.naamMantra ? "ml-5" : "ml-0")} />
                      </button>
                    </div>
                    <AuthInputField topLabel="In Which Year?" label="Year (YYYY)" type="number" value={formData.guruvaryaYear} onChange={e => setFormData({ ...formData, guruvaryaYear: e.target.value })} />
                    <AuthInputField topLabel="RESPECTED GURUVARYA NAME" label="P. Pu. ..." value={formData.guruvaryaName} onChange={e => setFormData({ ...formData, guruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City/Village, Taluka, District, State" value={formData.guruvaryaPlace} onChange={e => setFormData({ ...formData, guruvaryaPlace: e.target.value })} />
                  </div>
                )}

                {formData.status === "Vasnik" && (
                  <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6 shadow-sm">
                      <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                        <span className="font-bold text-sm text-blue-950">Taken Naam Mantra?</span>
                        <button
                          onClick={() => setFormData({ ...formData, naamMantra: !formData.naamMantra })}
                          className={cn("w-12 h-7 rounded-full p-1 transition-all", formData.naamMantra ? "bg-amber-600" : "bg-slate-200")}
                        >
                          <div className={cn("w-5 h-5 rounded-full bg-white transition-all shadow-sm", formData.naamMantra ? "ml-5" : "ml-0")} />
                        </button>
                      </div>
                      <AuthInputField topLabel="In Which Year?" label="Year (YYYY)" type="number" value={formData.guruvaryaYear} onChange={e => setFormData({ ...formData, guruvaryaYear: e.target.value })} />
                      <AuthInputField topLabel="RESPECTED GURUVARYA NAME" label="P. Pu. ..." value={formData.guruvaryaName} onChange={e => setFormData({ ...formData, guruvaryaName: e.target.value })} />
                      <AuthInputField topLabel="PLACE" label="Ashram, City/Village, Taluka, District, State" value={formData.guruvaryaPlace} onChange={e => setFormData({ ...formData, guruvaryaPlace: e.target.value })} />
                    </div>

                    <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6 shadow-sm">
                      <AuthInputField topLabel="KNOWLEDGE OF BRAMHAVIDYA" label="Briefly describe your studies ..." value={formData.vidyaKnowledge} onChange={e => setFormData({ ...formData, vidyaKnowledge: e.target.value })} />
                      <AuthInputField topLabel="RESPECTED VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />
                      <AuthInputField topLabel="PLACE" label="Ashram, City/Village, Taluka, District, State" value={formData.vidyaGuruvaryaPlace} onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })} />
                      
                      <div className="flex flex-col gap-4">
                        <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] px-1">Studied Mode?</span>
                        <div className="flex gap-3">
                          {["Observable", "Online"].map((mode) => (
                            <button
                              key={mode}
                              onClick={() => setFormData({ ...formData, vidyaStudiedMode: mode as any })}
                              className={cn(
                                "flex-1 py-4 rounded-2xl border-2 font-bold text-sm transition-all",
                                formData.vidyaStudiedMode === mode 
                                  ? "border-amber-600 bg-amber-50 text-amber-600" 
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
                  <div className="p-6 bg-white border border-slate-100 rounded-[2rem] space-y-6 shadow-sm">
                    <AuthInputField topLabel="Diksha taken in Year?" label="Year (YYYY)" type="number" value={formData.dikshaGuruvaryaYear} onChange={e => setFormData({ ...formData, dikshaGuruvaryaYear: e.target.value })} />
                    <AuthInputField topLabel="RESPECTED DIKSHA GURUVARYA NAME" label="P. Pu. ..." value={formData.dikshaGuruvaryaName} onChange={e => setFormData({ ...formData, dikshaGuruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City/Village, Taluka, District, State" value={formData.dikshaGuruvaryaPlace} onChange={e => setFormData({ ...formData, dikshaGuruvaryaPlace: e.target.value })} />
                    
                    <AuthInputField topLabel="RESPECTED VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />
                    <AuthInputField topLabel="PLACE" label="Ashram, City/Village, Taluka, District, State" value={formData.vidyaGuruvaryaPlace} onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })} />
                  </div>
                )}
              </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} className="w-full h-16 rounded-[1.5rem]">
                  SAVE & CONTINUE <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Final Verification</h2>
                <p className="text-slate-400 font-medium">Upload a photo for your profile</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-[3rem] border-4 border-dashed border-slate-200 bg-white flex items-center justify-center relative overflow-hidden group hover:border-amber-600 transition-all cursor-pointer">
                  <Camera className="w-12 h-12 text-slate-300 group-hover:text-amber-600 transition-all" />
                </div>
              </div>

              <div className="p-6 bg-white/50 border border-slate-100 rounded-[2rem]">
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, agreedToTerms: !formData.agreedToTerms })}
                    className={cn(
                      "w-6 h-6 rounded-md border-2 shrink-0 transition-all flex items-center justify-center",
                      formData.agreedToTerms ? "bg-blue-900 border-blue-900 text-white" : "border-slate-200 bg-white"
                    )}
                  >
                    {formData.agreedToTerms && <CheckCircle2 className="w-4 h-4" />}
                  </button>
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">
                    I confirm that the information provided is accurate and I agree to the <span className="text-blue-900 font-bold">Terms & Conditions</span>.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <GradientButton
                  onClick={nextStep}
                  disabled={!formData.agreedToTerms}
                  className="w-full h-16 rounded-[1.5rem]"
                >
                  COMPLETE REGISTRATION <Sparkles className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10"
            >
              <div className="w-32 h-32 bg-amber-600 rounded-full flex items-center justify-center shadow-xl">
                <CheckCircle2 className="w-16 h-16 text-white" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-blue-950 font-serif mb-3">Registration Successful!</h2>
                <p className="text-slate-400 font-medium text-lg">Your spiritual profile is ready.</p>
              </div>
              <GradientButton onClick={() => navigate("/dashboard")} className="w-full max-w-xs h-16 rounded-[1.5rem]">
                ENTER SANCTUARY <ArrowRight className="ml-2 w-5 h-5" />
              </GradientButton>
            </motion.div>
          )}
        </AnimatePresence>

        {step > 1 && step < 4 && (
          <button onClick={prevStep} className="mt-10 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300">
            <ChevronLeft className="w-4 h-4" /> Go Back
          </button>
        )}
      </div>
    </AuthBackground>
  );
}
