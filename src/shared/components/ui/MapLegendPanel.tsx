"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, X, Info, HelpCircle } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { SthanType } from "@/shared/types/sthanType";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

interface MapLegendPanelProps {
  isOpen: boolean;
  onClose: () => void;
  sthanTypes: SthanType[];
}

// 1. PIN TYPE ICON COMPONENT
// Standardized rendering for Section A pin types
interface PinTypeIconProps {
  type: string;
  isGrayscale?: boolean;
}

export const PinTypeIcon: React.FC<PinTypeIconProps> = ({ type, isGrayscale = false }) => {
  let src = "/icons/Sthan_pin.svg";
  let filterStyle = "";

  switch (type.toLowerCase()) {
    case "mahasthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.2.png";
      // Golden aura drop shadow
      filterStyle = "drop-shadow(0 0 4px rgba(212, 175, 55, 0.7))";
      break;
    case "avasthan":
    case "avasthan sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.1.png";
      break;
    case "vasti":
    case "vasti sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.3.png";
      break;
    case "aasan":
    case "aasan sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.4.png";
      break;
    case "charanchari":
    case "charanchari sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.6.svg";
      break;
    case "mandalik":
    case "mandalik sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/2.5.png";
      break;
    case "unavailable":
    case "unavailable sthan":
      src = "/icons/pins/2 Shri_Dattatray_Prabhu_Pin/Shri_Dattatray_Prabhu_Pin.png";
      break;
  }

  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      <img
        src={src}
        alt={type}
        style={{
          filter: isGrayscale ? "grayscale(100%) opacity(40%)" : filterStyle || undefined,
        }}
        className={cn(
          "w-7 h-7 object-contain transition-transform duration-300 group-hover:scale-110",
          type.toLowerCase() === "mahasthan" ? "w-8 h-8" : "w-7 h-7"
        )}
      />
    </div>
  );
};

// 2. COLOUR TYPE INDICATOR COMPONENT
// Radiant circular indicators or micro-pins for Section B
interface ColourTypeIndicatorProps {
  color: string;
  isGrayscale?: boolean;
}

export const ColourTypeIndicator: React.FC<ColourTypeIndicatorProps> = ({
  color,
  isGrayscale = false,
}) => {
  return (
    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
      {isGrayscale ? (
        <div className="w-4.5 h-4.5 rounded-full bg-slate-400 border border-slate-300 shadow-sm opacity-50" />
      ) : (
        <div className="relative flex items-center justify-center">
          {/* Subtle breathing glow */}
          <div
            className="absolute inset-0 w-5 h-5 rounded-full blur-sm opacity-55 animate-pulse"
            style={{ backgroundColor: color }}
          />
          {/* Inner ring */}
          <div
            className="w-4 h-4 rounded-full border border-white shadow-md relative z-10"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 10px ${color}80, inset 0 1px 2px rgba(255,255,255,0.4)`,
            }}
          />
          {/* Antique golden orbit outline */}
          <div className="absolute w-6 h-6 rounded-full border border-[#D4AF37]/35 scale-105" />
        </div>
      )}
    </div>
  );
};

// 3. REUSABLE LEGEND ITEM ROW
interface LegendItemProps {
  label: string;
  subtitle?: string;
  icon: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  tooltipText?: string;
  rightElement?: React.ReactNode;
}

export const LegendItem: React.FC<LegendItemProps> = (props) => {
  const {
    label,
    subtitle,
    icon,
    isActive = false,
    onClick,
    rightElement,
  } = props;

  return (
    <div className="relative w-full">
      <div
        role="button"
        tabIndex={onClick ? 0 : -1}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            onClick();
          }
        }}
        className={cn(
          "group flex items-center gap-3 p-2 rounded-xl border border-transparent transition-all duration-300 cursor-pointer text-left select-none relative overflow-hidden focus:outline-none focus-visible:outline-none outline-none",
          isActive
            ? "bg-[#F3ECE0]/50 border-[#E8E2D5] shadow-[0_2px_12px_rgba(212,175,55,0.08)]"
            : "hover:bg-[#FDFBF7] hover:border-amber-200/40 hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        )}
      >
        {/* Hover golden outline animation */}
        <div className="absolute inset-0 border border-[#D4AF37]/0 rounded-xl transition-all duration-300 group-hover:border-[#D4AF37]/15 group-hover:shadow-[0_0_8px_rgba(212,175,55,0.05)] pointer-events-none" />

        {/* Icon slot */}
        <div className="relative shrink-0">{icon}</div>

        {/* Label & Details */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <span className="text-xs font-semibold text-[#2D2D2D] leading-snug group-hover:text-landing-primary transition-colors truncate">
            {label}
          </span>
          {subtitle && (
            <span className="text-[10px] text-slate-500 leading-tight truncate">
              {subtitle}
            </span>
          )}
        </div>

        {/* Optional Right Action Element (e.g. Expand Chevron) */}
        {rightElement && <div className="shrink-0">{rightElement}</div>}
      </div>
    </div>
  );
};

// 4. INDEPENDENT ACCORDION SECTION WRAPPER
interface LegendAccordionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  ariaLabel: string;
}

export const LegendAccordion: React.FC<LegendAccordionProps> = ({
  title,
  isOpen,
  onToggle,
  children,
  ariaLabel,
}) => {
  return (
    <div className="border-b border-[#E8E2D5]/70 py-1 last:border-b-0">
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className={cn(
          "w-full flex items-center justify-between py-3 px-2 rounded-xl transition-all duration-300 font-serif font-bold text-left focus:outline-none focus-visible:outline-none outline-none",
          isOpen ? "text-landing-primary bg-[#F5F1E8]/40" : "text-slate-700 hover:bg-[#FAF6EE]"
        )}
      >
        <span className="text-sm tracking-wide">{title}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-landing-primary/80 transition-transform duration-300",
            isOpen ? "rotate-180" : ""
          )}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
            className="overflow-hidden"
          >
            <div className="py-2.5 px-1 space-y-1.5">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 5. REUSABLE MAP LEGEND CONTENT COMPONENT
interface MapLegendContentProps {
  sthanTypes: SthanType[];
}

export const MapLegendContent: React.FC<MapLegendContentProps> = ({ sthanTypes }) => {
  const { t, language } = useLanguage();
  const langCode = getLangCode(language);

  // States
  const [activeSection, setActiveSection] = useState<"sthan" | "colour" | null>("sthan");
  const [expandedLineage, setExpandedLineage] = useState<string | null>(null);

  const handleToggleSection = (section: "sthan" | "colour") => {
    setActiveSection(activeSection === section ? null : section);
  };

  const handleToggleLineage = (lineageId: string) => {
    setExpandedLineage(expandedLineage === lineageId ? null : lineageId);
  };

  // Section A items - Pin Types
  const sthanTypesList = [
    { id: "mahasthan", labelKey: "explore.mahasthan", fallback: "Mahasthan", type: "mahasthan" },
    { id: "avasthan", labelKey: "explore.avasthan", fallback: "Avasthan Sthan", type: "avasthan" },
    { id: "vasti", labelKey: "explore.vastiSthan", fallback: "Vasti Sthan", type: "vasti" },
    { id: "aasan", labelKey: "explore.asanSthan", fallback: "Aasan Sthan", type: "aasan" },
    { id: "charanchari", labelKey: "explore.charanchariSthan", fallback: "Charanchari Sthan", type: "charanchari" },
    { id: "mandalik", labelKey: "explore.mandalikSthan", fallback: "Mandalik Sthan", type: "mandalik" },
    { id: "unavailable", labelKey: "explore.unavailableSthan", fallback: "Unavailable Sthan", type: "unavailable" },
  ];

  // Section B items - Lineage Colors (derived from config / your requirements)
  const lineageColorsList = [
    {
      id: "shri-krishna",
      label: "Shri Krishna Bhagwan Sthan",
      color: "#BA3745",
      tooltip: "Spiritual lineage traces of Shri Krishna Bhagwan (Pinkish Red indicator)",
    },
    {
      id: "shri-dattatray",
      label: "Shri Dattatray Prabhu Sthan",
      color: "#B97B16",
      tooltip: "Spiritual lineage traces of Shri Dattatray Prabhu (Yellowish Amber indicator)",
    },
    {
      id: "shri-chakrapani",
      label: "Shri Changdev/Chakrapani Prabhu Sthan",
      color: "#633458",
      tooltip: "Spiritual lineage traces of Shri Changdev / Chakrapani Prabhu (Plum Purple indicator)",
    },
    {
      id: "shri-govind",
      label: "Shri Govind Prabhu Sthan",
      color: "#1D5B58",
      tooltip: "Spiritual lineage traces of Shri Govind Prabhu (Teal-Green indicator)",
    },
    {
      id: "shri-chakradhar",
      label: "Shri Chakradhar Swami Sthan",
      color: "#19325A",
      tooltip: "Spiritual lineage traces of Shri Chakradhar Swami (Navy Blue indicator)",
    },
    {
      id: "mandalik",
      label: "Mandalik Sthan",
      color: "#694835",
      tooltip: "Sacred regional / governor sthans (Brown indicator)",
    },
    {
      id: "unavailable",
      label: "Unavailable Sthan",
      color: "#613F79",
      tooltip: "Information currently offline or unconfirmed (Muted Violet/Purple indicator)",
    },
  ];

  return (
    <div className="space-y-1">
      {/* SECTION A: Sthana Types */}
      <LegendAccordion
        title={t("explore.sthanaTypes") || "Sthana Types"}
        isOpen={activeSection === "sthan"}
        onToggle={() => handleToggleSection("sthan")}
        ariaLabel="Sthana Types Section"
      >
        <div className="grid grid-cols-1 gap-1 px-1">
          {sthanTypesList.map((item) => {
            const localizedLabel = t(item.labelKey);
            return (
              <LegendItem
                key={item.id}
                label={localizedLabel || item.fallback}
                icon={<PinTypeIcon type={item.type} />}
                isActive={false}
                tooltipText={`Visual style map pin specifically signifying ${localizedLabel || item.fallback}`}
              />
            );
          })}
        </div>
      </LegendAccordion>

      {/* SECTION B: Color Types */}
      <LegendAccordion
        title={t("explore.colourTypes") || "Colour Types"}
        isOpen={activeSection === "colour"}
        onToggle={() => handleToggleSection("colour")}
        ariaLabel="Colour Types Section"
      >
        <div className="grid grid-cols-1 gap-1 px-1">
          {lineageColorsList.map((item) => {
            // Filter sthans matching this avatar to expand
            const rawSubSthans = sthanTypes.filter((st) => {
              const cleanId = st.avatarSambandh?.toLowerCase() || "";
              const itemId = item.id.toLowerCase();
              if (itemId === "unavailable") {
                return cleanId.includes("unavailable") || st.name.toLowerCase().includes("unavailable");
              }
              if (itemId === "mandalik") {
                return cleanId.includes("mandalik");
              }
              return cleanId.includes(itemId.replace("shri-", ""));
            });

            // Deduplicate by name (case-insensitive) to prevent repeats for Govind/Chakradhar sub-periods
            const seenNames = new Set<string>();
            const subSthans = rawSubSthans.filter((st) => {
              const lowerName = st.name.toLowerCase().trim();
              if (seenNames.has(lowerName)) {
                return false;
              }
              seenNames.add(lowerName);
              return true;
            });

            const hasSubSthans = subSthans.length > 0;
            const isExpanded = expandedLineage === item.id;

            return (
              <div key={item.id} className="flex flex-col">
                <LegendItem
                  label={item.label}
                  icon={
                    <ColourTypeIndicator
                      color={item.color}
                    />
                  }
                  isActive={isExpanded}
                  onClick={hasSubSthans ? () => handleToggleLineage(item.id) : undefined}
                  tooltipText={item.tooltip}
                  rightElement={
                    hasSubSthans ? (
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 text-slate-400 group-hover:text-landing-primary transition-transform duration-300",
                          isExpanded ? "rotate-180 text-landing-primary" : ""
                        )}
                      />
                    ) : undefined
                  }
                />

                {/* Lineage Sub Accordion Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && hasSubSthans && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden pl-7 mt-1 border-l-2 ml-4 border-[#E8E2D5]/70 space-y-1"
                    >
                      {subSthans.map((st) => {
                        // Fetch pin icon info
                        let pinSrc = "/icons/Sthan_pin.svg";
                        if (st.pinType && st.pinType.startsWith("/icons/")) {
                          pinSrc = st.pinType;
                        }

                        return (
                          <div
                            key={st.id}
                            className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-[#F5F1E8]/35 transition-colors group cursor-default"
                          >
                            <img
                              src={pinSrc}
                              alt={st.name}
                              className="w-5 h-5 object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                            />
                            <span className="text-[11px] font-semibold text-slate-600 group-hover:text-[#2D2D2D] transition-colors leading-tight">
                              {st.name}
                            </span>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </LegendAccordion>
    </div>
  );
};

// 6. MAIN MAP LEGEND PANEL COMPONENT (BACKWARD COMPATIBLE DRAWER)
export const MapLegendPanel: React.FC<MapLegendPanelProps> = ({
  isOpen,
  onClose,
  sthanTypes,
}) => {
  const { t, language } = useLanguage();
  const [isMobile, setIsMobile] = useState(false);

  // Responsive Hook
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[999] bg-black/25 backdrop-blur-sm pointer-events-auto"
          />

          {/* Map Legend Panel Drawer */}
          <motion.div
            initial={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0, opacity: 0 }}
            animate={isMobile ? { y: 0, x: 0 } : { x: 0, y: 0, opacity: 1 }}
            exit={isMobile ? { y: "100%", x: 0 } : { x: "100%", y: 0, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 220 }}
            className={cn(
              "fixed bg-[#FDFBF7] shadow-2xl flex flex-col pointer-events-auto overflow-hidden z-[1000] border-[#E8E2D5]",
              isMobile
                ? "bottom-0 left-0 right-0 max-h-[85vh] rounded-t-[2.5rem] border-t-2"
                : "right-4 top-20 bottom-20 w-80 md:w-96 rounded-[2rem] border-2"
            )}
            style={{
              borderStyle: "double",
            }}
          >
            {/* Elegant Double Border Ornaments */}
            <div className="absolute top-2.5 left-2.5 w-3 h-3 border-t border-l border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute top-2.5 right-2.5 w-3 h-3 border-t border-r border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute bottom-2.5 left-2.5 w-3 h-3 border-b border-l border-[#D4AF37]/50 pointer-events-none" />
            <div className="absolute bottom-2.5 right-2.5 w-3 h-3 border-b border-r border-[#D4AF37]/50 pointer-events-none" />

            {/* Mobile Sheet Handle Bar */}
            {isMobile && (
              <div className="w-12 h-1.5 bg-slate-300/60 rounded-full mx-auto mt-3.5 mb-1.5 shrink-0" />
            )}

            {/* Header section */}
            <div className="relative pt-6 px-6 pb-4 border-b border-[#E8E2D5]/70 shrink-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className="text-xl font-heading font-black text-landing-primary tracking-wide font-serif leading-tight">
                    {t("explore.aboutMapPins") || "About Map Pins"}
                  </h2>
                  <p className="text-[11px] font-sans font-semibold text-slate-500 mt-1 leading-snug">
                    {t("explore.aboutMapPinsSubtitle") ||
                      "Understand Sthana types and lineage color indicators."}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center bg-[#FAF6EE] border border-[#E8E2D5] text-slate-400 hover:text-[#2D2D2D] hover:border-amber-300 hover:bg-[#F3ECE0]/30 transition-all duration-300 shrink-0 focus:outline-none focus-visible:outline-none outline-none"
                  aria-label="Close legend panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Accordion Content Panel (Scrollable) */}
            <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar max-h-[60vh] md:max-h-none">
              <MapLegendContent sthanTypes={sthanTypes} />
            </div>

            {/* Subtle Footer Ornament */}
            <div className="py-3.5 bg-[#FAF6EE] text-center border-t border-[#E8E2D5]/60 text-[10px] text-slate-400 font-sans tracking-wide shrink-0 font-medium">
              {t("explore.footerOrnament") || "Panchjanya Spiritual Heritage Legends"}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
