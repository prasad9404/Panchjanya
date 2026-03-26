import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { collection, onSnapshot, query, orderBy, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/auth/firebase";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/shared/components/ui/select";
import {
    Plus,
    Edit,
    Trash2,
    MapPin,
    Loader2,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    Save,
    X,
    Compass,
    GripVertical,
    Search,
    Edit3,
    Trash,
    ChevronDown,
    Link,
    Map,
    Image as ImageIcon
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { ImageUpload } from "@/shared/components/admin/ImageUpload";
import { YatraPlace } from "@/types";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { cn } from "@/shared/lib/utils";

// Fix for default marker icons in Leaflet with React
// @ts-ignore - access private property
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ROUTES = [
    {
        id: "swami-complete",
        name: "Shri Chakradhar Swami's complete journey",
        subRoutes: [
            { id: "ekant", name: "Ekant" },
            { id: "purvardh", name: "Purvardh" },
            { id: "uttarardh", name: "Uttarardh" }
        ]
    },
    { id: "dattatray", name: "Shri Dattatray Prabhu Viharan" },
    { id: "govind", name: "Shri Govind Prabhu Viharan" },
    { id: "chakrapani", name: "Shri Chakrapani Prabhu Viharan" },
    { id: "krishna", name: "Shri Krishan Bhagwan Viharan" }
];

function LocationPicker({ lat, lng, onSelect }: { lat?: number, lng?: number, onSelect: (lat: number, lng: number) => void }) {
    function MapEvents() {
        useMapEvents({
            click(e) {
                onSelect(e.latlng.lat, e.latlng.lng);
            },
        });
        return null;
    }

    const center: [number, number] = lat && lng ? [lat, lng] : [19.1602, 77.3150]; // Default to Nanded area

    return (
        <MapContainer
            center={center}
            zoom={lat && lng ? 13 : 6}
            style={{ height: "300px", width: "100%", borderRadius: "12px", border: "1px solid #e2e8f0" }}
        >
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <MapEvents />
            {lat && lng && <Marker position={[lat, lng]} />}
        </MapContainer>
    );
}

export default function RajViharanAdmin() {
    const navigate = useNavigate();
    const [places, setPlaces] = useState<YatraPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPlace, setSelectedPlace] = useState<YatraPlace | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSequenceExpanded, setIsSequenceExpanded] = useState(true);
    const { toast } = useToast();
    const { user } = useAuth();

    // Form state
    const [formData, setFormData] = useState<Partial<YatraPlace & { pinColor: string }>>({
        name: "",
        description: "",
        latitude: 0,
        longitude: 0,
        sequence: 1,
        status: "upcoming",
        route: "swami-complete",
        subRoute: "",
        image: "",
        locationLink: "",
        pinColor: "#D4AF37" // Default regal gold
    });

    const fetchPlaces = async () => {
        try {
            setLoading(true);
            const token = await user?.getIdToken();
            const res = await fetch("/api/admin/data?collection=yatraPlaces", {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            const contentType = res.headers.get("content-type");

            if (res.ok && contentType?.includes("application/json")) {
                const data = await res.json();
                // Sort by sequence manually since API might not guarantee order
                setPlaces(data.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0)));
            } else {
                // Fallback to client SDK
                console.warn("Yatra API not active locally. Using Client SDK.");
                const q = query(collection(db, "yatraPlaces"), orderBy("sequence", "asc"));
                const snapshot = await getDocs(q);
                setPlaces(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as YatraPlace[]);
            }
        } catch (error) {
            console.error("Error fetching yatra places:", error);
            toast({ title: "Error", description: "Failed to fetch yatra places", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPlaces();
    }, []);

    const handleEdit = (place: YatraPlace) => {
        setSelectedPlace(place);
        setFormData({
            ...place,
            // Ensure fields are never undefined for controlled inputs
            name: place.name || "",
            description: place.description || "",
            locationLink: place.locationLink || "",
            subRoute: place.subRoute || "",
            image: place.image || "",
            pinColor: (place as any).pinColor || "#D4AF37",
            status: place.status || "upcoming",
            route: place.route || "swami-complete"
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleAddNew = () => {
        setSelectedPlace(null);
        setFormData({
            name: "",
            description: "",
            latitude: 19.8647, // Default coordinates
            longitude: 75.7714,
            sequence: places.length > 0 ? Math.max(...places.map(p => p.sequence)) + 1 : 1,
            status: "upcoming",
            route: "swami-complete",
            subRoute: "",
            image: "",
            locationLink: "",
            pinColor: "#D4AF37"
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancel = () => {
        setIsEditing(false);
        setSelectedPlace(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.latitude || !formData.longitude) {
            toast({
                title: "Error",
                description: "Please fill in all required fields (Name, Latitude, Longitude)",
                variant: "destructive"
            });
            return;
        }

        try {
            const method = selectedPlace ? 'PUT' : 'POST';
            const url = selectedPlace ? `/api/admin/data?collection=yatraPlaces&id=${selectedPlace.id}` : `/api/admin/data?collection=yatraPlaces`;

            const token = await user?.getIdToken();
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                toast({ title: "Success", description: selectedPlace ? "Yatra place updated" : "Yatra place created" });
            } else {
                console.warn("API write failed, using fallback.");
                if (selectedPlace) {
                    await updateDoc(doc(db, "yatraPlaces", selectedPlace.id), formData);
                } else {
                    await addDoc(collection(db, "yatraPlaces"), formData);
                }
                toast({ title: "Success (Fallback)", description: "Saved via Client SDK" });
            }

            setIsEditing(false);
            setSelectedPlace(null);
            fetchPlaces(); // Refresh list
        } catch (error) {
            console.error("Error saving yatra place:", error);
            toast({
                title: "Error",
                description: "Failed to save yatra place. Please check permissions.",
                variant: "destructive"
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this yatra place?")) return;

        try {
            const token = await user?.getIdToken();
            const res = await fetch(`/api/admin/data?collection=yatraPlaces&id=${id}`, {
                method: 'DELETE',
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            if (res.ok) {
                toast({ title: "Success", description: "Yatra place deleted" });
            } else {
                console.warn("API delete failed, using fallback.");
                await deleteDoc(doc(db, "yatraPlaces", id));
                toast({ title: "Success (Fallback)", description: "Deleted via Client SDK" });
            }

            if (selectedPlace?.id === id) {
                setIsEditing(false);
                setSelectedPlace(null);
            }
            fetchPlaces(); // Refresh
        } catch (error) {
            console.error("Error deleting yatra place:", error);
            toast({
                title: "Error",
                description: "Failed to delete yatra place",
                variant: "destructive"
            });
        }
    };

    const movePlace = async (index: number, direction: 'up' | 'down') => {
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= places.length) return;

        const currentPlace = places[index];
        const targetPlace = places[targetIndex];

        try {
            const token = await user?.getIdToken();
            // Swap sequences via API
            await fetch(`/api/admin/data?collection=yatraPlaces&id=${currentPlace.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ sequence: targetPlace.sequence })
            });
            await fetch(`/api/admin/data?collection=yatraPlaces&id=${targetPlace.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ sequence: currentPlace.sequence })
            });

            toast({ title: "Reordered", description: "Sequence updated successfully" });
            fetchPlaces(); // Refresh
        } catch (error) {
            console.error("Error reordering:", error);
            toast({ title: "Error", description: "Failed to reorder items" });
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const reorderedPlaces = Array.from(places);
        const [movedPlace] = reorderedPlaces.splice(sourceIndex, 1);
        reorderedPlaces.splice(destinationIndex, 0, movedPlace);

        // Optimistically update local state
        setPlaces(reorderedPlaces);

        try {
            const token = await user?.getIdToken();
            // Update sequences via API
            const updates = reorderedPlaces.map((place, index) => {
                const newSequence = index + 1;
                if (place.sequence !== newSequence) {
                    return fetch(`/api/admin/data?collection=yatraPlaces&id=${place.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { "Authorization": `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ sequence: newSequence })
                    });
                }
                return null;
            }).filter(Boolean);

            await Promise.all(updates);
            toast({ title: "Reordered", description: "New sequence persisted successfully" });
        } catch (error) {
            console.error("Error persisting reorder:", error);
            toast({
                title: "Error",
                description: "Failed to persist new sequence",
                variant: "destructive"
            });
            fetchPlaces(); // Revert to server state
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 pb-20">
                {/* Back Button */}
                <div className="mb-6">
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/admin/dashboard")}
                        className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-all px-0 hover:bg-transparent"
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
                            <ArrowLeft className="w-4 h-4" />
                        </div>
                        Back to Dashboard
                    </Button>
                </div>

                {/* Content Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-all duration-300">
                    <div className="space-y-1">
                        <h1 className="text-2xl md:text-3xl font-heading font-bold text-[#0F172A] flex items-center gap-3">
                            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                <MapPin className="w-8 h-8" />
                            </span>
                            {isEditing ? (selectedPlace ? "Edit Viharan Place" : "New Viharan Place") : "Raj Viharan Management"}
                        </h1>
                        <p className="text-slate-500 font-medium pl-14">
                            {isEditing
                                ? "Configure the details and spiritual journey checkpoints."
                                : "Design and manage the sacred pilgrimage routes and sequences."}
                        </p>
                    </div>
                    {!isEditing && (
                        <div className="flex gap-3">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                                <Input className="pl-9 w-64 rounded-full border-slate-200 focus:ring-blue-500 shadow-sm" placeholder="Search routes..." />
                            </div>
                            <Button onClick={handleAddNew} className="bg-[#D4AF37] hover:bg-[#B8962D] text-white rounded-full font-bold px-6 shadow-md hover:shadow-lg transition-all duration-300">
                                <Plus className="w-5 h-5 mr-2" /> CREATE NEW ROUTE
                            </Button>
                        </div>
                    )}
                    {isEditing && (
                        <Button variant="outline" onClick={handleCancel} className="md:w-auto font-bold border-slate-200 hover:bg-slate-50 transition-all rounded-full px-6">
                            <X className="w-4 h-4 mr-2" /> EXIT EDITOR
                        </Button>
                    )}
                </div>

                {isEditing ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        {/* Editor Card */}
                        <Card className="border-slate-200 lg:sticky lg:top-8 h-fit shadow-md">
                            <CardHeader className="bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
                                <CardTitle className="text-lg font-bold text-slate-900">
                                    {selectedPlace ? "Edit Place Details" : "New Yatra Place"}
                                </CardTitle>
                                <Button variant="ghost" size="icon" onClick={handleCancel} className="rounded-full">
                                    <X className="w-5 h-5" />
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Place Name *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Enter place name..."
                                            required
                                            className="h-11 shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="description">Description (History/Significance)</Label>
                                        <Textarea
                                            id="description"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="Describe the historical or spiritual significance..."
                                            rows={4}
                                            className="resize-none shadow-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="locationLink" className="flex items-center gap-2">
                                            <Link className="w-4 h-4 text-blue-600" /> Google Maps Link
                                        </Label>
                                        <Input
                                            id="locationLink"
                                            value={formData.locationLink}
                                            onChange={e => setFormData({ ...formData, locationLink: e.target.value })}
                                            placeholder="Paste Google Maps URL here..."
                                            className="h-11 shadow-sm"
                                        />
                                        <p className="text-[10px] text-slate-400">Publicly accessible link to the location.</p>
                                    </div>

                                    <div className="space-y-4">
                                        <Label className="flex items-center gap-2">
                                            <Map className="w-4 h-4 text-blue-600" /> Internal Map Coordinates (Required)
                                        </Label>
                                        <LocationPicker
                                            lat={formData.latitude}
                                            lng={formData.longitude}
                                            onSelect={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Latitude</Label>
                                                <Input
                                                    type="number" step="any"
                                                    className="h-11 shadow-sm"
                                                    value={formData.latitude}
                                                    onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Longitude</Label>
                                                <Input
                                                    type="number" step="any"
                                                    className="h-11 shadow-sm"
                                                    value={formData.longitude}
                                                    onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Route</Label>
                                            <Select
                                                value={formData.route}
                                                onValueChange={v => setFormData({ ...formData, route: v, subRoute: "" })}
                                            >
                                                <SelectTrigger className="h-11 shadow-sm">
                                                    <SelectValue placeholder="Select Route" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {ROUTES.map(r => (
                                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label>Sub-Route</Label>
                                            <Select
                                                value={formData.subRoute || "none"}
                                                onValueChange={v => setFormData({ ...formData, subRoute: v === "none" ? "" : v })}
                                                disabled={formData.route !== 'swami-complete'}
                                            >
                                                <SelectTrigger className="h-11 shadow-sm">
                                                    <SelectValue placeholder="Select Sub-Route" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    {ROUTES.find(r => r.id === 'swami-complete')?.subRoutes?.map(sr => (
                                                        <SelectItem key={sr.id} value={sr.id}>{sr.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={v => setFormData({ ...formData, status: v as any })}
                                        >
                                            <SelectTrigger className="h-11 shadow-sm">
                                                <SelectValue placeholder="Select Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="visited">Visited</SelectItem>
                                                <SelectItem value="stayed">Stayed</SelectItem>
                                                <SelectItem value="revisited">Re-visited</SelectItem>
                                                <SelectItem value="current">Current Location</SelectItem>
                                                <SelectItem value="upcoming">Upcoming</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-4 pt-4 mt-2 border-t border-slate-100">
                                        <div className="flex items-center justify-between">
                                            <Label className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: formData.pinColor || '#D4AF37' }} />
                                                Map Pin Color
                                            </Label>
                                            <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                                                {formData.pinColor}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            {['#D4AF37', '#0038A8', '#E11D48', '#16A34A', '#7C3AED', '#EA580C'].map(color => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, pinColor: color })}
                                                    className={`w-9 h-9 rounded-full border-2 transition-all ${formData.pinColor === color ? 'border-blue-600 scale-110 shadow-lg z-10' : 'border-transparent hover:scale-105'}`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                            <div className="relative w-9 h-9 rounded-full border-2 border-slate-200 overflow-hidden hover:border-blue-400 transition-colors">
                                                <Input
                                                    type="color"
                                                    value={formData.pinColor || '#D4AF37'}
                                                    onChange={e => setFormData({ ...formData, pinColor: e.target.value })}
                                                    className="absolute inset-[-10px] w-[200%] h-[200%] p-0 border-none bg-transparent cursor-pointer"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-3 pt-6 border-t border-slate-100">
                                        <Button type="submit" className="flex-1 h-12 bg-blue-900 hover:bg-blue-800 shadow-md font-bold text-base">
                                            <Save className="w-5 h-5 mr-2" /> {selectedPlace ? "Update Place" : "Save New Place"}
                                        </Button>
                                        <Button type="button" variant="outline" onClick={handleCancel} className="h-12 border-slate-200 font-bold px-8">
                                            Cancel
                                        </Button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Media Card */}
                        <div className="space-y-8">
                            <Card className="border-slate-200 shadow-md overflow-hidden">
                                <CardHeader className="bg-slate-50 border-b border-slate-100">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                        <CardTitle className="text-lg font-bold text-slate-900">Place Image</CardTitle>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <ImageUpload
                                        folderPath={`yatra/${formData.id || 'new'}`}
                                        onUpload={(url) => setFormData({ ...formData, image: url })}
                                        label="Upload Image"
                                        fitMode={formData.fitMode || 'cover'}
                                        onFitModeChange={(mode) => setFormData({ ...formData, fitMode: mode })}
                                    />
                                    {formData.image && (
                                        <div className="mt-6 rounded-2xl overflow-hidden border border-slate-200 relative group shadow-lg bg-slate-50 flex items-center justify-center">
                                            <img 
                                                src={formData.image} 
                                                alt="Preview" 
                                                className={cn(
                                                    "w-full h-56 transition-all duration-300",
                                                    formData.fitMode === 'contain' ? "object-contain" : "object-cover"
                                                )} 
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => setFormData({ ...formData, image: "" })}
                                                    className="rounded-full animate-in zoom-in-50"
                                                >
                                                    Remove Image
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 animate-in fade-in duration-700">
                        {loading ? (
                            <div className="flex items-center justify-center p-20">
                                <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                            </div>
                        ) : (
                            <div className="max-w-full mx-auto space-y-6">
                                {/* Route List & Timeline */}
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                            Active Pilgrimage Routes
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full uppercase tracking-widest font-bold">{places.length} Total</span>
                                        </h2>
                                    </div>

                                    {/* Major Route Card (e.g., Mahanubhav Darshan Path) */}
                                    <Card className="rounded-3xl shadow-lg border-2 border-[#D4AF37]/30 overflow-hidden bg-white">
                                        <div
                                            className="p-3 border-b border-slate-100 bg-[#0038A8]/5 flex items-center justify-between cursor-pointer hover:bg-[#0038A8]/10 transition-colors"
                                            onClick={() => setIsSequenceExpanded(!isSequenceExpanded)}
                                        >
                                            <div>
                                                <h3 className="text-base font-bold text-[#0038A8]">Swami's Complete Journey</h3>
                                                <p className="text-[10px] text-slate-500 font-medium">Managing Sequence for {places.length} Places</p>
                                            </div>
                                            <Button variant="ghost" size="icon" className={`rounded-full text-slate-400 transition-transform duration-300 ${isSequenceExpanded ? 'rotate-180' : ''}`}>
                                                <ChevronDown className="w-4 h-4" />
                                            </Button>
                                        </div>

                                        {isSequenceExpanded && (
                                            <div className="p-3 md:p-4 relative">
                                                {/* Timeline Line */}
                                                <div className="absolute left-[35px] md:left-[39px] top-10 bottom-10 w-0.5 bg-slate-100 z-0" />

                                                <DragDropContext onDragEnd={handleDragEnd}>
                                                    <Droppable droppableId="yatra-places">
                                                        {(provided) => (
                                                            <div
                                                                {...provided.droppableProps}
                                                                ref={provided.innerRef}
                                                                className="space-y-3 relative z-10"
                                                            >
                                                                {places.map((place, index) => (
                                                                    <Draggable key={place.id} draggableId={place.id} index={index}>
                                                                        {(provided, snapshot) => (
                                                                            <div
                                                                                ref={provided.innerRef}
                                                                                {...provided.draggableProps}
                                                                                className={`flex items-start gap-3 md:gap-4 group ${snapshot.isDragging ? 'opacity-70 scale-[1.02] rotate-1 transition-transform' : ''}`}
                                                                            >
                                                                                {/* Step Dot & Pin Color */}
                                                                                <div
                                                                                    className="w-8 h-8 rounded-full border-4 border-white shadow-md ring-1 flex-shrink-0 z-10 mt-2 transition-transform group-hover:scale-110 flex items-center justify-center text-[10px] font-bold text-white relative"
                                                                                    style={{
                                                                                        backgroundColor: (place as any).pinColor || '#D4AF37',
                                                                                        boxShadow: `0 0 0 1px ${(place as any).pinColor || '#D4AF37'}`
                                                                                    }}
                                                                                >
                                                                                    <span className="absolute -top-1 -right-1 bg-slate-800 text-white w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                                                                                        {index + 1}
                                                                                    </span>
                                                                                </div>

                                                                                <div className="flex-1 bg-slate-50 p-2 md:p-3 rounded-2xl border border-slate-100 flex items-center justify-between gap-2 md:gap-3 transition-all hover:bg-white hover:shadow-md hover:border-blue-200">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div {...provided.dragHandleProps} className="p-1 hover:bg-slate-100 rounded-lg cursor-grab active:cursor-grabbing transition-colors">
                                                                                            <GripVertical className="w-4 h-4 text-slate-300 group-hover:text-blue-400" />
                                                                                        </div>
                                                                                        <div className="w-16 h-12 rounded-xl bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                                                                                            {place.image ? (
                                                                                                <img src={place.image} alt={place.name} className="w-full h-full object-cover" />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300">
                                                                                                    <MapPin className="w-5 h-5 opacity-30" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div>
                                                                                            <div className="flex items-center gap-2">
                                                                                                <p className="text-sm font-bold text-slate-900">{place.name}</p>
                                                                                            </div>
                                                                                            <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-tighter">
                                                                                                {place.status}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>

                                                                                    <div className="flex items-center gap-1.5 md:gap-2">
                                                                                        <div className="flex flex-col gap-0.5">
                                                                                            <Button
                                                                                                variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                                                                onClick={() => movePlace(index, 'up')}
                                                                                                disabled={index === 0}
                                                                                            >
                                                                                                <ArrowUp className="w-3 h-3" />
                                                                                            </Button>
                                                                                            <Button
                                                                                                variant="ghost" size="icon" className="h-6 w-6 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                                                                                onClick={() => movePlace(index, 'down')}
                                                                                                disabled={index === places.length - 1}
                                                                                            >
                                                                                                <ArrowDown className="w-3 h-3" />
                                                                                            </Button>
                                                                                        </div>
                                                                                        <div className="h-8 w-px bg-slate-100 mx-1" />
                                                                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(place)} className="w-8 h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors">
                                                                                            <Edit3 className="w-4 h-4" />
                                                                                        </Button>
                                                                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(place.id)} className="w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                                                                                            <Trash className="w-4 h-4" />
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </Draggable>
                                                                ))}
                                                                {provided.placeholder}

                                                                {/* Add Placeholder at end */}
                                                                <div className="flex items-start gap-4 md:gap-6 pt-1 group cursor-pointer" onClick={handleAddNew}>
                                                                    <div className="w-8 h-8 rounded-full bg-white border-2 border-dashed border-slate-300 flex-shrink-0 flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-colors">
                                                                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-blue-500" />
                                                                    </div>
                                                                    <div className="flex-1 bg-white border-2 border-dashed border-slate-200 p-2 md:p-3 rounded-2xl flex items-center gap-3 text-slate-400 font-medium group-hover:border-blue-200 group-hover:text-blue-500 transition-colors" style={{ marginLeft: '12px' }}>
                                                                        <Search className="w-4 h-4 flex-shrink-0" />
                                                                        <span className="text-[13px]">Add new pilgrimage point to the sequence...</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Droppable>
                                                </DragDropContext>
                                            </div>
                                        )}

                                        <div className="p-3 md:p-4 bg-slate-50 border-t border-slate-100 flex gap-2 md:gap-3">
                                            <Button className="flex-1 bg-[#0038A8] hover:bg-[#002B82] text-white py-3 md:py-4 rounded-xl text-xs md:text-sm font-bold shadow-lg shadow-blue-900/10 transition-all hover:-translate-y-0.5">
                                                SAVE SEQUENCE CHANGES
                                            </Button>
                                            <Button variant="outline" className="px-3 md:px-6 py-3 md:py-4 rounded-xl border-slate-200 font-bold text-slate-500 bg-white hover:bg-slate-50 text-xs md:text-sm">
                                                CANCEL
                                            </Button>
                                        </div>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
