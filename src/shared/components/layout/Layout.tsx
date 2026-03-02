import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { cn } from "@/shared/lib/utils";
import { useEffect, useRef } from "react";

function LayoutContent() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top on route change
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Also scroll window to be safe
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, [location.pathname]);

  return (
    <div className="flex bg-[#F8F9FA] flex-col overflow-hidden w-full relative min-h-screen">
      {/* Main content */}
      <main
        ref={mainRef}
        className={cn(
          "flex-1 flex flex-col overflow-y-auto pb-main-mobile lg:pb-0 transition-all duration-300 ease-in-out scrollbar-hide scroll-smooth"
        )}
      >
        <Outlet />  {/* Renders nested routes */}
      </main>

      {/* Mobile Bottom Nav - hidden on desktop */}
      <BottomNav />
    </div>
  );
}

export default function Layout() {
  return (
    <LayoutContent />
  );
}