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
    const [isVerified, setIsVerified] = useState(false);
    const [isComplete, setIsComplete] = useState(false);

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
                    setIsVerified(data.isVerified || false);
                    setIsComplete(data.isComplete || false);
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
                sthanType: sthan, // Standardized field
                sthanTypeId, // Link to Manage Sthan Types
                
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
                isVerified,
                isComplete,
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
                toast({ title: "Temple Saved", description: "Redirecting to full configuration..." });
                navigate(`/admin/architecture/${finalId}`);
            } else {
                console.warn("API write failed, falling back to Client SDK.");
                if (templeId) {
                    await updateDoc(doc(db, "temples", templeId), { ...templeData, updatedAt: Timestamp.now() });
                    toast({ title: "Temple Updated" });
                    navigate(`/admin/architecture/${templeId}`);
                } else {
                    const newDoc = await addDoc(collection(db, "temples"), {
                        ...templeData,
                        createdAt: Timestamp.now(),
                        createdBy: user.uid,
                    });
                    toast({ title: "Temple Created", description: "Redirecting to full configuration..." });
                    navigate(`/admin/architecture/${newDoc.id}`);
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
                        <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Add New Sthana</h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Fill in the primary identity and location. You'll configure images, descriptions, and hotspots on the next page.
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
                                        value={sthan} 
                                        onValueChange={(v) => {
                                            setSthan(v);
                                            // Find the type object to get its ID and pinType
                                            const typeObj = sthanTypes.find(t => t.name === v);
                                            if (typeObj) {
                                                setSthanTypeId(typeObj.id);
                                                if (typeObj.pinType) {
                                                    setPinIcon(typeObj.pinType);
                                                }
                                            }
                                        }} 
                                        required
                                    >
                                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-white">
                                            <SelectValue placeholder="Select Sthan Type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getValidSthanTypes(primaryAvatar, sthanTypes).map((st) => (
                                                <SelectItem key={st.id} value={st.name}>
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="w-2.5 h-2.5 rounded-full shrink-0" 
                                                            style={{ backgroundColor: getAvatarColor(st.avatarSambandh) || st.color }} 
                                                        />
                                                        <span>{st.name}</span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                            {getValidSthanTypes(primaryAvatar, sthanTypes).length === 0 && (
                                                <div className="px-3 py-2 text-sm text-slate-400 italic">No types available for this avatar</div>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-slate-900">Verified Status</Label>
                                        <p className="text-sm text-slate-500">Mark as verified.</p>
                                    </div>
                                    <Switch
                                        checked={isVerified}
                                        onCheckedChange={setIsVerified}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                                    <div className="space-y-0.5">
                                        <Label className="text-base font-bold text-slate-900">Data Completion</Label>
                                        <p className="text-sm text-slate-500">Mark as complete.</p>
                                    </div>
                                    <Switch
                                        checked={isComplete}
                                        onCheckedChange={setIsComplete}
                                    />
                                </div>
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
                            className="bg-blue-900 text-white hover:bg-blue-800 rounded-xl px-8 h-12 shadow-lg shadow-blue-900/20 font-bold min-w-[180px]"
                        >
                            <Save className="w-4 h-4 mr-2" />
                            {loading ? "Saving..." : "Save & Configure"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
