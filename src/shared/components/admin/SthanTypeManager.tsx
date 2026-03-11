"use client";

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import {
    getSthanTypes, createSthanType, updateSthanType, deleteSthanType,
    getSthanPinInfo, updateSthanTypesOrder, PIN_SERIES, AVATAR_TYPES
} from '@/shared/utils/sthanTypes';
import { SthanType, PinType } from '@/shared/types/sthanType';
import { useToast } from '@/shared/hooks/use-toast';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';


export function SthanTypeManager() {
    const [open, setOpen] = useState(false);
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [name, setName] = useState('');
    const [avatarType, setAvatarType] = useState<string>('');
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>('');
    const [pinType, setPinType] = useState<PinType>('');
    const [color, setColor] = useState('#D4AF37');

    const { toast } = useToast();

    useEffect(() => {
        if (open) {
            loadSthanTypes();
        }
    }, [open]);

    const loadSthanTypes = async () => {
        setLoading(true);
        try {
            const types = await getSthanTypes();
            setSthanTypes(types);
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to load sthan types',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarChange = (id: string) => {
        const val = id === '__none__' ? '' : id;
        setAvatarType(val);

        // Auto-select series based on avatar mapping
        let seriesId = '';
        if (val === 'shri-krishna') seriesId = '1';
        else if (val === 'shri-dattatray') seriesId = '2';
        else if (val === 'shri-chakrapani') seriesId = '3';
        else if (val.startsWith('shri-govind')) seriesId = '4';
        else if (val.startsWith('shri-chakradhar')) seriesId = '5';

        if (seriesId) {
            handleSeriesChange(seriesId);
        } else {
            // Reset series selection if no direct mapping
            setSelectedSeriesId('');
            setPinType('');
        }
    };

    const handleSeriesChange = (seriesId: string) => {
        const series = PIN_SERIES.find(s => s.id === seriesId);
        if (!series) return;
        setSelectedSeriesId(seriesId);
        setColor(series.defaultColor);
        // Default to first pin in series
        if (series.files.length > 0) {
            setPinType(`${series.folder}/${series.files[0]}` as PinType);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            toast({
                title: 'Validation Error',
                description: 'Please enter a sthan type name',
                variant: 'destructive',
            });
            return;
        }

        if (!avatarType) {
            toast({
                title: 'Validation Error',
                description: 'Please select an Avatar Type',
                variant: 'destructive',
            });
            return;
        }

        if (!selectedSeriesId) {
            toast({
                title: 'Validation Error',
                description: 'Please select a Pin Series',
                variant: 'destructive',
            });
            return;
        }

        if (!pinType) {
            toast({
                title: 'Validation Error',
                description: 'Please select a Pin Style',
                variant: 'destructive',
            });
            return;
        }

        setLoading(true);
        try {
            if (editingId) {
                await updateSthanType(editingId, { name, color, pinType, avatarType: avatarType || undefined });
                toast({
                    title: 'Success',
                    description: 'Sthan type updated successfully',
                });
            } else {
                const order = sthanTypes.length + 1;
                await createSthanType({ name, color, order, pinType, avatarType: avatarType || undefined });
                toast({
                    title: 'Success',
                    description: 'Sthan type created successfully',
                });
            }

            resetForm();
            loadSthanTypes();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save sthan type',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (type: SthanType) => {
        setEditingId(type.id);
        setName(type.name);
        setColor(type.color);
        setAvatarType(type.avatarType || '');

        // Find matching series for editing if it's a new style pin
        const pinTypePath = type.pinType || '';
        setPinType(pinTypePath as PinType);

        if (pinTypePath.startsWith('/icons/pins/')) {
            const series = PIN_SERIES.find(s => pinTypePath.includes(s.folder));
            if (series) setSelectedSeriesId(series.id);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this sthan type? This cannot be undone.')) {
            return;
        }

        setLoading(true);
        try {
            await deleteSthanType(id);
            toast({
                title: 'Success',
                description: 'Sthan type deleted successfully',
            });
            loadSthanTypes();
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to delete sthan type',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result: DropResult) => {
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        const reorderedTypes = Array.from(sthanTypes);
        const [removed] = reorderedTypes.splice(sourceIndex, 1);
        reorderedTypes.splice(destinationIndex, 0, removed);

        // Optimistic update
        setSthanTypes(reorderedTypes);

        try {
            await updateSthanTypesOrder(reorderedTypes);
            toast({
                title: 'Success',
                description: 'Order updated successfully',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to update order',
                variant: 'destructive',
            });
            loadSthanTypes(); // Revert on failure
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setAvatarType('');
        setSelectedSeriesId('');
        setPinType('');
        setColor('#D4AF37');
    };

    const groupedAvatars = useMemo(() => {
        return AVATAR_TYPES.reduce((acc, avatar) => {
            if (!acc[avatar.group]) acc[avatar.group] = [];
            acc[avatar.group].push(avatar);
            return acc;
        }, {} as Record<string, typeof AVATAR_TYPES>);
    }, []);

    const selectedSeries = PIN_SERIES.find(s => s.id === selectedSeriesId);

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
                    <DialogTitle>Manage Sthan Types</DialogTitle>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 pt-4 min-h-0">
                    <div className="space-y-6">
                        {/* Add/Edit Form */}
                        <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg space-y-5">
                            <h3 className="font-semibold text-sm text-slate-700">
                                {editingId ? 'Edit Sthan Type' : 'Add New Sthan Type'}
                            </h3>

                            {/* Row 1: Name */}
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Avasthan"
                                    required
                                />
                            </div>

                            {/* Row 2: Avatar Type Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="avatarType" className="text-sm font-bold text-slate-700">Avatar Type *</Label>
                                <Select value={avatarType || '__none__'} onValueChange={handleAvatarChange}>
                                    <SelectTrigger 
                                        id="avatarType" 
                                        className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500"
                                    >
                                        <SelectValue placeholder="— Select Avatar —" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 z-[1100] rounded-xl border-slate-200 shadow-xl">
                                        <SelectItem value="__none__">— None —</SelectItem>
                                        {AVATAR_TYPES.map(a => (
                                            <SelectItem key={a.id} value={a.id} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                <span className="font-semibold text-sm pl-2">{a.label}</span>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Row 3: Pin Series Dropdown (Dependent) */}
                            <div className="space-y-2">
                                <Label htmlFor="pinSeries" className="text-sm font-bold text-slate-700">Pin Series *</Label>
                                <Select 
                                    key={`series-${avatarType}`}
                                    value={selectedSeriesId} 
                                    onValueChange={handleSeriesChange}
                                    disabled={!avatarType}
                                >
                                    <SelectTrigger id="pinSeries" className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50">
                                        <SelectValue placeholder="Select a pin series" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[500px] z-[1100] rounded-xl border-slate-200 shadow-xl">
                                        {(PIN_SERIES || []).map(series => (
                                            <SelectItem key={series.id} value={series.id} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 p-1 shrink-0">
                                                        <img
                                                            src={`${series.folder}/${series.files[0]}`}
                                                            alt=""
                                                            className="w-full h-full object-contain"
                                                        />
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

                            {/* Row 4: Pin Type Dropdown (Dependent) */}
                            <div className="space-y-2">
                                <Label htmlFor="pinType" className="text-sm font-bold text-slate-700">Pin Type *</Label>
                                <Select 
                                    key={`pin-${selectedSeriesId}`}
                                    value={pinType} 
                                    onValueChange={(v) => setPinType(v as PinType)}
                                    disabled={!selectedSeriesId}
                                >
                                    <SelectTrigger id="pinType" className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500 disabled:bg-slate-50 disabled:opacity-50">
                                        <SelectValue placeholder="Select Pin Type" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-[500px] z-[100] rounded-xl border-slate-200 shadow-xl">
                                        {selectedSeries?.files.map(file => {
                                            const fullPath = `${selectedSeries.folder}/${file}`;
                                            return (
                                                <SelectItem key={file} value={fullPath} className="cursor-pointer focus:bg-slate-50 rounded-lg m-1">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 p-1 shrink-0">
                                                            <img
                                                                src={fullPath}
                                                                alt=""
                                                                className="w-full h-full object-contain"
                                                            />
                                                        </div>
                                                        <span className="font-semibold text-sm">{file}</span>
                                                    </div>
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Row 5: Style Selection Grid (Visual Preview) */}
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
                                    {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
                                </Button>
                                {editingId && (
                                    <Button type="button" variant="ghost" onClick={resetForm}>
                                        Cancel
                                    </Button>
                                )}
                            </div>
                        </form>

                        {/* List of Sthan Types */}
                        <div className="space-y-2">
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
                                            <div
                                                {...provided.droppableProps}
                                                ref={provided.innerRef}
                                                className="space-y-2"
                                            >
                                                {sthanTypes.map((type, index) => (
                                                    <Draggable key={type.id} draggableId={type.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg transition-all ${snapshot.isDragging ? 'shadow-lg border-blue-200 z-50' : 'hover:bg-slate-50'
                                                                    }`}
                                                            >
                                                                <div {...provided.dragHandleProps} className="p-1 hover:bg-slate-100 rounded cursor-grab">
                                                                    <GripVertical className="w-4 h-4 text-slate-400" />
                                                                </div>
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
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="font-medium text-sm">{type.name}</div>
                                                                    <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                                                        {type.avatarType && (
                                                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide bg-amber-50 text-amber-700 border border-amber-200">
                                                                                {type.avatarType}
                                                                            </span>
                                                                        )}
                                                                        {(() => {
                                                                            const seriesMatch = PIN_SERIES.find(s => type.pinType?.includes(s.folder));
                                                                            if (seriesMatch) {
                                                                                const fileParts = type.pinType?.split('/') || [];
                                                                                const fileName = fileParts[fileParts.length - 1];
                                                                                return (
                                                                                    <span className="text-[10px] text-slate-400">
                                                                                        {seriesMatch.name} · {fileName}
                                                                                    </span>
                                                                                );
                                                                            }
                                                                            return <span className="text-[10px] text-slate-400">Legacy Pin</span>;
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                                <div className="flex gap-1">
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleEdit(type)}
                                                                        className="h-8 w-8 p-0"
                                                                    >
                                                                        <Pencil className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() => handleDelete(type.id)}
                                                                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
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
