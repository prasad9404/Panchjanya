import { useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import MapWithMarkers from "@/shared/components/features/MapWithMarkers";
import { TempleDetails } from "@/shared/components/features/TempleDetails";
import { Compass, Map as MapIcon, ChevronRight, Info, Navigation, ChevronLeft, Bell, Loader2 } from "lucide-react";
import { useTemples } from "@/shared/hooks/useTemples";
import { LazyImage } from "@/shared/components/ui/LazyImage";

interface YatraPlace {
    id: string;
    name: string;
    nameEn: string;
    description: string;
    sequence: number;
    status: "visited" | "stayed" | "revisited";
}

const SthanaVandan = () => {
    const { data: temples = [], isLoading } = useTemples();
    const [selectedTempleId, setSelectedTempleId] = useState<string | null>(null);
    const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedTaluka, setSelectedTaluka] = useState("");

    // 🔍 Optimized Filtering
    const filteredTemples = useMemo(() => {
        let filtered = temples;
        if (searchQuery) {
            filtered = filtered.filter((temple) =>
                temple.name.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedDistrict) {
            filtered = filtered.filter(
                (temple) => temple.district?.toLowerCase() === selectedDistrict.toLowerCase()
            );
        }
        if (selectedTaluka) {
            filtered = filtered.filter(
                (temple) => temple.taluka?.toLowerCase() === selectedTaluka.toLowerCase()
            );
        }
        return filtered;
    }, [temples, searchQuery, selectedDistrict, selectedTaluka]);


    const handleTempleClick = (id: string) => {
        setSelectedTempleId(id);
    };

    const selectedTemple = temples.find((t) => t.id === selectedTempleId) || null;

    // Filter temples with architectural data
    const architectureTemples = temples.filter(
        (t) => t.architectureImage || (t.hotspots && t.hotspots.length > 0)
    ).slice(0, 4);

    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0f3c6e]" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">Loading heritage data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex-1 bg-background font-sans animate-in fade-in duration-500 space-y-10">
            {/* Header */}
            <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="-ml-2 hover:bg-accent/10" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-primary" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font-serif">Sthaan Vandan</h1>
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                    <Bell className="w-5 h-5 text-accent-gold fill-accent-gold" />
                </div>
            </div>

            <div className="px-6 space-y-8">
                <div className="flex items-center justify-between border-l-4 border-primary pl-3 mt-4">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">Raj Viharan</h2>
                </div>

                <Card className="p-8 bg-card border-none rounded-3xl overflow-hidden relative shadow-sm">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-lg mb-8 max-w-[90%] leading-relaxed font-medium">
                            Map your spiritual journey across ancient heritage sites with personalized itineraries.
                        </p>
                        <Button
                            onClick={() => navigate('/raj-viharan')}
                            className="w-full bg-landing-primary hover:bg-landing-primary/90 text-white py-8 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 group"
                        >
                            <div className="p-1 bg-accent-gold rounded-full group-hover:scale-110 transition-transform">
                                <Compass className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-wide">See the viharan</span>
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="space-y-6 pt-2 px-6">
                <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">Heritage Map</h2>
                    <Link to="/explore" className="text-xs font-bold text-accent-gold uppercase tracking-widest cursor-pointer hover:text-primary">
                        view all
                    </Link>
                </div>

                <div className="h-[500px] w-full rounded-3xl overflow-hidden border border-border/50 bg-accent/5 relative">
                    <MapWithMarkers
                        temples={filteredTemples}
                        onTempleClick={handleTempleClick}
                        selectedTempleId={selectedTempleId}
                    />

                    {selectedTemple && !isDetailsPanelOpen && (
                        <div className="absolute bottom-4 left-4 right-4 z-[400] lg:w-96 lg:left-auto lg:right-4">
                            <Card className="p-3 flex items-center gap-3 shadow-xl bg-card/95 backdrop-blur-sm border-none animate-in slide-in-from-bottom-4">
                                <LazyImage
                                    src={selectedTemple.images?.[0] || "/placeholder-temple.jpg"}
                                    alt={selectedTemple.name}
                                    containerClassName="w-16 h-16 bg-accent/10 rounded-lg flex-shrink-0 border border-accent/20"
                                    className="w-full h-full object-cover"
                                />

                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                    <h3 className="font-bold text-sm lg:text-base text-landing-primary dark:text-primary truncate leading-tight mb-0.5">
                                        {selectedTemple.name}
                                    </h3>
                                    <p className="text-[11px] lg:text-xs text-muted-foreground truncate flex items-center gap-1">
                                        <MapIcon className="w-3 h-3" />
                                        {(() => {
                                            const city = selectedTemple.city?.trim();
                                            const district = selectedTemple.district?.trim();
                                            if (city && district && city.toLowerCase() !== district.toLowerCase()) {
                                                return `${city}, ${district}`;
                                            }
                                            if (city || district) return city || district;
                                            return typeof selectedTemple.location === 'string' ? selectedTemple.location : "Ancient Heritage";
                                        })()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-1">
                                    <Link to={`/temple/${selectedTemple.id}/architecture`}>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full text-accent-gold hover:bg-accent/10 hover:text-primary" title="Architecture View">
                                            <Compass className="w-4 h-4" />
                                        </Button>
                                    </Link>

                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                                        title="Get Directions"
                                        onClick={() => {
                                            if (selectedTemple.latitude && selectedTemple.longitude) {
                                                window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedTemple.latitude},${selectedTemple.longitude}`, "_blank");
                                            }
                                        }}
                                    >
                                        <Navigation className="w-4 h-4" />
                                    </Button>

                                    <Button size="icon" variant="ghost" onClick={() => setIsDetailsPanelOpen(true)} className="h-8 w-8 rounded-full hover:bg-accent/10" title="View Details">
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    </Button>
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-6 pt-4 pb-10 px-6">
                <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">Architectural Archive</h2>
                    <Button variant="link" className="text-xs font-bold text-accent-gold uppercase tracking-widest p-0 h-auto">VIEW ALL</Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                    {architectureTemples.length > 0 ? (
                        architectureTemples.map((temple) => (
                            <Link to={`/temple/${temple.id}/architecture`} key={temple.id}>
                                <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all h-full flex flex-col">
                                    <LazyImage
                                        src={temple.architectureImage || temple.images?.[0] || ""}
                                        alt={temple.name}
                                        containerClassName="h-40 bg-muted relative"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-landing-primary dark:text-primary group-hover:text-accent-gold transition-colors">{temple.name}</h3>
                                        <p className="text-sm text-muted-foreground line-clamp-2">
                                            {temple.description || `Detailed architectural study of the sacred ${temple.name}.`}
                                        </p>
                                        <div className="flex gap-2 pt-2 mt-auto">
                                            <Button className="flex-1 bg-landing-primary group-hover:bg-primary transition-colors text-sm h-9">
                                                View Architecture
                                            </Button>
                                            <Button variant="outline" size="icon" className="h-9 w-9 border-accent/20 bg-accent/10 text-accent-gold">
                                                <Info className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-accent/20 rounded-xl bg-accent/5">
                            <Info className="w-10 h-10 text-accent-gold mx-auto mb-3" />
                            <p className="text-foreground font-medium">No architectural records found.</p>
                            <p className="text-sm text-muted-foreground">Check back later for detailed temple studies.</p>
                        </div>
                    )}
                </div>
            </div>

            <TempleDetails
                isOpen={isDetailsPanelOpen}
                onClose={() => setIsDetailsPanelOpen(false)}
                temple={selectedTemple}
            />
        </div>
    );
};

export default SthanaVandan;
