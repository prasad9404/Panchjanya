import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "@/auth/firebase";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/shared/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/shared/components/ui/dialog";
import { Plus, Edit, Trash2, MapPin, Loader2, ArrowUp, ArrowDown, ArrowLeft } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";

interface YatraPlace {
    id?: string;
    name: string;
    nameEn: string;
    description: string;
    latitude: number;
    longitude: number;
    mapLink: string;
    sequence: number;
    status: "visited" | "stayed" | "revisited";
}

export default function ManageYatra() {
    const [places, setPlaces] = useState<YatraPlace[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlace, setEditingPlace] = useState<YatraPlace | null>(null);
    const { toast } = useToast();
    const { user } = useAuth();
    const navigate = useNavigate();

    // Form state
    const [formData, setFormData] = useState<YatraPlace>({
        name: "",
        nameEn: "",
        description: "",
        latitude: 0,
        longitude: 0,
        mapLink: "",
        sequence: 1,
        status: "visited"
    });

    useEffect(() => {
        fetchPlaces();
    }, []);

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
                setPlaces(data.sort((a: any, b: any) => (a.sequence || 0) - (b.sequence || 0)));
            } else {
                console.warn("Yatra API not active locally. Using Client SDK.");
                const q = query(collection(db, "yatraPlaces"), orderBy("sequence", "asc"));
                const snapshot = await getDocs(q);
                const data = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as YatraPlace[];
                setPlaces(data);
            }
        } catch (error) {
            console.error("Error fetching yatra places:", error);
            toast({
                title: "Error",
                description: "Failed to fetch yatra places",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const method = editingPlace?.id ? 'PUT' : 'POST';
            const url = editingPlace?.id
                ? `/api/admin/data?collection=yatraPlaces&id=${editingPlace.id}`
                : `/api/admin/data?collection=yatraPlaces`;

            const { id, ...data } = formData as any;

            const token = await user?.getIdToken();
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                toast({
                    title: "Success",
                    description: editingPlace?.id ? "Yatra place updated successfully" : "Yatra place added successfully"
                });
            } else {
                console.warn("API write failed, using fallback.");
                if (editingPlace?.id) {
                    await updateDoc(doc(db, "yatraPlaces", editingPlace.id), data);
                } else {
                    await addDoc(collection(db, "yatraPlaces"), data);
                }
                toast({ title: "Success (Fallback)", description: "Saved via Client SDK" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchPlaces();
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
                toast({
                    title: "Success",
                    description: "Yatra place deleted successfully"
                });
            } else {
                console.warn("API delete failed, using fallback.");
                await deleteDoc(doc(db, "yatraPlaces", id));
                toast({ title: "Success (Fallback)", description: "Deleted via Client SDK" });
            }
            fetchPlaces();
        } catch (error) {
            console.error("Error deleting yatra place:", error);
            toast({
                title: "Error",
                description: "Failed to delete yatra place",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (place: YatraPlace) => {
        setEditingPlace(place);
        setFormData(place);
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setEditingPlace(null);
        setFormData({
            name: "",
            nameEn: "",
            description: "",
            latitude: 0,
            longitude: 0,
            mapLink: "",
            sequence: places.length + 1,
            status: "visited"
        });
    };

    const moveSequence = async (place: YatraPlace, direction: "up" | "down") => {
        const currentIndex = places.findIndex(p => p.id === place.id);
        const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= places.length) return;

        const targetPlace = places[targetIndex];

        try {
            const token = await user?.getIdToken();
            // Swap sequences via API
            await fetch(`/api/admin/data?collection=yatraPlaces&id=${place.id!}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ sequence: targetPlace.sequence })
            });
            await fetch(`/api/admin/data?collection=yatraPlaces&id=${targetPlace.id!}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { "Authorization": `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ sequence: place.sequence })
            });

            toast({
                title: "Success",
                description: "Sequence updated successfully"
            });
            fetchPlaces();
        } catch (error) {
            console.error("Error updating sequence:", error);
            toast({
                title: "Error",
                description: "Failed to update sequence",
                variant: "destructive"
            });
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
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

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Manage Swami's Yatra</h1>
                        <p className="text-muted-foreground mt-1">
                            Add and manage places in the historical journey
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={(open) => {
                        setIsDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Add Place
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editingPlace ? "Edit" : "Add"} Yatra Place</DialogTitle>
                                <DialogDescription>
                                    {editingPlace ? "Update" : "Add a new"} place in Swami's Yatra journey
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Name (Devanagari) *</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="भावेश्वर"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="nameEn">Name (English) *</Label>
                                        <Input
                                            id="nameEn"
                                            value={formData.nameEn}
                                            onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                                            placeholder="Bhaveshwar"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Description *</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="यात्रा का प्रारंभ स्थान"
                                        rows={3}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="latitude">Latitude *</Label>
                                        <Input
                                            id="latitude"
                                            type="number"
                                            step="any"
                                            value={formData.latitude}
                                            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                            placeholder="19.8647"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="longitude">Longitude *</Label>
                                        <Input
                                            id="longitude"
                                            type="number"
                                            step="any"
                                            value={formData.longitude}
                                            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                            placeholder="75.7714"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mapLink">Google Maps Link *</Label>
                                    <Input
                                        id="mapLink"
                                        value={formData.mapLink}
                                        onChange={(e) => setFormData({ ...formData, mapLink: e.target.value })}
                                        placeholder="https://maps.app.goo.gl/..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sequence">Sequence Number *</Label>
                                        <Input
                                            id="sequence"
                                            type="number"
                                            value={formData.sequence}
                                            onChange={(e) => setFormData({ ...formData, sequence: parseInt(e.target.value) })}
                                            min="1"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Status *</Label>
                                        <select
                                            id="status"
                                            value={formData.status}
                                            onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            required
                                        >
                                            <option value="visited">Visited</option>
                                            <option value="stayed">Stayed</option>
                                            <option value="revisited">Re-visited</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit">
                                        {editingPlace ? "Update" : "Add"} Place
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5" />
                            Yatra Places ({places.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : places.length === 0 ? (
                            <div className="text-center py-12 text-muted-foreground">
                                <MapPin className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                <p>No yatra places added yet</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-16">Seq</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>English Name</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Coordinates</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {places.map((place, index) => (
                                        <TableRow key={place.id}>
                                            <TableCell className="font-bold">{place.sequence}</TableCell>
                                            <TableCell className="font-medium">{place.name}</TableCell>
                                            <TableCell>{place.nameEn}</TableCell>
                                            <TableCell className="max-w-xs truncate">{place.description}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {place.latitude.toFixed(4)}, {place.longitude.toFixed(4)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${place.status === "visited" ? "bg-secondary/20 text-secondary" :
                                                    place.status === "stayed" ? "bg-primary/20 text-primary" :
                                                        "bg-muted text-muted-foreground"
                                                    }`}>
                                                    {place.status}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => moveSequence(place, "up")}
                                                        disabled={index === 0}
                                                    >
                                                        <ArrowUp className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => moveSequence(place, "down")}
                                                        disabled={index === places.length - 1}
                                                    >
                                                        <ArrowDown className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleEdit(place)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleDelete(place.id!)}
                                                    >
                                                        <Trash2 className="w-4 h-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
