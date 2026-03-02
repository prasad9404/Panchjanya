import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, GripHorizontal, ChevronRight, ExternalLink } from "lucide-react";
import YatraMap, { YatraLocation } from "@/shared/components/features/YatraMap";
import { Card } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";

import { YatraPlace } from "@/types";

const ROUTES = [
    {
        id: "swami-complete",
        name: "Swami's complete journey",
        subRoutes: [
            { id: "ekant", name: "Ekant" },
            { id: "purvardh", name: "Purvardh" },
            { id: "uttarardh", name: "Uttarardh" }
        ]
    },
    { id: "dattatray", name: "Shri Dattatray Prabhu Viharan" },
    { id: "govind", name: "Shri Govind Prabhu Viharan" },
    { id: "chakrapani", name: "Shri Chakrapani Prabhu Viharan" },
    { id: "krishna", name: "Shri Krishna Prabhu Viharan" }
];

const SwamiYatra = () => {
    const navigate = useNavigate();
    const [places, setPlaces] = useState<(YatraLocation & {
        title?: string;
        description?: string;
        image?: string;
        attendees?: string;
        route?: string;
        subRoute?: string;
        locationLink?: string;
    })[]>([]);

    const [selectedRoute, setSelectedRoute] = useState(ROUTES[0].id);
    const [selectedSubRoute, setSelectedSubRoute] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const [isFullScreen, setIsFullScreen] = useState(false);
    const [panelHeight, setPanelHeight] = useState(40); // Percentage of viewport height
    const [previousPanelHeight, setPreviousPanelHeight] = useState(40); // Store height before fullscreen
    const [isDragging, setIsDragging] = useState(false);
    const dragRef = useRef<HTMLDivElement>(null);

    const toggleFullScreen = () => {
        if (!isFullScreen) {
            // Going to fullscreen - save current height
            setPreviousPanelHeight(panelHeight);
            setIsFullScreen(true);
        } else {
            // Exiting fullscreen - restore previous height
            setPanelHeight(previousPanelHeight);
            setIsFullScreen(false);
        }
    };

    useEffect(() => {
        const q = query(collection(db, "yatraPlaces"), orderBy("sequence", "asc"));
        const unsub = onSnapshot(q, (snapshot) => {
            console.log(`🕉️ Fetching ${snapshot.docs.length} yatra places from Firebase`);

            const fetchedPlaces = snapshot.docs.map((doc) => {
                const data = doc.data() as YatraPlace;

                return {
                    id: doc.id,
                    name: data.name,
                    latitude: data.latitude || 25.3176,
                    longitude: data.longitude || 83.0062,
                    sequence: data.sequence,
                    status: (data.status === "visited" ? "completed" :
                        data.status === "stayed" || data.status === "current" || data.status === "revisited" ? "current" : "upcoming") as YatraLocation["status"],
                    title: data.name,
                    description: data.description || "Sacred pilgrimage destination",
                    image: data.image || "/placeholder-temple.jpg",
                    attendees: data.attendees || "",
                    route: data.route,
                    subRoute: data.subRoute,
                    locationLink: data.locationLink,
                    pinColor: data.pinColor
                };
            });

            console.log(`✅ Successfully loaded ${fetchedPlaces.length} yatra places`);
            setPlaces(fetchedPlaces);
        }, (error) => {
            console.error("❌ Error fetching yatra places:", error);
        });
        return () => unsub();
    }, []);

    const filteredPlaces = places.filter(p => {
        if (selectedRoute === "swami-complete") {
            if (selectedSubRoute) return p.subRoute === selectedSubRoute;
            return !p.route || p.route === "swami-complete";
        }
        return p.route === selectedRoute;
    });

    useEffect(() => {
        setCurrentIndex(0);
    }, [selectedRoute, selectedSubRoute]);


    // Handle drag to resize panel
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        setIsDragging(true);
        e.preventDefault();
    };

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return;

            const windowHeight = window.innerHeight;
            const newHeight = ((windowHeight - e.clientY) / windowHeight) * 100;

            // Calculate max height to keep slider above bottom bar
            // Bottom bar is at 80px (bottom-20) on mobile, 16px (bottom-4) on desktop
            const bottomBarHeight = window.innerWidth >= 1024 ? 16 : 80;
            const sliderHandleHeight = 32;
            const buffer = 20;
            const minSpaceFromBottom = bottomBarHeight + sliderHandleHeight + buffer;
            const maxHeightPercent = ((windowHeight - minSpaceFromBottom) / windowHeight) * 100;

            // Constrain between 20% and calculated max
            const constrainedHeight = Math.min(Math.max(newHeight, 20), maxHeightPercent);
            setPanelHeight(constrainedHeight);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (!isDragging) return;

            const touch = e.touches[0];
            const windowHeight = window.innerHeight;
            const newHeight = ((windowHeight - touch.clientY) / windowHeight) * 100;

            // Calculate max height to keep slider above bottom bar
            const bottomBarHeight = window.innerWidth >= 1024 ? 16 : 80;
            const sliderHandleHeight = 32;
            const buffer = 20;
            const minSpaceFromBottom = bottomBarHeight + sliderHandleHeight + buffer;
            const maxHeightPercent = ((windowHeight - minSpaceFromBottom) / windowHeight) * 100;

            // Constrain between 20% and calculated max
            const constrainedHeight = Math.min(Math.max(newHeight, 20), maxHeightPercent);
            setPanelHeight(constrainedHeight);
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

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

    return (
        <div className="min-h-full flex-1 bg-background lg:bg-card font-sans flex flex-col pb-24 lg:pb-0 overflow-hidden">
            {/* Header - Hidden in Fullscreen */}
            {/* Header - Hidden in Fullscreen */}
            {!isFullScreen && (
                <div className="sticky top-0 z-40 bg-card shadow-sm">
                    <div className="px-4 py-4 flex items-center justify-between border-b border-border">
                        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 flex-shrink-0" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-primary" />
                        </Button>
                        <div className="text-center flex-1">
                            <h1 className="text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font-serif">Raj Viharan</h1>
                        </div>
                        <div className="w-10"></div>
                    </div>

                    <div className="px-4 py-2 bg-card/95 backdrop-blur-sm border-b border-border flex items-center">
                        <div className="flex-1 min-w-0">
                            <Select
                                value={selectedSubRoute ? `${selectedRoute}:${selectedSubRoute}` : selectedRoute}
                                onValueChange={(value) => {
                                    const [routeId, subRouteId] = value.split(":");
                                    setSelectedRoute(routeId);
                                    setSelectedSubRoute(subRouteId === "all" ? null : (subRouteId || null));
                                }}
                            >
                                <SelectTrigger className="w-full h-10 bg-muted border-none shadow-none focus:ring-0 text-sm font-bold text-landing-primary dark:text-primary rounded-xl pl-3">
                                    <SelectValue placeholder="Select Route" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="swami-complete" className="font-bold py-3 text-sm">Swami's complete Viharan</SelectItem>
                                    <SelectItem value="swami-complete:ekant" className="pl-6 py-2 text-xs font-medium">Ekant</SelectItem>
                                    <SelectItem value="swami-complete:purvardh" className="pl-6 py-2 text-xs font-medium">Purvardh</SelectItem>
                                    <SelectItem value="swami-complete:uttarardh" className="pl-6 py-2 text-xs font-medium">Uttarardh</SelectItem>
                                    <div className="h-px bg-border my-1" />
                                    <SelectItem value="govind" className="font-bold py-2 text-sm">Shri Govind Prabhu Viharan</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold py-2 text-sm">Shri Chakrapani Prabhu Viharan</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold py-2 text-sm">Shri Dattatray Prabhu Viharan</SelectItem>
                                    <SelectItem value="krishna" className="font-bold py-2 text-sm">Shri Krishna Prabhu Viharan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

            {/* Map Section - Dynamic Height */}
            <div
                className={`relative transition-all ${isDragging ? '' : 'duration-300 ease-in-out'} ${isFullScreen
                    ? "fixed inset-0 w-screen h-screen z-[99999] rounded-none bg-slate-100"
                    : "w-full"
                    } bg-slate-100`}
                style={!isFullScreen ? { height: `${100 - panelHeight - 15}vh` } : {}}
            >
                <div className="w-full h-full">
                    <YatraMap
                        locations={filteredPlaces}
                        highlightedId={filteredPlaces[currentIndex]?.id}
                    />
                </div>

                {/* Floating "Confirmed" Badge */}
                {!isFullScreen && (
                    <div className="absolute top-4 right-4 bg-accent-gold text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 z-[400]">
                        CONFIRMED
                    </div>
                )}

                {/* Back Button - Only in Fullscreen (Top Left) */}
                {isFullScreen && (
                    <Button
                        variant="secondary"
                        size="icon"
                        className="absolute top-6 left-6 z-[400] rounded-full bg-card/90 hover:bg-card text-landing-primary dark:text-primary h-12 w-12"
                        onClick={toggleFullScreen}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </Button>
                )}

                {/* Maximize/Minimize Button - Bottom Right of Map */}
                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-6 right-6 z-[400] rounded-full bg-card/90 hover:bg-card text-landing-primary dark:text-primary h-12 w-12 border-2 border-accent-gold/20"
                    onClick={toggleFullScreen}
                >
                    {isFullScreen ? (
                        // Minimize icon - arrows pointing inward to corners
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 14h6v6" />
                            <path d="M20 10h-6V4" />
                            <path d="M14 10l7-7" />
                            <path d="M3 21l7-7" />
                        </svg>
                    ) : (
                        // Maximize icon - arrows pointing outward from corners
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 3h6v6" />
                            <path d="M9 21H3v-6" />
                            <path d="M21 3l-7 7" />
                            <path d="M3 21l7-7" />
                        </svg>
                    )}
                </Button>
            </div>

            {/* Draggable Handle */}
            {!isFullScreen && (
                <div
                    ref={dragRef}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                    className={`relative z-30 bg-card/95 backdrop-blur-sm cursor-ns-resize select-none ${isDragging ? 'bg-accent/10' : 'hover:bg-muted'
                        } transition-colors`}
                    style={{ height: '32px' }}
                >
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-0.5">
                            <div className="w-12 h-1 bg-border rounded-full"></div>
                            <GripHorizontal className="w-5 h-5 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            )}

            {/* Timeline Section - Bottom Half (Scrollable) with Dynamic Height */}
            <div
                className="flex-1 bg-background relative z-10 space-y-0 overflow-y-auto"
                style={!isFullScreen ? { minHeight: `${panelHeight}vh`, height: `${panelHeight}vh` } : {}}
            >
                {/* Header removed from timeline - selection moved to top header */}

                <div className="px-6 pt-4 pb-6 space-y-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-bold text-xl text-blue-900">Yatra Itinerary</h2>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center bg-card border border-border rounded-full px-2 py-1 shadow-sm gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-muted disabled:opacity-30"
                                    disabled={currentIndex === 0}
                                    onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                                >
                                    <ChevronLeft className="w-4 h-4 text-landing-primary dark:text-primary" />
                                </Button>

                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight whitespace-nowrap">
                                    {filteredPlaces.length > 0 ? `${currentIndex + 1} of ${filteredPlaces.length}` : "0 of 0"}
                                </span>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full hover:bg-slate-100 disabled:opacity-30"
                                    disabled={currentIndex >= filteredPlaces.length - 1}
                                    onClick={() => setCurrentIndex(Math.min(filteredPlaces.length - 1, currentIndex + 1))}
                                >
                                    <ChevronRight className="w-4 h-4 text-landing-primary dark:text-primary" />
                                </Button>
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-landing-primary dark:text-primary bg-accent/5 hover:bg-accent/10 rounded-full h-8 w-8"
                                onClick={() => setPanelHeight(panelHeight === 20 ? 40 : 20)}
                            >
                                {panelHeight === 20 ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="18 15 12 9 6 15"></polyline>
                                    </svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Timeline Container */}
                    <div className="relative pl-4 space-y-12">
                        {/* Timeline vertical line */}
                        <div className="absolute left-[-11px] top-0 bottom-0 w-0.5 bg-border z-0" />
                        {(() => {
                            if (filteredPlaces.length === 0) return (
                                <div className="text-center py-12 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                    <MapPin className="w-12 h-12 text-muted mx-auto mb-3" />
                                    <h3 className="text-muted-foreground font-bold">No places found</h3>
                                    <p className="text-slate-400 text-xs mt-1">Information for this route segment will be added soon.</p>
                                </div>
                            );

                            return filteredPlaces.length > 0 ? (
                                <div className="space-y-4">
                                    {/* Single Active Card Display */}
                                    <div
                                        key={filteredPlaces[currentIndex].id}
                                        className="relative pl-6 animate-in fade-in zoom-in-95 duration-500"
                                    >
                                        {/* Sequence Marker - Red Pulse for Active */}
                                        <div className="absolute -left-[27px] top-0 flex items-center justify-center w-8 h-8 rounded-full border-4 border-background z-10 bg-destructive text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                            <MapPin className="w-4 h-4" />
                                        </div>

                                        {/* Content */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between pr-2">
                                                <span className="text-[10px] font-bold tracking-widest uppercase text-blue-600">
                                                    {filteredPlaces[currentIndex].status}
                                                </span>
                                            </div>

                                            <Card className="p-4 rounded-2xl border-none shadow-xl ring-2 ring-destructive/20 bg-card">
                                                <div className="flex gap-4">
                                                    <div className="flex-1 space-y-2">
                                                        <h3 className="font-heading font-bold text-lg text-landing-primary dark:text-primary leading-tight">
                                                            {filteredPlaces[currentIndex].title}
                                                        </h3>
                                                        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                                                            {filteredPlaces[currentIndex].description}
                                                        </p>

                                                        {filteredPlaces[currentIndex].locationLink && (
                                                            <Button
                                                                onClick={() => window.open(filteredPlaces[currentIndex].locationLink, '_blank')}
                                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-10 shadow-sm transition-all mt-2"
                                                            >
                                                                <ExternalLink className="w-4 h-4 mr-2" /> VIEW ON MAP
                                                            </Button>
                                                        )}
                                                    </div>

                                                    {/* Thumbnail Image */}
                                                    <div className="w-24 h-24 rounded-xl bg-muted flex-shrink-0 overflow-hidden shadow-inner">
                                                        <img
                                                            src={filteredPlaces[currentIndex].image}
                                                            alt={filteredPlaces[currentIndex].title}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                                                        />
                                                    </div>
                                                </div>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Scroll Tip */}
                                    <div className="text-center pt-8 opacity-40">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Guided Pilgrimage Focus</p>
                                    </div>
                                </div>
                            ) : null;
                        })()}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SwamiYatra;

