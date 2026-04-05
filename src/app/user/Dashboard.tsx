import { useAuth } from "@/auth/AuthContext";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
    BookOpen,
    Sparkles,
    BrainCircuit,
    Library,
    ChevronRight,
    HelpCircle,
    User,
    Map
} from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/shared/contexts/LanguageContext";

const Dashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const userName = user?.displayName; // Fallback name from design

    return (
        <div className="w-full min-h-full flex-1 ">
            <div className="max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl px-4 lg:px-6 space-y-12 lg:space-y-16 animate-in fade-in duration-500">

                {/* Top Bar - Homepage Logo Header */}
                <div className="flex flex-col items-center justify-center pt-0 pb-0 w-full cursor-default overflow-hidden">
                    <img
                        src="/icons/Homepage logo.svg"
                        alt="Panchjanya Homepage Logo"
                        className="h-32 sm:h-40 md:h-48 lg:h-56 w-auto max-w-[85%] object-contain scale-[1.3] md:scale-[1.2] lg:scale-[1.0] mix-blend-multiply transition-all duration-500"
                    />
                </div>

                {/* Greeting Section */}
                <div className="flex flex-col items-center space-y-1 mb-4 lg:mb-6">
                    {userName && (
                        <h1 className="text-2xl lg:text-3xl font-heading font-bold text-[#0f3c6e]">
                            {userName}
                        </h1>
                    )}
                    <p className="text-[#D97706] italic font-medium font-serif text-lg tracking-wide">
                        {t("dashboard.greeting")}
                    </p>
                </div>

                {/* Main Grid Navigation */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 px-2 md:px-0">

                    {/* Literature - Top Left */}
                    <Link to="/literature" className="group">
                        <Card className="h-full p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white shadow-[0_4px_20px_-2px_rgba(180,138,23,0.1)]">
                            <div className="flex justify-start">
                                <div className="p-3 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/40 group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-heading font-bold text-lg text-blue-900 group-hover:text-[#B48A17] transition-colors">
                                    {t("dashboard.literature")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("dashboard.literatureDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Digital Library - Top Right */}
                    <Link to="/e-library" className="group">
                        <Card className="h-full p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white shadow-[0_4px_20px_-2px_rgba(180,138,23,0.1)]">
                            <div className="flex justify-start">
                                <div className="p-3 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/40 group-hover:scale-110 transition-transform duration-300">
                                    <Library className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-heading font-bold text-lg text-blue-900 group-hover:text-[#B48A17] transition-colors">
                                    {t("dashboard.digitalLibrary")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("dashboard.digitalLibraryDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* What's New - Bottom Left */}
                    <Link to="/whats-new" className="group">
                        <Card className="h-full p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white shadow-[0_4px_20px_-2px_rgba(180,138,23,0.1)]">
                            <div className="flex justify-start">
                                <div className="p-3 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/40 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-heading font-bold text-lg text-blue-900 group-hover:text-[#B48A17] transition-colors">
                                    {t("dashboard.whatsNew")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("dashboard.whatsNewDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Jigyasa - Bottom Right */}
                    <Link to="/jigyasa" className="group">
                        <Card className="h-full p-5 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white shadow-[0_4px_20px_-2px_rgba(180,138,23,0.1)]">
                            <div className="flex justify-start">
                                <div className="p-3 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/40 group-hover:scale-110 transition-transform duration-300">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 space-y-1">
                                <h3 className="font-heading font-bold text-lg text-blue-900 group-hover:text-[#B48A17] transition-colors">
                                    {t("dashboard.jigyasa")}
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {t("dashboard.jigyasaDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Link to="/dashboard/sthana-vandan" className="block group">
                        <div className="relative h-full overflow-hidden rounded-2xl bg-[#0f3c6e] p-6 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg group-hover:shadow-xl group-hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                        <img src="/icons/glance/sthan.svg" className="w-12 h-12 object-contain" alt="Sthan Vandan Icon" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-xl">{t("dashboard.sthanVandan")}</h3>
                                        <p className="text-blue-100 text-sm mt-1">
                                            {t("dashboard.sthanVandanDesc")}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative Icon Overlay */}
                            <div className="absolute right-12 bottom-0 opacity-10 pointer-events-none">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white">
                                    <path d="M4 22h16a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1z" />
                                    <path d="M18 18v-8a4 4 0 0 0-1-3l-4-7a2 2 0 0 0-2 0l-4 7a4 4 0 0 0-1 3v8" />
                                    <path d="M12 2v2" />
                                </svg>
                            </div>
                        </div>
                    </Link>

                    {/* Raj Viharan Banner */}
                    <Link to="/raj-viharan" className="block group">
                        <div className="relative h-full overflow-hidden rounded-2xl bg-[#0f3c6e] p-6 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg group-hover:shadow-xl group-hover:-translate-y-1">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                        <Map className="w-10 h-10 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-xl">{t("dashboard.rajViharan")}</h3>
                                        <p className="text-blue-100 text-sm mt-1">
                                            {t("dashboard.rajViharanDesc")}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-6 h-6 text-white/70 group-hover:translate-x-1 transition-transform" />
                            </div>

                            {/* Decorative Icon Overlay */}
                            <div className="absolute right-12 bottom-0 opacity-10 pointer-events-none">
                                <svg viewBox="0 0 24 24" fill="currentColor" className="w-24 h-24 text-white">
                                    <circle cx="12" cy="12" r="3" />
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-[#D97706] pl-3">
                        <h2 className="font-heading font-bold text-xl text-blue-900">{t("dashboard.quickSupport")}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/help-center" className="block">
                            <Button variant="outline" className="w-full justify-between h-full py-4 px-5 rounded-xl border-border/50 bg-white hover:border-primary/50 hover:bg-orange-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/40 rounded-full">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-lg">{t("dashboard.aboutPanchjanya")}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        <Link to="/profile" className="block">
                            <Button variant="outline" className="w-full justify-between h-full py-4 px-5 rounded-xl border-border/50 bg-white shadow-sm hover:border-primary/50 hover:bg-orange-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/40 rounded-full">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-lg">{t("dashboard.myAccount")}</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
