import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { LogOut, Search, Bell, Plus } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { useAuth } from "@/auth/AuthContext";

export default function AdminTopbar() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/admin/login", { replace: true });
    } catch (error) {
      console.error("❌ [AdminTopbar] Logout failed:", error);
    }
  };

  return (
    <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20 font-[Manrope]">
      <div className="flex-1 max-w-xl">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-[#1E3A8A] transition-colors" />
          <Input
            className="w-full bg-slate-50 border-slate-200 rounded-xl py-6 pl-12 pr-4 text-sm focus-visible:ring-2 focus-visible:ring-[#1E3A8A]/20 focus-visible:border-[#1E3A8A] transition-all"
            placeholder="Search records, global settings, or user databases..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-500 hover:text-[#1E3A8A] transition-colors">
          <Bell className="w-6 h-6" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[#C9A961] border-2 border-white rounded-full"></span>
        </button>

        {/* Divider */}
        <div className="h-8 w-px bg-slate-200 mx-2"></div>

        <Button
          className="flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-800 text-white rounded-lg text-sm font-bold transition-all hover:shadow-lg hover:shadow-[#1E3A8A]/20"
          onClick={() => navigate("/admin/temples/add")}
        >
          <Plus className="w-5 h-5" />
          <span>Create New</span>
        </Button>

        <Button variant="ghost" size="icon" onClick={handleLogout} className="ml-2 text-slate-500 hover:text-red-600">
          <LogOut className="w-5 h-5" />
        </Button>
      </div>
    </header>
  );
}
