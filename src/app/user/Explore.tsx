import { useState, useEffect, useMemo } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Temple } from "@/types";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Compass,
  MapPin,
  ChevronRight,
  Filter,
  X,
  Bookmark,
  CornerDownRight,
  Info,
  Navigation,
} from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/shared/components/ui/accordion";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";
import DataTableFilter from "@/shared/components/ui/data-table-filter";
import {
  getSthanTypes,
  AVATAR_SAMBANDH_CONFIG,
  getSthanPinInfo,
  getPinImageHtml,
  normalizeAvatarId,
  getAvatarColor,
} from "@/shared/utils/sthanTypes";
import { SthanType } from "@/shared/types/sthanType";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";
import { getLocationUrl } from "@/shared/utils/locationUtils";
import { MapLegendContent } from "@/shared/components/ui/MapLegendPanel";

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
  iconUrl:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzAzLm9yZy9yZ2IvMjAwMC9zdmciPgogIDxjaXJjbGUgY3g9IjIwIiBjeT0iMjAiIHI9IjE4IiBmaWxsPSIjRkNCOTAwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiLz4KICA8cGF0aCBkPSJNMjAgMTJ2MTZNMTIgMjBoMTYiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==", // Placeholder SVG base64
  iconSize: [52, 52],
  iconAnchor: [26, 52],
  popupAnchor: [0, -48],
});

// Custom Blue Temple Icon for Pin Points
const templePinIcon = new L.Icon({
  iconUrl: "/icons/Untitled design.png",
  iconSize: [52, 52],
  iconAnchor: [26, 52], // Bottom center
  popupAnchor: [0, -48], // Adjusted for new icon height
});

const sthanIconsMap: Record<string, L.DivIcon> = {};

// The 4 canonical sthan type categories used in the Sthana Category filter
const CANONICAL_STHAN_TYPES: { label: string; keywords: string[] }[] = [
  { label: "Mahasthan", keywords: ["mahasthan"] },
  { label: "Avasthan", keywords: ["avasthan"] },
  { label: "Vasti Sthan", keywords: ["vasti", "vishti"] },
  { label: "Asan Sthan", keywords: ["asan"] },
  { label: "Charanchari Sthan", keywords: ["charanchari"] },
  { label: "Mandalik Sthan", keywords: ["mandalik"] },
  { label: "Unavailable Sthan", keywords: ["unavailable"] },
];

// Maps a raw sthan name from DB to one of the 4 canonical labels, or null if no match
const toCanonicalSthan = (name: string): string | null => {
  const n = name.toLowerCase();
  for (const c of CANONICAL_STHAN_TYPES) {
    if (c.keywords.some((k) => n.includes(k))) return c.label;
  }
  return null;
};

// Safe helpers using Map to prevent prototype pollution warnings and avoid bracket notation entirely
const getSafeCount = (map: Map<string, number> | undefined | null, key: string | undefined | null): number => {
  if (!map || !key) {
    return 0;
  }
  return map.get(key) || 0;
};

const incrementSafeCount = (map: Map<string, number>, key: string | undefined | null) => {
  if (key) {
    map.set(key, (map.get(key) || 0) + 1);
  }
};

// Helper function to get icon by sthan type and primary avatar
function getIconForTemple(
  temple: Temple,
  sthanTypes: SthanType[],
): L.Icon | L.DivIcon {
  if (!temple) return templePinIcon;

  const sthanTypeId = (temple as any).sthanTypeId || "";
  const pinIconField = (temple as any).pinIcon || "";
  const sName =
    getTranslatedValue((temple as any).sthan || (temple as any).sthanType || temple.sthana, 'en');

  // 1. Resolve the matched SthanType record from DB
  //    Priority: sthanTypeId (exact ID match) → sthan name match
  let matchedSthanType: SthanType | undefined;
  if (sthanTypeId) {
    matchedSthanType = sthanTypes.find((st) => st.id === sthanTypeId);
  }
  if (!matchedSthanType && sName) {
    matchedSthanType = sthanTypes.find((st) => st.name === sName);
  }

  // 2. Resolve primary avatar
  let primaryAvatarId =
    (temple as any).primaryAvatar || (temple as any).avatarSambandh || "";
  if (!primaryAvatarId && matchedSthanType) {
    primaryAvatarId = matchedSthanType.avatarSambandh || "";
  }
  const canonicalAvatarId = normalizeAvatarId(primaryAvatarId);

  // 3. Resolve avatar color
  let avatarColor = "#0e3c6f"; // default blue
  if (canonicalAvatarId) {
    const avatarConfig = AVATAR_SAMBANDH_CONFIG.find(
      (a) => a.id === canonicalAvatarId,
    );
    if (avatarConfig) avatarColor = avatarConfig.color;
  } else if (matchedSthanType?.color) {
    avatarColor = matchedSthanType.color;
  }

  // 4. Resolve pinType from matched sthan type (the DB-configured icon path)
  //    This is the critical fix: use matchedSthanType.pinType so every configured pin is respected.
  const pinType = matchedSthanType?.pinType || pinIconField || "";

  // 5. Build cache key and check cache
  const cacheKey = `${canonicalAvatarId}_${sthanTypeId || sName}_${pinType}`;
  if (sthanIconsMap[cacheKey]) return sthanIconsMap[cacheKey];

  // 6. Render the pin HTML — pass all context for getSthanPinInfo to do final resolution
  const html = getPinImageHtml(
    avatarColor,
    pinType,
    52,
    canonicalAvatarId,
    sName,
    pinIconField,
    sthanTypeId,
    sthanTypes,
  );

  const icon = L.divIcon({
    html,
    className: "custom-sthan-pin",
    iconSize: [52, 52],
    iconAnchor: [26, 52],
    popupAnchor: [0, -48],
  });

  sthanIconsMap[cacheKey] = icon;
  return icon;
}

// Inner Map Component to handle center/zoom updates
function MapEffect({
  temples,
  resetTrigger,
}: {
  temples: Temple[];
  resetTrigger: number;
}) {
  const map = useMap();
  useEffect(() => {
    // Filter valid coordinates and avoid [0,0] which stretches map to Africa
    const validCoords = temples
      .filter((t) => t.latitude && t.longitude && (Math.abs(t.latitude) > 0.1 || Math.abs(t.longitude) > 0.1))
      .map((t) => [t.latitude!, t.longitude!] as [number, number]);

    if (validCoords.length > 0) {
      const bounds = L.latLngBounds(validCoords);
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [80, 80],
          maxZoom: 12,
          animate: true,
          duration: 1.5
        });
      }
    }
  }, [temples, map, resetTrigger]);
  return null;
}

// Separate TempleMarker component to fix React closure issue
function TempleMarker({
  temple,
  onSelect,
  sthanTypes,
}: {
  temple: Temple;
  onSelect: (temple: Temple) => void;
  sthanTypes: SthanType[];
}) {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const langCode = getLangCode(language);
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
          templeCity: getTranslatedValue(temple.city, langCode) || getTranslatedValue(temple.address, langCode) || "",
          templeImage: temple.sthanImages?.[0] || temple.images?.[0] || "",
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
      icon={getIconForTemple(temple, sthanTypes)}
      eventHandlers={{
        click: () => onSelect(temple),
        popupopen: () => setIsPopupOpen(true),
        popupclose: () => setIsPopupOpen(false),
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
            <p className="font-heading text-popover-foreground font-bold text-sm whitespace-nowrap">
              {getTranslatedValue(temple.name, langCode)}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-none mt-1">
              {getTranslatedValue(temple.city, langCode) || getTranslatedValue(temple.district, langCode) || "Maharashtra"}
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
              {getTranslatedValue(temple.name, langCode)}
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
              {getTranslatedValue(temple.city, langCode) && getTranslatedValue(temple.city, langCode) !== getTranslatedValue(temple.district, langCode)
                ? `${getTranslatedValue(temple.city, langCode)}, `
                : ""}
              {getTranslatedValue(temple.district, langCode) || "Maharashtra"}
            </span>
          </div>

          {/* Row 3: Action Buttons (Details + Direction + Saved) */}
          <div className="flex items-center gap-2 pt-1">
            <Button
              className="flex-1 bg-landing-primary hover:bg-landing-primary/90 text-white h-8 md:h-9 rounded-lg shadow-sm text-xs md:text-xs font-bold px-0"
              onClick={() => {
                if ((temple as any).isArchitectureEntry && (temple as any).archiveId) {
                  navigate(`/architectural-archive/${(temple as any).archiveId}/${temple.id}/architecture`);
                } else {
                  navigate(`/temple/${temple.id}/architecture`);
                }
              }}
            >
              {t("explore.details")}
            </Button>
            <button
              className="h-8 w-8 md:h-9 md:w-9 rounded-full border border-slate-200 bg-white transition-all duration-300 hover:bg-slate-50 text-blue-900 flex items-center justify-center shrink-0 shadow-sm"
              title={t("explore.navigate")}
              onClick={(e) => {
                e.stopPropagation();
                const url = getLocationUrl(temple.locationLink, temple.latitude, temple.longitude);
                if (url) {
                  window.open(url, "_blank");
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
                  : "bg-white border-slate-200 text-blue-900 hover:bg-slate-50",
              )}
              title={isSaved ? t("explore.unsave") : t("explore.save")}
            >
              <Bookmark
                className={cn(
                  "w-4 h-4 md:w-5 md:h-5",
                  isSaved && "fill-current",
                )}
              />
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

const Explore = () => {
  const [temples, setTemples] = useState<Temple[]>([]);
  const [allTemplesForOptions, setAllTemplesForOptions] = useState<Temple[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);

  // Pending states (for UI dropdowns)
  const [pendingDistrict, setPendingDistrict] = useState<string>("");
  const [pendingTaluka, setPendingTaluka] = useState<string>("");
  const [pendingSthanaType, setPendingSthanaType] = useState<string>("");
  const [pendingAvatarSambandh, setPendingAvatarSambandh] =
    useState<string>("ALL");
  const [pendingAvatarSubdivision, setPendingAvatarSubdivision] =
    useState<string>("");

  // Applied states (for Firestore query and results)
  const [appliedDistrict, setAppliedDistrict] = useState<string>("");
  const [appliedTaluka, setAppliedTaluka] = useState<string>("");
  const [appliedSthanaType, setAppliedSthanaType] = useState<string>("");

  // Hierarchical Avatar filter
  const [appliedAvatarSambandh, setAppliedAvatarSambandh] =
    useState<string>("ALL");
  const [appliedAvatarSubdivision, setAppliedAvatarSubdivision] =
    useState<string>("");

  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const langCode = getLangCode(language);
  const [selectedTemple, setSelectedTemple] = useState<Temple | null>(null);
  const [resetTrigger, setResetTrigger] = useState(0);

  // Load sthan types and generate icons
  useEffect(() => {
    const loadSthanTypes = async () => {
      const types = await getSthanTypes();

      // Populate icons map using the fetched results directly
      types.forEach((st) => {
        const avatarColor = getAvatarColor(st.avatarSambandh);
        const html = getPinImageHtml(
          avatarColor,
          st.pinType,
          52,
          st.avatarSambandh,
          st.name,
          "",
          st.id,
          types,
        );
        const cacheKey = `${st.avatarSambandh}_${st.id}_`;
        sthanIconsMap[cacheKey] = L.divIcon({
          html,
          className: "custom-sthan-pin",
          iconSize: [52, 52],
          iconAnchor: [26, 52],
          popupAnchor: [0, -48],
        });
      });

      // Trigger re-render which will now use populated map
      setSthanTypes(types);
    };
    loadSthanTypes();
  }, []);

  // Internal state for merging
  const [rawTemplesOptions, setRawTemplesOptions] = useState<Temple[]>([]);
  const [rawArchOptions, setRawArchOptions] = useState<Temple[]>([]);
  const [rawFilteredTemples, setRawFilteredTemples] = useState<Temple[]>([]);
  const [rawFilteredArch, setRawFilteredArch] = useState<Temple[]>([]);

  useEffect(() => {
    setAllTemplesForOptions([...rawTemplesOptions, ...rawArchOptions]);
  }, [rawTemplesOptions, rawArchOptions]);

  // 1. Fetch all temples ONCE to populate filter options (Districts/Talukas)
  useEffect(() => {
    const processData = (docs: any[], isArch: boolean) => {
      return docs.map((doc) => {
        const t = doc.data() as any;
        let lat, lng;

        const rawLat = [t.latitude, t.lat, t.location?.latitude, t.location?.lat].find((v) => v !== undefined && v !== null && v !== "");
        const rawLng = [t.longitude, t.lng, t.location?.longitude, t.location?.lng].find((v) => v !== undefined && v !== null && v !== "");

        if (rawLat !== undefined) lat = Number(rawLat);
        if (rawLng !== undefined) lng = Number(rawLng);

        if (lat === undefined && typeof t.location === "object" && t.location !== null) {
          if (t.location.lat !== undefined) lat = Number(t.location.lat);
          if (t.location.lng !== undefined) lng = Number(t.location.lng);
        }

        return {
          ...t,
          id: doc.id,
          latitude: lat,
          longitude: lng,
          name: isArch ? (t.title || t.name) : t.name,
          isArchitectureEntry: isArch
        };
      }) as Temple[];
    };

    const unsubTemples = onSnapshot(collection(db, "temples"), (snapshot) => {
      setRawTemplesOptions(processData(snapshot.docs, false));
    });

    const unsubArch = onSnapshot(collection(db, "architecture_entries"), (snapshot) => {
      setRawArchOptions(processData(snapshot.docs, true));
    });

    return () => {
      unsubTemples();
      unsubArch();
    };
  }, []);

  // 2. Main Temple Listener - Querying Firestore based on Applied Filters
  useEffect(() => {
    const templesRef = collection(db, "temples");
    const archRef = collection(db, "architecture_entries");
    let qT = query(templesRef);
    let qA = query(archRef);

    const conditions = [];
    if (appliedDistrict) {
      conditions.push(where("district.en", "==", appliedDistrict));
    }
    if (appliedTaluka) {
      conditions.push(where("taluka.en", "==", appliedTaluka));
    }

    if (conditions.length > 0) {
      qT = query(templesRef, ...conditions);
      qA = query(archRef, ...conditions);
    }

    const processData = (docs: any[], isArch: boolean) => {
      return docs.map((doc) => {
        const t = doc.data() as any;
        let lat, lng;

        const rawLat = [t.latitude, t.lat, t.location?.latitude, t.location?.lat].find((v) => v !== undefined && v !== null && v !== "");
        const rawLng = [t.longitude, t.lng, t.location?.longitude, t.location?.lng].find((v) => v !== undefined && v !== null && v !== "");

        if (rawLat !== undefined) lat = Number(rawLat);
        if (rawLng !== undefined) lng = Number(rawLng);

        if (lat === undefined && typeof t.location === "object" && t.location !== null) {
          if (t.location.lat !== undefined) lat = Number(t.location.lat);
          if (t.location.lng !== undefined) lng = Number(t.location.lng);
        }

        return {
          ...t,
          id: doc.id,
          latitude: lat,
          longitude: lng,
          name: isArch ? (t.title || t.name) : t.name,
          isArchitectureEntry: isArch
        };
      }) as Temple[];
    };

    const unsubTemples = onSnapshot(qT, (snapshot) => {
      setRawFilteredTemples(processData(snapshot.docs, false));
    });

    const unsubArch = onSnapshot(qA, (snapshot) => {
      setRawFilteredArch(processData(snapshot.docs, true));
    });

    return () => {
      unsubTemples();
      unsubArch();
    };
  }, [appliedDistrict, appliedTaluka]);

  useEffect(() => {
    const combined = [...rawFilteredTemples, ...rawFilteredArch];
    setTemples(combined);

    if (combined.length > 0 && !selectedTemple) {
      const hampi = combined.find((t) =>
        getTranslatedValue(t.name, "en").toLowerCase().includes("hampi"),
      );
      setSelectedTemple(hampi || combined[0]);
    }
  }, [rawFilteredTemples, rawFilteredArch]);

  // 3. Derived Filter Options with Counts from Database
  const districts = Array.from(
    new Set(allTemplesForOptions.map((t) => getTranslatedValue(t.district, 'en')).filter(Boolean)),
  )
    .sort()
    .map((d) => {
      const firstT = allTemplesForOptions.find(t => getTranslatedValue(t.district, 'en') === d);
      const translatedLabel = getTranslatedValue(firstT?.district, langCode);
      const count = allTemplesForOptions.filter((t) => getTranslatedValue(t.district, 'en') === d).length;
      return {
        value: d,
        label: `${translatedLabel || d} (${count})`,
      };
    });

  const talukas = Array.from(
    new Set(
      allTemplesForOptions
        .filter((t) => !pendingDistrict || getTranslatedValue(t.district, 'en') === pendingDistrict)
        .map((t) => getTranslatedValue(t.taluka, 'en'))
        .filter(Boolean),
    ),
  )
    .sort()
    .map((tVal) => {
      const firstT = allTemplesForOptions.find(curr =>
        getTranslatedValue(curr.taluka, 'en') === tVal &&
        (!pendingDistrict || getTranslatedValue(curr.district, 'en') === pendingDistrict)
      );
      const translatedLabel = getTranslatedValue(firstT?.taluka, langCode);
      const count = allTemplesForOptions.filter((curr) =>
        getTranslatedValue(curr.taluka, 'en') === tVal &&
        (!pendingDistrict || getTranslatedValue(curr.district, 'en') === pendingDistrict)
      ).length;
      return {
        value: tVal,
        label: `${translatedLabel || tVal} (${count})`,
      };
    });

  // 4. Dynamic Sthana Category Options
  const sthanaOptions = useMemo(() => {
    // Normalize the selected avatar once for all comparisons
    const normalizedPendingAvatar =
      pendingAvatarSambandh && pendingAvatarSambandh !== "ALL"
        ? pendingAvatarSambandh
        : "";

    // Determine which sthan types from DB are in scope based on the selected avatar
    let scopedTypes: SthanType[];
    if (normalizedPendingAvatar) {
      scopedTypes = sthanTypes.filter(
        (st) =>
          normalizeAvatarId(st.avatarSambandh) === normalizedPendingAvatar,
      );
    } else {
      scopedTypes = sthanTypes;
    }

    // Build a quick ID → canonical label lookup from scopedTypes for sthanTypeId matching
    const idToCanonical = new Map<string, string>();
    scopedTypes.forEach((st) => {
      const c = toCanonicalSthan(st.name);
      if (c) idToCanonical.set(st.id, c);
    });

    // Collect which canonical categories are actually present in scoped sthan types
    const canonicalPresent = new Set<string>(idToCanonical.values());

    // Helper: resolve canonical sthan label for a single temple record
    const getTempleCanonical = (t: Temple): string | null => {
      const temp = t as any;

      // 1. Try sthan name / sthana text field
      const sthanText = getTranslatedValue(temp.sthan || t.sthana, 'en').toLowerCase();
      if (sthanText) {
        const c = toCanonicalSthan(sthanText);
        if (c) return c;
      }

      // 2. Fallback: resolve via sthanTypeId
      const sthanTypeId: string = temp.sthanTypeId || "";
      if (sthanTypeId && idToCanonical.has(sthanTypeId)) {
        return idToCanonical.get(sthanTypeId)!;
      }

      // 3. Fallback: resolve via sthan name match against all sthanTypes
      if (sthanText) {
        const matched = sthanTypes.find(
          (st) =>
            st.name.toLowerCase() === sthanText ||
            sthanText.includes(st.name.toLowerCase()),
        );
        if (matched) {
          return toCanonicalSthan(matched.name);
        }
      }

      return null;
    };

    // Helper: check if temple matches the selected avatar (normalized)
    const matchesAvatar = (t: Temple): boolean => {
      if (!normalizedPendingAvatar) return true;
      const temp = t as any;
      const tAvatar = normalizeAvatarId(
        temp.primaryAvatar || temp.avatarSambandh || "",
      );
      if (tAvatar === normalizedPendingAvatar) return true;
      // Also try via sthanTypeId for temples with no avatar field set
      const sthanTypeId: string = temp.sthanTypeId || "";
      if (sthanTypeId) {
        const st = sthanTypes.find((s) => s.id === sthanTypeId);
        if (
          st &&
          normalizeAvatarId(st.avatarSambandh) === normalizedPendingAvatar
        )
          return true;
      }
      return false;
    };

    // Helper: check if temple matches the selected subdivision
    const matchesSubdivision = (t: Temple): boolean => {
      if (!pendingAvatarSubdivision) return true;
      const temp = t as any;
      const subTypes: string[] = Array.isArray(temp.avatarSubTypes)
        ? temp.avatarSubTypes
        : [];
      const sub: string = temp.avatarSubdivision || "";
      return (
        subTypes.includes(pendingAvatarSubdivision) ||
        sub === pendingAvatarSubdivision
      );
    };

    // Build options only for present canonical types, counting correctly
    return CANONICAL_STHAN_TYPES.filter((c) =>
      canonicalPresent.has(c.label),
    ).map((c) => {
      const count = allTemplesForOptions.filter((t) => {
        const templeCanonical = getTempleCanonical(t);
        if (templeCanonical !== c.label) return false;
        if (!matchesAvatar(t)) return false;
        if (!matchesSubdivision(t)) return false;
        return true;
      }).length;

      // Use the matching DB sthan type name as the filter value (for filteredTemples logic)
      const matchingDbType = scopedTypes.find(
        (st) => toCanonicalSthan(st.name) === c.label,
      );
      // Convert space separated label to camelCase (e.g. "Vasti Sthan" -> "vastiSthan")
      const getTranslationKey = (label: string): string => {
        const parts = label.split(" ");
        if (parts.length === 1) return label.toLowerCase();
        return parts[0].toLowerCase() + parts.slice(1).map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()).join("");
      };

      return {
        value: matchingDbType?.name ?? c.label,
        label: `${t("explore." + getTranslationKey(c.label))} (${count})`,
      };
    });
  }, [
    sthanTypes,
    allTemplesForOptions,
    pendingAvatarSambandh,
    pendingAvatarSubdivision,
  ]);

  // 5. Calculate dynamic counts for Avatar Sambandh hierarchy
  const avatarCounts = useMemo(() => {
    const counts = {
      ALL: allTemplesForOptions.length,
      byAvatar: new Map<string, number>(),
      bySubdivision: new Map<string, number>(),
    };

    allTemplesForOptions.forEach((t) => {
      const temp = t as any;

      // Resolve primary avatar
      const resAvatarS = temp.primaryAvatar || temp.avatarSambandh;

      // Resolve sub division
      let resAvatarSub = "";
      if (temp.avatarSubTypes && temp.avatarSubTypes.length > 0) {
        resAvatarSub = temp.avatarSubTypes[0]; // just count the first one for backwards compatibility or general counts
      } else {
        resAvatarSub = temp.avatarSubdivision;
      }

      if (resAvatarS) {
        incrementSafeCount(counts.byAvatar, resAvatarS);
      }
      if (resAvatarSub) {
        incrementSafeCount(counts.bySubdivision, resAvatarSub);
      }

      // Legacy fallback if fields are missing
      if (!resAvatarS && (temp.sthan || temp.sthana)) {
        const sName = temp.sthan || temp.sthana;
        const sType = sthanTypes.find((st) => st.name === sName);
        if (sType?.avatarSambandh) {
          incrementSafeCount(counts.byAvatar, sType.avatarSambandh);
          if (sType.avatarSubdivision) {
            incrementSafeCount(counts.bySubdivision, sType.avatarSubdivision);
          }
        }
      }
    });

    return counts;
  }, [allTemplesForOptions, sthanTypes]);

  // Client-side filtering for Search, Sthana Category, and Avatar hierarchy
  const filteredTemples = useMemo(() => {
    return temples.filter((temple) => {
      const matchesSearch =
        !searchQuery ||
        getTranslatedValue(temple.name, "en").toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTranslatedValue(temple.name, "hi").toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTranslatedValue(temple.name, "mr").toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTranslatedValue(temple.city, langCode).toLowerCase().includes(searchQuery.toLowerCase()) ||
        getTranslatedValue(temple.district, langCode).toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSthana =
        !appliedSthanaType ||
        getTranslatedValue((temple as any).sthan || temple.sthana, langCode)
          .toLowerCase()
          .includes(appliedSthanaType.toLowerCase());

      // Avatar hierarchy logic
      if (appliedAvatarSambandh === "ALL")
        return matchesSearch && matchesSthana;

      // Resolve primary avatar
      let resAvatarS =
        (temple as any).primaryAvatar || (temple as any).avatarSambandh;

      // Resolve sub-type (array supported)
      let resAvatarSubArray: string[] = [];
      if (
        (temple as any).avatarSubTypes &&
        Array.isArray((temple as any).avatarSubTypes)
      ) {
        resAvatarSubArray = (temple as any).avatarSubTypes;
      } else if ((temple as any).avatarSubdivision) {
        resAvatarSubArray = [(temple as any).avatarSubdivision];
      }

      // Try to resolve temple's avatar info if missing (legacy data)
      if (!resAvatarS) {
        const sName = getTranslatedValue((temple as any).sthan || temple.sthana, 'en');
        const sType = sthanTypes.find((st) => st.name === sName);
        if (sType) {
          resAvatarS = sType.avatarSambandh;
          resAvatarSubArray = sType.avatarSubdivision
            ? [sType.avatarSubdivision]
            : [];
        }
      }

      if (resAvatarS !== appliedAvatarSambandh) return false;

      if (appliedAvatarSubdivision) {
        // If the filter is applied, ensure the required subdivision is in the temple's subtypes array
        if (!resAvatarSubArray.includes(appliedAvatarSubdivision)) return false;
      }

      return matchesSearch && matchesSthana;
    });
  }, [
    temples,
    searchQuery,
    appliedSthanaType,
    appliedAvatarSambandh,
    appliedAvatarSubdivision,
    sthanTypes,
  ]);

  const activeFiltersCount =
    (appliedDistrict ? 1 : 0) +
    (appliedTaluka ? 1 : 0) +
    (appliedSthanaType ? 1 : 0) +
    (appliedAvatarSambandh !== "ALL" ? 1 : 0);

  const handleApplyFilters = () => {
    setAppliedDistrict(pendingDistrict);
    setAppliedTaluka(pendingTaluka);
    setAppliedSthanaType(pendingSthanaType);
    setAppliedAvatarSambandh(pendingAvatarSambandh);
    setAppliedAvatarSubdivision(pendingAvatarSubdivision);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setPendingDistrict("");
    setPendingTaluka("");
    setPendingSthanaType("");
    setPendingAvatarSambandh("ALL");
    setPendingAvatarSubdivision("");
    setAppliedDistrict("");
    setAppliedTaluka("");
    setAppliedSthanaType("");
    setAppliedAvatarSambandh("ALL");
    setAppliedAvatarSubdivision("");
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
            <img
              src="/icons/Main logo.svg"
              alt="Logo"
              className="absolute left-2 w-12 h-12 object-contain"
            />

            {/* Title - Center */}
            <h1 className="w-full px-10 text-center text-xl md:text-2xl font-heading font-bold text-landing-primary dark:text-primary font-serif whitespace-nowrap">
              {t("explore.title")}
            </h1>
          </div>
        </div>

        {/* Second Row: Search Bar - Responsive & Centered */}
        <div className="pointer-events-auto w-full max-w-sm mx-auto px-4 flex items-center gap-2">
          <div className="relative flex-1 rounded-full bg-background/95 backdrop-blur-md border border-border/40 flex items-center shadow-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3 h-3" />
            <Input
              placeholder={t("explore.searchPlaceholder")}
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
                title={t("explore.aboutMapPins") || "About Map Pins"}
              >
                <Info className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align="end"
              sideOffset={8}
              className="w-72 rounded-[1.25rem] p-3.5 bg-[#FDFBF7] border-[#E8E2D5] shadow-xl"
            >
              <h3 className="text-lg font-heading font-black text-[#2D2D2D] mb-1 px-1 truncate">
                {t("explore.aboutMapPins") || "About Map Pins"}
              </h3>
              <p className="text-[10px] font-sans font-semibold text-slate-500 mb-3 px-1 leading-snug">
                {t("explore.aboutMapPinsSubtitle") || "Understand Sthana types and lineage color indicators."}
              </p>
              <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden pr-1 custom-scrollbar">
                <MapLegendContent sthanTypes={sthanTypes} />
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showFilters && (
        <div className="absolute top-36 left-4 right-4 z-[400] pointer-events-auto">
          <div className="bg-map-bg/95 backdrop-blur-md rounded-[2rem] border border-border p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="font-heading font-black text-xl text-landing-primary dark:text-primary">
                {t("explore.filters")}
              </h3>
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
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">
                    {t("explore.district")}
                  </label>
                  <DataTableFilter
                    label={t("explore.allDistricts")}
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
                  <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">
                    {t("explore.taluka")}
                  </label>
                  <DataTableFilter
                    label={t("explore.allTalukas")}
                    options={talukas}
                    selectedValues={pendingTaluka ? [pendingTaluka] : []}
                    onChange={(values) => setPendingTaluka(values[0] || "")}
                    className="w-full bg-background border-border h-9 text-xs"
                  />
                </div>
              </div>

              {/* Avatar Sambandh Filter */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">
                  {t("explore.avatarSambandh") || "Avatar Sambandh"}
                </label>
                <DataTableFilter
                  label={t("explore.allAvatars")}
                  options={[
                    {
                      value: "ALL",
                      label: `${t("explore.allAvatars")} (${avatarCounts.ALL})`,
                    },
                    ...AVATAR_SAMBANDH_CONFIG.map((a) => ({
                      value: a.id,
                      label: `${a.shortLabel} (${getSafeCount(avatarCounts.byAvatar, a.id)})`,
                    })),
                  ]}
                  selectedValues={
                    pendingAvatarSambandh && pendingAvatarSambandh !== "ALL"
                      ? [pendingAvatarSambandh]
                      : []
                  }
                  onChange={(values) => {
                    setPendingAvatarSambandh(values[0] || "ALL");
                    setPendingAvatarSubdivision("");
                    setPendingSthanaType("");
                  }}
                  className="w-full bg-background border-border h-9 text-xs"
                />
              </div>

              {/* Conditional Subdivision Filter */}
              {(() => {
                const selectedAvatarConfig = AVATAR_SAMBANDH_CONFIG.find(
                  (a) => a.id === pendingAvatarSambandh,
                );
                if (
                  !selectedAvatarConfig ||
                  selectedAvatarConfig.subdivisions.length === 0
                )
                  return null;

                return (
                  <div className="pt-1">
                    <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">
                      {t("explore.subdivision")}
                    </label>
                    <DataTableFilter
                      label={t("explore.allSubdivisions")}
                      options={selectedAvatarConfig.subdivisions.map((sub) => ({
                        value: sub.id,
                        label: `${sub.label} (${getSafeCount(avatarCounts.bySubdivision, sub.id)})`,
                      }))} selectedValues={
                        pendingAvatarSubdivision
                          ? [pendingAvatarSubdivision]
                          : []
                      }
                      onChange={(values) => {
                        setPendingAvatarSubdivision(values[0] || "");
                        setPendingSthanaType("");
                      }}
                      className="w-full bg-background border-border h-9 text-xs"
                    />
                  </div>
                );
              })()}

              {/* Sthana Row */}
              <div className="pt-1">
                <label className="block text-[11px] font-bold text-muted-foreground mb-1.5 uppercase tracking-wider px-1">
                  {t("explore.sthanaCategory")}
                </label>
                <DataTableFilter
                  label={t("explore.allSthanaTypes")}
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
                  {t("explore.clearAll")}
                </Button>
                <Button
                  onClick={handleApplyFilters}
                  className="flex-1 bg-landing-primary hover:bg-landing-primary/90 text-white h-10 rounded-xl shadow-md text-xs font-bold"
                >
                  {t("explore.applyFilters")}
                </Button>
              </div>

              {/* Results Count */}
              <div className="text-center text-[10px] font-black text-accent-gold uppercase tracking-[0.2em] pt-3">
                {t("explore.showing")} {filteredTemples.length} {t("explore.of")}{" "}
                {temples.length} {t("explore.temples")}
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
          {filteredTemples.map(
            (temple) =>
              temple.latitude &&
              temple.longitude && (
                <TempleMarker
                  key={temple.id}
                  temple={temple}
                  onSelect={setSelectedTemple}
                  sthanTypes={sthanTypes}
                />
              ),
          )}
        </MapContainer>

        {/* Reset Zoom Button */}
        <div className="absolute bottom-24 right-4 z-[400] pointer-events-auto">
          <Button
            onClick={() => setResetTrigger((prev) => prev + 1)}
            className="h-10 px-4 rounded-full bg-background/95 backdrop-blur-md border border-border/40 text-landing-primary dark:text-primary shadow-lg hover:bg-accent/10 flex items-center gap-2 font-bold text-xs transition-all active:scale-95"
            title={t("explore.resetZoom")}
          >
            <Compass className="w-4 h-4" />
            {t("explore.resetZoom")}
          </Button>
        </div>

      </div>
    </div>
  );
};

export default Explore;
