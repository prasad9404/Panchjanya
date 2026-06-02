import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { ArchitecturalArchive, ArchitectureEntry } from "@/types";

/**
 * Fetches all enabled ArchitecturalArchive documents.
 * Used by the archive landing page and SthanaVandan section.
 */
export const useArchives = () => {
    return useQuery<ArchitecturalArchive[]>({
        queryKey: ["architectural_archives"],
        queryFn: async () => {
            const snapshot = await getDocs(collection(db, "architectural_archives"));
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as ArchitecturalArchive[];
        },
        staleTime: 0, // Refetch on mount/focus to see new entries
        gcTime: 1000 * 60 * 30,
    });
};

/**
 * Fetches a single ArchitecturalArchive by ID.
 */
export const useArchive = (archiveId: string | undefined) => {
    return useQuery<ArchitecturalArchive | null>({
        queryKey: ["architectural_archives", archiveId],
        queryFn: async () => {
            if (!archiveId) return null;
            const snap = await getDoc(doc(db, "architectural_archives", archiveId));
            if (!snap.exists()) return null;
            return { ...snap.data(), id: snap.id } as ArchitecturalArchive;
        },
        enabled: !!archiveId,
        staleTime: 0,
        gcTime: 1000 * 60 * 30,
    });
};

/**
 * Fetches all ArchitectureEntry documents for a given archiveId.
 * Used by the archive detail (entry list) page.
 */
export const useArchiveEntries = (archiveId: string | undefined) => {
    return useQuery<ArchitectureEntry[]>({
        queryKey: ["architecture_entries", archiveId],
        queryFn: async () => {
            if (!archiveId) return [];
            const q = query(
                collection(db, "architecture_entries"),
                where("archiveId", "==", archiveId)
            );
            const snapshot = await getDocs(q);
            return snapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            })) as ArchitectureEntry[];
        },
        enabled: !!archiveId,
        staleTime: 0,
        gcTime: 1000 * 60 * 30,
    });
};

/**
 * Fetches a single ArchitectureEntry by ID.
 * Used by TempleArchitecture / ArchitectureViewer / SthanaDetail in archive context.
 */
export const useArchiveEntry = (entryId: string | undefined) => {
    return useQuery<ArchitectureEntry | null>({
        queryKey: ["architecture_entries", "single", entryId],
        queryFn: async () => {
            if (!entryId) return null;
            const snap = await getDoc(doc(db, "architecture_entries", entryId));
            if (!snap.exists()) return null;
            return { ...snap.data(), id: snap.id } as ArchitectureEntry;
        },
        enabled: !!entryId,
        staleTime: 0,
        gcTime: 1000 * 60 * 30,
    });
};
