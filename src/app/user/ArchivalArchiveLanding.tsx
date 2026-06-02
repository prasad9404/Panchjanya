import { useNavigate, Link } from "react-router-dom";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ChevronLeft, Layers, Loader2, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useArchives } from "@/shared/hooks/useArchives";
import { LazyImage } from "@/shared/components/ui/LazyImage";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

export default function ArchivalArchiveLanding() {
    const { t, i18n } = useTranslation();
    const langCode = getLangCode(i18n.language || "en");
    const navigate = useNavigate();
    const { data: archives = [], isLoading } = useArchives();

    // Filter to only enabled archives (show all if no enabled flag set)
    const visibleArchives = archives.filter((a) => a.enabled !== false);

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

    return (
        <div className="min-h-full flex-1 bg-background font-sans animate-in fade-in duration-500 space-y-10 pb-12">
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
                <h1 className="text-2xl md:text-3xl font-heading font-bold text-landing-primary dark:text-primary font-serif">
                    Architectural Archive
                </h1>
                <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center border border-accent/20">
                    <Layers className="w-5 h-5 text-accent-gold" />
                </div>
            </div>

            <div className="px-6 space-y-6">
                {/* Section heading */}
                <div className="flex items-center justify-between border-l-4 border-primary pl-3">
                    <h2 className="font-heading font-bold text-xl text-landing-primary dark:text-primary">
                        Heritage Site Collections
                    </h2>
                    <span className="text-xs font-bold text-muted-foreground bg-accent/10 px-3 py-1 rounded-full">
                        {visibleArchives.length} Sites
                    </span>
                </div>

                {/* Archive Grid */}
                {visibleArchives.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleArchives.map((archive) => (
                            <Link
                                to={`/architectural-archive/${archive.id}`}
                                key={archive.id}
                            >
                                <Card className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all h-full flex flex-col">
                                    {/* Thumbnail */}
                                    <div className="h-44 bg-muted relative overflow-hidden">
                                        {archive.thumbnail ? (
                                            <LazyImage
                                                src={archive.thumbnail}
                                                alt={getTranslatedValue(archive.title, langCode)}
                                                containerClassName="h-full w-full"
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/10 to-amber-500/10">
                                                <Layers className="w-12 h-12 text-landing-primary/30" />
                                            </div>
                                        )}
                                        {/* Architecture count badge */}
                                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
                                            <Layers className="w-3 h-3" />
                                            {archive.architectures?.length || 0} Architectures
                                        </div>
                                        {archive.featured && (
                                            <div className="absolute top-3 left-3 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">
                                                Featured
                                            </div>
                                        )}
                                    </div>

                                    {/* Card body */}
                                    <div className="p-4 space-y-3 flex-1 flex flex-col">
                                        <div>
                                            <h3 className="font-bold text-lg text-landing-primary dark:text-primary group-hover:text-accent-gold transition-colors leading-tight">
                                                {getTranslatedValue(archive.title, langCode)}
                                            </h3>
                                            {getTranslatedValue(archive.subtitle, langCode).trim() && (
                                                <p className="text-xs text-muted-foreground font-medium mt-0.5">
                                                    {getTranslatedValue(archive.subtitle, langCode)}
                                                </p>
                                            )}
                                        </div>
                                        {getTranslatedValue(archive.description, langCode).trim() && (
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {getTranslatedValue(archive.description, langCode)}
                                            </p>
                                        )}
                                        <div className="mt-auto pt-2">
                                            <Button className="w-full bg-landing-primary group-hover:bg-primary transition-colors text-sm h-9">
                                                Explore Archive
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
                            No architectural archives available yet.
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            Check back later for curated heritage collections.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
