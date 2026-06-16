import React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import {
    MapPin,
    Eye,
    Edit,
    Trash2,
    EyeOff,
    Globe,
    ShieldCheck,
    CheckCircle2,
    FileEdit,
    Clock,
    MessageSquare,
    Wrench
} from "lucide-react";
import { motion } from "framer-motion";

interface SthanaCardProps {
    temple: any;
    sthanTypes: any[];
    activeLang: 'en' | 'hi' | 'mr';
    getDisp: (val: any) => string;
    getSthanaStatus: (t: any) => string;
    getAvatarColor: (avatarId: any) => string | undefined;
    formatDate: (date: Date) => string;
    handleDelete: (id: string, name: string) => void;
    onEdit: (id: string) => void;
}

export const SthanaCard: React.FC<SthanaCardProps> = ({
    temple,
    sthanTypes,
    activeLang,
    getDisp,
    getSthanaStatus,
    getAvatarColor,
    formatDate,
    handleDelete,
    onEdit
}) => {
    const isStandalone = temple.hasArchitecture === false || temple.isStandalone === true;

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            className="bg-white p-5 sm:p-6 rounded-[32px] border border-slate-200/90 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-500 group relative flex flex-col sm:flex-row items-stretch sm:items-center gap-6"
        >
            {/* Thumbnail */}
            <div className="w-full sm:w-40 h-56 sm:h-32 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                <img
                    src={temple.sthanImages?.[0] || temple.images?.[0] || "/placeholder-temple.jpg"}
                    alt={getDisp(temple.name)}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="%23cbd5e1"><rect width="100%" height="100%" fill="%23f1f5f9"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>';
                    }}
                />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-2xl font-serif font-black text-slate-900 truncate max-w-[400px]">
                            {getDisp(temple.name)}
                        </h3>
                        {(() => {
                            const derivedStatus = temple.status || getSthanaStatus(temple);
                            
                            const statusConfigs: Record<string, { label: string, color: string, icon: any }> = {
                                'PUBLISHED': { label: 'Published', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: Globe },
                                'VERIFIED': { label: 'Verified', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: ShieldCheck },
                                'COMPLETE': { label: 'Complete', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle2 },
                                'IN_PROGRESS': { label: 'In Progress', color: 'bg-orange-50 text-orange-600 border-orange-100', icon: FileEdit },
                                'DRAFT': { label: 'Draft', color: 'bg-slate-50 text-slate-500 border-slate-200', icon: Clock }
                            };

                            const config = statusConfigs[derivedStatus] || statusConfigs['DRAFT'];
                            const Icon = config.icon;

                            return (
                                <span className={cn("inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border gap-1.5 shadow-sm", config.color)}>
                                    <Icon className="w-3.5 h-3.5" />
                                    {config.label}
                                </span>
                            );
                        })()}
                        
                        {temple.reviewStatus === "CHANGES_REQUIRED" && (
                            <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border gap-1.5 shadow-sm bg-amber-50 text-amber-600 border-amber-100">
                                <Wrench className="w-3.5 h-3.5" />
                                Fix Requested
                            </span>
                        )}

                        {(() => {
                            const openComments = temple.reviewComments?.filter((c: any) => c.status === "OPEN").length || 0;
                            if (openComments > 0) {
                                return (
                                    <span className="inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border gap-1.5 shadow-sm bg-red-50 text-red-500 border-red-100">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                        {openComments} Open
                                    </span>
                                );
                            }
                            return null;
                        })()}

                        {isStandalone && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest border border-slate-800 shadow-sm">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                Standalone
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-slate-500 text-sm font-medium">
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span>{temple.city ? `${getDisp(temple.city)}, ` : ''}{getDisp(temple.district)}</span>
                        </div>
                        <div className="w-1 h-1 rounded-full bg-slate-200" />
                        <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">ID: {temple.id?.slice(-8).toUpperCase()}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Sthan Type Badge */}
                    {temple.sthan && (
                        (() => {
                            const typeInfo = sthanTypes.find(st => st.name === getDisp(temple.sthan));
                            const avatarColor = getAvatarColor(typeInfo?.avatarSambandh);
                            return (
                                <div 
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-2xl border bg-white shadow-sm"
                                    style={{ borderColor: `${avatarColor}20` }}
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: avatarColor || typeInfo?.color || '#94a3b8' }} />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">
                                        {getDisp(temple.sthan)}
                                    </span>
                                </div>
                            );
                        })()
                    )}
                    <div className="h-4 w-px bg-slate-100 mx-1" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Added {formatDate(temple.createdAtDate)}
                    </p>
                </div>
            </div>

            {/* Actions */}
            <div className="flex sm:flex-row items-center gap-2 mt-4 sm:mt-0 pt-4 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                        "h-12 w-12 rounded-2xl transition-all duration-300 outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                        isStandalone
                            ? "bg-slate-50 text-slate-200 cursor-not-allowed opacity-50"
                            : "bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white hover:scale-110 shadow-sm"
                    )}
                    onClick={() => {
                        if (!isStandalone) {
                            window.open(`/temple/${temple.id}/architecture`, '_blank');
                        }
                    }}
                    title={isStandalone ? "No architecture page (standalone sthan)" : "View Public Architecture"}
                    disabled={isStandalone}
                >
                    {isStandalone ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-900 hover:text-white hover:scale-110 transition-all duration-300 border border-slate-100 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    onClick={() => onEdit(temple.id)}
                    title="Edit Sthana Details"
                >
                    <Edit className="w-5 h-5" />
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-12 w-12 rounded-2xl bg-red-50 text-red-500 hover:bg-red-600 hover:text-white hover:scale-110 transition-all duration-300 border border-red-100 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    onClick={() => handleDelete(temple.id, getDisp(temple.name))}
                    title="Delete Permanently"
                >
                    <Trash2 className="w-5 h-5" />
                </Button>
            </div>
        </motion.div>
    );
};
