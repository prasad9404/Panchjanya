import React, { useState, useEffect } from "react";
import { db } from "@/auth/firebase";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/shared/contexts/LanguageContext";

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
    EyeOff,
    Globe,
    ShieldCheck,
    CheckCircle2,
    FileEdit,
    Clock
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { SthanTypeManager } from "@/shared/components/admin/SthanTypeManager";
import { AVATAR_SAMBANDH_CONFIG, getAvatarColor } from "@/shared/utils/sthanTypes";
import { getSthanaStatus } from "@/shared/utils/sthanValidation";
import { SthanaStatus } from "@/types";
import { useSthanTypes } from "@/shared/contexts/SthanTypesContext";
import { SthanaCard } from "@/shared/components/features/SthanaCard";
import { AlphabetSection } from "@/shared/components/features/AlphabetSection";
import { AlphabetScroller } from "@/shared/components/features/AlphabetScroller";

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
    const { language } = useLanguage();
    const activeLang: 'en' | 'hi' | 'mr' = language === 'hindi' ? 'hi' : language === 'marathi' ? 'mr' : 'en';

    // Helper for safe display
    const getDisp = (val: any) => {
        if (!val) return "";
        if (typeof val === 'string') return val;
        return val[activeLang] || val.en || "";
    };

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
    const districts = Array.from(new Set(temples.map(t => getDisp(t.district)).filter(Boolean)));
    const talukas = Array.from(new Set(temples.map(t => getDisp(t.taluka)).filter(Boolean)));

    // 4. Filter Logic
    const filteredTemples = temples.filter((t) => {
        const matchesSearch =
            (getDisp(t.name)).toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.id || "").toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDistrict = selectedDistrict === "District" || getDisp(t.district) === selectedDistrict;
        const matchesTaluka = selectedTaluka === "Taluka" || getDisp(t.taluka) === selectedTaluka;

        // 1. Identify the Source of Truth (Sthan Type) for THIS temple
        let matchedType: any = null;
        if (t.sthanTypeId) {
            matchedType = sthanTypes.find(st => st.id === t.sthanTypeId);
        } else if (t.sthan) {
            // Legacy matching consistent with count logic
            const contextAvatar = t.primaryAvatar || t.avatarSambandh;
            const contextSub = (t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : t.avatarSubdivision;
            
            matchedType = sthanTypes.find(st => 
                st.name === getDisp(t.sthan) && 
                st.avatarSambandh === contextAvatar && 
                (st.avatarSubdivision || "") === (contextSub || "")
            ) || sthanTypes.find(st => st.name === (typeof t.sthan === 'string' ? t.sthan : (t.sthan?.en || "")));
        }

        // 2. Determine final classification
        const resAvatarS = matchedType ? matchedType.avatarSambandh : (t.primaryAvatar || t.avatarSambandh);
        const resAvatarSub = matchedType ? (matchedType.avatarSubdivision || "") : ((t.avatarSubTypes && t.avatarSubTypes.length > 0) ? t.avatarSubTypes[0] : (t.avatarSubdivision || ""));
        const resSthanName = matchedType ? matchedType.name : (getDisp(t.sthan) || "");

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
                    matchedType = sthanTypes.find(st => st.name === (typeof t.sthan === 'string' ? t.sthan : (t.sthan?.en || "")));
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
                counts.byDistrict[getDisp(t.district)] = (counts.byDistrict[getDisp(t.district)] || 0) + 1;
            }
            if (t.taluka) {
                counts.byTaluka[getDisp(t.taluka)] = (counts.byTaluka[getDisp(t.taluka)] || 0) + 1;
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

    // State to track currently active alphabet letter
    const [activeLetter, setActiveLetter] = useState<string>("");

    // Responsive state for screen-width based scroller layout
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024); // Use lg breakpoint (1024px) for robust desktop view
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Helper to get English name safely for sorting and grouping
    const getEnglishName = (temple: any): string => {
        const nameVal = temple.name;
        if (!nameVal) return "";
        if (typeof nameVal === 'string') return nameVal;
        return nameVal.en || "";
    };

    // Sort filtered temples alphabetically by English name
    const sortedFilteredTemples = React.useMemo(() => {
        return [...filteredTemples].sort((a: any, b: any) => {
            const nameA = getEnglishName(a).toLowerCase().trim();
            const nameB = getEnglishName(b).toLowerCase().trim();
            return nameA.localeCompare(nameB);
        });
    }, [filteredTemples]);

    // Group sorted temples by starting letter
    const groupedTemples = React.useMemo(() => {
        const groups: Record<string, any[]> = {};
        sortedFilteredTemples.forEach((temple) => {
            const nameStr = getEnglishName(temple).trim();
            const firstLetter = nameStr.charAt(0).toUpperCase();
            const groupKey = /^[A-Z]$/.test(firstLetter) ? firstLetter : '#';
            
            if (!groups[groupKey]) {
                groups[groupKey] = [];
            }
            groups[groupKey].push(temple);
        });
        return groups;
    }, [sortedFilteredTemples]);

    // Set of letters that have at least one sthana in the current filtered list
    const availableLetters = React.useMemo(() => {
        const letters = new Set<string>();
        sortedFilteredTemples.forEach((temple) => {
            const nameStr = getEnglishName(temple).trim();
            const firstLetter = nameStr.charAt(0).toUpperCase();
            if (/^[A-Z]$/.test(firstLetter)) {
                letters.add(firstLetter);
            }
        });
        return letters;
    }, [sortedFilteredTemples]);

    // Automatically set initial active letter to the first available one when availableLetters changes
    useEffect(() => {
        if (availableLetters.size > 0) {
            const firstLetter = Array.from(availableLetters).sort()[0];
            setActiveLetter(firstLetter);
        } else {
            setActiveLetter("");
        }
    }, [availableLetters]);

    // Performant Scroll Spy using scroll event listener on the scrollable container
    useEffect(() => {
        const scrollContainer = document.querySelector('.overflow-y-auto');
        if (!scrollContainer || availableLetters.size === 0) return;

        const handleScroll = () => {
            const sections = Array.from(availableLetters).map(letter => {
                const element = document.getElementById(`section-${letter}`);
                return { letter, element };
            }).filter(item => item.element !== null) as { letter: string; element: HTMLElement }[];

            const containerTop = scrollContainer.getBoundingClientRect().top;
            
            let currentActive = "";
            for (let i = 0; i < sections.length; i++) {
                const section = sections[i];
                const rect = section.element.getBoundingClientRect();
                
                // If section top has scrolled past or is near the top of the container viewport
                if (rect.top - containerTop <= 140) {
                    currentActive = section.letter;
                } else {
                    break;
                }
            }

            if (currentActive) {
                setActiveLetter(currentActive);
            }
        };

        scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
        // Initial call
        handleScroll();

        return () => {
            scrollContainer.removeEventListener('scroll', handleScroll);
        };
    }, [availableLetters, sortedFilteredTemples]);

    const handleLetterClick = (letter: string) => {
        const element = document.getElementById(`section-${letter}`);
        if (element) {
            const scrollContainer = element.closest('.overflow-y-auto');
            if (scrollContainer) {
                const targetOffset = element.offsetTop - 24; // comfortable top margin
                scrollContainer.scrollTo({
                    top: targetOffset,
                    behavior: "smooth"
                });
            } else {
                element.scrollIntoView({ behavior: "smooth", block: "start" });
            }
            setActiveLetter(letter);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-10 pt-4">
                <div className="space-y-10">
                    {/* ── Top Navigation ── */}
                    <div className="bg-white p-4 rounded-[32px] shadow-sm border border-slate-100 flex items-center justify-between transition-all duration-300">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate("/admin/dashboard")}
                                className="rounded-2xl hover:bg-slate-50 text-slate-500 font-bold h-10 px-5"
                            >
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Dashboard
                            </Button>
                            <div className="w-px h-6 bg-slate-100" />
                            <div className="flex items-center gap-2 px-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">
                                    System Management
                                </span>
                                <span className="text-slate-200">/</span>
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">
                                    Sthana Directory
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pr-2">
                           <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                <span className="text-[10px] font-black text-blue-700 uppercase tracking-tighter">
                                    {temples.length} Records Synced
                                </span>
                           </div>
                        </div>
                    </div>

                    {/* ── Page Header ── */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center border border-blue-100 shadow-sm">
                                    <MapPin className="w-6 h-6 text-blue-600" />
                                </div>
                                <h1 className="text-4xl font-serif font-black text-slate-900 tracking-tightest">Sthana Directory</h1>
                            </div>
                            <p className="text-slate-500 font-medium max-w-lg leading-relaxed">
                                Centralized management for all heritage sthanas. Curate diagrams, photographs, and historical narratives across the global network.
                            </p>
                        </div>
                        <div className="flex gap-3 flex-wrap md:flex-nowrap">
                            <Button
                                onClick={() => navigate("/admin/abbreviations")}
                                variant="outline"
                                className="bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-2xl h-14 px-8 border-slate-200 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                            >
                                <Info className="w-5 h-5 mr-3" />
                                Abbreviations
                            </Button>
                            <SthanTypeManager />
                            <Button
                                onClick={() => navigate("/admin/temples/add")}
                                className="bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-2xl h-14 px-8 shadow-2xl shadow-blue-900/20 transition-all hover:scale-[1.05] active:scale-95 flex items-center gap-2"
                            >
                                <Plus className="w-5 h-5 stroke-[4]" />
                                Add Sthana
                            </Button>
                        </div>
                    </div>

                    {/* Search & Filters Bar */}
                    <div className="bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-slate-200 shadow-sm space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search */}
                            <div className="relative flex-1 group">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                <Input
                                    placeholder="Search Sthanas by name or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-14 h-14 rounded-2xl border-slate-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-lg transition-all"
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                                {/* District Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[140px] justify-between shadow-sm">
                                            <span className="truncate">{selectedDistrict}</span>
                                            <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[240px] max-h-[400px] overflow-y-auto rounded-2xl p-2 border-2 shadow-2xl">
                                        <DropdownMenuItem onClick={() => setSelectedDistrict("District")} className="font-bold cursor-pointer flex justify-between rounded-xl py-3">
                                            <span>All Districts</span>
                                            <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg">{filterCounts.ALL}</span>
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 my-1" />
                                        {districts.map(d => (
                                            <DropdownMenuItem key={d} onClick={() => setSelectedDistrict(d)} className="cursor-pointer flex justify-between rounded-xl py-3">
                                                <span>{d}</span>
                                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{filterCounts.byDistrict[d] || 0}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>

                                {/* Taluka Filter */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[140px] justify-between shadow-sm">
                                            <span className="truncate">{selectedTaluka}</span>
                                            <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[240px] max-h-[400px] overflow-y-auto rounded-2xl p-2 border-2 shadow-2xl">
                                        <DropdownMenuItem onClick={() => setSelectedTaluka("Taluka")} className="font-bold cursor-pointer flex justify-between rounded-xl py-3">
                                            <span>All Talukas</span>
                                            <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg">{filterCounts.ALL}</span>
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-100 my-1" />
                                        {talukas.map(t => (
                                            <DropdownMenuItem key={t} onClick={() => setSelectedTaluka(t)} className="cursor-pointer flex justify-between rounded-xl py-3">
                                                <span>{t}</span>
                                                <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg">{filterCounts.byTaluka[t] || 0}</span>
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                 {/* Hierarchical Avatar & Sthan Filter */}
                                 <DropdownMenu>
                                     <DropdownMenuTrigger asChild>
                                         <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[200px] justify-between shadow-sm">
                                             <div className="flex items-center gap-2 truncate">
                                                 {selectedSthan !== "Sthan Type" 
                                                     ? selectedSthan 
                                                     : selectedAvatarSubdivision 
                                                         ? AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.subdivisions.find(s => s.id === selectedAvatarSubdivision)?.label 
                                                         : selectedAvatarSambandh === "ALL" 
                                                             ? "All Avatars" 
                                                             : AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.shortLabel || "Avatar"}
                                                 
                                                 {selectedAvatarSambandh !== "ALL" && selectedSthan === "Sthan Type" && !selectedAvatarSubdivision && (
                                                     <div className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm border border-white" style={{ backgroundColor: AVATAR_SAMBANDH_CONFIG.find(a => a.id === selectedAvatarSambandh)?.color }} />
                                                 )}
                                             </div>
                                             <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                         </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="w-[280px] max-h-[500px] overflow-y-auto rounded-3xl p-3 border-2 shadow-2xl">
                                         <DropdownMenuItem 
                                             onClick={() => { setSelectedAvatarSambandh("ALL"); setSelectedAvatarSubdivision(""); setSelectedSthan("Sthan Type"); }} 
                                             className="font-bold cursor-pointer flex justify-between rounded-2xl py-3 px-4 hover:bg-slate-50"
                                         >
                                             <span className="text-slate-900">All Avatars & Sthans</span>
                                             <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg shrink-0">{filterCounts.ALL}</span>
                                         </DropdownMenuItem>
                                         
                                         <div className="h-px bg-slate-100 my-2" />
                                         
                                         {AVATAR_SAMBANDH_CONFIG.map(avatar => {
                                              const avatarCount = filterCounts.byAvatar[avatar.id] || 0;
                                 
                                              return (
                                                  <DropdownMenuSub key={avatar.id}>
                                                      <DropdownMenuSubTrigger className="cursor-pointer rounded-2xl py-3 px-4 outline-none focus:bg-slate-50 data-[state=open]:bg-slate-50">
                                                          <div className="flex items-center justify-between w-full pr-1">
                                                              <div className="flex items-center">
                                                                  <div className="w-3 h-3 rounded-full mr-3 shadow-sm" style={{ backgroundColor: avatar.color }} />
                                                                  <span className="font-bold text-slate-800">{avatar.shortLabel}</span>
                                                              </div>
                                                              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg shrink-0">{avatarCount}</span>
                                                          </div>
                                                      </DropdownMenuSubTrigger>
                                                      <DropdownMenuPortal>
                                                          <DropdownMenuSubContent className="w-[260px] max-h-[400px] overflow-y-auto rounded-3xl p-2 border-2 shadow-2xl ml-2">
                                                              <DropdownMenuItem 
                                                                  onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(""); setSelectedSthan("Sthan Type"); }}
                                                                  className="font-black cursor-pointer flex justify-between rounded-2xl py-3 px-4 bg-slate-50/50"
                                                              >
                                                                  <span className="uppercase text-[11px] tracking-widest">All {avatar.shortLabel}</span>
                                                                  <span className="text-[10px] font-black bg-white shadow-sm border px-2 py-0.5 rounded-lg shrink-0">{avatarCount}</span>
                                                              </DropdownMenuItem>
                                 
                                                              <div className="h-px bg-slate-100 my-2" />
    
                                                              {avatar.subdivisions.length === 0 ? (
                                                                  // No subdivisions, list sthan types
                                                                  sthanTypes
                                                                      .filter(st => st.avatarSambandh === avatar.id)
                                                                      .sort((a,b) => (filterCounts.bySthan[b.id] || 0) - (filterCounts.bySthan[a.id] || 0))
                                                                      .map(st => (
                                                                          <DropdownMenuItem 
                                                                              key={st.id}
                                                                              onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(""); setSelectedSthan(st.name); }}
                                                                              className="cursor-pointer flex justify-between rounded-xl py-2 px-4 hover:bg-slate-50 group"
                                                                          >
                                                                              <div className="flex items-center truncate max-w-[160px]">
                                                                                  <div className="w-2 h-2 rounded-full mr-3 opacity-50 shrink-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: st.color }} />
                                                                                  <span className="truncate pr-2 text-sm font-medium text-slate-600 group-hover:text-slate-900">{st.name}</span>
                                                                              </div>
                                                                              <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">{filterCounts.bySthan[st.id] || 0}</span>
                                                                          </DropdownMenuItem>
                                                                      ))
                                                              ) : (
                                                                  // Has subdivisions
                                                                  avatar.subdivisions.map(sub => {
                                                                       const subCount = filterCounts.bySubdivision[`${avatar.id}-${sub.id}`] || 0;
                                                                       return (
                                                                           <DropdownMenuSub key={sub.id}>
                                                                               <DropdownMenuSubTrigger className="cursor-pointer rounded-2xl py-2.5 px-4 outline-none focus:bg-slate-50 data-[state=open]:bg-slate-50">
                                                                                   <div className="flex items-center justify-between w-full pr-1">
                                                                                        <span className="font-semibold text-slate-700 text-sm">{sub.label}</span>
                                                                                        <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg shrink-0">{subCount}</span>
                                                                                    </div>
                                                                               </DropdownMenuSubTrigger>
                                                                               <DropdownMenuPortal>
                                                                                   <DropdownMenuSubContent className="w-[240px] max-h-[350px] overflow-y-auto rounded-3xl p-2 border-2 shadow-2xl ml-2">
                                                                                       <DropdownMenuItem 
                                                                                           onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(sub.id); setSelectedSthan("Sthan Type"); }}
                                                                                           className="font-bold cursor-pointer flex justify-between rounded-2xl py-3 px-4 bg-slate-50/50"
                                                                                       >
                                                                                           <span className="text-xs uppercase tracking-wider">All {sub.label}</span>
                                                                                           <span className="text-[10px] font-black bg-white shadow-sm border px-2 py-0.5 rounded-lg shrink-0">{subCount}</span>
                                                                                       </DropdownMenuItem>
                                                                                       
                                                                                       <div className="h-px bg-slate-100 my-2" />
        
                                                                                       {sthanTypes
                                                                                           .filter(st => st.avatarSambandh === avatar.id && st.avatarSubdivision === sub.id)
                                                                                           .sort((a,b) => (filterCounts.bySthan[b.id] || 0) - (filterCounts.bySthan[a.id] || 0))
                                                                                           .map(st => (
                                                                                               <DropdownMenuItem 
                                                                                                   key={st.id}
                                                                                                   onClick={() => { setSelectedAvatarSambandh(avatar.id); setSelectedAvatarSubdivision(sub.id); setSelectedSthan(st.name); }}
                                                                                                   className="cursor-pointer flex justify-between rounded-xl py-2 px-4 hover:bg-slate-50 group"
                                                                                               >
                                                                                                   <div className="flex items-center truncate max-w-[160px]">
                                                                                                       <div className="w-2 h-2 rounded-full mr-3 opacity-50 shrink-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: st.color }} />
                                                                                                       <span className="truncate pr-2 text-sm font-medium text-slate-600 group-hover:text-slate-900">{st.name}</span>
                                                                                                   </div>
                                                                                                   <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shrink-0">{filterCounts.bySthan[st.id] || 0}</span>
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
                                         <Button variant="outline" className="h-14 px-6 rounded-2xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold min-w-[160px] justify-between shadow-sm">
                                             <span className="truncate">{selectedStatus}</span>
                                             <ChevronDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
                                         </Button>
                                     </DropdownMenuTrigger>
                                     <DropdownMenuContent align="end" className="w-[200px] rounded-2xl p-2 border-2 shadow-2xl">
                                         <DropdownMenuItem onClick={() => setSelectedStatus("Status")} className="font-bold cursor-pointer flex justify-between rounded-xl py-3 px-4">
                                             <span>All Status</span>
                                             <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-lg">{filterCounts.ALL}</span>
                                         </DropdownMenuItem>
                                         <div className="h-px bg-slate-100 my-1" />
                                         {[
                                            { id: "Published", label: "Published", count: filterCounts.byStatus.Published, color: "bg-blue-50 text-blue-600" },
                                            { id: "Verified", label: "Verified", count: filterCounts.byStatus.Verified, color: "bg-amber-50 text-amber-600" },
                                            { id: "Complete", label: "Complete", count: filterCounts.byStatus.Complete, color: "bg-emerald-50 text-emerald-600" },
                                            { id: "In Progress", label: "In Progress", count: filterCounts.byStatus.InProgress, color: "bg-orange-50 text-orange-600" },
                                            { id: "Draft", label: "Draft", count: filterCounts.byStatus.Draft, color: "bg-slate-50 text-slate-500" }
                                         ].map((status) => (
                                             <DropdownMenuItem key={status.id} onClick={() => setSelectedStatus(status.id)} className="cursor-pointer flex justify-between rounded-xl py-3 px-4 group">
                                                 <span className="text-slate-700 font-medium group-hover:text-slate-900">{status.label}</span>
                                                 <span className={cn("text-[10px] font-black px-2 py-0.5 rounded-lg shrink-0", status.color)}>{status.count}</span>
                                             </DropdownMenuItem>
                                         ))}
                                     </DropdownMenuContent>
                                 </DropdownMenu>
                            </div>
                        </div>
                    </div>

                    {/* Directory List Layout */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-900/10 border-t-blue-900 rounded-full animate-spin" />
                            <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Syncing Sthana Records...</p>
                        </div>
                    ) : sortedFilteredTemples.length === 0 ? (
                        <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                <Search className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-serif font-bold text-slate-900">No Records Found</h3>
                            <p className="text-slate-500 font-medium max-w-xs mx-auto mt-2">Adjust your filters or search terms to find the sthana you are looking for.</p>
                            <Button variant="link" onClick={() => { setSearchTerm(""); setSelectedDistrict("District"); setSelectedTaluka("Taluka"); setSelectedAvatarSambandh("ALL"); setSelectedStatus("Status"); }} className="text-blue-600 font-black mt-4 uppercase tracking-widest text-xs">
                                Clear all filters
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col lg:flex-row gap-8 items-start relative w-full">
                            {/* Directory Listing Column */}
                            <div className="flex-1 w-full min-w-0 space-y-12">
                                {/* Mobile Scroller (Horizontal sticky chip bar) - Only rendered on mobile */}
                                {isMobile && (
                                    <div className="sticky top-0 z-30 mb-6 bg-[#FDFCFB]/90 backdrop-blur-md py-2">
                                        <AlphabetScroller 
                                            activeLetter={activeLetter}
                                            onLetterClick={handleLetterClick}
                                            availableLetters={availableLetters}
                                            variant="horizontal"
                                        />
                                    </div>
                                )}

                                {/* Render grouped sections in alphabetical order */}
                                {Object.keys(groupedTemples)
                                    .sort((a, b) => {
                                        if (a === '#') return 1;
                                        if (b === '#') return -1;
                                        return a.localeCompare(b);
                                    })
                                    .map((letter) => (
                                        <AlphabetSection key={letter} letter={letter}>
                                            {groupedTemples[letter].map((temple) => (
                                                <SthanaCard
                                                    key={temple.id}
                                                    temple={temple}
                                                    sthanTypes={sthanTypes}
                                                    activeLang={activeLang}
                                                    getDisp={getDisp}
                                                    getSthanaStatus={getSthanaStatus}
                                                    getAvatarColor={getAvatarColor}
                                                    formatDate={formatDate}
                                                    handleDelete={handleDelete}
                                                    onEdit={(id) => navigate(`/admin/temples/${id}/edit`)}
                                                />
                                            ))}
                                        </AlphabetSection>
                                    ))}
                            </div>

                            {/* Desktop/Tablet Scroller (Vertical Sticky Sidebar) - right side only */}
                            {!isMobile && (
                                <div className="sticky top-8 self-start z-20 shrink-0 pr-2">
                                    <AlphabetScroller 
                                        activeLetter={activeLetter}
                                        onLetterClick={handleLetterClick}
                                        availableLetters={availableLetters}
                                        variant="vertical"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </AdminLayout>
    );
}
