import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import {
  User, Lock, ArrowRight,
  MapPin, Phone, AlertCircle, Eye, EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth, RegistrationData } from "@/auth/AuthContext";
import { isValidMobile, isStrongPassword } from "@/auth/userService";

export default function UserRegister() {
  const navigate = useNavigate();
  const { signUp, user, loading } = useAuth();

  const [isRegistering, setIsRegistering] = useState(false);

  // Guard: already logged in → go to dashboard
  useEffect(() => {
    if (!loading && user && !isRegistering) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate, isRegistering]);

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [globalError, setGlobalError] = useState("");

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: "",
    lastName: "",
    gender: "",
    state: "",
    district: "",
    taluka: "",
    city: "",
    whatsapp: "",
    mobile: "",
    age: "",
    password: "",
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const update = (field: keyof RegistrationData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (globalError) setGlobalError("");
  };

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Required";
    if (!formData.lastName.trim()) newErrors.lastName = "Required";

    const mobileDigits = formData.mobile.replace(/[\s\-+]/g, "").replace(/^91/, "");
    if (!formData.mobile) {
      newErrors.mobile = "Required";
    } else if (!isValidMobile(formData.mobile)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }

    if (!formData.password) {
      newErrors.password = "Required";
    } else {
      const check = isStrongPassword(formData.password);
      if (!check.valid) newErrors.password = check.message;
    }

    if (formData.password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setIsLoading(true);
    setIsRegistering(true);
    try {
      await signUp(formData);
      // Registration + Firestore profile creation succeeded.
      // Navigate to language selection → then onboarding.
      navigate("/auth/language", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
      setGlobalError(message);
      console.error("❌ [UserRegister] Registration failed:", error);
      setIsRegistering(false); // only reset on failure, success navigates away
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthBackground showMandala={true}>

      <div className="flex-1 flex flex-col px-6 pt-6 pb-12 z-10 w-full max-w-lg mx-auto items-center">
        {/* ⚛️ Logo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-52 h-52 sm:w-64 sm:h-64 mb-8 group flex items-center justify-center"
        >
          <div className="absolute inset-[-10px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-xl opacity-40" />
          <img
            src="/icons/Main logo.svg"
            alt="Logo"
            className="w-full h-full object-contain relative z-10 drop-shadow-md"
            style={{ mixBlendMode: 'multiply' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-7"
        >
          <h1 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
            Begin Your Journey
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
            Create your profile for a divine experience
          </p>
        </motion.div>

        {/* 🚨 Global Error Banner */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-[22rem] mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-red-700 leading-relaxed">{globalError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🥛 Registration Form */}
        <form onSubmit={handleRegister} className="w-full space-y-5 max-w-[22rem] pb-10" noValidate>
          {/* Name Row */}
          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="FIRST NAME"
              label="Siddharth"
              icon={<User />}
              value={formData.firstName}
              onChange={update("firstName")}
              error={errors.firstName}
              autoComplete="given-name"
              disabled={isLoading}
            />
            <AuthInputField
              topLabel="LAST NAME"
              label="Sharma"
              icon={<User />}
              value={formData.lastName}
              onChange={update("lastName")}
              error={errors.lastName}
              autoComplete="family-name"
              disabled={isLoading}
            />
          </div>

          {/* Gender + Age */}
          <div className="grid grid-cols-[1.2fr_0.8fr] gap-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/60">GENDER</label>
              </div>
              <div className="flex gap-2">
                {["Male", "Female"].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setFormData({ ...formData, gender: g })}
                    disabled={isLoading}
                    className={cn(
                      "flex-1 h-12 rounded-xl border font-bold text-xs transition-all duration-300",
                      formData.gender === g
                        ? "border-amber-500 bg-amber-50/50 text-amber-900 shadow-[0_2px_10px_rgba(245,158,11,0.1)]"
                        : "border-slate-200/60 bg-white text-slate-400 hover:border-slate-300"
                    )}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <AuthInputField
              topLabel="AGE"
              label="24"
              type="number"
              inputMode="numeric"
              value={formData.age}
              onChange={update("age")}
              error={errors.age}
              disabled={isLoading}
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="STATE"
              label="Maharashtra"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.state}
              onChange={update("state")}
              error={errors.state}
              disabled={isLoading}
            />
            <AuthInputField
              topLabel="DISTRICT"
              label="Sambhajinagar"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.district}
              onChange={update("district")}
              error={errors.district}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <AuthInputField
              topLabel="TALUKA"
              label="Paithan"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.taluka}
              onChange={update("taluka")}
              error={errors.taluka}
              disabled={isLoading}
            />
            <AuthInputField
              topLabel="CITY / VILLAGE"
              label="Paithan"
              icon={<MapPin className="w-4 h-4" />}
              value={formData.city}
              onChange={update("city")}
              error={errors.city}
              disabled={isLoading}
            />
          </div>

          {/* Contact */}
          <AuthInputField
            topLabel="WHATSAPP NUMBER"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            inputMode="numeric"
            value={formData.whatsapp}
            onChange={update("whatsapp")}
            error={errors.whatsapp}
            autoComplete="tel"
            disabled={isLoading}
          />

          <AuthInputField
            topLabel="MOBILE NUMBER *"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            inputMode="numeric"
            value={formData.mobile}
            onChange={update("mobile")}
            error={errors.mobile}
            autoComplete="tel"
            disabled={isLoading}
          />

          {/* Password */}
          <AuthInputField
            topLabel="CREATE PASSWORD *"
            label="Min. 8 chars, include a number"
            type={showPassword ? "text" : "password"}
            icon={
              <button
                type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                onClick={() => setShowPassword((v) => !v)}
                className="text-slate-300 hover:text-blue-900 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            value={formData.password}
            onChange={update("password")}
            error={errors.password}
            autoComplete="new-password"
            disabled={isLoading}
          />

          <AuthInputField
            topLabel="CONFIRM PASSWORD *"
            label="Re-enter password"
            type={showConfirmPassword ? "text" : "password"}
            icon={
              <button
                type="button"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="text-slate-300 hover:text-blue-900 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            error={errors.confirmPassword}
            autoComplete="new-password"
            disabled={isLoading}
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
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.12em] uppercase text-white">Create Account</span>
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
            type="button"
            onClick={() => navigate("/auth/login")}
            disabled={isLoading}
            className="flex items-center gap-1.5 mx-auto mt-2 text-primary font-black uppercase tracking-widest text-[11px] hover:underline underline-offset-4"
          >
            Back to Login <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AuthBackground>
  );
}
