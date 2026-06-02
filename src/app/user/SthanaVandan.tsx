import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Compass, Info, ChevronLeft, Bell, Loader2, Layers } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTemples } from "@/shared/hooks/useTemples";
import { useArchives, useArchiveEntries } from "@/shared/hooks/useArchives";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";
import { ArchitecturalArchive } from "@/types";

const ArchiveCard = ({ archive, langCode, t }: { archive: ArchitecturalArchive, langCode: string, t: any }) => {
    const { data: entries = [] } = useArchiveEntries(archive.id);
    const visibleEntries = entries.filter((e) => e.enabled !== false);
    
    return (
        <Card className="overflow-hidden group flex flex-col h-full bg-white dark:bg-card hover:shadow-xl transition-all">
            <Link to={`/architectural-archive/${archive.id}`} className="block">
                <div className="h-36 bg-muted relative overflow-hidden">
                    {archive.thumbnail ? (
                        <LazyImage
                            src={archive.thumbnail}
                            alt={getTranslatedValue(archive.title, langCode)}
                            containerClassName="h-full w-full"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/10 to-amber-500/10">
                            <Layers className="w-10 h-10 text-landing-primary/30" />
                        </div>
                    )}
                    {/* Entry count badge */}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Layers className="w-2.5 h-2.5" />
                        {t('temple.architecturesAvailableCount', { count: archive.architectures?.length || visibleEntries.length || 0 })}
                    </div>
                </div>
            </Link>

            <div className="p-4 space-y-3 flex-1 flex flex-col">
                <Link to={`/architectural-archive/${archive.id}`} className="block">
                    <h3 className="font-bold text-base text-landing-primary dark:text-primary group-hover:text-accent-gold transition-colors">
                        {getTranslatedValue(archive.title, langCode)}
                    </h3>
                    {getTranslatedValue(archive.description, langCode).trim() && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {getTranslatedValue(archive.description, langCode)}
                        </p>
                    )}
                </Link>

                {/* Sub-entries list directly on the card */}
                {visibleEntries.length > 0 && (
                    <div className="mt-2 flex flex-col gap-2">
                        {visibleEntries.slice(0, 3).map(entry => (
                            <Link 
                                key={entry.id} 
                                to={`/architectural-archive/${archive.id}/${entry.id}/architecture`}
                                className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-800"
                            >
                                <div className="w-10 h-10 rounded-md overflow-hidden bg-white dark:bg-slate-900 shrink-0 border border-slate-200 dark:border-slate-700">
                                    {entry.thumbnail || entry.architectureImages?.[0] ? (
                                        <LazyImage src={entry.thumbnail || entry.architectureImages?.[0] || ""} alt={getTranslatedValue(entry.title || (entry as any).name, langCode)} containerClassName="w-full h-full" className="w-full h-full object-cover" />
                                    ) : (
                                        <Layers className="w-5 h-5 m-auto mt-2.5 text-slate-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
                                        {getTranslatedValue(entry.title || (entry as any).name, langCode) || "New Architecture Entry"}
                                    </p>
                                    {entry.subtitle && getTranslatedValue(entry.subtitle, langCode).trim() && (
                                        <p className="text-[10px] text-slate-500 truncate">
                                            {getTranslatedValue(entry.subtitle, langCode)}
                                        </p>
                                    )}
                                </div>
                            </Link>
                        ))}
                        {visibleEntries.length > 3 && (
                            <Link to={`/architectural-archive/${archive.id}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium text-center hover:underline pt-1">
                                View {visibleEntries.length - 3} more entries...
                            </Link>
                        )}
                    </div>
                )}

                <div className="flex gap-2 pt-2 mt-auto">
                    <Link to={`/architectural-archive/${archive.id}`} className="w-full">
                        <Button className="w-full bg-landing-primary group-hover:bg-primary transition-colors text-sm h-9">
                            {t('temple.viewArchitecture')}
                        </Button>
                    </Link>
                </div>
            </div>
        </Card>
    );
};

const SthanaVandan = () => {
    const { t, i18n } = useTranslation();
    const langCode = getLangCode(i18n.language || 'en');
    const { data: temples = [], isLoading } = useTemples();
    const { data: archives = [], isLoading: archivesLoading } = useArchives();

    // Removed architectureTemples logic

    // Filter to enabled archives only
    const visibleArchives = archives.filter((a) => a.enabled !== false).slice(0, 6);

    const navigate = useNavigate();

    if (isLoading || archivesLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0f3c6e]" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex-1 bg-background font-sans animate-in fade-in duration-500 space-y-10">
            {/* Header */}
            <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between">
                <Button variant="ghost" size="icon" className="-ml-2 hover:bg-accent/10" onClick={() => navigate(-1)}>
                    <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-primary" />
                </Button>
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font-serif">{t('yatra.vandanTitle')}</h1>
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                    <Bell className="w-5 h-5 text-accent-gold fill-accent-gold" />
                </div>
            </div>

            <div className="px-6 space-y-8">
                <div className="flex items-center justify-between border-l-4 border-primary pl-3 mt-4">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">{t('yatra.title')}</h2>
                </div>

                <Card className="p-8 bg-card border-none rounded-3xl overflow-hidden relative shadow-sm">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl -translate-y-12 translate-x-12" />
                    <div className="relative z-10">
                        <p className="text-muted-foreground text-lg mb-8 max-w-[90%] leading-relaxed font-medium">
                            {t('yatra.vandanDesc')}
                        </p>
                        <Button
                            onClick={() => navigate('/raj-viharan')}
                            className="w-full bg-landing-primary hover:bg-landing-primary/90 text-white py-8 rounded-2xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-4 group"
                        >
                            <div className="p-1 bg-accent-gold rounded-full group-hover:scale-110 transition-transform">
                                <Compass className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-lg tracking-wide">{t('yatra.seeViharan')}</span>
                        </Button>
                    </div>
                </Card>
            </div>

            <div className="space-y-6 pt-4 pb-10 px-6">
                {/* ─── Architectural Archive Section ─── */}
                {visibleArchives.length > 0 && (
                    <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-l-4 border-amber-500 pl-3">
                            <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">
                                {t('temple.archiveCollections')}
                            </h2>
                            <Button
                                variant="link"
                                className="text-xs font-bold text-accent-gold uppercase tracking-widest p-0 h-auto"
                                onClick={() => navigate('/architectural-archive')}
                            >
                                {t('common.viewAll')}
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                            {visibleArchives.map((archive) => (
                                <ArchiveCard key={archive.id} archive={archive} langCode={langCode} t={t} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SthanaVandan;
