import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Landmark,
  BookOpen,
  Library,
  Settings,
  BarChart3,
  PlusCircle,
  FileSpreadsheet,
  Compass,
  LogOut
} from "lucide-react";
import { useAuth } from "@/auth/AuthContext";

export default function AdminSidebar() {
  const { signOut } = useAuth();
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" },
    { icon: Users, label: "User Management", path: "/admin/users" },
    { icon: Landmark, label: "Sthana Directory", path: "/admin/sthana-directory" },
    { icon: Compass, label: "Raj Viharan", path: "/admin/raj-viharan" },
    { icon: BookOpen, label: "Literature Hub", path: "/admin/literature" },
    { icon: Library, label: "Digital Library", path: "/admin/e-library" },
  ];

  const systemItems = [
    { icon: Settings, label: "Platform Settings", path: "/admin/settings" },
    { icon: BarChart3, label: "Analytics & Reports", path: "/admin/analytics" },
  ];

  return (
    <aside className="w-72 bg-[#111827] text-white flex flex-col shrink-0 border-r border-white/5 font-[Manrope]">
      {/* Branding */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center p-1 border border-[#1E3A8A]/30 shrink-0">
          <img src="/icons/Main logo.svg" alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight text-white">Panchajanya</h1>
          <p className="text-[10px] text-[#C9A961] font-bold uppercase tracking-widest">Admin Console</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${isActive
                ? "bg-[#1E3A8A] text-white"
                : "text-slate-400 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="pt-4 pb-2 px-4">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">System</p>
        </div>

        {systemItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${isActive
                ? "bg-[#1E3A8A] text-white"
                : "text-slate-400 hover:text-white hover:bg-white/10"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Existing Functional Links (hidden or integrated?) 
            Keeping them accessible effectively as 'Tools' or similar if needed. 
            For now, sticking to the visual mock, but I'll add the functional 'Add Temple' etc in Dashboard content or as extra items.
        */}
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-white/5 mt-auto">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
