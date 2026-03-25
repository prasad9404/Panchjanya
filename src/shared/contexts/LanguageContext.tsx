import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n";

type Language = "marathi" | "hindi" | "english";

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, options?: any) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const langMap: Record<Language, string> = {
    marathi: "mr",
    hindi: "hi",
    english: "en"
};

const revLangMap: Record<string, Language> = {
    mr: "marathi",
    hi: "hindi",
    en: "english"
};

export function LanguageProvider({ children }: { children: ReactNode }) {
    const { t: i18nT } = useTranslation();
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem("i18nextLng");
        if (saved && revLangMap[saved]) return revLangMap[saved];
        
        const legacySaved = localStorage.getItem("language");
        if (legacySaved && (legacySaved === "marathi" || legacySaved === "hindi" || legacySaved === "english")) {
            return legacySaved;
        }
        return "marathi";
    });

    useEffect(() => {
        const i18nLang = langMap[language];
        if (i18n.language !== i18nLang) {
            i18n.changeLanguage(i18nLang);
        }
        
        // Apply Kokila font if language is Marathi
        if (language === "marathi") {
            document.body.classList.add("font-kokila");
        } else {
            document.body.classList.remove("font-kokila");
        }
    }, [language]);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
    };

    const t = (key: string, options?: any): string => {
        const result = i18nT(key, options);
        return typeof result === "string" ? result : key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within LanguageProvider");
    }
    return context;
}
