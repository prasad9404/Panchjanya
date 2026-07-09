import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, ChevronRight, Navigation2, Search, Globe } from "lucide-react";
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
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";
import { useYatraPlaces } from "@/shared/hooks/useYatraPlaces";
import { useTemples } from "@/shared/hooks/useTemples";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { cn } from "@/shared/lib/utils";
import { getLocationUrl } from "@/shared/utils/locationUtils";
import { APIProvider } from "@vis.gl/react-google-maps";
import { TempleSearch } from "@/shared/components/features/TempleSearch";
import { useYatraStore } from "@/store/useYatraStore";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/shared/components/ui/drawer";

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
    const { data: rawPlaces = [], isLoading: isPlacesLoading } = useYatraPlaces();
    const { data: temples = [], isLoading: isTemplesLoading } = useTemples();
    const isLoading = isPlacesLoading || isTemplesLoading;

    const {
        selectedRoute,
        selectedSubRoute,
        searchedPlace,
        currentIndex,
        isMobileSheetOpen,
        isAnimating,
        forceFocusTimestamp,
        centerFullRouteTimestamp,
        setSelectedRoute,
        setSelectedSubRoute,
        setSearchedPlace,
        setCurrentIndex,
        setIsMobileSheetOpen,
        triggerForceFocus,
        triggerCenterFullRoute
    } = useYatraStore();

    // 🕉️ Process and normalize places
    const places = useMemo(() => {
        return rawPlaces.map((data) => {
            const sthan = temples.find(t => t.id === data.sthanId);
            const name = sthan ? getTranslatedValue(sthan.name, langCode) : getTranslatedValue(data.name, langCode) || "Unknown Sthan";
            const description = sthan ? getTranslatedValue(sthan.history, langCode) : getTranslatedValue(data.description, langCode);
            const latitude = sthan?.latitude || data.latitude || 25.3176;
            const longitude = sthan?.longitude || data.longitude || 83.0062;
            const image = sthan?.sthanImages?.[0] || data.image || "/placeholder-temple.jpg";
            const locationLink = sthan?.locationLink || data.locationLink;

            return {
                id: data.id,
                name: name,
                latitude: latitude,
                longitude: longitude,
                sequence: data.sequence,
                status: (data.status === "visited" ? "completed" :
                    ["stayed", "current", "revisited"].includes(data.status) ? "current" : "upcoming") as YatraLocation["status"],
                title: name,
                description: description || t('yatra.description'),
                image: image,
                attendees: data.attendees || "",
                route: data.route,
                subRoute: data.subRoute,
                locationLink: locationLink,
                pinColor: data.pinColor,
                fitMode: data.fitMode || 'cover'
            };
        });
    }, [rawPlaces, temples, langCode, t]);

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

    // Auto-open mobile panel on load, route change, or location index change
    useEffect(() => {
        if (filteredPlaces.length > 0) {
            setIsMobileSheetOpen(true);
        }
    }, [filteredPlaces, currentIndex, setIsMobileSheetOpen]);

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
            setTimeout(() => {
                setCurrentIndex(filteredPlaces.length); 
                triggerForceFocus();
                setIsMobileSheetOpen(true);
            }, 100);
        }
    };

    // Card component for rendering location details
    const LocationCard = ({ place, index }: { place: any, index: number }) => (
        <Card className={`overflow-hidden rounded-2xl border border-border shadow-sm bg-card hover:shadow-xl transition-all duration-300 group relative ${place.status === 'current' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
            <div className="flex flex-row sm:flex-col">
                <div className="w-20 xs:w-24 sm:w-full h-20 xs:h-24 sm:h-44 md:h-52 relative overflow-hidden flex-shrink-0">
                    <LazyImage
                        src={place.image || "/placeholder-temple.jpg"}
                        alt={place.title || ""}
                        containerClassName={cn("w-full h-full transition-all duration-300", place.fitMode === 'contain' ? "bg-slate-50 dark:bg-slate-900" : "bg-muted")}
                        className={cn("w-full h-full transition-transform duration-700 group-hover:scale-105 object-center", place.fitMode === 'contain' ? "object-contain" : "object-cover")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden sm:block pointer-events-none"></div>
                    
                    <div className="absolute top-1.5 left-1.5 sm:top-3 sm:left-3">
                        <span className={`px-1.5 py-0.5 rounded-full text-[7px] sm:text-[9px] font-bold uppercase tracking-wider ${
                            place.status === 'completed' 
                                ? 'bg-emerald-500 text-white' 
                                : (place.status === 'current' ? 'bg-amber-600 text-white' : 'bg-background/80 text-foreground backdrop-blur-sm')
                        }`}>
                            {place.status === 'completed' ? t('yatra.visited') : (place.status === 'current' ? t('yatra.active') : t('yatra.upcoming'))}
                        </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 hidden sm:block pointer-events-none">
                        <h3 className="font-heading font-bold text-lg sm:text-xl text-white leading-tight">
                            {place.title}
                        </h3>
                    </div>
                </div>
                
                <div className="flex-1 p-2.5 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5 sm:space-y-4">
                        <h3 className="font-heading font-bold text-sm xs:text-base text-landing-primary dark:text-primary leading-tight sm:hidden block truncate group-hover:text-primary transition-colors">
                            {place.title}
                        </h3>
                        <p className="text-[11px] xs:text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2 sm:line-clamp-none">
                            {place.description}
                        </p>
                    </div>

                    {place.locationLink && (
                        <div className="mt-2 sm:mt-4">
                            <Button
                                onClick={() => {
                                    const url = getLocationUrl(place.locationLink, place.latitude, place.longitude);
                                    if (url) window.open(url, '_blank');
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
    );

    return (
        <APIProvider apiKey={apiKey}>
            <div className="relative h-screen w-full bg-background font-sans overflow-hidden">
                
                {/* MAP AREA (Takes full screen) */}
                <div className="absolute inset-0 z-0">
                    <YatraMapMapLibre
                        locations={filteredPlaces}
                        highlightedId={filteredPlaces.at(currentIndex)?.id}
                        centerOnFullRoute={centerFullRouteTimestamp}
                        forceFocus={forceFocusTimestamp}
                        langCode={langCode}
                        onMarkerClick={(id) => {
                            if (isAnimating) return;
                            const index = filteredPlaces.findIndex(p => p.id === id);
                            if (index !== -1) {
                                setCurrentIndex(index);
                                setIsMobileSheetOpen(true);
                            }
                        }}
                        isMobileSheetOpen={isMobileSheetOpen}
                    />
                </div>

                {/* DESKTOP/TABLET SIDE PANEL */}
                <AnimatePresence initial={false}>
                    <motion.div 
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="hidden md:flex absolute top-4 left-4 h-[calc(100vh-32px)] w-[360px] lg:w-[400px] flex-col z-20 pointer-events-none"
                    >
                        {/* Unified Side Panel */}
                        <div className="bg-card dark:bg-card rounded-3xl card-shadow-md flex-1 overflow-hidden flex flex-col pointer-events-auto border border-border">
                            
                            {/* Search Bar Section */}
                            <div className="px-3 py-3 flex items-center border-b border-border bg-card shrink-0 z-10">
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 shrink-0 mr-1" onClick={() => navigate(-1)}>
                                    <ChevronLeft className="w-6 h-6 text-landing-primary dark:text-primary" />
                                </Button>
                                <div className="flex-1">
                                    <TempleSearch onPlaceSelect={handlePlaceSelect} />
                                </div>
                                <div className="h-6 w-px bg-border mx-2" />
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 text-landing-primary dark:text-primary shrink-0" onClick={() => triggerForceFocus()}>
                                    <Navigation2 className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Header */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-border bg-muted/30 shrink-0">
                                <h1 className="text-lg font-bold text-landing-primary dark:text-primary font-heading tracking-tight">
                                    {t('yatra.title')}
                                </h1>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 h-8 w-8 shrink-0" onClick={() => triggerCenterFullRoute()} title="View Full Route">
                                        <Globe className="w-4 h-4 text-landing-primary dark:text-primary" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 h-8 w-8 shrink-0">
                                        <Share2 className="w-4 h-4 text-landing-primary dark:text-primary" />
                                    </Button>
                                </div>
                            </div>

                    {/* Route Selector */}
                    <div className="p-4 space-y-3 border-b border-border">
                        <Select
                            value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                            onValueChange={(value) => {
                                const [routeId, subRouteId] = value.split(":");
                                setSelectedRoute(routeId);
                                setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                            }}
                        >
                            <SelectTrigger className="w-full h-11 bg-background border border-border shadow-sm focus:ring-1 focus:ring-primary/20 text-sm font-semibold text-landing-primary dark:text-primary rounded-2xl hover:bg-accent/5 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Compass className="w-4 h-4 text-amber-600" />
                                    <SelectValue placeholder={t('yatra.selectRoute')} />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-border shadow-xl backdrop-blur-xl">
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

                    {/* Itinerary List */}
                    <div className="flex-1 overflow-y-auto p-4 bg-background space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-heading font-bold text-lg text-landing-primary dark:text-primary">{t('yatra.itinerary')}</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full border-border hover:bg-accent/5 disabled:opacity-50"
                                    disabled={currentIndex === 0 || isAnimating}
                                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 text-foreground" />
                                </Button>
                                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                    {filteredPlaces.length > 0 ? `${currentIndex + 1} / ${filteredPlaces.length}` : "0/0"}
                                </span>
                                <Button
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full border-border hover:bg-accent/5 disabled:opacity-50"
                                    disabled={currentIndex >= filteredPlaces.length - 1 || isAnimating}
                                    onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                >
                                    <ChevronRight className="w-4 h-4 text-foreground" />
                                </Button>
                            </div>
                        </div>

                        {filteredPlaces.length === 0 ? (
                            <div className="text-center py-12 bg-card rounded-2xl border border-border shadow-sm">
                                <MapPin className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                                <p className="text-sm text-muted-foreground">{t('yatra.noPlacesDiscovered')}</p>
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                {filteredPlaces.at(currentIndex) && (
                                    <motion.div
                                        key={filteredPlaces[currentIndex].id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <LocationCard place={filteredPlaces[currentIndex]} index={currentIndex} />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        )}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
                
                {/* MOBILE TOP HEADER */}
                <div className="md:hidden absolute top-2 left-2 right-2 z-10 pointer-events-none">
                    <div className="bg-card/95 backdrop-blur-xl rounded-2xl shadow-md pointer-events-auto border border-border flex flex-col overflow-hidden">
                        
                        {/* Title and Back Button Row */}
                        <div className="flex items-center gap-1 px-2 py-2 border-b border-border bg-card/95">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 shrink-0 h-8 w-8 bg-background" onClick={() => navigate(-1)}>
                                <ChevronLeft className="w-5 h-5 text-landing-primary dark:text-primary" />
                            </Button>
                            <h1 className="text-lg font-bold text-landing-primary dark:text-primary font-heading tracking-tight truncate flex-1 px-1">
                                {t('yatra.title')}
                            </h1>
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-accent/10 shrink-0 h-8 w-8 bg-background" onClick={() => triggerCenterFullRoute()} title="View Full Route">
                                <Globe className="w-4 h-4 text-landing-primary dark:text-primary" />
                            </Button>
                            <Select
                                value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                                onValueChange={(value) => {
                                    const [routeId, subRouteId] = value.split(":");
                                    setSelectedRoute(routeId);
                                    setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                                }}
                            >
                                <SelectTrigger className="rounded-full hover:bg-accent/10 h-8 bg-background flex items-center border border-input shadow-sm focus:ring-0 focus:ring-offset-0 px-3 gap-1.5 text-xs font-semibold text-landing-primary dark:text-primary transition-colors max-w-[140px] [&>span]:line-clamp-1 [&>svg:last-child]:hidden" title={t('yatra.selectRoute')}>
                                    <Compass className="w-4 h-4 shrink-0 text-amber-600" />
                                    <SelectValue placeholder={t('yatra.selectRoute')} />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border shadow-xl backdrop-blur-2xl z-[60] min-w-[200px]">
                                    <SelectItem value="swami-complete" className="font-bold py-2 text-xs focus:bg-accent/5">{t('yatra.routes.swamiCompleteViharan')}</SelectItem>
                                    <SelectItem value="swami-complete:ekant" className="pl-6 py-1.5 text-[10px] font-medium focus:bg-accent/5">{t('yatra.routes.ekant')}</SelectItem>
                                    <SelectItem value="swami-complete:purvardh" className="pl-6 py-1.5 text-[10px] font-medium focus:bg-accent/5">{t('yatra.routes.purvardh')}</SelectItem>
                                    <SelectItem value="swami-complete:uttarardh" className="pl-6 py-1.5 text-[10px] font-medium focus:bg-accent/5">{t('yatra.routes.uttarardh')}</SelectItem>
                                    <div className="h-px bg-border/50 my-1 mx-2" />
                                    <SelectItem value="govind" className="font-bold py-2 text-xs focus:bg-accent/5">{t('yatra.routes.govind')}</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold py-2 text-xs focus:bg-accent/5">{t('yatra.routes.chakrapani')}</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold py-2 text-xs focus:bg-accent/5">{t('yatra.routes.dattatray')}</SelectItem>
                                    <SelectItem value="krishna" className="font-bold py-2 text-xs focus:bg-accent/5">{t('yatra.routes.krishna')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* MOBILE BOTTOM SHEET */}
                <Drawer open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen} modal={false}>
                    <DrawerContent className="h-auto max-h-[60vh] md:hidden bg-card border-t border-border">
                        <DrawerTitle className="sr-only">{t('yatra.title')}</DrawerTitle>
                        
                        <div className="px-4 py-3 overflow-y-auto pb-4">
                            <div className="flex items-center justify-between mb-2.5">
                                <h2 className="font-heading font-bold text-lg text-landing-primary dark:text-primary">{t('yatra.itinerary')}</h2>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full border-border hover:bg-accent/5 disabled:opacity-50"
                                        disabled={currentIndex === 0 || isAnimating}
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                    >
                                        <ChevronLeft className="w-4 h-4 text-foreground" />
                                    </Button>
                                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                        {filteredPlaces.length > 0 ? `${currentIndex + 1}/${filteredPlaces.length}` : "0/0"}
                                    </span>
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full border-border hover:bg-accent/5 disabled:opacity-50"
                                        disabled={currentIndex >= filteredPlaces.length - 1 || isAnimating}
                                        onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                    >
                                        <ChevronRight className="w-4 h-4 text-foreground" />
                                    </Button>
                                </div>
                            </div>
                            
                            {filteredPlaces.length > 0 && filteredPlaces.at(currentIndex) && (
                                <LocationCard place={filteredPlaces[currentIndex]} index={currentIndex} />
                            )}
                        </div>
                    </DrawerContent>
                </Drawer>

            </div>
        </APIProvider>
    );
};

export default SwamiYatra;
