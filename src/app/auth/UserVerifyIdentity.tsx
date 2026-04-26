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
      <div className="flex-1 flex flex-col px-6 pt-12 pb-20 z-10 w-full max-w-xl mx-auto items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-10 shadow-sm"
        >
          <Fingerprint className="w-10 h-10 text-blue-900" />
        </motion.div>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-black text-blue-950 font-serif mb-3">Verify Identity</h1>
          <p className="text-slate-400 font-medium px-8 leading-relaxed">
            We've sent a 4-digit code to your mobile number. Please enter it below.
          </p>
        </div>

        <div className="flex justify-center gap-4 mb-12">
          {otp.map((digit, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              maxLength={1}
              className="w-14 h-16 bg-white border-2 border-slate-100 rounded-2xl text-center text-2xl font-black text-blue-950 focus:border-amber-600 outline-none transition-all shadow-sm"
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

        <div className="w-full max-w-md space-y-6">
          <GradientButton onClick={handleVerify} isLoading={isLoading} className="w-full h-16 rounded-[1.5rem]">
            VERIFY CODE
          </GradientButton>
          
          <div className="text-center">
            <button className="text-[10px] font-black uppercase tracking-widest text-blue-900/60 hover:text-blue-900 transition-colors">
              Resend Code in 0:59
            </button>
          </div>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="mt-auto flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-blue-900 transition-all font-serif"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </AuthBackground>
  );
}
