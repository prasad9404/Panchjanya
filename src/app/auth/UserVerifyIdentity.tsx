import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthBackground } from "./components/AuthBackground";
import { GradientButton } from "./components/GradientButton";
import { Fingerprint, ChevronLeft } from "lucide-react";

export default function UserVerifyIdentity() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleVerify = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate("/auth/language");
    }, 1500);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 3) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  return (
    <AuthBackground showMandala={true}>
      <div className="flex-1 flex flex-col px-6 pt-10 pb-12 z-10 w-full max-w-lg mx-auto items-center">
        {/* ⚛️ Logo Container - Standard Circular Version */}
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

        <div className="flex justify-center gap-3 mb-10">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              className="w-12 h-14 bg-white/60 backdrop-blur-md border border-slate-100 rounded-xl text-center text-xl font-black text-blue-950 focus:border-amber-500 outline-none transition-all shadow-[0_4px_12px_rgba(0,0,0,0.02)]"
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Backspace" && !otp[i] && i > 0) {
                  document.getElementById(`otp-${i - 1}`)?.focus();
                }
              }}
            />
          ))}
        </div>

        <div className="w-full max-w-[18rem] space-y-5">
          <GradientButton 
            onClick={handleVerify} 
            isLoading={isLoading} 
            className="w-full h-12 sm:h-14 bg-gradient-to-r from-blue-950 to-[#133E7C] shadow-[0_8px_20px_rgba(19,62,124,0.15)] rounded-[1.2rem]"
          >
            <span className="font-bold text-[12px] sm:text-[13px] tracking-[0.15em] uppercase text-white">Verify Code</span>
          </GradientButton>
          
          <div className="text-center">
            <button className="text-[9px] font-black uppercase tracking-[0.4em] text-blue-900/40 hover:text-blue-900 transition-colors">
              Resend Code in 0:59
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.4em] text-slate-300 hover:text-blue-900 transition-all"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Go Back
        </button>
      </div>
    </AuthBackground>
  );
}
