import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { db } from "@/auth/firebase";
import { doc, getDoc } from "firebase/firestore";
import { X, ZoomIn, ZoomOut, RotateCcw, Info, ChevronLeft, BookOpen, ChevronDown, Eye, EyeOff, Maximize, Check, ChevronRight, ChevronUp, Expand, Image as ImageIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { Button1 } from "@/shared/components/ui/button-1";
import { Temple, AbbreviationItem, Hotspot, SthanDetail } from "@/types";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { SafeHTML } from "@/shared/components/ui/SafeHTML";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

// ... (rest of imports)

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverAnchor,
} from "@/shared/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";




export default function ArchitectureViewer() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const langCode = getLangCode(language);

  const [temple, setTemple] = useState<Temple | null>(null);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [presentHotspots, setPresentHotspots] = useState<Hotspot[]>([]); // New state for present hotspots
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [searchParams] = useSearchParams();
  const initialView = searchParams.get('view') as 'architectural' | 'present' | null;
  const [imageType, setImageType] = useState<'architectural' | 'present'>(initialView || 'architectural');
  const [architecturalImage, setArchitecturalImage] = useState<string>("");
  const [presentImage, setPresentImage] = useState<string>("");
  const [imageRatio, setImageRatio] = useState<number | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string | null>(null);
  const [selectionSource, setSelectionSource] = useState<'image' | 'list' | 'dropdown' | null>(null);
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);

  const [expandedHotspots, setExpandedHotspots] = useState<Record<string, boolean>>({});
  const [isPothiOpen, setIsPothiOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [abbreviationItems, setAbbreviationItems] = useState<AbbreviationItem[]>([]);

  const handleSelectHotspot = (id: string | null, source: 'image' | 'list' | 'dropdown' | null) => {
    setSelectedHotspotId(id);
    setSelectionSource(source);

    if (id && source && source !== 'image') {
      // Search in unified list to ensure cross-view selection works
      // For Present View, prioritize finding a matching presentHotspot to get correct imageIndex
      const h = imageType === 'present' 
        ? (presentHotspots.find(ph => ph.sthanaId === id || ph.id === id) || unifiedHotspots.find(hotspot => hotspot.id === id))
        : unifiedHotspots.find(hotspot => hotspot.id === id);

      if (h && (h.imageIndex !== undefined) && h.imageIndex !== currentImageIndex) {
        setCurrentImageIndex(h.imageIndex);
        handleResetOrientation();
      }
    }
  };

  const toggleHotspot = (id: string) => {
    setExpandedHotspots(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const sthanaListRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});



  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (selectedHotspotId) {
      const timeoutId = setTimeout(() => {
        if (selectionSource === 'image') {
          // 1. Scroll main page so that the image slider is visible (offset for header)
          const buttonsSection = document.getElementById('segmented-buttons-section');
          if (buttonsSection) {
            const headerOffset = 80;
            const elementPosition = buttonsSection.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }

          // 2. Scroll internal list to target card (which organically "hides" the description block by scrolling past it)
          // Translate present hotspot ID to base sthana ID if needed
          const ph = presentHotspots.find(h => h.id === selectedHotspotId);
          const scrollTargetId = (ph && ph.sthanaId) ? ph.sthanaId : selectedHotspotId;
          
          const targetCard = cardRefs.current[scrollTargetId];
          const container = sthanaListRef.current;
          if (targetCard && container) {
            const containerRect = container.getBoundingClientRect();
            const cardRect = targetCard.getBoundingClientRect();
            const scrollOffset = cardRect.top - containerRect.top + container.scrollTop;

            container.scrollTo({
              top: scrollOffset,
              behavior: 'smooth'
            });
          }
        } else if (selectionSource === 'list' || selectionSource === 'dropdown') {
          // Scroll main page up to image container
          if (imageContainerRef.current) {
            // Offset by header height
            const headerOffset = 80;
            const elementPosition = imageContainerRef.current.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
              top: offsetPosition,
              behavior: 'smooth'
            });
          }
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [selectedHotspotId, selectionSource]);

  // Touch state for pinch zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);
  const imageContainerRef = useRef<HTMLDivElement>(null);



  // Sync expanded states in pothi when open
  useEffect(() => {
    if (isPothiOpen && selectedHotspotId && (selectionSource === 'image' || selectionSource === 'list')) {
      setExpandedHotspots(prev => ({ ...prev, [selectedHotspotId]: true }));
    }
  }, [selectedHotspotId, selectionSource, isPothiOpen]);

  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

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

        // Get architectural and present images
        // Get architectural and present images
        const archImg = data.architectureImage || "";
        const presImg = data.presentImage || "";
        const archImgs = data.architectureImages || [];
        const presImgs = data.presentImages || [];

        setArchitecturalImage(archImg);
        setPresentImage(presImg);
        // We'll store supplemental images in the temple object or local state if needed
        // But for now, temple state already has them through data.
        setTemple({
          ...data,
          architectureImages: archImgs,
          presentImages: presImgs
        });

        // Architecture Hotspots: Read directly from the main document's `hotspots` array.
        // This is the canonical source — the admin always writes here on every save.
        // The `architecture_hotspots` subcollection is a legacy/partial write path (only
        // updated during repositioning) and must NOT be used as primary source.
        const rawArchHotspots: any[] = data.hotspots || [];

        // Deduplicate by id as a safeguard
        const uniqueArchHotspots = Array.from(new Map(rawArchHotspots.map(h => [h.id, h])).values());
        const archHotspotsWithNumbers = uniqueArchHotspots.map((h, index) => ({
          ...h,
          number: h.number ?? index + 1
        }));
        setHotspots(archHotspotsWithNumbers as Hotspot[]);

        // Present Hotspots: Read directly from the main document's `present_hotspots` array.
        const rawPresentHotspots: any[] = data.present_hotspots || data.presentHotspots || [];
        const presentHotspotsWithNumbers = rawPresentHotspots.map((h, index) => ({
          ...h,
          number: h.number ?? index + 1
        }));
        setPresentHotspots(presentHotspotsWithNumbers as Hotspot[]);
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

  const displayImages = imageType === 'architectural'
    ? (temple?.architectureImages && temple.architectureImages.length > 0
      ? temple.architectureImages
      : (architecturalImage ? [architecturalImage] : []))
    : (temple?.presentImages && temple.presentImages.length > 0
      ? temple.presentImages
      : (presentImage ? [presentImage] : []));

  const imageUrl = displayImages[currentImageIndex] || "";

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((p) => (p + 1) % displayImages.length);
    handleResetOrientation();
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentImageIndex((p) => (p - 1 + displayImages.length) % displayImages.length);
    handleResetOrientation();
  };

  // Update image when type changes
  useEffect(() => {
    setCurrentImageIndex(0);
    handleResetOrientation();
    setImageRatio(null);
  }, [imageType]);

  // Create unified hotspots list for Pothi and List
  const unifiedHotspots = (() => {
    // Architecture hotspots are the primary definitions
    const baseArch = hotspots.map(h => ({ ...h, isPresent: false }));

    // Present hotspots are mappings that inherit from Architecture
    const mergedPresent = presentHotspots.map(ph => {
      const source = hotspots.find(ah => ah.id === ph.sthanaId || ah.id === ph.id);
      return {
        ...source,
        ...ph, // Overrides x, y, order, imageIndex, and any Present-specific data
        isPresent: true
      };
    });

    const combined = [...baseArch, ...mergedPresent];
    const unique = Array.from(new Map(combined.map(h => [h.id, h])).values());
    return unique.sort((a, b) => (a.number || 0) - (b.number || 0));
  })();

  // NEW: Support for dynamic details array
  const displayDetails = (() => {
    if (temple?.details && temple.details.length > 0) {
      return temple.details.map((d, index) => {
        const linkedMapMarker = unifiedHotspots.find(h => h.id === d.hotspotId || h.id === d.id);
        return {
          ...d,
          targetId: d.hotspotId || d.id, // standardized ID for selection matching
          number: linkedMapMarker?.number || (index + 1),
          hasMapMarker: !!linkedMapMarker
        };
      });
    }
    // Legacy fallback: for old temples that haven't been migrated to Sthan details yet
    return unifiedHotspots.map(h => ({
      ...h as any,
      targetId: h.id,
      hasMapMarker: true
    }));
  })();

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetOrientation = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch handlers for mobile pinch zoom
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance) {
      e.preventDefault();
      const distance = getTouchDistance(e.touches);
      const scale = distance / initialPinchDistance;
      setZoom(Math.min(Math.max(initialZoom * scale, 0.5), 3));
    } else if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.current.x,
        y: e.touches[0].clientY - dragStart.current.y
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  };

  const toggleFullScreen = () => {
    handleResetOrientation(); // Reset zoom/pan for correctness
    if (!isFullScreen && imageContainerRef.current) {
      if (imageContainerRef.current.requestFullscreen) {
        imageContainerRef.current.requestFullscreen();
      }
      setIsFullScreen(true);
    } else if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullScreen(false);
    }
  };

  // Navigate to Detail Page
  const handleNavigationToDetail = (hotspot: Hotspot) => {
    navigate(`/temple/${id}/architecture/sthana/${hotspot.id}?view=${imageType}`);
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
    <div
      className="min-h-full flex-1 pb-8 overflow-x-hidden animate-in fade-in duration-300"
      onClick={() => handleSelectHotspot(null, null)}
    >

      {/* Header: Back, Heading, 'i' */}
      <div
        className="sticky top-0 z-[1000] px-2 bg-white shadow-sm border-b border-[#c7c6c6] py-3"
      >
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <Button
            variant="ghost"
            size="icon"
            className="-ml-2 hover:bg-black/5 shrink-0 bg-white/80"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              setSelectedHotspotId(null);
              navigate(`/temple/${id}/architecture`);
            }}
          >
            <ChevronLeft className="w-7 h-7 text-[#0f3c6e]" />
          </Button>
          <h1 className="flex-1 font-heading font-bold text-xl md:text-2xl text-[#0f3c6e] font-serif truncate leading-tight">
            {getTranslatedValue(temple.name, langCode)}
          </h1>

          {abbreviationItems && abbreviationItems.length > 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/90 transition-all duration-300 hover:bg-slate-50 text-blue-900 shadow-md border border-slate-200 shrink-0">
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
                      <span className="flex-1">{getTranslatedValue(item.description, langCode)}</span>
                    </div>
                  ))}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div
        className="px-4 lg:px-6 space-y-4 md:space-y-4 mt-2 md:mt-4 max-w-6xl mx-auto pb-12"
      >
        {/* Image Type Segmented Buttons */}
        <div id="segmented-buttons-section" className="flex justify-center w-full">
          <div className="flex w-full max-w-sm rounded-full border border-slate-300 bg-white shadow-md overflow-hidden text-sm md:text-base">
            <button
              onClick={() => setImageType('architectural')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold transition-all border-r border-slate-200 last:border-r-0 ${imageType === 'architectural'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
            >
              {t('temple.architecturalView')}
            </button>
            <button
              onClick={() => setImageType('present')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 font-bold transition-all border-r border-slate-200 last:border-r-0 ${imageType === 'present'
                ? 'bg-blue-900 text-white'
                : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
            >
              {t('temple.presentView')}
            </button>
          </div>
        </div>

        {/* Image Viewer */}
        <div className="flex justify-center">
          <div
            ref={imageContainerRef}
            className="relative aspect-square md:aspect-[4/3] w-full max-w-7xl mx-auto rounded-2xl overflow-hidden border-4 border-white bg-slate-50 group touch-none transition-all duration-500 ease-in-out"
          >
            <div
              className={cn("w-full h-full", imageUrl ? "cursor-move" : "cursor-default")}
              onMouseDown={imageUrl ? handleMouseDown : undefined}
              onMouseMove={imageUrl ? handleMouseMove : undefined}
              onMouseUp={imageUrl ? handleMouseUp : undefined}
              onMouseLeave={imageUrl ? handleMouseUp : undefined}
              onTouchStart={imageUrl ? handleTouchStart : undefined}
              onTouchMove={imageUrl ? handleTouchMove : undefined}
              onTouchEnd={imageUrl ? handleTouchEnd : undefined}
              onClick={(e) => {
                // Coordinate capture for backend support
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                console.log(`Clicked coordinates: x: ${x.toFixed(2)}%, y: ${y.toFixed(2)}%`);
                handleSelectHotspot(null, null);
              }}
            >
              <div
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                }}
                className="relative w-full h-full flex items-center justify-center"
              >
                <div
                  className="relative transition-all duration-500"
                  style={{
                    aspectRatio: (imageType === 'architectural' ? temple.architectureImagesFitMode : temple.presentImagesFitMode) === 'cover' ? 'auto' : (imageRatio || 'auto'),
                    maxWidth: '100%',
                    maxHeight: '100%',
                    width: (imageType === 'architectural' ? temple.architectureImagesFitMode : temple.presentImagesFitMode) === 'cover'
                      ? '100%'
                      : (imageRatio && imageRatio > (imageContainerRef.current?.clientWidth || 1) / (imageContainerRef.current?.clientHeight || 1) ? '100%' : 'auto'),
                    height: (imageType === 'architectural' ? temple.architectureImagesFitMode : temple.presentImagesFitMode) === 'cover'
                      ? '100%'
                      : (imageRatio && imageRatio <= (imageContainerRef.current?.clientWidth || 1) / (imageContainerRef.current?.clientHeight || 1) ? '100%' : 'auto'),
                    margin: 'auto'
                  }}
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`${getTranslatedValue(temple.name, langCode)} Architecture`}
                      className={cn(
                        "block select-none transition-all duration-500 object-center mx-auto",
                        imageType === 'architectural'
                          ? (temple.architectureImagesFitMode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain')
                          : (temple.presentImagesFitMode === 'cover' ? 'w-full h-full object-cover' : 'max-w-full max-h-full object-contain')
                      )}
                      draggable={false}
                      onLoad={(e) => setImageRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/90 text-slate-300 p-4 md:p-8 text-center transition-all duration-500">
                      <div className="w-12 h-12 md:w-20 md:h-20 mb-4 md:mb-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 shadow-2xl animate-pulse">
                        <ImageIcon className="w-6 h-6 md:w-10 md:h-10 opacity-40" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold font-serif mb-2 tracking-wide">
                        {imageType === 'architectural' ? t('temple.archSection') : t('temple.presSection')}
                      </h3>
                      <p className="text-base md:text-lg opacity-60 font-medium">
                        {imageType === 'architectural'
                          ? t('temple.noArchVisuals')
                          : t('temple.noPresPhotos')}
                      </p>
                      <p className="text-[10px] md:text-sm mt-4 opacity-40 italic">
                        {t('temple.updateInProgress')}
                      </p>
                    </div>
                  )}

                  {displayImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md z-[60] pointer-events-auto"
                      >
                        <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md z-[60] pointer-events-auto"
                      >
                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10" strokeWidth={3} />
                      </button>
                      {/* Indicator Dots */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-[60]">
                        {displayImages.map((_, idx) => (
                          <div
                            key={idx}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentImageIndex ? 'bg-amber-500 w-4' : 'bg-white/50'}`}
                          />
                        ))}
                      </div>
                      <div className="absolute top-4 left-4 bg-black/40 text-white text-[10px] px-2 py-0.5 rounded-full z-[60] backdrop-blur-sm">
                        {t('common.pageOf', { current: currentImageIndex + 1, total: displayImages.length })}
                      </div>
                    </>
                  )}

                  {/* Hotspot Rendering */}
                  {(() => {
                    const activeHotspots = imageType === 'architectural'
                      ? hotspots.filter(h => (h.imageIndex || 0) === currentImageIndex)
                      : presentHotspots
                        .filter(ph => (ph.imageIndex || 0) === currentImageIndex)
                        .map(ph => {
                          const source = hotspots.find(ah => ah.id === ph.sthanaId || ah.id === ph.id);
                          return { ...source, ...ph, isPresent: true };
                        });

                    return (showHotspots || selectedHotspotId) && activeHotspots
                      .map((hotspot) => {                        const isSelected = selectedHotspotId === hotspot.id || (hotspot.sthanaId && selectedHotspotId === hotspot.sthanaId);
                        const isHovered = hoveredHotspotId === hotspot.id || (hotspot.sthanaId && hoveredHotspotId === hotspot.sthanaId);

                        // Hotspot is active (highlighted) if:
                        // 1. Hovered (either directly or via list)
                        // 2. Selected from image/list
                        // 3. Selected from dropdown AND dropdown is open
                        const isActive = isHovered || (isSelected && (
                          selectionSource !== 'dropdown' || isPothiOpen
                        ));

                        // Hotspot is visible if showHotspots is on, OR if it's the active one
                        const isVisible = showHotspots || isActive;
                        if (!isVisible) return null;

                        return (
                          <div
                            key={hotspot.id}
                            className={`absolute pointer-events-none ${isActive ? 'z-50' : 'z-10'}`}
                            style={{
                              left: `${hotspot.x}%`,
                              top: `${hotspot.y}%`,
                              transform: 'translate(-50%, -50%)',
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <div
                              className="absolute w-8 h-8 md:w-10 md:h-10 rounded-full z-[70] cursor-pointer pointer-events-auto"
                              style={{ transform: 'translate(-50%, -50%)', left: '50%', top: '50%' }}
                              onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                              onMouseLeave={() => setHoveredHotspotId(null)}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectHotspot(isSelected ? null : hotspot.id, isSelected ? null : 'image');
                              }}
                            />

                            <div className="relative flex items-center justify-center">
                              {/* Pulse Effect for Active Hotspot */}
                              {isActive && (
                                <div className="absolute inset-0 w-8 h-8 md:w-10 md:h-10 rounded-full bg-amber-500/40 animate-ping z-0" />
                              )}
                              
                              <svg
                                width={isActive ? "32" : "24"}
                                height={isActive ? "40" : "30"}
                                viewBox="0 0 32 40"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={cn(
                                  "drop-shadow-md transition-all duration-300 relative z-[1]",
                                  isActive ? 'text-amber-600 scale-110' : 'text-[#0f3c6e]'
                                )}
                              >
                                <path
                                  d="M16 0C7.16344 0 0 7.16344 0 16C0 24.8366 16 40 16 40C16 40 32 24.8366 32 16C32 7.16344 24.8366 0 16 0Z"
                                  fill="currentColor"
                                />
                                <circle
                                  cx="16"
                                  cy="16"
                                  r="11"
                                  fill="currentColor"
                                  opacity="1"
                                />
                              </svg>

                              <span className={cn(
                                "absolute font-bold transition-all duration-300 text-white z-[2]",
                                isActive
                                  ? "text-xs top-[7px]"
                                  : "text-[10px] top-[4px]"
                              )} style={{ left: '50%', transform: 'translateX(-50%)' }}>
                                {hotspot.number}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  })()}
                </div>
              </div>
            </div>

            <>
              {isFullScreen ? (
                <>
                  <div className="absolute right-4 top-4 z-10 flex gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full shadow-lg bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md border border-white/20"
                      onClick={() => setShowHotspots(!showHotspots)}
                      title={showHotspots ? t('temple.hideHotspots') : t('temple.showHotspots')}
                    >
                      {showHotspots ? <Eye className="w-5 h-5 text-white" /> : <EyeOff className="w-5 h-5 text-white" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20"
                      onClick={toggleFullScreen}
                      title="Exit Full Screen"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-3">
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20" onClick={handleZoomIn}>
                      <ZoomIn className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20" onClick={handleZoomOut}>
                      <ZoomOut className="w-5 h-5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20" onClick={handleResetOrientation}>
                      <RotateCcw className="w-5 h-5" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute right-4 top-4 z-10">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded-full shadow-lg bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md border border-white/20"
                      onClick={() => setShowHotspots(!showHotspots)}
                      title={showHotspots ? t('temple.hideHotspots') : t('temple.showHotspots')}
                    >
                      {showHotspots ? <Eye className="w-4 h-4 text-white" /> : <EyeOff className="w-4 h-4 text-white" />}
                    </Button>
                  </div>
                  <div className="absolute right-4 bottom-4 z-10 flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20" onClick={handleResetOrientation} title="Reset">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full shadow-lg bg-slate-600/50 hover:bg-slate-600/50 text-white backdrop-blur-md border border-white/20" onClick={toggleFullScreen} title="Interactive Full Screen">
                      <Maximize className="w-4 h-4" />
                    </Button>
                  </div>
                </>
              )}
            </>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-4">
          {/* Sthan Pothi Dropdown - Using Popover for Anchor support */}
          <Popover onOpenChange={(open) => {
            setIsPothiOpen(open);
            if (!open) {
              setExpandedHotspots({});
            }
            if (open) {
              setTimeout(() => {
                if (selectedHotspotId) {
                  const selectedEl = document.getElementById(`pothi-item-${selectedHotspotId}`);
                  if (selectedEl) {
                    selectedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                } else {
                  const section = document.getElementById('segmented-buttons-section');
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }, 100);
            }
          }}>
            <PopoverAnchor asChild>
              <div
                id="sthan-pothi-trigger"
                className="w-full h-12 md:h-14 bg-blue-900 text-white rounded-2xl shadow-md flex items-center justify-between p-0 border border-blue-800 group transition-all focus:outline-none overflow-hidden"
              >
                <div
                  className="flex-1 flex items-center gap-3 h-full pl-6 cursor-default"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                >
                  <BookOpen className="w-6 h-6 text-white" />
                  <span className="font-heading font-bold tracking-wider text-base md:text-lg">{t('temple.sthanPothi')}</span>
                </div>
                <PopoverTrigger asChild>
                  <div className="h-full flex items-center justify-center px-6 border-l border-blue-800 hover:bg-blue-800 transition-colors cursor-pointer">
                    <ChevronDown className={`w-6 h-6 text-white opacity-80 group-hover:opacity-100 transition-all duration-300 ${isPothiOpen ? 'rotate-180' : ''}`} />
                  </div>
                </PopoverTrigger>
              </div>
            </PopoverAnchor>
            <PopoverContent
              side="bottom"
              align="center"
              avoidCollisions={false}
              sideOffset={8}
              className="w-[var(--radix-popover-trigger-width)] max-h-[75vh] md:max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl border-blue-50 z-50 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="flex flex-col">
                {displayDetails.map((d) => {
                  const isExpanded = expandedHotspots[d.id];
                  const isSelectedInPothi = selectedHotspotId === d.targetId || 
                                          selectedHotspotId === d.id || 
                                          presentHotspots.some(ph => ph.id === selectedHotspotId && ph.sthanaId === d.targetId);
                  return (
                    <div
                      key={d.id}
                      id={`pothi-item-${d.targetId}`}
                      className="border-b border-slate-50 last:border-0 transition-all"
                    >
                      <div
                        className={`h-12 md:h-14 flex items-center justify-between gap-3 px-0 py-1 rounded-xl group cursor-pointer transition-all duration-300 ${isSelectedInPothi ? 'bg-amber-50/50 shadow-sm' : 'hover:bg-amber-50/40'}`}
                        onClick={(e) => {
                          e.preventDefault();
                    handleSelectHotspot(d.targetId, 'dropdown');
                    toggleHotspot(d.id);
                  }}
                  onMouseEnter={() => setHoveredHotspotId(d.targetId)}
                  onMouseLeave={() => setHoveredHotspotId(null)}
                >
                  <div className="flex-1 min-w-0 px-1 py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-1 h-6 bg-amber-600 shrink-0"></div>
                            <h4 className={`font-heading font-bold text-xl tracking-wider transition-colors truncate ${isSelectedInPothi ? 'text-amber-700' : 'text-blue-900 group-hover:text-amber-700'}`}>{getTranslatedValue(d.title, langCode)}</h4>
                            {d.hasMapMarker && (
                              <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-800 shrink-0">
                                {d.number}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all bg-transparent border-none">
                          <ChevronDown className={`w-4 h-4 text-amber-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-2 pb-3 pt-2">
                          <div className="text-lg text-slate-600 font-serif leading-relaxed pl-3.5 animate-in fade-in slide-in-from-top-1 duration-200">
                            <SafeHTML html={getTranslatedValue(d.sthanPothiDescription, langCode) || getTranslatedValue(d.description, langCode) || t('temple.pothiUpdateInfo')} />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {unifiedHotspots.length === 0 && (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BookOpen className="w-6 h-6 text-slate-300" />
                    </div>
                    <p className="text-lg text-slate-400 italic font-serif">{t('temple.pothiEmptyInfo')}</p>
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>

          {/* Sthans Overview & List - Combined Scrollable Area */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-amber-600"></div>
              <h3 className="font-heading text-xl font-bold text-blue-900">{t('temple.sthanDescription')}</h3>
            </div>

            <div
              ref={sthanaListRef}
              className="h-[500px] overflow-y-auto scroll-smooth pr-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              <div className="space-y-4 pb-[450px]">
                {/* Description Card */}
                <div className="bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100/50 text-base text-slate-600 leading-relaxed">
                  <SafeHTML html={getTranslatedValue(temple.architectureDescription, langCode) || t('temple.noArchDescription')} />
                </div>

                {/* Additional Content Blocks (Step 1 & 2 Filtered) */}
                {(temple.descriptionSections?.some(s => (s.page_type || 'page1') === 'page2') || 
                  temple.customBlocks?.some(b => (b.page_type || 'page2') === 'page2')) && (
                  <div className="space-y-5">
                    {temple.descriptionSections
                      ?.filter(section => (section.page_type || 'page1') === 'page2')
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((section) => (
                        <div key={section.id} className="space-y-2">
                          <h4 className="font-heading font-bold text-blue-900 border-l-4 border-amber-600 pl-3 leading-none">
                            {getTranslatedValue(section.title, langCode)}
                          </h4>
                          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100/50 shadow-sm">
                            <SafeHTML html={getTranslatedValue(section.content, langCode)} />
                          </div>
                        </div>
                      ))
                    }
                    {temple.customBlocks
                      ?.filter(block => (block.page_type || 'page2') === 'page2')
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((block) => (
                        <div key={block.id} className="space-y-2">
                          <h4 className="font-heading font-bold text-blue-900 border-l-4 border-amber-600 pl-3 leading-none">
                            {getTranslatedValue(block.title, langCode)}
                          </h4>
                          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-100/50 shadow-sm">
                            <SafeHTML html={getTranslatedValue(block.content, langCode)} />
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )}

                {/* Sthana List Heading */}
                <div className="flex items-center gap-3 pt-4 pb-2">
                  <div className="w-1 h-6 bg-amber-600"></div>
                  <h4 className="font-heading text-xl font-bold text-blue-900">{t('temple.differentSthans')}</h4>
                </div>

                {/* Sthana List */}
                <div className="flex flex-col gap-2 md:gap-4">
                  {displayDetails.map((d) => {
                    const isSelected = selectedHotspotId === d.targetId || 
                                     selectedHotspotId === d.id || 
                                     presentHotspots.some(ph => ph.id === selectedHotspotId && ph.sthanaId === d.targetId);

                    return (
                      <div
                        key={d.id}
                        ref={(el) => (cardRefs.current[d.targetId] = el)}
                        id={`sthana-card-${d.targetId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectHotspot(isSelected ? null : d.targetId, isSelected ? null : 'list');
                        }}
                        className={`w-full h-12 md:h-14 flex flex-row items-center justify-between px-3 md:px-6 py-1 bg-white rounded-2xl transition-all duration-300 group cursor-pointer shadow-sm border border-slate-100 ${isSelected
                          ? 'bg-amber-50 border-amber-200'
                          : 'hover:bg-slate-50 hover:border-amber-200'
                          }`}
                        onMouseEnter={() => setHoveredHotspotId(d.targetId)}
                        onMouseLeave={() => setHoveredHotspotId(null)}
                      >
                        <div className="flex-1 h-full flex items-center px-1 py-2 gap-2 overflow-hidden">
                          <div className={`w-8 h-8 rounded-full font-bold flex items-center justify-center border shrink-0 text-sm md:text-base transition-all duration-200 ${isSelected
                            ? 'bg-amber-600 text-white border-amber-600'
                            : ' text-amber-600 border-amber-600 group-hover:bg-amber-600 group-hover:text-white group-hover:border-amber-600'
                            }`}>
                            {d.number || "S"}
                          </div>
                          <span className={`font-heading font-bold text-xl md:text-2xl leading-tight line-clamp-1 transition-colors duration-200 truncate ${isSelected
                            ? 'text-amber-700'
                            : 'text-blue-900 group-hover:text-amber-700'
                            }`}>
                            {getTranslatedValue(d.title, langCode)}
                          </span>
                        </div>
                        <div
                          className={`flex items-center justify-center w-12 md:w-16 h-full transition-all duration-300 rounded-r-2xl ${isSelected ? 'bg-amber-50/50' : 'hover:bg-slate-50'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/temple/${id}/architecture/sthana/${d.id}?view=${imageType}`);
                          }}
                        >
                          <ChevronRight className={`w-5 h-5 transition-all duration-300 group-hover:translate-x-1 ${isSelected
                            ? 'text-amber-600'
                            : 'text-amber-700 lg:text-slate-300 lg:group-hover:text-amber-500'
                            }`} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Back to Top Button */}
                <div className="flex flex-col items-center gap-2 pt-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-10 h-10 rounded-full border border-amber-600/40 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800 transition-all shadow-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      sthanaListRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    <ChevronUp className="w-5 h-5" />
                  </Button>
                  <span className="text-xs text-slate-400 font-serif italic">{t('common.backToTop')}</span>
                </div>
              </div>

              {displayDetails.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No sthana details found.</p>
              )}
            </div>
          </div>
        </div>

        {/* Full-Screen Image Modal */}
        <Dialog open={isImageModalOpen} onOpenChange={setIsImageModalOpen}>
          <DialogContent className="max-w-[100vw] max-h-[100vh] w-full h-full p-0 bg-black/95 border-none flex items-center justify-center">
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={imageUrl}
                alt={`${getTranslatedValue(temple?.name, langCode)} - Full view`}
                className="max-w-full max-h-[100vh] object-contain object-center"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/placeholder-temple.jpg';
                }}
              />

              {/* Close Button - High Z-index and responsive */}
              <button
                onClick={() => setIsImageModalOpen(false)}
                className="absolute top-4 right-4 z-[1002] w-10 h-10 rounded-full bg-slate-600/50 hover:bg-slate-600/70 text-white flex items-center justify-center backdrop-blur-sm transition-all shadow-lg border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation Arrows inside Modal */}
              {displayImages.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[1002] w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md bg-slate-600/50 hover:bg-slate-600/70 rounded-full backdrop-blur-sm"
                  >
                    <ChevronLeft className="w-10 h-10" strokeWidth={3} />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[1002] w-12 h-12 flex items-center justify-center text-white/90 hover:text-white transition-all hover:scale-110 drop-shadow-md bg-slate-600/50 hover:bg-slate-600/70 rounded-full backdrop-blur-sm"
                  >
                    <ChevronRight className="w-10 h-10" strokeWidth={3} />
                  </button>

                  {/* Indicator Dots inside Modal */}
                  <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-[1002]">
                    {displayImages.map((_, idx) => (
                      <div
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${idx === currentImageIndex ? 'bg-slate-500 w-5' : 'bg-white/40'}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
