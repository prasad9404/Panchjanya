import { Temple, SthanaStatus } from "@/types";

/**
 * Validates Sthana status according to the strict 5-tier system:
 * DRAFT -> IN_PROGRESS -> COMPLETE -> VERIFIED -> PUBLISHED
 */
export const getSthanaStatus = (temple: Partial<Temple>): SthanaStatus => {
    // 1. Check for manual locks. A manually verified or published sthana holds its state.
    if (temple.status === 'PUBLISHED') return 'PUBLISHED';
    if (temple.status === 'VERIFIED' || temple.isVerified === true) return 'VERIFIED';
    
    // 2. Evaluate completeness
    // Basic data required to not be a DRAFT
    const hasBasic = Boolean(
        temple.name &&
        temple.sthanTypeId &&
        temple.district
    );

    // Complete data required to be COMPLETE (ready for verification)
    const hasComplete = Boolean(
        hasBasic &&
        // Media requirements
        ((temple.sthanImages && temple.sthanImages.length > 0) || temple.architectureImages?.length) &&
        // Content requirements
        (temple.description || temple.sthana_info_text || (temple.details && temple.details.length > 0))
    );

    if (!hasBasic) return 'DRAFT';
    if (!hasComplete) return 'IN_PROGRESS';

    return 'COMPLETE';
};
