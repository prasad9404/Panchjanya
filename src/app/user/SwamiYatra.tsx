import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, ChevronRight, Navigation2, Layers, Search, Globe } from "lucide-react";
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
    const { data: rawPlaces = [], isLoading } = useYatraPlaces();

    const {
        selectedRoute,
        selectedSubRoute,
        searchedPlace,
        currentIndex,
        isMobileSheetOpen,
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
        <Card className={`overflow-hidden rounded-2xl border border-border/50 shadow-sm bg-card relative ${place.status === 'current' ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
            <div className="flex flex-row sm:flex-col">
                <div className="w-28 xs:w-32 sm:w-full h-28 xs:h-32 sm:h-44 md:h-52 relative overflow-hidden flex-shrink-0">
                    <LazyImage
                        src={place.image || "/placeholder-temple.jpg"}
                        alt={place.title || ""}
                        containerClassName={cn("w-full h-full transition-all duration-300", place.fitMode === 'contain' ? "bg-slate-50" : "bg-muted")}
                        className={cn("w-full h-full transition-all duration-700 hover:scale-105 object-center", place.fitMode === 'contain' ? "object-contain" : "object-cover")}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent hidden sm:block"></div>
                    
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
                        <span className={`px-2 py-0.5 rounded-full text-[8px] sm:text-[9px] font-bold uppercase tracking-wider ${
                            place.status === 'completed' 
                                ? 'bg-emerald-500 text-white' 
                                : (place.status === 'current' ? 'bg-[#FF9933] text-white' : 'bg-muted/80 text-foreground backdrop-blur-sm')
                        }`}>
                            {place.status === 'completed' ? t('yatra.visited') : (place.status === 'current' ? t('yatra.active') : t('yatra.upcoming'))}
                        </span>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 hidden sm:block">
                        <h3 className="font-heading font-bold text-lg sm:text-xl text-white leading-tight">
                            {place.title}
                        </h3>
                    </div>
                </div>
                
                <div className="flex-1 p-3 sm:p-5 md:p-6 flex flex-col justify-between min-w-0">
                    <div className="space-y-1.5 sm:space-y-4">
                        <h3 className="font-heading font-bold text-sm xs:text-base text-landing-primary dark:text-primary leading-tight sm:hidden block truncate">
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
                                className="w-full bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white font-bold rounded-xl h-8 xs:h-9 sm:h-11 transition-all shadow-md active:scale-[0.98] text-[10px] xs:text-xs sm:text-sm flex items-center justify-center gap-1.5"
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
                    />
                </div>

                {/* DESKTOP FLOATING UI */}
                <AnimatePresence initial={false}>
                    <motion.div 
                        initial={{ x: -400, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -400, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 200, damping: 25 }}
                        className="hidden lg:flex absolute top-4 left-4 h-[calc(100vh-32px)] w-[400px] flex-col z-20 pointer-events-none"
                    >
                        {/* Google Maps Style Floating Search Bar */}
                        <div className="bg-white rounded-full shadow-lg h-14 flex items-center px-4 pointer-events-auto shrink-0 border border-slate-100/50 flex-none z-30">
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 -ml-2" onClick={() => navigate(-1)}>
                                <ChevronLeft className="w-6 h-6 text-[#1E3A8A]" />
                            </Button>
                            <div className="flex-1 mx-2" onClick={() => setIsMobileSheetOpen(true)}>
                                <TempleSearch onPlaceSelect={handlePlaceSelect} />
                            </div>
                            <div className="h-6 w-px bg-slate-200 mx-1" />
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 text-[#1E3A8A]">
                                <Navigation2 className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Route Selector & Itinerary Panel */}
                        <div className="mt-4 bg-white rounded-3xl shadow-xl flex-1 overflow-hidden flex flex-col pointer-events-auto border border-slate-100 flex-none pb-2">
                            {/* Header */}
                            <div className="px-5 py-4 flex items-center justify-between border-b border-slate-100">
                                <h1 className="text-lg font-bold text-[#1E3A8A] font-serif tracking-tight">
                                    {t('yatra.title')}
                                </h1>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 h-8 w-8">
                                    <Share2 className="w-4 h-4 text-[#1E3A8A]" />
                                </Button>
                            </div>

                    {/* Route Selector */}
                    <div className="p-4 space-y-3 border-b border-slate-100">
                        <Select
                            value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                            onValueChange={(value) => {
                                const [routeId, subRouteId] = value.split(":");
                                setSelectedRoute(routeId);
                                setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                            }}
                        >
                            <SelectTrigger className="w-full h-11 bg-slate-50 border border-slate-200 shadow-sm focus:ring-1 focus:ring-[#FF9933]/20 text-sm font-semibold text-[#1E3A8A] rounded-2xl hover:bg-slate-100 transition-colors">
                                <div className="flex items-center gap-2">
                                    <Compass className="w-4 h-4 text-[#FF9933]" />
                                    <SelectValue placeholder={t('yatra.selectRoute')} />
                                </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border border-slate-100 shadow-xl backdrop-blur-xl">
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
                    <div className="flex-1 overflow-y-auto p-4 bg-[#faf8f2] space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-lg text-[#1E3A8A]">{t('yatra.itinerary')}</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                    {filteredPlaces.length > 0 ? `${currentIndex + 1} / ${filteredPlaces.length}` : "0/0"}
                                </span>
                                <Button
                                    variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                    disabled={currentIndex >= filteredPlaces.length - 1}
                                    onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {filteredPlaces.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border border-border">
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
                
                {/* MOBILE TOP SEARCH BAR */}
                <div className="lg:hidden absolute top-4 left-4 right-4 z-10 flex flex-col gap-2 pointer-events-none">
                    <div className="flex items-center gap-2 pointer-events-auto">
                        <Button variant="secondary" size="icon" className="rounded-full shadow-lg h-12 w-12 bg-white hover:bg-slate-50" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-6 h-6 text-[#1E3A8A]" />
                        </Button>
                        <div className="flex-1 bg-white rounded-full shadow-lg h-12 flex items-center px-4 gap-2">
                            <Search className="w-5 h-5 text-muted-foreground" />
                            <div className="flex-1" onClick={() => setIsMobileSheetOpen(true)}>
                                <TempleSearch onPlaceSelect={handlePlaceSelect} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* FLOATING MAP CONTROLS */}
                <div className="absolute right-4 bottom-24 lg:bottom-12 z-10 flex flex-col gap-3">
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-12 w-12 rounded-full bg-white shadow-xl hover:bg-slate-50 text-[#1E3A8A] border border-slate-100"
                            onClick={() => triggerCenterFullRoute()}
                            title="View Full Route"
                        >
                            <Globe className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-12 w-12 rounded-full bg-white shadow-xl hover:bg-slate-50 text-[#1E3A8A] border border-slate-100"
                            onClick={() => triggerForceFocus()}
                            title="My Location"
                        >
                            <Navigation2 className="w-5 h-5" />
                        </Button>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-12 w-12 rounded-full bg-white shadow-xl hover:bg-slate-50 text-[#1E3A8A] border border-slate-100 lg:hidden"
                            onClick={() => setIsMobileSheetOpen(true)}
                            title="View Details"
                        >
                            <Layers className="w-5 h-5" />
                        </Button>
                    </div>

                {/* MOBILE BOTTOM SHEET */}
                <Drawer open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                    <DrawerContent className="h-[85vh] lg:hidden bg-[#faf8f2]">
                        <DrawerHeader className="border-b border-border/50 pb-4">
                            <DrawerTitle className="text-left text-[#1E3A8A] font-serif text-xl">{t('yatra.title')}</DrawerTitle>
                            
                            <Select
                                value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                                onValueChange={(value) => {
                                    const [routeId, subRouteId] = value.split(":");
                                    setSelectedRoute(routeId);
                                    setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                                }}
                            >
                                <SelectTrigger className="w-full mt-2 h-10 bg-white border-none shadow-sm focus:ring-1 focus:ring-[#FF9933]/20 text-sm font-semibold text-[#1E3A8A] rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Compass className="w-4 h-4 text-[#FF9933]" />
                                        <SelectValue placeholder={t('yatra.selectRoute')} />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border border-border/50 shadow-xl">
                                    <SelectItem value="swami-complete" className="font-bold">{t('yatra.routes.swamiCompleteViharan')}</SelectItem>
                                    <SelectItem value="govind" className="font-bold">{t('yatra.routes.govind')}</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold">{t('yatra.routes.chakrapani')}</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold">{t('yatra.routes.dattatray')}</SelectItem>
                                    <SelectItem value="krishna" className="font-bold">{t('yatra.routes.krishna')}</SelectItem>
                                </SelectContent>
                            </Select>
                        </DrawerHeader>
                        
                        <div className="p-4 overflow-y-auto">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-lg text-[#1E3A8A]">{t('yatra.itinerary')}</h2>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        disabled={currentIndex === 0}
                                        onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>
                                    <span className="text-xs font-bold text-muted-foreground tabular-nums">
                                        {filteredPlaces.length > 0 ? `${currentIndex + 1}/${filteredPlaces.length}` : "0/0"}
                                    </span>
                                    <Button
                                        variant="outline" size="icon" className="h-8 w-8 rounded-full"
                                        disabled={currentIndex >= filteredPlaces.length - 1}
                                        onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                    >
                                        <ChevronRight className="w-4 h-4" />
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
