/**
 * UserVerifyIdentity.tsx
 *
 * OTP verification page — currently a UI placeholder.
 * In the updated auth flow, registration completes in UserRegister.tsx,
 * so this page is not part of the main registration path.
 * It is preserved here for future real SMS OTP integration via Firebase Phone Auth.
 *
 * For now, "Verify Code" skips ahead to the language selection.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { Fingerprint, ChevronLeft, RotateCcw } from "lucide-react";

const OTP_RESEND_SECONDS = 59;

export default function UserVerifyIdentity() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [countdown, setCountdown] = useState(OTP_RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((c) => c - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // Only allow single digit
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-advance to next input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = () => {
    const code = otp.join("");
    if (code.length < 4) return;
    setIsLoading(true);
    // TODO: Replace with real Firebase Phone Auth verifyCode() call
    setTimeout(() => {
      setIsLoading(false);
      navigate("/auth/language");
    }, 1000);
  };

  const handleResend = () => {
    if (!canResend) return;
    setOtp(["", "", "", ""]);
    setCountdown(OTP_RESEND_SECONDS);
    setCanResend(false);
    inputRefs.current[0]?.focus();
    // TODO: Replace with real Firebase Phone Auth resendOtp() call
    console.log("🔄 [VerifyIdentity] Resending OTP...");
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col px-6 pt-10 pb-12 z-10 w-full max-w-lg mx-auto items-center">
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
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-14 h-14 bg-blue-50/50 backdrop-blur-sm rounded-full flex items-center justify-center mb-8 shadow-sm border border-white/40"
        >
          <Fingerprint className="w-7 h-7 text-blue-900" strokeWidth={1.5} />
        </motion.div>

        <div className="text-center mb-10">
          <h1 className="text-xl sm:text-2xl font-black text-blue-950 font-serif mb-2 tracking-tight uppercase italic bg-clip-text text-transparent bg-gradient-to-b from-blue-950 via-blue-900 to-[#133E7C]">Verify Identity</h1>
          <p className="text-slate-400 text-xs sm:text-sm font-medium px-4 leading-relaxed max-w-[280px] mx-auto">
            We've sent a 4-digit code to your mobile number. Please enter it below.
          </p>
        </div>

        {/* OTP Input Grid */}
        <div className="flex justify-center gap-3 mb-10">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              aria-label={`OTP digit ${i + 1}`}
              className="w-12 h-14 bg-white/60 backdrop-blur-md border border-slate-100 rounded-xl text-center text-xl font-black text-blue-950 focus:border-amber-500 outline-none transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              disabled={isLoading}
            />
          ))}
        </div>

        <div className="w-full max-w-[18rem] space-y-5">
          <GradientButton 
            onClick={handleVerify} 
            isLoading={isLoading}
            disabled={!isComplete || isLoading}
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
          >
            <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Verify Code</span>
          </GradientButton>
          
          <div className="text-center">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="flex items-center gap-1.5 mx-auto text-[9px] font-black uppercase tracking-[0.4em] text-blue-900/70 hover:text-blue-900 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Resend Code
              </button>
            ) : (
              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-900/30">
                Resend in 0:{String(countdown).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mt-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-blue-900 transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Go Back
        </button>
      </div>
    </AuthBackground>
  );
}
