import { useState, useEffect, useMemo } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDoc, query, where } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Temple } from "@/types";
import { useNavigate } from "react-router-dom";
import { Search, Compass, MapPin, ChevronRight, Filter, X, Bookmark, CornerDownRight, Info, Navigation } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";
import DataTableFilter from "@/shared/components/ui/data-table-filter";
import { getSthanTypes, getSthanPinInfo } from "@/shared/utils/sthanTypes";
import { SthanType } from "@/shared/types/sthanType";


// Custom styles for Leaflet popup close button
const popupStyles = `
  .custom-temple-popup .leaflet-popup-content-wrapper {
    padding: 0;
    overflow: hidden;
  }
  .custom-temple-popup .leaflet-popup-content {
    margin: 0px 0px 0px 0px;
  }
  .custom-temple-popup .leaflet-popup-close-button {
    top: 8px !important;
    right: 8px !important;
    font-size: 18px !important;
    color: #4b5563 !important; /* gray-600 */
    z-index: 10;
  }
  .custom-temple-popup .leaflet-popup-close-button:hover {
    color: #111827 !important; /* gray-900 */
  }
`;

// Custom Icon for 'Explore' Map (Golden Circle with Symbol)
const exploreIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzAzLm9yZy9yZ2IvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBmaWxsPSIjRkNCOTAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMjAgMTJ2MTZNMTIgMjBoMTYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==', // Placeholder SVG base64
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -48],
});

// Custom Blue Temple Icon for Pin Points
const templePinIcon = new L.Icon({
    iconUrl: '/icons/Untitled design.png',
    iconSize: [52, 52],
    iconAnchor: [26, 52], // Bottom center
    popupAnchor: [0, -48], // Adjusted for new icon height
});

let sthanIconsMap: Record<string, L.Icon> = {};

// Helper function to get icon by sthan type
function getIconBySthan(sthan: string | undefined): L.Icon {
    if (!sthan) return templePinIcon;

    const normalizedSthan = sthan.trim();

    if (normalizedSthan in sthanIconsMap) {
        return sthanIconsMap[normalizedSthan];
    }

    return templePinIcon;
}

// Inner Map Component to handle center/zoom updates
function MapEffect({ temples, resetTrigger }: { temples: Temple[]; resetTrigger: number }) {
    const map = useMap();
    useEffect(() => {
        if (temples.length > 0) {
            const bounds = L.latLngBounds(temples.map(t => [t.latitude || 0, t.longitude || 0]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
    }, [temples, map, resetTrigger]);
    return null;
}

// Separate TempleMarker component to fix React closure issue
function TempleMarker({ temple, onSelect }: { temple: Temple; onSelect: (temple: Temple) => void }) {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { user } = useAuth();
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const map = useMap();

    // Check if temple is saved
    useEffect(() => {
        const checkIfSaved = async () => {
            if (!user || !temple) {
                setIsSaved(false);
                return;
            }

            try {
                const savedRef = doc(db, `users/${user.uid}/savedTemples/${temple.id}`);
                const savedDoc = await getDoc(savedRef);
                setIsSaved(savedDoc.exists());
            } catch (error) {
                console.error("Error checking saved status:", error);
                setIsSaved(false);
            }
        };

        checkIfSaved();
    }, [user, temple]);

    // Toggle save/unsave
    const toggleSave = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!user || !temple || isSaving) return;

        setIsSaving(true);
        try {
            const savedRef = doc(db, `users/${user.uid}/savedTemples/${temple.id}`);

            if (isSaved) {
                // Unsave
                await deleteDoc(savedRef);
                setIsSaved(false);
            } else {
                // Save
                await setDoc(savedRef, {
                    templeId: temple.id,
                    savedAt: new Date(),
                    templeName: temple.name,
                    templeCity: temple.city || temple.address || "",
                    templeImage: temple.images?.[0] || ""
                });
                setIsSaved(true);
            }
        } catch (error) {
            console.error("Error toggling save:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Marker
            position={[temple.latitude || 0, temple.longitude || 0]}
            icon={getIconBySthan((temple as any).sthan)}
            eventHandlers={{
                click: () => onSelect(temple),
                popupopen: () => setIsPopupOpen(true),
                popupclose: () => setIsPopupOpen(false)
            }}
        >
            {/* Tooltip - Shows on Hover only when popup is closed */}
            {!isPopupOpen && (
                <Tooltip
                    direction="top"
                    offset={[0, -12]}
                    className="rounded-lg shadow-xl border-none p-0 overflow-hidden"
                >
                    <div className="px-3 py-2 bg-popover/95 backdrop-blur-sm border-l-4 border-primary">
                        <p className="font-heading text-popover-foreground font-bold text-sm whitespace-nowrap">{temple.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">
                            {temple.city || temple.district || "Maharashtra"}
                        </p>
                    </div>
                </Tooltip>
            )}

            {/* Popup - Shows on Click */}
            <Popup
                closeButton={false}
                className="custom-temple-popup"
                offset={[0, -5]}
                minWidth={230}
                maxWidth={250}
                autoPan={true}
                autoPanPaddingTopLeft={[20, 160]}
                autoPanPaddingBottomRight={[100, 100]}
                keepInView={true}
            >
                <div className="px-3 py-3 w-full space-y-2">
                    <style>{popupStyles}</style>

                    {/* Row 1: Title + Close Icon */}
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="font-heading font-bold text-xl md:text-2xl text-landing-primary dark:text-primary leading-tight">
                            {temple.name}
                        </h3>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                map.closePopup();
                            }}
                            className="text-muted-foreground hover:text-foreground transition-colors p-0.5 shrink-0"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Row 2: Subtitle */}
                    <div className="flex items-start gap-1.5 text-sm md:text-base text-muted-foreground leading-snug">
                        <MapPin className="w-4 h-4 md:w-5 md:h-5 text-primary shrink-0 mt-1" />
                        <span>
                            {temple.city && temple.city !== temple.district ? `${temple.city}, ` : ""}
                            {temple.district || "Maharashtra"}
                        </span>
                    </div>

                    {/* Row 3: Action Buttons (Details + Direction + Saved) */}
                    <div className="flex items-center gap-2 pt-1">
                        <Button
                            className="flex-1 bg-landing-primary hover:bg-landing-primary/90 text-white h-8 md:h-9 rounded-lg shadow-sm text-xs md:text-xs font-bold px-0"
                            onClick={() => navigate(`/temple/${temple.id}/architecture`)}
                        >
                            Details
                        </Button>
                        <button
                            className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-slate-200 bg-white transition-all duration-300 hover:bg-slate-50 text-blue-900 flex items-center justify-center shrink-0 shadow-sm"
                            title="Navigate"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (temple.latitude && temple.longitude) {
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=${temple.latitude},${temple.longitude}`, "_blank");
                                }
                            }}
                        >
                            <Navigation className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button
                            onClick={toggleSave}
                            disabled={isSaving || !user}
                            className={cn(
                                "h-8 w-8 md:h-9 md:w-9 rounded-full border flex-shrink-0 transition-all duration-300 shadow-sm flex items-center justify-center",
                                isSaved
                                    ? "bg-blue-50 border-blue-200 text-blue-900"
                                    : "bg-white border-slate-200 text-blue-900 hover:bg-slate-50"
                            )}
                            title={isSaved ? "Unsave" : "Save"}
                        >
                            <Bookmark className={cn("w-4 h-4 md:w-5 md:h-5", isSaved && "fill-current")} />
                        </button>
                    </div>
                </div>
            </Popup>
        </Marker>
    );
}

const Explore = () => {
    const [temples, setTemples] = useState<Temple[]>([]);
    const [allTemplesForOptions, setAllTemplesForOptions] = useState<Temple[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);

    // Pending states (for UI dropdowns)
    const [pendingDistrict, setPendingDistrict] = useState<string>("");
    const [pendingTaluka, setPendingTaluka] = useState<string>("");
    const [pendingSthanaType, setPendingSthanaType] = useState<string>("");

    // Applied states (for Firestore query and results)
    const [appliedDistrict, setAppliedDistrict] = useState<string>("");
    const [appliedTaluka, setAppliedTaluka] = useState<string>("");
    const [appliedSthanaType, setAppliedSthanaType] = useState<string>("");

    const navigate = useNavigate();
    const { t } = useLanguage();
    const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
    const [resetTrigger, setResetTrigger] = useState(0);

    // Load sthan types and generate icons
    useEffect(() => {
        const loadSthanTypes = async () => {
            const types = await getSthanTypes();
            setSthanTypes(types);

            types.forEach(st => {
                const { src, filter, needsFilter } = getSthanPinInfo(st.color, st.pinType);
                if (needsFilter) {
                    // Icon-based PNG with color filter — use L.divIcon with inline img
                    sthanIconsMap[st.name] = new L.DivIcon({
                        html: `<img src="${src}" style="width:52px;height:52px;object-fit:contain;filter:${filter}" />`,
                        className: '',
                        iconSize: [52, 52],
                        iconAnchor: [26, 52],
                        popupAnchor: [0, -48],
                    }) as unknown as L.Icon;
                } else {
                    sthanIconsMap[st.name] = new L.Icon({
                        iconUrl: src,
                        iconSize: [52, 52],
                        iconAnchor: [26, 52],
                        popupAnchor: [0, -48],
                    });
                }
            });
        };
        loadSthanTypes();
    }, []);

    // 1. Fetch all temples ONCE to populate filter options (Districts/Talukas)
    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, "temples"), (snapshot) => {
            const data = snapshot.docs.map((doc) => {
                const t = doc.data() as any;
                // Robust coordinate extraction for filters - check extensive list of possibilities
                let lat, lng;

                // 1. Try top-level numeric or string fields
                const rawLat = [t.latitude, t.lat, t.location?.latitude, t.location?.lat].find(v => v !== undefined && v !== null && v !== "");
                const rawLng = [t.longitude, t.lng, t.location?.longitude, t.location?.lng].find(v => v !== undefined && v !== null && v !== "");

                if (rawLat !== undefined) lat = Number(rawLat);
                if (rawLng !== undefined) lng = Number(rawLng);

                // 2. Fallback: Check if 'location' is a map with 'lat'/'lng' (common in user example)
                if (lat === undefined && typeof t.location === 'object' && t.location !== null) {
                    if (t.location.lat !== undefined) lat = Number(t.location.lat);
                    if (t.location.lng !== undefined) lng = Number(t.location.lng);
                }

                // 3. Last Resort: Handle the specific weird case if needed (e.g. location as string, though unlikely for coords)

                return {
                    ...t,
                    id: doc.id,
                    latitude: lat,
                    longitude: lng,
                };
            }) as Temple[];

            // Debug logs
            data.forEach(t => {
                if (!t.latitude || !t.longitude) {
                    const rawData = t as any;
                    // Only warn if it's truly missing, sometimes we just have partial data
                }
            });

            setAllTemplesForOptions(data);
        });
        return () => unsubscribe();
    }, []);

    // 2. Main Temple Listener - Querying Firestore based on Applied Filters
    useEffect(() => {
        const templesRef = collection(db, "temples");
        let q = query(templesRef);

        const conditions = [];
        if (appliedDistrict) {
            conditions.push(where("district", "==", appliedDistrict));
        }
        if (appliedTaluka) {
            conditions.push(where("taluka", "==", appliedTaluka));
        }

        if (conditions.length > 0) {
            console.log("🔍 Fetching temples with database filters:", conditions.length);
            q = query(templesRef, ...conditions);
        } else {
            console.log("📜 Fetching all temples (no database filters)");
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map((doc) => {
                const t = doc.data() as any;
                // Robust coordinate extraction for filters - check extensive list of possibilities
                let lat, lng;

                // 1. Try top-level numeric or string fields
                const rawLat = [t.latitude, t.lat, t.location?.latitude, t.location?.lat].find(v => v !== undefined && v !== null && v !== "");
                const rawLng = [t.longitude, t.lng, t.location?.longitude, t.location?.lng].find(v => v !== undefined && v !== null && v !== "");

                if (rawLat !== undefined) lat = Number(rawLat);
                if (rawLng !== undefined) lng = Number(rawLng);

                // 2. Fallback: Check if 'location' is a map with 'lat'/'lng' (common in user example)
                if (lat === undefined && typeof t.location === 'object' && t.location !== null) {
                    if (t.location.lat !== undefined) lat = Number(t.location.lat);
                    if (t.location.lng !== undefined) lng = Number(t.location.lng);
                }

                // 3. Last Resort: Handle the specific weird case if needed (e.g. location as string, though unlikely for coords)

                return {
                    ...t,
                    id: doc.id,
                    latitude: lat,
                    longitude: lng,
                };
            }) as Temple[];

            console.log(`✅ Loaded ${data.length} temples from database`);
            // Debug logs to verify coordinates
            data.forEach(t => {
                if (!t.latitude || !t.longitude) {
                    const rawData = t as any;
                    console.warn(`⚠️ Temple "${t.name}" (ID: ${t.id}) is missing valid coordinates! Raw Lat: ${rawData.latitude}, LocationObj: ${JSON.stringify(rawData.location)}`);
                } else {
                    console.log(`📍 Temple "${t.name}" at [${t.latitude}, ${t.longitude}]`);
                }
            });
            setTemples(data);

            if (data.length > 0 && !selectedTemple) {
                const hampi = data.find(t => t.name.toLowerCase().includes("hampi"));
                setSelectedTemple(hampi || data[0]);
            }
        }, (error) => {
            console.error("❌ Firestore query error:", error);
        });

        return () => unsubscribe();
    }, [appliedDistrict, appliedTaluka]);

    // 3. Derived Filter Options with Counts from Database
    const districts = Array.from(new Set(allTemplesForOptions.map(t => t.district).filter(Boolean)))
        .sort()
        .map(d => ({
            value: d,
            label: `${d} (${allTemplesForOptions.filter(t => t.district === d).length})`
        }));

    const talukas = Array.from(new Set(
        allTemplesForOptions
            .filter(t => !pendingDistrict || t.district === pendingDistrict)
            .map(t => t.taluka)
            .filter(Boolean)
    ))
        .sort()
        .map(t => ({
            value: t,
            label: `${t} (${allTemplesForOptions.filter(curr => curr.taluka === t && (!pendingDistrict || curr.district === pendingDistrict)).length})`
        }));

    // 4. Dynamic Sthana Category Options from Database
    const sthanaOptions = sthanTypes.map(st => {
        const count = allTemplesForOptions.filter(t => {
            const templeSthan = (t as any).sthan || t.sthana || "";
            return templeSthan.toLowerCase().includes(st.name.toLowerCase());
        }).length;
        return {
            value: st.name,
            label: `${st.name} (${count})`
        };
    });

    // Client-side filtering for Search and Sthana Category (Substring matches)
    const filteredTemples = useMemo(() => {
        return temples.filter(temple => {
            const matchesSearch = !searchQuery ||
                temple.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                temple.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                temple.district?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesSthana = !appliedSthanaType || (
                ((temple as any).sthan && (temple as any).sthan.toLowerCase().includes(appliedSthanaType.toLowerCase())) ||
                (temple.sthana && temple.sthana.toLowerCase().includes(appliedSthanaType.toLowerCase())) ||
                (temple.description_text && temple.description_text.toLowerCase().includes(appliedSthanaType.toLowerCase())) ||
                (temple.description && temple.description.toLowerCase().includes(appliedSthanaType.toLowerCase()))
            );

            return matchesSearch && matchesSthana;
        });
    }, [temples, searchQuery, appliedSthanaType]);

    const activeFiltersCount = (appliedDistrict ? 1 : 0) + (appliedTaluka ? 1 : 0) + (appliedSthanaType ? 1 : 0);

    const handleApplyFilters = () => {
        console.log("🎯 Applying Filters to Database:", { pendingDistrict, pendingTaluka, pendingSthanaType });
        setAppliedDistrict(pendingDistrict);
        setAppliedTaluka(pendingTaluka);
        setAppliedSthanaType(pendingSthanaType);
        setShowFilters(false);
    };

    const clearFilters = () => {
        setPendingDistrict("");
        setPendingTaluka("");
        setPendingSthanaType("");
        setAppliedDistrict("");
        setAppliedTaluka("");
        setAppliedSthanaType("");
    };

    return (
        <div className="relative h-[calc(100vh-80px)] w-full overflow-hidden bg-background animate-in fade-in duration-300">
            {/* Standard Header */}
            {/* Header Container */}
            <div className="absolute top-0 left-0 right-0 z-[400] flex flex-col pointer-events-none gap-1">

                {/* Top Row: Unified Glass Header */}
                <div className="px-4 pt-3 pb-1 flex items-center justify-center pointer-events-auto z-[410]">
                    <div className="relative w-full max-w-4xl flex items-center justify-center bg-background/10 backdrop-blur-md rounded-full border border-border/20 shadow-sm py-1.5 px-4">
                        {/* Logo - Absolute Left */}
                        <img src="/logo.jpg" alt="Logo" className="absolute left-2 w-12 h-12 object-contain" />

                        {/* Title - Center */}
                        <h1 className="w-full px-10 text-center text-xl md:text-2xl font-heading font-bold text-landing-primary dark:text-primary font-serif whitespace-nowrap">
                            Panchajanya Heritage Map
                        </h1>
                    </div>
                </div>

                {/* Second Row: Search Bar - Responsive & Centered */}
                <div className="pointer-events-auto w-full max-w-sm mx-auto px-4 flex items-center gap-2">
                    <div className="relative flex-1 rounded-full bg-background/95 backdrop-blur-md border border-border/40 flex items-center shadow-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
                        <Input
                            placeholder="Explore Holy Legacy"
                            className="pl-9 pr-9 h-9 rounded-full border-none bg-transparent focus-visible:ring-0 text-xs placeholder:text-muted-foreground"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-landing-primary dark:text-primary w-8 h-8 flex items-center justify-center hover:bg-accent/10 rounded-full transition-colors"
                        >
                            <div className="relative">
                                <Filter className="w-4 h-4" />
                                {activeFiltersCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-accent-gold text-white text-[10px] font-bold rounded-full w-3 h-3 flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </div>
                        </button>
                    </div>

                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                size="icon"
                                variant="outline"
                                className="h-9 w-9 rounded-full bg-background/95 backdrop-blur-md border-border/40 shadow-md text-landing-primary dark:text-primary hover:bg-accent/10 shrink-0"
                                title="Sthan Types Information"
                            >
                                <Info className="w-5 h-5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent
                            side="bottom"
                            align="end"
                            sideOffset={8}
                            className="w-52 rounded-[1.25rem] p-3.5 bg-[#FDFBF7] border-[#E8E2D5] shadow-xl"
                        >
                            <h3 className="text-lg font-heading font-black text-[#2D2D2D] mb-3 px-1 truncate">
                                Sthan Types
                            </h3>
                            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
                                {sthanTypes.map(st => {
                                    const { src, filter, needsFilter } = getSthanPinInfo(st.color, st.pinType);
                                    return (
                                        <div
                                            key={st.id}
                                            className="flex items-center gap-2.5 group cursor-default p-1 rounded-lg hover:bg-[#F5F1E8] transition-colors"
                                        >
                                            <div className="relative w-8 h-8 shrink-0 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                                                <img
                                                    src={src}
                                                    alt={st.name}
                                                    style={needsFilter ? { filter } : undefined}
                                                    className="relative z-10 w-7 h-7 object-contain drop-shadow-sm"
                                                />
                                            </div>
                                            <span className="text-sm font-semibold text-[#6B6B6B] truncate leading-tight group-hover:text-[#2D2D2D] transition-colors">
                                                {st.name}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {showFilters && (
                <div className="absolute top-36 left-4 right-4 z-[400] pointer-events-auto">
                    <div className="bg-map-bg/95 backdrop-blur-md rounded-[2rem] border border-border p-5 shadow-xl">
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="font-heading font-black text-xl text-landing-primary dark:text-primary">Filters</h3>
                            <button
                                onClick={() => setShowFilters(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Area Row */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* District Filter */}
                                <div>
                                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">District</label>
                                    <DataTableFilter
                                        label="All Districts"
                                        options={districts}
                                        selectedValues={pendingDistrict ? [pendingDistrict] : []}
                                        onChange={(values) => {
                                            setPendingDistrict(values[0] || "");
                                            setPendingTaluka("");
                                        }}
                                        className="w-full bg-background border-border h-9 text-xs"
                                    />
                                </div>

                                {/* Taluka Filter */}
                                <div>
                                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">Taluka</label>
                                    <DataTableFilter
                                        label="All Talukas"
                                        options={talukas}
                                        selectedValues={pendingTaluka ? [pendingTaluka] : []}
                                        onChange={(values) => setPendingTaluka(values[0] || "")}
                                        className="w-full bg-background border-border h-9 text-xs"
                                    />
                                </div>
                            </div>

                            {/* Sthana Row */}
                            <div className="pt-1">
                                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">Sthana Category</label>
                                <DataTableFilter
                                    label="All Sthana Types"
                                    options={sthanaOptions}
                                    selectedValues={pendingSthanaType ? [pendingSthanaType] : []}
                                    onChange={(values) => setPendingSthanaType(values[0] || "")}
                                    className="w-full bg-white border-gray-200 h-9 text-xs"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-4 border-t border-border/10 mt-2">
                                <Button
                                    onClick={clearFilters}
                                    variant="outline"
                                    className="flex-1 border-border text-foreground hover:bg-accent/10 h-10 rounded-xl text-xs font-bold"
                                >
                                    Clear All
                                </Button>
                                <Button
                                    onClick={handleApplyFilters}
                                    className="flex-1 bg-landing-primary hover:bg-landing-primary/90 text-white h-10 rounded-xl shadow-md text-xs font-bold"
                                >
                                    Apply Filters
                                </Button>
                            </div>

                            {/* Results Count */}
                            <div className="text-center text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] pt-3">
                                SHOWING {filteredTemples.length} OF {temples.length} TEMPLES
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Screen Map */}
            <div className="absolute inset-0 z-0">
                <MapContainer
                    center={[20.5937, 78.9629]} // India Center
                    zoom={5}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={false}
                    attributionControl={false}
                >
                    <TileLayer
                        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" // Cleaner, lighter map style
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    />

                    <MapEffect temples={filteredTemples} resetTrigger={resetTrigger} />

                    {/* Render each temple with its own TempleMarker component */}
                    {filteredTemples.map((temple) => (
                        temple.latitude && temple.longitude && (
                            <TempleMarker
                                key={temple.id}
                                temple={temple}
                                onSelect={setSelectedTemple}
                            />
                        )
                    ))}
                </MapContainer>

                {/* Reset Zoom Button */}
                <div className="absolute bottom-24 right-4 z-[400] pointer-events-auto">
                    <Button
                        onClick={() => setResetTrigger(prev => prev + 1)}
                        className="h-10 px-4 rounded-full bg-background/95 backdrop-blur-md border border-border/40 text-landing-primary dark:text-primary shadow-lg hover:bg-accent/10 flex items-center gap-2 font-bold text-xs transition-all active:scale-95"
                        title="Reset Map Zoom"
                    >
                        <Compass className="w-4 h-4" />
                        Reset Zoom
                    </Button>
                </div>
            </div>

        </div>
    );
};

export default Explore;
