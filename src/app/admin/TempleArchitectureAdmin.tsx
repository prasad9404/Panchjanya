// src/pages/admin/TempleArchitectureAdmin.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { SthanaIdentifier } from "@/shared/components/admin/SthanaIdentifier";

import { v4 as uuidv4 } from "uuid";
import { Hotspot, Leela, GlanceItem, AbbreviationItem, CustomBlock, DescriptionSection, SthanDetail, MultilingualString } from "@/types";
import * as LucideIcons from "lucide-react";
import { X, Save, Trash2, Upload, ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Plus, ChevronDown, Image as ImageIcon, Info, MousePointer2, ExternalLink, FileText, Search, ArrowUp, ArrowDown, Check, Database, MapPin, Loader2, RefreshCw, Globe } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { RichTextEditor } from "@/shared/components/ui/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Languages, Wand2 } from "lucide-react";
import { ensureMultilingual } from "@/shared/services/translationService";
import { autoTranslateMultilingual } from "@/shared/services/autoTranslate";
import { getTranslatedValue } from "@/shared/utils/translationUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getSthanTypes, AVATAR_SAMBANDH_CONFIG, getValidSthanTypes, getAvatarColor, normalizeAvatarId, PIN_SERIES } from "@/shared/utils/sthanTypes";
import { getSthanaStatus } from "@/shared/utils/sthanValidation";
import { SthanType } from "@/shared/types/sthanType";
import { cn } from "@/shared/lib/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { ImageUpload } from "@/shared/components/admin/ImageUpload";
import ReactSelect from "react-select";
import { RelatedAvatarsSelect } from "@/shared/components/admin/RelatedAvatarsSelect";
import { RelatedAvatar } from "@/types";

// Local UI state interfaces - The robust interfaces are in @/types

const CUSTOM_ICONS = [
  // { name: "Temple", path: "/icons/Blue_temple_icon-removebg.png" },
  // { name: "Sthan Pin", path: "/icons/Sthan_pin.svg" },
  // { name: "Asan Sthan Pin", path: "/icons/Sthan_pin_Asan.svg" },
  // { name: "Avasthan Pin", path: "/icons/Sthan_pin_Avasthan.svg" },
  // { name: "Mandalik Pin", path: "/icons/Sthan_pin_Mandalik.svg" },
  // { name: "Vasti Pin", path: "/icons/Sthan_pin_Vasti.svg" },
  // { name: "Mahasthan Pin", path: "/icons/mahasthan pin.svg" },

  // Glance Icons
  { name: "Avatar", path: "/icons/glance/icon.svg" },
  { name: "Chakra", path: "/icons/glance/chakra.svg" },
  { name: "Chinese Temple", path: "/icons/glance/chinese-temple.svg" },
  { name: "Warehouse", path: "/icons/glance/warehouse.svg" },
  { name: "Route Path", path: "/icons/glance/route_path.svg" },
  { name: "Parivaar", path: "/icons/glance/parivaar.svg" },
  { name: "Temple Simple", path: "/icons/glance/temple_simple.svg" },
  { name: "Temple Solid", path: "/icons/glance/temple_solid.svg" },
  { name: "Available", path: "/icons/glance/available.svg" },
  { name: "Not Available", path: "/icons/glance/not-available.svg" },
  { name: "All", path: "/icons/glance/all.svg" },
  { name: "Quarantine", path: "/icons/glance/quarantine.svg" },
  { name: "Sthan", path: "/icons/glance/sthan.svg" },
  { name: "Categorization", path: "/icons/glance/categorization.svg" },
  { name: "Import", path: "/icons/glance/import.svg" },
  { name: "Export", path: "/icons/glance/export.svg" },
  { name: "Explore", path: "/icons/explore_safari.png" },
  { name: "Aasan Sthan", path: "/icons/glance/Aasan Sthan.svg" },
  // { name: "Blue Temple", path: "/icons/glance/Blue_temple_icon.svg" },
  // { name: "Direction", path: "/icons/left-arrow.png" },
  // { name: "Route", path: "/icons/route-arrow.png" },
  // { name: "Signpost", path: "/icons/signpost.png" },
  // { name: "Logo", path: "/icons/glance/Logo.svg" },
];

interface HotspotMarkerProps {
  hotspot: Hotspot;
  viewType: 'architectural' | 'present';
  zoom: number;
  isSelected?: boolean;
  isHovered?: boolean;
  onEdit: (h: Hotspot, e: React.MouseEvent) => void;
  onDelete: (h: Hotspot) => void;
  onUnmap: (id: string) => void;
  onClick: (h: Hotspot) => void;
  onMouseEnter: (h: Hotspot) => void;
  onMouseLeave: () => void;
  isClustered?: boolean;
  clusterCount?: number;
}

const HotspotMarker = ({
  hotspot,
  viewType,
  zoom,
  isSelected,
  isHovered,
  onEdit, // Now interpreted as 'start repositioning'
  onDelete,
  onUnmap,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isClustered,
  clusterCount
}: HotspotMarkerProps) => {

  const showActions = isSelected || isHovered;

  return (
    <div
      className={cn(
        "absolute transition-all duration-300 ease-in-out",
        showActions ? "z-50" : "z-30"
      )}
      style={{
        top: `${hotspot.y}%`,
        left: `${hotspot.x}%`,
        transform: `translate(-50%, -100%) scale(${showActions ? 1.2 : 1})`,
        opacity: showActions ? 1 : 0.95
      }}
      onMouseEnter={() => onMouseEnter(hotspot)}
      onMouseLeave={onMouseLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick(hotspot);
      }}
    >
      <div className="relative flex flex-col items-center cursor-pointer group">
        {/* Drop Pin UI */}
        <div className="relative flex items-center justify-center">
          {/* Custom SVG Pin */}
          <svg
            width="32"
            height="40"
            viewBox="0 0 32 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn(
              "drop-shadow-md transition-all duration-300",
              viewType === 'architectural' ? 'text-slate-700' : 'text-blue-600',
              showActions ? 'filter drop-shadow-xl scale-110 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : '',
              isSelected ? 'brightness-125' : ''
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
              fill={isSelected ? "#eff6ff" : "white"}
              stroke={isSelected ? "#3b82f6" : "transparent"}
              strokeWidth={2}
            />
          </svg>

          {/* Number inside the pin circle */}
          <span className={cn(
            "absolute top-[7px] left-1/2 -translate-x-1/2 font-black text-[10px] transition-colors duration-300",
            viewType === 'architectural' ? 'text-slate-800' : 'text-blue-700',
            isSelected ? 'text-blue-600 scale-110' : ''
          )}>
            {hotspot.number}
          </span>
        </div>

        {/* Edit/Delete Icons - Visible on Hover OR Selection */}
        {showActions && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-white rounded-xl shadow-2xl border border-blue-200 animate-in fade-in zoom-in slide-in-from-bottom-2 ring-4 ring-blue-500/5">
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 rounded-lg hover:bg-blue-50 text-blue-600"
              title="Move Hotspot"
              onClick={(e) => { e.stopPropagation(); onEdit(hotspot, e); }}
            >
              <LucideIcons.Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 rounded-lg hover:bg-red-50 text-red-600"
              title="Delete Hotspot"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Remove this hotspot placement?")) {
                  if (viewType === 'present') onUnmap(hotspot.id);
                  else onDelete(hotspot);
                }
              }}
            >
              <LucideIcons.Trash2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export interface TempleArchitectureAdminProps {
  initialStep?: 'sthan-info' | 'architecture-view' | 'sthana-details';
  isEmbedded?: boolean;
  onStepChange?: (step: 'sthan-info' | 'architecture-view' | 'sthana-details') => void;
}

export default function TempleArchitectureAdmin({
  initialStep,
  isEmbedded = false,
  onStepChange
}: TempleArchitectureAdminProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const imageRef = useRef<HTMLImageElement>(null);

  const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'mr'>('en');
  const [templeName, setTempleName] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [viewType, setViewType] = useState<'architectural' | 'present'>('architectural');
  const [archImages, setArchImages] = useState<string[]>([]);
  const [archImagesFitMode, setArchImagesFitMode] = useState<'cover' | 'contain'>('contain');
  const [presentImages, setPresentImages] = useState<string[]>([]);
  const [presentImagesFitMode, setPresentImagesFitMode] = useState<'cover' | 'contain'>('contain');
  const [sthanImages, setSthanImages] = useState<string[]>([]);
  const [sthanImagesFitMode, setSthanImagesFitMode] = useState<'cover' | 'contain'>('contain');
  const [archHotspots, setArchHotspots] = useState<Hotspot[]>([]);
  const [presentHotspots, setPresentHotspots] = useState<Hotspot[]>([]);

  // New Temple Metadata & Sections
  const [todaysName, setTodaysName] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [todaysNameTitle, setTodaysNameTitle] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [address, setAddress] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [taluka, setTaluka] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [district, setDistrict] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [directions_text, setDirectionsText] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [locationLink, setLocationLink] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description_title, setDescriptionTitle] = useState<MultilingualString>({ en: "Sthan At Glance", hi: "एक नज़र में स्थान", mr: "एका दृष्टीक्षेपात स्थान" });
  const [description_text, setDescriptionText] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [sthana_info_title, setSthanaInfoTitle] = useState<MultilingualString>({ en: "Sthan Description", hi: "स्थान विवरण", mr: "स्थान वर्णन" });
  const [sthana_info_text, setSthanaInfoText] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [descriptionSections, setDescriptionSections] = useState<DescriptionSection[]>([]);
  const [glanceItems, setGlanceItems] = useState<GlanceItem[]>([]);
  const [abbreviationItems, setAbbreviationItems] = useState<AbbreviationItem[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [architectureDescription, setArchitectureDescription] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [contactDetails, setContactDetails] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [sthan, setSthan] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [sthanTypeId, setSthanTypeId] = useState("");
  const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);
  const [primaryAvatar, setPrimaryAvatar] = useState("");
  const [primarySubtype, setPrimarySubtype] = useState<string[]>([]);
  const [relatedAvatars, setRelatedAvatars] = useState<RelatedAvatar[]>([]);
  const [pinIcon, setPinIcon] = useState("");

  const [selectedHotspot, setSelectedHotspot] = useState<any | null>(null);
  const [manualStatus, setManualStatus] = useState<any>();
  const [originalTempleData, setOriginalTempleData] = useState<any>(null);
  const [hasArchitecture, setHasArchitecture] = useState(false);
  const [globalLeelas, setGlobalLeelas] = useState<Leela[]>([]);
  const [globalPothiDescription, setGlobalPothiDescription] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [globalPothiTitle, setGlobalPothiTitle] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
  const [details, setDetails] = useState<SthanDetail[]>([]);

  const [repositioningId, setRepositioningId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isAutoTranslateOn, setIsAutoTranslateOn] = useState(false);
  const [saving, setSaving] = useState(false);
  const [adminImageIndex, setAdminImageIndex] = useState(0);
  const [currentStep, setCurrentStepInternal] = useState<'sthan-info' | 'architecture-view' | 'sthana-details'>(initialStep || 'sthan-info');

  useEffect(() => {
    if (initialStep) setCurrentStepInternal(initialStep);
  }, [initialStep]);

  const setCurrentStep = (step: 'sthan-info' | 'architecture-view' | 'sthana-details') => {
    setCurrentStepInternal(step);
    if (onStepChange) onStepChange(step);
  };
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [isAddingHotspot, setIsAddingHotspot] = useState(false);
  const [pendingClickPosition, setPendingClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [hotspotPage, setHotspotPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [detailFilter, setDetailFilter] = useState<'all' | 'linked' | 'independent'>('all');
  const HOTSPOTS_PER_PAGE = 6;
  const [editingTitleId, setEditingTitleId] = useState<string | null>(null);
  const [editingTitleValue, setEditingTitleValue] = useState("");

  const handleAutoTranslateAll = async () => {
    if (!templeName.en) {
      toast({
        title: "Missing Primary Content",
        description: "Please enter at least the English Temple Name to begin translation.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsTranslating(true);
      toast({
        title: "Google Translation Started",
        description: "Translating English content to Hindi and Marathi. This may take a moment...",
      });

      // 1. Core Temple Fields
      const fieldsToTranslate = [
        { current: templeName, setter: setTempleName, label: "Temple Name" },
        { current: todaysName, setter: setTodaysName, label: "Label Name" },
        { current: todaysNameTitle, setter: setTodaysNameTitle, label: "Label Name Title" },
        { current: address, setter: setAddress, label: "Address" },
        { current: taluka, setter: setTaluka, label: "Taluka" },
        { current: district, setter: setDistrict, label: "District" },
        { current: description_title, setter: setDescriptionTitle, label: "Sthan At Glance Title" },
        { current: description_text, setter: setDescriptionText, label: "Sthan At Glance Content" },
        { current: sthana_info_title, setter: setSthanaInfoTitle, label: "Detailed Narrative Title" },
        { current: sthana_info_text, setter: setSthanaInfoText, label: "Detailed Narrative Content" },
        { current: directions_text, setter: setDirectionsText, label: "Directions" },
        { current: architectureDescription, setter: setArchitectureDescription, label: "Architecture Description" },
        { current: sthan, setter: setSthan, label: "Sthan Type" },
      ];

      for (const field of fieldsToTranslate) {
        // We check the 'en' value from the snapshot 'field.current'
        if (field.current.en) {
          const translated = await autoTranslateMultilingual(field.current.en);

          // Use functional update to merge with latest state!
          // This avoids overwriting manual Hindi/Marathi work and ensures we don't 'wipe' states
          field.setter((prev: any) => ({
            ...prev,
            hi: (prev && prev.hi) || translated.hi,
            mr: (prev && prev.mr) || translated.mr,
            // Keep existing languages if they exist, only fill if missing
          }));
        }
      }

      toast({
        title: "Translation Complete",
        description: "All primary temple information has been localized using Google Cloud.",
      });

    } catch (error) {
      console.error("[Admin] Batch translation failed:", error);
      toast({
        title: "Translation Error",
        description: "An error occurred during batch translation. Please check your network or API key.",
        variant: "destructive"
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const updateHotspotTitle = async (hotspotId: string, newTitle: string) => {
    // 1. Update Hotspot Array
    const updatedHotspots = archHotspots.map(h =>
      h.id === hotspotId ? { ...h, title: { ...h.title, [activeLang]: newTitle } } : h
    );
    setArchHotspots(updatedHotspots);
    setEditingTitleId(null);

    // 2. Sync with Sthan Details! Create or Update the matching detail segment.
    const updatedDetails = [...details];
    const existingDetailIndex = updatedDetails.findIndex(d => d.hotspotId === hotspotId);

    if (existingDetailIndex >= 0) {
      // Update existing title
      updatedDetails[existingDetailIndex] = {
        ...updatedDetails[existingDetailIndex],
        title: { ...updatedDetails[existingDetailIndex].title, [activeLang]: newTitle }
      };
    } else {
      // Create new linked detail automatically
      updatedDetails.push({
        id: uuidv4(),
        hotspotId: hotspotId,
        title: { en: activeLang === 'en' ? newTitle : "", hi: activeLang === 'hi' ? newTitle : "", mr: activeLang === 'mr' ? newTitle : "" },
        description: { en: "", hi: "", mr: "" },
        images: [],
        leelas: [],
        type: 'structure'
      } as SthanDetail);
    }
    setDetails(updatedDetails);

    // Persist to main doc
    try {
      const token = await user?.getIdToken();
      fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ hotspots: sanitizeData(updatedHotspots), details: sanitizeData(updatedDetails) })
      });
    } catch (e) { console.error('Title save failed:', e); }
  };

  const liveStatus = getSthanaStatus({
    ...originalTempleData,
    name: templeName,
    sthanTypeId,
    district,
    primaryAvatar,
    status: manualStatus || originalTempleData?.status
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        setLoading(true);

        let data;
        let presentHotspotsData = [];

        // 1. Try Fetching via API
        try {
          const token = await user?.getIdToken();
          const templeRes = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
          });
          const contentType = templeRes.headers.get("content-type");

          if (templeRes.ok && contentType?.includes("application/json")) {
            data = await templeRes.json();

            // Load present hotspots from main doc field if it exists
            if (data.present_hotspots && Array.isArray(data.present_hotspots)) {
              presentHotspotsData = data.present_hotspots;
            }

            // Also check subcollection for legacy data
            try {
              const hotspotsRes = await fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots`, {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
              });
              if (hotspotsRes.ok) {
                const subData = await hotspotsRes.json();
                if (Array.isArray(subData) && subData.length > 0) {
                  // Merge or prioritize? Let's prioritize subcollection if main field is empty
                  if (presentHotspotsData.length === 0) {
                    presentHotspotsData = subData;
                  }
                }
              }
            } catch (e) {
              console.warn("API subcollection fetch failed, ignoring for now.");
            }
          }
        } catch (apiError: any) {
          console.error("API fetch failed:", apiError);
          toast({
            title: "API Error",
            description: "Failed to connect to the Admin API. Ensure vercel dev is running.",
            variant: "destructive",
          });
        }

        // 3. Populate State
        if (data) {
          setTempleName(ensureMultilingual(data.name));
          setArchImages(data.architectureImages || []);
          setArchImagesFitMode(data.architectureImagesFitMode || 'contain');
          setPresentImages(data.presentImages || []);
          setPresentImagesFitMode(data.presentImagesFitMode || 'contain');
          setSthanImages(data.sthanImages || []);
          setSthanImagesFitMode(data.sthanImagesFitMode || 'contain');
          setArchHotspots(data.hotspots || []);

          setTodaysName(ensureMultilingual(data.todaysName));
          setTodaysNameTitle(ensureMultilingual(data.todaysNameTitle));
          setAddress(ensureMultilingual(data.address));
          setTaluka(ensureMultilingual(data.taluka));
          setDistrict(ensureMultilingual(data.district));
          setDirectionsText(ensureMultilingual(data.directions_text || data.wayToReach));
          setLocationLink(data.locationLink || "");
          setLatitude(data.latitude || "");
          setLongitude(data.longitude || "");
          setDescriptionTitle(ensureMultilingual(data.description_title || "Sthan At Glance"));
          setDescriptionText(ensureMultilingual(
            data.description_text || data.description || data.architectureDescription
          ));
          setSthanaInfoTitle(ensureMultilingual(data.sthana_info_title || "Sthan Description"));
          setSthanaInfoText(ensureMultilingual(
            data.sthana_info_text || data.sthana || data.sthanPothiDescription || data.details?.[0]?.sthanPothiDescription
          ));
          setDescriptionSections((data.descriptionSections || []).map((s: any) => ({
            ...s,
            title: ensureMultilingual(s.title),
            content: ensureMultilingual(s.content)
          })));
          setGlanceItems((data.glanceItems || []).map((g: any) => ({
            ...g,
            description: ensureMultilingual(g.description)
          })));
          setAbbreviationItems((data.abbreviationItems || []).map((a: any) => ({
            ...a,
            description: ensureMultilingual(a.description)
          })));
          setCustomBlocks((data.customBlocks || []).map((b: any) => ({
            ...b,
            title: ensureMultilingual(b.title),
            content: ensureMultilingual(b.content)
          })));
          setArchitectureDescription(ensureMultilingual(data.architectureDescription));
          setContactDetails(ensureMultilingual(data.contactDetails));
          setContactName(data.contactName || "");
          setContactNumber(data.contactNumber || "");
          setSthan(ensureMultilingual(data.sthanType || data.sthan));
          setSthanTypeId(data.sthanTypeId || "");
          setPrimaryAvatar(data.primaryAvatar || data.avatarSambandh || "");
          setPrimarySubtype(data.primarySubtype || data.avatarSubTypes || (data.avatarSubdivision ? [data.avatarSubdivision] : []));


          if (Array.isArray(data.relatedAvatars)) {
            if (data.relatedAvatars.length > 0 && typeof data.relatedAvatars[0] === 'string') {
              setRelatedAvatars(data.relatedAvatars.map((id: string) => ({ avatar: id, subtype: [] })));
            } else {
              setRelatedAvatars(data.relatedAvatars);
            }
          } else {
            setRelatedAvatars([]);
          }

          setPinIcon(data.pinIcon || "");

          setOriginalTempleData(data);
          setManualStatus(data.status);

          setHasArchitecture(data.hasArchitecture !== undefined
            ? data.hasArchitecture
            : (data.isStandalone !== undefined ? !data.isStandalone : (data.architectureImages && data.architectureImages.length > 0)));
          setGlobalLeelas(data.leelas || []);
          setGlobalPothiDescription(ensureMultilingual(data.sthanPothiDescription));
          setGlobalPothiTitle(ensureMultilingual(data.sthanPothiTitle));

          // ── Migration / Sync Logic ──
          let masterDetails = data.details || [];

          // If no details exist, but hotspots do, migrate hotspots to details
          if (masterDetails.length === 0 && data.hotspots && data.hotspots.length > 0) {
            masterDetails = data.hotspots.map((h: any) => ({
              id: h.id,
              title: ensureMultilingual(h.title || `Sacred Point #${h.number}`),
              description: ensureMultilingual(h.description),
              images: h.images || [],
              leelas: h.leelas || [],
              sthanPothiDescription: ensureMultilingual(h.sthanPothiDescription),
              sthanPothiTitle: ensureMultilingual(h.sthanPothiTitle),
              generalDescriptionTitle: ensureMultilingual(h.generalDescriptionTitle),
              hotspotId: h.id,
              type: h.type || 'Structure'
            }));
          } else {
            // Normalize ALL existing details: convert any legacy plain-string fields to MultilingualString
            // This handles the case where descriptions were saved as raw strings before multilingual support
            masterDetails = masterDetails.map((d: any) => {
              // Normalize legacy leelas arrays or raw string .leela fields
              let rawLeelas: any[] = [];
              if (Array.isArray(d.leelas)) {
                rawLeelas = d.leelas;
              } else if (d.leelas && typeof d.leelas === 'string') {
                rawLeelas = d.leelas.split('\n').filter((l: string) => l.trim());
              } else if (d.leela && typeof d.leela === 'string') {
                rawLeelas = d.leela.split('\n').filter((l: string) => l.trim());
              }

              const normalizedLeelas = rawLeelas.map((l: any, i: number) => {
                if (typeof l === 'string') {
                  // Legacy simple string. Migrate onto 'description'
                  return { id: `leela_${i}_${Date.now()}`, title: ensureMultilingual(''), description: ensureMultilingual(l) };
                }
                return {
                  ...l,
                  id: l.id || `leela_${i}_${Date.now()}`,
                  title: ensureMultilingual(l.title || ''),
                  description: ensureMultilingual(l.description || '')
                };
              });

              return {
                ...d,
                title: ensureMultilingual(d.title),
                description: ensureMultilingual(d.description),
                sthanPothiDescription: ensureMultilingual(d.sthanPothiDescription),
                sthanPothiTitle: ensureMultilingual(d.sthanPothiTitle),
                generalDescriptionTitle: ensureMultilingual(d.generalDescriptionTitle),
                leelas: normalizedLeelas
              };
            });
          }

          setDetails(masterDetails);

          if (presentHotspotsData.length > 0) {
            setPresentHotspots(presentHotspotsData);
          }
        }
      } catch (error) {
        console.error("Error fetching temple:", error);

        let errorMsg = "Failed to load temple data.";
        if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
          errorMsg += " (Check API and Firestore permissions)";
        }

        toast({
          title: "Load Error",
          description: errorMsg,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    const loadSthanTypes = async () => {
      const types = await getSthanTypes();
      setSthanTypes(types);
    };

    fetchData();
    loadSthanTypes();
  }, [id, toast]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If we clicked on an existing hotspot, ignore (it has its own handler)
    if ((e.target as HTMLElement).closest('.group.absolute')) return;

    // Deselect if clicking on background
    setSelectedHotspot(null);
    setHoveredHotspotId(null);

    if (!imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Handle Repositioning
    if (repositioningId) {
      const updatedHotspots = currentHotspots.map(h =>
        h.id === repositioningId ? { ...h, x, y } : h
      );

      if (viewType === 'architectural') setArchHotspots(updatedHotspots);
      else setPresentHotspots(updatedHotspots);

      setRepositioningId(null);
      toast({ title: "Position Updated", description: "Hotspot relocated successfully." });

      // Auto-save the position
      const movedHotspot = updatedHotspots.find(h => h.id === repositioningId);
      if (movedHotspot) {
        saveHotspotAtPosition(movedHotspot, updatedHotspots);
      }
      return;
    }

    if (viewType === 'present') {
      setPendingClickPosition({ x, y });
      return;
    }

    // Default: Create a new hotspot (for arch view) - ONLY if in placement mode
    if (!isAddingHotspot) return;

    const newHotspot: Hotspot = {
      id: uuidv4(),
      x,
      y,
      imageIndex: adminImageIndex,
      title: { en: "", hi: "", mr: "" },
      description: { en: "", hi: "", mr: "" }, // Required by Hotspot type
      images: [],      // Required by Hotspot type
      number: archHotspots.length + 1,
      isPresent: false,
    };

    setArchHotspots(prev => [...prev, newHotspot]);
    setEditingTitleId(newHotspot.id);
    setEditingTitleValue('');
    setIsAddingHotspot(false); // Disable mode after adding
    toast({ title: "Hotspot Added", description: `Placement #${newHotspot.number} created. Please enter a title.` });
  };

  const displayImages = viewType === 'architectural'
    ? archImages
    : presentImages;

  const currentHotspots = viewType === 'architectural' ? archHotspots : presentHotspots;
  const currentImageUrl = displayImages[adminImageIndex];

  const handleHotspotEdit = (hotspot: Hotspot, e: React.MouseEvent) => {
    e.stopPropagation();
    setRepositioningId(hotspot.id);
    toast({
      title: "Repositioning Mode",
      description: "Click anywhere on the image to move this hotspot."
    });
  };

  const saveHotspotAtPosition = async (hotspot: Hotspot, allHotspots: Hotspot[]) => {
    if (!id) return;
    try {
      const token = await user?.getIdToken();
      const sanitized = sanitizeData(hotspot);

      const collectionParam = viewType === 'architectural' ? 'architecture_hotspots' : 'present_hotspots';

      // Update specific hotspot in its subcollection
      fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=${collectionParam}&subId=${hotspot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(sanitized)
      });

      // Also sync the main array for architectural view (legacy support)
      if (viewType === 'architectural') {
        fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ hotspots: sanitizeData(allHotspots) })
        });
      } else {
        fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ present_hotspots: sanitizeData(allHotspots) })
        });
      }
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  };

  // Helper helper to remove undefined values
  const sanitizeData = (data: any): any => {
    // JSON.stringify automatically removes undefined values from objects
    return JSON.parse(JSON.stringify(data));
  };


  const saveTempleDetails = async () => {
    if (!id || !user) return;

    const finalStatus = manualStatus || liveStatus;

    // Audit Trail Logic
    const isNewlyVerified = finalStatus === 'VERIFIED' && originalTempleData?.status !== 'VERIFIED' && originalTempleData?.status !== 'PUBLISHED';
    const isNewlyPublished = finalStatus === 'PUBLISHED' && originalTempleData?.status !== 'PUBLISHED';

    // ── Deep-merge guard: never overwrite a non-empty DB value with an empty UI value ──
    // If the admin UI has an empty string (e.g. due to a language switch), we fall back
    // to the original data loaded from Firestore so we never destroy existing content.
    const safeML = (uiVal: any, originalVal: any) => {
      const ui = { en: uiVal?.en || '', hi: uiVal?.hi || '', mr: uiVal?.mr || '' };
      const orig = { en: originalVal?.en || '', hi: originalVal?.hi || '', mr: originalVal?.mr || '' };
      return {
        en: ui.en || orig.en,
        hi: ui.hi || orig.hi,
        mr: ui.mr || orig.mr,
      };
    };

    const updateData: any = {
      name: safeML(templeName, originalTempleData?.name),
      todaysName: safeML(todaysName, originalTempleData?.todaysName),
      todaysNameTitle: safeML(todaysNameTitle, originalTempleData?.todaysNameTitle),
      address: safeML(address, originalTempleData?.address),
      taluka: safeML(taluka, originalTempleData?.taluka),
      district: safeML(district, originalTempleData?.district),
      directions_text: safeML(directions_text, originalTempleData?.directions_text),
      locationLink,
      latitude,
      longitude,
      sthanImages: sthanImages,
      description_title: safeML(description_title, originalTempleData?.description_title),
      description_text: safeML(description_text, originalTempleData?.description_text),
      sthana_info_title: safeML(sthana_info_title, originalTempleData?.sthana_info_title),
      sthana_info_text: safeML(sthana_info_text, originalTempleData?.sthana_info_text),
      descriptionSections,
      glanceItems,
      abbreviationItems,
      customBlocks,
      architectureDescription: safeML(architectureDescription, originalTempleData?.architectureDescription),
      contactDetails: safeML(contactDetails, originalTempleData?.contactDetails),
      contactName,
      contactNumber,
      sthan: safeML(sthan, originalTempleData?.sthan),
      sthanType: safeML(sthan, originalTempleData?.sthanType), // Standardized field
      sthanTypeId,
      primaryAvatar,
      primarySubtype,
      relatedAvatars,
      pinIcon,
      status: finalStatus,
      hasArchitecture,
      leelas: globalLeelas,
      sthanPothiDescription: safeML(globalPothiDescription, originalTempleData?.sthanPothiDescription),
      isStandalone: !hasArchitecture, // sync for backward compatibility
      details: details, // New dynamic details array
      hotspots: archHotspots,
      present_hotspots: presentHotspots,
      updatedAt: new Date().toISOString(),
      updatedBy: user.uid,
    };

    if (isNewlyVerified) {
      updateData.verifiedAt = new Date().toISOString();
      updateData.verifiedBy = user.uid;
    }

    if (isNewlyPublished) {
      updateData.publishedAt = new Date().toISOString();
      updateData.publishedBy = user.uid;
    }

    try {
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updateData)
      });
      if (res.ok) {
        toast({ title: "Success", description: "Temple details updated." });
        setOriginalTempleData({ ...originalTempleData, ...updateData });
      } else {
        throw new Error("API save failed.");
      }
    } catch (e: any) {
      console.error("API Save error:", e);
      toast({ title: "Error", description: "Failed to save details: " + (e.message || "API Error"), variant: "destructive" });
    }
  };

  const saveTempleDetailsDirectly = async (data: any) => {
    if (!id || !user) return;

    const sanitizedInput = sanitizeData(data);

    // Safety audit timestamps for direct saves too if status is passed
    if (sanitizedInput.status === 'VERIFIED' && originalTempleData?.status !== 'VERIFIED' && originalTempleData?.status !== 'PUBLISHED') {
      sanitizedInput.verifiedAt = new Date().toISOString();
      sanitizedInput.verifiedBy = user.uid;
    }
    if (sanitizedInput.status === 'PUBLISHED' && originalTempleData?.status !== 'PUBLISHED') {
      sanitizedInput.publishedAt = new Date().toISOString();
      sanitizedInput.publishedBy = user.uid;
    }

    sanitizedInput.updatedAt = new Date().toISOString();
    sanitizedInput.updatedBy = user.uid;

    try {
      const token = await user?.getIdToken();
      await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(sanitizedInput)
      });
    } catch (e: any) {
      console.error("Direct save failed:", e);
    }
  };

  const saveMainImageOnly = async (type: 'arch' | 'present') => {
    // This is now redundant with handleImageUpload but keeping signature for safety if used elsewhere
    const url = type === 'arch' ? archImages[0] : presentImages[0];
    if (!url) return;

    handleImageUpload(url, type === 'arch' ? 'architectural' : 'present');
  };

  const addDescriptionSection = () => {
    const newSection: DescriptionSection = {
      id: uuidv4(),
      title: { en: "", hi: "", mr: "" },
      content: { en: "", hi: "", mr: "" },
      page_type: 'page1',
      order: descriptionSections.length
    };
    setDescriptionSections([...descriptionSections, newSection]);
  };

  const updateDescriptionSection = (sId: string, field: 'title' | 'content', value: string) => {
    setDescriptionSections(descriptionSections.map(s => s.id === sId ? { ...s, [field]: { ...s[field], [activeLang]: value } } : s));
  };

  const removeDescriptionSection = (sId: string) => {
    setDescriptionSections(descriptionSections.filter(s => s.id !== sId));
  };

  const addGlanceItem = () => {
    const newItem: GlanceItem = { id: uuidv4(), icon: CUSTOM_ICONS[0].path, description: { en: "", hi: "", mr: "" } };
    setGlanceItems([...glanceItems, newItem]);
  };

  const updateGlanceItem = (gId: string, field: 'icon' | 'description', value: string) => {
    if (field === 'icon') {
      setGlanceItems(glanceItems.map(g => g.id === gId ? { ...g, icon: value } : g));
    } else {
      setGlanceItems(glanceItems.map(g => g.id === gId ? { ...g, description: { ...g.description, [activeLang]: value } } : g));
    }
  };

  const removeGlanceItem = (gId: string) => {
    setGlanceItems(glanceItems.filter(g => g.id !== gId));
  };

  const addCustomBlock = () => {
    const newBlock: CustomBlock = {
      id: uuidv4(),
      title: { en: "", hi: "", mr: "" },
      content: { en: "", hi: "", mr: "" },
      page_type: 'page2',
      order: customBlocks.length
    };
    setCustomBlocks([...customBlocks, newBlock]);
  };

  const updateCustomBlock = (bId: string, field: 'title' | 'content', value: string) => {
    setCustomBlocks(customBlocks.map(b => b.id === bId ? { ...b, [field]: { ...b[field], [activeLang]: value } } : b));
  };

  const removeCustomBlock = (id: string) => {
    setCustomBlocks(customBlocks.filter(block => block.id !== id));
  };

  const moveCustomBlock = (index: number, direction: 'up' | 'down') => {
    const newBlocks = [...customBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBlocks.length) return;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setCustomBlocks(newBlocks);
  };

  const moveGlanceItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...glanceItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setGlanceItems(newItems);
  };

  const addAbbreviationItem = () => {
    const newItem: AbbreviationItem = { id: uuidv4(), icon: CUSTOM_ICONS[0].path, description: { en: "", hi: "", mr: "" } };
    setAbbreviationItems([...abbreviationItems, newItem]);
  };

  const updateAbbreviationItem = (gId: string, field: 'icon' | 'description', value: string) => {
    if (field === 'icon') {
      setAbbreviationItems(abbreviationItems.map(g => g.id === gId ? { ...g, icon: value } : g));
    } else {
      setAbbreviationItems(abbreviationItems.map(g => g.id === gId ? { ...g, description: { ...g.description, [activeLang]: value } } : g));
    }
  };

  const removeAbbreviationItem = (gId: string) => {
    setAbbreviationItems(abbreviationItems.filter(g => g.id !== gId));
  };

  const moveAbbreviationItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...abbreviationItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;
    [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
    setAbbreviationItems(newItems);
  };

  const deleteHotspot = async (targetHotspot?: Hotspot) => {
    const hotspotToDelete = targetHotspot || selectedHotspot;
    if (!hotspotToDelete || !id) return;

    if (!confirm(`Are you sure you want to delete ${hotspotToDelete.title || `Hotspot #${hotspotToDelete.number}`}? This will remove it from all views.`)) return;

    try {
      if (hotspotToDelete.isPresent) {
        // Delete from array in main doc
        const newPresent = presentHotspots.filter((h) => h.id !== hotspotToDelete.id);
        setPresentHotspots(newPresent);

        const token = await user?.getIdToken();
        const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ present_hotspots: newPresent })
        });

        if (!res.ok) {
          throw new Error("API delete failed.");
        }

        // Also delete from subcollection for legacy support
        fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots&subId=${hotspotToDelete.id}`, {
          method: 'DELETE',
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        }).catch(e => console.warn("Background subcollection delete failed:", e));
      } else {
        // Delete from architectural hotspots array in main doc via generic Admin API
        const newArch = archHotspots.filter((h) => h.id !== hotspotToDelete.id);
        setArchHotspots(newArch);

        // Remove referenced Sthan Detail to keep data synced
        const newDetails = details.filter(d => d.hotspotId !== hotspotToDelete.id);
        setDetails(newDetails);

        const token = await user?.getIdToken();
        const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ hotspots: sanitizeData(newArch), details: sanitizeData(newDetails) })
        });

        if (!res.ok) {
          throw new Error("API delete-update failed.");
        }
      }

      toast({
        title: "Deleted",
        description: "Hotspot removed successfully",
      });

      if (selectedHotspot?.id === hotspotToDelete.id) {
        setSelectedHotspot(null);
      }
    } catch (error) {
      console.error("Error deleting hotspot:", error);
      toast({
        title: "Error",
        description: "Failed to delete hotspot",
        variant: "destructive",
      });
    }
  };

  const unmapHotspot = async (hotspotId: string) => {
    if (!id) return;
    if (!confirm("Are you sure you want to remove this hotspot from this specific photo? (It will still exist in the master list)")) return;
    try {
      // Use generic Admin API
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots&subId=${hotspotId}`, {
        method: 'DELETE',
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      const updatedPresent = presentHotspots.filter(h => h.id !== hotspotId);
      await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ present_hotspots: updatedPresent })
      });

      setPresentHotspots(updatedPresent);
      toast({ title: "Unmapped", description: "Hotspot removed from this view." });
    } catch (e) {
      console.error("Error unmapping hotspot:", e);
      toast({ title: "Error", description: "Failed to unmap hotspot.", variant: "destructive" });
    }
  };

  const handleImageUpload = async (url: string, section: 'sthan' | 'architectural' | 'present') => {
    if (!id) return;
    try {
      const fieldToUpdate = section === 'sthan' ? "sthanImages" : section === 'architectural' ? "architectureImages" : "presentImages";
      const currentImages = section === 'sthan' ? sthanImages : section === 'architectural' ? archImages : presentImages;
      const updatedImages = [...currentImages, url];

      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [fieldToUpdate]: updatedImages })
      });

      if (!res.ok) throw new Error("API image update failed.");

      if (section === 'sthan') setSthanImages(updatedImages);
      else if (section === 'architectural') setArchImages(updatedImages);
      else setPresentImages(updatedImages);

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error updating image:", error);
      toast({
        title: "Error",
        description: "Failed to update image",
        variant: "destructive",
      });
    }
  };

  const handleUpdateFitMode = async (section: 'sthan' | 'architectural' | 'present', mode: 'cover' | 'contain') => {
    if (!id) return;
    try {
      const fieldToUpdate = section === 'sthan'
        ? "sthanImagesFitMode"
        : section === 'architectural'
          ? "architectureImagesFitMode"
          : "presentImagesFitMode";

      const token = await user?.getIdToken();
      await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [fieldToUpdate]: mode })
      });

      if (section === 'sthan') setSthanImagesFitMode(mode);
      else if (section === 'architectural') setArchImagesFitMode(mode);
      else setPresentImagesFitMode(mode);

      toast({ title: "Fit Mode Updated", description: `Images will now use ${mode} mode.` });
    } catch (error) {
      console.error("Error updating fit mode:", error);
      toast({ title: "Error", description: "Failed to update fit mode.", variant: "destructive" });
    }
  };

  const handleDeleteImage = async (url: string, section: 'sthan' | 'architectural' | 'present') => {
    if (!id || !confirm("Are you sure you want to delete this image?")) return;

    try {
      // 1. Remove from Storage
      const { deleteObject, ref } = await import("firebase/storage");
      const { storage } = await import("@/auth/firebase");
      try {
        const imageRef = ref(storage, url);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn("Storage deletion failed (might be a direct URL):", e);
      }

      // 2. Remove from Firestore array
      const fieldToUpdate = section === 'sthan' ? "sthanImages" : section === 'architectural' ? "architectureImages" : "presentImages";
      const currentImages = section === 'sthan' ? sthanImages : section === 'architectural' ? archImages : presentImages;
      const updatedImages = currentImages.filter(img => img !== url);

      const token = await user?.getIdToken();
      await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [fieldToUpdate]: updatedImages })
      });

      if (section === 'sthan') setSthanImages(updatedImages);
      else if (section === 'architectural') setArchImages(updatedImages);
      else setPresentImages(updatedImages);

      toast({ title: "Deleted", description: "Image removed successfully." });
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast({ title: "Error", description: "Failed to delete image.", variant: "destructive" });
    }
  };

  const removeArchitecture = async () => {
    if (!confirm("Are you sure you want to REMOVE all architecture data? This will clear all architecture images and hotspots. Global details will be preserved.")) return;

    setArchImages([]);
    setArchHotspots([]);
    setHasArchitecture(false);

    const unlinkedDetails = details.map(d => ({ ...d, hotspotId: null }));
    setDetails(unlinkedDetails);

    // Auto-save the change
    saveTempleDetailsDirectly({
      architectureImages: [],
      hotspots: [],
      details: unlinkedDetails,
      hasArchitecture: false,
      isStandalone: true
    });

    setCurrentStep('sthana-details');
    toast({ title: "Architecture Removed", description: "This sthan is now standalone." });
  };

  const removeGalleryImage = async (index: number) => {
    if (!id) return;
    try {
      const fieldToUpdate = viewType === 'architectural' ? "architectureImages" : "presentImages";
      const currentImages = viewType === 'architectural' ? archImages : presentImages;
      const urlToDelete = currentImages[index];

      // 1. Remove from Storage
      const { deleteObject, ref } = await import("firebase/storage");
      const { storage } = await import("@/auth/firebase");
      try {
        const imageRef = ref(storage, urlToDelete);
        await deleteObject(imageRef);
      } catch (e) {
        console.warn("Storage deletion failed:", e);
      }

      const actualIndex = index; // The index in the display list (which is displayImages[index])

      const updatedImages = currentImages.filter((_, i) => i !== index);

      // Handle Hotspots updates
      let updatedHotspotsList: Hotspot[] = [];
      const currentHotspotsList = viewType === 'architectural' ? archHotspots : presentHotspots;

      updatedHotspotsList = currentHotspotsList
        .filter(h => (h.imageIndex || 0) !== actualIndex)
        .map(h => {
          if ((h.imageIndex || 0) > actualIndex) {
            return { ...h, imageIndex: (h.imageIndex || 0) - 1 };
          }
          return h;
        });

      if (viewType === 'architectural') {
        const token = await user?.getIdToken();
        await fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            [fieldToUpdate]: updatedImages,
            hotspots: updatedHotspotsList
          })
        });
        setArchImages(updatedImages);
        setArchHotspots(updatedHotspotsList);
      } else {
        // For present view
        const hotspotsToDelete = presentHotspots.filter(h => (h.imageIndex || 0) === actualIndex);
        const hotspotsToUpdate = presentHotspots.filter(h => (h.imageIndex || 0) > actualIndex);

        const updatedPresentHotspots = presentHotspots
          .filter(h => (h.imageIndex || 0) !== actualIndex)
          .map(h => {
            if ((h.imageIndex || 0) > actualIndex) {
              return { ...h, imageIndex: (h.imageIndex || 0) - 1 };
            }
            return h;
          });

        const token = await user?.getIdToken();
        await fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            [fieldToUpdate]: updatedImages,
            present_hotspots: updatedPresentHotspots
          })
        });

        setPresentImages(updatedImages);
        setPresentHotspots(updatedPresentHotspots);
      }

      if (adminImageIndex === actualIndex) {
        setAdminImageIndex(0);
      } else if (adminImageIndex > actualIndex) {
        setAdminImageIndex(adminImageIndex - 1);
      }

      toast({ title: "Success", description: "Image and associated hotspots removed." });
    } catch (error: any) {
      console.error("Error removing image:", error);
      toast({ title: "Error", description: "Failed to remove image.", variant: "destructive" });
    }
  };

  const removeImageFromHotspot = (index: number, type: 'present' | 'old' = 'present') => {
    if (!selectedHotspot) return;

    if (type === 'present') {
      setSelectedHotspot({
        ...selectedHotspot,
        images: selectedHotspot.images.filter((_, i) => i !== index),
      });
    } else {
      setSelectedHotspot({
        ...selectedHotspot,
        oldImages: (selectedHotspot.oldImages || []).filter((_, i) => i !== index),
      });
    }
  };

  const addLeela = () => {
    if (!selectedHotspot) return;
    const newLeela: Leela = {
      id: uuidv4(),
      title: { en: "", hi: "", mr: "" },
      description: { en: "", hi: "", mr: "" }
    };
    setSelectedHotspot({
      ...selectedHotspot,
      leelas: (Array.isArray(selectedHotspot.leelas)
        ? [...selectedHotspot.leelas, newLeela]
        : [newLeela]) as Leela[]
    });
  };

  const updateLeela = (id: string, description: string) => {
    if (!selectedHotspot || !Array.isArray(selectedHotspot.leelas)) return;
    setSelectedHotspot({
      ...selectedHotspot,
      leelas: (selectedHotspot.leelas as any[]).map((l: any) =>
        typeof l === 'string' ? l : (l.id === id ? { ...l, description: { ...l.description, [activeLang]: description } } : l)
      ) as Leela[]
    });
  };

  const removeLeela = (id: string) => {
    if (!selectedHotspot || !Array.isArray(selectedHotspot.leelas)) return;
    setSelectedHotspot({
      ...selectedHotspot,
      leelas: (selectedHotspot.leelas as any[]).filter((l: any) =>
        typeof l === 'string' ? l !== id : l.id !== id
      ) as Leela[]
    });
  };

  const addDetail = () => {
    const newDetail: SthanDetail = {
      id: uuidv4(),
      title: { en: "", hi: "", mr: "" },
      description: { en: "", hi: "", mr: "" },
      images: [],
      leelas: [],
      type: 'Structure',
      hotspotId: null
    };
    setDetails([...details, newDetail]);
    setSelectedHotspot(newDetail as any); // Use editor for new detail
    setCurrentStep('sthana-details');
  };

  const updateDetail = (dId: string, updates: Partial<SthanDetail>) => {
    setDetails(details.map(d => d.id === dId ? { ...d, ...updates } : d));
  };

  const deleteDetail = (dId: string) => {
    if (!confirm("Are you sure you want to delete this content entry? This will NOT delete the related map hotspot if linked.")) return;
    setDetails(details.filter(d => d.id !== dId));
    if (selectedHotspot?.id === dId) setSelectedHotspot(null);
    toast({ title: "Deleted", description: "Detail entry removed." });
  };

  const filteredListHotspots = viewType === 'architectural'
    ? archHotspots.filter(h => (h.imageIndex || 0) === adminImageIndex)
    : archHotspots;

  const totalPages = Math.ceil(filteredListHotspots.length / HOTSPOTS_PER_PAGE);
  const paginatedHotspots = filteredListHotspots.slice((hotspotPage - 1) * HOTSPOTS_PER_PAGE, hotspotPage * HOTSPOTS_PER_PAGE);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  const templeData = {
    name: templeName,
    status: manualStatus || liveStatus,
    sthan: sthan,
    primaryAvatar: primaryAvatar,
    district: district,
  };

  const content = (
    <div className="min-h-screen flex flex-col">
      {!isEmbedded && (
        <div className="bg-white border-b border-slate-100 transition-all duration-300 mb-2 rounded-[32px] shadow-sm">
          <div className="max-w-full mx-auto px-8 py-5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/admin/sthana-directory")}
                className="group flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 hover:bg-white border border-slate-100/50 hover:border-blue-100 transition-all duration-500"
              >
                <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:-translate-x-0.5 transition-all" />
              </Button>
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Panchjanya Admin</p>
                <h1 className="text-sm font-black text-slate-900 uppercase tracking-tight">Manage Architecture</h1>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="hidden md:flex items-center gap-6">
                {['sthan-info', 'architecture-view', 'sthana-details'].map((stepId) => {
                  const isActive = currentStep === stepId;
                  const labels = { 'sthan-info': 'Info', 'architecture-view': 'View', 'sthana-details': 'Details' };
                  return (
                    <button
                      key={stepId}
                      onClick={() => setCurrentStep(stepId as any)}
                      className={cn(
                        "text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-500",
                        isActive ? "text-blue-600 scale-105" : "text-slate-300 hover:text-slate-400"
                      )}
                    >
                      {labels[stepId as keyof typeof labels]}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Integrated Progress Bar */}
          <div className="bg-slate-50 h-[1.5px] w-full relative">
            <div
              className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
              style={{
                width: `${((['sthan-info', 'architecture-view', 'sthana-details'].indexOf(currentStep) + 1) / 3) * 100}%`
              }}
            />
          </div>
        </div>
      )}

      {/* Admin Operations Header (Non-Sticky) */}
      <div className="w-full bg-white border-b border-slate-200 py-3 mb-6 transition-all">
        <div className={cn("max-w-7xl mx-auto px-8 lg:px-12", isEmbedded && "max-w-none px-0")}>
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Left side: Language switcher + Auto-Translate button */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-slate-100 hidden sm:flex">
                <div className="p-1.5 bg-blue-50 rounded-lg">
                  <Languages className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Content Language</span>
              </div>

              <Tabs value={activeLang} onValueChange={(v) => setActiveLang(v as any)} className="w-fit">
                <TabsList className="bg-slate-100 p-1 h-10 rounded-xl border border-slate-200">
                  <TabsTrigger value="en" className="rounded-lg px-4 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">English</TabsTrigger>
                  <TabsTrigger value="hi" className="rounded-lg px-4 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">हिंदी</TabsTrigger>
                  <TabsTrigger value="mr" className="rounded-lg px-4 text-[11px] font-bold data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm transition-all">मराठी</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-100/50 px-3 py-2 rounded-xl border border-slate-100/50 transition-colors hover:bg-slate-100">
                  <Label htmlFor="auto-translate-switch-admin" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 cursor-pointer">
                    Auto Translate
                  </Label>
                  <Switch
                    id="auto-translate-switch-admin"
                    checked={isAutoTranslateOn}
                    onCheckedChange={setIsAutoTranslateOn}
                    className="data-[state=checked]:bg-blue-500 h-[20px] w-[36px]"
                  />
                </div>
                {isAutoTranslateOn && (
                  <Button
                    onClick={handleAutoTranslateAll}
                    disabled={isTranslating}
                    variant="outline"
                    className="h-10 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 font-bold px-4 gap-2 transition-all"
                  >
                    {isTranslating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Translating...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4" />
                        Auto-Translate (Google)
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Right side: Primary Save Changes button */}
            <Button
              onClick={saveTempleDetails}
              className="bg-blue-900 text-white hover:bg-black rounded-xl px-8 h-11 font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-900/20 transition-all flex items-center gap-3 shrink-0"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      <div className={cn("max-w-7xl mx-auto w-full px-8 lg:px-12 py-10 pb-32", isEmbedded && "max-w-none px-0 pt-0")}>

        {/* Step 1: Sthan Info */}
        {currentStep === 'sthan-info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 max-w-5xl mx-auto pb-32">

            <div className="grid grid-cols-1 gap-12 pt-4">
              {/* 1. Essential Identity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Essential Identity</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                    Basic information that identifies this sacred location on the platform.
                  </p>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Temple Name * ({activeLang.toUpperCase()})</Label>
                      <Input
                        value={templeName[activeLang]}
                        onChange={(e) => setTempleName({ ...templeName, [activeLang]: e.target.value })}
                        placeholder="e.g. Shri Chakradhar Swami Temple"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 font-medium"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={todaysNameTitle[activeLang]}
                          onChange={(e) => setTodaysNameTitle({ ...todaysNameTitle, [activeLang]: e.target.value })}
                          className="h-8 p-0 px-2 w-fit min-w-[120px] text-sm font-semibold text-slate-700 border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md transition-all"
                          placeholder="Label Name"
                        />
                        <span className="text-slate-400 font-normal text-sm">(Optional)</span>
                      </div>
                      <Input
                        value={todaysName[activeLang]}
                        onChange={(e) => setTodaysName({ ...todaysName, [activeLang]: e.target.value })}
                        placeholder="e.g. Patan, Gujarat"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Address ({activeLang.toUpperCase()})</Label>
                    <Textarea
                      value={address[activeLang]}
                      onChange={(e) => setAddress({ ...address, [activeLang]: e.target.value })}
                      placeholder="Enter the complete address..."
                      rows={3}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Taluka ({activeLang.toUpperCase()})</Label>
                      <Input
                        value={taluka[activeLang]}
                        onChange={(e) => setTaluka({ ...taluka, [activeLang]: e.target.value })}
                        placeholder="e.g. Sidhpur"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">District ({activeLang.toUpperCase()})</Label>
                      <Input
                        value={district[activeLang]}
                        onChange={(e) => setDistrict({ ...district, [activeLang]: e.target.value })}
                        placeholder="e.g. Patan"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Primary Avatar *</Label>
                      <Select
                        value={primaryAvatar}
                        onValueChange={(v) => {
                          setPrimaryAvatar(v);
                          setPrimarySubtype([]); // reset subtypes
                        }}
                        required
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Select Primary Avatar">
                            {primaryAvatar ? (() => {
                              const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar);
                              return cfg ? (
                                <span className="flex items-center gap-2">
                                  <span className="w-3 h-3 rounded-full shrink-0 inline-block" style={{ backgroundColor: cfg.color }} />
                                  {cfg.label}
                                </span>
                              ) : 'Select Primary Avatar';
                            })() : 'Select Primary Avatar'}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-72">
                          {AVATAR_SAMBANDH_CONFIG.map((av) => (
                            <SelectItem key={av.id} value={av.id}>
                              <div className="flex items-center gap-2.5">
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: av.color }} />
                                <span>{av.label}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {((AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar)?.subdivisions.length || 0) > 0) && (
                      <div className="space-y-2 animate-in fade-in duration-300">
                        <Label className="text-sm font-semibold text-slate-700">Avatar Sub Type(s)</Label>
                        <ReactSelect
                          isMulti
                          options={AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar)?.subdivisions.filter(s => s.id !== 'complete').map(s => ({ value: s.id, label: s.label }))}
                          value={AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar)?.subdivisions
                            .filter(s => primarySubtype.includes(s.id))
                            .map(s => ({ value: s.id, label: s.label }))}
                          onChange={(selected) => setPrimarySubtype(selected ? selected.map((s: any) => s.value) : [])}
                          placeholder="Select Sub Types..."
                          className="react-select-container text-sm"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              minHeight: '48px',
                              borderRadius: '0.75rem',
                              borderColor: '#e2e8f0',
                              boxShadow: 'none',
                              '&:hover': { borderColor: '#cbd5e1' }
                            })
                          }}
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Sthan Type *</Label>
                      <Select
                        value={sthanTypeId || (typeof sthan === 'object' ? (sthan[activeLang] || "") : (sthan || ""))}
                        onValueChange={(v) => {
                          const typeObj = sthanTypes.find(t => t.id === v || t.name === v);
                          if (typeObj) {
                            setSthan(ensureMultilingual(typeObj.name));
                            setSthanTypeId(typeObj.id);
                            if (typeObj.pinType) {
                              setPinIcon(typeObj.pinType);
                            }
                          } else {
                            setSthan({ ...sthan, [activeLang]: v });
                            setSthanTypeId("");
                          }
                        }}
                      >
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                          <SelectValue placeholder="Select Sthan Type" />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidSthanTypes(primaryAvatar, sthanTypes).map(st => (
                            <SelectItem key={st.id} value={st.id}>
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-2.5 h-2.5 rounded-full shrink-0"
                                  style={{ backgroundColor: getAvatarColor(st.avatarSambandh) || st.color }}
                                />
                                <span>{st.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                          {sthan && !sthanTypeId && (() => {
                            const sthanVal = typeof sthan === 'object' ? sthan[activeLang] : sthan;
                            const existsInList = getValidSthanTypes(primaryAvatar, sthanTypes).some(t => t.name === sthanVal);
                            // Only render if value is non-empty (Radix crashes on empty string values)
                            if (!sthanVal || existsInList) return null;
                            return (
                              <SelectItem value={sthanVal}>
                                <div className="flex items-center gap-2">
                                  <span>{sthanVal}</span>
                                </div>
                              </SelectItem>
                            );
                          })()}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-400">Defines the default map pin icon.</p>
                    </div>

                    <RelatedAvatarsSelect
                      value={relatedAvatars}
                      onChange={setRelatedAvatars}
                      excludeAvatarId={primaryAvatar}
                    />
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200/60" />

              {/* 2. Navigation & Access */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Navigation & Access</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                    Help pilgrims find their way to this sacred site.
                  </p>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Detailed Directions ({activeLang.toUpperCase()})</Label>
                    <RichTextEditor
                      value={directions_text[activeLang]}
                      onChange={(val) => setDirectionsText({ ...directions_text, [activeLang]: val })}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Contact Person <span className="text-slate-400 font-normal">(Optional)</span></Label>
                      <Input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="e.g. Mahant Shri..."
                        className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Contact Number <span className="text-slate-400 font-normal">(Optional)</span></Label>
                      <Input
                        value={contactNumber}
                        onChange={(e) => setContactNumber(e.target.value)}
                        placeholder="e.g. +91 99XXXXXXXX"
                        className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Note <span className="text-slate-400 font-normal">(Optional)</span></Label>
                    <Textarea
                      value={contactDetails[activeLang] || ""}
                      onChange={(e) => setContactDetails({ ...contactDetails, [activeLang]: e.target.value })}
                      placeholder="Extra information, timings, etc..."
                      rows={2}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Latitude</Label>
                      <Input
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="e.g. 23.8506"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Longitude</Label>
                      <Input
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="e.g. 72.1154"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Google Maps Integration (URL)</Label>
                    <div className="relative group">
                      <Input
                        value={locationLink}
                        onChange={(e) => setLocationLink(e.target.value)}
                        placeholder="https://goo.gl/maps/..."
                        className="h-12 pl-10 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                      <ExternalLink className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200/60" />

              {/* Temple Gallery */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sthan Gallery</h2>
                  <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-500">
                    Upload photos of the temple entrance, surroundings, and views.
                  </p>
                </div>
                <div className="lg:col-span-2 space-y-4 max-w-2xl">
                  {/* Dedicated Upload Area */}
                  <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <ImageUpload
                      variant="gallery"
                      folderPath={`sthan/${id}`}
                      onUpload={(url) => handleImageUpload(url, 'sthan')}
                      label="Upload Photo"
                      fitMode={sthanImagesFitMode}
                      onFitModeChange={(mode) => handleUpdateFitMode('sthan', mode)}
                      className="bg-slate-50/50 border-slate-200/60"
                    />
                  </div>

                  {/* Existing Photos Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-px flex-1 bg-slate-100" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">Gallery Images ({sthanImages.length})</span>
                      <div className="h-px flex-1 bg-slate-100" />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                      {sthanImages.map((url, idx) => (
                        <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden border border-slate-100 shadow-lg bg-slate-50 transition-all duration-300 hover:shadow-xl hover:scale-[1.02]">
                          <img src={url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-between p-2">
                            <Button
                              variant="secondary"
                              size="icon"
                              className="w-6 h-6 rounded-md bg-white/90 backdrop-blur-sm text-slate-900 border-none shadow-lg hover:bg-white"
                              onClick={() => window.open(url, '_blank')}
                              title="Preview"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="w-6 h-6 rounded-md bg-red-600/90 backdrop-blur-sm text-white border-none shadow-lg hover:bg-red-600"
                              onClick={() => handleDeleteImage(url, 'sthan')}
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {sthanImages.length === 0 && (
                        <div className="md:col-span-3 lg:col-span-4 p-12 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30 flex flex-col items-center justify-center text-center">
                          <ImageIcon className="w-12 h-12 text-slate-200 mb-4" />
                          <p className="text-sm font-bold text-slate-400">No photos in gallery yet.</p>
                          <p className="text-[10px] text-slate-300 uppercase tracking-widest mt-1">Uploaded images will appear here</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-200/60" />

              {/* 3. Descriptive Content */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 text-slate-900">
                <div>
                  <div className="flex items-center justify-between lg:block">
                    <h2 className="text-xl font-bold">Descriptive Content</h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addDescriptionSection}
                      className="lg:mt-4 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-4 font-bold gap-2"
                    >
                      <Plus className="w-4 h-4" /> Add Block
                    </Button>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                    Add custom sections like "History", "Significance", or "Unique Features".
                  </p>
                </div>
                <div className="lg:col-span-2 space-y-8">
                  {/* Standard Mandatory Blocks */}
                  <div className="space-y-6">
                    {/* Sthan At Glance */}
                    <div className="p-6 bg-amber-50/30 rounded-3xl border border-amber-100 shadow-sm space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Block Title</span>
                          <div className="h-px flex-1 bg-amber-100/50" />
                        </div>
                        <Input
                          value={description_title[activeLang]}
                          onChange={(e) => setDescriptionTitle({ ...description_title, [activeLang]: e.target.value })}
                          placeholder="Sthan At Glance"
                          className="h-12 border-none bg-white rounded-xl font-bold text-lg focus:ring-2 focus:ring-amber-200 transition-all px-4"
                        />
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Iconic Details</span>
                            <div className="h-px w-20 bg-amber-100/50" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addGlanceItem}
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100/50 font-bold text-xs"
                          >
                            <Plus className="w-3 h-3 mr-1" /> Add Detail
                          </Button>
                        </div>

                        <div className="space-y-3">
                          {glanceItems.map((item, idx) => (
                            <div key={item.id} className="flex items-start gap-3 bg-white/50 p-3 rounded-2xl border border-amber-100/50 group transition-all hover:bg-white">
                              <div className="flex flex-col gap-1 mt-1">
                                <button
                                  onClick={() => moveGlanceItem(idx, 'up')}
                                  disabled={idx === 0}
                                  className="text-slate-300 hover:text-amber-600 disabled:opacity-0 transition-opacity"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={() => moveGlanceItem(idx, 'down')}
                                  disabled={idx === glanceItems.length - 1}
                                  className="text-slate-300 hover:text-amber-600 disabled:opacity-0 transition-opacity"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>
                              </div>

                              <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="md:col-span-1">
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" className="w-full justify-between h-10 rounded-xl border-amber-100 bg-white">
                                        <div className="flex items-center gap-2 truncate">
                                          {item.icon ? (
                                            <img
                                              src={item.icon}
                                              className="w-4 h-4 object-contain"
                                              alt="icon"
                                              onError={(e) => (e.currentTarget.src = "/icons/sthan.png")}
                                            />
                                          ) : (
                                            <Info className="w-4 h-4 text-amber-600" />
                                          )}
                                          <span className="text-xs font-medium">
                                            {item.icon.startsWith('http')
                                              ? "Custom URL"
                                              : (CUSTOM_ICONS.find(ic => ic.path === item.icon)?.name || "Select Icon")
                                            }
                                          </span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[360px] max-h-[420px] overflow-y-auto p-4 space-y-4 shadow-xl border-slate-200">
                                      <div className="space-y-3">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Select Custom Icon</Label>
                                        <div className="grid grid-cols-4 gap-3">
                                          {CUSTOM_ICONS.map(icon => (
                                            <button
                                              key={icon.path}
                                              onClick={() => updateGlanceItem(item.id, 'icon', icon.path)}
                                              className={`aspect-square rounded-xl p-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-200 border bg-white ${item.icon === icon.path ? 'border-[#0f3c6e] bg-[#0f3c6e]/5 ring-1 ring-[#0f3c6e]/30 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm'}`}
                                              title={icon.name}
                                            >
                                              <img src={icon.path} className="w-7 h-7 object-contain opacity-90 transition-transform group-hover:scale-110" alt={icon.name} />
                                              <span className="text-[10px] font-medium text-slate-600 truncate w-full text-center leading-tight">
                                                {icon.name}
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <Separator className="bg-slate-200" />
                                      <div className="space-y-2">
                                        <Label className="text-xs font-bold uppercase tracking-wider text-slate-500">Or Enter Custom URL</Label>
                                        <div className="flex gap-2">
                                          <Input
                                            placeholder="https://..."
                                            value={item.icon.startsWith('http') ? item.icon : ''}
                                            onChange={(e) => updateGlanceItem(item.id, 'icon', e.target.value)}
                                            className="h-8 text-xs rounded-lg"
                                          />
                                          {item.icon.startsWith('http') && (
                                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateGlanceItem(item.id, 'icon', CUSTOM_ICONS[0].path)}>
                                              <X className="w-3 h-3" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                </div>
                                <div className="md:col-span-3">
                                  <Input
                                    value={item.description[activeLang]}
                                    onChange={(e) => updateGlanceItem(item.id, 'description', e.target.value)}
                                    placeholder="Brief description..."
                                    className="h-10 rounded-xl border-amber-100 bg-white text-sm"
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => removeGlanceItem(item.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                          {glanceItems.length === 0 && (
                            <p className="text-[10px] text-center text-slate-400 italic py-2">
                              No iconic details added. Click "Add Detail" to begin.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sthan Description */}
                    <div className="p-6 bg-blue-50/30 rounded-3xl border border-blue-100 shadow-sm space-y-6">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Block Title</span>
                          <div className="h-px flex-1 bg-blue-100/50" />
                        </div>
                        <Input
                          value={sthana_info_title[activeLang]}
                          onChange={(e) => setSthanaInfoTitle({ ...sthana_info_title, [activeLang]: e.target.value })}
                          placeholder="Sthan Description"
                          className="h-12 border-none bg-white rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-200 transition-all px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Detailed Narrative</span>
                          <div className="h-px flex-1 bg-blue-100/50" />
                        </div>
                        <RichTextEditor
                          value={sthana_info_text[activeLang]}
                          onChange={(val) => setSthanaInfoText({ ...sthana_info_text, [activeLang]: val })}
                          placeholder="Detailed sthan description..."
                          className="border-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 py-4">
                    <Separator className="flex-1 opacity-50" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] whitespace-nowrap">Additional Custom Blocks</span>
                    <Separator className="flex-1 opacity-50" />
                  </div>

                  {descriptionSections.length === 0 ? (
                    <div className="p-10 border-2 border-dashed border-slate-200 rounded-3xl text-center bg-slate-50/50">
                      <p className="text-slate-400 font-medium">No additional descriptive blocks added yet.</p>
                      <Button variant="link" onClick={addDescriptionSection} className="text-blue-600 font-black mt-2">
                        Click here to add one
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {descriptionSections.map((s, idx) => (
                        <div key={s.id} className="group relative p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                          <button
                            onClick={() => removeDescriptionSection(s.id)}
                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                            title="Remove this block"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          <div className="grid grid-cols-1 gap-6">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Block Title</span>
                                <div className="h-px flex-1 bg-slate-100" />
                              </div>
                              <Input
                                value={s.title[activeLang]}
                                onChange={(e) => updateDescriptionSection(s.id, 'title', e.target.value)}
                                placeholder="e.g. History"
                                className="h-12 border-none bg-slate-50/80 rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-100 transition-all px-4"
                              />
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Detailed Narrative</span>
                                <div className="h-px flex-1 bg-slate-100" />
                              </div>
                              <RichTextEditor
                                value={s.content[activeLang]}
                                onChange={(val) => updateDescriptionSection(s.id, 'content', val)}
                                placeholder="Add custom content here..."
                                className="border-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-20 pb-10">
              <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-slate-200 shadow-sm">
                <div className="space-y-0.5">
                  <Label className="text-sm font-bold text-slate-900 leading-none">Architecture View</Label>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Toggle Mapping Step</p>
                </div>
                <Switch
                  checked={hasArchitecture}
                  onCheckedChange={setHasArchitecture}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>

              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  if (hasArchitecture) {
                    setCurrentStep('architecture-view');
                  } else {
                    setCurrentStep('sthana-details');
                  }
                }}
                className="bg-blue-900 px-10 h-16 rounded-2xl font-black shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all text-white gap-3 group"
              >
                {hasArchitecture
                  ? "Next Step: Architecture Mapping"
                  : "Next Step: Sthan Details"}
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Architecture View */}
        {currentStep === 'architecture-view' && hasArchitecture && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Quick Tips Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MousePointer2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">
                    {viewType === 'architectural' ? "Architecture Mapping" : "Present View Mapping"}
                  </h4>
                  <p className="text-xs text-blue-700/70 leading-relaxed font-medium">
                    {viewType === 'architectural'
                      ? "In this section, upload architecture diagrams and click to define sacred points (hotspots)."
                      : "Here you can upload present-day photos. To add interactive pins, select a sacred point from the list below after clicking on the photo."}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-amber-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-amber-900">Gallery Management</h4>
                  <p className="text-xs text-amber-700/70 leading-relaxed font-medium">
                    Add supplemental views using the "Add Photo" card in the gallery strip below.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  onClick={() => {
                    if (confirm("Any unsaved changes will be lost. Return to dashboard?")) {
                      navigate("/admin");
                    }
                  }}
                  className="w-fit p-0 h-auto hover:bg-transparent text-muted-foreground hover:text-primary transition-colors flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>

                <div>
                  <h2 className="text-2xl font-serif font-bold text-slate-800">{templeName[activeLang]}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/80 mt-1">Architecture Management</p>
                </div>
              </div>



              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 mr-4 bg-muted p-1 rounded-lg">
                  <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(zoom - 0.2, 0.5))}>
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium min-w-[50px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(zoom + 0.2, 3))}>
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Section Switcher */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex justify-center bg-slate-100 p-1.5 rounded-2xl w-fit mx-auto border border-slate-200 shadow-inner group">
                <button
                  onClick={() => {
                    setViewType('architectural');
                    setAdminImageIndex(0);
                  }}
                  className={`px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${viewType === 'architectural'
                    ? 'bg-white shadow-xl text-blue-600 scale-105'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                >
                  <LucideIcons.Layout className="w-4 h-4" />
                  Architecture View
                </button>

                <button
                  onClick={() => {
                    setViewType('present');
                    setAdminImageIndex(0);
                  }}
                  className={`px-10 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-500 flex items-center gap-2 ${viewType === 'present'
                    ? 'bg-white shadow-xl text-blue-600 scale-105'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                    }`}
                >
                  <LucideIcons.Camera className="w-4 h-4" />
                  Present View
                </button>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] animate-pulse">
                {viewType === 'architectural' ? 'Managing Architecture Visuals & Hotspots' : 'Managing Present Day Photos & Mapping'}
              </p>
            </div>

            {/* Unified Multi-Image Management Slider */}
            <Card className="overflow-hidden border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-serif">
                    {viewType === 'architectural' ? 'Architecture Editor' : 'Present Photo Manager'}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground font-medium">
                    {viewType === 'architectural'
                      ? 'Upload architecture diagrams and place hotspots to define sacred points.'
                      : 'Upload present-day photos and map them to existing architectural hotspots.'}
                  </p>
                </div>
                {viewType === 'architectural' && (
                  <Button
                    onClick={() => {
                      setIsAddingHotspot(true);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      toast({
                        title: "Placement Mode Active",
                        description: "Click anywhere on the large architectural image at the top to place a new hotspot pinpoint.",
                      });
                    }}
                    className={cn(
                      "h-12 px-6 rounded-xl shadow-lg transition-all font-bold gap-2 group shrink-0",
                      isAddingHotspot ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/10"
                    )}
                  >
                    <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                    <span>Add New Hotspot</span>
                  </Button>
                )}
              </CardHeader>
              <CardContent className="p-0 space-y-6">
                {/* 1. Large Image Editor Area */}
                <div className="bg-slate-950 rounded-2xl overflow-hidden border-4 border-slate-800 shadow-2xl relative group min-h-[400px] md:min-h-[600px] flex items-center justify-center">
                  {/* Navigation Arrows */}
                  {displayImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setAdminImageIndex((p) => (p - 1 + displayImages.length) % displayImages.length)}
                        className="absolute left-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-xl transition-all border border-white/10 hover:scale-110 active:scale-95"
                      >
                        <ChevronLeft className="w-8 h-8" />
                      </button>
                      <button
                        onClick={() => setAdminImageIndex((p) => (p + 1) % displayImages.length)}
                        className="absolute right-4 z-20 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-xl transition-all border border-white/10 hover:scale-110 active:scale-95"
                      >
                        <ChevronRight className="w-8 h-8" />
                      </button>
                    </>
                  )}

                  {/* Hotspot Interaction Plane */}
                  <div
                    className="relative cursor-crosshair transition-all duration-500 ease-out"
                    style={{
                      transform: `scale(${zoom})`,
                      filter: loading ? 'blur(10px)' : 'none'
                    }}
                    onClick={handleImageClick}
                  >
                    {displayImages[adminImageIndex] ? (
                      <>
                        <img
                          ref={imageRef}
                          src={displayImages[adminImageIndex] || "/icons/temple-placeholder.jpg"}
                          alt="Active View"
                          className="max-h-[80vh] w-auto shadow-2xl transition-transform duration-700 select-none"
                          draggable={false}
                          onError={(e) => (e.currentTarget.src = "/icons/temple-placeholder.jpg")}
                        />

                        {/* Active Image Hotspots */}
                        {currentHotspots
                          .filter(h => (h.imageIndex || 0) === adminImageIndex)
                          .map((hotspot) => (
                            <HotspotMarker
                              key={hotspot.id}
                              hotspot={hotspot}
                              viewType={viewType}
                              zoom={zoom}
                              isSelected={selectedHotspot?.id === hotspot.id}
                              isHovered={hoveredHotspotId === hotspot.id}
                              onEdit={handleHotspotEdit}
                              onDelete={deleteHotspot}
                              onUnmap={unmapHotspot}
                              onClick={(h) => {
                                setSelectedHotspot(h);
                                // Scroll the corresponding card in the list into view
                                const cardId = `hotspot-card-${h.id}`;
                                const cardElement = document.getElementById(cardId);
                                if (cardElement) {
                                  cardElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              onMouseEnter={(h) => setHoveredHotspotId(h.id)}
                              onMouseLeave={() => setHoveredHotspotId(null)}
                            />
                          ))
                        }

                      </>
                    ) : (
                      <div className="text-white text-center p-20 border-4 border-dashed border-white/10 rounded-3xl backdrop-blur-sm">
                        <Upload className="w-16 h-16 mx-auto mb-4 text-slate-500" />
                        <p className="text-xl font-medium text-slate-300">No images available</p>
                        <p className="text-slate-500 mt-2">Upload a main or supplemental image to begin</p>
                      </div>
                    )}
                  </div>

                  {/* Status Badges */}
                  <div className="absolute top-6 left-6 flex gap-2">
                    <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-xl text-xs font-bold text-white border border-white/10 shadow-2xl flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${adminImageIndex === 0 ? 'bg-amber-500' : 'bg-blue-500'}`}></div>
                      {adminImageIndex === 0 ? "PRIMARY IMAGE" : `SUPPLEMENTAL PHOTO ${adminImageIndex}`}
                    </div>
                  </div>

                  {/* Image Controls Overlay */}
                  <div className="absolute bottom-6 right-6 flex gap-2">
                    {displayImages.length > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600/20 hover:bg-red-600 text-red-100 backdrop-blur-xl border border-red-600/30 shadow-2xl"
                        onClick={() => {
                          if (confirm(adminImageIndex === 0 ? "Remove the primary image and all its hotspots?" : "Remove this image and all its hotspots?")) {
                            removeGalleryImage(adminImageIndex);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    )}
                    {displayImages.length === 0 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/10 shadow-2xl"
                          >
                            <ImageIcon className="w-4 h-4 mr-2" />
                            Change Main Image
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 overflow-hidden border-2 shadow-xl" align="end">
                          <ImageUpload
                            folderPath={viewType === 'architectural' ? `architectural/${id}` : `present/${id}`}
                            onUpload={(url) => handleImageUpload(url, viewType === 'architectural' ? 'architectural' : 'present')}
                            label="Change Image"
                            fitMode={viewType === 'architectural' ? archImagesFitMode : presentImagesFitMode}
                            onFitModeChange={(mode) => handleUpdateFitMode(viewType === 'architectural' ? 'architectural' : 'present', mode)}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-black/40 hover:bg-red-600 text-white backdrop-blur-xl border border-white/10 shadow-2xl font-black text-[10px] tracking-tight"
                        onClick={removeArchitecture}
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        REMOVE ARCHITECTURE
                      </Button>
                      <Button
                        onClick={() => saveMainImageOnly(adminImageIndex === 0 ? (viewType === 'architectural' ? 'arch' : 'present') : 'arch' /* fallback */)}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 hover:bg-white/20 text-white backdrop-blur-xl border border-white/10"
                      >
                        <Save className="w-4 h-4 mr-2" /> Save Image URL
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 2. Thumbnail Strip (Middle Section) */}
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                      <ChevronDown className="w-4 h-4" />
                      Photo Gallery ({displayImages.length})
                    </h3>
                    <p className="text-xs text-slate-500">Pick an image to manage its hotspots</p>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x">
                    {displayImages.map((url, idx) => (
                      <div
                        key={idx}
                        role="button"
                        tabIndex={0}
                        onClick={() => setAdminImageIndex(idx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            setAdminImageIndex(idx);
                          }
                        }}
                        className={`relative shrink-0 rounded-xl overflow-hidden border-4 transition-all w-48 aspect-video snap-center group cursor-pointer ${adminImageIndex === idx
                          ? 'border-primary shadow-xl scale-105 z-10'
                          : 'border-white hover:border-slate-200'
                          }`}
                      >
                        <img src={url} alt={`Thumb ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        <div className={`absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 transition-opacity ${adminImageIndex === idx ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <span className="text-xs text-white font-bold">{idx === 0 ? 'PRIMARY' : `GALLERY ${idx}`}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(idx === 0 ? "Remove the PRIMARY image and all its hotspots?" : "Remove this photo and all its hotspots?")) {
                              removeGalleryImage(idx);
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {/* Add Image Card */}
                    <div className="shrink-0 snap-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="relative rounded-xl overflow-hidden border-4 border-dashed border-slate-200 hover:border-primary/50 hover:bg-slate-50 transition-all w-48 aspect-video flex flex-col items-center justify-center gap-2 group">
                            <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                              <Plus className="w-6 h-6 text-slate-400 group-hover:text-primary" />
                            </div>
                            <span className="text-xs font-bold text-slate-400 group-hover:text-primary uppercase tracking-tighter">Add Photo</span>
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 overflow-hidden border-2 shadow-xl" align="end">
                          <ImageUpload
                            folderPath={viewType === 'architectural' ? `architectural/${id}` : `present/${id}`}
                            onUpload={(url) => handleImageUpload(url, viewType === 'architectural' ? 'architectural' : 'present')}
                            label="Add Photo to Gallery"
                            fitMode={viewType === 'architectural' ? archImagesFitMode : presentImagesFitMode}
                            onFitModeChange={(mode) => handleUpdateFitMode(viewType === 'architectural' ? 'architectural' : 'present', mode)}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        {viewType === 'architectural' ? 'Hotspots on Selected Image' : 'All Architectural Hotspots'}
                        <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-black">
                          {filteredListHotspots.length}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 font-medium italic">
                        {viewType === 'architectural'
                          ? "ℹ️ Create master hotspots here by clicking on the architecture diagram."
                          : "ℹ️ Upload photos here. To link them to sacred points, define hotspots in Architecture View first."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={hotspotPage === 1}
                            onClick={() => setHotspotPage(p => p - 1)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50"
                          >
                            <ChevronLeft className="w-4 h-4 text-slate-400" />
                          </Button>
                          <span className="text-[10px] font-black w-10 text-center text-slate-400">
                            {hotspotPage} / {totalPages}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={hotspotPage === totalPages}
                            onClick={() => setHotspotPage(p => p + 1)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-slate-50"
                          >
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedHotspots.map((hotspot) => {
                      const isPlaced = viewType === 'present' && presentHotspots.some(ph => ph.id === hotspot.id && (ph.imageIndex || 0) === adminImageIndex);

                      return (
                        <Card
                          key={hotspot.id}
                          id={`hotspot-card-${hotspot.id}`}
                          className={cn(
                            "group transition-all cursor-pointer overflow-hidden border-2",
                            hoveredHotspotId === hotspot.id || selectedHotspot?.id === hotspot.id
                              ? 'border-primary shadow-lg bg-primary/5 ring-2 ring-primary/10'
                              : isPlaced ? 'border-blue-100 bg-blue-50/30' : 'hover:border-primary/50 hover:shadow-md',
                            selectedHotspot?.id === hotspot.id && "ring-4 ring-primary/20 scale-[1.02]"
                          )}
                          onClick={(e) => {
                            if (viewType === 'present' && !isPlaced && pendingClickPosition) {
                              const newPresentHotspot = {
                                ...hotspot,
                                x: pendingClickPosition.x,
                                y: pendingClickPosition.y,
                                imageIndex: adminImageIndex
                              };
                              setPresentHotspots([...presentHotspots, newPresentHotspot]);
                              setPendingClickPosition(null);
                              toast({ title: "Mapped", description: `Hotspot #${hotspot.number} mapped to photo.` });
                            } else {
                              setSelectedHotspot(selectedHotspot?.id === hotspot.id ? null : hotspot);
                            }
                          }}
                          onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                          onMouseLeave={() => setHoveredHotspotId(null)}
                        >
                          <CardContent className="p-3">
                            {/* Row 1: Number + Title (or inline edit input) + action buttons */}
                            <div className="flex items-center gap-2">
                              <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${viewType === 'architectural' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                {hotspot.number}
                              </span>

                              {editingTitleId === hotspot.id ? (
                                <input
                                  autoFocus
                                  className="flex-1 text-sm font-bold border border-primary/40 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-primary/20"
                                  value={editingTitleValue}
                                  onChange={e => setEditingTitleValue(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') updateHotspotTitle(hotspot.id, editingTitleValue);
                                    if (e.key === 'Escape') setEditingTitleId(null);
                                  }}
                                  onClick={e => e.stopPropagation()}
                                />
                              ) : (
                                <h4 className="flex-1 font-bold text-sm text-slate-900 truncate group-hover:text-primary transition-colors">
                                  {hotspot.title[activeLang] || <span className="text-slate-400 italic">Untitled</span>}
                                </h4>
                              )}

                              <div className="flex items-center gap-1 shrink-0">
                                {isPlaced && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200 text-[10px] px-1.5">
                                    Mapped
                                  </Badge>
                                )}
                                {/* Edit Title */}
                                {editingTitleId === hotspot.id ? (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 text-green-600 hover:bg-green-50"
                                    title="Save title"
                                    onClick={e => { e.stopPropagation(); updateHotspotTitle(hotspot.id, editingTitleValue); }}
                                  >
                                    <LucideIcons.Check className="w-3.5 h-3.5" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost" size="icon"
                                    className="h-7 w-7 text-slate-400 hover:text-primary hover:bg-primary/5"
                                    title="Edit title"
                                    onClick={e => { e.stopPropagation(); setEditingTitleId(hotspot.id); setEditingTitleValue(hotspot.title[activeLang] || ''); }}
                                  >
                                    <LucideIcons.Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                )}
                                {/* Delete / Unmap */}
                                <Button
                                  variant="ghost" size="icon"
                                  className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                                  title={viewType === 'present' && isPlaced ? 'Unmap from this photo' : 'Delete forever'}
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (viewType === 'present' && isPlaced) unmapHotspot(hotspot.id);
                                    else deleteHotspot(hotspot);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>

                            {/* Row 2: Position + Move link */}
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Position: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%</span>
                              <span className="flex items-center gap-1 group-hover:text-primary cursor-pointer">
                                Move / Position <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {filteredListHotspots.length === 0 && (
                      <div className="col-span-1 md:col-span-2 lg:col-span-3">
                        <div className="border border-dashed border-slate-300 bg-slate-50/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center gap-2">
                          <MousePointer2 className="w-8 h-8 text-slate-300 mb-2" />
                          <h4 className="font-bold text-slate-700">No Hotspots Yet</h4>
                          <p className="text-sm text-slate-500 max-w-sm">
                            {viewType === 'architectural'
                              ? "Click anywhere on the architecture image above to place your first hotspot."
                              : "Map existing architecture hotspots to this present-day photo by clicking on it."}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>



            {/* Sthan's Description Block */}
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-500" />
                  <CardTitle className="text-lg font-bold text-slate-900">Sthan's Description</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <RichTextEditor
                  placeholder="Provide a detailed architectural description of the temple complex..."
                  value={architectureDescription[activeLang]}
                  onChange={(val) => setArchitectureDescription({ ...architectureDescription, [activeLang]: val })}
                />
                <p className="mt-2 text-xs text-slate-500">
                  This description will appear in the Architecture View section of the public site.
                </p>
              </CardContent>
            </Card>

            {/* Additional Custom Blocks */}
            <Card className="border-slate-200">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <CardTitle className="text-lg font-bold text-slate-900">Additional Custom Blocks</CardTitle>
                  </div>
                  <Button
                    onClick={addCustomBlock}
                    variant="outline"
                    size="sm"
                    className="text-blue-900 border-blue-200 hover:bg-blue-50"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Custom Block
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">Add custom descriptive sections to display on the public architecture page</p>
              </CardHeader>
              <CardContent className="p-6">
                {customBlocks.length === 0 ? (
                  <div
                    onClick={addCustomBlock}
                    className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-300 hover:bg-blue-50/30 transition-all"
                  >
                    <p className="text-slate-400 text-sm">
                      No additional descriptive blocks added yet.<br />
                      <span className="text-blue-600 font-medium">Click here to add one</span>
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {customBlocks.map((block, idx) => (
                      <div key={block.id} className="bg-white p-4 rounded-2xl border border-slate-100 space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 pt-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveCustomBlock(idx, 'up')}
                              disabled={idx === 0}
                              className="h-6 w-6 p-0 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => moveCustomBlock(idx, 'down')}
                              disabled={idx === customBlocks.length - 1}
                              className="h-6 w-6 p-0 hover:bg-slate-100 disabled:opacity-30"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="flex-1 space-y-3">
                            <Input
                              value={block.title[activeLang]}
                              onChange={(e) => updateCustomBlock(block.id, 'title', e.target.value)}
                              placeholder="Block Title"
                              className="font-bold rounded-xl"
                            />
                            <RichTextEditor
                              value={block.content[activeLang]}
                              onChange={(val) => updateCustomBlock(block.id, 'content', val)}
                              placeholder="Block content..."
                            />
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeCustomBlock(block.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex items-center justify-between pt-20 pb-10">
              <Button
                variant="ghost"
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrentStep('sthan-info');
                }}
                className="px-8 h-12 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 gap-2 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Previous Step: Info
              </Button>


              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrentStep('sthana-details');
                }}
                className="bg-blue-900 px-10 h-16 rounded-2xl font-black shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all text-white gap-3 group"
              >
                Next Step: Sthan Details
                <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

          </div>
        )}


        {/* Step 3: Sthana Details */}
        {currentStep === 'sthana-details' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            {!selectedHotspot ? (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Sthana Details</h1>
                    <p className="text-sm text-slate-500 font-medium">Manage sacred points, divine stories, and site content.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search details..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64 rounded-xl border-slate-200"
                      />
                    </div>
                    <Button onClick={addDetail} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6">
                      <Plus className="w-4 h-4 mr-2" /> Add Sthan Detail
                    </Button>
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  {['all', 'linked', 'independent'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setDetailFilter(f as any)}
                      className={cn(
                        "px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all",
                        detailFilter === f
                          ? "bg-blue-900 text-white shadow-md scale-105"
                          : "bg-white text-slate-400 border border-slate-200 hover:bg-slate-50"
                      )}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {details
                    .filter(d => {
                      const title = d.title[activeLang] || "";
                      const desc = d.description[activeLang] || "";
                      const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) || desc.toLowerCase().includes(searchQuery.toLowerCase());
                      if (detailFilter === 'linked') return matchesSearch && !!d.hotspotId;
                      if (detailFilter === 'independent') return matchesSearch && !d.hotspotId;
                      return matchesSearch;
                    })
                    .sort((a, b) => {
                      // Optional: sort linked items by their hotspot number if available
                      const aH = archHotspots.find(h => h.id === a.hotspotId);
                      const bH = archHotspots.find(h => h.id === b.hotspotId);
                      if (aH && bH) return aH.number - bH.number;
                      if (aH) return -1;
                      if (bH) return 1;
                      return 0;
                    })
                    .map((detail) => {
                      const linkedHotspot = archHotspots.find(h => h.id === detail.hotspotId);
                      return (
                        <Card
                          key={detail.id}
                          className="group hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 cursor-pointer overflow-hidden rounded-3xl"
                          onClick={() => setSelectedHotspot(selectedHotspot?.id === detail.id ? null : detail)}
                        >
                          <CardContent className="p-0">
                            <div className="aspect-video bg-slate-100 flex items-center justify-center relative overflow-hidden">
                              {detail.images?.[0] ? (
                                <img
                                  src={detail.images[0]}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  onError={(e) => (e.currentTarget.src = "/placeholder-temple.jpg")}
                                />
                              ) : (
                                <div className="flex flex-col items-center gap-2">
                                  <ImageIcon className="w-12 h-12 text-slate-300" />
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Image</span>
                                </div>
                              )}
                              {linkedHotspot && (
                                <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-blue-900 text-white shadow-xl flex items-center justify-center font-black border border-blue-800">
                                  {linkedHotspot.number}
                                </div>
                              )}
                              {!linkedHotspot && (
                                <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-center font-black border border-emerald-500">
                                  S
                                </div>
                              )}
                            </div>
                            <div className="p-6 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                    {detail.title[activeLang] || `Untitled Detail`}
                                  </h3>
                                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                    {detail.type || 'Structure'}
                                  </p>
                                </div>
                                <Popover>
                                  <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-slate-100">
                                      <LucideIcons.MoreVertical className="w-4 h-4 text-slate-400" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-40 p-1 rounded-xl" onClick={(e) => e.stopPropagation()}>
                                    <Button
                                      variant="ghost"
                                      className="w-full justify-start text-xs font-bold text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg"
                                      onClick={() => deleteDetail(detail.id)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                                    </Button>
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                {detail.description[activeLang] || "No description provided yet."}
                              </p>
                              <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                                <span className={cn(
                                  "text-[10px] font-bold uppercase tracking-widest flex items-center gap-1",
                                  linkedHotspot ? "text-blue-600" : "text-emerald-600"
                                )}>
                                  {linkedHotspot ? `Linked to Map #${linkedHotspot.number}` : "Independent Entry"}
                                </span>
                                <Button variant="ghost" size="sm" className="text-blue-600 font-black text-xs hover:bg-blue-50">
                                  EDIT <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                </div>

                <div className="flex items-center justify-between pt-20 pb-10">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                      setCurrentStep('architecture-view');
                    }}
                    className="px-8 h-12 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition-all text-slate-600 gap-2 group"
                  >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Previous Step: Architecture
                  </Button>

                  <Button
                    onClick={() => navigate("/admin/sthana-directory")}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] px-8 h-12 font-bold shadow-xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Finish & View Directory
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Editing Header (Redesigned - Uniform with Page) */}
                <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 py-6 -mx-8 px-8 mb-12 shadow-sm">
                  <div className="max-w-4xl mx-auto flex items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedHotspot(null)}
                        className="h-10 px-4 rounded-xl hover:bg-slate-50 text-slate-500 font-bold gap-2 shrink-0 group transition-all"
                      >
                        <LucideIcons.ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to List</span>
                      </Button>
                      <div className="w-px h-8 bg-slate-100 hidden md:block" />
                      <div className="flex items-center gap-3">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Selected:</p>
                        <h2 className="text-xl font-serif font-bold text-primary truncate max-w-xs transition-all">
                          {selectedHotspot.title[activeLang] || `Edit Sthan Detail`}
                        </h2>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => setSelectedHotspot(null)}
                        className="rounded-2xl font-bold px-6 h-12 text-slate-500 hover:bg-slate-100"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          updateDetail(selectedHotspot.id, selectedHotspot);
                          setSelectedHotspot(null);
                          toast({ title: "Updated", description: "Changes kept locally. Remember to click 'Save All' to sync with database." });
                        }}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-[1.25rem] px-8 h-12 font-bold shadow-xl shadow-emerald-900/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        Done & Apply
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Primary Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Map Integration (New Card) */}
                    <Card className="md:col-span-2 border-blue-100 bg-blue-50/30 shadow-sm rounded-3xl overflow-hidden border-2">
                      <CardHeader className="bg-blue-100/50 border-b border-blue-200 py-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                          <LucideIcons.MapPin className="w-5 h-5 text-blue-600" />
                          <CardTitle className="text-lg font-bold text-blue-900">Map Integration</CardTitle>
                        </div>
                        <Badge
                          className={cn(
                            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-none",
                            selectedHotspot.hotspotId ? "bg-blue-600 text-white" : "bg-emerald-600 text-white"
                          )}
                        >
                          {selectedHotspot.hotspotId ? "Linked to Map" : "Independent Content"}
                        </Badge>
                      </CardHeader>
                      <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
                              <Switch
                                id="map-link-toggle"
                                checked={!!selectedHotspot.hotspotId}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    setSelectedHotspot({ ...selectedHotspot, hotspotId: null });
                                  } else if (archHotspots.length > 0) {
                                    setSelectedHotspot({ ...selectedHotspot, hotspotId: archHotspots[0].id });
                                  }
                                }}
                              />
                              <Label htmlFor="map-link-toggle" className="font-bold text-slate-700 cursor-pointer">
                                Link this detail to a map marker (Hotspot)
                              </Label>
                            </div>

                            {selectedHotspot.hotspotId && (
                              <div className="animate-in slide-in-from-top-2 duration-300 space-y-3">
                                <Label className="text-xs font-black uppercase tracking-widest text-slate-400 pl-1">Target Hotspot</Label>
                                <div className="relative group">
                                  <LucideIcons.ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                                  <select
                                    className="w-full h-14 bg-white border-2 border-slate-100 hover:border-blue-200 rounded-[1.25rem] px-6 appearance-none font-bold text-slate-700 focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                                    value={selectedHotspot.hotspotId || ""}
                                    onChange={(e) => setSelectedHotspot({ ...selectedHotspot, hotspotId: e.target.value })}
                                  >
                                    {archHotspots.map(h => (
                                      <option key={h.id} value={h.id}>
                                        #{h.number} - {h.title[activeLang] || "Untitled Hotspot"}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 pl-1">
                                  <Info className="w-3 h-3" /> When linked, this content will open when users click the marker #{archHotspots.find(h => h.id === selectedHotspot.hotspotId)?.number} on the map.
                                </p>
                              </div>
                            )}

                            {!selectedHotspot.hotspotId && (
                              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-sm italic">
                                This entry is independent and will appear in the general information section of the Sthan page.
                              </div>
                            )}
                          </div>

                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden h-full">
                      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                        <CardTitle className="text-lg font-bold">General Description</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sthan Name</Label>
                          <Input
                            value={selectedHotspot.title[activeLang] || ""}
                            onChange={(e) => setSelectedHotspot({ ...selectedHotspot, title: { ...selectedHotspot.title, [activeLang]: e.target.value } })}
                            placeholder="e.g. Garbhagriha"
                            className="h-12 rounded-2xl border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">General Description</Label>
                        </div>
                        <div className="space-y-2">
                          <RichTextEditor
                            value={selectedHotspot.description[activeLang]}
                            onChange={(val) => setSelectedHotspot({ ...selectedHotspot, description: { ...selectedHotspot.description, [activeLang]: val } })}
                            placeholder="Main architectural overview..."
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden h-full">
                      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                        <CardTitle className="text-lg font-bold">Sthan Pothi Details</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sthan Pothi Details</Label>
                        </div>
                        <div className="space-y-2">
                          <RichTextEditor
                            value={selectedHotspot.sthanPothiDescription[activeLang] || ""}
                            onChange={(val) => setSelectedHotspot({ ...selectedHotspot, sthanPothiDescription: { ...selectedHotspot.sthanPothiDescription, [activeLang]: val } })}
                            placeholder="Details from scripture..."
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Leelas Section */}
                  <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                      <CardTitle className="text-lg font-bold">Divine Leelas</CardTitle>
                      <Button variant="outline" size="sm" onClick={addLeela} className="rounded-xl h-10 border-blue-200 text-blue-600 bg-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Story
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-8">
                      {Array.isArray(selectedHotspot.leelas) && selectedHotspot.leelas.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6">
                          {selectedHotspot.leelas.map((leela: any, idx: number) => (
                            <div key={leela.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl relative group/leela shadow-sm">
                              <button
                                onClick={() => removeLeela(leela.id)}
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover/leela:opacity-100"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-xs">
                                  {idx + 1}
                                </div>
                                <Input
                                  placeholder="Leela Title"
                                  value={leela.title[activeLang] || ""}
                                  className="bg-white rounded-xl font-bold h-10"
                                  onChange={(e) => {
                                    const updatedLeelas = (selectedHotspot.leelas as any[]).map((l: any) =>
                                      l.id === leela.id ? { ...l, title: { ...l.title, [activeLang]: e.target.value } } : l
                                    );
                                    setSelectedHotspot({ ...selectedHotspot, leelas: updatedLeelas as Leela[] });
                                  }}
                                />
                              </div>
                              <RichTextEditor
                                placeholder="Describe the divine leela..."
                                value={leela.description[activeLang]}
                                onChange={(val) => {
                                  const updatedLeelas = (selectedHotspot.leelas as any[]).map((l: any) =>
                                    l.id === leela.id ? { ...l, description: { ...l.description, [activeLang]: val } } : l
                                  );
                                  setSelectedHotspot({ ...selectedHotspot, leelas: updatedLeelas as Leela[] });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 flex flex-col items-center text-slate-300 border-2 border-dashed border-slate-200 rounded-3xl">
                          <LucideIcons.BookOpen className="w-12 h-12 mb-3 opacity-20" />
                          <p className="font-bold text-slate-400">No divine stories added to this sthana yet.</p>
                          <Button variant="link" onClick={addLeela} className="text-blue-600 text-sm font-black mt-2">
                            Add the first Leela
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Photo Gallery */}
                  <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                        <CardTitle className="text-lg font-bold">Image & Media Gallery</CardTitle>
                      </div>
                      <Badge variant="outline" className="bg-white text-slate-400 font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full border-slate-200">
                        {selectedHotspot.images?.length || 0} Photos Attached
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-8">
                      {/* Image Fit Mode Selection */}
                      <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-blue-50/50 rounded-3xl border border-blue-100/50 gap-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-900/60 flex items-center gap-2">
                            <ImageIcon className="w-3 h-3" /> Image Fit Mode
                          </Label>
                          <p className="text-[11px] text-slate-500 font-medium">Choose how images should fit in the container</p>
                        </div>
                        <div className="flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-blue-100 shadow-sm self-stretch sm:self-auto">
                          <button
                            type="button"
                            onClick={() => setSelectedHotspot({ ...selectedHotspot, fitMode: 'cover' })}
                            className={cn(
                              "flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                              selectedHotspot.fitMode === 'cover'
                                ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            Cover
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedHotspot({ ...selectedHotspot, fitMode: 'contain' })}
                            className={cn(
                              "flex-1 sm:flex-none px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300",
                              (!selectedHotspot.fitMode || selectedHotspot.fitMode === 'contain')
                                ? "bg-blue-900 text-white shadow-lg shadow-blue-900/20"
                                : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                            )}
                          >
                            Fit Inside
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {selectedHotspot.images?.map((url: string, idx: number) => (
                          <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                            <img
                              src={url || "/icons/sthan.png"}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => (e.currentTarget.src = "/icons/sthan.png")}
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  if (confirm("Remove this image?")) {
                                    removeImageFromHotspot(idx, 'present');
                                  }
                                }}
                                className="bg-red-600 text-white p-3 rounded-2xl scale-90 hover:scale-100 transition-all shadow-xl hover:bg-red-700"
                                title="Remove image"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="aspect-square rounded-3xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all flex items-center justify-center p-4 group/upload overflow-hidden">
                          <ImageUpload
                            folderPath={`hotspots/${id}/${selectedHotspot.id}/present`}
                            onUpload={(url) => setSelectedHotspot({
                              ...selectedHotspot,
                              images: [...(selectedHotspot.images || []), url]
                            })}
                            label="Attach Photo"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

              </div>
            )}
          </div>
        )
        }

        {/* Pick Hotspot Mapping Dialog */}
        <Dialog open={!!pendingClickPosition} onOpenChange={(open) => !open && setPendingClickPosition(null)}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Map Architectural Sthana</DialogTitle>
              <DialogDescription className="text-sm text-slate-500 font-medium pt-2">
                Select an existing Sthana from the Architecture View to map to this location:
              </DialogDescription>
            </DialogHeader>
            <div className="py-2 space-y-4">
              <div className="grid grid-cols-1 gap-2 max-h-[40vh] overflow-y-auto pr-2">
                {archHotspots
                  .filter(ah => !presentHotspots.some(ph => ph.sthanaId === ah.id || ph.id === ah.id))
                  .map(ah => (
                    <button
                      key={ah.id}
                      onClick={() => {
                        const newPresentHotspot: Hotspot = {
                          ...ah, // Inherit metadata
                          sthanaId: ah.id, // Link to source
                          id: uuidv4(), // Give it its own unique mapping ID
                          x: pendingClickPosition!.x,
                          y: pendingClickPosition!.y,
                          imageIndex: adminImageIndex,
                          isPresent: true
                        };
                        const updatedPresent = [...presentHotspots, newPresentHotspot];
                        setPresentHotspots(updatedPresent);
                        setPendingClickPosition(null);

                        // Save mapping to subcollection
                        const tokenPromise = user?.getIdToken();
                        tokenPromise?.then(token => {
                          fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots&subId=${newPresentHotspot.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { "Authorization": `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify(sanitizeData(newPresentHotspot))
                          }).catch(e => console.warn("Mapping subcollection save failed:", e));
                        });

                        toast({ title: "Mapped", description: `Sthana "${ah.title}" mapped to Present View.` });
                      }}
                      className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors text-left"
                    >
                      <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-black text-xs">
                        {ah.number}
                      </span>
                      <div>
                        <p className="font-bold text-slate-900">{ah.title[activeLang] || `Sthana #${ah.number}`}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ah.description[activeLang]}</p>
                      </div>
                    </button>
                  ))}
                {archHotspots.filter(ah => !presentHotspots.some(ph => ph.sthanaId === ah.id || ph.id === ah.id)).length === 0 && (
                  <p className="text-center py-8 text-slate-400 italic">No unmapped Sthanas available.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingClickPosition(null)} className="rounded-xl w-full">Cancel</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );

  if (isEmbedded) return content;

  return (
    <div className="hide-child-headers scroll-smooth">
      <AdminLayout>
        {content}
      </AdminLayout>
    </div>
  );
}
