import React, { useEffect, useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function SuperAdminLayout({ children }: Props) {
  const { isSuperAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !isSuperAdmin) {
      console.warn("🚫 Unauthorized access attempt to Super Admin Dashboard. Redirecting to home.");
      navigate("/");
    }
  }, [isSuperAdmin, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 font-[Manrope]">
      <SuperAdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#FDFCFB] dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-[1700px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
