// src/utils/sthanTypes.ts
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/auth/firebase';
import { SthanType, CreateSthanTypeInput, UpdateSthanTypeInput } from '@/shared/types/sthanType';

const STHAN_TYPES_COLLECTION = 'sthan_types';

/**
 * Avatar (deity) type hierarchy for classifying Sthan Types.
 */
export const AVATAR_TYPES: { id: string; label: string; group: string }[] = [
    { id: 'shri-krishna', label: 'Shri Krishna', group: 'Shri Krishna' },
    { id: 'shri-dattatray', label: 'Shri Dattatray Prabhu', group: 'Shri Dattatray Prabhu' },
    { id: 'shri-chakrapani', label: 'Shri Chakrapani Prabhu', group: 'Shri Chakrapani Prabhu' },
    { id: 'shri-govind-purvardh', label: 'Shri Govind Prabhu – Purvardh', group: 'Shri Govind Prabhu' },
    { id: 'shri-govind-uttarardh', label: 'Shri Govind Prabhu – Uttarardh', group: 'Shri Govind Prabhu' },
    { id: 'shri-chakradhar-ekank', label: 'Shri Chakradhar Swami – Ekank', group: 'Shri Chakradhar Swami' },
    { id: 'shri-chakradhar-purvardh', label: 'Shri Chakradhar Swami – Purvardh', group: 'Shri Chakradhar Swami' },
    { id: 'shri-chakradhar-uttarardh', label: 'Shri Chakradhar Swami – Uttarardh', group: 'Shri Chakradhar Swami' },
];

export const PIN_SERIES = [
    {
        id: '1',
        name: 'Series 1 (Shri Krishna)',
        folder: '/icons/pins/1 Shri_Krishna_Pin',
        defaultColor: '#F59E0B',
        files: ['1.1.svg', '1.2.svg', '1.3.svg', '1.4.svg', '1.5.svg', 'Shri_Krishna_Pin.svg']
    },
    {
        id: '2',
        name: 'Series 2 (Shri Dattatray Prabhu)',
        folder: '/icons/pins/2 Shri_Dattatray_Prabhu_Pin',
        defaultColor: '#EC4899',
        files: ['2.1.svg', '2.2.svg', '2.3.svg', '2.4.svg', '2.5.svg', 'Shri_Dattatray_Prabhu_Pin.svg']
    },
    {
        id: '3',
        name: 'Series 3 (Shri Chakrapani Prabhu)',
        folder: '/icons/pins/3 Shri_Chakrapani_Prabhu_Pin',
        defaultColor: '#8B5CF6',
        files: ['3.1.svg', '3.2.svg', '3.3.svg', '3.4.svg', '3.5.svg', 'Shri_Chakrapani_Prabhu_Pin.svg']
    },
    {
        id: '4',
        name: 'Series 4 (Shri Govind Prabhu)',
        folder: '/icons/pins/4 Shri_Govind_Prabhu_Pin',
        defaultColor: '#EF4444',
        files: ['4.1.svg', '4.2.svg', '4.3.svg', '4.4.svg', '4.5.svg', 'Shri_Govind_Prabhu_Pin.svg']
    },
    {
        id: '5',
        name: 'Series 5 (Shri Chakradhar Swami)',
        folder: '/icons/pins/5 Shri_Chakradhar_Swami_Pin',
        defaultColor: '#3B82F6',
        files: ['5.1.svg', '5.2.svg', '5.3.svg', '5.4.svg', '5.5.svg', 'Shri_Chakradhar_Swami_Pin.svg']
    },
    {
        id: '6',
        name: 'Series 6 (Mandalik Sthan)',
        folder: '/icons/pins/6 Mandalik_Sthan_Pin',
        defaultColor: '#10B981',
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
        const docRef = await addDoc(collection(db, STHAN_TYPES_COLLECTION), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating sthan type:', error);
        throw error;
    }
};

/**
 * Update an existing sthan type
 */
export const updateSthanType = async (id: string, data: UpdateSthanTypeInput): Promise<void> => {
    try {
        const docRef = doc(db, STHAN_TYPES_COLLECTION, id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString(),
        });
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
    } catch (error) {
        console.error('Error deleting sthan type:', error);
        throw error;
    }
};

/**
 * Update the order of all sthan types
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
    } catch (error) {
        console.error('Error updating sthan types order:', error);
        throw error;
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
    pin_1_1: '/icons/pins/1.1.svg',
    pin_1_2: '/icons/pins/1.2.svg',
    pin_1_3: '/icons/pins/1.3.svg',
    pin_1_4: '/icons/pins/1.4.svg',
    pin_1_5: '/icons/pins/1.5.svg',
    pin_empty_gold: '/icons/pins/1.svg',
};



/**
 * Avatar (deity) type hierarchy for classifying Sthan Types.
 * Govind Prabhu and Chakradhar Swami have sub-periods.
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
 * Get full pin render info for any pinType + color.
 * Preferred API for new code.
 */
export const getSthanPinInfo = (color: string, pinType?: string): PinRenderInfo => {
    // Check if new path-based PIN
    if (pinType && pinType.startsWith('/icons/pins/')) {
        return {
            src: pinType,
            filter: '',
            needsFilter: false
        };
    }

    const isOriginal = color === 'original' || color === '' || !color || color === '#0e3c6f' || color === '#d4af37';

    if (pinType && pinType in PIN_ICON_MAP) {
        return {
            src: PIN_ICON_MAP[pinType],
            filter: isOriginal ? '' : hexToFilter(color),
            needsFilter: !isOriginal
        };
    }

    // Fallback for custom geometric pins (legacy)
    return { src: generateSthanPinSVG(color, pinType), filter: '', needsFilter: false };
};

/**
 * Generate an HTML <img> string for use inside Leaflet L.divIcon({ html }).
 */
export const getPinImageHtml = (color: string, pinType: string | undefined, size = 40): string => {
    const info = getSthanPinInfo(color, pinType);
    const filterStyle = info.needsFilter ? `filter:${info.filter};` : '';

    return `
        <div style="position:relative; width:${size}px; height:${size}px;">
            <img src="${info.src}" style="position:relative; width:100%; height:100%; object-fit:contain; ${filterStyle} z-index:1;" />
        </div>
    `;
};

/**
 * Generate pin image path with custom color — dispatches by pinType.
 * For icon-based pins, returns the PNG src path directly.
 * Use getSthanPinInfo() for full info including CSS color filter.
 */
export const generateSthanPinSVG = (color: string, pinType?: string): string => {
    if (pinType && pinType in PIN_ICON_MAP) return PIN_ICON_MAP[pinType];
    return PIN_ICON_MAP['pin_empty']; // Default fallback
};






/**
 * Adjust color brightness (helper function)
 */


/**
 * Initialize default sthan types (run once)
 */
export const seedSthanTypes = async (): Promise<void> => {
    const defaultTypes: CreateSthanTypeInput[] = [
        { name: 'Avasthan', color: '#D4AF37', order: 1, pinType: 'pin_mandir' },
        { name: 'Asan', color: '#0E3C6F', order: 2, pinType: 'pin_aasan' },
        { name: 'Vasti', color: '#228B22', order: 3, pinType: 'pin_empty' },
        { name: 'Mandalik', color: '#6A0DAD', order: 4, pinType: 'pin_shikhara' },
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
