import { MultilingualString } from "@/types";

/**
 * Resolves a multilingual field based on the target language.
 * Falls back to English if the target language is missing.
 * @param field The multilingual object or a legacy string
 * @param lang The target language code ('en', 'hi', 'mr')
 */
export function getTranslatedValue(field: MultilingualString | string | undefined, lang: string = 'en'): string {
    if (!field) return '';
    
    if (typeof field === 'string') return field;
    
    // Explicitly handle language keys
    const targetValue = field[lang as keyof MultilingualString];
    
    // Return target value if exists, otherwise fallback to English
    return targetValue || field.en || '';
}

/**
 * Hook-like helper to get language code from the app's Language type
 * app language: "english" | "hindi" | "marathi"
 * returns: "en" | "hi" | "mr"
 */
export function getLangCode(language: string): 'en' | 'hi' | 'mr' {
    switch (language) {
        case 'hindi': return 'hi';
        case 'marathi': return 'mr';
        case 'english':
        default: return 'en';
    }
}
