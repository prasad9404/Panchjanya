import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@/auth/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";
import { AbbreviationItem } from "@/types";
import { X, Save, Trash2, ArrowUp, ArrowDown, Plus, ChevronDown, Info, ArrowLeft } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Separator } from "@/shared/components/ui/separator";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useToast } from "@/shared/hooks/use-toast";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useAuth } from "@/auth/AuthContext";

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
    { name: "Sthan", path: "/icons/glance/sthan.svg" },
];

export default function AbbreviationsManager() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const [abbreviationItems, setAbbreviationItems] = useState<AbbreviationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const fetchAbbreviations = async () => {
            try {
                setLoading(true);
                const token = await user?.getIdToken();
                const res = await fetch("/api/admin/data?collection=settings&id=abbreviations", {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {}
                });
                const contentType = res.headers.get("content-type");

                if (res.ok && contentType?.includes("application/json")) {
                    const data = await res.json();
                    setAbbreviationItems(data.items || []);
                } else {
                    console.warn("Abbreviations API not active locally. Using Client SDK.");
                    const docRef = doc(db, "settings", "abbreviations");
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setAbbreviationItems(docSnap.data().items || []);
                    }
                }
            } catch (error) {
                console.error("Error fetching abbreviations:", error);
                toast({
                    title: "Error",
                    description: "Failed to load abbreviations",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchAbbreviations();
    }, [toast]);

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

    const saveAbbreviations = async () => {
        setSaving(true);
        try {
            const updateData = {
                items: abbreviationItems,
                updatedAt: new Date()
            };

            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/data?collection=settings&id=abbreviations", {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(updateData)
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: "Abbreviations updated successfully."
                });
            } else {
                console.warn("API save failed, using fallback.");
                await setDoc(doc(db, "settings", "abbreviations"), updateData);
                toast({ title: "Success (Fallback)", description: "Saved via Client SDK" });
            }
        } catch (error) {
            console.error("Error saving:", error);
            toast({
                title: "Error",
                description: "Failed to save abbreviations. Please check permissions.",
                variant: "destructive"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="font-[Manrope] min-h-screen bg-slate-50/50 pb-20">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-all px-0 hover:bg-transparent"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Dashboard
                    </Button>
                </div>

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-heading font-extrabold text-slate-900 tracking-tight">
                            Abbreviations Manager
                        </h1>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Global Settings - Displayed on All Temple Pages
                        </p>
                    </div>
                    <Button
                        onClick={saveAbbreviations}
                        disabled={saving}
                        className="bg-[#C9A961] hover:bg-[#b89b58] text-white font-bold rounded-xl h-12 px-6 shadow-sm shadow-amber-900/10 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <Save className="w-5 h-5 mr-2" />
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>

                {/* Abbreviations Section */}
                <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-slate-700 uppercase tracking-[0.2em]">Abbreviations List</span>
                            <div className="h-px flex-1 bg-slate-200" />
                        </div>
                        <p className="text-sm text-slate-500">
                            These abbreviations will be displayed in the Info (i) button across all temple architecture pages.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-slate-600 uppercase tracking-[0.2em]">Items</span>
                                <div className="h-px w-20 bg-slate-200" />
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={addAbbreviationItem}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-bold text-xs"
                            >
                                <Plus className="w-3 h-3 mr-1" /> Add Item
                            </Button>
                        </div>

                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100 hover:scrollbar-thumb-slate-400">
                            {abbreviationItems.map((item, idx) => (
                                <div key={item.id} className="flex items-start gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 group transition-all hover:bg-white hover:border-slate-200">
                                    <div className="flex flex-col gap-1 mt-1">
                                        <button
                                            onClick={() => moveAbbreviationItem(idx, 'up')}
                                            disabled={idx === 0}
                                            className="text-slate-300 hover:text-blue-600 disabled:opacity-0 transition-opacity"
                                        >
                                            <ArrowUp className="w-3 h-3" />
                                        </button>
                                        <button
                                            onClick={() => moveAbbreviationItem(idx, 'down')}
                                            disabled={idx === abbreviationItems.length - 1}
                                            className="text-slate-300 hover:text-blue-600 disabled:opacity-0 transition-opacity"
                                        >
                                            <ArrowDown className="w-3 h-3" />
                                        </button>
                                    </div>

                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
                                        <div className="md:col-span-1">
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between h-10 rounded-xl border-slate-200 bg-white">
                                                        <div className="flex items-center gap-2 truncate">
                                                            {item.icon ? (
                                                                <img src={item.icon} className="w-4 h-4 object-contain" alt="icon" />
                                                            ) : (
                                                                <Info className="w-4 h-4 text-blue-600" />
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
                                                <PopoverContent className="w-64 p-2">
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400">Select Icon</Label>
                                                        <div className="grid grid-cols-4 gap-1.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100">
                                                            {CUSTOM_ICONS.map(icon => (
                                                                <button
                                                                    key={icon.path}
                                                                    onClick={() => updateAbbreviationItem(item.id, 'icon', icon.path)}
                                                                    className={`p-2 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors border ${item.icon === icon.path ? 'bg-blue-100 border-blue-300' : 'border-slate-200'}`}
                                                                    title={icon.name}
                                                                >
                                                                    <img src={icon.path} className="w-6 h-6 object-contain" alt={icon.name} />
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <Separator className="my-2" />
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] font-black uppercase text-slate-400">Or Enter Custom URL</Label>
                                                        <div className="flex gap-2">
                                                            <Input
                                                                placeholder="https://..."
                                                                value={item.icon.startsWith('http') ? item.icon : ''}
                                                                onChange={(e) => updateAbbreviationItem(item.id, 'icon', e.target.value)}
                                                                className="h-8 text-xs rounded-lg"
                                                            />
                                                            {item.icon.startsWith('http') && (
                                                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateAbbreviationItem(item.id, 'icon', CUSTOM_ICONS[0].path)}>
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
                                                onChange={(e) => updateAbbreviationItem(item.id, 'description', e.target.value)}
                                                placeholder="Abbreviation description..."
                                                className="h-10 rounded-xl border-slate-200 bg-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => removeAbbreviationItem(item.id)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {abbreviationItems.length === 0 && (
                                <p className="text-sm text-center text-slate-400 italic py-8">
                                    No abbreviations added. Click "Add Item" to begin.
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
