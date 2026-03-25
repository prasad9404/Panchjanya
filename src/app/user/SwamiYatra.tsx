import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Share2, Compass, MapPin, GripHorizontal, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
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
                <div className="sticky top-0 z-40 bg-card shadow-sm">
                    <div className="px-4 py-4 flex items-center justify-between border-b border-border">
                        <Button variant="ghost" size="icon" className="-ml-2 hover:bg-black/5 flex-shrink-0" onClick={() => navigate(-1)}>
                            <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-primary" />
                        </Button>
                        <div className="text-center flex-1">
                            <h1 className="text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font_serif">Raj Viharan</h1>
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
                                    setSelectedSubRoute(subRouteId === "all" || !subRouteId ? null : subRouteId);
                                }}
                            >
                                <SelectTrigger className="w-full h-10 bg-muted border-none shadow-none focus:ring-0 text-sm font-bold text-landing-primary dark:text-primary rounded-xl pl-3">
                                    <SelectValue placeholder="Select Route" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="swami-complete" className="font-bold py-3 text-sm">Shri Chakradhar Swami's complete Viharan</SelectItem>
                                    <SelectItem value="swami-complete:ekant" className="pl-6 py-2 text-xs font-medium">Ekant</SelectItem>
                                    <SelectItem value="swami-complete:purvardh" className="pl-6 py-2 text-xs font-medium">Purvardh</SelectItem>
                                    <SelectItem value="swami-complete:uttarardh" className="pl-6 py-2 text-xs font-medium">Uttarardh</SelectItem>
                                    <div className="h-px bg-border my-1" />
                                    <SelectItem value="govind" className="font-bold py-2 text-sm">Shri Govind Prabhu Viharan</SelectItem>
                                    <SelectItem value="chakrapani" className="font-bold py-2 text-sm">Shri Chakrapani Prabhu Viharan</SelectItem>
                                    <SelectItem value="dattatray" className="font-bold py-2 text-sm">Shri Dattatray Prabhu Viharan</SelectItem>
                                    <SelectItem value="krishna" className="font-bold py-2 text-sm">Shri Krishan Bhagwan Viharan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            )}

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

                {!isFullScreen && (
                    <div className="absolute top-4 right-4 bg-accent-gold text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 z-[400]">
                        CONFIRMED
                    </div>
                )}

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

                <Button
                    variant="secondary"
                    size="icon"
                    className="absolute bottom-6 right-6 z-[400] rounded-full bg-card/90 hover:bg-card text-landing-primary dark:text-primary h-12 w-12 border-2 border-accent-gold/20"
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

            <div
                className="flex-1 bg-background relative z-10 space-y-0 overflow-y-auto"
                style={!isFullScreen ? { minHeight: `${panelHeight}vh`, height: `${panelHeight}vh` } : {}}
            >
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

                    <div className="relative pl-4 space-y-12">
                        <div className="absolute left-[-11px] top-0 bottom-0 w-0.5 bg-border z-0" />
                        {(() => {
                            if (filteredPlaces.length === 0) return (
                                <div className="text-center py-12 bg-card/50 rounded-3xl border-2 border-dashed border-border">
                                    <MapPin className="w-12 h-12 text-muted mx-auto mb-3" />
                                    <h3 className="text-muted-foreground font-bold">No places found</h3>
                                    <p className="text-slate-400 text-xs mt-1">Information for this route segment will be added soon.</p>
                                </div>
                            );

                            return (
                                <div className="space-y-4">
                                    <div
                                        key={filteredPlaces[currentIndex].id}
                                        className="relative pl-6 animate-in fade-in zoom-in-95 duration-500"
                                    >
                                        <div className="absolute -left-[27px] top-0 flex items-center justify-center w-8 h-8 rounded-full border-4 border-background z-10 bg-destructive text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                                            <MapPin className="w-4 h-4" />
                                        </div>

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

                                                    <LazyImage
                                                        src={filteredPlaces[currentIndex].image || "/placeholder-temple.jpg"}
                                                        alt={filteredPlaces[currentIndex].title || ""}
                                                        containerClassName="w-24 h-24 rounded-xl bg-muted flex-shrink-0 shadow-inner"
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            </Card>
                                        </div>
                                    </div>

                                    <div className="text-center pt-8 opacity-40">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Guided Pilgrimage Focus</p>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SwamiYatra;
