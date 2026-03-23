import React from "react";
import { Check, LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface SthanaIdentifierProps {
    id: string;
    templeData: {
        name: string;
        status?: string;
        reviewStatus?: string;
        sthan?: string;
        primaryAvatar?: string;
        avatarSambandh?: string;
        district?: string;
    };
    hasArchitecture: boolean;
    activeStep: 'sthan-info' | 'architecture-view' | 'sthana-details';
    className?: string;
}

export const SthanaIdentifier: React.FC<SthanaIdentifierProps> = ({
    id,
    templeData,
    hasArchitecture,
    activeStep,
    className
}) => {
    return (
        <div className={cn("space-y-16", className)}>
            {/* Card Header matching Form Section Header style */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100/50 shadow-inner group-hover:scale-105 transition-transform duration-500">
                        <img src="/icons/Main logo.svg" alt="Logo" className="w-7 h-7 object-contain opacity-90" />
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Identity</p>
                        <p className="text-[10px] font-bold font-mono tracking-tight text-slate-300 mt-0.5">#{id?.slice(0, 8)}</p>
                    </div>
                </div>

                <div>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-bold uppercase tracking-widest mb-1.5">
                        STHANA PROFILE
                    </p>
                    <h2 className="text-xl font-black tracking-tight leading-tight text-slate-900 uppercase">{templeData.name}</h2>
                    <div className="flex flex-wrap gap-2 mt-4">
                        {hasArchitecture ? (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 border border-blue-100/50 px-3 py-1.5 rounded-full">
                                🏛️ Architecture
                            </span>
                        ) : (
                            <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100/50 px-3 py-1.5 rounded-full">
                                📍 Standalone
                            </span>
                        )}
                    </div>
                </div>

                <div className="h-px bg-slate-100/80" />

                <div className="space-y-5">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Status</span>
                        <div className="flex flex-col items-end gap-1.5">
                            <div className="flex items-center gap-2">
                                {templeData.status === 'PUBLISHED' && <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100/50">Published</span>}
                                {templeData.status === 'VERIFIED' && <span className="text-[10px] font-black uppercase bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg border border-emerald-100/50">Verified</span>}
                                {templeData.status === 'COMPLETE' && <span className="text-[10px] font-black uppercase bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg border border-blue-100/50">Complete</span>}
                                {(!templeData.status || templeData.status === 'DRAFT') && <span className="text-[10px] font-black uppercase bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-200/50">Draft</span>}
                                {templeData.status === 'IN_PROGRESS' && <span className="text-[10px] font-black uppercase bg-amber-50 text-amber-600 px-3 py-1.5 rounded-lg border border-amber-100/50">In Progress</span>}
                            </div>
                            {templeData.reviewStatus === 'CHANGES_REQUIRED' && (
                                <span className="text-[9px] font-black uppercase bg-red-50 text-red-600 px-2 py-1 rounded-md border border-red-100/50 animate-pulse">
                                    Changes Requested
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 space-y-5">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Metadata Details</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-500">Sthan Type</span>
                                <span className="text-[11px] font-bold text-slate-800">{templeData.sthan || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-500">Main Avatar</span>
                                <span className="text-[11px] font-bold text-slate-800 truncate pl-4">{templeData.primaryAvatar || templeData.avatarSambandh || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-medium text-slate-500">District</span>
                                <span className="text-[11px] font-bold text-slate-800">{templeData.district || '—'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-2">
                    <div className="flex items-center gap-3 bg-blue-50/40 p-4 rounded-2xl border border-blue-100/30 group/inner">
                        <Check className="w-4 h-4 text-blue-400 group-hover/inner:scale-110 transition-transform" />
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">
                            {activeStep === 'sthan-info' && "Ensure the coordinates are precise for pilgrims."}
                            {activeStep === 'architecture-view' && "Wait for images to upload before mapping."}
                            {activeStep === 'sthana-details' && "Review final metadata before publishing."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
