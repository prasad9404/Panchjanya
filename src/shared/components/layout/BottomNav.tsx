import { Home, Map as MapIcon, Compass, Footprints, User, Search, Bookmark, Settings, Feather } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { useLanguage } from "@/shared/contexts/LanguageContext";

export const BottomNav = () => {
    const location = useLocation();
    const { t } = useLanguage();
    const isSthanaVandan = location.pathname.includes("sthana-vandan") || location.pathname.includes("/raj-viharan");

    return (
        <nav className="fixed bottom-0 left-0 right-0 w-full z-50 bg-[#F8F9FA]/95 backdrop-blur-sm border-t border-gray-100 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.03)] supports-[backdrop-filter]:bg-[#F8F9FA]/80">
            <div className="flex justify-between items-center h-20 px-6 lg:px-12">

                {isSthanaVandan ? (
                    <>
                        {/* Sthana Vandan Bottom Bar */}
                        {/* Home (Dashboard) */}
                        <NavLink to="/dashboard" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && location.pathname === "/dashboard" && "text-primary")}>
                            <Home className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.home")}</span>
                        </NavLink>

                        {/* Sthaan */}
                        <NavLink to="/dashboard/sthana-vandan" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <MapIcon className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.sthaan")}</span>
                        </NavLink>

                        {/* Central Floating Button (Explore Map) */}
                        <NavLink to="/explore" className="relative -top-6">
                            <div className="w-16 h-16 bg-landing-primary rounded-full flex items-center justify-center shadow-lg border-4 border-background hover:scale-105 transition-transform">
                                <img src="/icons/explore_safari.png" alt={t("nav.explore")} className="w-8 h-8 object-contain brightness-0 invert" />
                            </div>
                        </NavLink>

                        {/* Viharan (Yatra) */}
                        <NavLink to="/raj-viharan" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Footprints className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.viharan")}</span>
                        </NavLink>

                        {/* Profile */}
                        <NavLink to="/profile" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <User className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.profile")}</span>
                        </NavLink>
                    </>
                ) : (
                    <>
                        {/* Main Dashboard Bottom Bar */}
                        {/* Home */}
                        <NavLink to="/dashboard" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Home className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.home")}</span>
                        </NavLink>

                        {/* Search */}
                        <NavLink to="/search" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Search className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.search")}</span>
                        </NavLink>

                        {/* Central Floating Button (Explore Map) */}
                        <NavLink to="/explore" className="relative -top-6">
                            <div className="w-16 h-16 bg-landing-primary rounded-full flex items-center justify-center shadow-lg border-4 border-background hover:scale-105 transition-transform">
                                <img src="/icons/explore_safari.png" alt={t("nav.explore")} className="w-8 h-8 object-contain brightness-0 invert" />
                            </div>
                        </NavLink>

                        {/* Saved */}
                        <NavLink to="/saved" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Bookmark className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.saved")}</span>
                        </NavLink>

                        {/* More */}
                        <NavLink to="/settings" className={({ isActive }) => cn("flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors", isActive && "text-primary")}>
                            <Settings className="w-6 h-6" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">{t("nav.more")}</span>
                        </NavLink>
                    </>
                )}

            </div>
        </nav>
    );
};
