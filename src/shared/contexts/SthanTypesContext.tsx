// src/shared/contexts/SthanTypesContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SthanType } from '@/shared/types/sthanType';
import { getSthanTypes, bustSthanTypesCache } from '@/shared/utils/sthanTypes';

// ---------------------------------------------------------------------------
// Context Shape
// ---------------------------------------------------------------------------

interface SthanTypesContextValue {
    /** Sorted list of all Sthan Types from Firestore */
    sthanTypes: SthanType[];
    loading: boolean;
    /**
     * Busts the module-level cache and re-fetches from Firestore.
     * Call this after any create / update / delete operation.
     */
    refreshSthanTypes: () => Promise<void>;
}

const SthanTypesContext = createContext<SthanTypesContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function SthanTypesProvider({ children }: { children: ReactNode }) {
    const [sthanTypes, setSthanTypes] = useState<SthanType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        try {
            const types = await getSthanTypes();
            setSthanTypes(types);
        } catch (err) {
            console.error('[SthanTypesContext] Failed to load sthan types:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshSthanTypes = useCallback(async () => {
        // Bust the module-level cache first so getSthanTypes() goes to Firestore
        bustSthanTypesCache();
        await fetchTypes();
    }, [fetchTypes]);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    return (
        <SthanTypesContext.Provider value={{ sthanTypes, loading, refreshSthanTypes }}>
            {children}
        </SthanTypesContext.Provider>
    );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Returns global Sthan Types state.
 * Must be used inside <SthanTypesProvider>.
 */
export function useSthanTypes(): SthanTypesContextValue {
    const ctx = useContext(SthanTypesContext);
    if (!ctx) {
        throw new Error('useSthanTypes() must be called within a <SthanTypesProvider>.');
    }
    return ctx;
}
