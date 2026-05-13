import { Home, Map as MapIcon, Compass, Footprints, User, Search, Bookmark, Settings, Feather } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/shared/contexts/LanguageContext";

export const BottomNav = () => {
    const location = useLocation();
    const { t } = useLanguage();
    const isSthanaVandan = location.pathname.includes("sthana-vandan") || location.pathname.includes("/raj-viharan");

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#F8F9FA]/90 backdrop-blur-md border-t border-gray-100 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)] supports-[backdrop-filter]:bg-[#F8F9FA]/75">
            <div className="flex justify-between items-center h-16 px-6 lg:px-12">

                {isSthanaVandan ? (
                    <>
                        {/* Sthana Vandan Bottom Bar */}
                        {/* Home (Dashboard) */}
                        <NavLink to="/dashboard" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && location.pathname === "/dashboard" && "text-primary")}>
                            <Home className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.home")}</span>
                        </NavLink>

                        {/* Sthaan */}
                        <NavLink to="/dashboard/sthana-vandan" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <MapIcon className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.sthan")}</span>
                        </NavLink>

                        {/* Central Floating Button (Explore Map) */}
                        <NavLink to="/explore" className="relative -top-3.5">
                            <div className="w-14 h-14 bg-gradient-to-tr from-[#0f3c6e] to-[#1e5aa0] rounded-full flex items-center justify-center shadow-[0_8px_25px_rgba(15,60,110,0.3)] border-4 border-white hover:scale-110 transition-transform">
                                <img src="/icons/explore_safari.png" alt={t("nav.explore")} className="w-7 h-7 object-contain brightness-0 invert" />
                            </div>
                        </NavLink>

                        {/* Viharan (Yatra) */}
                        <NavLink to="/raj-viharan" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Footprints className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.viharan")}</span>
                        </NavLink>

                        {/* Profile */}
                        <NavLink to="/profile" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <User className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.profile")}</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        {/* Main Dashboard Bottom Bar */}
                        {/* Home */}
                        <NavLink to="/dashboard" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Home className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.home")}</span>
                        </NavLink>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Search className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.search")}</span>
                        </NavLink>

                        {/* Central Floating Button (Explore Map) */}
                        <NavLink to="/explore" className="relative -top-6">
                            <div className="w-16 h-16 bg-landing-primary rounded-full flex items-center justify-center shadow-lg border-4 border-background hover:scale-105 transition-transform">
                                <img src="/icons/explore_safari.png" alt={t("nav.explore")} className="w-8 h-8 object-contain brightness-0 invert" />
                            </div>
                        </NavLink>

                        {/* Saved */}
                        <NavLink to="/saved" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Bookmark className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.saved")}</span>
                        </NavLink>

                        {/* More */}
                        <NavLink to="/settings" className={({ isActive }) => cn("flex flex-col items-center gap-0.5 text-muted-foreground/60 hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Settings className="w-5 h-5" />
                            <span className="text-[9px] font-black uppercase tracking-widest">{t("nav.more")}</span>
                        </NavLink>
                    </>
                )}

            </div>
        </nav>
    );
};
