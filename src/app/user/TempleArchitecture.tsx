import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/auth/firebase";
import { doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import * as LucideIcons from "lucide-react";
import { X, MapPin, Compass, Share2, Navigation, Bookmark, ChevronLeft, ChevronRight, Info, Phone, BookOpen } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Button1 } from "@/shared/components/ui/button-1";
import { Temple, AbbreviationItem } from "@/types";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/shared/components/ui/accordion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/shared/components/ui/carousel";
import { SafeHTML } from "@/shared/components/ui/SafeHTML";


export default function TempleArchitecture() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [temple, setTemple] = useState<Temple | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [abbreviationItems, setAbbreviationItems] = useState<AbbreviationItem[]>([]);
    const { t } = useLanguage();

    const displayImages = (temple?.sthanImages && temple.sthanImages.length > 0
        ? temple.sthanImages
        : (temple?.images && temple.images.length > 0 ? temple.images : [temple?.architectureImage || "/placeholder-temple.jpg"]));

    const nextImage = () => setSelectedImageIndex((p) => (p + 1) % displayImages.length);
    const prevImage = () => setSelectedImageIndex((p) => (p - 1 + displayImages.length) % displayImages.length);

    useEffect(() => {
        if (!id) return;

        const fetchTempleData = async () => {
            try {
                setLoading(true);
                const snap = await getDoc(doc(db, "temples", id));

                if (!snap.exists()) {
                    console.error("Temple not found");
                    navigate(-1);
                    return;
                }

                const data = snap.data() as Temple;
                setTemple(data);
            } catch (error) {
                console.error("Error fetching temple:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTempleData();
    }, [id, navigate]);

    // Fetch global abbreviations
    useEffect(() => {
        const fetchAbbreviations = async () => {
            try {
                const abbrevSnap = await getDoc(doc(db, "settings", "abbreviations"));
                if (abbrevSnap.exists()) {
                    setAbbreviationItems(abbrevSnap.data().items || []);
                }
            } catch (error) {
                console.error("Error fetching abbreviations:", error);
            }
        };

        fetchAbbreviations();
    }, []);

    // Check if temple is saved
    useEffect(() => {
        const checkIfSaved = async () => {
            if (!user || !id) {
                setIsSaved(false);
                return;
            }

            try {
                const savedRef = doc(db, `users/${user.uid}/savedTemples/${id}`);
                const savedDoc = await getDoc(savedRef);
                setIsSaved(savedDoc.exists());
            } catch (error) {
                console.error("Error checking saved status:", error);
                setIsSaved(false);
            }
        };

        checkIfSaved();
    }, [user, id]);

    // Scroll detection for header
    useEffect(() => {
        let ticking = false;
        const handleScroll = () => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const scrollY = window.scrollY;
                    // Use a larger threshold and functional updates to prevent flickering
                    if (scrollY > 100) {
                        setIsScrolled(true);
                    } else if (scrollY < 20) {
                        setIsScrolled(false);
                    }
                    ticking = false;
                });
                ticking = true;
            }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []); // Remove dependencies that cause re-subscription

    // Toggle save/unsave
    const toggleSave = async () => {
        if (!user || !temple || !id || isSaving) return;

        setIsSaving(true);
        try {
            const savedRef = doc(db, `users/${user.uid}/savedTemples/${id}`);

            if (isSaved) {
                // Unsave
                await deleteDoc(savedRef);
                setIsSaved(false);
            } else {
                // Save
                await setDoc(savedRef, {
                    templeId: id,
                    savedAt: new Date(),
                    templeName: temple.name,
                    templeCity: temple.city || temple.address || "",
                    templeImage: temple.sthanImages?.[0] || temple.images?.[0] || ""
                });
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Error toggling save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleShare = async () => {
        if (!temple) return;

        const shareData = {
            title: temple.name,
            text: t('temple.shareMessage', { name: temple.name }),
            url: window.location.href,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch (err) {
            console.error("Error sharing:", err);
        }
    };

    const handleNavigation = () => {
        if (temple?.latitude && temple?.longitude) {
            window.open(
                `https://www.google.com/maps/dir/?api=1&destination=${temple.latitude},${temple.longitude}`,
                "_blank"
            );
        }
    };

    const handleArchitectureView = () => {
        navigate(`/temple/${id}/architecture-view`);
    };

    if (loading) {
        return (
            <div className="min-h-full flex-1 flex items-center justify-center ">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
            </div>
        );
    }

    if (!temple) {
        return (
            <div className="min-h-full flex-1 flex items-center justify-center ">
                <div className="text-center">
                    <p className="text-lg text-muted-foreground mb-4">{t('temple.noSthanFound')}</p>
                    <Button onClick={() => navigate(-1)}>{t('common.goBack')}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex-1 pb-8 animate-in fade-in duration-300">
            {/* Header Section */}
            <div
                className="sticky top-0 z-[1000] px-2 bg-white shadow-sm border-b border-[#c7c6c6] py-3"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header Content Block */}
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 shrink-0 bg-white/80" onClick={() => navigate('/explore')}>
                        <ChevronLeft className="w-7 h-7 text-blue-900" />
                    </Button>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                            <h1 className={cn(
                                "font-heading font-bold text-[#0f3c6e] font-serif truncate flex-1 leading-tight transition-all duration-300",
                                isScrolled ? "text-xl md:text-2xl" : "text-2xl md:text-3xl"
                            )}>
                                {temple.name}
                            </h1>

                            {/* Saved Icon */}
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={toggleSave}
                                disabled={isSaving || !user}
                                className={cn(
                                    "rounded-full w-9 h-9 hover:bg-black/5 transition-all shrink-0 bg-white/80"
                                )}
                            >
                                <Bookmark className={cn("w-6 h-6 text-blue-900", isSaved && "fill-amber-500 text-amber-500")} />
                            </Button>
                        </div>

                        {/* Subtitle and Address - Aligned with Title */}
                        <div className={cn(
                            "space-y-1 overflow-hidden transition-all duration-300 ease-in-out origin-top will-change-[max-height,opacity]",
                            isScrolled ? "max-h-0 opacity-0 mt-0" : "max-h-32 opacity-100 mt-1"
                        )}>
                            <h2 className="text-base text-[#0f3c6e] font-serif">
                                <span className="font-bold">{temple.todaysName}</span> {temple.todaysNameTitle && `(${temple.todaysNameTitle})`}
                            </h2>
                            <p className="text-sm font-bold text-amber-600 leading-tight">
                                {temple.address}
                            </p>
                        </div>

                    </div>
                </div>
            </div>

            <div className="px-4 lg:px-6 space-y-2 md:space-y-4 mt-2 md:mt-4 max-w-6xl mx-auto pb-12">

                {/* Action Buttons Row */}
                <div className="flex items-center gap-3 md:gap-4">
                    {/* Directions Button */}
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button
                                className="flex-[2] bg-white text-blue-900 h-12 md:h-14 rounded-2xl border border-slate-200 transition-all duration-300 hover:bg-slate-50 flex items-center justify-center gap-2 md:gap-3 font-bold shadow-md"
                            >
                                <img
                                    src="/icons/signpost.png"
                                    alt={t('temple.navigation')}
                                    className="w-6 h-6 md:w-6 md:h-6 object-contain"
                                />
                                <span className="text-sm md:text-base">{t('temple.wayToReach')}</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md rounded-[2rem]">
                            <DialogHeader>
                                <DialogTitle className="text-blue-900 font-serif text-center flex items-center justify-center gap-2">
                                    <img
                                        src="/icons/signpost.png"
                                        alt="Directions"
                                        className="w-5 h-5 object-contain"
                                    />
                                    {t('temple.wayToReach')}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                <div className="text-sm text-slate-700 font-serif leading-relaxed px-1">
                                    <SafeHTML html={temple.directions_text || t('temple.noInfo')} />
                                </div>

                                {(temple.contactName || temple.contactNumber || temple.contactDetails) && (
                                    <div className="mt-2 p-2 rounded-2xl border border-blue-100/50 space-y-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                                            <span className="text-[10px] font-black text-blue-900 uppercase tracking-widest">{t('common.contactDetails')}</span>
                                        </div>
                                        <div className="space-y-2">
                                            {(temple.contactName || temple.contactNumber) && (
                                                <p className="text-sm font-serif text-slate-900 leading-tight">
                                                    {temple.contactName && temple.contactNumber
                                                        ? `${temple.contactName} : ${temple.contactNumber}`
                                                        : (temple.contactName || temple.contactNumber)}
                                                </p>
                                            )}
                                            {temple.contactDetails && (
                                                <div className="flex gap-2 text-sm text-slate-700 leading-relaxed font-serif pt-1 border-t border-blue-100/50">
                                                    <span className="font-bold text-slate-400 not-italic shrink-0">{t('common.note')}</span>
                                                    <p className="italic">{temple.contactDetails}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* Map/Navigation Button */}
                    <Button
                        variant="outline"
                        className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white transition-all duration-300 hover:bg-slate-50 text-blue-900 hover:text-blue-900 border-slate-200 hover:border-slate-200 flex items-center justify-center shrink-0 shadow-md p-0"
                        onClick={handleNavigation}
                        title="Navigate"
                    >
                        <Navigation className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>

                    {/* Share Button */}
                    <Button
                        variant="outline"
                        className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-white transition-all duration-300 hover:bg-slate-50 text-blue-900 hover:text-blue-900 border-slate-200 hover:border-slate-200 flex items-center justify-center shrink-0 shadow-md p-0"
                        onClick={handleShare}
                        title="Share"
                    >
                        <Share2 className="w-5 h-5 md:w-6 md:h-6" />
                    </Button>
                </div>

                {/* Image Slider */}
                <div className="pb-2">
                    <div className="relative aspect-[4/3] w-full rounded-2xl overflow-hidden border-4 border-white bg-gray-200 group">
                        <Carousel className="w-full h-full">
                            <CarouselContent>
                                {displayImages.map((img, index) => (
                                    <CarouselItem key={index} className="w-full h-full flex items-center justify-center">
                                        <img
                                            src={img}
                                            alt={`${temple.name} - ${index + 1}`}
                                            className={cn(
                                                "cursor-pointer hover:opacity-90 transition-all duration-500 object-center",
                                                temple.sthanImagesFitMode === 'cover' ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain"
                                            )}
                                            onClick={() => {
                                                setSelectedImageIndex(index);
                                                setIsImageModalOpen(true);
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-temple.jpg';
                                            }}
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <button
                                onClick={(e) => { e.preventDefault(); const prev = e.currentTarget.parentElement?.querySelector('[data-carousel-prev]') as HTMLButtonElement; prev?.click(); }}
                                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md"
                            >
                                <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                            </button>
                            <button
                                onClick={(e) => { e.preventDefault(); const next = e.currentTarget.parentElement?.querySelector('[data-carousel-next]') as HTMLButtonElement; next?.click(); }}
                                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md"
                            >
                                <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                            </button>
                            <CarouselPrevious className="hidden" data-carousel-prev />
                            <CarouselNext className="hidden" data-carousel-next />
                        </Carousel>
                    </div>
                </div>

                {/* Sthana Architecture View Button */}
                <div className="pb-2">
                    <Button1
                        variant="primary"
                        size="lg"
                        className="w-full h-12 md:h-14 bg-blue-900 hover:bg-blue-800 text-white rounded-2xl text-sm md:text-base font-heading font-serif font-bold tracking-wide border border-blue-800 shadow-md"
                        onClick={handleArchitectureView}
                    >
                        <img
                            src="/icons/explore_safari.png"
                            alt={t('temple.explore')}
                            className="w-5 h-5 md:w-6 md:h-6 shrink-0 object-contain brightness-0 invert"
                        />
                        <span>{t('temple.exploreSthan')}</span>
                    </Button1>
                </div>


                {/* General Description */}
                <div className="space-y-3 md:space-y-4 group relative pb-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-amber-600"></div>
                            <h3 className="font-heading text-xl font-bold text-blue-900">
                                {t('temple.sthanAtGlance')}
                            </h3>
                        </div>

                        {/* Info Button for Abbreviations - Moved to Header */}
                        {abbreviationItems && abbreviationItems.length > 0 && (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/90 transition-all duration-300 hover:bg-slate-50 text-blue-900 border border-slate-200 shadow-md">
                                        <Info className="w-5 h-5" />
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-[90%] rounded-2xl z-[10000]">
                                    <DialogHeader>
                                        <DialogTitle className="text-blue-900 font-serif">{t('common.abbreviations')}</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-3 pt-4">
                                        {abbreviationItems.map((item, index) => (
                                            <div key={item.id || index} className="flex items-start gap-3 text-sm text-slate-700 pb-2 border-b border-gray-100 last:border-0">
                                                {item.icon && (
                                                    <img src={item.icon} className="w-5 h-5 object-contain shrink-0 mt-0.5" alt="icon" />
                                                )}
                                                <span>{item.description}</span>
                                            </div>
                                        ))}
                                    </div>
                                </DialogContent>
                            </Dialog>
                        )}
                    </div>

                    {temple.glanceItems && temple.glanceItems.length > 0 && (
                        <div className="bg-white p-1 md:p-6 rounded-2xl border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-900/10"></div>
                            <div className="grid grid-cols-2 gap-x-2 gap-y-2 md:gap-x-8 md:gap-y-5 pl-2 md:pl-3">
                                {temple.glanceItems.map((item, idx) => (
                                    <div key={item.id || idx} className="flex items-start gap-2.5 md:gap-3 p-1.5 md:p-2">
                                        <div className="w-7 h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0">
                                            {item.icon && (
                                                <img src={item.icon} className="w-full h-full object-contain" alt="icon" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-serif text-slate-700 leading-relaxed text-base md:text-lg">
                                                {item.description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sthana Info */}
                <div className="space-y-3 md:space-y-4 group pb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-amber-600"></div>
                        <h3 className="font-heading text-xl font-bold text-blue-900">
                            {t('temple.sthanDescription')}
                        </h3>
                    </div>

                    <div className="bg-white p-3 md:p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-orange-500/10"></div>
                        <div className="pl-2">
                            <SafeHTML 
                                html={temple.sthana_info_text || temple.sthana || t('common.noInfo')} 
                            />
                        </div>
                    </div>

                    {/* Sthan Pothi (Temple Level) */}
                    {temple.sthanPothiDescription && (
                        <div className="space-y-3 md:space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-amber-600"></div>
                                <h3 className="font-heading text-xl font-bold text-blue-900 flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-amber-600" />
                                    {temple.sthanPothiTitle || t('common.sthanPothi')}
                                </h3>
                            </div>
                            <div className="bg-white p-3 md:p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-amber-500/10"></div>
                                <div className="pl-2">
                                    <SafeHTML html={temple.sthanPothiDescription} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Description Sections (Step 1) */}
                    {temple.descriptionSections && temple.descriptionSections.length > 0 && temple.descriptionSections
                        .filter(section => (section.page_type || 'page1') === 'page1')
                        .map((section) => (
                        <div key={section.id} className="space-y-3 md:space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-amber-600"></div>
                                <h3 className="font-heading text-xl font-bold text-blue-900">
                                    {section.title}
                                </h3>
                            </div>
                            <div className="bg-white p-3 md:p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/10"></div>
                                <div className="pl-2">
                                    <SafeHTML html={section.content} />
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Custom Blocks (Step 2) */}
                    {temple.customBlocks && temple.customBlocks.length > 0 && temple.customBlocks
                        .filter(block => (block.page_type || 'page2') === 'page1')
                        .map((block) => (
                        <div key={block.id} className="space-y-3 md:space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-6 bg-amber-600"></div>
                                <h3 className="font-heading text-xl font-bold text-blue-900">
                                    {block.title}
                                </h3>
                            </div>
                            <div className="bg-white p-3 md:p-5 rounded-2xl border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/10"></div>
                                <div className="pl-2">
                                    <SafeHTML html={block.content} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Full-Screen Image Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-none flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={displayImages[selectedImageIndex]}
                            alt={`${temple?.name} - Full view`}
                            className="max-w-full max-h-[100vh] object-contain"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder-temple.jpg';
                            }}
                        />

                        {/* Close Button - High Z-index and responsive */}
                        <button
                            onClick={() => setIsImageModalOpen(false)}
                            className="absolute top-4 right-4 z-[1002] w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-lg"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        {/* Navigation Arrows inside Modal */}
                        {displayImages.length > 1 && (
                            <>
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[1002] w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md bg-black/20 rounded-full backdrop-blur-sm"
                                >
                                    <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[1002] w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md bg-black/20 rounded-full backdrop-blur-sm"
                                >
                                    <ChevronRight className="w-10 h-10" strokeWidth={3} />
                                </button>

                                {/* Indicator Dots inside Modal */}
                                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[1002]">
                                    {displayImages.map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-slate-500 w-5' : 'bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
