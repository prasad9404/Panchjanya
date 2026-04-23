import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface AuthInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  topLabel?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  error?: string;
  rightElement?: React.ReactNode;
}

export const AuthInputField: React.FC<AuthInputFieldProps> = ({
  label,
  topLabel,
  icon,
  iconPosition = "right",
  error,
  rightElement,
  className,
  value,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value && value.toString().length > 0;

  return (
    <div className="space-y-2 w-full relative group">
      {topLabel && (
        <div className="flex justify-between items-center px-1">
          <label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/60 transition-colors group-focus-within:text-blue-900">
            {topLabel}
          </label>
          {rightElement && rightElement}
        </div>
      )}
      
      <motion.div
        animate={isFocused ? { scale: 1.005, borderColor: "rgba(30,58,138,0.2)" } : { scale: 1, borderColor: "rgba(203,213,225,0.6)" }}
        className={cn(
          "relative transition-all duration-300 rounded-xl border bg-white overflow-hidden",
          isFocused 
            ? "shadow-[0_4px_20px_rgba(30,58,138,0.04)]" 
            : "hover:border-slate-300",
          error ? "border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]" : ""
        )}
      >
        {/* Left Icon */}
        {icon && iconPosition === "left" && (
          <div className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 transition-all duration-300",
            isFocused ? "text-amber-500 scale-110" : "text-slate-300"
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" }) : icon}
          </div>
        )}

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
            "w-full h-14 px-5 text-blue-950 font-medium bg-transparent outline-none transition-all placeholder:text-slate-300 text-sm sm:text-base",
            iconPosition === "left" && "pl-12",
            iconPosition === "right" && "pr-12",
            className
          )}
          placeholder={label}
        />

        {/* Right Icon */}
        {icon && iconPosition === "right" && (
          <div className={cn(
            "absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300",
            isFocused ? "text-blue-900 scale-110" : "text-slate-300"
          )}>
            {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement, { className: "w-5 h-5" }) : icon}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-[10px] text-red-500 font-extrabold uppercase tracking-widest ml-1"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};
