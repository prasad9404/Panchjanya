// src/types/sthanType.ts
export type PinType = string;

export interface SthanType {
    id: string;
    name: string;
    color: string;
    order: number;
    pinType?: PinType;
    /** @deprecated use avatarSambandh + avatarSubdivision */
    avatarType?: string;
    /** Top-level Avatar Sambandh id, e.g. 'shri-krishna' */
    avatarSambandh?: string;
    /** Sub-period id, e.g. 'purvardh' | 'uttarardh' | 'ekank'. Empty for avatars without sub-periods. */
    avatarSubdivision?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSthanTypeInput {
    name: string;
    color: string;
    order: number;
    pinType?: PinType;
    /** @deprecated use avatarSambandh + avatarSubdivision */
    avatarType?: string;
    avatarSambandh?: string;
    avatarSubdivision?: string;
}

export interface UpdateSthanTypeInput {
    name?: string;
    color?: string;
    order?: number;
    pinType?: PinType;
    /** @deprecated use avatarSambandh + avatarSubdivision */
    avatarType?: string;
    avatarSambandh?: string;
    avatarSubdivision?: string;
}
