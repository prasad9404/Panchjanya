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
  const [step, setStep] = useState<OnboardingStep>(1);
  const [isLoading, setIsLoading] = useState(false);

  // Inline OTP State
  const [showMobileOtp, setShowMobileOtp] = useState(false);
  const [mobileOtp, setMobileOtp] = useState(["", "", "", ""]);
  const [isVerifyingMobile, setIsVerifyingMobile] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Registration
    fullName: "",
    email: "",
    password: "",
    // Step 2: OTP
    otp: ["", "", "", ""],
    // Step 3: Profile
    firstName: "",
    surname: "",
    gender: "",
    age: "",
    state: "",
    district: "",
    taluka: "",
    city: "",
    mobileNumber: "",
    whatsappNumber: "",
    isWhatsappSameAsMobile: false,
    language: "mr",
    mobileVerified: false,
    emailVerified: false,
    // Step 4 & 5: Community & Status
    status: "" as "Naam Dharak" | "Vasnik" | "Bhikshuk" | "",
    // Step 6: Dynamic Details
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
    // Step 7: Consent
    selfie: null as string | null,
    agreedToTerms: false
  });

  const nextStep = () => setStep((p) => Math.min(p + 1, 9) as OnboardingStep);
  const prevStep = () => setStep((p) => Math.max(p - 1, 1) as OnboardingStep);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      nextStep();
    }, 1000);
  };

  const handleOTPVerify = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      nextStep();
    }, 1000);
  };

  const handleMobileOtpChange = (index: number, value: string) => {
    const newOtp = [...mobileOtp];
    newOtp[index] = value;
    setMobileOtp(newOtp);
    
    if (value && document.getElementById(`mob-otp-${index + 1}`)) {
      document.getElementById(`mob-otp-${index + 1}`)?.focus();
    }
    
    if (index === 3 && value) {
      setIsVerifyingMobile(true);
      setTimeout(() => {
        setIsVerifyingMobile(false);
        setFormData(prev => ({ ...prev, mobileVerified: true }));
        setShowMobileOtp(false);
        nextStep(); // Auto-proceed immediately after OTP is verified
      }, 1000);
    }
  };

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col z-10 w-full max-w-xl mx-auto px-6 pt-12 pb-20 overflow-y-auto no-scrollbar">

        {/* 📊 Progress Indicator */}
        {step < 9 && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em]">
                Sacred Initiation — Step {step} of 8
              </span>
              <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">
                {Math.round((step / 8) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full bg-blue-900/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(step / 8) * 100}%` }}
                className="h-full bg-gradient-to-r from-blue-900 to-blue-700 rounded-full"
              />
            </div>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Create Account</h2>
                <p className="text-slate-400 font-medium">Join our community to begin your spiritual journey</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-6">
                <AuthInputField
                  topLabel="Full Name"
                  label="Enter your legal name"
                  icon={<User />}
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                />
                <AuthInputField
                  topLabel="Email"
                  label="name@heritage.com"
                  icon={<Mail />}
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <AuthInputField
                  topLabel="Password"
                  label="••••••••"
                  type="password"
                  icon={<Lock />}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                />
                <div className="pt-4">
                  <GradientButton type="submit" isLoading={isLoading} className="w-full h-16">
                    Register <ChevronRight className="ml-2 w-5 h-5" />
                  </GradientButton>
                </div>
              </form>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 text-center"
            >
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Fingerprint className="w-10 h-10 text-blue-900" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Verify Identity</h2>
                <p className="text-slate-400 font-medium px-8">We've sent a code to your registered contact. Please enter it below.</p>
              </div>

              <div className="flex justify-center gap-4 mt-10">
                {formData.otp.map((digit, i) => (
                  <input
                    key={i}
                    type="text"
                    maxLength={1}
                    className="w-14 h-16 bg-white border-2 border-slate-100 rounded-2xl text-center text-2xl font-black text-blue-950 focus:border-amber-400 outline-none transition-all shadow-sm"
                    value={digit}
                    onChange={(e) => {
                      const newOtp = [...formData.otp];
                      newOtp[i] = e.target.value;
                      setFormData({ ...formData, otp: newOtp });
                      if (e.target.value && e.target.nextSibling) {
                        (e.target.nextSibling as HTMLInputElement).focus();
                      }
                    }}
                  />
                ))}
              </div>

              <div className="pt-10">
                <GradientButton onClick={handleOTPVerify} isLoading={isLoading} className="w-full h-16">
                  Verify Code
                </GradientButton>
                <button className="mt-8 text-[10px] font-black uppercase tracking-widest text-blue-900/60 hover:text-blue-900">
                  Resend Code in 0:59
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-10"
            >
              <div className="text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Heart className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Choose Language</h2>
                <p className="text-slate-400 font-medium">Select your preferred language for the journey</p>
              </div>

              <div className="space-y-4">
                {[
                  { id: "mr", label: "मराठी", sub: "Marathi" },
                  { id: "hi", label: "हिन्दी", sub: "Hindi" },
                  { id: "en", label: "English", sub: "English" }
                ].map(lang => (
                  <button
                    key={lang.id}
                    onClick={() => setFormData({ ...formData, language: lang.id })}
                    className={cn(
                      "w-full p-6 rounded-3xl border-2 flex items-center justify-between group transition-all duration-500",
                      formData.language === lang.id
                        ? "border-amber-400 bg-amber-50 shadow-md scale-[1.02]"
                        : "border-slate-50 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className={cn(
                        "text-xl font-black transition-colors",
                        formData.language === lang.id ? "text-blue-950" : "text-slate-400 group-hover:text-blue-900"
                      )}>{lang.label}</span>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">{lang.sub}</span>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                      formData.language === lang.id ? "border-amber-400 bg-amber-400 text-white rotate-[360deg]" : "border-slate-100 text-transparent"
                    )}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} className="w-full h-16">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2 text-center">Complete Profile</h2>
                <p className="text-slate-400 font-medium text-center">Tell us more about yourself</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AuthInputField
                  topLabel="First Name"
                  label="Siddharth"
                  value={formData.firstName}
                  onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                />
                <AuthInputField
                  topLabel="Surname"
                  label="Sharma"
                  value={formData.surname}
                  onChange={e => setFormData({ ...formData, surname: e.target.value })}
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest ml-4">Gender</label>
                <div className="flex gap-4">
                  {["Male", "Female", "Other"].map(g => (
                    <button
                      key={g}
                      onClick={() => setFormData({ ...formData, gender: g })}
                      className={cn(
                        "flex-1 h-12 rounded-xl border-2 font-bold text-sm transition-all",
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
                  topLabel="Age"
                  label="25"
                  type="number"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                />
                <AuthInputField
                  topLabel="State"
                  label="Maharashtra"
                  icon={<MapPin className="w-4 h-4" />}
                  value={formData.state}
                  onChange={e => setFormData({ ...formData, state: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <AuthInputField
                  topLabel="District"
                  label="Auraungabad"
                  value={formData.district}
                  onChange={e => setFormData({ ...formData, district: e.target.value })}
                />
                <AuthInputField
                  topLabel="City"
                  label="Paithan"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                />
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <AuthInputField
                      topLabel="Mobile Number"
                      label="+91 - XXXXXXXXXX"
                      type="tel"
                      value={formData.mobileNumber}
                      disabled={formData.mobileVerified}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          mobileNumber: val,
                          whatsappNumber: prev.isWhatsappSameAsMobile ? val : prev.whatsappNumber
                        }));
                      }}
                      rightElement={
                        formData.mobileVerified ? (
                          <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </div>
                        ) : formData.mobileNumber.length >= 10 && !showMobileOtp ? (
                          <button
                            onClick={() => setShowMobileOtp(true)}
                            className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-amber-600 underline decoration-blue-600/30 hover:decoration-amber-600 transition-colors"
                          >
                            Verify Now
                          </button>
                        ) : null
                      }
                    />

                    {/* Inline OTP Block */}
                    <AnimatePresence>
                      {showMobileOtp && !formData.mobileVerified && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-3">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                              <label className="text-[10px] font-black uppercase tracking-widest text-amber-900/60">Enter OTP</label>
                              <span className="text-[10px] font-bold text-amber-600/60 truncate" title={`Sent to ${formData.mobileNumber}`}>Sent to {formData.mobileNumber}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                              {mobileOtp.map((digit, i) => (
                                <input
                                  key={i}
                                  id={`mob-otp-${i}`}
                                  type="text"
                                  maxLength={1}
                                  className={cn(
                                    "w-full min-w-0 h-12 bg-white border border-amber-200/60 rounded-xl text-center text-lg font-black text-amber-950 focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.15)] outline-none transition-all",
                                    isVerifyingMobile && "opacity-50 pointer-events-none"
                                  )}
                                  value={digit}
                                  onChange={(e) => handleMobileOtpChange(i, e.target.value)}
                                />
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="space-y-2">
                    <AuthInputField
                      topLabel="Whatsapp Number"
                      label="+91 - XXXXXXXXXX"
                      type="tel"
                      disabled={formData.isWhatsappSameAsMobile}
                      value={formData.isWhatsappSameAsMobile ? formData.mobileNumber : formData.whatsappNumber}
                      onChange={e => setFormData({ ...formData, whatsappNumber: e.target.value })}
                    />
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => {
                          const nextSame = !formData.isWhatsappSameAsMobile;
                          setFormData(prev => ({
                            ...prev,
                            isWhatsappSameAsMobile: nextSame,
                            whatsappNumber: nextSame ? prev.mobileNumber : prev.whatsappNumber
                          }));
                        }}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-all",
                          formData.isWhatsappSameAsMobile ? "bg-blue-900 border-blue-900 text-white" : "border-slate-200 bg-white"
                        )}
                      >
                        {formData.isWhatsappSameAsMobile && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Same as above</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} className="w-full h-16">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-4">Welcome to Panchajanya</h2>
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 text-left">
                  <p className="text-sm text-blue-900/70 leading-relaxed font-medium">
                    This app is specially made for the followers of the Mahanubhav Panth only. To confirm your participation, please provide the following spiritual details to enable us to serve the level of information according to your knowledge of Bramhavidhya. Please cooprate us to answer a Small Quiz. We appreciate your support. Thanking you !
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} className="w-full h-16">
                  Continue <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 6 && (
            <motion.div
              key="step6"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2 italic tracking-tight">Select Your Spiritual Status</h2>
              </div>

              <div className="space-y-4">
                {["Naam Dharak", "Vasnik", "Bhikshuk"].map(status => (
                  <button
                    key={status}
                    onClick={() => setFormData({ ...formData, status: status as any })}
                    className={cn(
                      "w-full p-6 rounded-3xl border-2 flex items-center justify-between group transition-all duration-500 hover:-translate-y-1",
                      formData.status === status
                        ? "border-accent bg-accent/5 shadow-[0_15px_30px_rgba(245,158,11,0.15)]"
                        : "border-slate-50 bg-white hover:border-amber-200 hover:shadow-[0_10px_25px_rgba(245,158,11,0.08)]"
                    )}
                  >
                    <div className="flex flex-col items-start text-left">
                      <span className={cn(
                        "text-lg font-black font-serif transition-colors",
                        formData.status === status ? "text-blue-950" : "text-slate-400 group-hover:text-blue-900"
                      )}>{status}</span>
                    </div>
                    <div className={cn(
                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500",
                      formData.status === status ? "border-accent bg-accent text-white rotate-[360deg]" : "border-slate-100 text-transparent"
                    )}>
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  </button>
                ))}
              </div>

              <div className="pt-6">
                <GradientButton onClick={nextStep} disabled={!formData.status} className="w-full h-16">
                  Next Step <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 7 && (
            <motion.div
              key="step7"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Spiritual Details</h2>
                <p className="text-slate-400 font-medium">As a {formData.status}</p>
              </div>

              {(formData.status === "Naam Dharak" || formData.status === "Vasnik") && (
                <div className="space-y-6">
                  {/* Common Guruvarya Section for Naam Dharak & Vasnik */}
                  <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm">
                    <h3 className="text-blue-950 font-serif font-black text-lg uppercase tracking-widest text-center border-b border-slate-50 pb-4">Respected Guruvarya</h3>

                    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl">
                      <span className="font-bold text-sm text-blue-950">Taken Naam Mantra?</span>
                      <button
                        onClick={() => setFormData({ ...formData, naamMantra: !formData.naamMantra })}
                        className={cn("w-12 h-7 rounded-full p-1 transition-all", formData.naamMantra ? "bg-accent" : "bg-slate-200")}
                      >
                        <div className={cn("w-5 h-5 rounded-full bg-white transition-all shadow-sm", formData.naamMantra ? "ml-5" : "ml-0")} />
                      </button>
                    </div>

                    <AuthInputField topLabel="In Which Year?" label="Year" type="number" value={formData.guruvaryaYear} onChange={e => setFormData({ ...formData, guruvaryaYear: e.target.value })} />

                    <AuthInputField topLabel="Respected Guruvarya Name" label="P. Pu. ..." value={formData.guruvaryaName} onChange={e => setFormData({ ...formData, guruvaryaName: e.target.value })} />

                    <div className="space-y-2 pt-2 border-t border-slate-50">
                      <label className="text-[10px] font-black uppercase text-blue-900/40 ml-4 tracking-[0.2em]">Place Details</label>
                      <textarea
                        className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-24 text-sm text-blue-950 placeholder:text-slate-300 transition-all outline-none focus:bg-white focus:border-accent"
                        placeholder="Ashram, City/Village, Taluka, District, State"
                        value={formData.guruvaryaPlace}
                        onChange={e => setFormData({ ...formData, guruvaryaPlace: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Vasnik Specific: Vidya Guruvarya */}
                  {formData.status === "Vasnik" && (
                    <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm">
                      <h3 className="text-blue-950 font-serif font-black text-lg uppercase tracking-widest text-center border-b border-slate-50 pb-4">Vidya Guruvarya</h3>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-900/40 ml-4 tracking-widest">KNOWLEDGE OF BRAMHAVIDYA</label>
                        <textarea
                          className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-24 text-sm text-blue-950 placeholder:text-slate-300 transition-all outline-none focus:bg-white focus:border-accent"
                          placeholder="Briefly describe your studies ..."
                          value={formData.vidyaKnowledge}
                          onChange={e => setFormData({ ...formData, vidyaKnowledge: e.target.value })}
                        />
                      </div>

                      <AuthInputField topLabel="RESPECTED VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-blue-900/40 ml-4 tracking-[0.2em]">PLACE</label>
                        <textarea
                          className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-24 text-sm text-blue-950 placeholder:text-slate-300 transition-all outline-none focus:bg-white focus:border-accent"
                          placeholder="Ashram, City/Village, Taluka, District, State"
                          value={formData.vidyaGuruvaryaPlace}
                          onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })}
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-blue-900/40 uppercase tracking-widest ml-4">Studied Since?</label>
                        <div className="flex gap-4">
                          {["Observable", "Online"].map(mode => (
                            <button
                              key={mode}
                              onClick={() => setFormData({ ...formData, vidyaStudiedMode: mode as any })}
                              className={cn(
                                "flex-1 h-12 rounded-xl border-2 font-bold text-sm transition-all",
                                formData.vidyaStudiedMode === mode ? "border-accent bg-accent/5 text-blue-950" : "border-slate-100 bg-slate-50 text-slate-500"
                              )}
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {formData.status === "Bhikshuk" && (
                <div className="space-y-8">
                  {/* Diksha Guruvarya */}
                  <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm">
                    <h3 className="text-blue-950 font-serif font-black text-lg uppercase tracking-widest text-center border-b border-slate-50 pb-4">Diksha Guruvarya</h3>

                    <AuthInputField topLabel="Diksha taken in Year?" label="Year" type="number" value={formData.dikshaGuruvaryaYear} onChange={e => setFormData({ ...formData, dikshaGuruvaryaYear: e.target.value })} />

                    <AuthInputField topLabel="RESPECTED DIKSHA GURUVARYA NAME" label="P. Pu. ..." value={formData.dikshaGuruvaryaName} onChange={e => setFormData({ ...formData, dikshaGuruvaryaName: e.target.value })} />

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-blue-900/40 ml-4 tracking-[0.2em]">PLACE</label>
                      <textarea
                        className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-24 text-sm text-blue-950 placeholder:text-slate-300 transition-all outline-none focus:bg-white focus:border-accent"
                        placeholder="Ashram, City/Village, Taluka, District, State"
                        value={formData.dikshaGuruvaryaPlace}
                        onChange={e => setFormData({ ...formData, dikshaGuruvaryaPlace: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Vidya Guruvarya */}
                  <div className="p-6 bg-white border border-slate-100 rounded-[2.5rem] space-y-6 shadow-sm">
                    <h3 className="text-blue-950 font-serif font-black text-lg uppercase tracking-widest text-center border-b border-slate-50 pb-4">Vidya Guruvarya</h3>

                    <AuthInputField topLabel="RESPECTED VIDYA GURUVARYA NAME" label="P. Pu. ..." value={formData.vidyaGuruvaryaName} onChange={e => setFormData({ ...formData, vidyaGuruvaryaName: e.target.value })} />

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-blue-900/40 ml-4 tracking-[0.2em]">PLACE</label>
                      <textarea
                        className="w-full p-5 bg-slate-50/50 border border-slate-100 rounded-3xl min-h-24 text-sm text-blue-950 placeholder:text-slate-300 transition-all outline-none focus:bg-white focus:border-accent"
                        placeholder="Ashram, City/Village, Taluka, District, State"
                        value={formData.vidyaGuruvaryaPlace}
                        onChange={e => setFormData({ ...formData, vidyaGuruvaryaPlace: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}


              <div className="pt-6">
                <GradientButton onClick={nextStep} className="w-full h-16">
                  Verify Details <ChevronRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 8 && (
            <motion.div
              key="step8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2 className="text-3xl font-black text-blue-950 font-serif mb-2">Final Verification</h2>
                <p className="text-slate-400 font-medium">Capture a photo for your spiritual profile</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-48 h-48 rounded-[3rem] border-4 border-dashed border-slate-200 bg-white flex items-center justify-center relative overflow-hidden group hover:border-accent transition-all cursor-pointer">
                  {formData.selfie ? (
                    <img src={formData.selfie} alt="Selfie" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-12 h-12 text-slate-300 group-hover:text-accent transition-all" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase text-slate-400 mt-4 tracking-widest">Upload or Capture Image</span>
              </div>

              <div className="p-6 bg-white/50 border border-slate-100 rounded-3xl space-y-4">
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
                    I hereby confirm that the information provided is accurate and I agree to the <span className="text-blue-900 font-bold">Terms & Conditions</span> and <span className="text-blue-900 font-bold">Privacy Policy</span>.
                  </p>
                </div>
              </div>

              <div className="pt-6">
                <GradientButton
                  onClick={() => {
                    setIsLoading(true);
                    setTimeout(() => {
                      setIsLoading(false);
                      nextStep();
                    }, 2000);
                  }}
                  disabled={!formData.agreedToTerms}
                  isLoading={isLoading}
                  className="w-full h-16 font-kokila"
                >
                  Complete Registration <Sparkles className="ml-2 w-5 h-5 fill-white/20" />
                </GradientButton>
              </div>
            </motion.div>
          )}

          {step === 9 && (
            <motion.div
              key="step9"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center space-y-8 py-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-48 h-48 rounded-full border-2 border-dashed border-accent/30 flex items-center justify-center relative"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 100 }}
                  className="w-32 h-32 bg-accent rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.3)]"
                >
                  <CheckCircle2 className="w-16 h-16 text-white" />
                </motion.div>
              </motion.div>

              <div>
                <h2 className="text-4xl font-black text-blue-950 font-serif mb-3 italic">Initiation Successful</h2>
                <p className="text-slate-400 font-medium text-lg">Welcome to the Panchajanya community</p>
              </div>

              <div className="w-full max-w-xs pt-10">
                <GradientButton onClick={() => navigate("/dashboard")} className="w-full h-16">
                  Go to Homepage <ArrowRight className="ml-2 w-5 h-5" />
                </GradientButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🔙 Back Button for Early Steps */}
        {step > 1 && step < 9 && (
          <button
            onClick={prevStep}
            className="mt-10 mx-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-900 transition-all font-serif"
          >
            <ChevronLeft className="w-4 h-4" /> Go Back
          </button>
        )}
      </div>
    </AuthBackground>
  );
}
