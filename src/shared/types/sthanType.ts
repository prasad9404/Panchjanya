// src/types/sthanType.ts
export type PinType = string;

export interface SthanType {
    id: string;
    name: string;
    color: string;
    order: number;
    pinType?: PinType;
    avatarType?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateSthanTypeInput {
    name: string;
    color: string;
    order: number;
    pinType?: PinType;
    avatarType?: string;
}

export interface UpdateSthanTypeInput {
    name?: string;
    color?: string;
    order?: number;
    pinType?: PinType;
    avatarType?: string;
}
