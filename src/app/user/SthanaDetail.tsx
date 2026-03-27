import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/auth/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Dialog, DialogContent } from "@/shared/components/ui/dialog";
import { X, ChevronLeft, ChevronRight, Compass, History, BookOpen, Check, ChevronDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Temple, Hotspot, SthanDetail } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { SafeHTML } from "@/shared/components/ui/SafeHTML";

export default function SthanaDetail() {
    const { id, sthanaId } = useParams<{ id: string; sthanaId: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const viewParam = searchParams.get('view') || 'architectural';
    const [hotspot, setHotspot] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    const [viewMode, setViewMode] = useState("present"); // 'present' | 'old'
    const [contentMode, setContentMode] = useState("details"); // 'details' | 'leela'
    const [allHotspots, setAllHotspots] = useState<any[]>([]);
    const [expandedLeelaId, setExpandedLeelaId] = useState<string | null>(null);

    useEffect(() => {
        const fetchTemple = async () => {
            if (!id || !sthanaId) return;
            try {
                setLoading(true);
                const templeSnap = await getDoc(doc(db, "temples", id));
                if (!templeSnap.exists()) return;
                const templeData = templeSnap.data() as Temple;

                // 1. Fetch all hotspots from subcollections (The new source of truth)
                const archRef = collection(db, "temples", id, "architecture_hotspots");
                const presRef = collection(db, "temples", id, "present_hotspots");

                const [archSnap, presSnap] = await Promise.all([
                    getDocs(archRef),
                    getDocs(presRef)
                ]);

                const archHotspots = archSnap.docs.map(d => d.data() as Hotspot);
                const presHotspots = presSnap.docs.map(d => d.data() as Hotspot);

                // Fallback to legacy arrays if subcollections are empty
                const finalArch = archHotspots.length > 0 ? archHotspots : (templeData.hotspots || []);
                const finalPres = presHotspots.length > 0 ? presHotspots : (templeData.present_hotspots || templeData.presentHotspots || []);

                // NEW: Priority for dynamic details array
                if (templeData.details && templeData.details.length > 0) {
                    const found = templeData.details.find(d => d.id === sthanaId);
                    if (found) {
                        const linkedHotspot = finalArch.find(h => h.id === found.hotspotId || h.id === found.id);
                        setHotspot({
                            ...found,
                            number: linkedHotspot?.number || (templeData.details.indexOf(found) + 1)
                        });
                        setAllHotspots(templeData.details.map((d, i) => ({
                            ...d,
                            number: finalArch.find(h => h.id === d.hotspotId || h.id === d.id)?.number || (i + 1)
                        })).sort((a, b) => (a.number || 0) - (b.number || 0)));
                        setLoading(false);
                        return;
                    }
                }

                // 2. Find target hotspot (Legacy Fallback)
                let found = [...finalArch, ...finalPres].find(h => h.id === sthanaId);

                if (found) {
                    // if it's a mapping, merge with architectural source
                    if (found.sthanaId) {
                        const source = finalArch.find(ah => ah.id === found.sthanaId);
                        found = { ...source, ...found };
                    }
                    setHotspot(found);
                }

                // 3. Set all hotspots for navigation (view-specific)
                const hotspotsToUse = viewParam === 'present' ? finalPres : finalArch;
                const formatted = hotspotsToUse.map((h, index) => ({
                    ...h,
                    number: h.number || index + 1
                })).sort((a, b) => (a.number || 0) - (b.number || 0));

                setAllHotspots(formatted);

            } catch (error) {
                console.error("Error fetching sthana:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTemple();
    }, [id, sthanaId, viewParam]);

    // Derived State for Images
    const presentImages = hotspot?.images || (hotspot?.image ? [hotspot.image] : []) || [];
    const oldImages = hotspot?.oldImages || [];

    // Fallback if no images found for the selected mode
    const displayImages = viewMode === 'present'
        ? (presentImages.length > 0 ? presentImages : ["https://placehold.co/600x400/png?text=No+Present+Image"])
        : (oldImages.length > 0 ? oldImages : ["https://placehold.co/600x400/png?text=No+Old+Image"]);

    // Reset image index when swiching modes
    useEffect(() => {
        setCurrentImageIndex(0);
    }, [viewMode]);

    const nextImage = () => setCurrentImageIndex((p) => (p + 1) % displayImages.length);
    const prevImage = () => setCurrentImageIndex((p) => (p - 1 + displayImages.length) % displayImages.length);

    const currentIndex = allHotspots.findIndex(h => h.id === sthanaId);
    const prevSthana = currentIndex > 0 ? allHotspots[currentIndex - 1] : null;
    const nextSthana = currentIndex < allHotspots.length - 1 ? allHotspots[currentIndex + 1] : null;

    if (loading) return <div className="min-h-full flex-1 bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;
    if (!hotspot) return <div className="min-h-full flex-1 flex items-center justify-center text-foreground">{t('temple.noSthanFound')}</div>;

    return (
        <div className="min-h-full flex-1 bg-background flex flex-col animate-in fade-in duration-300">
            {/* Header */}
            <div
                className="sticky top-0 z-[1000] px-2 bg-card shadow-sm border-b border-border py-4 md:py-5"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Mobile: All in one row */}
                <div className="md:hidden flex items-center gap-3 w-full">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/temple/${id}/architecture-view?view=${viewParam}`, { replace: true })} className="-ml-2 hover:bg-accent/10 shrink-0 bg-accent/5 h-9 w-9 rounded-full">
                        <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-foreground" />
                    </Button>
                    <div className="flex w-7 h-7 rounded-full bg-amber-500/10 text-amber-600 border border-amber-200 font-bold items-center justify-center text-sm shrink-0">
                        {hotspot.number}
                    </div>
                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-amber-600 dark:text-foreground font-serif leading-tight truncate flex-1 tracking-wide">
                        {hotspot.title}
                    </h1>
                </div>


                {/* Desktop: Existing layout */}
                <div className="hidden md:flex items-center justify-center relative">
                    <div className="absolute left-6 flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate(`/temple/${id}/architecture-view?view=${viewParam}`, { replace: true })} className="-ml-2 hover:bg-accent/10 shrink-0 bg-accent/5 h-10 w-10 rounded-full">
                            <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-foreground" />
                        </Button>
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 border border-amber-200 font-bold flex items-center justify-center text-lg">
                            {hotspot.number}
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-heading font-bold text-amber-600 dark:text-primary text-center px-16 leading-tight max-w-2xl truncate font-serif tracking-wide">
                        {hotspot.title}
                    </h1>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-20">
                <div className="max-w-3xl mx-auto w-full px-0 md:px-4 pb-4 py-1 space-y-2 md:space-y-3">

                    {/* Sthana Navigation Pagination (Refined Theme) */}
                    <div className="flex items-center justify-between max-w-sm mx-auto px-4 w-full mt-2 mb-2">
                        <button
                            onClick={() => prevSthana && navigate(`/temple/${id}/architecture/sthana/${prevSthana.id}?view=${viewParam}`, { replace: true })}
                            disabled={!prevSthana}
                            className={`w-28 h-10 border rounded-full duration-150 transition-all flex items-center justify-center font-bold text-sm ${!prevSthana
                                ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                                : 'border-landing-primary dark:border-primary text-landing-primary dark:text-primary bg-transparent hover:bg-accent/5 active:bg-accent/10'
                                }`}
                        >
                            {t('common.previous')}
                        </button>

                        <div className="text-landing-primary dark:text-primary font-bold text-sm whitespace-nowrap px-4">
                            {t('common.pageOf', { current: currentIndex + 1, total: allHotspots.length })}
                        </div>

                        <button
                            onClick={() => nextSthana && navigate(`/temple/${id}/architecture/sthana/${nextSthana.id}?view=${viewParam}`, { replace: true })}
                            disabled={!nextSthana}
                            className={`w-28 h-10 border rounded-full duration-150 transition-all flex items-center justify-center font-bold text-sm ${!nextSthana
                                ? 'border-border text-muted-foreground cursor-not-allowed opacity-50'
                                : 'border-landing-primary dark:border-primary text-landing-primary dark:text-primary bg-transparent hover:bg-accent/5 active:bg-accent/10'
                                }`}
                        >
                            {t('common.next')}
                        </button>
                    </div>

                    {/* Image Viewer */}
                    <div className="px-2 md:px-0">
                        <div className="relative aspect-[4/3] w-full max-w-7xl mx-auto rounded-2xl overflow-hidden border-4 border-card bg-muted group flex items-center justify-center">
                            <img
                                src={displayImages[currentImageIndex]}
                                alt={hotspot.title}
                                className={cn(
                                    "cursor-pointer transition-all duration-500 object-center",
                                    hotspot.fitMode === 'cover' ? "w-full h-full object-cover" : "max-w-full max-h-full object-contain"
                                )}
                                onClick={() => setIsImageModalOpen(true)}
                            />
                            {displayImages.length > 1 && (
                                <>
                                    <button onClick={prevImage} className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md">
                                        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                                    </button>
                                    <button onClick={nextImage} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md">
                                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                                    </button>
                                    {/* Indicator Dots */}
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                        {displayImages.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-accent-gold w-4' : 'bg-white/50'}`}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}

                            {/* Label for Old Images Mode */}
                            {viewMode === 'old' && (
                                <div className="absolute top-4 right-4 bg-accent-gold text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider">
                                    {t('temple.oldImage')}
                                </div>
                            )}
                        </div>
                    </div>



                    {/* Bottom Slider: Details vs Leela */}
                    <div className="flex justify-center px-2 md:px-0 py-2">
                        <div className="flex w-full max-w-sm rounded-full border border-border bg-card shadow-sm overflow-hidden text-sm md:text-base">
                            <button
                                onClick={() => setContentMode('details')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold transition-all border-r border-border last:border-r-0 ${contentMode === 'details'
                                    ? 'bg-landing-primary text-white'
                                    : 'bg-card text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {t('common.details')}
                            </button>
                            <button
                                onClick={() => setContentMode('leela')}
                                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold transition-all border-r border-border last:border-r-0 ${contentMode === 'leela'
                                    ? 'bg-landing-primary text-white'
                                    : 'bg-card text-muted-foreground hover:bg-muted'
                                    }`}
                            >
                                {t('common.leela')}
                            </button>
                        </div>
                    </div>

                    {/* Content Display */}
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 px-2 md:px-0">
                        {contentMode === 'details' ? (
                            <div className="space-y-3">
                                {/* Significance */}
                                {/* Significance */}
                                <div className="pl-2">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-1 h-6 bg-amber-600"></div>
                                        <h3 className="text-blue-900 dark:text-primary font-bold tracking-widest text-xl">{hotspot.generalDescriptionTitle || t('common.description')}</h3>
                                    </div>
                                    <div className="bg-card border border-border rounded-xl p-4 shadow-sm relative z-10 space-y-4">
                                        <div>
                                            <SafeHTML html={hotspot.description || hotspot.significance || t('common.noInfo')} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="space-y-3 pb-4">
                                {/* Leela Section - Accordion Style */}
                                {(() => {
                                    // Sample data for demonstration if no data is found
                                    const sampleLeelas = [
                                        "पूर्बार्ध - 356) पुणतांबा गावाउत्तरे पाताळगुंफे वस्ति : ।। :",
                                        "पूर्बार्ध - 359) पुनरपि पुणतांबा पाताळगुंफे अवस्थान : ।। :",
                                        "पूर्बार्ध - 360) साळातीर्थ आसन : ।। :",
                                        "पूर्बार्ध - 361) कारटमढी आसन : ।। :"
                                    ];

                                    // Handle both array and string (split by newline if string)
                                    let leelas = Array.isArray(hotspot.leelas)
                                        ? hotspot.leelas
                                        : (hotspot.leela ? hotspot.leela.split('\n').filter((l: string) => l.trim()) : []);

                                    // If no leelas found, check legacy 'leela' property
                                    if (leelas.length === 0 && hotspot.leela) {
                                        leelas = hotspot.leela.split('\n').filter((l: string) => l.trim());
                                    }

                                    // If still no leelas found, use sample data for demo ONLY if strictly necessary
                                    // But let's prioritize showing actual data or empty state

                                    return leelas.map((leela: any, index: number) => {
                                        const leelaId = typeof leela === 'object' ? (leela.id || index.toString()) : index.toString();
                                        const content = typeof leela === 'object' ? leela.description : leela;
                                        const isExpanded = expandedLeelaId === leelaId;

                                        return (
                                            <div
                                                key={leelaId}
                                                className={`overflow-hidden transition-all duration-300 rounded-2xl border ${isExpanded
                                                    ? 'border-accent/20 bg-accent/5 shadow-md mb-4'
                                                    : 'border-[0.5px] border-border bg-card hover:bg-accent/5 hover:border-accent/20 mb-2'
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => setExpandedLeelaId(isExpanded ? null : leelaId)}
                                                    className={`w-full flex items-center justify-between p-4 text-left gap-4 transition-colors bg-transparent`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold text-xs shrink-0">
                                                            {index + 1}
                                                        </span>
                                                        <span className={`font-serif text-lg leading-snug transition-colors duration-200 text-amber-600 dark:text-foreground font-bold`}>
                                                            {((typeof leela === 'object' && leela.title) ? leela.title : `${t('common.leela')} ${index + 1}`)}
                                                        </span>
                                                    </div>
                                                    <div className={`shrink-0 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-accent-gold' : 'text-muted-foreground'}`}>
                                                        <ChevronDown className="w-5 h-5" />
                                                    </div>
                                                </button>

                                                <div
                                                    className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[5000px] opacity-100 pb-5 px-5' : 'max-h-0 opacity-0'
                                                        }`}
                                                >
                                                    <div className="pt-2 border-t border-accent/10">
                                                        <SafeHTML html={content} />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        )}
                    </div>

                </div>
            </div>
            {/* Full-Screen Image Modal */}
            <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
                <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-none flex items-center justify-center">
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img
                            src={displayImages[currentImageIndex]}
                            alt={`${hotspot.title} - Full view`}
                            className="max-w-full max-h-[100vh] object-contain object-center"
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
                                            className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-accent-gold w-5' : 'bg-white/40'}`}
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
