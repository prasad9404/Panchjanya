import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, addDoc, updateDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import { useToast } from "@/shared/hooks/use-toast";
import { ArrowLeft, Save, ExternalLink } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getSthanTypes, AVATAR_SAMBANDH_CONFIG, getValidSthanTypes, getAvatarColor, normalizeAvatarId, PIN_SERIES } from "@/shared/utils/sthanTypes";
import { getSthanaStatus } from "@/shared/utils/sthanValidation";
import { SthanType } from "@/shared/types/sthanType";
import { Switch } from "@/shared/components/ui/switch";
import ReactSelect from "react-select";
import { RelatedAvatarsSelect } from "./RelatedAvatarsSelect";
import { RelatedAvatar } from "@/types";
import { cn } from "@/shared/lib/utils";

interface TempleFormProps {
    templeId?: string;
}

export default function TempleForm({ templeId }: TempleFormProps) {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!templeId);
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);

    // ── Basic Information ──
    const [name, setName] = useState("");
    const [todaysNameTitle, setTodaysNameTitle] = useState("");
    const [todaysName, setTodaysName] = useState("");
    const [address, setAddress] = useState("");
    const [taluka, setTaluka] = useState("");
    const [district, setDistrict] = useState("");
    const [sthan, setSthan] = useState("");
    const [sthanTypeId, setSthanTypeId] = useState("");
    const [pinIcon, setPinIcon] = useState("");
    
    // New Hierarchy Fields
    const [primaryAvatar, setPrimaryAvatar] = useState("");
    const [primarySubtype, setPrimarySubtype] = useState<string[]>([]);
    const [relatedAvatars, setRelatedAvatars] = useState<RelatedAvatar[]>([]);

    // ── Location ──
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [locationLink, setLocationLink] = useState("");

    // ── Administration ──
    const [originalTempleData, setOriginalTempleData] = useState<any>(null);
    const [manualStatus, setManualStatus] = useState<any>();
    const [hasArchitecture, setHasArchitecture] = useState(false); // default: false (standalone)

    // Load sthan types
    useEffect(() => {
        getSthanTypes().then(setSthanTypes);
    }, []);

    // Pre-fill when editing an existing temple
    useEffect(() => {
        if (!templeId) return;
        const fetchTemple = async () => {
            try {
                setFetching(true);
                let data: any = null;
                try {
                    const token = await user?.getIdToken();
                    const res = await fetch(`/api/admin/data?collection=temples&id=${templeId}`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
                        data = await res.json();
                    }
                } catch (_) { /* fall through */ }

                if (!data) {
                    const snap = await getDoc(doc(db, "temples", templeId));
                    if (snap.exists()) data = snap.data();
                }

                if (data) {
                    setName(data.name || "");
                    setTodaysNameTitle(data.todaysNameTitle || "");
                    setTodaysName(data.todaysName || "");
                    setAddress(data.address || "");
                    setTaluka(data.taluka || "");
                    setDistrict(data.district || "");
                    setSthan(data.sthan || "");
                    setSthanTypeId(data.sthanTypeId || "");
                    
                    // Legacy fallback loading
                    setPrimaryAvatar(data.primaryAvatar || data.avatarSambandh || "");
                    setPrimarySubtype(data.primarySubtype || data.avatarSubTypes || (data.avatarSubdivision ? [data.avatarSubdivision] : []));
                    
                    // Handle Related Avatars Conversion
                    if (Array.isArray(data.relatedAvatars)) {
                        if (data.relatedAvatars.length > 0 && typeof data.relatedAvatars[0] === 'string') {
                            setRelatedAvatars(data.relatedAvatars.map((id: string) => ({ avatar: id, subtype: [] })));
                        } else {
                            setRelatedAvatars(data.relatedAvatars);
                        }
                    } else {
                        setRelatedAvatars([]);
                    }

                    setLatitude(String(data.latitude ?? data.location?.lat ?? ""));
                    setLongitude(String(data.longitude ?? data.location?.lng ?? ""));
                    setLocationLink(data.locationLink || "");
                    setPinIcon(data.pinIcon || "");
                    setOriginalTempleData(data);
                    setManualStatus(data.status);
                    // Map existing data to hasArchitecture
                    // If isStandalone was true, hasArchitecture is false.
                    // If architectureImage or architectureImages exists, it's definitely true.
                    setHasArchitecture(data.hasArchitecture !== undefined 
                      ? data.hasArchitecture 
                      : (data.isStandalone !== undefined ? !data.isStandalone : (!!data.architectureImage || !!data.architectureImages?.length)));
                } else {
                    toast({ title: "Error", description: "Temple not found", variant: "destructive" });
                    navigate("/admin/dashboard");
                }
            } catch (error) {
                console.error("Error fetching temple:", error);
                toast({ title: "Error", description: "Failed to load temple data", variant: "destructive" });
            } finally {
                setFetching(false);
            }
        };
        fetchTemple();
    }, [templeId, navigate, toast, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        
        if (!primaryAvatar) {
            toast({ title: "Validation Error", description: "Primary Avatar is required.", variant: "destructive" });
            return;
        }

        setLoading(true);

        try {
            const latNum = parseFloat(latitude);
            const lngNum = parseFloat(longitude);

            if (isNaN(latNum) || isNaN(lngNum)) {
                toast({ title: "Invalid Coordinates", description: "Please enter valid Latitude and Longitude.", variant: "destructive" });
                setLoading(false);
                return;
            }

            const templeData = {
                name,
                todaysName,
                todaysNameTitle,
                address,
                taluka,
                district,
                sthan,
                
                // New Fields
                primaryAvatar,
                primarySubtype,
                relatedAvatars,
                sthanType: sthan,
                sthanTypeId,
                
                // Legacy fields for backward compatibility
                avatarSambandh: primaryAvatar,
                avatarSubdivision: primarySubtype.length > 0 ? primarySubtype[0] : undefined,

                latitude: latNum,
                longitude: lngNum,
                location: { lat: latNum, lng: lngNum },
                locationLink,
                pinIcon,
                updatedAt: new Date().toISOString(),
                updatedBy: user.uid,
                status: manualStatus || liveStatus,
                // Architecture mapping fields
                hasArchitecture,
                architectureId: hasArchitecture ? (templeId || null) : null,
                isStandalone: !hasArchitecture, // legacy support
            };

            const method = templeId ? "PUT" : "POST";
            const apiUrl = templeId
                ? `/api/admin/data?collection=temples&id=${templeId}`
                : `/api/admin/data?collection=temples`;

            const token = await user.getIdToken();
            const res = await fetch(apiUrl, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(
                    templeId
                        ? templeData
                        : { ...templeData, createdAt: new Date().toISOString(), createdBy: user.uid }
                ),
            });

            if (res.ok) {
                const responseData = await res.json();
                const finalId = templeId || responseData.id;
                if (!hasArchitecture) {
                    toast({ title: "Sthan Saved", description: "Standalone sthan added to directory and map." });
                    navigate("/admin/sthana-directory");
                } else {
                    toast({ title: "Sthan Saved", description: "Redirecting to architecture configuration..." });
                    navigate(`/admin/architecture/${finalId}`);
                }
            } else {
                console.warn("API write failed, falling back to Client SDK.");
                if (templeId) {
                    await updateDoc(doc(db, "temples", templeId), { ...templeData, updatedAt: Timestamp.now() });
                    toast({ title: "Sthan Updated" });
                    if (!hasArchitecture) {
                        navigate("/admin/sthana-directory");
                    } else {
                        navigate(`/admin/architecture/${templeId}`);
                    }
                } else {
                    const newDoc = await addDoc(collection(db, "temples"), {
                        ...templeData,
                        createdAt: Timestamp.now(),
                        createdBy: user.uid,
                    });
                    if (!hasArchitecture) {
                        toast({ title: "Sthan Created", description: "Standalone sthan added to directory and map." });
                        navigate("/admin/sthana-directory");
                    } else {
                        toast({ title: "Sthan Created", description: "Redirecting to architecture configuration..." });
                        navigate(`/admin/architecture/${newDoc.id}`);
                    }
                }
            }
        } catch (error: any) {
            console.error("Error saving temple:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to save temple data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4" />
                    <p className="text-lg">Loading...</p>
                </div>
            </div>
        );
    }

    // Dynamic Options for React Select
    const primaryAvatarConfig = AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar);
    const showSubTypes = primaryAvatarConfig && primaryAvatarConfig.subdivisions.length > 0;
    
    // Live compute status
    const liveStatus = getSthanaStatus({
        ...originalTempleData,
        name,
        sthanTypeId,
        district,
        primaryAvatar,
        status: manualStatus || originalTempleData?.status
    });

    return (
        <div className="min-h-screen bg-[#F9F6F0] pb-20">
            <div className="max-w-7xl mx-auto px-6 pt-8 space-y-8">

                {/* ── Top Navigation ── */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between z-10 transition-all duration-300">
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
                        <span className="text-sm font-black uppercase tracking-widest text-slate-500">
                            Add New Sthana
                        </span>
                    </div>
                    <div className="hidden md:flex items-center gap-3 pr-2">
                        <div className="w-1.5 h-6 bg-slate-200 rounded-full" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
                            Basic Info &amp; Location
                        </span>
                    </div>
                </div>

                {/* ── Page Header ── */}
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Add New Sthan</h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Fill in the primary identity and location.
                            {hasArchitecture
                                ? " You'll configure images, descriptions, and hotspots on the next page."
                                : " This standalone sthan will appear on the map immediately after saving."}
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">

                    {/* ── 1. Primary Identity ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Primary Identity</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                                This information appears in the main header and site-wide navigation.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {/* Sthan Name + Today's Name */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Sthan Name *</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
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
                                        id="todaysName"
                                        value={todaysName}
                                        onChange={(e) => setTodaysName(e.target.value)}
                                        placeholder="e.g. Patan, Gujarat"
                                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Address</Label>
                                <Textarea
                                    id="address"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    placeholder="Enter the complete address..."
                                    rows={3}
                                    className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            {/* Taluka + District */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Taluka</Label>
                                    <Input
                                        id="taluka"
                                        value={taluka}
                                        onChange={(e) => setTaluka(e.target.value)}
                                        placeholder="e.g. Sidhpur"
                                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">District</Label>
                                    <Input
                                        id="district"
                                        value={district}
                                        onChange={(e) => setDistrict(e.target.value)}
                                        placeholder="e.g. Patan"
                                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <Separator className="bg-slate-200/60 my-6" />

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Primary Avatar *</Label>
                                    <Select
                                        value={primaryAvatar}
                                        onValueChange={(v) => {
                                            setPrimaryAvatar(v);
                                            setPrimarySubtype([]); // reset when primary changes
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
                                        <SelectContent>
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
                                    <p className="text-xs text-slate-400">Controls the color of the map pin and primary categorization.</p>
                                </div>

                                {showSubTypes && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-semibold text-slate-700">Avatar Sub Type(s)</Label>
                                        <ReactSelect
                                            isMulti
                                            options={primaryAvatarConfig.subdivisions.filter(s => s.id !== 'complete').map(s => ({ value: s.id, label: s.label }))}
                                            value={primaryAvatarConfig.subdivisions
                                                .filter(s => primarySubtype.includes(s.id))
                                                .map(s => ({ value: s.id, label: s.label }))}
                                            onChange={(selected) => {
                                                setPrimarySubtype(selected ? selected.map((s: any) => s.value) : []);
                                            }}
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
                                                    '&:hover': {
                                                        borderColor: '#cbd5e1'
                                                    }
                                                })
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Sthan Type *</Label>
                                    <Select 
                                        value={sthanTypeId || sthan} 
                                        onValueChange={(v) => {
                                            const typeObj = sthanTypes.find(t => t.id === v || t.name === v);
                                            if (typeObj) {
                                                setSthan(typeObj.name);
                                                setSthanTypeId(typeObj.id);
                                                if (typeObj.pinType) {
                                                    setPinIcon(typeObj.pinType);
                                                }
                                            } else {
                                                setSthan(v);
                                                setSthanTypeId("");
                                            }
                                        }} 
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="Select Sthan Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getValidSthanTypes(primaryAvatar, sthanTypes).map((st) => (
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
                                            {sthan && !sthanTypeId && !getValidSthanTypes(primaryAvatar, sthanTypes).some(t => t.name === sthan) && (
                                                <SelectItem value={sthan}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{sthan}</span>
                                                    </div>
                                                </SelectItem>
                                            )}
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

                    {/* ── 2. Navigation & Access ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Navigation &amp; Access</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                                Help pilgrims find their way to this sacred site.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {/* Lat/Lng */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Latitude *</Label>
                                    <Input
                                        id="latitude"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        required
                                        placeholder="e.g. 23.8506"
                                        type="number"
                                        step="any"
                                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-semibold text-slate-700">Longitude *</Label>
                                    <Input
                                        id="longitude"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        required
                                        placeholder="e.g. 72.1154"
                                        type="number"
                                        step="any"
                                        className="h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium -mt-2">
                                Right-click on Google Maps → first option to copy coordinates.
                            </p>

                            {/* Google Maps URL */}
                            <div className="space-y-2">
                                <Label className="text-sm font-semibold text-slate-700">Google Maps Integration (URL)</Label>
                                <div className="relative group">
                                    <Input
                                        id="locationLink"
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

                    {/* ── 3. Administration ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Administration</h2>
                            <p className="mt-2 text-sm leading-relaxed text-slate-500 font-medium">
                                Manually manage the verification and completion status of this sthana.
                            </p>
                        </div>
                        <div className="lg:col-span-2 space-y-6">
                            {/* Architecture Toggle */}
                            <div className={cn(
                                "flex items-start justify-between p-5 rounded-xl border-2 transition-all",
                                hasArchitecture
                                    ? "bg-amber-50 border-amber-200"
                                    : "bg-emerald-50 border-emerald-200"
                            )}>
                                <div className="space-y-1 flex-1 pr-4">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded",
                                            hasArchitecture ? "bg-amber-200 text-amber-800" : "bg-emerald-200 text-emerald-800"
                                        )}>
                                            {hasArchitecture ? "WITH ARCHITECTURE" : "STANDALONE"}
                                        </span>
                                    </div>
                                    <Label className="text-base font-bold text-slate-900 block mt-1">
                                        {hasArchitecture ? "Link to Architecture Page" : "Standalone Sthan"}
                                    </Label>
                                    <p className="text-sm text-slate-500">
                                        {hasArchitecture
                                            ? "After saving, you'll be taken to configure images, hotspots & descriptions."
                                            : "Saved directly to map without a full architecture page. Best for location-only sthans."}
                                    </p>
                                </div>
                                <Switch
                                    checked={hasArchitecture}
                                    onCheckedChange={setHasArchitecture}
                                    className="data-[state=checked]:bg-amber-500 mt-1"
                                />
                            </div>

                            {/* Status & Progress Card */}
                            <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <Label className="text-base font-bold text-slate-900 block">Sthana Status</Label>
                                        <p className="text-sm text-slate-500">Live computed status based on data completeness.</p>
                                    </div>
                                    <div className="shrink-0 flex gap-2">
                                        {liveStatus === 'PUBLISHED' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide gap-1">
                                                🌍 Published
                                            </span>
                                        )}
                                        {liveStatus === 'VERIFIED' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-[#C9A961]/10 text-[#a88b48] border border-[#C9A961]/20 uppercase tracking-wide gap-1">
                                                🟢 Verified
                                            </span>
                                        )}
                                        {liveStatus === 'COMPLETE' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide gap-1">
                                                ✅ Complete
                                            </span>
                                        )}
                                        {liveStatus === 'IN_PROGRESS' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide gap-1">
                                                ✏️ In Progress
                                            </span>
                                        )}
                                        {liveStatus === 'DRAFT' && (
                                            <span className="inline-flex items-center px-3 py-1 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide gap-1">
                                                📝 Draft
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Professional Action Buttons */}
                                {(liveStatus === 'COMPLETE' || liveStatus === 'VERIFIED' || liveStatus === 'PUBLISHED') && (
                                    <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-3">
                                        {liveStatus === 'COMPLETE' && (
                                            <Button 
                                                type="button" 
                                                onClick={() => { setManualStatus('VERIFIED'); toast({ title: "Status Updated", description: "Marked as Verified. Save to apply changes." }); }}
                                                className="bg-[#C9A961] hover:bg-[#b0924e] text-white"
                                            >
                                                Verify Sthana
                                            </Button>
                                        )}
                                        {liveStatus === 'VERIFIED' && (
                                            <Button 
                                                type="button" 
                                                onClick={() => { setManualStatus('PUBLISHED'); toast({ title: "Status Updated", description: "Marked as Published. Save to apply changes." }); }}
                                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                            >
                                                Publish Sthana
                                            </Button>
                                        )}
                                        {liveStatus === 'PUBLISHED' && (
                                            <p className="text-xs text-slate-400 font-medium py-2">
                                                This sthana is verified and published globally.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Action Row ── */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-slate-200/60">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate("/admin/sthana-directory")}
                            className="rounded-xl h-12 px-8 font-bold border-slate-200"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "text-white rounded-xl px-8 h-12 shadow-lg font-bold min-w-[180px]",
                                hasArchitecture
                                    ? "bg-blue-900 hover:bg-blue-800 shadow-blue-900/20"
                                    : "bg-emerald-700 hover:bg-emerald-600 shadow-emerald-900/20"
                            )}
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Saving..." : hasArchitecture ? "Save & Configure" : "Save to Map"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
