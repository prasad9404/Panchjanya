import React, { useState, useEffect } from "react";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Users,
  Landmark,
  PlayCircle,
  ArrowRight,
  Compass,
  Search,
  Loader2,
  ExternalLink,
  Map,
  MapPin,
  Bell,
  Moon,
  Sun,
  User,
  TrendingUp,
  Activity,
  Package
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";
import { useTheme } from "@/shared/contexts/ThemeContext";
import { cn } from "@/shared/lib/utils";

export default function AdminDashboard() {
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [storageBytes, setStorageBytes] = useState(0);
  const [storageLimit, setStorageLimit] = useState(1); 
  const [pendingCount, setPendingCount] = useState(0);
  const [mediaCount, setMediaCount] = useState(0);
  const [totalDatabaseTemples, setTotalDatabaseTemples] = useState(0);


  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = await user?.getIdToken();

      try {
        const statsRes = await fetch("/api/admin/stats", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        if (statsRes.ok) {
          const contentType = statsRes.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const statsData = await statsRes.json();
            setUserCount(statsData.userCount || 0);
            setRecentActivity(statsData.recentActivity || []);
            setStorageBytes(statsData.storageBytes || 0);
            setStorageLimit(statsData.storageLimit || 1);
            setPendingCount(statsData.pendingCount || 0);
            setMediaCount(statsData.mediaCount || 0);
            setTotalDatabaseTemples(statsData.totalTemples || 0);
          } else {
            throw new Error("Invalid response format: Expected JSON");
          }
        } else {
          const errorData = await statsRes.json().catch(() => ({}));
          console.error("Stats API failed:", errorData.error || statsRes.statusText);
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }

      try {
        const templesRes = await fetch("/api/admin/data?collection=temples", {
          headers: token ? { "Authorization": `Bearer ${token}` } : {}
        });

        if (templesRes.ok) {
          const templeData = await templesRes.json();
          setTemples(templeData);
        } else {
          const errorData = await templesRes.json().catch(() => ({}));
          console.error("Temples API failed:", errorData.error || templesRes.statusText);
        }
      } catch (err: any) {
        console.error("Temples fetch error:", err);
      }

    } catch (globalError: any) {
      console.error("Unexpected error in dashboard load:", globalError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <AdminLayout>
      <div className="flex-1 transition-colors duration-300">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center p-2 shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <img src="/icons/Main logo.svg" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Admin Dashboard</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Welcome back to Panchjanya Console, {user?.displayName || "Administrator"}</p>
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
                <User className="h-4 w-4" />
              </div>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600">Profile</span>
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard 
            title="Active Users" 
            value={userCount.toLocaleString()} 
            icon={Users} 
            trend="+12%" 
            trendLabel="from last month"
            color="blue"
          />
          <StatCard 
            title="Pending Tasks" 
            value={loading ? "..." : pendingCount.toLocaleString()} 
            icon={Activity} 
            trend={pendingCount > 10 ? "High" : "Normal"} 
            trendLabel="Priority items"
            color="amber"
          />
          <StatCard 
            title="Storage Usage" 
            value={formatBytes(storageBytes)} 
            icon={Package} 
            trend={`${Math.round((storageBytes / storageLimit) * 100)}%`} 
            trendLabel="capacity used"
            color="emerald"
          />
          <StatCard 
            title="Total Sthanas" 
            value={loading ? "..." : totalDatabaseTemples.toLocaleString()} 
            icon={Landmark} 
            trend="Global" 
            trendLabel="coverage active"
            color="indigo"
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
              stat={`${userCount.toLocaleString()} Records`}
              statLabel="Database Size"
              activity="Added 24 new moderators for North India region."
              buttonLabel="Manage Users"
              onClick={() => {}}
            />
            <ModuleCard 
              title="Sthana Directory"
              description="Comprehensive CRUD operations for heritage sites, geospatial data, and galleries."
              icon={Landmark}
              stat={`${temples.length} Temples`}
              statLabel="Active Nodes"
              activity="5 temple profile updates pending verification."
              buttonLabel="Manage Directory"
              onClick={() => navigate("/admin/sthana-directory")}
            />
            <ModuleCard 
              title="Literature Hub"
              description="Manage multimedia content, podcast episodes, and video discourses."
              icon={PlayCircle}
              stat={`${mediaCount.toLocaleString()} Media`}
              statLabel="Assets"
              activity="New video series 'Vedic Science' uploaded successfully."
              buttonLabel="Manage Media"
              onClick={() => navigate("/admin/literature")}
            />
          </div>
        </div>

        {/* Bottom Section: Features & Logs */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Platform Features */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 italic">Platform Features</h3>
              <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Updates</span>
            </div>
            <div className="p-6 space-y-4">
              <FeatureItem title="Jigyasa Q&A" desc="28 new questions waiting for expert review." iconChar="Q" color="indigo" />
              <FeatureItem title="Global Announcements" desc="Configure 'What's New' dashboard alerts." iconChar="A" color="amber" />
            </div>
          </div>

          {/* System Logs */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm font-[Manrope]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">System Logs</h3>
              <Activity className="h-4 w-4 text-blue-500" />
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={cn("w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900 shadow-sm", activity.color || "bg-blue-500")}></div>
                      {idx !== recentActivity.length - 1 && <div className="w-px h-full bg-gray-100 dark:bg-gray-800 my-1"></div>}
                    </div>
                    <div className="pb-2">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{activity.type}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{activity.message}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-black uppercase tracking-widest">{activity.time}</p>
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <Activity className="h-6 w-6 text-gray-300" />
                    </div>
                    <p className="text-sm text-gray-400 italic">No recent platform activity detected.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper Functions & Components
const formatBytes = (bytes: number, decimals = 1) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
        <div className={cn("text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter", 
          trend === "High" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300" : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300")}>
          {trend}
        </div>
      </div>
      <h3 className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest mb-1 relative z-10">{title}</h3>
      <p className="text-3xl font-black text-gray-900 dark:text-gray-100 relative z-10">{value}</p>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 font-bold relative z-10 uppercase">{trendLabel}</p>
    </div>
  );
};

const ModuleCard = ({ title, description, icon: Icon, stat, statLabel, activity, buttonLabel, onClick, badge }: any) => {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:border-blue-500/30 transition-all group relative">
      {badge && (
        <span className="absolute top-4 right-4 bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded italic tracking-widest">{badge}</span>
      )}
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
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 leading-relaxed">{description}</p>
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

const FeatureItem = ({ title, desc, iconChar, color }: any) => {
  const colorMap: any = {
    indigo: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    amber: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-800 group">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg shadow-sm group-hover:scale-110 transition-transform", colorMap[color])}>
        {iconChar}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 dark:text-gray-100">{title}</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
    </div>
  );
};
