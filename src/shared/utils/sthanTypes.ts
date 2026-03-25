// src/utils/sthanTypes.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '@/auth/firebase';
import { SthanType, CreateSthanTypeInput, UpdateSthanTypeInput, SthanTypeValidationResult, SthanTypeUsageResult } from '@/shared/types/sthanType';

const STHAN_TYPES_COLLECTION = 'sthan_types';

/**
 * Full Avatar Sambandh (deity group) configuration.
 * Each entry has: id, label, color, estimated total sthan count,
 * and optional subdivisions (sub-periods).
 */
export const AVATAR_SAMBANDH_CONFIG: {
    id: string;
    label: string;
    shortLabel: string;
    labelKey: string;
    color: string;
    count: number;
    subdivisions: { id: string; label: string; labelKey: string; count: number }[];
}[] = [
    {
        id: 'shri-krishna',
        label: 'Shri Krishan Bhagwan',
        shortLabel: 'Shri Krishan Bhagwan',
        labelKey: 'avatars.krishna',
        color: '#EC4899', // Pink
        count: 5,
        subdivisions: [],
    },
    {
        id: 'shri-dattatray',
        label: 'Shri Dattatray Prabhu',
        shortLabel: 'Shri Dattatray Prabhu',
        labelKey: 'avatars.dattatray',
        color: '#F59E0B', // Yellow/Amber
        count: 12,
        subdivisions: [],
    },
    {
        id: 'shri-chakrapani',
        label: 'Shri Chakrapani Prabhu',
        shortLabel: 'Shri Chakrapani Prabhu',
        labelKey: 'avatars.chakrapani',
        color: '#9B1C1C', // Maroon
        count: 18,
        subdivisions: [],
    },
    {
        id: 'shri-govind',
        label: 'Shri Govind Prabhu',
        shortLabel: 'Shri Govind Prabhu',
        labelKey: 'avatars.govind',
        color: '#16A34A', // Green
        count: 17,
        subdivisions: [
            { id: 'complete', label: 'Complete', labelKey: 'yatra.routes.swamiComplete', count: 17 },
            { id: 'purvardh', label: 'Purvardh', labelKey: 'yatra.routes.purvardh', count: 5 },
            { id: 'uttarardh', label: 'Uttarardh', labelKey: 'yatra.routes.uttarardh', count: 12 },
        ],
    },
    {
        id: 'shri-chakradhar',
        label: 'Shri Chakradhar Swami',
        shortLabel: 'Shri Chakradhar Swami',
        labelKey: 'avatars.chakradhar',
        color: '#2563EB', // Blue
        count: 150,
        subdivisions: [
            { id: 'complete', label: 'Complete', labelKey: 'yatra.routes.swamiComplete', count: 150 },
            { id: 'ekank', label: 'Ekank', labelKey: 'yatra.routes.ekant', count: 60 },
            { id: 'purvardh', label: 'Purvardh', labelKey: 'yatra.routes.purvardh', count: 50 },
            { id: 'uttarardh', label: 'Uttarardh', labelKey: 'yatra.routes.uttarardh', count: 40 },
        ],
    },
    {
        id: 'mandalik',
        label: 'Mandalik Sthan',
        shortLabel: 'Mandalik',
        labelKey: 'avatars.mandalik',
        color: '#92400E', // Brown
        count: 15,
        subdivisions: [],
    },
];

/** Total sthan count across all avatars */
export const TOTAL_STHAN_COUNT = AVATAR_SAMBANDH_CONFIG.reduce((sum, a) => sum + a.count, 0);

/**
 * Returns the brand color for a given avatar sambandh id.
 * Now "Normalization-aware" to handle database variations.
 */
export const getAvatarColor = (avatarSambandh?: string): string => {
    const canonicalId = normalizeAvatarId(avatarSambandh);
    if (!canonicalId) return '#94A3B8';
    const cfg = AVATAR_SAMBANDH_CONFIG.find(a => a.id === canonicalId);
    return cfg?.color ?? '#94A3B8';
};

/**
 * Normalized avatar IDs from various possible database variations.
 * Ensures 'chakrapani' -> 'shri-chakrapani', etc.
 */
export const normalizeAvatarId = (id?: string): string => {
    if (!id) return '';
    const cleanId = id.toLowerCase().trim();
    
    if (cleanId.includes('krishna')) return 'shri-krishna';
    if (cleanId.includes('dattatray') || cleanId.includes('datta')) return 'shri-dattatray';
    if (cleanId.includes('chakrapani')) return 'shri-chakrapani';
    if (cleanId.includes('govind')) return 'shri-govind';
    if (cleanId.includes('chakradhar')) return 'shri-chakradhar';
    if (cleanId.includes('mandalik')) return 'mandalik';
    
    return cleanId; // Return as-is if no match
};

/**
 * Flattened AVATAR_TYPES list for backward compatibility.
 * Derived from AVATAR_SAMBANDH_CONFIG.
 */
export const AVATAR_TYPES: { id: string; label: string; group: string }[] = [
    ...AVATAR_SAMBANDH_CONFIG.flatMap(avatar => {
        if (avatar.subdivisions.length === 0) {
            return [{ id: avatar.id, label: avatar.label, group: avatar.label }];
        }
        return avatar.subdivisions.map(sub => ({
            id: `${avatar.id}-${sub.id}`,
            label: `${avatar.label} – ${sub.label}`,
            group: avatar.label,
        }));
    }),
];

export const PIN_SERIES = [
    {
        id: '1',
        name: 'Series 1 (Shri Krishan Bhagwan)',
        folder: '/icons/pins/1 Shri_Krishan_Pin',
        defaultColor: '#EC4899', // Pink
        files: ['1.1.svg', '1.2.svg', '1.3.svg', '1.4.svg', '1.5.svg', 'Shri_Krishan_Pin.svg']
    },
    {
        id: '2',
        name: 'Series 2 (Shri Dattatray Prabhu)',
        folder: '/icons/pins/2 Shri_Dattatray_Prabhu_Pin',
        defaultColor: '#F59E0B', // Yellow
        files: ['2.1.svg', '2.2.svg', '2.3.svg', '2.4.svg', '2.5.svg', 'Shri_Dattatray_Prabhu_Pin.svg']
    },
    {
        id: '3',
        name: 'Series 3 (Shri Chakrapani Prabhu)',
        folder: '/icons/pins/3 Shri_Chakrapani_Prabhu_Pin',
        defaultColor: '#9B1C1C', // Maroon
        files: ['3.1.svg', '3.2.svg', '3.3.svg', '3.4.svg', '3.5.svg', 'Shri_Chakrapani_Prabhu_Pin.svg']
    },
    {
        id: '4',
        name: 'Series 4 (Shri Govind Prabhu)',
        folder: '/icons/pins/4 Shri_Govind_Prabhu_Pin',
        defaultColor: '#16A34A', // Green
        files: ['4.1.svg', '4.2.svg', '4.3.svg', '4.4.svg', '4.5.svg', 'Shri_Govind_Prabhu_Pin.svg']
    },
    {
        id: '5',
        name: 'Series 5 (Shri Chakradhar Swami)',
        folder: '/icons/pins/5 Shri_Chakradhar_Swami_Pin',
        defaultColor: '#2563EB', // Blue
        files: ['5.1.svg', '5.2.svg', '5.3.svg', '5.4.svg', '5.5.svg', 'Shri_Chakradhar_Swami_Pin.svg']
    },
    {
        id: '6',
        name: 'Series 6 (Mandalik Sthan)',
        folder: '/icons/pins/6 Mandalik_Sthan_Pin',
        defaultColor: '#92400E', // Brown
        files: ['6.1.svg', '6.2.svg', '6.5.svg', 'Mandalik_Sthan_Pin.svg']
    },
    {
        id: '7',
        name: 'Series 7',
        folder: '/icons/pins/7',
        defaultColor: '#6366F1',
        files: ['7.svg', '7.1.svg', '7.2.svg', '7.3.svg', '7.4.svg', '7.5.svg']
    },
    {
        id: '8',
        name: 'Series 8',
        folder: '/icons/pins/8',
        defaultColor: '#14B8A6',
        files: ['8.svg', '8.1.svg', '8.2.svg', '8.3.svg', '8.4.svg', '8.5.svg']
    },
    {
        id: '9',
        name: 'Series 9',
        folder: '/icons/pins/9',
        defaultColor: '#F97316',
        files: ['9.svg', '9.1.svg', '9.2.svg', '9.3.svg', '9.4.svg', '9.5.svg']
    }
];

/**
 * Returns valid Sthan Types for a specific avatar.
 * Returns both types explicitly assigned to the avatar, and universal types (no avatar assigned).
 * Deduplicates by name, giving precedence to explicitly assigned types.
 */
export const getValidSthanTypes = (avatarId: string, allTypes: SthanType[]): SthanType[] => {
    if (!avatarId) return allTypes;

    const validCandidates = allTypes.filter(t => t.avatarSambandh === avatarId || !t.avatarSambandh || t.avatarSambandh === '');

    const map = new Map<string, SthanType>();
    
    for (const t of validCandidates) {
        if (!map.has(t.name) || t.avatarSambandh === avatarId) {
            map.set(t.name, t);
        }
    }
    
    // Convert Map values to array and ensure Mandalik fallback is present if applicable
    let results = Array.from(map.values());
    
    if (avatarId === 'mandalik' && !results.some(t => t.name === 'Mandalik')) {
        const fallback = allTypes.find(t => t.name === 'Mandalik' && (!t.avatarSambandh || t.avatarSambandh === 'mandalik'));
        if (fallback) results.push(fallback);
    }
    
    return results;
};

/**
 * Fetch all sthan types from Firestore
 */
export const getSthanTypes = async (): Promise<SthanType[]> => {
    try {
        const q = query(collection(db, STHAN_TYPES_COLLECTION), orderBy('order', 'asc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        } as SthanType));
    } catch (error) {
        console.error('Error fetching sthan types:', error);
        return [];
    }
};

/**
 * Create a new sthan type
 */
export const createSthanType = async (data: CreateSthanTypeInput): Promise<string> => {
    try {
        // Normalize: avatarSubdivision null → undefined to avoid Firestore storing null unnecessarily
        const payload: Record<string, any> = {
            name: data.name,
            color: data.color,
            order: data.order,
            pinType: data.pinType,
            avatarSambandh: data.avatarSambandh,
            avatarSubdivision: data.avatarSubdivision ?? null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        if (data.avatarType) payload.avatarType = data.avatarType;

        // Bust module-level cache so next getSthanTypes() re-fetches
        _sthanTypesCache = null;

        const docRef = await addDoc(collection(db, STHAN_TYPES_COLLECTION), payload);
        return docRef.id;
    } catch (error) {
        console.error('Error creating sthan type:', error);
        throw error;
    }
};

/**
 * Update an existing sthan type.
 * Only name, color, pinType, order are allowed — avatarSambandh/avatarSubdivision are locked.
 */
export const updateSthanType = async (id: string, data: UpdateSthanTypeInput): Promise<void> => {
    try {
        // Strictly pick only safe editable fields
        const safeData: Record<string, any> = { updatedAt: new Date().toISOString() };
        if (data.name !== undefined) safeData.name = data.name;
        if (data.color !== undefined) safeData.color = data.color;
        if (data.pinType !== undefined) safeData.pinType = data.pinType;
        if (data.order !== undefined) safeData.order = data.order;

        const docRef = doc(db, STHAN_TYPES_COLLECTION, id);
        await updateDoc(docRef, safeData);

        // Bust cache
        _sthanTypesCache = null;
    } catch (error) {
        console.error('Error updating sthan type:', error);
        throw error;
    }
};

/**
 * Delete a sthan type
 */
export const deleteSthanType = async (id: string): Promise<void> => {
    try {
        const docRef = doc(db, STHAN_TYPES_COLLECTION, id);
        await deleteDoc(docRef);
        // Bust cache
        _sthanTypesCache = null;
    } catch (error) {
        console.error('Error deleting sthan type:', error);
        throw error;
    }
};

/**
 * Update the order of all sthan types (deduplicates by position index).
 */
export const updateSthanTypesOrder = async (reorderedTypes: SthanType[]): Promise<void> => {
    try {
        const batch = reorderedTypes.map((type, index) => {
            const docRef = doc(db, STHAN_TYPES_COLLECTION, type.id);
            return updateDoc(docRef, {
                order: index + 1,
                updatedAt: new Date().toISOString(),
            });
        });
        await Promise.all(batch);
        // Bust cache after reorder
        _sthanTypesCache = null;
    } catch (error) {
        console.error('Error updating sthan types order:', error);
        throw error;
    }
};

// ---------------------------------------------------------------------------
// MODULE-LEVEL CACHE
// ---------------------------------------------------------------------------

let _sthanTypesCache: SthanType[] | null = null;

/**
 * Returns sthan types from an in-memory cache. Fetches from Firestore only on
 * the first call or after any mutation (create/update/delete/reorder).
 */
export const getSthanTypesCached = async (): Promise<SthanType[]> => {
    if (_sthanTypesCache !== null) return _sthanTypesCache;
    const types = await getSthanTypes();
    _sthanTypesCache = types;
    return types;
};

/**
 * Bust the module-level cache (call after any mutation outside this file).
 */
export const bustSthanTypesCache = (): void => {
    _sthanTypesCache = null;
};

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS (New strict API)
// ---------------------------------------------------------------------------

/**
 * Get a single Sthan Type by ID from a pre-loaded array.
 * O(n) but array is small (<50 items). Use with context-provided array.
 */
export const getSthanTypeById = (id: string, allTypes: SthanType[]): SthanType | undefined =>
    allTypes.find(t => t.id === id);

/**
 * Validate a Sthan Type input before saving to Firestore.
 *
 * Checks:
 * 1. name is not empty
 * 2. avatarSambandh is set
 * 3. pinType is set and starts with '/icons/'
 * 4. Uniqueness: no other type has the same (avatarSambandh + avatarSubdivision + name)
 *    (ignores the item with editingId, if provided)
 */
export const validateSthanType = (
    input: { name: string; avatarSambandh: string; avatarSubdivision: string | null; pinType: string },
    allTypes: SthanType[],
    editingId?: string | null,
): SthanTypeValidationResult => {
    if (!input.name.trim()) {
        return { valid: false, field: 'name', message: 'Sthan Type name is required.' };
    }
    if (!input.avatarSambandh) {
        return { valid: false, field: 'avatarSambandh', message: 'Primary Avatar (Sambandh) is required.' };
    }
    if (!input.pinType || !input.pinType.startsWith('/icons/')) {
        return { valid: false, field: 'pinType', message: 'A valid Pin Style must be selected before saving.' };
    }

    // Uniqueness check: same name + avatar + subdivision (case-insensitive name)
    const normalizedName = input.name.trim().toLowerCase();
    const conflict = allTypes.find(t => {
        if (editingId && t.id === editingId) return false; // skip self
        return (
            t.name.toLowerCase() === normalizedName &&
            t.avatarSambandh === input.avatarSambandh &&
            (t.avatarSubdivision ?? null) === (input.avatarSubdivision ?? null)
        );
    });

    if (conflict) {
        const subLabel = input.avatarSubdivision ? ` / ${input.avatarSubdivision}` : '';
        return {
            valid: false,
            field: 'duplicate',
            message: `"${input.name}" already exists under this Avatar${subLabel}. Each (Avatar → Subdivision → Name) combination must be unique.`,
        };
    }

    return { valid: true };
};

/**
 * Check how many Sthanas reference a given Sthan Type ID.
 * Used to guard against deletion of types that are in use.
 *
 * Requires a Firestore index on: temples → sthanTypeId (ASC)
 */
export const checkSthanTypeUsage = async (sthanTypeId: string): Promise<SthanTypeUsageResult> => {
    try {
        const q = query(
            collection(db, 'temples'),
            where('sthanTypeId', '==', sthanTypeId),
        );
        const snap = await getDocs(q);
        const sthanaNames: string[] = [];
        const sthanaIds: string[] = [];
        snap.forEach(d => {
            sthanaIds.push(d.id);
            sthanaNames.push(d.data().name || d.id);
        });
        return { count: snap.size, sthanaNames, sthanaIds };
    } catch (error) {
        console.error('Error checking sthan type usage:', error);
        return { count: 0, sthanaNames: [], sthanaIds: [] };
    }
};

/**
 * The 5 new icon-based pins from /icons/pins/. Each has a different
 * interior icon but the same map-pin shape. Color is applied via CSS filter.
 */
export const PIN_ICON_MAP: Record<string, string> = {
    pin_empty: '/icons/pins/4.svg',
    pin_temple1: '/icons/pins/4.1.svg',
    pin_shikhara: '/icons/pins/4.2.svg',
    pin_mandir: '/icons/pins/4.3.svg',
    pin_aasan: '/icons/pins/4.4.svg',
    pin_dot: '/icons/pins/4.5.svg',
    pin_mahasthan: '/icons/mahasthan pin.svg',
    pin_mandalik: '/icons/pins/6 Mandalik_Sthan_Pin/6.5.svg',
    pin_1_1: '/icons/pins/1.1.svg',
    pin_1_2: '/icons/pins/1.2.svg',
    pin_1_3: '/icons/pins/1.3.svg',
    pin_1_4: '/icons/pins/1.4.svg',
    pin_1_5: '/icons/pins/1.5.svg',
    pin_empty_gold: '/icons/pins/1.svg',
};

/**
 * Avatar (deity) type hierarchy for classifying Sthan Types.
 * Shri Govind Prabhu and Shri Chakradhar Swami have sub-periods.
 */


/**
 * Convert hex color string to HSL.
 */
function hexToHsl(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    let r = parseInt(h.substring(0, 2), 16) / 255;
    let g = parseInt(h.substring(2, 4), 16) / 255;
    let b = parseInt(h.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let hue = 0, sat = 0;
    const lum = (max + min) / 2;
    if (max !== min) {
        const d = max - min;
        sat = lum > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: hue = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: hue = ((b - r) / d + 2) / 6; break;
            case b: hue = ((r - g) / d + 4) / 6; break;
        }
    }
    return [Math.round(hue * 360), Math.round(sat * 100), Math.round(lum * 100)];
}

/**
 * Build a CSS filter string that transforms a navy-blue image into the target color.
 *
 * Pipeline: invert(1) sepia(1) saturate(X) hue-rotate(Hdeg) brightness(B)
 *   - invert turns dark navy to a light color
 *   - sepia gives a warm reference tone (~hsl 37, 43%)
 *   - saturate boosts to target saturation
 *   - hue-rotate shifts to target hue
 *   - brightness adjusts final lightness
 */
export const hexToFilter = (hex: string): string => {
    const [hue, sat, lum] = hexToHsl(hex);
    const hueDeg = ((hue - 37) + 360) % 360;
    const satScale = Math.max(0.1, (sat / 43) * 3).toFixed(2);
    const brightScale = Math.max(0.2, (lum / 50) * 1.1).toFixed(2);
    return `invert(1) sepia(1) saturate(${satScale}) hue-rotate(${hueDeg}deg) brightness(${brightScale})`;
};

/**
 * Returns the src and CSS filter for rendering a colored pin icon.
 * Usage: <img src={src} style={{ filter }} />
 */
export const generateColoredPinSVG = (imagePath: string, color: string): { src: string; filter: string } => ({
    src: imagePath,
    filter: hexToFilter(color),
});

/**
 * Full pin render info: src URL + optional CSS filter.
 */
export interface PinRenderInfo {
    src: string;
    filter: string;
    needsFilter: boolean;
}

/**
 * Helper to map sthan names to the specific icon index (1-5) used in our SVG naming convention.
 * 1: Mahasthan, 2: Mandalik/Shikhara, 3: Avasthan, 4: Asan, 5: Vasti/Dot
 */
export const getSthanIndex = (name: string): string => {
    if (!name) return '';
    
    // 1. Try to extract numeric style from a path (e.g. /icons/pins/2 Shri.../2.3.svg -> '3')
    const pathMatch = name.match(/[1-9]\.([1-5])\.svg$/);
    if (pathMatch) return pathMatch[1];

    const n = name.toLowerCase();
    
    // 2. Specific style keywords
    if (n.includes('mahasthan')) return '1';
    if (n.includes('shikhara') || n.includes('mandalik')) return '2';
    if (n.includes('avasthan') || n.includes('mandir')) return '3';
    if (n.includes('asan')) return '4';
    if (n.includes('vasti') || n.includes('vishti') || n.includes('dot')) return '5';
    
    return '';
};

/**
 * Get full pin render info for any pinType + color.
 * Now "Avatar-Aware" and "Persisted pinIcon Aware".
 */
export const getSthanPinInfo = (color: string, pinType?: string, avatarId?: string, sthanName?: string, pinIcon?: string, sthanTypeId?: string, allSthanTypes?: SthanType[]): PinRenderInfo => {
    // 1. HIGHEST PRIORITY: Linked Sthan Type ID from "Manage Sthan Types" database
    //    If the temple has a sthanTypeId that matches a record, use that record's pin unconditionally.
    if (sthanTypeId && allSthanTypes && allSthanTypes.length > 0) {
        const matchedType = allSthanTypes.find(t => t.id === sthanTypeId);
        if (matchedType?.pinType) {
            // Full icon path stored in DB (most common for Manage Sthan Types)
            if (matchedType.pinType.startsWith('/icons/')) {
                return { src: matchedType.pinType, filter: '', needsFilter: false };
            }
            // Legacy key in PIN_ICON_MAP
            if (matchedType.pinType in PIN_ICON_MAP) {
                return { src: PIN_ICON_MAP[matchedType.pinType], filter: '', needsFilter: false };
            }
        }
    }

    // 2. SECOND PRIORITY: pinType argument is already a full icon path
    //    This happens when getIconForTemple passes matchedSthanType.pinType as pinType directly.
    if (pinType && pinType.startsWith('/icons/')) {
        return { src: pinType, filter: '', needsFilter: false };
    }
    if (pinType && pinType in PIN_ICON_MAP) {
        return { src: PIN_ICON_MAP[pinType], filter: '', needsFilter: false };
    }

    // 3. Persisted pinIcon field (legacy or manual override)
    if (pinIcon) {
        if (pinIcon.startsWith('/icons/')) {
            return { src: pinIcon, filter: '', needsFilter: false };
        }
        if (pinIcon in PIN_ICON_MAP) {
            return { src: PIN_ICON_MAP[pinIcon], filter: '', needsFilter: false };
        }
    }

    const canonicalAvatarId = normalizeAvatarId(avatarId);

    // 4. Avatar series fallback (for legacy data without sthanTypeId)
    if (canonicalAvatarId) {
        let numericId = '';
        if (canonicalAvatarId === 'shri-krishna') numericId = '1';
        else if (canonicalAvatarId === 'shri-dattatray') numericId = '2';
        else if (canonicalAvatarId === 'shri-chakrapani') numericId = '3';
        else if (canonicalAvatarId === 'shri-govind') numericId = '4';
        else if (canonicalAvatarId === 'shri-chakradhar') numericId = '5';
        else if (canonicalAvatarId === 'mandalik') numericId = '6';

        if (numericId) {
            const series = PIN_SERIES.find(s => s.id === numericId);
            if (series) {
                const index = getSthanIndex(sthanName || '');
                if (index) {
                    const specificFile = `${numericId}.${index}.svg`;
                    if (series.files.includes(specificFile)) {
                        return { src: `${series.folder}/${specificFile}`, filter: '', needsFilter: false };
                    }
                }
                // Default pin for this avatar series
                const defaultFile = series.files.find(f => !f.includes('.')) || series.files[series.files.length - 1];
                return { src: `${series.folder}/${defaultFile}`, filter: '', needsFilter: false };
            }
        }
    }

    // 5. Last resort fallback
    return { src: generateSthanPinSVG(color, pinType), filter: '', needsFilter: false };
};

/**
 * Generate an HTML <img> string for use inside Leaflet L.divIcon({ html }).
 */
export const getPinImageHtml = (color: string, pinType: string | undefined, size = 40, avatarId?: string, sthanName?: string, pinIcon?: string, sthanTypeId?: string, allSthanTypes?: SthanType[]): string => {
    const info = getSthanPinInfo(color, pinType, avatarId, sthanName, pinIcon, sthanTypeId, allSthanTypes);
    const filterStyle = info.needsFilter ? `filter:${info.filter};` : '';

    return `
        <div style="position:relative; width:${size}px; height:${size}px;">
            <img src="${info.src}" style="position:relative; width:100%; height:100%; object-fit:contain; ${filterStyle} z-index:1;" />
        </div>
    `;
};

/**
 * Generate pin image path with custom color — dispatches by pinType.
 * (Legacy/Fallback)
 */
export const generateSthanPinSVG = (color: string, pinType?: string): string => {
    if (pinType && pinType in PIN_ICON_MAP) return PIN_ICON_MAP[pinType];
    return PIN_ICON_MAP['pin_empty']; // Default fallback
};






/**
 * Adjust color brightness (helper function)
 */


/**
 * Initialize default sthan types (run once).
 * avatarSambandh / avatarSubdivision left as empty strings for legacy seed data.
 */
export const seedSthanTypes = async (): Promise<void> => {
    const defaultTypes: CreateSthanTypeInput[] = [
        { name: 'Mahasthan', color: '#B22222', order: 1, pinType: '/icons/pins/5 Shri_Chakradhar_Swami_Pin/5.1.svg', avatarSambandh: '', avatarSubdivision: null },
        { name: 'Avasthan', color: '#D4AF37', order: 2, pinType: '/icons/pins/5 Shri_Chakradhar_Swami_Pin/5.3.svg', avatarSambandh: '', avatarSubdivision: null },
        { name: 'Asan', color: '#0E3C6F', order: 3, pinType: '/icons/pins/5 Shri_Chakradhar_Swami_Pin/5.4.svg', avatarSambandh: '', avatarSubdivision: null },
        { name: 'Vasti', color: '#228B22', order: 4, pinType: '/icons/pins/5 Shri_Chakradhar_Swami_Pin/5.5.svg', avatarSambandh: '', avatarSubdivision: null },
        { name: 'Mandalik', color: '#6A0DAD', order: 5, pinType: '/icons/pins/6 Mandalik_Sthan_Pin/6.5.svg', avatarSambandh: 'mandalik', avatarSubdivision: null },
    ];

    try {
        const existing = await getSthanTypes();
        if (existing.length === 0) {
            for (const type of defaultTypes) {
                await createSthanType(type);
            }
            console.log('Seeded default sthan types');
        }
    } catch (error) {
        console.error('Error seeding sthan types:', error);
    }
};
