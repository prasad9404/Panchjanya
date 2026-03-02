import React, { useState, useEffect } from "react";
import { collection, onSnapshot, deleteDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/auth/firebase";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
    Search,
    Plus,
    MapPin,
    Calendar,
    Eye,
    Edit,
    Trash2,
    ChevronDown,
    Filter,
    MoreVertical,
    Info,
    ArrowLeft
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { Badge } from "@/shared/components/ui/badge";
import { SthanTypeManager } from "@/shared/components/admin/SthanTypeManager";
import { getSthanTypes } from "@/shared/utils/sthanTypes";
import { SthanType } from "@/shared/types/sthanType";

export default function SthanaDirectory() {
    const [temples, setTemples] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [selectedDistrict, setSelectedDistrict] = useState<string>("District");
    const [selectedTaluka, setSelectedTaluka] = useState<string>("Taluka");
    const [selectedSthan, setSelectedSthan] = useState<string>("Sthan Type");
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);

    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    // 1. Data Fetching
    const fetchTemples = async () => {
        try {
            setLoading(true);
            const token = await user?.getIdToken();
            const response = await fetch("/api/admin/data?collection=temples", {
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            const contentType = response.headers.get("content-type");

            let data;
            if (response.ok && contentType?.includes("application/json")) {
                data = await response.json();
            } else {
                // Fallback for local development
                console.warn("Directory API not active locally. Using Client SDK.");
                const { collection, getDocs } = await import("firebase/firestore");
                const snapshot = await getDocs(collection(db, "temples"));
                data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            }

            // Format and Sort
            const formatted = data.map((t: any) => ({
                ...t,
                createdAtDate: t.createdAt ? (t.createdAt._seconds ? new Date(t.createdAt._seconds * 1000) : new Date(t.createdAt.seconds * 1000)) : new Date()
            })).sort((a: any, b: any) => b.createdAtDate.getTime() - a.createdAtDate.getTime());

            setTemples(formatted);
        } catch (error) {
            console.error("Error fetching temples:", error);
            toast({
                title: "Error",
                description: "Failed to sync directory data.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemples();
        loadSthanTypes();
    }, []);

    const loadSthanTypes = async () => {
        const types = await getSthanTypes();
        setSthanTypes(types);
    };

    // 2. Delete Handler
    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete '${name}'? This action cannot be undone.`)) return;

        try {
            const token = await user?.getIdToken();
            const response = await fetch(`/api/admin/data?collection=temples&id=${id}`, {
                method: 'DELETE',
                headers: token ? { "Authorization": `Bearer ${token}` } : {}
            });
            const contentType = response.headers.get("content-type");

            if (response.ok) {
                toast({ title: "Deleted", description: "Sthana record removed successfully." });
                fetchTemples();
            } else {
                // Fallback for local development
                console.warn("API delete failed, using fallback.");
                const { doc, deleteDoc } = await import("firebase/firestore");
                await deleteDoc(doc(db, "temples", id));
                toast({ title: "Deleted", description: "Sthana removed (via Client SDK fallback)." });
                fetchTemples();
            }
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete item.", variant: "destructive" });
        }
    };

    // 3. Derived Filter Lists
    const districts = Array.from(new Set(temples.map(t => t.district).filter(Boolean)));
    const talukas = Array.from(new Set(temples.map(t => t.taluka).filter(Boolean)));

    // 4. Filter Logic
    const filteredTemples = temples.filter((t) => {
        const matchesSearch =
            (t.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.id || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDistrict = selectedDistrict === "District" || t.district === selectedDistrict;
        const matchesTaluka = selectedTaluka === "Taluka" || t.taluka === selectedTaluka;
        const matchesSthan = selectedSthan === "Sthan Type" || t.sthan === selectedSthan;
        // const matchesStatus = ... (Implement when status field exists)

        return matchesSearch && matchesDistrict && matchesTaluka && matchesSthan;
    });

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AdminLayout>
            <div className="font-sans min-h-screen bg-[#F9F6F0] -m-6 p-6 pb-20">
                <div className="max-w-7xl mx-auto">
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

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-serif font-bold text-slate-900 tracking-tight">
                                Sthana Directory
                            </h1>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                Heritage Management
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                onClick={() => navigate("/admin/abbreviations")}
                                variant="outline"
                                className="bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-12 px-6 border-2 border-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Info className="w-5 h-5 mr-2" />
                                Manage Abbreviations
                            </Button>
                            <SthanTypeManager />
                            <Button
                                onClick={() => navigate("/admin/temples/add")}
                                className="bg-[#C9A961] hover:bg-[#b89b58] text-white font-bold rounded-xl h-12 px-6 shadow-sm shadow-amber-900/10 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                                Add New Sthana
                            </Button>
                        </div>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search Sthanas by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 bg-slate-50 border-none rounded-xl focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/20 text-base"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                            {/* District Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[120px] justify-between">
                                        {selectedDistrict}
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                                    <DropdownMenuItem onClick={() => setSelectedDistrict("District")} className="font-bold cursor-pointer">
                                        All Districts
                                    </DropdownMenuItem>
                                    {districts.map(d => (
                                        <DropdownMenuItem key={d} onClick={() => setSelectedDistrict(d)} className="cursor-pointer">
                                            {d}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Taluka Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[120px] justify-between">
                                        {selectedTaluka}
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[200px] max-h-[300px] overflow-y-auto">
                                    <DropdownMenuItem onClick={() => setSelectedTaluka("Taluka")} className="font-bold cursor-pointer">
                                        All Talukas
                                    </DropdownMenuItem>
                                    {talukas.map(t => (
                                        <DropdownMenuItem key={t} onClick={() => setSelectedTaluka(t)} className="cursor-pointer">
                                            {t}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>


                            {/* Sthan Type Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[120px] justify-between">
                                        {selectedSthan}
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setSelectedSthan("Sthan Type")} className="font-bold cursor-pointer">All Types</DropdownMenuItem>
                                    {sthanTypes.map(st => (
                                        <DropdownMenuItem key={st.id} onClick={() => setSelectedSthan(st.name)} className="cursor-pointer">
                                            <div className="w-3 h-3 rounded mr-2" style={{ backgroundColor: st.color }} />
                                            {st.name}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Directory List */}
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-20 text-slate-400">Loading directory...</div>
                        ) : filteredTemples.length === 0 ? (
                            <div className="text-center py-20">
                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-300">
                                    <Search className="w-8 h-8" />
                                </div>
                                <p className="text-slate-500 font-medium">No sthanas found matching.</p>
                            </div>
                        ) : (
                            filteredTemples.map((temple) => (
                                <div
                                    key={temple.id}
                                    className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6"
                                >
                                    {/* Thumbnail */}
                                    <div className="w-full sm:w-24 h-48 sm:h-24 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100">
                                        <img
                                            src={temple.images?.[0] || "/placeholder-temple.jpg"}
                                            alt={temple.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23cbd5e1"><rect width="100%" height="100%" fill="%23f1f5f9"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                                            }}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <h3 className="text-lg font-heading font-extrabold text-[#1E3A8A] truncate pr-4">
                                                {temple.name}
                                            </h3>
                                            {/* Verified Badge (Mock) */}
                                            <div className="shrink-0">
                                                {Math.random() > 0.3 ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#C9A961]/10 text-[#a88b48] border border-[#C9A961]/20 uppercase tracking-wide">
                                                        Verified
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                        Pending
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-3">
                                            <MapPin className="w-3.5 h-3.5 text-[#C9A961]" />
                                            <span className="truncate">
                                                {temple.city ? `${temple.city}, ` : ''}{temple.district}
                                            </span>
                                        </div>

                                        {/* Sthan Type Badge */}
                                        {temple.sthan && (
                                            <div className="mb-2">
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                                                    style={{
                                                        backgroundColor: temple.sthan === 'Avasthan' ? '#D4AF37' :
                                                            temple.sthan === 'Asan' ? '#0E3C6F' :
                                                                temple.sthan === 'Vasti' ? '#228B22' :
                                                                    temple.sthan === 'Mandalik' ? '#6A0DAD' : '#94a3b8',
                                                        color: 'white'
                                                    }}
                                                >
                                                    {temple.sthan}
                                                </span>
                                            </div>
                                        )}

                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Added: {formatDate(temple.createdAtDate)}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex sm:flex-col md:flex-row items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-1 sm:flex-none h-10 w-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                            onClick={() => window.open(`/temple/${temple.id}/architecture`, '_blank')}
                                            title="View Public Page"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-1 sm:flex-none h-10 w-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                                            onClick={() => navigate(`/admin/architecture/${temple.id}`)}
                                            title="Edit Sthana"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-1 sm:flex-none h-10 w-10 rounded-xl bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border border-red-50/50"
                                            onClick={() => handleDelete(temple.id, temple.name)}
                                            title="Delete Sthana"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>
        </AdminLayout>
    );
}
