import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { Lock, Eye, EyeOff, Church, Phone, AlertCircle } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function UserLogin() {
  const navigate = useNavigate();
  const { signIn, user, loading } = useAuth();

  // Guard: already logged in → go to dashboard
  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ mobile: "", password: "" });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [globalError, setGlobalError] = useState("");

  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    const digits = formData.mobile.replace(/[\s\-+]/g, "").replace(/^91/, "");
    if (!formData.mobile) {
      newErrors.mobile = "Mobile number is required";
    } else if (!/^[6-9]\d{9}$/.test(digits)) {
      newErrors.mobile = "Enter a valid 10-digit mobile number";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError("");
    if (!validate()) return;

    setIsLoading(true);
    try {
      await signIn(formData.mobile, formData.password);

      // Restore the page the user originally wanted to visit (saved by PrivateRoute).
      // If no redirect intent saved, fall back to /dashboard.
      const intendedPath = sessionStorage.getItem("auth_redirect");
      sessionStorage.removeItem("auth_redirect");
      navigate(intendedPath || "/dashboard", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed. Please try again.";
      setGlobalError(message);
      console.error("❌ [UserLogin] Login failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthBackground showMandala={true}>

      <div className="flex-1 flex flex-col px-6 pt-8 pb-10 z-10 w-full max-w-lg mx-auto items-center">
        {/* ⚛️ Logo Container */}
        <motion.div
           initial={{ opacity: 0, scale: 0.9 }}
           animate={{ opacity: 1, scale: 1 }}
           className="relative w-52 h-52 sm:w-64 sm:h-64 mb-10 group flex items-center justify-center"
        >
           <div className="absolute inset-[-10px] bg-gradient-to-tr from-amber-400/30 via-amber-200/10 to-transparent rounded-full blur-xl opacity-40" />
           <img 
            src="/icons/Main logo.svg" 
            alt="Panchajanya Logo" 
            className="w-full h-full object-contain relative z-10 drop-shadow-md" 
            style={{ mixBlendMode: 'multiply' }}
           />
        </motion.div>

        {/* 📜 Branding */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-10"
        >
          <h1 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
            Login
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide max-w-[240px] mx-auto leading-relaxed">
            Welcome back to the sanctuary
          </p>
        </motion.div>

        {/* 🚨 Global Error Banner */}
        <AnimatePresence>
          {globalError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full max-w-[20rem] mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
            >
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-[11px] font-semibold text-red-700 leading-relaxed">{globalError}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🥛 Auth Form */}
        <form onSubmit={handleLogin} className="w-full space-y-6 max-w-[20rem]" noValidate>
          <AuthInputField
            topLabel="Mobile Number"
            label="+91 XXXXX XXXXX"
            icon={<Phone />}
            type="tel"
            inputMode="numeric"
            value={formData.mobile}
            onChange={(e) => {
              setFormData({ ...formData, mobile: e.target.value });
              if (errors.mobile) setErrors({ ...errors, mobile: "" });
              if (globalError) setGlobalError("");
            }}
            error={errors.mobile}
            autoComplete="tel"
            disabled={isLoading}
          />

          <AuthInputField
            topLabel="Password"
            label="••••••••"
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
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: "" });
              if (globalError) setGlobalError("");
            }}
            error={errors.password}
            autoComplete="current-password"
            disabled={isLoading}
            rightElement={
              <button 
                type="button" 
                className="text-[9px] font-black text-blue-900/40 hover:text-blue-900 transition-colors uppercase tracking-widest"
                onClick={() => navigate("/auth/recover")}
                tabIndex={-1}
              >
                Forgot?
              </button>
            }
          />

          <div className="pt-4">
            <GradientButton
              type="submit"
              disabled={isLoading}
              className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] hover:opacity-90 shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
              variant="primary"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Login</span>
                  <Church className="w-4 h-4 text-white" />
                </div>
              )}
            </GradientButton>
          </div>
        </form>

        {/* 🌸 Footer Link */}
        <div className="mt-8 py-4 text-center">
          <p className="text-slate-400 font-medium text-xs">
              New initiate?{" "}
              <button 
                onClick={() => navigate("/auth/register")}
                className="text-primary font-black uppercase tracking-widest hover:underline underline-offset-4 ml-1"
                disabled={isLoading}
              >
                Register
              </button>
          </p>
        </div>
      </div>
    </AuthBackground>
  );
}
