// src/components/admin/SthanTypeManager.tsx
import { useState, useEffect } from 'react';
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

    // Form state
    const [name, setName] = useState('');
    const [color, setColor] = useState(PIN_SERIES[0].defaultColor);
    const [selectedSeriesId, setSelectedSeriesId] = useState<string>(PIN_SERIES[0].id);
    const [pinType, setPinType] = useState<PinType>(`${PIN_SERIES[0].folder}/${PIN_SERIES[0].files[0]}`);
    const [avatarType, setAvatarType] = useState<string>('');

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

    const handleSeriesChange = (seriesId: string) => {
        const series = PIN_SERIES.find(s => s.id === seriesId);
        if (!series) return;
        setSelectedSeriesId(seriesId);
        setColor(series.defaultColor);
        setPinType(`${series.folder}/${series.files[0]}`);
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
        const pinTypePath = type.pinType || `${PIN_SERIES[0].folder}/${PIN_SERIES[0].files[0]}`;
        setPinType(pinTypePath);

        // Find matching series for editing if it's a new style pin
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
        setColor(PIN_SERIES[0].defaultColor);
        setSelectedSeriesId(PIN_SERIES[0].id);
        setPinType(`${PIN_SERIES[0].folder}/${PIN_SERIES[0].files[0]}`);
        setAvatarType('');
    };

    const selectedSeries = PIN_SERIES.find(s => s.id === selectedSeriesId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Manage Sthan Types
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
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

                            {/* Row 2: Avatar Type */}
                            <div className="space-y-2">
                                <Label htmlFor="avatarType">
                                    Avatar Type
                                    <span className="ml-1.5 text-slate-400 font-normal text-xs">(deity classification)</span>
                                </Label>
                                <Select value={avatarType || '__none__'} onValueChange={(v) => setAvatarType(v === '__none__' ? '' : v)}>
                                    <SelectTrigger id="avatarType" className="w-full bg-white">
                                        <SelectValue placeholder="— Select Avatar —" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 z-[100]">
                                        <SelectItem value="__none__">— None —</SelectItem>
                                        {(AVATAR_TYPES || []).length > 0 && Array.from(new Set(AVATAR_TYPES.map(a => a.group))).map(group => (
                                            <SelectGroup key={group}>
                                                <SelectLabel className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 select-none">
                                                    {group}
                                                </SelectLabel>
                                                {AVATAR_TYPES.filter(a => a.group === group).map(a => (
                                                    <SelectItem key={a.id} value={a.label}>
                                                        {a.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectGroup>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Row 3: Pin Series Dropdown */}
                            <div className="space-y-2">
                                <Label htmlFor="pinSeries" className="text-sm font-bold text-slate-700">Pin Series *</Label>
                                <Select value={selectedSeriesId} onValueChange={handleSeriesChange}>
                                    <SelectTrigger id="pinSeries" className="w-full bg-white h-12 rounded-xl border-slate-200 focus:ring-blue-500">
                                        <SelectValue placeholder="Select a pin series" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-72 z-[100] rounded-xl border-slate-200 shadow-xl">
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

                            {/* Row 4: Pin Style (from selected series) */}
                            {selectedSeries && (
                                <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex items-center justify-between px-1">
                                        <Label className="text-sm font-bold text-slate-700">Select Style</Label>
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
                                                    onClick={() => setPinType(fullPath)}
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
