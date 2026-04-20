// Centralized interfaces for Temple Architecture

export interface MultilingualString {
    en: string;
    hi?: string;
    mr?: string;
}

export interface Leela {
    id: string;
    title?: MultilingualString; // New: Title for the leela
    description: MultilingualString;
    number?: number;
}

export type HotspotType = 'structure' | 'asset' | 'entry' | 'special' | 'zone';

/**
 * PinType classifies each SthanDetail item, controlling:
 * - Whether it appears as an image pin on the architecture map
 * - Which section/heading it falls under in the user-facing list
 */
export type PinType =
  | 'ARCHITECTURE_LINKED'      // Normal mapped hotspot, shown on image & linked section
  | 'ARCHITECTURE_UNAVAILABLE' // Shown on image but listed under Unavailable Sthan
  | 'ARCHITECTURE_INDEPENDENT' // Shown on image, independent marker (custom section)
  | 'INFO_ONLY';               // Not on image, only shows in list (info section)

export interface Hotspot {
    id: string;
    x: number;
    y: number;
    title: MultilingualString;
    description: MultilingualString;
    type?: HotspotType; // New: Categorization
    parentId?: string; // New: For clustering/grouping
    significance?: MultilingualString; // Detailed architectural/spiritual info
    sthanPothiTitle?: MultilingualString; // New: Title for Sthan Pothi section
    sthanPothiDescription?: MultilingualString; // New: Specific description for sthan pothi
    generalDescriptionTitle?: MultilingualString; // New: Title for General Description section
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
    title: MultilingualString;
    content: MultilingualString;
    page_type?: 'page1' | 'page2';
    order?: number;
}

export interface GlanceItem {
    id: string;
    icon: string;
    description: MultilingualString;
}

export interface AbbreviationItem {
    id: string;
    icon: string;
    description: MultilingualString;
}

export interface CustomBlock {
    id: string;
    title: MultilingualString;
    content: MultilingualString;
    page_type?: 'page1' | 'page2';
    order?: number;
}

export interface RelatedAvatar {
    avatar: string;
    subtype: string[];
}

export interface TempleSection {
    id: string;
    title: MultilingualString;
    /**
     * 'linked'    → ARCHITECTURE_LINKED items (auto)
     * 'unlinked'  → ARCHITECTURE_UNAVAILABLE items (auto)
     * 'independent' → ARCHITECTURE_INDEPENDENT items (auto)
     * 'info'      → INFO_ONLY items (auto)
     * 'custom'    → Manual sthanIds assignment
     */
    type: 'linked' | 'unlinked' | 'independent' | 'info' | 'custom';
    sthanIds?: string[]; // Used only for 'custom' type
    isVisible?: boolean;
    order?: number;
}

export type SthanaStatus = "DRAFT" | "IN_PROGRESS" | "COMPLETE" | "VERIFIED" | "PUBLISHED";

export interface Temple {
    id: string;
    name: MultilingualString;
    todaysName?: MultilingualString; // New: Today's name subtitle
    todaysNameTitle?: MultilingualString; // New: Dynamic label for today's name
    address?: MultilingualString;
    locationLink?: string; // New: Direction link or coordinates
    contactName?: string;
    contactNumber?: string;
    contactDetails?: MultilingualString; // New: Additional contact info for Navigation
    city: MultilingualString;
    taluka?: MultilingualString;
    district: MultilingualString;
    location: string | { lat: number; lng: number; address?: MultilingualString };
    latitude: number;
    longitude: number;
    
    // Avatar Hierarchy Fields
    primaryAvatar?: string;
    primarySubtype?: string[];
    relatedAvatars?: RelatedAvatar[];
    sthanType?: MultilingualString; // Standardized Sthan Type field
    sthanTypeId?: string; // Link to Manage Sthan Types ID
    pinIcon?: string; // Persisted pin icon path or key
    
    // Legacy fields
    avatarSambandh?: string;
    avatarSubdivision?: string;

    description?: MultilingualString;
    description_title?: MultilingualString;
    description_text?: MultilingualString;
    glanceItems?: GlanceItem[];
    customBlocks?: CustomBlock[];
    architectureDescription?: MultilingualString; // New: Overall architectural description
    descriptionSections?: DescriptionSection[]; // New: Dynamic content blocks
    sthana?: MultilingualString;
    sthana_info_title?: MultilingualString;
    sthana_info_text?: MultilingualString;
    directions_title?: MultilingualString;
    directions_text?: MultilingualString;
    leela?: MultilingualString;
    history?: MultilingualString;
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
    sthanPothiDescription?: MultilingualString;  // Global pothi (for standalone)
    sthanPothiTitle?: MultilingualString;        // Global pothi title (for standalone)
    details?: SthanDetail[]; // New: Unified dynamic details array
    detailsSections?: TempleSection[]; // Groupings for Sthan Details
}

export interface SthanDetail {
  id: string;
  title: MultilingualString;
  description: MultilingualString;
  images: string[];
  leelas: Leela[];
  sthanPothiDescription?: MultilingualString;
  sthanPothiTitle?: MultilingualString;
  generalDescriptionTitle?: MultilingualString;
  hotspotId?: string | null; // Optional link to a map marker
  type?: string; // e.g. 'Structure', 'Tree', 'Ghat'
  fitMode?: 'cover' | 'contain';
  /** Controls rendering on map and section grouping */
  pinType?: PinType;
  number?: number; // Display order number
}

export interface YatraPlace {
    id: string;
    name: MultilingualString;
    description: MultilingualString;
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
