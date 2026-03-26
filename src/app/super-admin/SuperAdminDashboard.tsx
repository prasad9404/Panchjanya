import React, { useState, useEffect } from "react";
import SuperAdminLayout from "@/shared/components/admin/SuperAdminLayout";
import { 
  Users, 
  ShieldCheck, 
  Activity, 
  TrendingUp, 
  UserPlus,
  ArrowRight,
  UserCheck,
  Bell,
  Sun,
  Moon,
  User as UserIcon
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { cn } from "@/shared/lib/utils";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const [stats, setStats] = useState({
    totalUsers: 1450,
    activeAdmins: 12,
    pendingSthans: 8,
    activeSessions: 142
  });

  return (
    <SuperAdminLayout>
      <div className="flex-1 transition-colors duration-300">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center p-2 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <img src="/icons/Main logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Super Admin Console</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Global oversight & platform health, {user?.displayName || "Administrator"}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <button className="relative p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>
            </button>
            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-800 text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-blue-600 transition-all"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
            </button>
            <div className="h-8 w-px bg-gray-200 dark:bg-gray-800 mx-1"></div>
            <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                <UserIcon className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600">Profile</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Total Users" 
            value={stats.totalUsers.toLocaleString()} 
            icon={Users} 
            trend="+12%" 
            trendLabel="from last month"
            color="blue"
          />
          <StatCard 
            title="Active Admins" 
            value={stats.activeAdmins.toLocaleString()} 
            icon={ShieldCheck} 
            trend="Stable" 
            trendLabel="Access tier high"
            color="indigo"
          />
          <StatCard 
            title="Pending Sthans" 
            value={stats.pendingSthans.toLocaleString()} 
            icon={Activity} 
            trend="Priority" 
            trendLabel="Review required"
            color="amber"
          />
          <StatCard 
            title="Active Sessions" 
            value={stats.activeSessions.toLocaleString()} 
            icon={TrendingUp} 
            trend="Live" 
            trendLabel="Active now"
            color="emerald"
          />
        </div>

        {/* Management Modules */}
        <div className="mb-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight mb-6">Management Modules</h2>
          <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6">
            <ModuleCard 
              title="User Management"
              description="Control access tiers, moderator permissions, and user authentication logs."
              icon={Users}
              stat={`${stats.totalUsers.toLocaleString()} Records`}
              statLabel="Database Size"
              activity="Added 24 new moderators for North India region."
              buttonLabel="Manage Users"
              onClick={() => navigate('/super-admin/users')}
            />
            <ModuleCard 
              title="Admin Management"
              description="Provision and audit administrative access for the entire platform."
              icon={UserPlus}
              stat={`${stats.activeAdmins.toLocaleString()} Active`}
              statLabel="Admin Count"
              activity="Admin permissions updated for team leads."
              buttonLabel="Manage Access"
              onClick={() => navigate('/super-admin/admins')}
            />
            <ModuleCard 
              title="Sthan Verification"
              description="Global review workflow for all sacred site contributions and updates."
              icon={UserCheck}
              stat={`${stats.pendingSthans.toLocaleString()} Pending`}
              statLabel="Review Queue"
              activity="5 temple profile updates pending verification."
              buttonLabel="Verifiy Sthans"
              onClick={() => navigate('/super-admin/verification')}
            />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, color }: any) => {
  const colorMap: any = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-blue-500/10",
    amber: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 shadow-amber-500/10",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10",
    indigo: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-indigo-500/10",
  };

  return (
    <div className="p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-current opacity-[0.03] rounded-full group-hover:scale-150 transition-transform duration-500"></div>
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className={cn("p-3 rounded-xl", colorMap[color])}>
          <Icon className="h-6 w-6" />
        </div>
        <div className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300")}>
          {trend}
        </div>
      </div>
      <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <p className="text-3xl font-black text-gray-900 dark:text-gray-100 relative z-10">{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-bold relative z-10 uppercase">{trendLabel}</p>
    </div>
  );
};

const ModuleCard = ({ title, description, icon: Icon, stat, statLabel, activity, buttonLabel, onClick }: any) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:border-blue-500/30 transition-all group relative">
      <div className="flex items-start justify-between">
        <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
          <Icon className="w-8 h-8" />
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{statLabel}</p>
          <p className="text-lg font-black text-gray-900 dark:text-gray-100">{stat}</p>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed h-12 overflow-hidden">{description}</p>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase mb-2 tracking-widest">Recent Context</p>
        <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium italic">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
          <span>{activity}</span>
        </div>
      </div>
      <Button 
        onClick={onClick}
        className="w-full h-12 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-black rounded-xl border-none shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
      >
        {buttonLabel} <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
      </Button>
    </div>
  );
};
