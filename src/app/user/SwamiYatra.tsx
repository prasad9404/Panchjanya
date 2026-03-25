import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, GripHorizontal, ChevronRight, ExternalLink, Loader2, Navigation2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import YatraMap, { YatraLocation } from "@/shared/components/features/YatraMap";
import { Card } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";

import { useYatraPlaces } from "@/shared/hooks/useYatraPlaces";
import { LazyImage } from "@/shared/components/ui/LazyImage";

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
    const { data: rawPlaces = [], isLoading } = useYatraPlaces();

    const [selectedRoute, setSelectedRoute] = useState(ROUTES[0].id);
    const [selectedSubRoute, setSelectedSubRoute] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [centerOnFullRoute, setCenterOnFullRoute] = useState(0);
    const [forceFocus, setForceFocus] = useState(0);

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
            name: data.name,
            latitude: data.latitude || 25.3176,
            longitude: data.longitude || 83.0062,
            sequence: data.sequence,
            status: (data.status === "visited" ? "completed" :
                ["stayed", "current", "revisited"].includes(data.status) ? "current" : "upcoming") as YatraLocation["status"],
            title: data.name,
            description: data.description || "Sacred pilgrimage destination",
            image: data.image || "/placeholder-temple.jpg",
            attendees: data.attendees || "",
            route: data.route,
            subRoute: data.subRoute,
            locationLink: data.locationLink,
            pinColor: data.pinColor
        }));
    }, [rawPlaces]);

    const filteredPlaces = useMemo(() => {
        return places.filter(p => {
            if (selectedRoute === "swami-complete") {
                if (selectedSubRoute) return p.subRoute === selectedSubRoute;
                return !p.route || p.route === "swami-complete";
            }
            return p.route === selectedRoute;
        });
    }, [places, selectedRoute, selectedSubRoute]);

    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedRoute, selectedSubRoute]);

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
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Navigating the sacred trails...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex-1 bg-background lg:bg-card font-sans flex flex-col pb-24 lg:pb-0 overflow-hidden">
            {!isFullScreen && (
                <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border/50 shadow-sm">
                    <div className="px-5 py-5 flex items-center justify-between">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors" 
                            onClick={() => navigate(-1)}
                        >
                            <ChevronLeft className="w-6 h-6 text-landing-primary dark:text-primary" />
                        </Button>
                        <div className="flex-1 text-center">
                            <h1 className="text-2xl md:text-3xl font-heading font-black tracking-tight text-landing-primary dark:text-primary">
                                Raj Viharan
                            </h1>
                            <div className="flex items-center justify-center gap-2 mt-0.5">
                                <div className="h-[1px] w-4 bg-accent-gold/40" />
                                <p className="text-[9px] uppercase tracking-[0.3em] font-black text-accent-gold/80">Spiritual Journey</p>
                                <div className="h-[1px] w-4 bg-accent-gold/40" />
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="rounded-full group hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                            <Share2 className="w-5 h-5 text-landing-primary group-hover:scale-110 transition-transform" />
                        </Button>
                    </div>

                    <div className="px-4 pb-3 flex items-center gap-2">
                        <div className="flex-1 relative">
                            <Select
                                value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                                onValueChange={(value) => {
                                    const [routeId, subRouteId] = value.split(":");
                                    setSelectedRoute(routeId);
                                    setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                                }}
                            >
                                <SelectTrigger className="w-full h-11 bg-muted/50 border-none shadow-none focus:ring-1 focus:ring-accent-gold/20 text-sm font-semibold text-landing-primary dark:text-primary rounded-2xl pl-4 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2 truncate">
                                        <Compass className="w-4 h-4 text-accent-gold" />
                                        <SelectValue placeholder="Select Route" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-3xl border border-border/50 shadow-2xl backdrop-blur-xl">
                                    <SelectItem value="swami-complete" className="font-bold py-3 text-sm focus:bg-accent/5">Shri Chakradhar Swami's complete Viharan</SelectItem>
                                    <SelectItem value="swami-complete:ekant" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">Ekant</SelectItem>
                                    <SelectItem value="swami-complete:purvardh" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">Purvardh</SelectItem>
                                    <SelectItem value="swami-complete:uttarardh" className="pl-6 py-2 text-xs font-medium focus:bg-accent/5">Uttarardh</SelectItem>
                                    <div className="h-px bg-border/50 my-1 mx-2" />
                                    <SelectItem value="govind" className="font-bold py-2 text-sm focus:bg-accent/5">Shri Govind Prabhu Viharan</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold py-2 text-sm focus:bg-accent/5">Shri Chakrapani Prabhu Viharan</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold py-2 text-sm focus:bg-accent/5">Shri Dattatray Prabhu Viharan</SelectItem>
                                    <SelectItem value="krishna" className="font-bold py-2 text-sm focus:bg-accent/5">Shri Krishan Bhagwan Viharan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            <div
                className={`relative transition-all ${isDragging ? '' : 'duration-500 cubic-bezier(0.4, 0, 0.2, 1)'} ${isFullScreen
                    ? "fixed inset-0 w-screen h-screen z-[99999] rounded-none bg-slate-100"
                    : "w-full"
                    } bg-slate-100 overflow-hidden shadow-inner`}
                style={!isFullScreen ? { height: `${100 - panelHeight - 15}vh` } : {}}
            >
                <div className="w-full h-full scale-[1.01]">
                    <YatraMap
                        locations={filteredPlaces}
                        highlightedId={filteredPlaces[currentIndex]?.id}
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

                <div className="absolute bottom-6 right-6 z-[400] flex flex-col gap-3">
                    <Button
                        variant="secondary"
                        size="icon"
                        title="Focus Current Location"
                        className="rounded-full bg-card/90 backdrop-blur-md hover:bg-card text-landing-primary h-12 w-12 shadow-xl border border-border/50 group transition-all active:scale-95"
                        onClick={() => setForceFocus(Date.now())}
                    >
                        <Navigation2 className="w-5 h-5 group-hover:text-blue-600 transition-colors" />
                    </Button>

                    <Button
                        variant="secondary"
                        size="icon"
                        title="View Full Route"
                        className="rounded-full bg-card/90 backdrop-blur-md hover:bg-card text-landing-primary h-12 w-12 shadow-xl border border-border/50 group transition-all active:scale-95"
                        onClick={() => setCenterOnFullRoute(Date.now())}
                    >
                        <Compass className="w-5 h-5 group-hover:text-accent-gold transition-colors" />
                    </Button>
                    
                    <Button
                        variant="secondary"
                        size="icon"
                        className="rounded-full bg-card/90 backdrop-blur-md hover:bg-card text-landing-primary h-12 w-12 shadow-xl border border-border/50 group transition-all active:scale-95"
                        onClick={toggleFullScreen}
                    >
                        {isFullScreen ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform">
                                <path d="M4 14h6v6" />
                                <path d="M20 10h-6V4" />
                                <path d="M14 10l7-7" />
                                <path d="M3 21l7-7" />
                            </svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                                <path d="M15 3h6v6" />
                                <path d="M9 21H3v-6" />
                                <path d="M21 3l-7 7" />
                                <path d="M3 21l7-7" />
                            </svg>
                        )}
                    </Button>
                </div>
            </div>

            {!isFullScreen && (
                <div
                    ref={dragRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className={`relative z-30 bg-card/90 backdrop-blur-md cursor-ns-resize select-none border-t border-border/50 ${isDragging ? 'bg-accent/5' : 'hover:bg-muted/30'
                        } transition-colors group px-4`}
                    style={{ height: '36px' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full group-hover:bg-muted-foreground/30 transition-colors"></div>
                        </div>
                    </div>
                </div>
            )}

            <div
                className="flex-1 bg-background relative z-10 space-y-0 overflow-y-auto"
                style={!isFullScreen ? { minHeight: `${panelHeight}vh`, height: `${panelHeight}vh` } : {}}
            >
                <div className="px-6 pt-6 pb-20 space-y-8">
                    <div className="flex items-center justify-between mb-2">
                        <div className="space-y-1">
                            <h2 className="font-heading font-bold text-xl text-landing-primary tracking-tight">Yatra Itinerary</h2>
                            <div className="h-1 w-12 bg-accent-gold rounded-full opacity-60" />
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-muted/30 border border-border/50 rounded-2xl px-2 py-1.5 shadow-sm gap-2 backdrop-blur-sm">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl hover:bg-background/80 disabled:opacity-30 transition-all"
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 text-landing-primary" />
                                </Button>

                                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider tabular-nums px-1">
                                    {filteredPlaces.length > 0 ? `${currentIndex + 1} / ${filteredPlaces.length}` : "0 / 0"}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-xl hover:bg-background/80 disabled:opacity-30 transition-all"
                                    disabled={currentIndex >= filteredPlaces.length - 1}
                                    onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                >
                                    <ChevronRight className="w-4 h-4 text-landing-primary" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="relative pt-2">
                        <AnimatePresence mode="wait">
                            {filteredPlaces.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    className="text-center py-16 bg-muted/20 rounded-[2rem] border-2 border-dashed border-border/50"
                                >
                                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <MapPin className="w-8 h-8 text-muted/60" />
                                    </div>
                                    <h3 className="text-muted-foreground font-bold text-lg">No places discovered yet</h3>
                                    <p className="text-muted-foreground/60 text-sm mt-2 max-w-[240px] mx-auto italic">Our sages are mapping this sacred trail. It will appear here soon.</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key={filteredPlaces[currentIndex].id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                    className="space-y-6"
                                >
                                    <div className="flex items-center gap-3 px-1">
                                        <div 
                                            className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg relative ${filteredPlaces[currentIndex].status === 'completed' ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-blue-500 shadow-blue-500/20 animate-pulse'}`}
                                            style={{ backgroundColor: filteredPlaces[currentIndex].status === 'completed' ? '#10B981' : (filteredPlaces[currentIndex].pinColor || '#2A6DF4') }}
                                        >
                                            <MapPin className="w-5 h-5" />
                                            {filteredPlaces[currentIndex].status !== 'completed' && (
                                                <div className="absolute -inset-1 rounded-2xl border-2 border-primary/20 animate-ping opacity-20"></div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black tracking-[0.2em] uppercase px-2 py-0.5 rounded-md ${filteredPlaces[currentIndex].status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {filteredPlaces[currentIndex].status === 'completed' ? 'Visited' : (filteredPlaces[currentIndex].status === 'current' ? 'Next Stop' : 'Upcoming')}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1 font-medium">Point {currentIndex + 1} of the Journey</p>
                                        </div>
                                    </div>

                                    <Card className="overflow-hidden rounded-[2rem] border-none shadow-2xl shadow-blue-900/5 bg-card relative">
                                        <div className="absolute top-0 right-0 p-4 z-10">
                                            <div className="bg-white/90 backdrop-blur-sm rounded-full w-8 h-8 flex items-center justify-center shadow-sm text-landing-primary font-bold text-xs border border-border/20">
                                                {currentIndex + 1}
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col">
                                            <div className="h-48 relative overflow-hidden group">
                                                <LazyImage
                                                    src={filteredPlaces[currentIndex].image || "/placeholder-temple.jpg"}
                                                    alt={filteredPlaces[currentIndex].title || ""}
                                                    containerClassName="w-full h-full bg-muted transition-transform duration-700 group-hover:scale-110"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                                <div className="absolute bottom-4 left-6 right-6">
                                                    <h3 className="font-heading font-black text-2xl text-white leading-tight drop-shadow-md">
                                                        {filteredPlaces[currentIndex].title}
                                                    </h3>
                                                </div>
                                            </div>
                                            
                                            <div className="p-6 pt-5 space-y-4">
                                                <p className="text-sm text-balance text-muted-foreground/80 leading-relaxed min-h-[4.5rem]">
                                                    {filteredPlaces[currentIndex].description}
                                                </p>

                                                {filteredPlaces[currentIndex].locationLink && (
                                                    <Button
                                                        onClick={() => window.open(filteredPlaces[currentIndex].locationLink, '_blank')}
                                                        className="w-full bg-[#0038A8] hover:bg-[#002B82] text-white font-bold rounded-2xl h-12 shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-0.5 active:translate-y-0"
                                                    >
                                                        <ExternalLink className="w-4 h-4 mr-2" /> OPEN IN GOOGLE MAPS
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="flex items-center justify-center py-4">
                                        <div className="flex gap-1.5">
                                            {Array.from({ length: Math.min(filteredPlaces.length, 5) }).map((_, i) => {
                                                const dotIndex = Math.floor(currentIndex / 5) * 5 + i;
                                                if (dotIndex >= filteredPlaces.length) return null;
                                                return (
                                                    <div 
                                                        key={dotIndex}
                                                        className={`h-1.5 transition-all duration-300 rounded-full ${dotIndex === currentIndex ? 'w-6 bg-accent-gold' : 'w-1.5 bg-border'}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwamiYatra;
