import React, { useEffect } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import { useAuth } from "@/auth/AuthContext";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  const { isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAdmin) {
      console.warn("🚫 Unauthorized access attempt to Admin Dashboard. Redirecting to home.");
      navigate("/");
    }
  }, [isAdmin, loading, navigate]);

  const [isCollapsed, setIsCollapsed] = React.useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-gray-950">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-gray-950 font-[Manrope]">
      <AdminSidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-[#FDFCFB] dark:bg-gray-950 transition-colors duration-300">
          <div className="max-w-[1700px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
