import { MultilingualString } from "@/types";

/**
 * Resolves a multilingual field based on the target language.
 * Falls back to English if the target language is missing.
 * @param field The multilingual object or a legacy string
 * @param lang The target language code ('en', 'hi', 'mr')
 */
export function getTranslatedValue(field: MultilingualString | string | undefined | null | any, lang: string = 'en'): string {
    if (!field) return '';
    
    if (typeof field === 'string') return field;
    
    if (typeof field === 'object') {
        const targetValue = field[lang as keyof MultilingualString];
        return (targetValue || field.en || field.mr || field.hi || '') as string;
    }
    
    return '';
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
