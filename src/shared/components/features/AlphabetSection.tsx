import React from "react";
import { motion } from "framer-motion";

interface AlphabetSectionProps {
    letter: string;
    children: React.ReactNode;
}

export const AlphabetSection: React.FC<AlphabetSectionProps> = ({ letter, children }) => {
    return (
        <motion.div 
            id={`section-${letter}`} 
            className="scroll-mt-16 md:scroll-mt-28 space-y-4"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45 }}
        >
            <div className="flex items-center gap-4 py-2 select-none">
                <span className="text-3xl font-serif font-black text-blue-900 border-b-2 border-blue-200 pb-1 px-2 leading-none">
                    {letter}
                </span>
                <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-100 via-blue-50 to-transparent" />
            </div>
            <div className="grid grid-cols-1 gap-6">
                {children}
            </div>
        </motion.div>
    );
};
