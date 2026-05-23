import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, GripHorizontal, ChevronRight, ExternalLink, Loader2, Navigation2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import YatraMapMapLibre from "@/shared/components/features/YatraMapMapLibre";
import type { YatraLocation } from "@/shared/components/features/YatraMap";
import { Card } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import { Progress } from "@/shared/components/ui/progress";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

import { useYatraPlaces } from "@/shared/hooks/useYatraPlaces";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { cn } from "@/shared/lib/utils";
import { getLocationUrl } from "@/shared/utils/locationUtils";

import { APIProvider } from "@vis.gl/react-google-maps";
import { TempleSearch } from "@/shared/components/features/TempleSearch";

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const ROUTES = [
    {
        id: "swami-complete",
        name: "Shri Chakradhar Swami's complete journey",
        subRoutes: [
            { id: "ekant", name: "Ekant" },
            { id: "purvardh", name: "Purvardh" },
            { id: "uttarardh", name: "Uttarardh" }
        ]
    },
    { id: "dattatray", name: "Shri Dattatray Prabhu Viharan" },
    { id: "govind", name: "Shri Govind Prabhu Viharan" },
    { id: "chakrapani", name: "Shri Chakrapani Prabhu Viharan" },
    { id: "krishna", name: "Shri Krishan Bhagwan Viharan" }
];

const SwamiYatra = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const langCode = getLangCode(language);
    const { data: rawPlaces = [], isLoading } = useYatraPlaces();

    const [selectedRoute, setSelectedRoute] = useState(ROUTES[0].id);
    const [selectedSubRoute, setSelectedSubRoute] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [centerOnFullRoute, setCenterOnFullRoute] = useState(0);
    const [forceFocus, setForceFocus] = useState(0);
    const [searchedPlace, setSearchedPlace] = useState<any>(null);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [panelHeight, setPanelHeight] = useState(40);
    const [previousPanelHeight, setPreviousPanelHeight] = useState(40);
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            setPreviousPanelHeight(panelHeight);
            setIsFullScreen(true);
        } else {
            setPanelHeight(previousPanelHeight);
            setIsFullScreen(false);
        }
    };

    // 🕉️ Process and normalize places
    const places = useMemo(() => {
        return rawPlaces.map((data) => ({
            id: data.id,
            name: getTranslatedValue(data.name, langCode),
            latitude: data.latitude || 25.3176,
            longitude: data.longitude || 83.0062,
            sequence: data.sequence,
            status: (data.status === "visited" ? "completed" :
                ["stayed", "current", "revisited"].includes(data.status) ? "current" : "upcoming") as YatraLocation["status"],
            title: getTranslatedValue(data.name, langCode),
            description: getTranslatedValue(data.description, langCode) || t('yatra.description'),
            image: data.image || "/placeholder-temple.jpg",
            attendees: data.attendees || "",
            route: data.route,
            subRoute: data.subRoute,
            locationLink: data.locationLink,
            pinColor: data.pinColor,
            fitMode: data.fitMode || 'cover'
        }));
    }, [rawPlaces, langCode]);

    const filteredPlaces = useMemo(() => {
        let list = places.filter(p => {
            if (selectedRoute === "swami-complete") {
                if (selectedSubRoute) return p.subRoute === selectedSubRoute;
                return !p.route || p.route === "swami-complete";
            }
            return p.route === selectedRoute;
        });

        if (searchedPlace) {
            list = [...list, searchedPlace];
        }
        return list;
    }, [places, selectedRoute, selectedSubRoute, searchedPlace]);

    useEffect(() => {
        if (!searchedPlace) {
            setCurrentIndex(0);
        }
    }, [selectedRoute, selectedSubRoute]);

    const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
        if (place.geometry?.location) {
            const newPlace = {
                id: place.place_id || Date.now().toString(),
                name: place.name || "Searched Place",
                latitude: place.geometry.location.lat(),
                longitude: place.geometry.location.lng(),
                sequence: filteredPlaces.length + 1,
                status: "upcoming",
                title: place.name || "Searched Place",
                description: place.formatted_address || "A sacred location found via search.",
                image: place.photos?.[0]?.getUrl() || "/placeholder-temple.jpg",
                locationLink: place.url
            };
            setSearchedPlace(newPlace);
            // Move to this place
            setTimeout(() => {
                setCurrentIndex(filteredPlaces.length); // It will be added at the end
                setForceFocus(Date.now());
            }, 100);
        }
    };

    // Handle drag to resize panel
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;
            const windowHeight = window.innerHeight;
            const newHeight = ((windowHeight - e.clientY) / windowHeight) * 100;
            setPanelHeight(Math.min(Math.max(newHeight, 20), 80));
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging || !e.touches[0]) return;
            const windowHeight = window.innerHeight;
            const newHeight = ((windowHeight - e.touches[0].clientY) / windowHeight) * 100;
            setPanelHeight(Math.min(Math.max(newHeight, 20), 80));
        };

        const handleMouseUp = () => setIsDragging(false);

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleMouseUp);
        };
    }, [isDragging]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0f3c6e]" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">{t('yatra.navigatingSacredTrails')}</p>
                </div>
            </div>
        );
    }

    return (
        <APIProvider apiKey={apiKey}>
        <div className="h-[calc(100vh-5.5rem)] lg:h-screen w-full bg-background font-sans flex flex-col overflow-hidden">
            {!isFullScreen && (
                <div className="flex-shrink-0 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
                    <div className="px-4 py-2.5 sm:px-5 sm:py-4 flex items-center justify-between">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft className="w-6 h-6 sm:w-7 sm:h-7 text-landing-primary dark:text-primary" />
                        </Button>
                        <div className="flex-1 text-center">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font-serif">
                                {t('yatra.title')}
                            </h1>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full h-8 w-8 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-landing-primary dark:text-primary" />
                        </Button>
                    </div>

                    <div className="px-4 pb-2.5 sm:pb-3.5 flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                        <div className="flex-1">
                            <TempleSearch onPlaceSelect={handlePlaceSelect} />
                        </div>
                        <div className="w-full sm:w-72 relative">
                            <Select
                                value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                                onValueChange={(value) => {
                                    const [routeId, subRouteId] = value.split(":");
                                    setSelectedRoute(routeId);
                                    setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                                    setSearchedPlace(null);
                                }}
                            >
                                <SelectTrigger className="w-full h-10 sm:h-11 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-accent-gold/20 text-sm font-semibold text-landing-primary dark:text-primary rounded-2xl pl-4 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2 truncate">
                                        <Compass className="w-4 h-4 text-accent-gold" />
                                        <SelectValue placeholder={t('yatra.selectRoute')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border border-border/50 shadow-2xl backdrop-blur-xl">
                                    <SelectItem value="swami-complete" className="font-bold py-3 text-sm focus:bg-accent/5">{t('yatra.routes.swamiCompleteViharan')}</SelectItem>
                                    <SelectItem value="swami-complete:ekant" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">{t('yatra.routes.ekant')}</SelectItem>
                                    <SelectItem value="swami-complete:purvardh" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">{t('yatra.routes.purvardh')}</SelectItem>
                                    <SelectItem value="swami-complete:uttarardh" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">{t('yatra.routes.uttarardh')}</SelectItem>
                                    <div className="h-px bg-border/50 my-1 mx-2" />
                                    <SelectItem value="govind" className="font-bold py-2 text-sm focus:bg-accent/5">{t('yatra.routes.govind')}</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold py-2 text-sm focus:bg-accent/5">{t('yatra.routes.chakrapani')}</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold py-2 text-sm focus:bg-accent/5">{t('yatra.routes.dattatray')}</SelectItem>
                                    <SelectItem value="krishna" className="font-bold py-2 text-sm focus:bg-accent/5">{t('yatra.routes.krishna')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <div
                    className={`relative transition-all ${isDragging ? '' : 'duration-500 cubic-bezier(0.4, 0, 0.2, 1)'} ${isFullScreen
                        ? "fixed inset-0 w-screen h-screen z-[99999] rounded-none bg-slate-100"
                        : "w-full"
                        } bg-slate-100 overflow-hidden shadow-inner flex-1`}
                    style={!isFullScreen ? { height: `${100 - panelHeight}%` } : { height: '100%' }}
                >
                    <div className="w-full h-full scale-[1.01]">
                        <YatraMapMapLibre
                            locations={filteredPlaces}
                            highlightedId={filteredPlaces.at(currentIndex)?.id}
                            centerOnFullRoute={centerOnFullRoute}
                            forceFocus={forceFocus}
                        />
                    </div>

                    {!isFullScreen && (
                        <div className="absolute top-4 right-4 z-[400]">
                            {/* Removed CONFIRMED ROUTE badge as requested */}
                        </div>
                    )}

                    {isFullScreen && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="absolute top-6 left-6 z-[400] rounded-full bg-card/90 backdrop-blur-md hover:bg-card text-landing-primary h-12 w-12 shadow-2xl border border-border/50"
                            onClick={toggleFullScreen}
                        >
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                    )}

                    <div className="absolute top-6 right-6 z-[400] overflow-hidden">
                        <div className="flex flex-col bg-card/90 backdrop-blur-md rounded-2xl shadow-xl border border-border/50 divide-y divide-border/30">
                            <Button
                                variant="ghost"
                                size="icon"
                                title="Focus Current Location"
                                className="h-12 w-12 rounded-none hover:bg-primary/5 text-landing-primary transition-all active:scale-95"
                                onClick={() => setForceFocus(Date.now())}
                            >
                                <Navigation2 className="w-5 h-5" />
                            </Button>

                            <Button
                                variant="ghost"
                                size="icon"
                                title="View Full Route"
                                className="h-12 w-12 rounded-none hover:bg-primary/5 text-muted-foreground transition-all active:scale-95"
                                onClick={() => setCenterOnFullRoute(Date.now())}
                            >
                                <Compass className="w-5 h-5" />
                            </Button>
                            
                            <Button
                                variant="ghost"
                                size="icon"
                                title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                className="h-12 w-12 rounded-none hover:bg-primary/5 text-muted-foreground transition-all active:scale-95"
                                onClick={toggleFullScreen}
                            >
                                {isFullScreen ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M4 14h6v6" />
                                        <path d="M20 10h-6V4" />
                                        <path d="M14 10l7-7" />
                                        <path d="M3 21l7-7" />
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M15 3h6v6" />
                                        <path d="M9 21H3v-6" />
                                        <path d="M21 3l-7 7" />
                                        <path d="M3 21l7-7" />
                                    </svg>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>

                {!isFullScreen && (
                    <div
                        ref={dragRef}
                        onMouseDown={handleMouseDown}
                        onTouchStart={handleTouchStart}
                        className={`flex-shrink-0 relative z-30 bg-card/90 backdrop-blur-md cursor-ns-resize select-none border-t border-border/50 ${isDragging ? 'bg-accent/5' : 'hover:bg-muted/30'
                            } transition-colors group px-4`}
                        style={{ height: '24px' }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="flex flex-col items-center gap-1">
                                <div className="w-12 h-1 bg-muted-foreground/20 rounded-full group-hover:bg-muted-foreground/30 transition-colors"></div>
                            </div>
                        </div>
                    </div>
                )}

                <div
                    className="bg-background relative z-10 space-y-0 overflow-y-auto flex-shrink-0"
                    style={!isFullScreen ? { height: `calc(${panelHeight}% - 24px)` } : { height: '0px' }}
                >
                    <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-28 sm:pb-12 space-y-4 sm:space-y-6">
                        <div className="space-y-4 sm:space-y-6">
                            <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                                <h2 className="font-heading font-bold text-lg sm:text-xl text-landing-primary dark:text-primary">{t('yatra.itinerary')}</h2>
                                <div className="flex items-center bg-muted/50 border border-border/50 rounded-xl px-2 py-1 gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-background disabled:opacity-30"
                                        disabled={currentIndex === 0}
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                    >
                                        <ChevronLeft className="w-4 h-4 text-landing-primary" />
                                    </Button>

                                    <span className="text-[11px] font-bold text-muted-foreground tabular-nums">
                                        {filteredPlaces.length > 0 ? `${currentIndex + 1} / ${filteredPlaces.length}` : "0 / 0"}
                                    </span>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 hover:bg-background disabled:opacity-30"
                                        disabled={currentIndex >= filteredPlaces.length - 1}
                                        onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                    >
                                        <ChevronRight className="w-4 h-4 text-landing-primary" />
                                    </Button>
                                </div>
                            </div>

                            <div className="relative">
                                <AnimatePresence mode="wait">
                                    {filteredPlaces.length === 0 ? (
                                        <div className="text-center py-12 sm:py-16 bg-muted/20 rounded-2xl border-2 border-dashed border-border/50">
                                            <MapPin className="w-10 h-10 text-muted/40 mx-auto mb-3" />
                                            <p className="text-muted-foreground font-medium">{t('yatra.noPlacesDiscovered')}</p>
                                        </div>
                                    ) : (() => {
                                        const currentPlace = filteredPlaces.at(currentIndex);
                                        if (!currentPlace) return null;
                                        return (
                                            <motion.div
                                                key={currentPlace.id}
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-4 sm:space-y-6"
                                            >
                                                <Card className={`overflow-hidden rounded-2xl border border-border/50 shadow-sm bg-card relative ${currentPlace.status === 'current' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                                                    <div className="flex flex-row sm:flex-col">
                                                        {/* Image Section */}
                                                        <div className="w-28 xs:w-32 sm:w-full h-28 xs:h-32 sm:h-44 md:h-52 relative overflow-hidden flex-shrink-0">
                                                            <LazyImage
                                                                src={currentPlace.image || "/placeholder-temple.jpg"}
                                                                alt={currentPlace.title || ""}
                                                                containerClassName={cn(
                                                                    "w-full h-full transition-all duration-300",
                                                                    currentPlace.fitMode === 'contain' ? "bg-slate-50" : "bg-muted"
                                                                )}
                                                                className={cn(
                                                                    "w-full h-full transition-all duration-700 hover:scale-105 object-center",
                                                                    currentPlace.fitMode === 'contain' ? "object-contain" : "object-cover"
                                                                )}
                                                            />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden sm:block"></div>
                                                            
                                                            {/* Status Badge */}
                                                            <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                                                                <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                                                                    currentPlace.status === 'completed' 
                                                                        ? 'bg-emerald-500 text-white' 
                                                                        : (currentPlace.status === 'current' ? 'bg-primary text-white' : 'bg-muted/80 text-foreground backdrop-blur-sm')
                                                                }`}>
                                                                    {currentPlace.status === 'completed' ? t('yatra.visited') : (currentPlace.status === 'current' ? t('yatra.active') : t('yatra.upcoming'))}
                                                                </span>
                                                            </div>

                                                            {/* Desktop Title (Overlaid on image) */}
                                                            <div className="absolute bottom-3 left-4 right-4 hidden sm:block">
                                                                <h3 className="font-heading font-bold text-lg sm:text-xl text-white leading-tight">
                                                                    {currentPlace.title}
                                                                </h3>
                                                            </div>
                                                        </div>
                                                        
                                                        {/* Content Section */}
                                                        <div className="flex-1 p-3 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                                                            <div className="space-y-1.5 sm:space-y-4">
                                                                {/* Mobile Title (visible only on mobile) */}
                                                                <h3 className="font-heading font-bold text-sm xs:text-base text-landing-primary dark:text-primary leading-tight sm:hidden block truncate">
                                                                    {currentPlace.title}
                                                                </h3>

                                                                <p className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">
                                                                    {currentPlace.description}
                                                                </p>
                                                            </div>

                                                            {currentPlace.locationLink && (
                                                                <div className="mt-2 sm:mt-4">
                                                                    <Button
                                                                        onClick={() => {
                                                                            const url = getLocationUrl(currentPlace.locationLink, currentPlace.latitude, currentPlace.longitude);
                                                                            if (url) {
                                                                                window.open(url, '_blank');
                                                                            }
                                                                        }}
                                                                        className="w-full bg-landing-primary hover:bg-landing-primary/90 text-white font-bold rounded-xl h-8 xs:h-9 sm:h-11 transition-all shadow-md active:scale-[0.98] text-[10px] xs:text-xs sm:text-sm flex items-center justify-center gap-1.5"
                                                                    >
                                                                        <Navigation2 className="w-3.5 h-3.5" /> {t('yatra.openInNavigation')}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </Card>

                                                {/* Pagination Dots */}
                                                <div className="flex justify-center gap-1.5 pt-1">
                                                    {Array.from({ length: Math.min(filteredPlaces.length, 5) }).map((_, i) => {
                                                        const dotIndex = Math.floor(currentIndex / 5) * 5 + i;
                                                        if (dotIndex >= filteredPlaces.length) return null;
                                                        return (
                                                            <div 
                                                                key={dotIndex}
                                                                className={`h-1.5 transition-all duration-300 rounded-full ${dotIndex === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        );
                                    })()}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </APIProvider>
    );
};

export default SwamiYatra;
