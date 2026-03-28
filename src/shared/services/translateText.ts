import { delay } from "../utils/delay";

/**
 * Core translation function using Google Cloud Translation API.
 * 
 * Features:
 * - Direct Google Cloud API integration
 * - Retry mechanism (max 3 retries)
 * - 800ms delay between retries
 * - Robust error handling
 * - Fallback to original English on failure
 */
export async function translateText(text: string, targetLang: "hi" | "mr"): Promise<string> {
    if (!text || text.trim() === "") return "";

    const API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_KEY;
    
    if (!API_KEY) {
        console.error("[Translate] Google Translation API Key is missing (VITE_GOOGLE_TRANSLATE_KEY)");
        return text;
    }

    const endpoint = `https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`;
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 800;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json" 
                },
                body: JSON.stringify({
                    q: text,
                    source: "en",
                    target: targetLang,
                    format: "text"
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.warn(`[Translate] Google API Error (Attempt ${attempt + 1}/${MAX_RETRIES + 1}):`, response.status, errorData);
                
                if (attempt < MAX_RETRIES) {
                    await delay(RETRY_DELAY);
                    continue;
                }
                return text;
            }

            const data = await response.json();
            
            if (data?.data?.translations?.[0]?.translatedText) {
                return data.data.translations[0].translatedText;
            }

            console.warn("[Translate] Unexpected API response format:", data);
            return text;

        } catch (error) {
            console.error(`[Translate] Connection Error (Attempt ${attempt + 1}):`, error);
            
            if (attempt < MAX_RETRIES) {
                await delay(RETRY_DELAY);
                continue;
            }
            return text;
        }
    }

    return text;
}
