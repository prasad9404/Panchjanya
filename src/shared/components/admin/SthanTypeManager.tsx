"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Trash2, Pencil, GripVertical, ChevronRight } from 'lucide-react';
import {
    getSthanTypes, createSthanType, updateSthanType, deleteSthanType,
    getSthanPinInfo, updateSthanTypesOrder, PIN_SERIES, AVATAR_SAMBANDH_CONFIG, TOTAL_STHAN_COUNT, getAvatarColor,
} from '@/shared/utils/sthanTypes';
import { SthanType, PinType } from '@/shared/types/sthanType';
import { useToast } from '@/shared/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';


export function SthanTypeManager() {
    const [open, setOpen] = useState(false);
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // ── Form state ──
    const [name, setName] = useState('');
    const [avatarSambandh, setAvatarSambandh] = useState<string>('');
    const [avatarSubdivision, setAvatarSubdivision] = useState<string>('');
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [pinType, setPinType] = useState<PinType>('');
    const [color, setColor] = useState('#94A3B8');

    const { toast } = useToast();

    useEffect(() => {
        if (open) loadSthanTypes();
    }, [open]);

    const loadSthanTypes = async () => {
        setLoading(true);
        try {
            const types = await getSthanTypes();
            setSthanTypes(types);
        } catch {
            toast({ title: 'Error', description: 'Failed to load sthan types', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    // ── Avatar Sambandh selection ──
    const handleAvatarChange = (id: string) => {
        const val = id === '__none__' ? '' : id;
        setAvatarSambandh(val);
        setAvatarSubdivision('');

        // Auto-set color from avatar config
        const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === val);
        if (cfg) {
            setColor(cfg.color);
            // Auto-select matching PIN_SERIES by avatar
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

    // ── Subdivision specific options ──
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({ title: 'Validation Error', description: 'Please enter a sthan type name', variant: 'destructive' });
            return;
        }
        if (!avatarSambandh) {
            toast({ title: 'Validation Error', description: 'Please select an Avatar Sambandh', variant: 'destructive' });
            return;
        }
        if (hasSubdivisions && !avatarSubdivision) {
            toast({ title: 'Validation Error', description: 'Please select a Subdivision', variant: 'destructive' });
            return;
        }
        if (!selectedSeriesId) {
            toast({ title: 'Validation Error', description: 'Please select a Pin Series', variant: 'destructive' });
            return;
        }
        if (!pinType) {
            toast({ title: 'Validation Error', description: 'Please select a Pin Style', variant: 'destructive' });
            return;
        }

        // Build a human-readable avatarType for backward compat
        const subCfg = selectedAvatarCfg?.subdivisions.find(s => s.id === avatarSubdivision);
        const legacyAvatarType = subCfg
            ? `${selectedAvatarCfg?.label} – ${subCfg.label}`
            : selectedAvatarCfg?.label || '';

        setLoading(true);
        try {
            if (editingId) {
                await updateSthanType(editingId, {
                    name, color, pinType,
                    avatarSambandh,
                    avatarSubdivision: avatarSubdivision || undefined,
                    avatarType: legacyAvatarType,
                });
                toast({ title: 'Success', description: 'Sthan type updated successfully' });
            } else {
                const order = sthanTypes.length + 1;
                await createSthanType({
                    name, color, order, pinType,
                    avatarSambandh,
                    avatarSubdivision: avatarSubdivision || undefined,
                    avatarType: legacyAvatarType,
                });
                toast({ title: 'Success', description: 'Sthan type created successfully' });
            }
            resetForm();
            loadSthanTypes();
        } catch {
            toast({ title: 'Error', description: 'Failed to save sthan type', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type: SthanType) => {
        setEditingId(type.id);
        setName(type.name);
        setColor(type.color);

        // Prefer new fields; fall back to parsing legacy avatarType
        if (type.avatarSambandh) {
            setAvatarSambandh(type.avatarSambandh);
            setAvatarSubdivision(type.avatarSubdivision || '');
            // Re-sync series color
            const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === type.avatarSambandh);
            if (cfg) setColor(type.color || cfg.color);
        } else {
            setAvatarSambandh('');
            setAvatarSubdivision('');
        }

        const pinTypePath = type.pinType || '';
        setPinType(pinTypePath as PinType);
        if (pinTypePath.startsWith('/icons/pins/')) {
            const series = PIN_SERIES.find(s => pinTypePath.includes(s.folder));
            if (series) setSelectedSeriesId(series.id);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sthan type? This cannot be undone.')) return;
        setLoading(true);
        try {
            await deleteSthanType(id);
            toast({ title: 'Success', description: 'Sthan type deleted successfully' });
            loadSthanTypes();
        } catch {
            toast({ title: 'Error', description: 'Failed to delete sthan type', variant: 'destructive' });
        } finally {
            setLoading(false);
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
        setSthanTypes(reordered);

        try {
            await updateSthanTypesOrder(reordered);
            toast({ title: 'Success', description: 'Order updated' });
        } catch {
            toast({ title: 'Error', description: 'Failed to update order', variant: 'destructive' });
            loadSthanTypes();
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
    };

    const selectedSeries = PIN_SERIES.find(s => s.id === selectedSeriesId);

    // Group sthan types by avatarSambandh for the list display
    const groupedList = useMemo(() => {
        const groups: Record<string, SthanType[]> = {};
        for (const st of sthanTypes) {
            const key = st.avatarSambandh || '__unassigned__';
            if (!groups[key]) groups[key] = [];
            groups[key].push(st);
        }
        return groups;
    }, [sthanTypes]);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Manage Sthan Types
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 flex flex-col">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle className="flex items-center justify-between flex-wrap gap-2">
                        <span>Manage Sthan Types</span>
                        {/* Avatar count summary chips */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                ALL {TOTAL_STHAN_COUNT}
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
                                    {av.shortLabel} {av.count}
                                </span>
                            ))}
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
                    <div className="space-y-6">

                        {/* ── Add / Edit Form ── */}
                        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-xl space-y-5 border border-slate-200">
                            <h3 className="font-semibold text-sm text-slate-700">
                                {editingId ? 'Edit Sthan Type' : 'Add New Sthan Type'}
                            </h3>

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

                            {/* Row 2 + 3: Avatar Sambandh → Subdivision (cascade) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Level 1: Avatar Sambandh */}
                                <div className="space-y-2">
                                    <Label htmlFor="avatarSambandh" className="text-sm font-bold text-slate-700">
                                        Avatar Sambandh *
                                    </Label>
                                    <Select value={avatarSambandh || '__none__'} onValueChange={handleAvatarChange}>
                                        <SelectTrigger
                                            id="avatarSambandh"
                                            className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                        >
                                            <SelectValue placeholder="— Select Avatar —">
                                                {avatarSambandh && selectedAvatarCfg ? (
                                                    <span className="flex items-center gap-2">
                                                        <span
                                                            className="w-3 h-3 rounded-full shrink-0 inline-block"
                                                            style={{ backgroundColor: selectedAvatarCfg.color }}
                                                        />
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
                                                        <span
                                                            className="w-3 h-3 rounded-full shrink-0"
                                                            style={{ backgroundColor: av.color }}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold text-sm">{av.label}</span>
                                                            <span className="text-[10px] text-slate-400">{av.count} Sthans</span>
                                                        </div>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Level 2: Subdivision (conditional) */}
                                <div className="space-y-2">
                                    <Label htmlFor="avatarSubdivision" className="text-sm font-bold text-slate-700">
                                        Subdivision {hasSubdivisions ? '*' : <span className="font-normal text-slate-400 text-xs">(N/A)</span>}
                                    </Label>
                                    <Select
                                        key={`subdiv-${avatarSambandh}`}
                                        value={avatarSubdivision || '__none__'}
                                        onValueChange={(v) => setAvatarSubdivision(v === '__none__' ? '' : v)}
                                        disabled={!hasSubdivisions}
                                    >
                                        <SelectTrigger
                                            id="avatarSubdivision"
                                            className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50"
                                        >
                                            <SelectValue placeholder={hasSubdivisions ? 'Select Subdivision' : '— Not Applicable —'} />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-72 z-[1100] rounded-xl border-slate-200 shadow-xl">
                                            {hasSubdivisions ? (
                                                selectedAvatarCfg!.subdivisions.map(sub => (
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
                                </div>
                            </div>



                            {/* Row 4: Pin Series Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="pinSeries" className="text-sm font-bold text-slate-700">Pin Series *</Label>
                                <Select
                                    key={`series-${avatarSambandh}`}
                                    value={selectedSeriesId}
                                    onValueChange={handleSeriesChange}
                                    disabled={!avatarSambandh}
                                >
                                    <SelectTrigger id="pinSeries" className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50">
                                        <SelectValue placeholder={avatarSambandh ? 'Select a pin series' : 'Select Avatar first'} />
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

                            {/* Row 5: Pin Type Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="pinType" className="text-sm font-bold text-slate-700">Pin Style *</Label>
                                <Select
                                    key={`pin-${selectedSeriesId}`}
                                    value={pinType}
                                    onValueChange={(v) => setPinType(v as PinType)}
                                    disabled={!selectedSeriesId}
                                >
                                    <SelectTrigger id="pinType" className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50">
                                        <SelectValue placeholder="Select Pin Style" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[500px] z-[100] rounded-xl border-slate-200 shadow-xl">
                                        {selectedSeries?.files.map(file => {
                                            const fullPath = `${selectedSeries.folder}/${file}`;
                                            return (
                                                <SelectItem key={file} value={fullPath} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 p-1 shrink-0">
                                                            <img src={fullPath} alt="" className="w-full h-full object-contain" />
                                                        </div>
                                                        <span className="font-semibold text-sm">{file}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Visual Pin Selector Grid */}
                            {selectedSeries && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-sm font-bold text-slate-700">Visual Selector</Label>
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
                                                    onClick={() => setPinType(fullPath as PinType)}
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

                            <div className="flex gap-2 pt-1">
                                <Button type="submit" disabled={loading}>
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add Sthan Type'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="ghost" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* ── Existing Sthan Types ── */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-sm text-slate-700">Existing Sthan Types</h3>

                            {loading && sthanTypes.length === 0 ? (
                                <div className="text-sm text-slate-500 py-8 text-center">Loading...</div>
                            ) : sthanTypes.length === 0 ? (
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
                                                    const avatarColor = avatarCfg?.color || type.color || '#94A3B8';

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
                                                                        borderLeftColor: avatarColor,
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
                                                                        <div className="font-semibold text-sm text-slate-900">{type.name}</div>
                                                                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                            {/* Avatar chip */}
                                                                            {avatarCfg && (
                                                                                <span
                                                                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border"
                                                                                    style={{
                                                                                        backgroundColor: `${avatarColor}15`,
                                                                                        color: avatarColor,
                                                                                        borderColor: `${avatarColor}40`,
                                                                                    }}
                                                                                >
                                                                                    <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: avatarColor }} />
                                                                                    {avatarCfg.shortLabel}
                                                                                </span>
                                                                            )}
                                                                            {/* Subdivision chip */}
                                                                            {subCfg && (
                                                                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-slate-100 text-slate-600 border border-slate-200">
                                                                                    <ChevronRight className="w-2.5 h-2.5" />
                                                                                    {subCfg.label}
                                                                                </span>
                                                                            )}
                                                                            {/* Pin series info */}
                                                                            {(() => {
                                                                                const seriesMatch = PIN_SERIES.find(s => type.pinType?.includes(s.folder));
                                                                                if (seriesMatch) {
                                                                                    const fileName = type.pinType?.split('/').pop() || '';
                                                                                    return <span className="text-[10px] text-slate-400">{seriesMatch.name.split('(')[0].trim()} · {fileName}</span>;
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
                                                                        <Button size="sm" variant="ghost" onClick={() => handleDelete(type.id)} className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
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
    );
}
