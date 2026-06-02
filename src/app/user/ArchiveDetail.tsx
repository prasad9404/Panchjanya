import { useNavigate, useParams, Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Layers, Loader2, Info, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useArchive, useArchiveEntries } from "@/shared/hooks/useArchives";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

export default function ArchiveDetail() {
    const { id: archiveId } = useParams<{ id: string }>();
    const { t, i18n } = useTranslation();
    const langCode = getLangCode(i18n.language || "en");
    const navigate = useNavigate();

    const { data: archive, isLoading: archiveLoading } = useArchive(archiveId);
    const { data: entries = [], isLoading: entriesLoading } = useArchiveEntries(archiveId);

    const isLoading = archiveLoading || entriesLoading;

    // Filter to only enabled entries (show all if no enabled flag set)
    const visibleEntries = entries.filter((e) => e.enabled !== false);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-[#0f3c6e]" />
                    <p className="text-sm font-medium text-slate-500 animate-pulse">
                        {t("common.loading")}
                    </p>
                </div>
            </div>
        );
    }

    if (!archive) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">Archive not found.</p>
                    <Button onClick={() => navigate(-1)}>{t("common.goBack")}</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full flex-1 bg-background font-sans animate-in fade-in duration-500 pb-12">
            {/* Header */}
            <div className="sticky top-0 z-30 px-4 py-4 flex items-center justify-between bg-background/95 backdrop-blur-sm">
                <Button
                    variant="ghost"
                    size="icon"
                    className="-ml-2 hover:bg-accent/10"
                    onClick={() => navigate(-1)}
                >
                    <ChevronLeft className="w-7 h-7 text-landing-primary dark:text-primary" />
                </Button>
                <h1 className="text-xl md:text-2xl font-heading font-bold text-landing-primary dark:text-primary font-serif truncate max-w-[60vw]">
                    {getTranslatedValue(archive.title, langCode)}
                </h1>
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                    <Layers className="w-5 h-5 text-accent-gold" />
                </div>
            </div>

            <div className="px-6 space-y-8">
                {/* Archive Banner / Description */}
                {(archive.thumbnail || getTranslatedValue(archive.description, langCode).trim()) && (
                    <Card className="overflow-hidden border-none rounded-3xl shadow-sm relative">
                        {archive.thumbnail && (
                            <div className="h-48 md:h-64 overflow-hidden">
                                <LazyImage
                                    src={archive.thumbnail}
                                    alt={getTranslatedValue(archive.title, langCode)}
                                    containerClassName="h-full w-full"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                            </div>
                        )}
                        {getTranslatedValue(archive.description, langCode).trim() && (
                            <div className="p-6 relative z-10">
                                <p className="text-muted-foreground text-base leading-relaxed">
                                    {getTranslatedValue(archive.description, langCode)}
                                </p>
                            </div>
                        )}
                    </Card>
                )}

                {/* Section heading */}
                <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">
                        Explore Architectures
                    </h2>
                    <span className="text-xs font-bold text-muted-foreground bg-accent/10 px-3 py-1 rounded-full">
                        {visibleEntries.length} Entries
                    </span>
                </div>

                {/* Entry Grid */}
                {visibleEntries.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleEntries.map((entry) => (
                            <Link
                                to={`/architectural-archive/${archiveId}/${entry.id}/architecture`}
                                key={entry.id}
                            >
                                <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all h-full flex flex-col">
                                    {/* Thumbnail */}
                                    <div className="h-40 bg-muted relative overflow-hidden">
                                        {entry.thumbnail ||
                                        (entry.architectureImages &&
                                            entry.architectureImages.length > 0) ? (
                                            <LazyImage
                                                src={
                                                    entry.thumbnail ||
                                                    entry.architectureImages?.[0] ||
                                                    ""
                                                }
                                                alt={getTranslatedValue(entry.title || (entry as any).name, langCode)}
                                                containerClassName="h-full w-full"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/10 to-amber-500/10">
                                                <MapPin className="w-10 h-10 text-landing-primary/30" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4 space-y-2 flex-1 flex flex-col">
                                        <h3 className="font-bold text-lg text-landing-primary dark:text-primary group-hover:text-accent-gold transition-colors leading-tight">
                                            {getTranslatedValue(entry.title || (entry as any).name, langCode) || "New Architecture Entry"}
                                        </h3>
                                        {entry.subtitle && getTranslatedValue(entry.subtitle, langCode).trim() && (
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {getTranslatedValue(entry.subtitle, langCode)}
                                            </p>
                                        )}
                                        {entry.description && getTranslatedValue(entry.description, langCode).trim() && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {getTranslatedValue(entry.description, langCode)}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-2">
                                            <Button className="w-full bg-landing-primary group-hover:bg-primary transition-colors text-sm h-9">
                                                Explore Architecture
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="py-16 text-center border-2 border-dashed border-accent/20 rounded-xl bg-accent/5">
                        <Info className="w-10 h-10 text-accent-gold mx-auto mb-3" />
                        <p className="text-foreground font-medium">
                            No architecture entries yet for this archive.
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Content is being curated. Check back soon.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
