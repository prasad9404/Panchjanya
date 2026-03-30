import { X, ChevronLeft, ChevronRight, Navigation, Compass, BookOpen, Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/shared/lib/utils";
import type { Temple } from "@/types";
import { doc, setDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { useAuth } from "@/auth/AuthContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";
import { getLocationUrl } from "@/shared/utils/locationUtils";

interface TempleDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  temple: Temple | null;
}

export const TempleDetails = ({ isOpen, onClose, temple }: TempleDetailsProps) => {
  // 1. Move ALL hooks to the top level, unconditionally.
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useLanguage();
  const langCode = getLangCode(language);
  
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [cloudinaryImages, setCloudinaryImages] = useState<string[]>([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 2. useEffect is a hook, must be unconditional
  useEffect(() => {
    setCurrentImageIndex(0);
    // Only update images if temple exists, but the effect itself runs unconditionally
    if (temple && Array.isArray(temple.sthanImages) && temple.sthanImages.length > 0) {
      setCloudinaryImages(temple.sthanImages);
    } else {
      setCloudinaryImages([]);
    }
  }, [temple]);

  // Check if temple is saved
  useEffect(() => {
    const checkIfSaved = async () => {
      if (!user || !temple) {
        setIsSaved(false);
        return;
      }

      try {
        const savedRef = doc(db, `users/${user.uid}/savedTemples/${temple.id}`);
        const savedDoc = await getDoc(savedRef);
        setIsSaved(savedDoc.exists());
      } catch (error) {
        console.error("Error checking saved status:", error);
        setIsSaved(false);
      }
    };

    checkIfSaved();
  }, [user, temple]);

  // Toggle save/unsave
  const toggleSave = async () => {
    if (!user || !temple || isSaving) return;

    setIsSaving(true);
    try {
      const savedRef = doc(db, `users/${user.uid}/savedTemples/${temple.id}`);

      if (isSaved) {
        // Unsave
        await deleteDoc(savedRef);
        setIsSaved(false);
      } else {
        // Save
        await setDoc(savedRef, {
          templeId: temple.id,
          savedAt: new Date(),
          templeName: temple.name,
          templeCity: getTranslatedValue(temple.city, langCode) || getTranslatedValue(temple.address, langCode) || "",
          templeImage: temple.sthanImages?.[0] || ""
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Helper functions (not hooks, but good to keep here)
  const images = (cloudinaryImages.length > 0)
    ? cloudinaryImages
    : (temple && Array.isArray(temple.sthanImages) ? temple.sthanImages : []);

  const nextImage = () => {
    if (!images || images.length === 0) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    if (!images || images.length === 0) return;
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const getAddress = () => {
    if (!temple) return "";

    // Prefer constructing address from components to ensure no duplication
    if (temple.city || temple.district) {
      const city = getTranslatedValue(temple.city, langCode).trim();
      const district = getTranslatedValue(temple.district, langCode).trim();

      if (city && district && city.toLowerCase() !== district.toLowerCase()) {
        return `${city}, ${district}`;
      }
      return city || district || "";
    }

    if (temple.address) return getTranslatedValue(temple.address, langCode);
    if (typeof temple.location === 'object' && temple.location !== null) {
      return (temple.location as any).address || "Sacred Sthana";
    }
    if (typeof temple.location === 'string') return temple.location;
    return "Preserved in the sacred geography of Bharat";
  };

  // 4. NOW we can do early returns or conditional rendering
  // But wait! If we return null here, the hooks (like Lightbox component definitions if they were hooks) 
  // needs to be consistent. 
  // Actually, Lightbox is a component defined inside. Defining components inside components is bad practice 
  // because it re-defines the component on every render, remounting it.
  // Better to move Lightbox out or just use it inline.
  // For this fix, I will keep the structure but ensure hooks are top level.
  // Also, if 'temple' is null, we usually don't want to render the modal content.

  if (!temple) return null;

  // Since we have an early return above, we MUST NOT have any hooks below this line.
  // The 'Lightbox' component definition is NOT a hook, it's just a function. 
  // BUT if it used hooks inside itself (it doesn't seem to), that would be an issue if we called it as <Lightbox />.
  // However, React rule says: "Don't call Hooks inside loops, conditions, or nested functions."
  // We called all our hooks at the top. So we are safe?
  // NO. The 'images' variable calculation depends on 'temple'. 
  // If 'temple' is null, 'images' calculation might fail if we blindly access temple.images.
  // I fixed 'images' calculation to be safe above.

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-4 md:p-6 transition-all duration-300",
          isOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        )}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className={cn(
          "w-full h-full sm:h-auto sm:max-w-5xl sm:max-h-[90vh] bg-background sm:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col transform transition-all duration-500 border-0 sm:border border-white/10",
          isOpen ? "scale-100 translate-y-0" : "scale-95 translate-y-8"
        )}>

          {/* Decorative Heritage Border at top */}
          <div className="h-1.5 w-full bg-gradient-to-r from-primary via-accent to-secondary" />

          {/* Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-md z-20 px-4 sm:px-8 py-4 sm:py-5 border-b border-border/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-heading text-base sm:text-xl font-bold tracking-tight text-foreground/90">
                  Panchjanya Archive
                </h2>
                <p className="text-[9px] sm:text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-bold hidden sm:block">
                  Digital Heritage Record
                </p>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleSave}
                disabled={isSaving || !user}
                className={cn(
                  "rounded-full border-border/50 h-9 w-9 sm:h-10 sm:w-10 transition-all active:scale-95",
                  isSaved
                    ? "bg-primary hover:bg-primary/90 text-white border-primary"
                    : "hover:bg-primary/10 hover:text-primary hover:border-primary"
                )}
              >
                <Bookmark className={cn("w-5 h-5 sm:w-5 sm:h-5", isSaved && "fill-current")} />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={onClose}
                className="rounded-full hover:bg-destructive/10 hover:text-destructive border-border/50 h-9 w-9 sm:h-10 sm:w-10 transition-colors active:scale-95"
              >
                <X className="w-5 h-5 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </div>

          {/* Scrollable Content - Single Column Layout */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-10 no-scrollbar">
            <div className="max-w-3xl mx-auto space-y-6 sm:space-y-8 lg:space-y-10">

              {/* 1. Images */}
              <div
                className="relative aspect-[16/10] rounded-[2rem] overflow-hidden bg-muted shadow-lg group cursor-zoom-in border border-border/50"
                onClick={() => setIsLightboxOpen(true)}
              >
                {images && images.length > 0 ? (
                  <>
                    <img
                      src={images[currentImageIndex]}
                      alt={getTranslatedValue(temple.name, langCode)}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src = "https://placehold.co/1200x800?text=Sthan+Image";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-40 group-hover:opacity-30 transition-opacity" />

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold uppercase tracking-widest bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                        View Fullscreen
                      </span>
                      {images.length > 1 && (
                        <span className="text-xs font-medium bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                          {currentImageIndex + 1} / {images.length}
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center w-full h-full text-muted-foreground gap-3">
                    <BookOpen className="w-12 h-12 opacity-20" />
                    <p className="text-sm font-medium">No Sthan images uploaded</p>
                  </div>
                )}
              </div>

              {/* 2. Heading */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-[0.2em]">
                    <Compass className="w-3.5 h-3.5" />
                    Viraat Sthan
                  </div>
                  {(() => {
                    const isBasicComplete = Boolean(temple.name && ((temple as any).sthan || temple.sthana) && temple.district);
                    const hasImages = Boolean((temple.sthanImages?.length ?? 0) > 0 || (temple.images?.length ?? 0) > 0 || temple.architectureImage || temple.presentImage);
                    const hasSthanDetails = Boolean(temple.sthana_info_text || temple.sthana);
                    const hasTempleInfo = Boolean(temple.description_text || temple.description || temple.address);
                    const isFullyComplete = temple.isComplete || (isBasicComplete && hasImages && hasSthanDetails && hasTempleInfo);

                    if (temple.isVerified) {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#C9A961]/10 text-[#a88b48] rounded-full text-[9px] font-bold uppercase tracking-wider border border-[#C9A961]/20">
                          <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                          </svg>
                          Verified by Panchjanya
                        </div>
                      );
                    } else if (isFullyComplete) {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase tracking-wider border border-emerald-100">
                          Archive Complete
                        </div>
                      );
                    } else if (isBasicComplete) {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold uppercase tracking-wider border border-amber-100">
                          Incomplete Archive
                        </div>
                      );
                    } else {
                      return (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[9px] font-bold uppercase tracking-wider border border-slate-200">
                          Draft Record
                        </div>
                      );
                    }
                  })()}
                  {!temple.isVerified && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-500 rounded-full text-[9px] font-bold uppercase tracking-wider border border-rose-100">
                      Non Verified
                    </div>
                  )}
                </div>

                <h1 className="font-heading text-3xl lg:text-4xl font-black text-foreground tracking-tighter leading-[0.95]">
                  {getTranslatedValue(temple.name, langCode)}
                </h1>
              </div>

              {/* 3. Location */}
              <div className="flex items-start gap-4 p-5 bg-muted/30 rounded-[1.5rem] border border-border/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent/50" />
                <Navigation className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1">Preserved Location</p>
                  <p className="text-base text-foreground/80 leading-relaxed font-medium">
                    {getAddress()}
                  </p>
                </div>
              </div>

              {/* 4. Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  className="h-14 rounded-2xl bg-secondary hover:bg-secondary/90 text-secondary-foreground shadow-sm hover:shadow-md transition-all active:scale-95 justify-between px-6 group"
                  onClick={() => navigate(`/temple/${temple.id}/architecture`)}
                >
                  <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <Compass className="w-4 h-4" />
                    Sthan Architecture View
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-primary/20 hover:bg-primary/5 text-primary shadow-sm hover:shadow-md transition-all active:scale-95 justify-between px-6 group"
                  onClick={() => {
                    const url = getLocationUrl(temple.locationLink, temple.latitude, temple.longitude);
                    if (url) {
                      window.open(url, "_blank");
                    }
                  }}
                >
                  <span className="font-bold uppercase tracking-wider text-xs flex items-center gap-2">
                    <Navigation className="w-4 h-4" />
                    Location
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="w-full h-px bg-border/40" />

              {/* 5. Information Sections */}
              <div className="space-y-10">
                {[
                  {
                    id: 'overview',
                    title: getTranslatedValue(temple.description_title, langCode) || 'Archive Overview',
                    content: getTranslatedValue(temple.description_text, langCode) || getTranslatedValue(temple.description, langCode),
                    icon: '📜'
                  },
                  {
                    id: 'history',
                    title: getTranslatedValue(temple.sthana_info_title, langCode) || 'Sthan Information',
                    content: getTranslatedValue(temple.sthana_info_text, langCode) || getTranslatedValue(temple.sthana, langCode),
                    icon: '🕉️'
                  },
                  {
                    id: 'directions',
                    title: getTranslatedValue(temple.directions_title, langCode) || 'Directions',
                    content: getTranslatedValue(temple.directions_text, langCode),
                    icon: '🧭'
                  },
                  {
                    id: 'leela',
                    title: 'Sacred Leelas',
                    content: getTranslatedValue(temple.leela, langCode),
                    icon: '🌟'
                  }
                ].map((section) => section.content && (
                  <div key={section.id} className="relative group">
                    <div className="flex items-center gap-4 mb-5">
                      <span className="text-3xl filter grayscale group-hover:grayscale-0 transition-all duration-500">{section.icon}</span>
                      <h3 className="font-heading text-2xl font-bold text-foreground/90">
                        {section.title}
                      </h3>
                    </div>
                    <div className="relative">
                      <div className="absolute -left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-border to-transparent" />
                      <p className="text-foreground/70 leading-[1.8] text-lg font-body pl-2 whitespace-pre-wrap">
                        {section.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer info */}
              <div className="pt-10 pb-2 text-center space-y-6 opacity-60">
                <div className="flex justify-center gap-2">
                  <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-foreground/20 rounded-full" />
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] font-bold">
                  End of Sthan Archive
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isLightboxOpen && (
        <div className="fixed inset-0 z-[70] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 text-white/70 hover:text-white rounded-full h-12 w-12 hover:bg-white/10"
          >
            <X className="w-8 h-8" />
          </Button>

          <div className="relative w-full max-w-7xl h-full flex items-center justify-center">
            {images && images.length > 0 && (
              <img
                src={images[currentImageIndex]}
                alt="Full view"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
              />
            )}

            {images && images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition-all"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-4 transition-all"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium tracking-widest uppercase">
            {images ? currentImageIndex + 1 : 0} / {images ? images.length : 0} • Digital Archive View
          </div>
        </div>
      )}
    </>
  );
};
