import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "@/auth/firebase";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/shared/hooks/use-toast";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Card } from "@/shared/components/ui/card";
import { Plus, Trash2, Edit, ArrowLeft, Image as ImageIcon, Search } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { ArchitectureEntry, ArchitecturalArchive } from "@/types";
import { getTranslatedValue } from "@/shared/utils/translationUtils";
import { Badge } from "@/shared/components/ui/badge";
import { useTranslation } from "react-i18next";

export default function ArchiveEntryAdmin() {
    const { t } = useTranslation();
    const { archiveId } = useParams<{ archiveId: string }>();
    const [entries, setEntries] = useState<ArchitectureEntry[]>([]);
    const [archive, setArchive] = useState<ArchitecturalArchive | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    
    const navigate = useNavigate();
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchData = async () => {
        if (!archiveId) return;
        try {
            setLoading(true);
            
            // Fetch the parent archive details
            const archiveSnap = await getDoc(doc(db, "architectural_archives", archiveId));
            if (archiveSnap.exists()) {
                setArchive({ ...archiveSnap.data(), id: archiveSnap.id } as ArchitecturalArchive);
            }
            
            // Fetch entries for this archive
            const q = query(
                collection(db, "architecture_entries"),
                where("archiveId", "==", archiveId)
            );
            const snapshot = await getDocs(q);
            const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ArchitectureEntry[];
            
            // Sort by createdAt desc
            const formatted = data.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
            
            setEntries(formatted);
        } catch (error) {
            console.error("Error fetching entries:", error);
            toast({
                title: "Error",
                description: "Failed to load architecture entries.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [archiveId]);

    const handleCreateNew = async () => {
        if (!archiveId) return;
        const newId = uuidv4();
        
        const newEntry: Partial<ArchitectureEntry> = {
            id: newId,
            archiveId: archiveId,
            title: { en: "New Architecture Entry", hi: "", mr: "" },
            description: { en: "", hi: "", mr: "" },
            // Initialize basic architecture info to allow editing
            hotspots: [],
            present_hotspots: [],
            leelas: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            enabled: true
        };

        try {
            await setDoc(doc(db, "architecture_entries", newId), newEntry);
            
            // Add the new entry ID to the parent archive's architectures array
            const archiveRef = doc(db, "architectural_archives", archiveId);
            await updateDoc(archiveRef, {
                architectures: arrayUnion(newId)
            });

            toast({ title: "Success", description: "New entry created. Please edit it to add details." });
            fetchData();
            // Automatically navigate to edit this new entry
            navigate(`/admin/architecture-entry/${newId}/edit`);
        } catch (error) {
            toast({ title: "Error", description: "Failed to create entry.", variant: "destructive" });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to delete '${name}'? This action cannot be undone.`)) return;

        try {
            await deleteDoc(doc(db, "architecture_entries", id));
            
            // Remove the entry ID from the parent archive's architectures array
            const archiveRef = doc(db, "architectural_archives", archiveId);
            await updateDoc(archiveRef, {
                architectures: arrayRemove(id)
            });

            toast({ title: "Deleted", description: "Entry removed successfully." });
            fetchData();
        } catch (error) {
            toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
        }
    };

    const filteredEntries = entries.filter(e => 
        getTranslatedValue(e.title, 'en').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AdminLayout>
            <div className="flex-1 overflow-auto bg-slate-50 dark:bg-background">
                {/* Header */}
                <div className="bg-white dark:bg-card border-b px-8 py-6 sticky top-0 z-10">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <Button variant="ghost" size="icon" onClick={() => navigate('/admin/architectural-archives')}>
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                                    {archive ? getTranslatedValue(archive.title, 'en') : "Loading Archive..."} 
                                    <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border">
                                        Entries
                                    </span>
                                </h1>
                                <p className="text-muted-foreground mt-1">
                                    {t('admin.manageArchitectures', 'Manage architectures within this archive collection.')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button onClick={handleCreateNew} className="bg-blue-600 hover:bg-blue-700">
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Entry
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Search entries by name..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 bg-slate-50"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-6xl mx-auto">
                    {loading ? (
                        <div className="py-12 text-center">
                            <p className="text-muted-foreground animate-pulse">{t('common.loadingEntries', 'Loading entries...')}</p>
                        </div>
                    ) : filteredEntries.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-1">{t('admin.noEntriesYet', 'No entries yet')}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                                {t('admin.addFirstEntry', 'Click the button above to add the first architecture entry to this archive.')}
                            </p>
                            <Button onClick={handleCreateNew} variant="outline" className="bg-white dark:bg-slate-800">
                                <Plus className="w-4 h-4 mr-2" /> Add Entry
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEntries.map(entry => (
                                <Card key={entry.id} className="overflow-hidden group flex flex-col h-full">
                                    <div className="h-40 bg-slate-100 relative">
                                        {(entry.architectureImages && entry.architectureImages.length > 0) || entry.architectureImage ? (
                                            <img src={entry.architectureImages?.[0] || entry.architectureImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center w-full h-full text-slate-400 bg-slate-100">
                                                <ImageIcon className="w-10 h-10 opacity-50" />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 flex gap-2">
                                            <Badge variant={entry.enabled !== false ? "default" : "secondary"}>
                                                {entry.enabled !== false ? "Active" : "Disabled"}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-slate-900 mb-1">{getTranslatedValue(entry.title, 'en')}</h3>
                                        <p className="text-sm text-slate-500 line-clamp-2 mb-4">
                                            {getTranslatedValue(entry.description, 'en') || "No description provided."}
                                        </p>
                                        
                                        <div className="mt-auto flex items-center gap-2 pt-4 border-t">
                                            <Button 
                                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                                onClick={() => navigate(`/admin/architecture-entry/${entry.id}/edit`)}
                                            >
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Architecture
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="icon"
                                                onClick={() => handleDelete(entry.id, getTranslatedValue(entry.title, 'en'))}
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
