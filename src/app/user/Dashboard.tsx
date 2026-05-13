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
            <div className="max-w-md mx-auto lg:max-w-4xl xl:max-w-6xl 2xl:max-w-7xl px-4 lg:px-6 space-y-6 lg:space-y-10 animate-in fade-in duration-500 pb-24">

                {/* Top Bar - Homepage Logo Header */}
                <div className="flex flex-col items-center justify-center pt-2 pb-0 w-full cursor-default overflow-hidden">
                    <img
                        src="/icons/Homepage logo.svg"
                        alt="Panchjanya Homepage Logo"
                        className="h-28 sm:h-36 w-auto object-contain relative z-10 drop-shadow-sm transition-all duration-500"
                        style={{ mixBlendMode: 'multiply' }}
                    />
                </div>

                {/* Greeting Section */}
                <div className="flex flex-col items-center space-y-0.5 mb-2 lg:mb-4">
                    {userName && (
                        <h1 className="text-xl lg:text-2xl font-heading font-bold text-[#0f3c6e]">
                            {userName}
                        </h1>
                    )}
                    <p className="text-amber-600 italic font-medium font-serif text-base tracking-wide">
                        {t("dashboard.greeting")}
                    </p>
                </div>

                {/* Main Grid Navigation */}
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 px-2 md:px-0">

                    {/* Literature - Top Left */}
                    <Link to="/literature" className="group">
                        <Card className="h-full p-4 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white/80 backdrop-blur-sm shadow-[0_4px_15px_-3px_rgba(180,138,23,0.08)]">
                            <div className="flex justify-start">
                                <div className="p-2.5 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/30 group-hover:scale-110 transition-transform duration-300">
                                    <BookOpen className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <h3 className="font-heading font-bold text-[15px] text-blue-900 group-hover:text-[#B48A17] transition-colors leading-tight">
                                    {t("dashboard.literature")}
                                </h3>
                                <p className="text-[10px] text-muted-foreground leading-tight opacity-80">
                                    {t("dashboard.literatureDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Digital Library - Top Right */}
                    <Link to="/e-library" className="group">
                        <Card className="h-full p-4 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white/80 backdrop-blur-sm shadow-[0_4px_15px_-3px_rgba(180,138,23,0.08)]">
                            <div className="flex justify-start">
                                <div className="p-2.5 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/30 group-hover:scale-110 transition-transform duration-300">
                                    <Library className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <h3 className="font-heading font-bold text-[15px] text-blue-900 group-hover:text-[#B48A17] transition-colors leading-tight">
                                    {t("dashboard.digitalLibrary")}
                                </h3>
                                <p className="text-[10px] text-muted-foreground leading-tight opacity-80">
                                    {t("dashboard.digitalLibraryDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* What's New - Bottom Left */}
                    <Link to="/whats-new" className="group">
                        <Card className="h-full p-4 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white/80 backdrop-blur-sm shadow-[0_4px_15px_-3px_rgba(180,138,23,0.08)]">
                            <div className="flex justify-start">
                                <div className="p-2.5 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/30 group-hover:scale-110 transition-transform duration-300">
                                    <Sparkles className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <h3 className="font-heading font-bold text-[15px] text-blue-900 group-hover:text-[#B48A17] transition-colors leading-tight">
                                    {t("dashboard.whatsNew")}
                                </h3>
                                <p className="text-[10px] text-muted-foreground leading-tight opacity-80">
                                    {t("dashboard.whatsNewDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>

                    {/* Jigyasa - Bottom Right */}
                    <Link to="/jigyasa" className="group">
                        <Card className="h-full p-4 flex flex-col justify-between hover:-translate-y-1 transition-all duration-300 border-[#B48A17]/20 bg-white/80 backdrop-blur-sm shadow-[0_4px_15px_-3px_rgba(180,138,23,0.08)]">
                            <div className="flex justify-start">
                                <div className="p-2.5 bg-[#FFF4D1]/40 rounded-xl text-[#B48A17] border border-[#B48A17]/30 group-hover:scale-110 transition-transform duration-300">
                                    <BrainCircuit className="w-5 h-5" />
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <h3 className="font-heading font-bold text-[15px] text-blue-900 group-hover:text-[#B48A17] transition-colors leading-tight">
                                    {t("dashboard.jigyasa")}
                                </h3>
                                <p className="text-[10px] text-muted-foreground leading-tight opacity-80">
                                    {t("dashboard.jigyasaDesc")}
                                </p>
                            </div>
                        </Card>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Link to="/dashboard/sthana-vandan" className="block group">
                        <div className="relative h-full overflow-hidden rounded-2xl bg-[#0f3c6e] p-4 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg group-hover:shadow-xl group-hover:-translate-y-0.5">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                        <img src="/icons/glance/sthan.svg" className="w-10 h-10 object-contain" alt="Sthan Vandan Icon" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg">{t("dashboard.sthanVandan")}</h3>
                                        <p className="text-blue-100 text-[12px] mt-0.5 opacity-90">
                                            {t("dashboard.sthanVandanDesc")}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>

                    {/* Raj Viharan Banner */}
                    <Link to="/raj-viharan" className="block group">
                        <div className="relative h-full overflow-hidden rounded-2xl bg-[#0f3c6e] p-4 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg group-hover:shadow-xl group-hover:-translate-y-0.5">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                            <div className="relative z-10 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                        <Map className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-display font-bold text-lg">{t("dashboard.rajViharan")}</h3>
                                        <p className="text-blue-100 text-[12px] mt-0.5 opacity-90">
                                            {t("dashboard.rajViharanDesc")}
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-white/70 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-[#D97706] pl-3">
                        <h2 className="font-heading font-bold text-xl text-blue-900">{t("dashboard.quickSupport")}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Link to="/help-center" className="block">
                            <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 rounded-xl border-border/50 bg-white/50 backdrop-blur-sm hover:border-primary/50 hover:bg-orange-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/30 rounded-full">
                                        <HelpCircle className="w-4 h-4" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-[15px]">{t("dashboard.aboutPanchjanya")}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        <Link to="/profile" className="block">
                            <Button variant="outline" className="w-full justify-between h-auto py-3 px-4 rounded-xl border-border/50 bg-white/50 backdrop-blur-sm shadow-sm hover:border-primary/50 hover:bg-orange-50/50 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="p-1.5 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/30 rounded-full">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-[15px]">{t("dashboard.myAccount")}</span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Dashboard;
