import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { ArrowLeft, Edit3, Image as ImageIcon, FileText } from "lucide-react";
import { cn } from "@/shared/lib/utils";

import TempleForm from "@/shared/components/admin/TempleForm";
import TempleArchitectureAdmin from "./TempleArchitectureAdmin";

export default function ManageSthana() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [templeData, setTempleData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'info' | 'architecture'>('info');

    useEffect(() => {
        if (!id) return;
        const fetchTemple = async () => {
            try {
                const snap = await getDoc(doc(db, "temples", id));
                if (snap.exists()) {
                    setTempleData(snap.data());
                }
            } catch (e) {
                console.error("Failed to load sthana for manager:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchTemple();
    }, [id]);

    if (loading) {
        return (
            <AdminLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
            </AdminLayout>
        );
    }

    if (!templeData) {
        return (
            <AdminLayout>
                <div className="p-10 text-center">
                    <h2 className="text-xl font-bold">Sthana Not Found</h2>
                    <Button className="mt-4" onClick={() => navigate("/admin/sthana-directory")}>
                        Return to Directory
                    </Button>
                </div>
            </AdminLayout>
        );
    }

    // Determine architecture status mapping
    const hasArchitecture = templeData.hasArchitecture !== undefined 
        ? templeData.hasArchitecture 
        : (templeData.isStandalone !== undefined ? !templeData.isStandalone : (!!templeData.architectureImage || !!templeData.architectureImages?.length));

    // Because TempleForm and TempleArchitectureAdmin have their own "AdminLayout" or full page styles,
    // we use a neat CSS trick to hide their native top-navs/headers when rendered inside this tab view
    return (
        <AdminLayout>
            <div className="min-h-screen bg-[#F9F6F0] -m-6 p-0 flex flex-col hide-child-headers">
                
                {/* Unified Tab Header */}
                <div className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate("/admin/sthana-directory")}
                            className="p-0 hover:bg-transparent text-slate-500 hover:text-slate-800"
                        >
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center mr-3">
                                <ArrowLeft className="w-4 h-4" />
                            </div>
                            <span className="font-bold hidden sm:inline">Directory</span>
                        </Button>
                        
                        <div className="h-6 w-px bg-slate-200" />
                        
                        <div>
                            <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                {templeData.name}
                                {hasArchitecture ? (
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                        Architecture
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        Standalone
                                    </span>
                                )}
                            </h1>
                        </div>
                    </div>

                    {/* Tab Navigation Controls */}
                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                activeTab === 'info' 
                                    ? "bg-white text-blue-700 shadow-sm" 
                                    : "text-slate-500 hover:text-slate-700"
                            )}
                        >
                            <Edit3 className="w-4 h-4" />
                            Sthan Info
                        </button>
                        
                        {hasArchitecture ? (
                            <button
                                onClick={() => setActiveTab('architecture')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    activeTab === 'architecture' 
                                        ? "bg-white text-amber-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <ImageIcon className="w-4 h-4" />
                                Architecture & Details
                            </button>
                        ) : (
                            <button
                                onClick={() => setActiveTab('architecture')}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                                    activeTab === 'architecture' 
                                        ? "bg-white text-emerald-700 shadow-sm" 
                                        : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                <FileText className="w-4 h-4" />
                                Details & Media
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 relative overflow-auto">
                    {/* Add global CSS to hide redundant headers from child components */}
                    <style>{`
                        .hide-child-headers .bg-white.p-2.rounded-2xl.shadow-sm, /* TempleForm top header */
                        .hide-child-headers .admin-layout-wrapper > header, /* AdminLayout header if nested */
                        .hide-child-headers .temple-arch-header /* Any custom header in TempleArchitectureAdmin */
                        { display: none !important; }
                    `}</style>

                    <div className={cn(
                        "transition-opacity duration-300",
                        activeTab === 'info' ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"
                    )}>
                        <TempleForm templeId={id} />
                    </div>

                    <div className={cn(
                        "transition-opacity duration-300",
                        activeTab === 'architecture' ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 pointer-events-none"
                    )}>
                        <TempleArchitectureAdmin />
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
