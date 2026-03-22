"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog';
import { Plus, Trash2, Pencil, GripVertical, ChevronRight, Lock, AlertTriangle, Eye } from 'lucide-react';
import {
    createSthanType, updateSthanType, deleteSthanType,
    getSthanPinInfo, updateSthanTypesOrder, PIN_SERIES, AVATAR_SAMBANDH_CONFIG, TOTAL_STHAN_COUNT, getAvatarColor,
    validateSthanType, checkSthanTypeUsage,
} from '@/shared/utils/sthanTypes';
import { SthanType, PinType } from '@/shared/types/sthanType';
import { useToast } from '@/shared/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useSthanTypes } from '@/shared/contexts/SthanTypesContext';
import { cn } from '@/shared/lib/utils';

export function SthanTypeManager() {
    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [savingLoading, setSavingLoading] = useState(false);

    // Dependency check + delete confirmation state
    const [deleteTarget, setDeleteTarget] = useState<SthanType | null>(null);
    const [usageCheck, setUsageCheck] = useState<{ count: number; names: string[] } | null>(null);
    const [checkingUsage, setCheckingUsage] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    // ── Form state ──
    const [name, setName] = useState('');
    // Locked after creation – only settable on new types
    const [avatarSambandh, setAvatarSambandh] = useState<string>('');
    const [avatarSubdivision, setAvatarSubdivision] = useState<string>('');
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [pinType, setPinType] = useState<PinType>('');
    const [color, setColor] = useState('#94A3B8');
    // Track whether any field has been touched (for mandatory pin error)
    const [showPinError, setShowPinError] = useState(false);

    const { toast } = useToast();
    const { sthanTypes, refreshSthanTypes } = useSthanTypes();

    // ── Avatar Sambandh selection ──
    const handleAvatarChange = (id: string) => {
        const val = id === '__none__' ? '' : id;
        setAvatarSambandh(val);
        setAvatarSubdivision('');

        const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === val);
        if (cfg) {
            setColor(cfg.color);
            const seriesMap: Record<string, string> = {
                'shri-krishna': '1',
                'shri-dattatray': '2',
                'shri-chakrapani': '3',
                'shri-govind': '4',
                'shri-chakradhar': '5',
                'mandalik': '6',
            };
            const sid = seriesMap[val] || '';
            if (sid) handleSeriesChange(sid);
            else { setSelectedSeriesId(''); setPinType(''); }
        } else {
            setColor('#94A3B8');
            setSelectedSeriesId('');
            setPinType('');
        }
    };

    const selectedAvatarCfg = useMemo(
        () => AVATAR_SAMBANDH_CONFIG.find(a => a.id === avatarSambandh) ?? null,
        [avatarSambandh],
    );
    const hasSubdivisions = (selectedAvatarCfg?.subdivisions.length ?? 0) > 0;

    const handleSeriesChange = (seriesId: string) => {
        const series = PIN_SERIES.find(s => s.id === seriesId);
        if (!series) return;
        setSelectedSeriesId(seriesId);
        setColor(series.defaultColor);
        if (series.files.length > 0) {
            setPinType(`${series.folder}/${series.files[0]}` as PinType);
        }
    };

    // ── Submit: create or update ──
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowPinError(false);

        const subdivisionVal = avatarSubdivision || null;

        // Run strict validation
        const validation = validateSthanType(
            { name, avatarSambandh, avatarSubdivision: subdivisionVal, pinType },
            sthanTypes,
            editingId,
        );

        if (!validation.valid) {
            if (validation.field === 'pinType') setShowPinError(true);
            toast({ title: 'Validation Error', description: validation.message, variant: 'destructive' });
            return;
        }

        // For edit: only name + pinType allowed (avatar locked)
        if (editingId && hasSubdivisions && !avatarSubdivision) {
            toast({ title: 'Validation Error', description: 'Avatar Sub Type is required.', variant: 'destructive' });
            return;
        }

        setSavingLoading(true);
        try {
            if (editingId) {
                await updateSthanType(editingId, { name, color, pinType });
                toast({ title: 'Success', description: 'Sthan type updated successfully' });
            } else {
                const maxOrder = sthanTypes.length > 0 ? Math.max(...sthanTypes.map(t => t.order || 0)) : 0;
                const subCfg = selectedAvatarCfg?.subdivisions.find(s => s.id === avatarSubdivision);
                const legacyAvatarType = subCfg
                    ? `${selectedAvatarCfg?.label} – ${subCfg.label}`
                    : selectedAvatarCfg?.label || '';

                await createSthanType({
                    name, color, pinType,
                    order: maxOrder + 1,
                    avatarSambandh,
                    avatarSubdivision: subdivisionVal,
                    avatarType: legacyAvatarType,
                });
                toast({ title: 'Success', description: 'Sthan type created successfully' });
            }
            resetForm();
            refreshSthanTypes();
        } catch {
            toast({ title: 'Error', description: 'Failed to save sthan type', variant: 'destructive' });
        } finally {
            setSavingLoading(false);
        }
    };

    const handleEdit = (type: SthanType) => {
        setEditingId(type.id);
        setName(type.name);
        setColor(type.color);
        setAvatarSambandh(type.avatarSambandh || '');
        setAvatarSubdivision(type.avatarSubdivision || '');

        const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === type.avatarSambandh);
        if (cfg) setColor(type.color || cfg.color);

        const pinTypePath = type.pinType || '';
        setPinType(pinTypePath as PinType);
        if (pinTypePath.startsWith('/icons/pins/')) {
            const series = PIN_SERIES.find(s => pinTypePath.includes(s.folder));
            if (series) setSelectedSeriesId(series.id);
        }
        setShowPinError(false);
    };

    // ── Delete flow: check usage first ──
    const handleDeleteRequest = async (type: SthanType) => {
        setDeleteTarget(type);
        setCheckingUsage(true);
        setDeleteDialogOpen(true);

        const usage = await checkSthanTypeUsage(type.id);
        setUsageCheck({ count: usage.count, names: usage.sthanaNames });
        setCheckingUsage(false);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget || !usageCheck || usageCheck.count > 0) return;
        setSavingLoading(true);
        try {
            await deleteSthanType(deleteTarget.id);
            toast({ title: 'Success', description: 'Sthan type deleted successfully' });
            refreshSthanTypes();
        } catch {
            toast({ title: 'Error', description: 'Failed to delete sthan type', variant: 'destructive' });
        } finally {
            setSavingLoading(false);
            setDeleteDialogOpen(false);
            setDeleteTarget(null);
            setUsageCheck(null);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;
        const src = result.source.index;
        const dst = result.destination.index;
        if (src === dst) return;

        const reordered = Array.from(sthanTypes);
        const [removed] = reordered.splice(src, 1);
        reordered.splice(dst, 0, removed);

        // Optimistic update via context isn't possible directly, but re-fetch will update
        try {
            await updateSthanTypesOrder(reordered);
            toast({ title: 'Success', description: 'Order updated' });
            refreshSthanTypes();
        } catch {
            toast({ title: 'Error', description: 'Failed to update order' });
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setAvatarSambandh('');
        setAvatarSubdivision('');
        setSelectedSeriesId('');
        setPinType('');
        setColor('#94A3B8');
        setShowPinError(false);
    };

    const selectedSeries = PIN_SERIES.find(s => s.id === selectedSeriesId);
    const avatarColor = getAvatarColor(avatarSambandh) || color;
    const isEditMode = !!editingId;

    // Live preview pin info
    const previewPin = pinType ? { src: pinType, filter: '' } : null;
    const previewAvatarCfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === avatarSambandh);

    // ── Live counts from DB (sthanTypes array) ──
    // Replaces static `av.count` from AVATAR_SAMBANDH_CONFIG
    const liveAvatarCounts = useMemo(() => {
        const byAvatar: Record<string, number> = {};
        for (const st of sthanTypes) {
            if (st.avatarSambandh) {
                byAvatar[st.avatarSambandh] = (byAvatar[st.avatarSambandh] || 0) + 1;
            }
        }
        return { total: sthanTypes.length, byAvatar };
    }, [sthanTypes]);

    return (
        <>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
                <DialogTrigger asChild>
                    <Button 
                        variant="outline" 
                        className="bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl h-12 px-6 border-slate-200 transition-all hover:scale-[1.02] active:scale-95 gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Manage Sthan Types
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                            <span>Manage Sthan Types</span>
                            {/* Avatar count summary chips – live from DB */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                    ALL {liveAvatarCounts.total}
                                </span>
                                {AVATAR_SAMBANDH_CONFIG.map(av => (
                                    <span
                                        key={av.id}
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border"
                                        style={{
                                            backgroundColor: `${av.color}15`,
                                            color: av.color,
                                            borderColor: `${av.color}40`,
                                        }}
                                    >
                                        {av.shortLabel} {liveAvatarCounts.byAvatar[av.id] ?? 0}
                                    </span>
                                ))}
                            </div>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
                        <div className="space-y-6">

                            {/* ── Add / Edit Form ── */}
                            <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl space-y-5 border border-slate-200">
                                <div className="flex items-center justify-between">
                                    <h3 className="font-semibold text-sm text-slate-700">
                                        {isEditMode ? 'Edit Sthan Type' : 'Add New Sthan Type'}
                                    </h3>
                                    {isEditMode && (
                                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
                                            <Lock className="w-3 h-3" />
                                            Edit Mode
                                        </span>
                                    )}
                                </div>

                                {/* Row 1: Sthan Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="stname">Sthan Type Name *</Label>
                                    <Input
                                        id="stname"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="e.g. Avasthan, Mahasthan, Vasti Sthan..."
                                        required
                                    />
                                </div>

                                {/* Row 2 + 3: Avatar Sambandh → Subdivision (locked in edit) */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">
                                            Primary Avatar *
                                            {isEditMode && <span className="ml-1.5 text-[10px] text-amber-600">(Locked)</span>}
                                        </Label>

                                        {isEditMode ? (
                                            /* LOCKED: show as read-only chip */
                                            <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-amber-200 bg-amber-50">
                                                {previewAvatarCfg && (
                                                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: previewAvatarCfg.color }} />
                                                )}
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {previewAvatarCfg?.label || avatarSambandh || '—'}
                                                </span>
                                                <Lock className="w-3 h-3 ml-auto text-amber-500 shrink-0" />
                                            </div>
                                        ) : (
                                            <Select value={avatarSambandh || '__none__'} onValueChange={handleAvatarChange}>
                                                <SelectTrigger className="w-full bg-white h-12 rounded-xl border-slate-200">
                                                    <SelectValue placeholder="— Select Avatar —">
                                                        {avatarSambandh && selectedAvatarCfg ? (
                                                            <span className="flex items-center gap-2">
                                                                <span className="w-3 h-3 rounded-full shrink-0 inline-block" style={{ backgroundColor: selectedAvatarCfg.color }} />
                                                                {selectedAvatarCfg.label}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-400">— Select Avatar —</span>
                                                        )}
                                                    </SelectValue>
                                                </SelectTrigger>
                                                <SelectContent className="max-h-72 z-[1100] rounded-xl border-slate-200 shadow-xl">
                                                    <SelectItem value="__none__">— None —</SelectItem>
                                                    {AVATAR_SAMBANDH_CONFIG.map(av => (
                                                        <SelectItem key={av.id} value={av.id} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                            <div className="flex items-center gap-2.5">
                                                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: av.color }} />
                                                                <div className="flex flex-col">
                                                                    <span className="font-semibold text-sm">{av.label}</span>
                                                                    <span className="text-[10px] text-slate-400">{av.count} Sthans</span>
                                                                </div>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    {/* Subdivision */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-bold text-slate-700">
                                            Avatar Sub Type {hasSubdivisions ? '*' : <span className="font-normal text-slate-400 text-xs">(N/A)</span>}
                                            {isEditMode && hasSubdivisions && <span className="ml-1.5 text-[10px] text-amber-600">(Locked)</span>}
                                        </Label>

                                        {isEditMode ? (
                                            /* LOCKED: show as read-only chip */
                                            <div className="flex items-center gap-2 h-12 px-3 rounded-xl border border-amber-200 bg-amber-50">
                                                {avatarSubdivision ? (
                                                    <>
                                                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                                        <span className="text-sm font-semibold text-slate-800">
                                                            {selectedAvatarCfg?.subdivisions.find(s => s.id === avatarSubdivision)?.label || avatarSubdivision}
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="text-slate-400 text-sm italic">None (N/A for this Avatar)</span>
                                                )}
                                                {hasSubdivisions && <Lock className="w-3 h-3 ml-auto text-amber-500 shrink-0" />}
                                            </div>
                                        ) : (
                                            <Select
                                                key={`subdiv-${avatarSambandh}`}
                                                value={avatarSubdivision || '__none__'}
                                                onValueChange={(v) => setAvatarSubdivision(v === '__none__' ? '' : v)}
                                                disabled={!hasSubdivisions}
                                            >
                                                <SelectTrigger className="w-full bg-white h-12 rounded-xl border-slate-200 disabled:bg-slate-50 disabled:opacity-50">
                                                    <SelectValue placeholder={hasSubdivisions ? 'Select Subdivision' : '— Not Applicable —'} />
                                                </SelectTrigger>
                                                <SelectContent className="max-h-72 z-[1100] rounded-xl border-slate-200 shadow-xl">
                                                    {hasSubdivisions ? (
                                                        selectedAvatarCfg!.subdivisions
                                                            .filter(sub => sub.id !== 'complete')
                                                            .map(sub => (
                                                                <SelectItem key={sub.id} value={sub.id} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                                    <div className="flex items-center justify-between gap-4 w-full">
                                                                        <span className="font-semibold text-sm">{sub.label}</span>
                                                                        <span className="text-[10px] text-slate-400">{sub.count} Sthans</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))
                                                    ) : (
                                                        <div className="px-3 py-2 text-sm text-slate-400 italic">This avatar has no sub-periods</div>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>
                                </div>

                                {/* Locked fields warning in edit mode */}
                                {isEditMode && (
                                    <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            <strong>Classification is locked.</strong> Avatar Sambandh and Subdivision cannot be changed after creation.
                                            To reassign, delete this type and create a new one.
                                        </p>
                                    </div>
                                )}

                                {/* Pin Series Dropdown */}
                                <div className="space-y-2">
                                    <Label htmlFor="pinSeries" className="text-sm font-bold text-slate-700">Pin Series *</Label>
                                    <Select
                                        key={`series-${avatarSambandh}`}
                                        value={selectedSeriesId}
                                        onValueChange={handleSeriesChange}
                                        disabled={!avatarSambandh && !isEditMode}
                                    >
                                        <SelectTrigger id="pinSeries" className="w-full bg-white h-12 rounded-xl border-slate-200 disabled:bg-slate-50 disabled:opacity-50">
                                            <SelectValue placeholder={avatarSambandh || isEditMode ? 'Select a pin series' : 'Select Avatar first'} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-[500px] z-[1100] rounded-xl border-slate-200 shadow-xl">
                                            {PIN_SERIES.map(series => (
                                                <SelectItem key={series.id} value={series.id} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 p-1 shrink-0">
                                                            <img src={`${series.folder}/${series.files[0]}`} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">{series.name}</span>
                                                            <span className="text-[10px] text-slate-400 font-medium">{series.files.length} Styles Available</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Visual Pin Selector Grid */}
                                {selectedSeries && (
                                    <div className={cn(
                                        "space-y-3 animate-in fade-in slide-in-from-top-2 duration-300",
                                        showPinError && "ring-2 ring-red-400 rounded-2xl p-2"
                                    )}>
                                        <div className="flex items-center justify-between px-1">
                                            <Label className="text-sm font-bold text-slate-700">
                                                Visual Selector *
                                                {showPinError && <span className="ml-2 text-red-500 text-[10px] font-bold normal-case">Select a pin to continue</span>}
                                            </Label>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                                {selectedSeries.files.length} Styles
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
                                            {selectedSeries.files.map((file) => {
                                                const fullPath = `${selectedSeries.folder}/${file}`;
                                                const isSelected = pinType === fullPath;
                                                return (
                                                    <button
                                                        key={file}
                                                        type="button"
                                                        onClick={() => { setPinType(fullPath as PinType); setShowPinError(false); }}
                                                        className={`group relative flex flex-col items-center gap-2 p-2.5 rounded-xl border-2 transition-all ${isSelected
                                                            ? 'border-blue-500 bg-blue-50/50 shadow-md scale-105 z-10'
                                                            : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50 active:scale-95'
                                                            }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white rounded-full p-0.5 shadow-sm ring-2 ring-white z-20">
                                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                    <polyline points="20 6 9 17 4 12" />
                                                                </svg>
                                                            </div>
                                                        )}
                                                        <div className={`relative w-10 h-10 transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'}`}>
                                                            <img
                                                                src={fullPath}
                                                                alt={file}
                                                                className="relative z-10 w-full h-full object-contain drop-shadow-sm"
                                                            />
                                                        </div>
                                                        <span className={`text-[10px] font-bold truncate w-full text-center transition-colors ${isSelected ? 'text-blue-600' : 'text-slate-500'}`}>
                                                            {file.replace('.svg', '').replace('.png', '')}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* ── Live Preview Panel ── */}
                                {(name || pinType) && (
                                    <div className="animate-in fade-in duration-300">
                                        <Label className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                                            <Eye className="w-4 h-4 text-slate-400" />
                                            Live Preview
                                        </Label>
                                        <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
                                            {/* Avatar color band */}
                                            <div
                                                className="w-1.5 self-stretch rounded-full shrink-0"
                                                style={{ backgroundColor: avatarColor }}
                                            />
                                            {/* Pin icon */}
                                            <div className="w-14 h-14 flex items-center justify-center bg-slate-50 rounded-xl border border-slate-100 shrink-0">
                                                {pinType ? (
                                                    <img src={pinType} alt="Pin Preview" className="w-10 h-10 object-contain drop-shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-lg bg-slate-200 animate-pulse" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-bold text-base text-slate-900 truncate">{name || <span className="text-slate-400 italic">Type name…</span>}</p>
                                                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                                    {previewAvatarCfg && (
                                                        <span
                                                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border"
                                                            style={{ backgroundColor: `${avatarColor}15`, color: avatarColor, borderColor: `${avatarColor}40` }}
                                                        >
                                                            <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: avatarColor }} />
                                                            {previewAvatarCfg.shortLabel}
                                                        </span>
                                                    )}
                                                    {avatarSubdivision && selectedAvatarCfg?.subdivisions.find(s => s.id === avatarSubdivision) && (
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                                            <ChevronRight className="w-2.5 h-2.5" />
                                                            {selectedAvatarCfg?.subdivisions.find(s => s.id === avatarSubdivision)?.label}
                                                        </span>
                                                    )}
                                                    {pinType && (
                                                        <span className="text-[10px] text-slate-400 font-medium">{pinType.split('/').pop()}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-1">
                                    <Button
                                        type="submit"
                                        disabled={savingLoading || !pinType}
                                        className={cn(!pinType && "opacity-50 cursor-not-allowed")}
                                        onClick={() => { if (!pinType) setShowPinError(true); }}
                                    >
                                        {savingLoading ? 'Saving...' : isEditMode ? 'Update' : 'Add Sthan Type'}
                                    </Button>
                                    {isEditMode && (
                                        <Button type="button" variant="ghost" onClick={resetForm}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>

                            {/* ── Existing Sthan Types ── */}
                            <div className="space-y-3">
                                <h3 className="font-semibold text-sm text-slate-700">Existing Sthan Types</h3>

                                {sthanTypes.length === 0 ? (
                                    <div className="text-sm text-slate-500 py-8 text-center">
                                        No sthan types yet. Add one above.
                                    </div>
                                ) : (
                                    <DragDropContext onDragEnd={handleDragEnd}>
                                        <Droppable droppableId="sthan-types">
                                            {(provided) => (
                                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                                    {sthanTypes.map((type, index) => {
                                                        const avatarCfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === type.avatarSambandh);
                                                        const subCfg = avatarCfg?.subdivisions.find(s => s.id === type.avatarSubdivision);
                                                        const typeAvatarColor = avatarCfg?.color || type.color || '#94A3B8';

                                                        return (
                                                            <Draggable key={type.id} draggableId={type.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all ${snapshot.isDragging
                                                                            ? 'shadow-lg border-blue-200 z-50'
                                                                            : 'border-slate-200 hover:bg-slate-50'
                                                                            }`}
                                                                        style={{
                                                                            ...provided.draggableProps.style,
                                                                            borderLeftColor: typeAvatarColor,
                                                                            borderLeftWidth: '3px',
                                                                        }}
                                                                    >
                                                                        <div {...provided.dragHandleProps} className="p-1 hover:bg-slate-100 rounded cursor-grab">
                                                                            <GripVertical className="w-4 h-4 text-slate-400" />
                                                                        </div>

                                                                        {/* Pin icon */}
                                                                        {(() => {
                                                                            const { src, filter } = getSthanPinInfo(type.color, type.pinType);
                                                                            return (
                                                                                <div className="relative w-8 h-8 flex-shrink-0">
                                                                                    <img
                                                                                        src={src}
                                                                                        style={filter ? { filter } : undefined}
                                                                                        alt={type.name}
                                                                                        className="relative w-full h-full object-contain drop-shadow-sm"
                                                                                    />
                                                                                </div>
                                                                            );
                                                                        })()}

                                                                        {/* Info */}
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="font-bold text-sm text-[#1E3A8A]">{type.name}</div>
                                                                            <div className="flex items-center gap-1.5 flex-wrap mt-1">
                                                                                {avatarCfg && (
                                                                                    <span
                                                                                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border shadow-sm"
                                                                                        style={{
                                                                                            backgroundColor: `${getAvatarColor(avatarCfg.id)}15`,
                                                                                            color: getAvatarColor(avatarCfg.id),
                                                                                            borderColor: `${getAvatarColor(avatarCfg.id)}40`,
                                                                                        }}
                                                                                    >
                                                                                        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: getAvatarColor(avatarCfg.id) }} />
                                                                                        {avatarCfg.shortLabel}
                                                                                    </span>
                                                                                )}
                                                                                {subCfg && (
                                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                                                                        <ChevronRight className="w-2.5 h-2.5" />
                                                                                        {subCfg.label}
                                                                                    </span>
                                                                                )}
                                                                                {(() => {
                                                                                    const seriesMatch = PIN_SERIES.find(s => type.pinType?.includes(s.folder));
                                                                                    if (seriesMatch) {
                                                                                        const fileName = type.pinType?.split('/').pop() || '';
                                                                                        return <span className="text-[10px] text-slate-400 font-medium">{seriesMatch.name.split('(')[0].trim()} · {fileName}</span>;
                                                                                    }
                                                                                    return <span className="text-[10px] text-slate-400">Legacy Pin</span>;
                                                                                })()}
                                                                            </div>
                                                                        </div>

                                                                        {/* Actions */}
                                                                        <div className="flex gap-1">
                                                                            <Button size="sm" variant="ghost" onClick={() => handleEdit(type)} className="h-8 w-8 p-0">
                                                                                <Pencil className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                            <Button
                                                                                size="sm"
                                                                                variant="ghost"
                                                                                onClick={() => handleDeleteRequest(type)}
                                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                            >
                                                                                <Trash2 className="w-3.5 h-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        );
                                                    })}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* ── Delete Confirmation Dialog ── */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-red-600" />
                            Delete "{deleteTarget?.name}"?
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3 text-sm">
                                {checkingUsage ? (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin" />
                                        Checking Sthana usage...
                                    </div>
                                ) : usageCheck && usageCheck.count > 0 ? (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                                        <p className="font-bold text-red-700 flex items-center gap-1.5">
                                            <AlertTriangle className="w-4 h-4" />
                                            Cannot delete — used in {usageCheck.count} Sthana{usageCheck.count > 1 ? 's' : ''}
                                        </p>
                                        <ul className="list-disc list-inside text-red-600 text-xs space-y-0.5 max-h-24 overflow-y-auto">
                                            {usageCheck.names.slice(0, 5).map((n, i) => <li key={i}>{n}</li>)}
                                            {usageCheck.names.length > 5 && (
                                                <li className="font-semibold">…and {usageCheck.names.length - 5} more</li>
                                            )}
                                        </ul>
                                        <p className="text-xs text-red-500">Reassign these Sthanas to a different type before deleting.</p>
                                    </div>
                                ) : (
                                    <p className="text-slate-600">
                                        This type is not used by any Sthana. Are you sure you want to permanently delete it?
                                        This action cannot be undone.
                                    </p>
                                )}
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {usageCheck && usageCheck.count === 0 && (
                            <AlertDialogAction
                                onClick={handleDeleteConfirm}
                                disabled={savingLoading}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                {savingLoading ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                        )}
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
