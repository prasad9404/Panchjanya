import React from "react";
import { cn } from "@/shared/lib/utils";
import { motion } from "framer-motion";

interface AlphabetScrollerProps {
    activeLetter: string;
    onLetterClick: (letter: string) => void;
    availableLetters: Set<string>;
    variant?: 'vertical' | 'horizontal';
}

export const AlphabetScroller: React.FC<AlphabetScrollerProps> = ({
    activeLetter,
    onLetterClick,
    availableLetters,
    variant = 'vertical'
}) => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

    const renderLetter = (letter: string, isMobile: boolean) => {
        const isAvailable = availableLetters.has(letter);
        const isActive = activeLetter === letter;

        return (
            <button
                key={letter}
                onClick={() => isAvailable && onLetterClick(letter)}
                disabled={!isAvailable}
                aria-label={`Scroll to section ${letter}`}
                aria-disabled={!isAvailable}
                className={cn(
                    "relative font-sans font-bold text-center transition-all duration-200 select-none outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:rounded-md",
                    isMobile 
                        ? "px-3 py-1 text-xs rounded-xl shrink-0 border" 
                        : "w-6 h-5 text-[9px] flex items-center justify-center rounded-md",
                    isAvailable
                        ? isActive
                            ? "text-white font-extrabold z-10 scale-105"
                            : "text-blue-900 hover:text-blue-600 hover:scale-110 cursor-pointer"
                        : "text-slate-300 cursor-not-allowed opacity-30",
                    isMobile
                        ? isAvailable
                            ? isActive
                                ? "bg-blue-900 border-blue-900 shadow-sm"
                                : "bg-white hover:bg-slate-50 border-slate-200/80"
                            : "bg-slate-50/50 border-slate-100"
                        : ""
                )}
            >
                {isActive && !isMobile && (
                    <motion.div
                        layoutId="activeLetterBg"
                        className="absolute inset-0 bg-blue-900 rounded-md -z-10"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                )}
                <span>{letter}</span>
            </button>
        );
    };

    if (variant === 'horizontal') {
        return (
            <div className="flex items-center gap-2 p-2 overflow-x-auto scrollbar-hide bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/60 shadow-sm sticky top-0 z-30 select-none w-full">
                <div className="text-[8px] font-black uppercase text-blue-900/60 tracking-wider shrink-0 mr-1 pl-1 font-sans">A-Z</div>
                <div className="flex gap-1.5">
                    {alphabet.map((letter) => renderLetter(letter, true))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-0.5 p-1 bg-white/90 backdrop-blur-md rounded-[20px] border border-slate-200/60 shadow-xl shadow-blue-900/5 select-none w-8 z-20">
            <div className="text-[8px] font-black uppercase text-blue-900/40 tracking-wider mb-0.5 font-sans scale-90">A-Z</div>
            <div className="flex flex-col gap-px w-full">
                {alphabet.map((letter) => renderLetter(letter, false))}
            </div>
        </div>
    );
};

