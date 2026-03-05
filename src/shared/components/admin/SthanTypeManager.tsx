// src/components/admin/SthanTypeManager.tsx
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Plus, Trash2, Pencil, GripVertical } from 'lucide-react';
import {
    getSthanTypes, createSthanType, updateSthanType, deleteSthanType,
    getSthanPinInfo, updateSthanTypesOrder, PIN_SERIES
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
                await updateSthanType(editingId, { name, color, pinType });
                toast({
                    title: 'Success',
                    description: 'Sthan type updated successfully',
                });
            } else {
                const order = sthanTypes.length + 1;
                await createSthanType({ name, color, order, pinType });
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
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Manage Sthan Types
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Manage Sthan Types</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Add/Edit Form */}
                    <form onSubmit={handleSubmit} className="bg-slate-50 p-4 rounded-lg space-y-4">
                        <h3 className="font-semibold text-sm text-slate-700">
                            {editingId ? 'Edit Sthan Type' : 'Add New Sthan Type'}
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
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
                            <div className="space-y-2">
                                <Label htmlFor="series">Pin Series *</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {PIN_SERIES.map((series) => (
                                        <button
                                            key={series.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedSeriesId(series.id);
                                                setColor(series.defaultColor);
                                                setPinType(`${series.folder}/${series.files[0]}`);
                                            }}
                                            className={`flex items-center text-left gap-2 p-2 rounded-xl border-2 transition-all ${selectedSeriesId === series.id
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                                }`}
                                        >
                                            <img
                                                src={`${series.folder}/${series.files[series.files.length - 1]}`}
                                                className="w-8 h-8 object-contain"
                                                alt={series.name}
                                            />
                                            <span className="text-xs font-medium leading-tight flex-1">{series.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label>Select Pin Style</Label>
                            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                {PIN_SERIES.find(s => s.id === selectedSeriesId)?.files.map((file) => {
                                    const fullPath = `${PIN_SERIES.find(s => s.id === selectedSeriesId)?.folder}/${file}`;
                                    const isSelected = pinType === fullPath;
                                    return (
                                        <button
                                            key={file}
                                            type="button"
                                            onClick={() => setPinType(fullPath)}
                                            className={`flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${isSelected
                                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="relative w-12 h-12">
                                                <img
                                                    src={fullPath}
                                                    alt={file}
                                                    className="relative z-10 w-full h-full object-contain"
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-medium truncate w-full text-center">
                                                {file.replace('.svg', '').replace('.png', '')}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>


                        <div className="flex gap-2">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
                            </Button>
                            {editingId && (
                                <Button type="button" variant="outline" onClick={resetForm}>
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
                                                            <div className="flex-1">
                                                                <div className="font-medium text-sm">{type.name}</div>
                                                                <div className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                                                                    {(() => {
                                                                        const seriesMatch = PIN_SERIES.find(s => type.pinType?.includes(s.folder));
                                                                        if (seriesMatch) {
                                                                            const fileParts = type.pinType?.split('/') || [];
                                                                            const fileName = fileParts[fileParts.length - 1];
                                                                            return (
                                                                                <>
                                                                                    <span className="truncate max-w-[120px]" title={seriesMatch.name}>{seriesMatch.name}</span>
                                                                                    <span className="text-slate-300">·</span>
                                                                                    <span>{fileName}</span>
                                                                                </>
                                                                            );
                                                                        }
                                                                        return <span>Legacy Pin</span>;
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
            </DialogContent>
        </Dialog >
    );
}
