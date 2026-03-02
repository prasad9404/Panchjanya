// src/pages/admin/TempleArchitectureAdmin.tsx
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/admin/AdminLayout";

import { v4 as uuidv4 } from "uuid";
import { Hotspot, Leela, GlanceItem, AbbreviationItem, CustomBlock } from "@/types";
import * as LucideIcons from "lucide-react";
import { X, Save, Trash2, Upload, ArrowLeft, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Plus, ChevronDown, Image as ImageIcon, Info, MousePointer2, ExternalLink, FileText, Search, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/shared/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { Switch } from "@/shared/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getSthanTypes } from "@/shared/utils/sthanTypes";
import { SthanType } from "@/shared/types/sthanType";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { ImageUpload } from "@/shared/components/admin/ImageUpload";

// Local UI state interfaces - The robust interfaces are in @/types

const CUSTOM_ICONS = [
  { name: "Temple", path: "/icons/Blue_temple_icon-removebg.png" },
  { name: "Sthan Pin", path: "/icons/Sthan_pin.svg" },
  { name: "Asan Sthan Pin", path: "/icons/Sthan_pin_Asan.svg" },
  { name: "Avasthan Pin", path: "/icons/Sthan_pin_Avasthan.svg" },
  { name: "Mandalik Pin", path: "/icons/Sthan_pin_Mandalik.svg" },
  { name: "Vasti Pin", path: "/icons/Sthan_pin_Vasti.svg" },
  { name: "Mahasthan Pin", path: "/icons/mahasthan pin.svg" },
  { name: "Explore", path: "/icons/explore_safari.png" },
  { name: "Direction", path: "/icons/left-arrow.png" },
  { name: "Route", path: "/icons/route-arrow.png" },
  { name: "Signpost", path: "/icons/signpost.png" },

  // Glance Icons
  { name: "Blue Temple", path: "/icons/glance/Blue_temple_icon.svg" },
  { name: "Logo", path: "/icons/glance/Logo.svg" },
  { name: "All", path: "/icons/glance/all.svg" },
  { name: "Categorization", path: "/icons/glance/categorization.svg" },
  { name: "Chakra", path: "/icons/glance/chakra.svg" },
  { name: "Chinese Temple", path: "/icons/glance/chinese-temple.svg" },
  { name: "Export", path: "/icons/glance/export.svg" },
  { name: "Avatar", path: "/icons/glance/icon.svg" },
  { name: "Import", path: "/icons/glance/import.svg" },
  { name: "Not Available", path: "/icons/glance/not-available.svg" },
  { name: "Available", path: "/icons/glance/available.svg" },
  { name: "Quarantine", path: "/icons/glance/quarantine.svg" },
  { name: "Warehouse", path: "/icons/glance/warehouse.svg" },
  { name: "Temple Simple", path: "/icons/glance/temple_simple.svg" },
  { name: "Temple Solid", path: "/icons/glance/temple_solid.svg" },
  { name: "Route Path", path: "/icons/glance/route_path.svg" },
  { name: "Parivaar", path: "/icons/glance/parivaar.svg" },
  { name: "Aasan Sthan", path: "/icons/glance/Aasan Sthan.svg" },
  { name: "Sthaan", path: "/icons/glance/sthaan.svg" },
];

interface HotspotMarkerProps {
  hotspot: Hotspot;
  viewType: 'architectural' | 'present';
  zoom: number;
  onEdit: (h: Hotspot, e: React.MouseEvent) => void;
  onDelete: (h: Hotspot) => void;
  onUnmap: (id: string) => void;
  isClustered?: boolean;
  clusterCount?: number;
}

const HotspotMarker = ({
  hotspot,
  viewType,
  zoom,
  onEdit, // Now interpreted as 'start repositioning'
  onDelete,
  onUnmap,
  isClustered,
  clusterCount
}: HotspotMarkerProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute z-30 transition-all duration-300 ease-in-out"
      style={{
        top: `${hotspot.y}%`,
        left: `${hotspot.x}%`,
        transform: `translate(-50%, -50%) scale(${isHovered ? 1.2 : 1})`,
        opacity: isHovered ? 1 : 0.8
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative flex items-center justify-center cursor-pointer group">
        {/* Simple Numbered Circle */}
        <div className={`w-8 h-8 rounded-full shadow-lg border-2 border-white flex items-center justify-center font-black text-xs text-white transition-all duration-300
                    ${viewType === 'architectural' ? 'bg-slate-700 hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-700'}
                    ${isHovered ? 'ring-4 ring-blue-500/30' : ''}`}>
          {hotspot.number}
        </div>

        {/* Edit/Delete Icons on Hover */}
        {isHovered && (
          <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1 bg-white rounded-xl shadow-2xl border border-slate-200 animate-in fade-in zoom-in slide-in-from-bottom-2">
            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 rounded-lg hover:bg-blue-50 text-blue-600"
              title="Move Hotspot"
              onClick={(e) => { e.stopPropagation(); onEdit(hotspot, e); }}
            >
              <LucideIcons.Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="w-7 h-7 rounded-lg hover:bg-red-50 text-red-600"
              title="Delete Hotspot"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Remove this hotspot placement?")) {
                  if (viewType === 'present') onUnmap(hotspot.id);
                  else onDelete(hotspot);
                }
              }}
            >
              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default function TempleArchitectureAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const imageRef = useRef<HTMLImageElement>(null);

  const [templeName, setTempleName] = useState("");
  const [viewType, setViewType] = useState<'architectural' | 'present'>('architectural');
  const [archImageUrl, setArchImageUrl] = useState("");
  const [presentImageUrl, setPresentImageUrl] = useState("");
  const [archImages, setArchImages] = useState<string[]>([]);
  const [presentImages, setPresentImages] = useState<string[]>([]);
  const [templeImages, setTempleImages] = useState<string[]>([]);
  const [archHotspots, setArchHotspots] = useState<Hotspot[]>([]);
  const [presentHotspots, setPresentHotspots] = useState<Hotspot[]>([]);

  // New Temple Metadata & Sections
  const [todaysName, setTodaysName] = useState("");
  const [todaysNameTitle, setTodaysNameTitle] = useState("Todays Name");
  const [address, setAddress] = useState("");
  const [taluka, setTaluka] = useState("");
  const [district, setDistrict] = useState("");
  const [directions_text, setDirectionsText] = useState("");
  const [locationLink, setLocationLink] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [description_title, setDescriptionTitle] = useState("Sthan At Glance");
  const [description_text, setDescriptionText] = useState("");
  const [sthana_info_title, setSthanaInfoTitle] = useState("Sthan Description");
  const [sthana_info_text, setSthanaInfoText] = useState("");
  const [descriptionSections, setDescriptionSections] = useState<{ id: string, title: string, content: string }[]>([]);
  const [glanceItems, setGlanceItems] = useState<GlanceItem[]>([]);
  const [abbreviationItems, setAbbreviationItems] = useState<AbbreviationItem[]>([]);
  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>([]);
  const [architectureDescription, setArchitectureDescription] = useState("");
  const [contactDetails, setContactDetails] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [sthan, setSthan] = useState("");
  const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);

  const [repositioningId, setRepositioningId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adminImageIndex, setAdminImageIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<'sthan-info' | 'architecture-view' | 'sthana-details'>('sthan-info');
  const [hoveredHotspotId, setHoveredHotspotId] = useState<string | null>(null);
  const [pendingClickPosition, setPendingClickPosition] = useState<{ x: number, y: number } | null>(null);
  const [hotspotPage, setHotspotPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const HOTSPOTS_PER_PAGE = 6;

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
          setTempleName(data.name || "Unknown Temple");
          setArchImageUrl(data.architectureImage || "");
          setPresentImageUrl(data.presentImage || data.images?.[0] || "");
          setArchImages(data.architectureImages || []);
          setPresentImages(data.presentImages || []);
          setTempleImages(data.images || []);
          setArchHotspots(data.hotspots || []);

          setTodaysName(data.todaysName || "");
          setTodaysNameTitle(data.todaysNameTitle || "Todays Name");
          setAddress(data.address || "");
          setTaluka(data.taluka || "");
          setDistrict(data.district || "");
          setDirectionsText(data.directions_text || data.wayToReach || "");
          setLocationLink(data.locationLink || "");
          setLatitude(data.latitude || "");
          setLongitude(data.longitude || "");
          setDescriptionTitle(data.description_title || "Sthan At Glance");
          setDescriptionText(data.description_text || data.description || "");
          setSthanaInfoTitle(data.sthana_info_title || "Sthan Description");
          setSthanaInfoText(data.sthana_info_text || data.sthana || "");
          setDescriptionSections(data.descriptionSections || []);
          setGlanceItems(data.glanceItems || []);
          setAbbreviationItems(data.abbreviationItems || []);
          setCustomBlocks(data.customBlocks || []);
          setArchitectureDescription(data.architectureDescription || "");
          setContactDetails(data.contactDetails || "");
          setContactName(data.contactName || "");
          setContactNumber(data.contactNumber || "");
          setSthan(data.sthan || "");

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
    // If we clicked on an existing hotspot, ignore (it has its own handler, but just in case of bubbling)
    if ((e.target as HTMLElement).closest('.group.absolute')) return;

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

    // Default: Create a new hotspot (for arch view)
    const newHotspot: Hotspot = {
      id: uuidv4(),
      x,
      y,
      imageIndex: adminImageIndex,
      title: "",
      description: "",
      number: archHotspots.length + 1,
      images: [],
      isPresent: false,
      type: 'structure'
    };

    setArchHotspots(prev => [...prev, newHotspot]);
    toast({ title: "Hotspot Added", description: `Placement #${newHotspot.number} created.` });
  };

  const displayImages = viewType === 'architectural'
    ? ([archImageUrl, ...archImages].filter(Boolean).length > 0 ? [archImageUrl, ...archImages].filter(Boolean) : templeImages)
    : [presentImageUrl, ...presentImages].filter(Boolean);

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
    if (!id) return;
    const updateData = {
      name: templeName,
      todaysName,
      todaysNameTitle,
      address,
      taluka,
      district,
      directions_text,
      locationLink,
      latitude,
      longitude,
      images: templeImages,
      description_title,
      description_text,
      sthana_info_title,
      sthana_info_text,
      descriptionSections,
      glanceItems,
      abbreviationItems,
      customBlocks,
      architectureDescription,
      contactDetails,
      contactName,
      contactNumber,
      sthan,
      hotspots: archHotspots,
      // present_hotspots is handled exclusively via subcollection for isolation
      // present_hotspots: presentHotspots, 
    };

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
      } else {
        throw new Error("API save failed.");
      }
    } catch (e: any) {
      console.error("API Save error:", e);
      toast({ title: "Error", description: "Failed to save details: " + (e.message || "API Error"), variant: "destructive" });
    }
  };

  const saveTempleDetailsDirectly = async (data: any) => {
    if (!id) return;
    const sanitizedInput = sanitizeData(data);
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
    if (!id) return;
    try {
      const field = type === 'arch' ? "architectureImage" : "presentImage";
      const url = type === 'arch' ? archImageUrl : presentImageUrl;

      // Use generic Admin API
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [field]: url })
      });

      if (!res.ok) {
        throw new Error("API image save failed.");
      }

      toast({ title: "Success", description: `${type === 'arch' ? 'Architecture' : 'Present'} image saved.` });
    } catch (e: any) {
      console.error("API Image Save error:", e);
      toast({ title: "Error", description: "Failed to save image.", variant: "destructive" });
    }
  };

  const addDescriptionSection = () => {
    const newSection = { id: uuidv4(), title: "", content: "" };
    setDescriptionSections([...descriptionSections, newSection]);
  };

  const updateDescriptionSection = (sId: string, field: 'title' | 'content', value: string) => {
    setDescriptionSections(descriptionSections.map(s => s.id === sId ? { ...s, [field]: value } : s));
  };

  const removeDescriptionSection = (sId: string) => {
    setDescriptionSections(descriptionSections.filter(s => s.id !== sId));
  };

  const addGlanceItem = () => {
    const newItem: GlanceItem = { id: uuidv4(), icon: CUSTOM_ICONS[0].path, description: "" };
    setGlanceItems([...glanceItems, newItem]);
  };

  const updateGlanceItem = (gId: string, field: 'icon' | 'description', value: string) => {
    setGlanceItems(glanceItems.map(g => g.id === gId ? { ...g, [field]: value } : g));
  };

  const removeGlanceItem = (gId: string) => {
    setGlanceItems(glanceItems.filter(g => g.id !== gId));
  };

  const addCustomBlock = () => {
    const newBlock: CustomBlock = { id: uuidv4(), title: "", content: "" };
    setCustomBlocks([...customBlocks, newBlock]);
  };

  const updateCustomBlock = (id: string, field: 'title' | 'content', value: string) => {
    setCustomBlocks(customBlocks.map(block =>
      block.id === id ? { ...block, [field]: value } : block
    ));
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
    const newItem: AbbreviationItem = { id: uuidv4(), icon: CUSTOM_ICONS[0].path, description: "" };
    setAbbreviationItems([...abbreviationItems, newItem]);
  };

  const updateAbbreviationItem = (gId: string, field: 'icon' | 'description', value: string) => {
    setAbbreviationItems(abbreviationItems.map(g => g.id === gId ? { ...g, [field]: value } : g));
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

        const token = await user?.getIdToken();
        const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ hotspots: newArch })
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

      if (!res.ok) {
        throw new Error("API unmap failed.");
      }

      setPresentHotspots(presentHotspots.filter(h => h.id !== hotspotId));
      toast({ title: "Unmapped", description: "Hotspot removed from this view." });
    } catch (e) {
      console.error("Error unmapping hotspot:", e);
      toast({ title: "Error", description: "Failed to unmap hotspot.", variant: "destructive" });
    }
  };

  const handleImageUpload = async (url: string) => {
    if (!id) return;
    try {
      const fieldToUpdate = viewType === 'architectural' ? "architectureImage" : "presentImage";

      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ [fieldToUpdate]: url })
      });

      if (!res.ok) throw new Error("API image update failed.");

      if (viewType === 'architectural') {
        setArchImageUrl(url);
      } else {
        setPresentImageUrl(url);
      }

      toast({
        title: "Success",
        description: `${viewType === 'architectural' ? 'Architecture' : 'Present'} main image updated`,
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

  const handleSupplementalImageUpload = async (url: string) => {
    if (!id) return;
    try {
      const fieldToUpdate = viewType === 'architectural' ? "architectureImages" : "presentImages";
      const currentImages = viewType === 'architectural' ? archImages : presentImages;
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

      if (!res.ok) throw new Error("API supplemental image add failed.");

      if (viewType === 'architectural') {
        setArchImages(updatedImages);
      } else {
        setPresentImages(updatedImages);
      }

      toast({
        title: "Success",
        description: "Supplemental image added successfully",
      });
    } catch (error: any) {
      console.error("Error adding supplemental image:", error);
      toast({
        title: "Error",
        description: "Failed to add supplemental image",
        variant: "destructive",
      });
    }
  };

  const removeSupplementalImage = async (index: number) => {
    if (!id) return;
    try {
      const fieldToUpdate = viewType === 'architectural' ? "architectureImages" : "presentImages";
      const hotspotField = viewType === 'architectural' ? "hotspots" : "presentHotspots";
      const currentImages = viewType === 'architectural' ? archImages : presentImages;
      const currentHotspotsList = viewType === 'architectural' ? archHotspots : presentHotspots;

      const actualIndex = index + 1; // Since index 0 in supplemental array is index 1 in display list

      const updatedImages = currentImages.filter((_, i) => i !== index);

      // Remove hotspots on this image and decrement imageIndex for hotspots on later images
      const updatedHotspots = currentHotspotsList
        .filter(h => (h.imageIndex || 0) !== actualIndex)
        .map(h => {
          if ((h.imageIndex || 0) > actualIndex) {
            return { ...h, imageIndex: h.imageIndex - 1 };
          }
          return h;
        });

      // Update main images
      const updatePayload: any = {
        [fieldToUpdate]: updatedImages
      };

      // Handle Hotspots updates
      if (viewType === 'architectural') {
        const updatedHotspots = currentHotspotsList
          .filter(h => (h.imageIndex || 0) !== actualIndex)
          .map(h => {
            if ((h.imageIndex || 0) > actualIndex) {
              return { ...h, imageIndex: (h.imageIndex || 0) - 1 };
            }
            return h;
          });

        updatePayload.hotspots = updatedHotspots;
        setArchHotspots(updatedHotspots);
        setArchImages(updatedImages);
      } else {
        // For present view, we are removing/updating subcollection items
        // This requires multiple API calls or a batch.
        // For strict API compliance, we will do sequential requests here manually since our generic API doesn't do batch yet.

        const hotspotsToDelete = presentHotspots.filter(h => (h.imageIndex || 0) === actualIndex);
        const hotspotsToUpdate = presentHotspots.filter(h => (h.imageIndex || 0) > actualIndex);

        const token = await user?.getIdToken();
        for (const h of hotspotsToDelete) {
          await fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots&subId=${h.id}`, {
            method: 'DELETE',
            headers: token ? { "Authorization": `Bearer ${token}` } : {}
          });
        }
        for (const h of hotspotsToUpdate) {
          const updatedIndex = (h.imageIndex || 0) - 1;
          await fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=present_hotspots&subId=${h.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { "Authorization": `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ imageIndex: updatedIndex })
          });
        }

        const updatedPresent = presentHotspots
          .filter(h => (h.imageIndex || 0) !== actualIndex)
          .map(h => (h.imageIndex || 0) > actualIndex ? { ...h, imageIndex: (h.imageIndex || 0) - 1 } : h);

        setPresentHotspots(updatedPresent);
        setPresentImages(updatedImages);
      }

      // Update the main doc images
      const token = await user?.getIdToken();
      const res = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(updatePayload)
      });

      if (!res.ok) throw new Error("API supplemental image remove failed.");

      // Reset index to ensure we're not on a deleted or shifted index we don't understand
      if (adminImageIndex === actualIndex) {
        setAdminImageIndex(0);
      } else if (adminImageIndex > actualIndex) {
        setAdminImageIndex(adminImageIndex - 1);
      }

      toast({
        title: "Success",
        description: "Supplemental image and its hotspots removed successfully",
      });
    } catch (error: any) {
      console.error("Error removing supplemental image:", error);
      toast({
        title: "Error",
        description: "Failed to remove supplemental image",
        variant: "destructive",
      });
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
    const newLeela: Leela = { id: uuidv4(), description: "" };
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
        typeof l === 'string' ? l : (l.id === id ? { ...l, description } : l)
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin/sthana-directory")}
            className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-all px-0 hover:bg-transparent"
          >
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </div>
            Back to Directory
          </Button>
        </div>

        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/sthana-directory")}
              className="rounded-xl hover:bg-slate-50 text-slate-500 font-bold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Directory
            </Button>
            <div className="w-px h-8 bg-slate-100" />
            <div className="flex items-center gap-1">
              {[
                { id: 'sthan-info', label: '1. Sthan Info', icon: ImageIcon },
                { id: 'architecture-view', label: '2. Architecture View', icon: ZoomIn },
                { id: 'sthana-details', label: '3. Sthana Details', icon: Plus },
              ].map((step) => (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id as any)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${currentStep === step.id
                    ? 'bg-blue-900 text-white shadow-lg scale-105'
                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                    }`}
                >
                  <step.icon className="w-4 h-4" />
                  {step.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 pr-2">
            <div className="w-1.5 h-6 bg-slate-200 rounded-full" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">
              {currentStep.replace('-', ' ')}
            </span>
          </div>
        </div>

        {/* Step 1: Sthan Info */}
        {currentStep === 'sthan-info' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-32">
            <div className="flex items-center justify-between mb-10">
              <div className="space-y-1">
                <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Temple Configuration</h1>
                <p className="text-sm text-slate-500 font-medium">Configure primary metadata and descriptive content blocks.</p>
              </div>
              <Button onClick={saveTempleDetails} className="bg-blue-900 text-white hover:bg-blue-800 rounded-xl px-8 h-12 shadow-lg shadow-blue-900/20">
                <Save className="w-4 h-4 mr-2" /> Save Changes
              </Button>
            </div>

            <div className="space-y-12">
              {/* 1. Primary Identity */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Primary Identity</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                    This information appears in the main header and site-wide navigation.
                  </p>
                </div>
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Sthan Name</Label>
                      <Input
                        value={templeName}
                        onChange={(e) => setTempleName(e.target.value)}
                        placeholder="e.g. Shri Panchasara Parshvanath"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={todaysNameTitle}
                          onChange={(e) => setTodaysNameTitle(e.target.value)}
                          className="h-8 p-0 px-2 w-fit min-w-[120px] text-sm font-semibold text-slate-700 border-transparent hover:border-slate-200 focus:border-blue-500 rounded-md transition-all"
                          placeholder="Label Name"
                        />
                        <span className="text-slate-400 font-normal text-sm">(Optional)</span>
                      </div>
                      <Input
                        value={todaysName}
                        onChange={(e) => setTodaysName(e.target.value)}
                        placeholder="e.g. Patan, Gujarat"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Address</Label>
                    <Textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Enter the complete address..."
                      rows={3}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">Taluka</Label>
                      <Input
                        value={taluka}
                        onChange={(e) => setTaluka(e.target.value)}
                        placeholder="e.g. Sidhpur"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-slate-700">District</Label>
                      <Input
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="e.g. Patan"
                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700">Sthan Type *</Label>
                    <Select value={sthan} onValueChange={setSthan}>
                      <SelectTrigger className="h-12 rounded-xl border-slate-200">
                        <SelectValue placeholder="Select Sthan Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {sthanTypes.map(st => (
                          <SelectItem key={st.id} value={st.name}>{st.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <Label className="text-sm font-semibold text-slate-700">Detailed Directions</Label>
                    <Textarea
                      value={directions_text}
                      onChange={(e) => setDirectionsText(e.target.value)}
                      placeholder="Detailed instructions for trains, buses, etc..."
                      rows={3}
                      className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
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
                      value={contactDetails}
                      onChange={(e) => setContactDetails(e.target.value)}
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
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Sthan Gallery</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                    Upload beautiful photos of the temple entrance, surroundings, and general views.
                  </p>
                </div>
                <div className="lg:col-span-2">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {templeImages.map((url, idx) => (
                      <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                        <img src={url} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          onClick={() => {
                            if (confirm("Remove this image from gallery?")) {
                              setTempleImages(templeImages.filter((_, i) => i !== idx));
                            }
                          }}
                          className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-xl scale-90 opacity-0 group-hover:opacity-100 group-hover:scale-100 transition-all shadow-xl hover:bg-red-700 z-10"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <div className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-white hover:border-blue-400 transition-all flex items-center justify-center p-2 group/upload overflow-hidden">
                      <ImageUpload
                        folderPath={`temples/${id}/gallery`}
                        onUpload={(url) => setTempleImages([...templeImages, url])}
                        label="Upload Photo"
                      />
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
                          value={description_title}
                          onChange={(e) => setDescriptionTitle(e.target.value)}
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
                                              onError={(e) => (e.currentTarget.src = "/icons/sthaan.png")}
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
                                    <PopoverContent className="w-80 p-3 space-y-3">
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Select Custom Icon</Label>
                                        <div className="grid grid-cols-3 gap-2">
                                          {CUSTOM_ICONS.map(icon => (
                                            <button
                                              key={icon.path}
                                              onClick={() => updateGlanceItem(item.id, 'icon', icon.path)}
                                              className={`p-3 rounded-lg hover:bg-amber-50 flex flex-col items-center justify-center gap-2 transition-colors border ${item.icon === icon.path ? 'bg-amber-100 border-amber-300' : 'border-slate-200'}`}
                                              title={icon.name}
                                            >
                                              <img src={icon.path} className="w-8 h-8 object-contain" alt={icon.name} />
                                              <span className="text-[9px] font-medium text-slate-600 truncate w-full text-center">{icon.name}</span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                      <Separator />
                                      <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase text-slate-400">Or Enter Custom URL</Label>
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
                                    value={item.description}
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
                          value={sthana_info_title}
                          onChange={(e) => setSthanaInfoTitle(e.target.value)}
                          placeholder="Sthan Description"
                          className="h-12 border-none bg-white rounded-xl font-bold text-lg focus:ring-2 focus:ring-blue-200 transition-all px-4"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Detailed Narrative</span>
                          <div className="h-px flex-1 bg-blue-100/50" />
                        </div>
                        <Textarea
                          value={sthana_info_text}
                          onChange={(e) => setSthanaInfoText(e.target.value)}
                          placeholder="Detailed sthan description..."
                          rows={6}
                          className="border-none bg-white rounded-xl focus:ring-2 focus:ring-blue-200 transition-all p-4 leading-relaxed"
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
                                value={s.title}
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
                              <Textarea
                                value={s.content}
                                onChange={(e) => updateDescriptionSection(s.id, 'content', e.target.value)}
                                placeholder="Add custom content here..."
                                rows={6}
                                className="border-none bg-slate-50/80 rounded-xl focus:ring-2 focus:ring-blue-100 transition-all p-4 leading-relaxed"
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

            <div className="flex justify-end pt-20">
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  setCurrentStep('architecture-view');
                }}
                className="bg-blue-900 px-10 h-16 rounded-2xl font-black shadow-2xl shadow-blue-900/30 hover:scale-105 active:scale-95 transition-all text-white gap-3"
              >
                Next Step: Architecture Mapping <ChevronRight className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Architecture View */}
        {currentStep === 'architecture-view' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* Quick Tips Guide */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MousePointer2 className="w-5 h-5 text-blue-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-blue-900">How to add hotspots</h4>
                  <p className="text-xs text-blue-700/70 leading-relaxed font-medium">
                    {viewType === 'architectural'
                      ? "Click anywhere on the large image below to place a new architectural pinpoint."
                      : "Click on the photo then select an existing hotspot from the master list to map it."}
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
                  <h2 className="text-2xl font-serif font-bold text-slate-800">{templeName}</h2>
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
                <Button onClick={saveTempleDetails} className="bg-blue-900 text-white hover:bg-blue-800 rounded-xl px-6 shadow-lg">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>

            {/* View Switcher Tabs */}
            <div className="flex justify-center bg-muted p-1 rounded-xl w-fit mx-auto relative group">
              <button
                onClick={() => {
                  setViewType('architectural');
                  setAdminImageIndex(0);
                }}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${viewType === 'architectural'
                  ? 'bg-white shadow-sm text-primary'
                  : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                Architecture View
              </button>

              <div className="relative">
                <button
                  disabled={!archImageUrl || archHotspots.length === 0}
                  onClick={() => {
                    setViewType('present');
                    setAdminImageIndex(0);
                  }}
                  className={`px-6 py-2 rounded-lg font-medium transition-all ${viewType === 'present'
                    ? 'bg-white shadow-sm text-primary'
                    : (!archImageUrl || archHotspots.length === 0)
                      ? 'text-slate-300 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Present View
                </button>
                {(!archImageUrl || archHotspots.length === 0) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    Define Architecture Sthanas first
                  </div>
                )}
              </div>
            </div>

            {/* Unified Multi-Image Management Slider */}
            <Card className="overflow-hidden border-none shadow-none bg-transparent">
              <CardHeader className="px-0 pt-0 pb-4">
                <div>
                  <CardTitle className="text-xl">Interactive Image Editor</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Click anywhere on the image to place or edit hotspots. Use the gallery below to switch between images.
                  </p>
                </div>
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
                          className="max-h-[80vh] w-auto shadow-2xl transition-transform duration-700 select-none pb-24"
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
                              onEdit={handleHotspotEdit}
                              onDelete={deleteHotspot}
                              onUnmap={unmapHotspot}
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
                    {adminImageIndex > 0 && (
                      <Button
                        variant="destructive"
                        size="sm"
                        className="bg-red-600/20 hover:bg-red-600 text-red-100 backdrop-blur-xl border border-red-600/30 shadow-2xl"
                        onClick={() => removeSupplementalImage(adminImageIndex - 1)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove Image
                      </Button>
                    )}
                    {adminImageIndex === 0 && (
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
                            folderPath={`${viewType}/${id}`}
                            onUpload={handleImageUpload}
                            label="Change Main Image"
                          />
                        </PopoverContent>
                      </Popover>
                    )}
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
                        {idx > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm("Remove this supplemental image and all its hotspots?")) {
                                removeSupplementalImage(idx - 1);
                              }
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-red-600/80 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-lg z-20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
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
                            folderPath={viewType === 'architectural' ? `architecture/${id}` : `present/${id}`}
                            onUpload={handleSupplementalImageUpload}
                            label="Add Photo to Gallery"
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
                          ? "ℹ️ Click anywhere on the image above to add a new hotspot, or use the sticky button."
                          : "ℹ️ Click on the photo above then select a hotspot to map it."}
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
                          className={`group transition-all cursor-pointer overflow-hidden border-2 ${hoveredHotspotId === hotspot.id
                            ? 'border-primary shadow-lg bg-primary/5 ring-4 ring-primary/10'
                            : isPlaced ? 'border-blue-100 bg-blue-50/30' : 'hover:border-primary/50 hover:shadow-lg'
                            }`}
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
                              setSelectedHotspot(hotspot);
                              setCurrentStep('sthana-details');
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }}
                          onMouseEnter={() => setHoveredHotspotId(hotspot.id)}
                          onMouseLeave={() => setHoveredHotspotId(null)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black text-white ${viewType === 'architectural' ? 'bg-red-600' : 'bg-blue-600'}`}>
                                    {hotspot.number}
                                  </span>
                                  <h4 className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                    {hotspot.title || "Untitled Hotspot"}
                                  </h4>
                                </div>
                                <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                  {hotspot.description || "No description provided."}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                {isPlaced && (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                                    Mapped
                                  </Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (viewType === 'present' && isPlaced) {
                                      unmapHotspot(hotspot.id);
                                    } else {
                                      deleteHotspot(hotspot);
                                    }
                                  }}
                                  title={viewType === 'present' && isPlaced ? "Unmap from this photo" : "Delete forever"}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <span>Position: {hotspot.x.toFixed(1)}%, {hotspot.y.toFixed(1)}%</span>
                              <span className="flex items-center gap-1 group-hover:text-primary">
                                Move / Position <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}

                    {filteredListHotspots.length === 0 && (
                      <div
                        onClick={() => {
                          if (viewType === 'architectural') {
                            // Initialize hotspot at a default center position
                            const newHotspot: Hotspot = {
                              id: uuidv4(),
                              x: 50,
                              y: 50,
                              imageIndex: adminImageIndex,
                              title: "",
                              description: "",
                              significance: "",
                              number: archHotspots.length + 1,
                              images: [],
                              oldImages: [],
                              leelas: [],
                              sthanPothiDescription: "",
                              sthanPothiTitle: "",
                              generalDescriptionTitle: "",
                              isPresent: false
                            };

                            setSelectedHotspot(newHotspot);
                            setCurrentStep('sthana-details');

                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            toast({
                              title: "New Hotspot Created",
                              description: "A new hotspot has been created. You can position it precisely on the image above.",
                            });
                          }
                        }}
                        className={`col-span-full py-16 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 ${viewType === 'architectural' ? 'cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group' : ''}`}
                      >
                        <div className={`w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm ${viewType === 'architectural' ? 'group-hover:scale-110 group-hover:bg-blue-50 transition-transform duration-300' : ''}`}>
                          <Plus className={`w-8 h-8 ${viewType === 'architectural' ? 'text-blue-500' : 'text-slate-300'}`} />
                        </div>
                        <h3 className="text-slate-900 font-bold text-lg mb-1">Create First Hotspot</h3>
                        <p className="text-slate-500 text-sm max-w-sm mx-auto">
                          {viewType === 'architectural'
                            ? "Click here to immediately create a new hotspot."
                            : "Add hotspots in the Architectural View first, then map them here."}
                        </p>
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
                <Textarea
                  placeholder="Provide a detailed architectural description of the temple complex..."
                  value={architectureDescription}
                  onChange={(e) => setArchitectureDescription(e.target.value)}
                  className="min-h-[150px] resize-y"
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
                              value={block.title}
                              onChange={(e) => updateCustomBlock(block.id, 'title', e.target.value)}
                              placeholder="Block Title"
                              className="font-bold rounded-xl"
                            />
                            <Textarea
                              value={block.content}
                              onChange={(e) => updateCustomBlock(block.id, 'content', e.target.value)}
                              placeholder="Block content..."
                              rows={4}
                              className="rounded-xl"
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
                    <p className="text-sm text-slate-500 font-medium">Manage content, leelas, and photos for each sacred pinpoint.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search hotspots..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64 rounded-xl border-slate-200"
                      />
                    </div>
                    <Button onClick={saveTempleDetails} className="bg-blue-900 text-white rounded-xl px-6">
                      <Save className="w-4 h-4 mr-2" /> Save All
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {archHotspots
                    .filter(h => h.title.toLowerCase().includes(searchQuery.toLowerCase()) || h.number?.toString().includes(searchQuery))
                    .map((hotspot) => (
                      <Card
                        key={hotspot.id}
                        className="group hover:shadow-xl transition-all border-2 border-transparent hover:border-blue-200 cursor-pointer overflow-hidden rounded-3xl"
                        onClick={() => setSelectedHotspot(hotspot)}
                      >
                        <CardContent className="p-0">
                          <div className="aspect-video bg-slate-100 flex items-center justify-center relative overflow-hidden">
                            {hotspot.images?.[0] ? (
                              <img
                                src={hotspot.images[0]}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                onError={(e) => (e.currentTarget.src = "/placeholder-temple.jpg")}
                              />
                            ) : (
                              <div className="flex flex-col items-center gap-2">
                                <ImageIcon className="w-12 h-12 text-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Image</span>
                              </div>
                            )}
                            <div className="absolute top-4 left-4 w-10 h-10 rounded-2xl bg-white shadow-xl flex items-center justify-center font-black text-blue-900 border border-slate-100">
                              {hotspot.number}
                            </div>
                          </div>
                          <div className="p-6 space-y-3">
                            <div>
                              <h3 className="font-bold text-slate-900 text-lg group-hover:text-blue-600 transition-colors">
                                {hotspot.title || `Sthana #${hotspot.number}`}
                              </h3>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">
                                {hotspot.type || 'Structure'}
                              </p>
                            </div>
                            <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
                              {hotspot.description || "No description provided yet."}
                            </p>
                            <div className="pt-4 flex items-center justify-between border-t border-slate-50">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <LucideIcons.Book className="w-3 h-3 text-blue-400" /> {hotspot.leelas?.length || 0} Stories
                              </span>
                              <Button variant="ghost" size="sm" className="text-blue-600 font-black text-xs hover:bg-blue-50">
                                EDIT CONTENT <ChevronRight className="w-3 h-3 ml-1" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* Editing Header */}
                <div className="flex items-center justify-between sticky top-20 z-40 bg-[#F9F6F0]/80 backdrop-blur-md py-4">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => setSelectedHotspot(null)} className="rounded-xl">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-blue-900 text-white flex items-center justify-center font-black text-lg">
                        {selectedHotspot.number}
                      </div>
                      <h2 className="text-2xl font-serif font-bold text-primary truncate max-w-sm">
                        {selectedHotspot.title || `Edit Sthana #${selectedHotspot.number}`}
                      </h2>
                    </div>
                  </div>
                </div>

                {/* Form Content */}
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Primary Content */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden h-full">
                      <CardHeader className="bg-slate-50 border-b border-slate-100 pb-3">
                        <CardTitle className="text-lg font-bold">General Description</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6 pt-6">
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">Sthan Name</Label>
                          <Input
                            value={selectedHotspot.title || ""}
                            onChange={(e) => setSelectedHotspot({ ...selectedHotspot, title: e.target.value })}
                            placeholder="e.g. Garbhagriha"
                            className="h-12 rounded-2xl border-slate-200 focus:border-blue-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-black uppercase tracking-widest text-slate-400">General Description</Label>
                        </div>
                        <div className="space-y-2">
                          <Textarea
                            value={selectedHotspot.description}
                            onChange={(e) => setSelectedHotspot({ ...selectedHotspot, description: e.target.value })}
                            placeholder="Main architectural overview..."
                            rows={4}
                            className="rounded-2xl border-slate-200 min-h-[140px]"
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
                          <Textarea
                            value={selectedHotspot.sthanPothiDescription || ""}
                            onChange={(e) => setSelectedHotspot({ ...selectedHotspot, sthanPothiDescription: e.target.value })}
                            placeholder="Details from scripture..."
                            rows={8}
                            className="rounded-2xl border-slate-200 min-h-[200px]"
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
                                  value={leela.title || ""}
                                  className="bg-white rounded-xl font-bold h-10"
                                  onChange={(e) => {
                                    const updatedLeelas = (selectedHotspot.leelas as any[]).map((l: any) =>
                                      l.id === leela.id ? { ...l, title: e.target.value } : l
                                    );
                                    setSelectedHotspot({ ...selectedHotspot, leelas: updatedLeelas as Leela[] });
                                  }}
                                />
                              </div>
                              <Textarea
                                placeholder="Describe the divine leela..."
                                rows={4}
                                className="bg-white rounded-2xl p-4"
                                value={leela.description}
                                onChange={(e) => updateLeela(leela.id, e.target.value)}
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
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {selectedHotspot.images?.map((url: string, idx: number) => (
                          <div key={idx} className="relative aspect-square group rounded-2xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50">
                            <img
                              src={url || "/icons/sthaan.png"}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => (e.currentTarget.src = "/icons/sthaan.png")}
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

                {/* Final Actions Footer (Sticky) */}
                <div className="sticky bottom-4 z-50 bg-white/90 backdrop-blur-xl border border-slate-200 p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-6 px-8 max-w-2xl mx-auto ring-1 ring-slate-950/5">
                  <div className="flex items-center gap-3">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Selected:</p>
                    <p className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{selectedHotspot.title || `Pin #${selectedHotspot.number}`}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="ghost" onClick={() => setSelectedHotspot(null)} className="rounded-2xl font-bold px-6 h-12">Back to List</Button>
                    <Button
                      onClick={async () => {
                        const updated = archHotspots.map(h => h.id === selectedHotspot.id ? selectedHotspot : h);
                        setArchHotspots(updated);

                        try {
                          const token = await user?.getIdToken();
                          await fetch(`/api/admin/data?collection=temples&id=${id}&subcollection=architecture_hotspots&subId=${selectedHotspot.id}`, {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { "Authorization": `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify(sanitizeData(selectedHotspot))
                          });
                          toast({ title: "Updated", description: "Metadata synced across view." });
                          setSelectedHotspot(null);
                        } catch (e) {
                          console.error(e);
                          toast({ title: "Sync Failed", variant: "destructive" });
                        }
                      }}
                      className="bg-blue-600 text-white hover:bg-blue-700 rounded-2xl px-10 h-12 shadow-xl shadow-blue-600/20 font-bold"
                    >
                      Save & Return
                    </Button>
                  </div>
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
                        <p className="font-bold text-slate-900">{ah.title || `Sthana #${ah.number}`}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ah.description}</p>
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

        {/* Floating Sticky Button for Adding Hotspots (Step 2 Only) */}
        {
          currentStep === 'architecture-view' && viewType === 'architectural' && (
            <div className="fixed bottom-10 right-10 z-[60] animate-in fade-in zoom-in slide-in-from-bottom-10 duration-500">
              <Button
                onClick={() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  toast({
                    title: "Ready to Add",
                    description: "Click anywhere on the large architectural image at the top to place a new hotspot pinpoint.",
                  });
                }}
                className="h-16 px-8 rounded-full shadow-[0_20px_50px_rgba(37,99,235,0.4)] bg-blue-600 text-white border-2 border-white/20 hover:scale-110 active:scale-95 transition-all text-lg font-black gap-3 group"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform duration-300">
                  <Plus className="w-6 h-6 text-white" />
                </div>
                Add New Hotspot
              </Button>
            </div>
          )
        }
      </div>
    </AdminLayout>
  );
}
