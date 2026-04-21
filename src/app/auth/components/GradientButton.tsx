import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "amber-primary";
  children?: React.ReactNode;
  isPill?: boolean;
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ variant = "primary", children, className, isPill = false, ...props }, ref) => {
    
    // Premium Color System
    const variants = {
      primary: "bg-gradient-to-r from-[#1E3A8A] via-[#1D4ED8] to-[#1E3A8A] text-white shadow-[0_10px_25px_rgba(30,58,138,0.2)] border border-white/10",
      "amber-primary": "bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white shadow-[0_10px_25px_rgba(245,158,11,0.2)] border border-white/20",
      secondary: "bg-gradient-to-r from-[#144c8a] to-[#F59E0B] text-white shadow-[0_4px_15px_rgba(20,76,138,0.2)] border border-white/10",
      outline: "border-2 border-[#1E3A8A]/30 text-[#1E3A8A] bg-white/5 backdrop-blur-md hover:bg-[#1E3A8A]/5 transition-colors",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02, boxShadow: "0 15px 35px rgba(30,58,138,0.2)" }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "relative h-15 font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 flex items-center justify-center gap-2 px-10 overflow-hidden group",
          isPill ? "rounded-full" : "rounded-2xl",
          variants[variant],
          className
        )}
        {...props}
      >
        {/* ✨ Inner Shine Effect */}
        {variant !== "outline" && (
          <motion.div 
            initial={{ x: "-100%" }}
            whileHover={{ x: "100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
          />
        )}
        
        {/* Glow Element */}
        <div className="absolute inset-0 bg-amber-400 opacity-0 group-hover:opacity-10 transition-opacity blur-xl rounded-full" />

        <span className="relative z-10 flex items-center gap-2 drop-shadow-sm">
          {children}
        </span>
        
        {/* Inner Shadow for Depth */}
        {variant !== "outline" && (
          <div className="absolute inset-[1px] rounded-2xl border-t border-white/20 pointer-events-none opacity-50" />
        )}
      </motion.button>
    );
  }
);

GradientButton.displayName = "GradientButton";
