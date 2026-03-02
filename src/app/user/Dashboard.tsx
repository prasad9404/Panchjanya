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

const Dashboard = () => {
    const { user } = useAuth();
    const userName = user?.displayName; // Fallback name from design

    return (
        <div className="w-full min-h-full flex-1 ">
            <div className="max-w-md mx-auto lg:max-w-4xl px-4 lg:px-6 space-y-8 animate-in fade-in duration-500">

                {/* Top Bar */}
                <div className="relative flex items-center justify-center py-4">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-green-900/10 rounded-full flex items-center justify-center border border-green-900/20">
                        <img src="/icons/Logo.svg" alt="Logo" className="w-12 h-12 object-contain opacity-100" />
                    </div>
                    <h1 className="text-2xl font-heading font-bold text-[#0f3c6e]">Panchajanya</h1>
                </div>

                {/* Greeting Section */}
                <div className="space-y-2 mt-4 lg:mt-0 text-left">
                    <h1 className="text-3xl lg:text-4xl font-heading font-bold text-[#0f3c6e]">
                        {userName}
                    </h1>
                    <p className="text-amber-600 italic text-center font-medium font-serif text-lg">
                        Jai Shri Chakradhar
                    </p>
                </div>

                {/* Main Grid Navigation */}
                <div className="grid grid-cols-2 gap-4 lg:gap-6">

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
                                    Literature
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Ancient texts & sacred scrolls.
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
                                    Digital Library
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Spiritual digital collection.
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
                                    What's New
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Latest updates from the heritage.
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
                                    Jigyasa
                                </h3>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Quest for deep knowledge.
                                </p>
                            </div>
                        </Card>
                    </Link>
                </div>

                <Link to="/dashboard/sthana-vandan" className="block group">
                    <div className="relative overflow-hidden rounded-2xl bg-[#0f3c6e] p-6 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                    <img src="/icons/glance/sthaan.svg" className="w-12 h-12 object-contain" alt="Sthaan Vandan Icon" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-xl">Sthaan Vandan</h3>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Sacred Salutation to holy sites.
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
                    <div className="relative overflow-hidden rounded-2xl bg-[#0f3c6e] p-6 text-white transition-all duration-300 border-b-4 border-[#B48A17]/60 shadow-lg">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                        <div className="relative z-10 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/20 shadow-sm">
                                    <Map className="w-10 h-10 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-display font-bold text-xl">Raj Viharan</h3>
                                    <p className="text-blue-100 text-sm mt-1">
                                        Live Yatra status & historical traces.
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

                <div className="space-y-4">
                    <div className="flex items-center gap-2 border-l-4 border-[#D97706] pl-3">
                        <h2 className="font-heading font-bold text-xl text-blue-900">Quick Support</h2>
                    </div>

                    <div className="space-y-3">
                        <Link to="/help-center">
                            <Button variant="outline" className="w-full justify-between h-auto py-4 px-5 rounded-xl border-border/50 bg-white hover:border-primary/50 hover:bg-orange-50/50 group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/40 rounded-full">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-lg">About Panchajanya</span>
                                </div>
                                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </Link>

                        <Link to="/profile">
                            <Button variant="outline" className="w-full justify-between h-auto py-4 px-5 mt-3 rounded-xl border-border/50 bg-white shadow-sm hover:border-primary/50 hover:bg-orange-50/50 group">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-[#FFF4D1] text-[#B48A17] border border-[#B48A17]/40 rounded-full">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <span className="font-heading font-bold text-amber-900 text-lg">My Account</span>
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
