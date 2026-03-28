import React from "react";
import { useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Landmark,
  BookOpen,
  Library,
  Settings,
  BarChart3,
  Compass,
  LogOut,
  UserCircle,
  ShieldCheck
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/shared/lib/utils";
import { Sidebar, SidebarBody, SidebarLink } from "@/shared/components/ui/sidebar-modern";
import { motion } from "framer-motion";

interface AdminSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function AdminSidebar({ isCollapsed, setIsCollapsed }: AdminSidebarProps) {
  const { signOut, user } = useAuth();
  const location = useLocation();

  const navLinks = [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5 flex-shrink-0" /> },
    { label: "User Management", href: "/admin/users", icon: <Users className="h-5 w-5 flex-shrink-0" /> },
    { label: "Sthana Directory", href: "/admin/sthana-directory", icon: <Landmark className="h-5 w-5 flex-shrink-0" /> },
    { label: "Verification", href: "/admin/sthana-verification", icon: <ShieldCheck className="h-5 w-5 flex-shrink-0" /> },
    { label: "Raj Viharan", href: "/admin/raj-viharan", icon: <Compass className="h-5 w-5 flex-shrink-0" /> },
    { label: "Literature Hub", href: "/admin/literature", icon: <BookOpen className="h-5 w-5 flex-shrink-0" /> },
    { label: "Digital Library", href: "/admin/e-library", icon: <Library className="h-5 w-5 flex-shrink-0" /> },
  ];

  const systemLinks = [
    { label: "Platform Settings", href: "/admin/settings", icon: <Settings className="h-5 w-5 flex-shrink-0" /> },
    { label: "Analytics & Reports", href: "/admin/analytics", icon: <BarChart3 className="h-5 w-5 flex-shrink-0" /> },
  ];

  return (
    <Sidebar open={!isCollapsed} setOpen={(open) => setIsCollapsed(!open)}>
      <SidebarBody className="justify-between gap-10 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 font-[Manrope]">
        <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden no-scrollbar">
          <Logo isCollapsed={isCollapsed} />
          
          <div className="mt-8 flex flex-col gap-2">
            <p className={cn("text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 mb-1 transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
              Main Menu
            </p>
            {navLinks.map((link, idx) => (
              <SidebarLink 
                key={idx} 
                link={link} 
                className={cn(
                  "px-2 rounded-lg transition-colors",
                  location.pathname === link.href 
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              />
            ))}
            
            <div className="pt-4 mt-2 border-t border-gray-100 dark:border-gray-800">
              <p className={cn("text-[10px] text-gray-400 font-bold uppercase tracking-widest px-2 mb-1 transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                System
              </p>
              {systemLinks.map((link, idx) => (
                <SidebarLink 
                  key={idx} 
                  link={link} 
                  className={cn(
                    "px-2 rounded-lg transition-colors",
                    location.pathname === link.href 
                      ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-gray-100 dark:border-gray-800 pt-4">
          <SidebarLink
            link={{
              label: user?.displayName || "Administrator",
              href: "/admin/profile",
              icon: (
                <div className="h-7 w-7 flex-shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <UserCircle className="h-5 w-5" />
                </div>
              ),
            }}
          />
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-2 py-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full group/sidebar"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <motion.span
              animate={{
                display: !isCollapsed ? "inline-block" : "none",
                opacity: !isCollapsed ? 1 : 0,
              }}
              className="text-sm font-medium whitespace-pre transition duration-150"
            >
              Logout
            </motion.span>
          </button>
        </div>
      </SidebarBody>
    </Sidebar>
  );
}

const Logo = ({ isCollapsed }: { isCollapsed: boolean }) => {
  return (
    <div className={cn("flex items-center gap-3 transition-all duration-300", isCollapsed ? "px-0 justify-center" : "px-2")}>
      <div className={cn("bg-white rounded-full flex items-center justify-center shadow-md border border-gray-100 shrink-0 overflow-hidden p-1 transition-all duration-300", isCollapsed ? "w-8 h-8" : "w-10 h-10")}>
        <img src="/icons/Main logo.svg" alt="Logo" className="w-full h-full object-contain" />
      </div>
      <motion.div
        animate={{
          opacity: isCollapsed ? 0 : 1,
          display: isCollapsed ? "none" : "block",
        }}
        className="transition-opacity duration-200"
      >
        <span className="block text-sm font-extrabold text-gray-900 dark:text-gray-100">
          Panchjanya
        </span>
        <span className="block text-[10px] text-[#C9A961] font-bold uppercase tracking-widest">
          Admin Console
        </span>
      </motion.div>
    </div>
  );
};
