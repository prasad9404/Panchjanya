// Centralized interfaces for Temple Architecture
export interface Leela {
    id: string;
    title?: string; // New: Title for the leela
    description: string;
    number?: number;
}

export type HotspotType = 'structure' | 'asset' | 'entry' | 'special' | 'zone';

export interface Hotspot {
    id: string;
    x: number;
    y: number;
    title: string;
    description: string;
    type?: HotspotType; // New: Categorization
    parentId?: string; // New: For clustering/grouping
    significance?: string; // Detailed architectural/spiritual info
    sthanPothiTitle?: string; // New: Title for Sthan Pothi section
    sthanPothiDescription?: string; // New: Specific description for sthan pothi
    generalDescriptionTitle?: string; // New: Title for General Description section
    number?: number; // Sequence number
    imageIndex?: number; // Map to main (0) or supplemental (1+) images
    images: string[]; // Present day images
    oldImages?: string[]; // Historical images
    leelas?: Leela[]; // Stories associated with this location
    isPresent?: boolean; // New: Whether this hotspot should appear in Present View
    sthanaId?: string; // New: Link to the source architectural hotspot (for Present View)
    order?: number; // New: Display order
    fitMode?: 'cover' | 'contain'; // New: Image fit preference
}

export interface DescriptionSection {
    id: string;
    title: string;
    content: string;
}

export interface GlanceItem {
    id: string;
    icon: string;
    description: string;
}

export interface AbbreviationItem {
    id: string;
    icon: string;
    description: string;
}

export interface CustomBlock {
    id: string;
    title: string;
    content: string;
}

export interface RelatedAvatar {
    avatar: string;
    subtype: string[];
}

export type SthanaStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETE" | "VERIFIED" | "PUBLISHED";

export interface Temple {
    id: string;
    name: string;
    todaysName?: string; // New: Today's name subtitle
    todaysNameTitle?: string; // New: Dynamic label for today's name
    address?: string;
    locationLink?: string; // New: Direction link or coordinates
    contactName?: string;
    contactNumber?: string;
    contactDetails?: string; // New: Additional contact info for Navigation
    city: string;
    taluka?: string;
    district: string;
    location: string | { lat: number; lng: number; address?: string };
    latitude: number;
    longitude: number;
    
    // Avatar Hierarchy Fields
    primaryAvatar?: string;
    primarySubtype?: string[];
    relatedAvatars?: RelatedAvatar[];
    sthanType?: string; // Standardized Sthan Type field
    sthanTypeId?: string; // Link to Manage Sthan Types ID
    pinIcon?: string; // Persisted pin icon path or key
    
    // Legacy fields
    avatarSambandh?: string;
    avatarSubdivision?: string;

    description?: string;
    description_title?: string;
    description_text?: string;
    glanceItems?: GlanceItem[];
    customBlocks?: CustomBlock[];
    architectureDescription?: string; // New: Overall architectural description
    descriptionSections?: DescriptionSection[]; // New: Dynamic content blocks
    sthana?: string;
    sthana_info_title?: string;
    sthana_info_text?: string;
    directions_title?: string;
    directions_text?: string;
    leela?: string;
    history?: string;
    /** @deprecated Use sthanImages */
    images?: string[];
    sthanImages?: string[];
    sthanImagesFitMode?: 'cover' | 'contain'; // New: Fit mode for sthan images
    /** @deprecated Use architectureImages */
    architectureImage?: string;
    architectureImages?: string[];
    architectureImagesFitMode?: 'cover' | 'contain'; // New: Fit mode for architecture images
    /** @deprecated Use presentImages */
    presentImage?: string;
    presentImages?: string[];
    presentImagesFitMode?: 'cover' | 'contain'; // New: Fit mode for present images
    hotspots?: Hotspot[];
    presentHotspots?: Hotspot[];
    present_hotspots?: Hotspot[];
    updatedAt?: any;
    is_published?: boolean;
    isVerified?: boolean; // Legacy: Syncs with status === 'VERIFIED'
    isComplete?: boolean; // Legacy: Syncs with status === 'COMPLETE' || 'VERIFIED'
    status?: SthanaStatus; // New: Controlled status system
    verifiedAt?: any;
    verifiedBy?: string;
    publishedAt?: any;
    publishedBy?: string;
    hasArchitecture?: boolean;       // Replacement for isStandalone
    architectureId?: string | null;  // null for standalone, id for linked
    leelas?: Leela[];               // Global leelas (for standalone)
    sthanPothiDescription?: string;  // Global pothi (for standalone)
    sthanPothiTitle?: string;        // Global pothi title (for standalone)
    details?: SthanDetail[]; // New: Unified dynamic details array
}

export interface SthanDetail {
  id: string;
  title: string;
  description: string;
  images: string[];
  leelas: Leela[];
  sthanPothiDescription?: string;
  sthanPothiTitle?: string;
  generalDescriptionTitle?: string;
  hotspotId?: string | null; // Optional link to a map marker
  type?: string; // e.g. 'Structure', 'Tree', 'Ghat'
  fitMode?: 'cover' | 'contain'; // New: Image fit preference
}

export interface YatraPlace {
    id: string;
    name: string;
    description: string;
    sequence: number;
    status: "visited" | "stayed" | "revisited" | "current" | "upcoming";
    latitude?: number;
    longitude?: number;
    image?: string;
    fitMode?: 'cover' | 'contain'; // New: Image fit preference
    time?: string;
    isLive?: boolean;
    attendees?: string;
    route?: string;
    subRoute?: string;
    locationLink?: string;
    pinColor?: string;
}

export interface TempleSubmission {
    id: string;
    submission_type: string;
    status: string;
    data: any;
    notes?: string;
    created_at: any;
    reviewed_at?: any;
}
