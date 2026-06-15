import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { AuthInputField } from "./components/AuthInputField";
import { Phone, ChevronLeft, CheckCircle2, AlertCircle, Mail } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { isValidMobile } from "@/auth/userService";

type Stage = "input" | "sent";

export default function UserRecover() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();

  const [stage, setStage] = useState<Stage>("input");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mobile) {
      setError("Mobile number is required.");
      return;
    }
    if (!isValidMobile(mobile)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword(mobile);
      setStage("sent");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link. Please try again.";
      setError(message);
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

        <AnimatePresence mode="wait">
          {/* ─── INPUT STAGE ───────────────────────────────────────────── */}
          {stage === "input" && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full flex flex-col items-center"
            >
              {/* Heading */}
              <div className="text-center mb-10">
                <h1 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
                  Recover Account
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm font-medium tracking-wide max-w-[240px] mx-auto leading-relaxed">
                  Enter your registered mobile number to receive a password reset link.
                </p>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="w-full max-w-[20rem] mb-4 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-semibold text-red-700 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Form */}
              <form onSubmit={handleSubmit} className="w-full max-w-[20rem] space-y-6" noValidate>
                <AuthInputField
                  topLabel="Mobile Number"
                  label="+91 XXXXX XXXXX"
                  icon={<Phone />}
                  type="tel"
                  inputMode="numeric"
                  value={mobile}
                  onChange={(e) => {
                    setMobile(e.target.value);
                    if (error) setError("");
                  }}
                  error={""}
                  autoComplete="tel"
                  disabled={isLoading}
                />

                <GradientButton
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] hover:opacity-90 shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
                  variant="primary"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">
                      Send Reset Link
                    </span>
                  )}
                </GradientButton>
              </form>
            </motion.div>
          )}

          {/* ─── SENT STAGE ────────────────────────────────────────────── */}
          {stage === "sent" && (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center text-center space-y-6 w-full"
            >
              {/* Success icon */}
              <div className="relative">
                <div className="absolute inset-[-20px] bg-amber-400/20 blur-3xl rounded-full animate-pulse" />
                <div className="w-20 h-20 bg-gradient-to-tr from-amber-600 to-amber-400 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(217,119,6,0.25)] relative z-10">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Mail className="w-9 h-9 text-white" strokeWidth={2} />
                  </motion.div>
                </div>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">
                  Link Sent!
                </h2>
                <p className="text-slate-400 text-sm font-medium max-w-[240px] mx-auto leading-relaxed">
                  A password reset link has been sent. Please check and follow the instructions.
                </p>
              </div>

              <div className="w-full max-w-[20rem] space-y-3">
                <GradientButton
                  onClick={() => navigate("/auth/login", { replace: true })}
                  className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
                >
                  <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">
                    Back to Login
                  </span>
                </GradientButton>

                <button
                  type="button"
                  onClick={() => { setStage("input"); setMobile(""); }}
                  className="w-full text-[10px] font-black uppercase tracking-widest text-blue-900/40 hover:text-blue-900 transition-colors py-2"
                >
                  Try a different number
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back navigation (only on input stage) */}
        {stage === "input" && (
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            className="mt-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-blue-900 transition-all"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        )}

      </div>
    </AuthBackground>
  );
}
