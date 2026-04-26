import React from "react";
import { HTMLMotionProps, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "amber";
  children?: React.ReactNode;
  isPill?: boolean;
  isLoading?: boolean;
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ variant = "primary", children, className, isPill = false, isLoading = false, disabled, ...props }, ref) => {
    
    // Platform-Aligned Design System
    const variants = {
      primary: "bg-landing-primary text-white shadow-[0_12px_30px_rgba(14,74,129,0.15)] border-t border-white/10",
      amber: "bg-primary text-white shadow-[0_12px_30px_rgba(217,119,6,0.15)] border-t border-white/20",
      secondary: "bg-blue-900/5 text-blue-950 border border-slate-200/60 hover:bg-white hover:border-amber-600",
      outline: "border border-slate-200 bg-white text-blue-950 hover:bg-slate-50 shadow-sm",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={!(disabled || isLoading) ? { y: -2, scale: 1.01 } : {}}
        whileTap={!(disabled || isLoading) ? { scale: 0.98 } : {}}
        disabled={disabled || isLoading}
        className={cn(
          "relative h-15 font-black text-[11px] sm:text-xs uppercase tracking-[0.3em] transition-all duration-500 flex items-center justify-center gap-2 px-10 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed",
          isPill ? "rounded-full" : "rounded-2xl",
          variants[variant],
          className
        )}
        {...props}
      >
        {/* ✨ Senior Shimmer Effect */}
        {(variant === "primary" || variant === "amber") && !isLoading && (
          <motion.div 
            initial={{ left: "-100%" }}
            whileHover={{ left: "100%" }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-30deg] pointer-events-none"
          />
        )}
        
        <span className="relative z-10 flex items-center gap-2">
          {isLoading ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : children}
        </span>
        
        {/* Subtle Decorative Aura */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </motion.button>
    );
  }
);

GradientButton.displayName = "GradientButton";
