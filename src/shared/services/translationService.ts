/**
 * Helper to check if a field is a multilingual object or a legacy string.
 * Used for data sanitization when loading from Firestore.
 */
export function ensureMultilingual(value: any): { en: string; hi: string; mr: string } {
    if (typeof value === 'string') {
        return { en: value, hi: '', mr: '' };
    }
    return {
        en: value?.en || '',
        hi: value?.hi || '',
        mr: value?.mr || ''
    };
}
