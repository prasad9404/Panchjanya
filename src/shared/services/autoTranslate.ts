import { MultilingualString } from "@/types";
import { translateText } from "./translateText";
import { delay } from "../utils/delay";

/**
 * Helper to translate English text into Hindi and Marathi.
 * Returns a complete MultilingualString object.
 * 
 * Features:
 * - Translates English -> Hindi -> Marathi sequentially
 * - Implements 600ms delay between requests to prevent API rate-limiting
 * - Skips translation if text is empty
 * - Returns original English as fallback on failure
 */
export async function autoTranslateMultilingual(englishText: string): Promise<MultilingualString> {
    if (!englishText || englishText.trim() === "") {
        return { en: englishText, hi: "", mr: "" };
    }

    try {
        // 1. English -> Hindi
        const hindi = await translateText(englishText, "hi");
        
        // Steady 600ms delay between calls as requested
        await delay(600);

        // 2. English -> Marathi (Sequential)
        const marathi = await translateText(englishText, "mr");

        return {
            en: englishText,
            hi: hindi,
            mr: marathi
        };
    } catch (error) {
        console.error("[AutoTranslate] Helper failed:", error);
        // On fatal error, return original English for all fields
        return {
            en: englishText,
            hi: englishText,
            mr: englishText
        };
    }
}
