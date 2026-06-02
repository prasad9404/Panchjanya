import React, { useState, useEffect } from "react";
import { db } from "@/auth/firebase";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import { Plus, Trash2, Edit, Save, ArrowLeft, Image as ImageIcon, CheckCircle2, EyeOff, Search } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ArchitecturalArchive } from "@/types";
import { getTranslatedValue } from "@/shared/utils/translationUtils";
import { ImageUpload } from "@/shared/components/admin/ImageUpload";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { useTranslation } from "react-i18next";

export default function ArchivalArchiveAdmin() {
    const [archives, setArchives] = useState<ArchitecturalArchive[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<ArchitecturalArchive>>({});
    
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();
    const { t } = useTranslation();

    const fetchArchives = async () => {
        try {
            setLoading(true);
            const snapshot = await getDocs(collection(db, "architectural_archives"));
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchitecturalArchive[];
            
            const formatted = data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            
            setArchives(formatted);
        } catch (error) {
            console.error("Error fetching archives:", error);
            toast({
                title: "Error",
                description: "Failed to load archives.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArchives();
    }, []);

    const handleCreateNew = async () => {
        const newId = uuidv4();
        const newArchive: ArchitecturalArchive = {
            id: newId,
            title: { en: "New Archive", hi: "", mr: "" },
            subtitle: { en: "", hi: "", mr: "" },
            description: { en: "", hi: "", mr: "" },
            architectures: [],
            thumbnail: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enabled: false,
            featured: false,
        };

        try {
            await setDoc(doc(db, "architectural_archives", newId), newArchive);
            toast({ title: "Success", description: "Archive created." });
            setEditingId(newId);
            setEditForm(newArchive);
            fetchArchives();
        } catch (error) {
            toast({ title: "Error", description: "Failed to create archive.", variant: "destructive" });
        }
    };

    const handleSave = async () => {
        if (!editingId) return;
        
        try {
            const updated = {
                ...editForm,
                updatedAt: new Date().toISOString(),
            };
            
            await setDoc(doc(db, "architectural_archives", editingId), updated, { merge: true });
            toast({ title: "Success", description: "Archive updated." });
            setEditingId(null);
            fetchArchives();
        } catch (error) {
            toast({ title: "Error", description: "Failed to save archive.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete '${name}'? This will NOT delete the child architectures, but they will be orphaned.`)) return;

        try {
            await deleteDoc(doc(db, "architectural_archives", id));
            toast({ title: "Deleted", description: "Archive removed successfully." });
            fetchArchives();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete archive.", variant: "destructive" });
        }
    };

    const filteredArchives = archives.filter(a => 
        getTranslatedValue(a.title, 'en').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-background">
                {/* Header */}
                <div className="bg-white dark:bg-card border-b px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    {t("admin.architecturalArchives")}
                                </h1>
                                <p className="text-sm text-slate-500">{t("admin.manageCuratedCollections")}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Create Archive
                            </Button>
                        </div>
                    </div>

                    {/* Search bar */}
                    {!editingId && (
                        <div className="flex gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <Input
                                    placeholder="Search archives by name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 bg-slate-50"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 max-w-6xl mx-auto">
                    {editingId ? (
                        /* Archive Editor */
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-bold">{t("admin.editArchive")}</h2>
                                <div className="flex items-center gap-3">
                                    <Button variant="outline" onClick={() => setEditingId(null)}>{t("admin.cancel")}</Button>
                                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                                        <Save className="w-4 h-4 mr-2" /> Save Changes
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label>{t("admin.titleEnglish")}</Label>
                                        <Input 
                                            value={editForm.title?.en || ''} 
                                            onChange={e => setEditForm({ ...editForm, title: { ...editForm.title!, en: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{t("admin.subtitleEnglish")}</Label>
                                        <Input 
                                            value={editForm.subtitle?.en || ''} 
                                            onChange={e => setEditForm({ ...editForm, subtitle: { ...editForm.subtitle!, en: e.target.value } })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>{t("admin.descriptionEnglish")}</Label>
                                    <Input 
                                        value={editForm.description?.en || ''} 
                                        onChange={e => setEditForm({ ...editForm, description: { ...editForm.description!, en: e.target.value } })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6 pt-4 border-t">
                                    <div className="space-y-4">
                                        <Label>{t("admin.thumbnailImage")}</Label>
                                        {editForm.thumbnail ? (
                                            <div className="relative aspect-video rounded-xl overflow-hidden">
                                                <img src={editForm.thumbnail} alt="" className="object-cover w-full h-full" />
                                                <Button size="icon" variant="destructive" className="absolute top-2 right-2" onClick={() => setEditForm({ ...editForm, thumbnail: "" })}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <ImageUpload
                                                folderPath="archives"
                                                onUpload={(url) => setEditForm({ ...editForm, thumbnail: url })}
                                            />
                                        )}
                                    </div>
                                    
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <h3 className="font-medium">{t("admin.publishedStatus")}</h3>
                                                <p className="text-sm text-slate-500">{t("admin.enableShowDashboard")}</p>
                                            </div>
                                            <Switch 
                                                checked={editForm.enabled} 
                                                onCheckedChange={c => setEditForm({ ...editForm, enabled: c })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <h3 className="font-medium">{t("admin.featuredCollection")}</h3>
                                                <p className="text-sm text-slate-500">{t("admin.highlightArchive")}</p>
                                            </div>
                                            <Switch 
                                                checked={editForm.featured} 
                                                onCheckedChange={c => setEditForm({ ...editForm, featured: c })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ) : (
                        /* Archive List */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {loading ? (
                                <p>{t("admin.loadingArchives")}</p>
                            ) : filteredArchives.map(archive => (
                                <Card key={archive.id} className="overflow-hidden group flex flex-col h-full">
                                    <div className="h-40 bg-slate-100 relative">
                                        {archive.thumbnail ? (
                                            <img src={archive.thumbnail} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-slate-400">
                                                <ImageIcon className="w-10 h-10 opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            {archive.enabled ? (
                                                <span className="bg-green-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center font-bold">
                                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Active
                                                </span>
                                            ) : (
                                                <span className="bg-slate-500 text-white text-[10px] px-2 py-1 rounded-full flex items-center font-bold">
                                                    <EyeOff className="w-3 h-3 mr-1" /> Hidden
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-slate-900 mb-1">{getTranslatedValue(archive.title, 'en')}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                            {getTranslatedValue(archive.description, 'en') || "No description provided."}
                                        </p>
                                        
                                        <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                                            <Button 
                                                variant="outline" 
                                                className="flex-1 bg-slate-50"
                                                onClick={() => navigate(`/admin/architectural-archives/${archive.id}`)}
                                            >
                                                {t("admin.manageEntries")}
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon"
                                                onClick={() => {
                                                    setEditingId(archive.id);
                                                    setEditForm(archive);
                                                }}
                                            >
                                                <Edit className="w-4 h-4 text-blue-600" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon"
                                                onClick={() => handleDelete(archive.id, getTranslatedValue(archive.title, 'en'))}
                                            >
                                                <Trash2 className="w-4 h-4 text-red-600" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
