import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Label } from "@/shared/components/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { ArrowRight, Save, MapPin, Map as MapIcon, Database } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/components/ui/select";
import { getValidSthanTypes, AVATAR_SAMBANDH_CONFIG, getAvatarColor } from "@/shared/utils/sthanTypes";
import { useSthanTypes } from "@/shared/contexts/SthanTypesContext";
import ReactSelect from "react-select";
import { cn } from "@/shared/lib/utils";

const STEPS = [
    { id: 1, title: "Primary Details", icon: Database },
    { id: 2, title: "Classification", icon: MapIcon },
    { id: 3, title: "Navigation", icon: MapPin }
];

export default function CreateSthanaWizard() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const [loading, setLoading] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    // Consume from global context – no local fetch needed
    const { sthanTypes } = useSthanTypes();

    // Step 1
    const [name, setName] = useState("");
    const [todaysNameTitle, setTodaysNameTitle] = useState("");
    const [todaysName, setTodaysName] = useState("");
    const [address, setAddress] = useState("");
    const [taluka, setTaluka] = useState("");
    const [district, setDistrict] = useState("");

    // Step 2
    const [primaryAvatar, setPrimaryAvatar] = useState("");
    const [primarySubtype, setPrimarySubtype] = useState<string[]>([]);
    const [sthanTypeId, setSthanTypeId] = useState("");
    const [sthanName, setSthanName] = useState("");
    const [pinIcon, setPinIcon] = useState("");

    // Step 3
    const [latitude, setLatitude] = useState("");
    const [longitude, setLongitude] = useState("");
    const [locationLink, setLocationLink] = useState("");



    const handleNext = () => {
        if (currentStep === 1) {
            if (!name || !district) {
                toast({ title: "Validation Error", description: "Name and District are required.", variant: "destructive" });
                return;
            }
        }
        if (currentStep === 2) {
            if (!primaryAvatar || !sthanTypeId) {
                toast({ title: "Validation Error", description: "Primary Avatar and Sthan Type are required.", variant: "destructive" });
                return;
            }
        }
        setCurrentStep((prev) => Math.min(prev + 1, 3));
    };

    const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        if (!user) return;
        setLoading(true);

        try {
            const latNum = latitude ? parseFloat(latitude) : 0;
            const lngNum = longitude ? parseFloat(longitude) : 0;

            if (latitude && isNaN(latNum)) {
                toast({ title: "Invalid Coordinates", description: "Please enter valid Latitude.", variant: "destructive" });
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
                
                primaryAvatar,
                primarySubtype,
                relatedAvatars: [],
                sthan: sthanName,
                sthanType: sthanName,
                sthanTypeId,
                
                // Legacy fields for backward compatibility
                avatarSambandh: primaryAvatar,
                avatarSubdivision: primarySubtype.length > 0 ? primarySubtype[0] : undefined,

                latitude: latNum,
                longitude: lngNum,
                location: { lat: latNum, lng: lngNum },
                locationLink,
                pinIcon,
                
                // Defaults for a new DRAFT
                status: "DRAFT",
                isVerified: false,
                isComplete: false,
                hasArchitecture: false, // Default to false, can attach later
                isStandalone: true,
                
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                createdBy: user.uid,
            };

            const token = await user.getIdToken();
            const res = await fetch(`/api/admin/data?collection=temples`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(templeData),
            });

            let newId = "";
            if (res.ok) {
                const responseData = await res.json();
                newId = responseData.id;
            } else {
                // Fallback to client SDK
                const newDoc = await addDoc(collection(db, "temples"), {
                    ...templeData,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now(),
                });
                newId = newDoc.id;
            }

            toast({ title: "Draft Created", description: "Sthana saved successfully. Redirecting to editor..." });
            // Redirect to the new unified edit route
            navigate(`/admin/temples/${newId}/edit`);

        } catch (error: any) {
            console.error("Error creating draft sthana:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create Sthana.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const primaryAvatarConfig = AVATAR_SAMBANDH_CONFIG.find(a => a.id === primaryAvatar);
    const showSubTypes = primaryAvatarConfig && primaryAvatarConfig.subdivisions.length > 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Wizard Header */}
            <div className="flex border-b border-slate-100 bg-slate-50/50">
                {STEPS.map((step) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isPast = currentStep > step.id;
                    
                    return (
                        <div key={step.id} className={cn(
                            "flex-1 flex items-center gap-3 p-4 px-6 border-b-2 transition-all",
                            isActive ? "border-amber-500 bg-white" : "border-transparent text-slate-400"
                        )}>
                            <div className={cn(
                                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                                isActive ? "bg-amber-100 text-amber-700" : isPast ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-400"
                            )}>
                                {isPast ? "✓" : step.id}
                            </div>
                            <span className={cn("font-bold hidden sm:block", isActive ? "text-slate-900" : "")}>
                                {step.title}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="p-8">
                {/* STEP 1 */}
                {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Sthan Name *</Label>
                                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Main historical name" className="h-12" />
                            </div>
                            <div className="space-y-2 flex items-end gap-2">
                                <div className="space-y-2 w-1/3">
                                    <Label>Modern Label</Label>
                                    <Input value={todaysNameTitle} onChange={e => setTodaysNameTitle(e.target.value)} placeholder="e.g. Today" className="h-12" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Modern Name</Label>
                                    <Input value={todaysName} onChange={e => setTodaysName(e.target.value)} placeholder="Contemporary name" className="h-12" />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                                <Label>Address</Label>
                                <Textarea value={address} onChange={e => setAddress(e.target.value)} placeholder="Street address..." className="min-h-[100px]" />
                            </div>
                            <div className="space-y-2">
                                <Label>Taluka</Label>
                                <Input value={taluka} onChange={e => setTaluka(e.target.value)} className="h-12" />
                            </div>
                            <div className="space-y-2">
                                <Label>District *</Label>
                                <Input value={district} onChange={e => setDistrict(e.target.value)} className="h-12" />
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6">
                            <p className="text-sm font-semibold text-amber-800">Classification locks the map pin visual and filtering logic. Ensure you have configured the types in "Manage Sthan Types" first.</p>
                        </div>
                        
                        <div className="space-y-6 max-w-2xl">
                            <div className="space-y-2">
                                <Label>Primary Avatar *</Label>
                                <Select value={primaryAvatar} onValueChange={(v) => { setPrimaryAvatar(v); setPrimarySubtype([]); }}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select Avatar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {AVATAR_SAMBANDH_CONFIG.map(av => (
                                            <SelectItem key={av.id} value={av.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: av.color }} />
                                                    {av.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {showSubTypes && (
                                <div className="space-y-2">
                                    <Label>Avatar Subdivision (Kaal)</Label>
                                    <ReactSelect
                                        isMulti
                                        options={primaryAvatarConfig.subdivisions.filter(s => s.id !== 'complete').map(s => ({ value: s.id, label: s.label }))}
                                        value={primaryAvatarConfig.subdivisions.filter(s => primarySubtype.includes(s.id)).map(s => ({ value: s.id, label: s.label }))}
                                        onChange={(selected) => setPrimarySubtype(selected ? selected.map((s: any) => s.value) : [])}
                                        classNamePrefix="react-select"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Sthan Type *</Label>
                                <Select value={sthanTypeId} onValueChange={(v) => {
                                    const typeObj = sthanTypes.find(t => t.id === v);
                                    if (typeObj) {
                                        setSthanTypeId(typeObj.id);
                                        setSthanName(typeObj.name);
                                        if (typeObj.pinType) setPinIcon(typeObj.pinType);
                                    }
                                }}>
                                    <SelectTrigger className="h-12">
                                        <SelectValue placeholder="Select Sthan Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {getValidSthanTypes(primaryAvatar, sthanTypes).map(st => (
                                            <SelectItem key={st.id} value={st.id}>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getAvatarColor(st.avatarSambandh) || st.color }} />
                                                    <span>{st.name}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Latitude</Label>
                                <Input value={latitude} onChange={e => setLatitude(e.target.value)} type="number" step="any" className="h-12" placeholder="e.g. 23.8506" />
                            </div>
                            <div className="space-y-2">
                                <Label>Longitude</Label>
                                <Input value={longitude} onChange={e => setLongitude(e.target.value)} type="number" step="any" className="h-12" placeholder="e.g. 72.1154" />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Google Maps External Link</Label>
                                <Input value={locationLink} onChange={e => setLocationLink(e.target.value)} className="h-12" placeholder="https://goo.gl/maps/..." />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <Button variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="font-bold">
                    Back
                </Button>
                
                {currentStep < 3 ? (
                    <Button onClick={handleNext} className="bg-blue-900 hover:bg-blue-800 text-white font-bold px-8 h-12 rounded-xl">
                        Continue to Step {currentStep + 1}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={loading} className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-8 h-12 rounded-xl shadow-lg shadow-emerald-900/20">
                        {loading ? "Creating..." : "Save Draft Sthana"}
                        <Save className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
}
