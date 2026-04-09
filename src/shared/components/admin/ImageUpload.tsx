import { useState } from "react";
import { uploadFile } from "@/shared/lib/storage";
import type { MediaDocument } from "@/shared/lib/storage";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Progress } from "@/shared/components/ui/progress";
import { Upload, X, Loader2, CheckCircle, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { Label } from "@/shared/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { cn } from "@/shared/lib/utils";

interface ImageUploadProps {
    onUpload: (url: string) => void;
    folderPath: string;
    mediaType?: MediaDocument['type'];
    label?: string;
    className?: string;
    fitMode?: 'cover' | 'contain';
    onFitModeChange?: (mode: 'cover' | 'contain') => void;
    onRemove?: () => void;
    variant?: 'default' | 'gallery' | 'compact';
}

export function ImageUpload({
    onUpload,
    folderPath,
    mediaType = "post-image",
    label = "Upload Image",
    className,
    fitMode = 'cover',
    onFitModeChange,
    onRemove,
    variant = 'default'
}: ImageUploadProps) {
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [urlInput, setUrlInput] = useState("");
    const { toast } = useToast();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create local preview immediately for responsive UI
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);
        setUploading(true);
        setProgress(0);

        try {
            const result = await uploadFile({
                file,
                folder: folderPath,
                type: mediaType,
                onProgress: setProgress,
            });

            onUpload(result.downloadUrl);
            setUploading(false);
            toast({
                title: "Success",
                description: "Image uploaded successfully",
            });
        } catch (error: any) {
            console.error("Upload failed:", error);
            setUploading(false);
            toast({
                title: "Upload Failed",
                description: error.message || "Failed to upload image",
                variant: "destructive",
            });
        }
    };

    const handleUrlSubmit = () => {
        if (!urlInput.trim()) return;
        onUpload(urlInput);
        setPreview(urlInput);
        toast({ title: "Success", description: "Image URL added" });
    };

    const clearImage = () => {
        setPreview(null);
        setProgress(0);
        setUrlInput("");
        if (onRemove) onRemove();
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (!file || !file.type.startsWith('image/')) {
            toast({
                title: "Invalid File",
                description: "Please drop a valid image file.",
                variant: "destructive"
            });
            return;
        }

        const pseudoEvent = { target: { files: [file] } } as any;
        handleFileChange(pseudoEvent);
    };

    if (variant === 'gallery') {
        return (
            <div className={cn("p-3 bg-white border border-slate-100 rounded-2xl shadow-sm", className)}>
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Left side: Upload/URL Box */}
                    <div className="flex-1 space-y-3">
                        <Tabs defaultValue="upload" className="w-full">
                            <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-lg h-9">
                                <TabsTrigger value="upload" className="text-[10px] rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-1">
                                    <Upload className="w-3 h-3 mr-1.5" />
                                    Upload
                                </TabsTrigger>
                                <TabsTrigger value="url" className="text-[10px] rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all py-1">
                                    <LinkIcon className="w-3 h-3 mr-1.5" />
                                    URL
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="upload" className="mt-3">
                                <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    className="relative"
                                >
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        disabled={uploading}
                                        className="hidden"
                                        id={`image-upload-${label.replace(/\s+/g, "-")}`}
                                    />
                                    <label
                                        htmlFor={`image-upload-${label.replace(/\s+/g, "-")}`}
                                        className={cn(
                                            "flex flex-col items-center justify-center w-full h-[160px] border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300",
                                            isDragging ? "border-blue-500 bg-blue-50/50 scale-[1.01]" : "border-slate-200 bg-slate-50/50 hover:bg-slate-100/50 hover:border-slate-300",
                                            uploading ? "opacity-50 cursor-not-allowed" : ""
                                        )}
                                    >
                                        <div className="flex flex-col items-center gap-1.5 text-slate-400 p-2 text-center">
                                            <div className={cn("p-2 rounded-xl shadow-sm transition-colors", isDragging ? "bg-blue-500 text-white" : "bg-white")}>
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-900 mb-0.5">
                                                    {isDragging ? "Drop here" : "Upload File"}
                                                </p>
                                                <p className="text-[9px] text-slate-400 font-medium">JPG/PNG up to 10MB</p>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </TabsContent>

                            <TabsContent value="url" className="mt-3 space-y-2">
                                <div className="space-y-1">
                                    <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Image URL</Label>
                                    <div className="flex gap-1.5">
                                        <Input
                                            placeholder="https://..."
                                            value={urlInput}
                                            onChange={(e) => setUrlInput(e.target.value)}
                                            className="h-8 text-[10px] bg-slate-50 border-slate-200 focus:bg-white rounded-lg"
                                        />
                                        <Button onClick={handleUrlSubmit} type="button" size="sm" className="h-8 px-3 rounded-lg bg-blue-600 text-[10px]">
                                            Add
                                        </Button>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>

                        {uploading && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <Progress value={progress} className="h-1.5 bg-slate-100" />
                                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-blue-600">
                                    <span>Uploading...</span>
                                    <span>{Math.round(progress)}%</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right side: Preview Card */}
                    <div className="flex-1 min-w-[200px]">
                        <div className="h-full flex flex-col">
                            <div className="flex items-center justify-between mb-2">
                                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Live Preview</Label>
                                {preview && (
                                    <button
                                        onClick={clearImage}
                                        className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors"
                                        type="button"
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>

                            <div className="flex-1 relative h-[160px] w-full rounded-xl overflow-hidden border-2 border-slate-50 bg-slate-50/30 flex items-center justify-center group shadow-inner">
                                {preview ? (
                                    <>
                                        <img
                                            src={preview}
                                            alt="Preview"
                                            className={cn(
                                                "max-w-full max-h-full transition-all duration-500 group-hover:scale-105",
                                                fitMode === 'cover' ? "w-full h-full object-cover" : "object-contain"
                                            )}
                                        />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="secondary"
                                                size="sm"
                                                className="rounded-xl h-8 text-[10px] font-bold uppercase gap-1.5 bg-white/90 backdrop-blur-sm shadow-xl"
                                                onClick={() => window.open(preview, '_blank')}
                                            >
                                                <LinkIcon className="w-3 h-3" />
                                                Full View
                                            </Button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center gap-1.5 text-slate-300">
                                        <ImageIcon className="w-8 h-8 opacity-20" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">No Selection</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`p-4 bg-white ${className}`}>
            <Tabs defaultValue="upload" className="w-full">
                <TabsList className="grid w-full grid-cols-2 p-1 bg-slate-100 rounded-xl h-11">
                    <TabsTrigger
                        value="upload"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        <span className="font-medium">Upload</span>
                    </TabsTrigger>
                    <TabsTrigger
                        value="url"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm transition-all"
                    >
                        <LinkIcon className="w-4 h-4 mr-2" />
                        <span className="font-medium">URL</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upload" className="mt-4">
                    <div className="relative">
                        <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="hidden"
                            id={`image-upload-${label.replace(/\s+/g, "-")}`}
                        />
                        <label
                            htmlFor={`image-upload-${label.replace(/\s+/g, "-")}`}
                            className={`flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-dashed border-slate-200 hover:border-primary/50 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-all ${uploading ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                        >
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <div className="p-3 bg-white rounded-xl shadow-sm">
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                </div>
                                <span className="text-sm font-semibold tracking-wide">
                                    {uploading ? "Uploading..." : "Click to select image"}
                                </span>
                            </div>
                        </label>
                    </div>

                    {uploading && (
                        <div className="mt-4 space-y-2">
                            <Progress value={progress} className="h-1.5" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-right">
                                {Math.round(progress)}% Complete
                            </p>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="url" className="mt-4 space-y-3">
                    <div className="flex flex-col gap-2">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Paste Image Address</Label>
                        <div className="flex gap-2">
                            <Input
                                placeholder="https://example.com/image.jpg"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                className="bg-slate-50 border-slate-200"
                            />
                            <Button onClick={handleUrlSubmit} type="button" size="sm" className="shrink-0">
                                Add
                            </Button>
                        </div>
                    </div>
                    <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
                        <p className="text-[10px] text-blue-600/70 leading-relaxed italic">
                            Tip: Use direct links from Google Drive, Unsplash, or Pexels for better results.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>

            {preview && !uploading && (
                <div className="space-y-4 mt-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Preview</Label>
                        <button
                            onClick={clearImage}
                            className="text-[10px] font-bold text-destructive uppercase tracking-widest hover:underline"
                            type="button"
                        >
                            Remove
                        </button>
                    </div>

                    <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 flex items-center justify-center shadow-inner group">
                        <img
                            src={preview}
                            alt="Preview"
                            className={cn(
                                "max-w-full max-h-full transition-all duration-300",
                                fitMode === 'cover' ? "w-full h-full object-cover" : "object-contain"
                            )}
                        />
                        <div className="absolute top-3 right-3 bg-green-500 text-white rounded-full p-1 shadow-lg animate-in zoom-in-50">
                            <CheckCircle className="w-4 h-4" />
                        </div>
                    </div>

                    {onFitModeChange && (
                        <div className="space-y-3">
                            <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Image Fit Mode</Label>
                            <div className="flex bg-slate-100 p-1 rounded-xl w-fit border border-slate-200/50">
                                <button
                                    type="button"
                                    onClick={() => onFitModeChange('cover')}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                                        fitMode === 'cover'
                                            ? "bg-white shadow-sm text-blue-600 ring-1 ring-slate-200/50"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Cover
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onFitModeChange('contain')}
                                    className={cn(
                                        "px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-200",
                                        fitMode === 'contain'
                                            ? "bg-white shadow-sm text-blue-600 ring-1 ring-slate-200/50"
                                            : "text-slate-400 hover:text-slate-600"
                                    )}
                                >
                                    Fit Inside
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic ml-1">
                                {fitMode === 'cover'
                                    ? "Cover: Fills the entire container (may crop edges)."
                                    : "Fit: Ensures the full image is visible inside."}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
