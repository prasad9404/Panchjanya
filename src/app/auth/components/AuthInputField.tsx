import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: React.ReactNode;
  error?: string;
  rightElement?: React.ReactNode;
}

export const AuthInputField: React.FC<AuthInputFieldProps> = ({
  label,
  icon,
  error,
  rightElement,
  className,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="space-y-1.5 w-full relative group">
      <motion.div
        animate={isFocused ? { scale: 1.01 } : { scale: 1 }}
        className={cn(
          "relative transition-all duration-500 rounded-2xl border bg-white/40 backdrop-blur-xl overflow-hidden",
          isFocused 
            ? "border-blue-500/50 shadow-[0_4px_20px_rgba(30,58,138,0.08)] bg-white/80" 
            : "border-slate-200/60 hover:border-slate-300 hover:bg-white/60",
          error ? "border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]" : ""
        )}
      >
        {/* ✨ Light Reflective Edge */}
        <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-900/5 to-transparent pointer-events-none" />
        
        {/* Left Icon (Amber focus) */}
        <div className={cn(
          "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-500",
          isFocused ? "text-amber-500 scale-110 drop-shadow-[0_2px_4px_rgba(245,158,11,0.2)]" : "text-slate-400"
        )}>
          {React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5 sm:w-6 sm:h-6" })}
        </div>

        {/* Input */}
        <input
          {...props}
          value={value}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          className={cn(
            "w-full h-16 pl-16 pr-12 text-blue-950 font-semibold bg-transparent outline-none transition-all placeholder:text-transparent pt-4 pb-1",
            className
          )}
          placeholder={label}
        />

        {/* Floating Label (Royal Heirarchy) */}
        <label
          className={cn(
            "absolute left-14 top-1/2 -translate-y-1/2 text-slate-400 transition-all pointer-events-none duration-500 tracking-wide",
            (isFocused || hasValue) 
              ? "text-[10px] top-4 uppercase font-black tracking-widest text-blue-900/60" 
              : "text-base font-medium"
          )}
        >
          {label}
        </label>

        {/* Right Element (eye toggle, etc) */}
        {rightElement && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center transition-opacity duration-300">
            {rightElement}
          </div>
        )}

        {/* Subtle Shine Bottom on Focus */}
        {isFocused && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-blue-900/20 to-transparent"
          />
        )}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest ml-4"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
