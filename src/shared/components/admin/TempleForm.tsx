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
import { ArrowLeft, Save, ExternalLink, Check, MapPin, Home, BookOpen } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { Languages, Wand2 } from "lucide-react";
import { ensureMultilingual } from "@/shared/services/translationService";
import { autoTranslateMultilingual } from "@/shared/services/autoTranslate";
import { MultilingualString } from "@/types";

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
    const [activeLang, setActiveLang] = useState<'en' | 'hi' | 'mr'>('en');

    // ── Multilingual Information ──
    const [name, setName] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [todaysNameTitle, setTodaysNameTitle] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [todaysName, setTodaysName] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [address, setAddress] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [taluka, setTaluka] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [district, setDistrict] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
    const [sthan, setSthan] = useState<MultilingualString>({ en: "", hi: "", mr: "" });
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
                    setName(ensureMultilingual(data.name));
                    setTodaysNameTitle(ensureMultilingual(data.todaysNameTitle));
                    setTodaysName(ensureMultilingual(data.todaysName));
                    setAddress(ensureMultilingual(data.address));
                    setTaluka(ensureMultilingual(data.taluka));
                    setDistrict(ensureMultilingual(data.district));
                    setSthan(ensureMultilingual(data.sthan));
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

    const handleAutoTranslate = async () => {
        if (!name.en) {
            toast({ title: "English Name Required", description: "Please enter the English name first.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            const fieldsToTranslate = [
                { key: 'name', value: name.en, setter: setName },
                { key: 'todaysNameTitle', value: todaysNameTitle.en, setter: setTodaysNameTitle },
                { key: 'todaysName', value: todaysName.en, setter: setTodaysName },
                { key: 'address', value: address.en, setter: setAddress },
                { key: 'taluka', value: taluka.en, setter: setTaluka },
                { key: 'district', value: district.en, setter: setDistrict },
                { key: 'sthan', value: sthan.en, setter: setSthan },
            ];

            for (const field of fieldsToTranslate) {
                if (field.value) {
                    const translated = await autoTranslateMultilingual(field.value);
                    field.setter(translated);
                }
            }

            toast({ title: "Translation Complete", description: "Hindi and Marathi fields have been populated." });
        } catch (error) {
            toast({ title: "Translation Error", description: "Failed to auto-translate fields.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

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
                sthanType: sthan, // Storing as object for backward compat (will need getter)
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
        <div className="w-full">
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 mb-8 py-4 -mx-6 px-6 flex items-center justify-between">
                <Tabs value={activeLang} onValueChange={(v: any) => setActiveLang(v)} className="w-fit">
                    <TabsList className="bg-slate-100/50 p-1 rounded-xl">
                        <TabsTrigger value="en" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold">EN</span>
                                English
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="hi" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold">HI</span>
                                हिंदी
                            </span>
                        </TabsTrigger>
                        <TabsTrigger value="mr" className="rounded-lg px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm">
                            <span className="flex items-center gap-2">
                                <span className="text-[10px] font-bold">MR</span>
                                मराठी
                            </span>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleAutoTranslate}
                    disabled={loading || !name.en}
                    className="rounded-xl border-slate-200 hover:bg-slate-50 gap-2 h-10 px-4 group"
                >
                    <Wand2 className="w-4 h-4 text-blue-500 group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-bold uppercase tracking-wider">Auto Translate</span>
                </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-12">

                    {/* ── 1. Primary Identity ── */}
                    <div className="pb-24">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
                            <div className="space-y-3">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Primary Identity</h2>
                                <p className="text-[11px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest">
                                    CORE STHANA DATA
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-slate-500 font-medium max-w-[200px]">
                                    This information appears in the main header and site-wide navigation.
                                </p>
                            </div>
                            <div className="lg:col-span-2 space-y-10">
                                {/* Sthan Name + Today's Name */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sthan Name *</Label>
                                        <div className="relative group">
                                            <Input
                                                id="name"
                                                value={name[activeLang]}
                                                onChange={(e) => setName(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                                required
                                                placeholder={activeLang === 'en' ? "संस्थानचे नाव प्रविष्ट करा" : "प्रविष्ट करा"}
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm font-medium"
                                            />
                                            <Home className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Input
                                                value={todaysNameTitle[activeLang]}
                                                onChange={(e) => setTodaysNameTitle(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                                className="h-8 p-0 px-2 w-fit min-w-[120px] text-[10px] font-black uppercase tracking-widest text-slate-400 border-transparent hover:border-slate-100 focus:border-blue-400/50 rounded-md transition-all bg-transparent"
                                                placeholder="Label Name"
                                            />
                                            <span className="text-slate-300 font-normal text-[10px]">(Optional)</span>
                                        </div>
                                        <Input
                                            id="todaysName"
                                            value={todaysName[activeLang]}
                                            onChange={(e) => setTodaysName(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                            placeholder="e.g. Patan, Gujarat"
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                {/* Address */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Address</Label>
                                    <Textarea
                                        id="address"
                                        value={address[activeLang]}
                                        onChange={(e) => setAddress(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                        placeholder="Enter the complete address..."
                                        rows={3}
                                        className="rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500/50 transition-all text-sm font-medium resize-none min-h-[120px]"
                                    />
                                </div>

                                {/* Taluka + District */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Taluka</Label>
                                        <Input
                                            id="taluka"
                                            value={taluka[activeLang]}
                                            onChange={(e) => setTaluka(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                            placeholder="e.g. Sidhpur"
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">District</Label>
                                        <Input
                                            id="district"
                                            value={district[activeLang]}
                                            onChange={(e) => setDistrict(prev => ({ ...prev, [activeLang]: e.target.value }))}
                                            placeholder="e.g. Patan"
                                            className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white focus:border-blue-500/50 transition-all text-sm font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="h-px bg-slate-100/60" />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Primary Avatar *</Label>
                                        <Select
                                            value={primaryAvatar}
                                            onValueChange={(v) => {
                                                setPrimaryAvatar(v);
                                                setPrimarySubtype([]); // reset when primary changes
                                            }}
                                            required
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm">
                                                <SelectValue placeholder="Select Primary Avatar">
                                                    {primaryAvatar ? (() => {
                                                        const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar);
                                                        return cfg ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-2.5 h-2.5 rounded-full shrink-0 inline-block" style={{ backgroundColor: cfg.color }} />
                                                                <span className="font-bold">{cfg.label}</span>
                                                            </span>
                                                        ) : 'Select Primary Avatar';
                                                    })() : 'Select Primary Avatar'}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {AVATAR_SAMBANDH_CONFIG.map((av) => (
                                                    <SelectItem key={av.id} value={av.id}>
                                                        <div className="flex items-center gap-2.5">
                                                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: av.color }} />
                                                            <span className="text-sm font-medium">{av.label}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {showSubTypes && (
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Avatar Sub Type(s)</Label>
                                            <ReactSelect
                                                isMulti
                                                options={primaryAvatarConfig.subdivisions.filter(s => s.id !== 'complete').map(s => ({ value: s.id, label: s.label }))}
                                                value={primaryAvatarConfig.subdivisions
                                                    .filter(s => primarySubtype.includes(s.id))
                                                    .map(s => ({ value: s.id, label: s.label }))}
                                                onChange={(selected) => {
                                                    setPrimarySubtype(selected ? selected.map((s: any) => s.value) : []);
                                                }}
                                                placeholder="Select..."
                                                className="react-select-container text-sm"
                                                classNamePrefix="react-select"
                                                styles={{
                                                    control: (base) => ({
                                                        ...base,
                                                        minHeight: '56px',
                                                        borderRadius: '1rem',
                                                        borderColor: '#f1f5f9',
                                                        backgroundColor: '#f8fafc4d',
                                                        boxShadow: 'none',
                                                        '&:hover': {
                                                            borderColor: '#e2e8f0'
                                                        }
                                                    })
                                                }}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Sthan Type *</Label>
                                        <Select 
                                            value={sthanTypeId || sthan[activeLang]} 
                                            onValueChange={(v) => {
                                                const typeObj = sthanTypes.find(t => t.id === v || t.name === v);
                                                if (typeObj) {
                                                    setSthan(prev => ({ ...prev, [activeLang]: typeObj.name }));
                                                    setSthanTypeId(typeObj.id);
                                                    if (typeObj.pinType) {
                                                        setPinIcon(typeObj.pinType);
                                                    }
                                                } else {
                                                    setSthan(prev => ({ ...prev, [activeLang]: v }));
                                                    setSthanTypeId("");
                                                }
                                            }} 
                                            required
                                        >
                                            <SelectTrigger className="h-14 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm">
                                                <SelectValue placeholder="Select Sthan Type">
                                                    <span className="font-bold">{sthan[activeLang]}</span>
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getValidSthanTypes(primaryAvatar, sthanTypes).map((st) => (
                                                    <SelectItem key={st.id} value={st.id}>
                                                        <div className="flex items-center gap-2">
                                                            <div 
                                                                className="w-2 h-2 rounded-full shrink-0" 
                                                                style={{ backgroundColor: getAvatarColor(st.avatarSambandh) || st.color }} 
                                                            />
                                                            <span className="text-sm font-medium">{st.name}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <RelatedAvatarsSelect 
                                        value={relatedAvatars}
                                        onChange={setRelatedAvatars}
                                        excludeAvatarId={primaryAvatar}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-slate-200/60" />

                    {/* ── 2. Navigation & Access ── */}
                    <div className="pb-24">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
                            <div className="space-y-3">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Navigation</h2>
                                <p className="text-[11px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest">
                                    LOCATION & ACCESS
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-slate-500 font-medium max-w-[200px]">
                                    Help pilgrims find their way to this sacred site with precise coordinates.
                                </p>
                            </div>
                            <div className="lg:col-span-2 space-y-10">
                                {/* Lat/Lng */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Latitude *</Label>
                                        <div className="relative group">
                                            <Input
                                                id="latitude"
                                                value={latitude}
                                                onChange={(e) => setLatitude(e.target.value)}
                                                required
                                                placeholder="e.g. 23.8506"
                                                type="number"
                                                step="any"
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm font-medium"
                                            />
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Longitude *</Label>
                                        <div className="relative group">
                                            <Input
                                                id="longitude"
                                                value={longitude}
                                                onChange={(e) => setLongitude(e.target.value)}
                                                required
                                                placeholder="e.g. 72.1154"
                                                type="number"
                                                step="any"
                                                className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm font-medium"
                                            />
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                        </div>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide -mt-6">
                                    Right-click on Google Maps → first option to copy coordinates.
                                </p>

                                {/* Google Maps URL */}
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">External Integration (URL)</Label>
                                    <div className="relative group">
                                        <Input
                                            id="locationLink"
                                            value={locationLink}
                                            onChange={(e) => setLocationLink(e.target.value)}
                                            placeholder="https://goo.gl/maps/..."
                                            className="h-14 pl-12 rounded-2xl border-slate-100 bg-slate-50/30 focus:bg-white transition-all text-sm font-medium"
                                        />
                                        <ExternalLink className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── 3. Administration ── */}
                    <div className="pb-24">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-20">
                            <div className="space-y-3">
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">Management</h2>
                                <p className="text-[11px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest">
                                    ADMIN & VISIBILITY
                                </p>
                                <p className="mt-4 text-xs leading-relaxed text-slate-500 font-medium max-w-[200px]">
                                    Manually manage the verification and completion status of this sacred site.
                                </p>
                            </div>
                            <div className="lg:col-span-2 space-y-10">
                                {/* Architecture Toggle */}
                                <div className={cn(
                                    "flex items-center justify-between p-7 rounded-[2rem] border transition-all duration-500",
                                    hasArchitecture
                                        ? "bg-blue-50/30 border-blue-100"
                                        : "bg-emerald-50/30 border-emerald-100"
                                )}>
                                    <div className="space-y-1.5 flex-1 pr-8">
                                        <div className="flex items-center gap-3">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full",
                                                hasArchitecture ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                                            )}>
                                                {hasArchitecture ? "LINKED SYSTEM" : "STANDALONE"}
                                            </span>
                                        </div>
                                        <Label className="text-lg font-black text-slate-900 block mt-2">
                                            {hasArchitecture ? "Architecture Integration" : "Standard Entry"}
                                        </Label>
                                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                            {hasArchitecture
                                                ? "Enables advanced configuration for images, hotspots, and historical viewports."
                                                : "Simple directory entry. Best for standalone sthans without detailed imagery."}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={hasArchitecture}
                                        onCheckedChange={setHasArchitecture}
                                        className="data-[state=checked]:bg-blue-600 scale-125 mr-4"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Bottom Action Row ── */}
                    <div className="flex items-center justify-between gap-6 pt-12 border-t border-slate-200/40">
                        <div className="flex-1 max-w-lg">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                                Ensure all required fields marked with * are completed before submitting for verification.
                            </p>
                        </div>
                        <div className="flex gap-4 items-center shrink-0">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/admin/sthana-directory")}
                                className="rounded-2xl h-14 px-10 font-black text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-all"
                            >
                                Cancel Changes
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className={cn(
                                    "text-white rounded-2xl px-12 h-14 shadow-2xl font-black text-[11px] uppercase tracking-[0.25em] transition-all duration-500",
                                    hasArchitecture
                                        ? "bg-blue-900 hover:bg-black shadow-blue-900/20"
                                        : "bg-emerald-800 hover:bg-black shadow-emerald-900/20"
                                )}
                            >
                                {loading ? (
                                    <span className="flex items-center gap-3">
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Processing...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-3">
                                        <Save className="w-4 h-4" />
                                        {hasArchitecture ? "Execute & Configure" : "Save Entry"}
                                    </span>
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
    );
}
