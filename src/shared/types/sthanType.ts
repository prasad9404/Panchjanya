// src/shared/types/sthanType.ts

export type PinType = string;

/**
 * The canonical, fully-validated Sthan Type document stored in Firestore.
 * avatarSambandh and pinType are required. avatarSubdivision is null for
 * avatars with no sub-periods.
 */
export interface SthanType {
    id: string;
    name: string;
    /** Avatar brand color – derived from AVATAR_SAMBANDH_CONFIG at save time */
    color: string;
    order: number;
    /** Full path to SVG icon, e.g. '/icons/pins/5 Shri.../5.2.svg'. REQUIRED. */
    pinType: PinType;
    /** Top-level Avatar Sambandh id, e.g. 'shri-krishna'. REQUIRED. Locked after creation. */
    avatarSambandh: string;
    /** Sub-period id, e.g. 'purvardh' | 'uttarardh' | 'ekank'. null for avatars with no sub-periods. Locked after creation. */
    avatarSubdivision: string | null;
    createdAt: string;
    updatedAt: string;

    /** @deprecated use avatarSambandh + avatarSubdivision */
    avatarType?: string;
}

/**
 * Input for creating a new Sthan Type.
 * avatarSambandh, pinType, and name are required.
 * avatarSubdivision is required when the avatar has sub-periods,
 * otherwise null.
 */
export interface CreateSthanTypeInput {
    name: string;
    color: string;
    order: number;
    pinType: PinType;
    avatarSambandh: string;
    avatarSubdivision: string | null;
    /** @deprecated use avatarSambandh + avatarSubdivision */
    avatarType?: string;
}

/**
 * Allowed editable fields after creation.
 * avatarSambandh and avatarSubdivision are intentionally EXCLUDED — they
 * are locked after creation to maintain hierarchy integrity.
 */
export interface UpdateSthanTypeInput {
    name?: string;
    color?: string;
    pinType?: PinType;
    order?: number;
}

/**
 * Result of a uniqueness + integrity validation check.
 */
export interface SthanTypeValidationResult {
    valid: boolean;
    field?: 'name' | 'avatarSambandh' | 'pinType' | 'duplicate';
    message?: string;
}

/**
 * Result of a dependency usage check.
 */
export interface SthanTypeUsageResult {
    count: number;
    sthanaNames: string[];
    sthanaIds: string[];
}
