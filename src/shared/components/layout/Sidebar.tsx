import { Home, Map, Compass, BookOpen, ChevronRight } from "lucide-react";
import { NavLink } from "@/shared/components/layout/NavLink";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/components/ui/button";
import { useSidebar } from "@/shared/contexts/SidebarContext";
import { useLanguage } from "@/shared/contexts/LanguageContext";

const navigationLinks = [
  { key: "nav.dashboard", href: "/dashboard", icon: Home },
  { key: "nav.exploreSthanas", href: "/explore", icon: Map },
  { key: "nav.rajViharan", href: "/raj-viharan", icon: Compass },
  { key: "nav.aboutPanchjanya", href: "/about", icon: BookOpen },
];

export const Sidebar = () => {
  const { isExpanded, setIsExpanded, isPinned, setIsPinned } = useSidebar();
  const { t } = useLanguage();

  return (
    <>
      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border flex flex-col z-50 transition-all duration-300 ease-in-out",
          isExpanded ? "w-64" : "w-16",
          "hidden lg:flex" // Hide on mobile, show on desktop
        )}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => !isPinned && setIsExpanded(false)}
      >
        {/* Logo */}
        <div className="h-24 flex items-center justify-center px-4 border-b border-sidebar-border/50 relative">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shadow-primary/20 border-2 border-accent flex-shrink-0 overflow-hidden p-0.5">
              <img src="/icons/Main logo.svg" alt="Panchjanya Logo" className="w-full h-full object-contain" />
            </div>
            <span
              className={cn(
                "font-heading text-lg font-bold text-sidebar-foreground tracking-tight whitespace-nowrap transition-opacity duration-300",
                isExpanded ? "opacity-100" : "opacity-0 w-0"
              )}
            >
              Panchjanya
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-8 px-3 space-y-3 overflow-hidden">
          {navigationLinks.map((item) => (
            <NavLink
              key={item.key}
              to={item.href}
              className="flex items-center gap-4 px-3 py-3.5 rounded-xl text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-all duration-300 group"
              activeClassName="bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
              title={!isExpanded ? t(item.key) : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110" />
              <span
                className={cn(
                  "font-medium tracking-wide whitespace-nowrap transition-all duration-300",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}
              >
                {t(item.key)}
              </span>
            </NavLink>
          ))}
        </nav>

        {/* Pin/Unpin Button */}
        <div className="p-3 border-t border-sidebar-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPinned(!isPinned)}
            className={cn(
              "w-full justify-start gap-3 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/30 transition-all",
              !isExpanded && "justify-center px-0"
            )}
            title={isPinned ? t("sidebar.unpin") : t("sidebar.pin")}
          >
            <ChevronRight className={cn(
              "w-4 h-4 transition-transform duration-300 flex-shrink-0",
              isPinned && "rotate-180"
            )} />
            <span
              className={cn(
                "text-xs font-medium whitespace-nowrap transition-all duration-300",
                isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
              )}
            >
              {isPinned ? t("sidebar.unpin") : t("sidebar.pin")}
            </span>
          </Button>
        </div>

        {/* Footer */}
        <div
          className={cn(
            "p-4 border-t border-sidebar-border/50 transition-all duration-300 overflow-hidden",
            isExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 p-0"
          )}
        >
          <div className="text-[10px] text-sidebar-foreground/40 text-center uppercase tracking-[0.2em]">
            Panchjanya © 2026
          </div>
        </div>
      </aside>

      {/* Hover Trigger Area - Thin strip on the left edge */}
      {!isPinned && !isExpanded && (
        <div
          className="fixed left-0 top-0 h-screen w-2 z-40 hidden lg:block hover:bg-primary/10 transition-colors"
          onMouseEnter={() => setIsExpanded(true)}
        />
      )}
    </>
  );
};
