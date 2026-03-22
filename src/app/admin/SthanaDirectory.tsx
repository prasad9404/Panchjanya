import React, { useState, useEffect } from "react";
import { db } from "@/auth/firebase";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";

import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/shared/components/ui/dropdown-menu";
import {
    Search,
    Plus,
    MapPin,
    Eye,
    Edit,
    Trash2,
    ChevronDown,
    Info,
    ArrowLeft,
    EyeOff
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { SthanTypeManager } from "@/shared/components/admin/SthanTypeManager";
import { AVATAR_SAMBANDH_CONFIG, getAvatarColor } from "@/shared/utils/sthanTypes";
import { getSthanaStatus } from "@/shared/utils/sthanValidation";
import { SthanaStatus } from "@/types";
import { useSthanTypes } from "@/shared/contexts/SthanTypesContext";

export default function SthanaDirectory() {
    const [temples, setTemples] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [selectedDistrict, setSelectedDistrict] = useState<string>("District");
    const [selectedTaluka, setSelectedTaluka] = useState<string>("Taluka");
    const [selectedSthan, setSelectedSthan] = useState<string>("Sthan Type");
    const [selectedAvatarSambandh, setSelectedAvatarSambandh] = useState<string>("ALL");
    const [selectedAvatarSubdivision, setSelectedAvatarSubdivision] = useState<string>("");
    const [selectedStatus, setSelectedStatus] = useState<string>("Status");

    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    // Consume global cache – no extra Firestore fetch here
    const { sthanTypes } = useSthanTypes();

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
    }, []);

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

        // 1. Identify the Source of Truth (Sthan Type) for THIS temple
        let matchedType: any = null;
        if (t.sthanTypeId) {
            matchedType = sthanTypes.find(st => st.id === t.sthanTypeId);
        } else if (t.sthan) {
            // Legacy matching consistent with count logic
            const contextAvatar = t.primaryAvatar || t.avatarSambandh;
            const contextSub = (t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : t.avatarSubdivision;
            
            matchedType = sthanTypes.find(st => 
                st.name === t.sthan && 
                st.avatarSambandh === contextAvatar && 
                (st.avatarSubdivision || "") === (contextSub || "")
            ) || sthanTypes.find(st => st.name === t.sthan);
        }

        // 2. Determine final classification
        const resAvatarS = matchedType ? matchedType.avatarSambandh : (t.primaryAvatar || t.avatarSambandh);
        const resAvatarSub = matchedType ? (matchedType.avatarSubdivision || "") : ((t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : (t.avatarSubdivision || ""));
        const resSthanName = matchedType ? matchedType.name : (t.sthan || "");

        // 3. Compare against active filters
        const matchesSthan = selectedSthan === "Sthan Type" || resSthanName === selectedSthan;
        
        let matchesAvatar = true;
        if (selectedAvatarSambandh !== "ALL") {
            if (resAvatarS !== selectedAvatarSambandh) {
                matchesAvatar = false;
            } else if (selectedAvatarSubdivision && resAvatarSub !== selectedAvatarSubdivision) {
                matchesAvatar = false;
            }
        }

        // Status filter logic (Strict 5-tier system)
        const matchesStatus = (() => {
            if (selectedStatus === "Status") return true;
            
            const derivedStatus = t.status || getSthanaStatus(t);

            if (selectedStatus === "Published") return derivedStatus === "PUBLISHED";
            if (selectedStatus === "Verified") return derivedStatus === "VERIFIED";
            if (selectedStatus === "Complete") return derivedStatus === "COMPLETE";
            if (selectedStatus === "In Progress") return derivedStatus === "IN_PROGRESS";
            if (selectedStatus === "Draft") return derivedStatus === "DRAFT";
            
            return true;
        })();

        return matchesSearch && matchesDistrict && matchesTaluka && matchesSthan && matchesAvatar && matchesStatus;
    });

    // 5. Dynamic Counts for Avatar hierarchy
    const filterCounts = React.useMemo(() => {
        const counts = {
            ALL: temples.length,
            byAvatar: {} as Record<string, number>,
            bySubdivision: {} as Record<string, number>,
            bySthan: {} as Record<string, number>,
            byDistrict: {} as Record<string, number>,
            byTaluka: {} as Record<string, number>,
            byStatus: {
                Published: 0,
                Verified: 0,
                Complete: 0,
                InProgress: 0,
                Draft: 0
            } as Record<string, number>,
        };

        temples.forEach((t: any) => {
            // 1) Find the exact Sthan Type to count against (Source of Truth)
            let matchedType: any = null;
            if (t.sthanTypeId) {
                matchedType = sthanTypes.find(st => st.id === t.sthanTypeId);
            } else if (t.sthan) {
                // Fallback: match by Name AND Avatar AND Subdivision
                const contextAvatar = t.primaryAvatar || t.avatarSambandh;
                const contextSub = (t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : t.avatarSubdivision;
                
                matchedType = sthanTypes.find(st => 
                    st.name === t.sthan && 
                    st.avatarSambandh === contextAvatar && 
                    (st.avatarSubdivision || "") === (contextSub || "")
                );
                
                // Emergency Fallback: just match by name (legacy edge case)
                if (!matchedType) {
                    matchedType = sthanTypes.find(st => st.name === t.sthan);
                }
            }

            // 2) Determine final classification for the aggregate counts
            //    If we have a matched Sthan Type, it IS the source of truth now.
            const resAvatarS = matchedType ? matchedType.avatarSambandh : (t.primaryAvatar || t.avatarSambandh);
            const resAvatarSub = matchedType ? (matchedType.avatarSubdivision || "") : ((t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : (t.avatarSubdivision || ""));

            // 3) Record Aggregate counts
            if (resAvatarS) {
                counts.byAvatar[resAvatarS] = (counts.byAvatar[resAvatarS] || 0) + 1;
            }
            if (resAvatarSub) {
                // Critical fix: Use the scoped ID system for accurate subdivision mapping
                const combinedSubId = `${resAvatarS}-${resAvatarSub}`;
                counts.bySubdivision[combinedSubId] = (counts.bySubdivision[combinedSubId] || 0) + 1;
            }
            
            // 4) Record specific Sthan Type ID counts
            if (matchedType) {
                counts.bySthan[matchedType.id] = (counts.bySthan[matchedType.id] || 0) + 1;
            }

            // 5) Record District & Taluka counts
            if (t.district) {
                counts.byDistrict[t.district] = (counts.byDistrict[t.district] || 0) + 1;
            }
            if (t.taluka) {
                counts.byTaluka[t.taluka] = (counts.byTaluka[t.taluka] || 0) + 1;
            }

            // 6) Record Status counts (Strict 5-tier)
            const derivedStatus = t.status || getSthanaStatus(t);
            if (derivedStatus === "PUBLISHED") {
                counts.byStatus.Published++;
            } else if (derivedStatus === "VERIFIED") {
                counts.byStatus.Verified++;
            } else if (derivedStatus === "COMPLETE") {
                counts.byStatus.Complete++;
            } else if (derivedStatus === "IN_PROGRESS") {
                counts.byStatus.InProgress++;
            } else if (derivedStatus === "DRAFT") {
                counts.byStatus.Draft++;
            }
        });

        return counts;
    }, [temples, sthanTypes]);


    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F9F6F0] pb-20 -m-6 p-6">
                <div className="max-w-7xl mx-auto space-y-8 pt-2">
                    {/* ── Top Navigation ── */}
                    <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between z-10 transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/admin/dashboard")}
                                className="rounded-xl hover:bg-slate-50 text-slate-500 font-bold"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Dashboard
                            </Button>
                            <div className="w-px h-8 bg-slate-100" />
                            <span className="text-sm font-black uppercase tracking-widest text-slate-500">
                                Sthana Directory
                            </span>
                        </div>
                    </div>

                    {/* ── Page Header ── */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-serif font-bold text-primary tracking-tight">Sthana Directory</h1>
                            <p className="text-sm text-slate-500 font-medium">
                                Manage, verify, and track heritage sthanas globally.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap md:flex-nowrap">
                            <Button
                                onClick={() => navigate("/admin/abbreviations")}
                                variant="outline"
                                className="bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-12 px-6 border-slate-200 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Info className="w-5 h-5 mr-2" />
                                Abbreviations
                            </Button>
                            <SthanTypeManager />
                            <Button
                                onClick={() => navigate("/admin/temples/add")}
                                className="bg-primary hover:bg-primary/90 text-white font-bold rounded-xl h-12 px-6 shadow-sm shadow-blue-900/10 transition-all hover:scale-[1.02] active:scale-95"
                            >
                                <Plus className="w-5 h-5 mr-2 stroke-[3]" />
                                Add New Sthana
                            </Button>
                        </div>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col lg:flex-row gap-4">
                        {/* Search */}
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                                placeholder="Search Sthanas by name or ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-12 h-12 rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500 text-base"
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
                                    <DropdownMenuItem onClick={() => setSelectedDistrict("District")} className="font-bold cursor-pointer flex justify-between">
                                        <span>All Districts</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.ALL}</span>
                                    </DropdownMenuItem>
                                    {districts.map(d => (
                                        <DropdownMenuItem key={d} onClick={() => setSelectedDistrict(d)} className="cursor-pointer flex justify-between">
                                            <span>{d}</span>
                                            <span className="text-xs text-muted-foreground">{filterCounts.byDistrict[d] || 0}</span>
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
                                    <DropdownMenuItem onClick={() => setSelectedTaluka("Taluka")} className="font-bold cursor-pointer flex justify-between">
                                        <span>All Talukas</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.ALL}</span>
                                    </DropdownMenuItem>
                                    {talukas.map(t => (
                                        <DropdownMenuItem key={t} onClick={() => setSelectedTaluka(t)} className="cursor-pointer flex justify-between">
                                            <span>{t}</span>
                                            <span className="text-xs text-muted-foreground">{filterCounts.byTaluka[t] || 0}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>


                            {/* Hierarchical Avatar & Sthan Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[150px] justify-between">
                                        <div className="flex items-center gap-2 truncate">
                                            {selectedSthan !== "Sthan Type" 
                                                ? selectedSthan 
                                                : selectedAvatarSubdivision 
                                                    ? AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.subdivisions.find(s => s.id === selectedAvatarSubdivision)?.label 
                                                    : selectedAvatarSambandh === "ALL" 
                                                        ? "All Avatars" 
                                                        : AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.shortLabel || "Avatar"}
                                            
                                            {selectedAvatarSambandh !== "ALL" && selectedSthan === "Sthan Type" && !selectedAvatarSubdivision && (
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.color }} />
                                            )}
                                        </div>
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[240px] max-h-[400px] overflow-y-auto">
                                    <DropdownMenuItem 
                                        onClick={() => { setSelectedAvatarSambandh("ALL"); setSelectedAvatarSubdivision(""); setSelectedSthan("Sthan Type"); }} 
                                        className="font-bold cursor-pointer flex justify-between"
                                    >
                                        <span>All Avatars & Sthans</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.ALL}</span>
                                    </DropdownMenuItem>
                                    
                                    {AVATAR_SAMBANDH_CONFIG.map(avatar => {
                                         const avatarCount = filterCounts.byAvatar[avatar.id] || 0;
                            
                                         return (
                                             <DropdownMenuSub key={avatar.id}>
                                                 <DropdownMenuSubTrigger className="cursor-pointer">
                                                     <div className="flex items-center justify-between w-full pr-1">
                                                         <div className="flex items-center">
                                                             <div className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: avatar.color }} />
                                                             <span>{avatar.shortLabel}</span>
                                                         </div>
                                                         <span className="text-xs text-muted-foreground ml-3">{avatarCount}</span>
                                                     </div>
                                                 </DropdownMenuSubTrigger>
                                                 <DropdownMenuPortal>
                                                     <DropdownMenuSubContent className="w-[220px] max-h-[300px] overflow-y-auto">
                                                         <DropdownMenuItem 
                                                             onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(""); setSelectedSthan("Sthan Type"); }}
                                                             className="font-bold cursor-pointer flex justify-between"
                                                         >
                                                             <span>All {avatar.shortLabel}</span>
                                                             <span className="text-xs text-muted-foreground">{avatarCount}</span>
                                                         </DropdownMenuItem>
                            
                                                         {avatar.subdivisions.length === 0 ? (
                                                             // No subdivisions, list sthan types
                                                             sthanTypes
                                                                 .filter(st => st.avatarSambandh === avatar.id)
                                                                 .map(st => (
                                                                     <DropdownMenuItem 
                                                                         key={st.id}
                                                                         onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(""); setSelectedSthan(st.name); }}
                                                                         className="cursor-pointer flex justify-between"
                                                                     >
                                                                         <div className="flex items-center truncate max-w-[140px]">
                                                                             <div className="w-1.5 h-1.5 rounded-full mr-2 opacity-50 shrink-0" style={{ backgroundColor: st.color }} />
                                                                             <span className="truncate pr-2">{st.name}</span>
                                                                         </div>
                                                                         <span className="text-xs text-muted-foreground shrink-0">{filterCounts.bySthan[st.id] || 0}</span>
                                                                     </DropdownMenuItem>
                                                                 ))
                                                         ) : (
                                                             // Has subdivisions
                                                             avatar.subdivisions.map(sub => {
                                                                  const subCount = filterCounts.bySubdivision[`${avatar.id}-${sub.id}`] || 0;
                                                                  return (
                                                                      <DropdownMenuSub key={sub.id}>
                                                                          <DropdownMenuSubTrigger className="cursor-pointer font-medium">
                                                                              <div className="flex items-center justify-between w-full pr-1">
                                                                                   <span>{sub.label}</span>
                                                                                   <span className="text-xs text-muted-foreground ml-3">{subCount}</span>
                                                                               </div>
                                                                          </DropdownMenuSubTrigger>
                                                                          <DropdownMenuPortal>
                                                                              <DropdownMenuSubContent className="w-[220px] max-h-[300px] overflow-y-auto">
                                                                                  <DropdownMenuItem 
                                                                                      onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(sub.id); setSelectedSthan("Sthan Type"); }}
                                                                                      className="font-bold cursor-pointer flex justify-between"
                                                                                  >
                                                                                      <span>All {sub.label}</span>
                                                                                      <span className="text-xs text-muted-foreground">{subCount}</span>
                                                                                  </DropdownMenuItem>
                                                                                  {sthanTypes
                                                                                      .filter(st => st.avatarSambandh === avatar.id && st.avatarSubdivision === sub.id)
                                                                                      .map(st => (
                                                                                          <DropdownMenuItem 
                                                                                              key={st.id}
                                                                                              onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(sub.id); setSelectedSthan(st.name); }}
                                                                                              className="cursor-pointer flex justify-between"
                                                                                          >
                                                                                              <div className="flex items-center truncate max-w-[140px]">
                                                                                                  <div className="w-1.5 h-1.5 rounded-full mr-2 opacity-50 shrink-0" style={{ backgroundColor: st.color }} />
                                                                                                  <span className="truncate pr-2">{st.name}</span>
                                                                                              </div>
                                                                                              <span className="text-xs text-muted-foreground shrink-0">{filterCounts.bySthan[st.id] || 0}</span>
                                                                                          </DropdownMenuItem>
                                                                                      ))}
                                                                              </DropdownMenuSubContent>
                                                                          </DropdownMenuPortal>
                                                                      </DropdownMenuSub>
                                                                  );
                                                             })
                                                         )}
                                                     </DropdownMenuSubContent>
                                                 </DropdownMenuPortal>
                                             </DropdownMenuSub>
                                         );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>


                            {/* Status Filter */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-12 px-4 rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[120px] justify-between">
                                        {selectedStatus}
                                        <ChevronDown className="w-4 h-4 ml-2 opacity-50" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[180px]">
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Status")} className="font-bold cursor-pointer flex justify-between">
                                        <span>All Status</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.ALL}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Published")} className="cursor-pointer flex justify-between">
                                        <span>Published</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.byStatus.Published}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Verified")} className="cursor-pointer flex justify-between">
                                        <span>Verified</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.byStatus.Verified}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Complete")} className="cursor-pointer flex justify-between">
                                        <span>Complete</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.byStatus.Complete}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("In Progress")} className="cursor-pointer flex justify-between">
                                        <span>In Progress</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.byStatus.InProgress}</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setSelectedStatus("Draft")} className="cursor-pointer flex justify-between">
                                        <span>Draft</span>
                                        <span className="text-xs text-muted-foreground">{filterCounts.byStatus.Draft}</span>
                                    </DropdownMenuItem>
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
                                            src={temple.sthanImages?.[0] || temple.images?.[0] || "/placeholder-temple.jpg"}
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
                                            {/* Status Badges */}
                                            <div className="shrink-0 flex flex-col items-end gap-1.5">
                                                {/* Standalone Badge */}
                                                {(temple.hasArchitecture === false || temple.isStandalone === true) && (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                        <span className="text-[10px] font-black uppercase tracking-tighter">Standalone</span>
                                                    </div>
                                                )}
                                                {(() => {
                                                    const derivedStatus = temple.status || getSthanaStatus(temple);
                                                    
                                                    if (derivedStatus === 'PUBLISHED') {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide gap-1">
                                                                🌍 Published
                                                            </span>
                                                        );
                                                    }
                                                    if (derivedStatus === 'VERIFIED') {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-[#C9A961]/10 text-[#a88b48] border border-[#C9A961]/20 uppercase tracking-wide gap-1">
                                                                🟢 Verified
                                                            </span>
                                                        );
                                                    }
                                                    if (derivedStatus === 'COMPLETE') {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-wide gap-1">
                                                                ✅ Complete
                                                            </span>
                                                        );
                                                    }
                                                    if (derivedStatus === 'IN_PROGRESS') {
                                                        return (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase tracking-wide gap-1">
                                                                ✏️ In Progress
                                                            </span>
                                                        );
                                                    }
                                                    return (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide gap-1">
                                                            📝 Draft
                                                        </span>
                                                    );
                                                })()}
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
                                                {(() => {
                                                    const typeInfo = sthanTypes.find(st => st.name === temple.sthan);
                                                    return (
                                                        <span
                                                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                                                            style={{
                                                                backgroundColor: getAvatarColor(typeInfo?.avatarSambandh) || typeInfo?.color || '#94a3b8',
                                                                color: 'white'
                                                            }}
                                                        >
                                                            {temple.sthan}
                                                        </span>
                                                    );
                                                })()}
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
                                            className={cn(
                                                "flex-1 sm:flex-none h-10 w-10 rounded-xl",
                                                (temple.hasArchitecture === false || temple.isStandalone === true)
                                                    ? "bg-slate-50 text-slate-300 cursor-not-allowed"
                                                    : "bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                                            )}
                                            onClick={() => {
                                                const isStandalone = temple.hasArchitecture === false || temple.isStandalone === true;
                                                if (!isStandalone) {
                                                    window.open(`/temple/${temple.id}/architecture`, '_blank');
                                                }
                                            }}
                                            title={(temple.hasArchitecture === false || temple.isStandalone === true) ? "No architecture page (standalone sthan)" : "View Public Page"}
                                            disabled={temple.hasArchitecture === false || temple.isStandalone === true}
                                        >
                                            {(temple.hasArchitecture === false || temple.isStandalone === true)
                                                ? <EyeOff className="w-4 h-4" />
                                                : <Eye className="w-4 h-4" />}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="flex-1 sm:flex-none h-10 w-10 rounded-xl bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-100"
                                            onClick={() => {
                                                navigate(`/admin/temples/${temple.id}/edit`);
                                            }}
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
