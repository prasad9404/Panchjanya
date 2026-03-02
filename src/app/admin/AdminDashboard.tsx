import React, { useState, useEffect } from "react";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Users,
  Landmark,
  PlayCircle,
  ArrowRight,
  Edit,
  Trash2,
  Compass,
  Search,
  Loader2,
  ExternalLink,
  Map,
  MapPin,
  Share
} from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { Card, CardContent } from "@/shared/components/ui/card";
import { useAuth } from "@/auth/AuthContext";

export default function AdminDashboard() {
  const [temples, setTemples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCount, setUserCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = async () => {
    setLoading(true);

    // 1. Fetch Stats (User count and Recent Activity)
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
          } else {
            throw new Error("Invalid response format: Expected JSON");
          }
        } else {
          const errorData = await statsRes.json().catch(() => ({}));
          console.error("Stats API failed:", errorData.error || statsRes.statusText);
          toast({
            title: "Error",
            description: "Failed to load platform statistics from API.",
            variant: "destructive",
          });
        }
      } catch (err) {
        console.error("Stats fetch error:", err);
      }

      // 2. Fetch Temples
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
          toast({
            title: "Error",
            description: `Failed to load directory data: ${errorData.error || "API Error"}`,
            variant: "destructive",
          });
        }
      } catch (err: any) {
        console.error("Temples fetch error:", err);
        toast({
          title: "Network Error",
          description: "Could not connect to the Admin API.",
          variant: "destructive",
        });
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
      <div className="font-sans min-h-screen bg-[#F9F6F0] -m-6 p-6">
        <div className="max-w-7xl mx-auto">

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Active Users</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-extrabold text-slate-900">{userCount.toLocaleString()}</h3>
                <span className="text-emerald-600 text-xs font-bold bg-emerald-50 px-2 py-1 rounded-md mb-1">+12%</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Pending Tasks</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-extrabold text-[#C9A961]">142</h3>
                <span className="text-amber-600 text-xs font-bold bg-amber-50 px-2 py-1 rounded-md mb-1">High Priority</span>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Storage Used</p>
              <div className="flex flex-col gap-3">
                <h3 className="text-3xl font-extrabold text-slate-900">85.4 <span className="text-lg font-medium text-slate-400">TB</span></h3>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#1E3A8A] h-full rounded-full" style={{ width: "72%" }}></div>
                </div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-1">
              <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">Total Sthanas</p>
              <div className="flex items-end justify-between">
                <h3 className="text-3xl font-extrabold text-slate-900">{loading ? <Loader2 className="w-8 h-8 animate-spin" /> : (temples.length > 0 ? temples.length : 0)}</h3>
                <span className="text-[#1E3A8A] text-[10px] font-bold bg-[#1E3A8A]/5 px-2 py-1 rounded-md mb-1">Global Coverage</span>
              </div>
            </div>
          </div>

          {/* Management Modules */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Management Modules</h2>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-6 mb-8">
              {/* User Management */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:shadow-[#1E3A8A]/5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Database Size</p>
                    <p className="text-lg font-bold text-slate-900">4.2M Records</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">User Management</h3>
                  <p className="text-sm text-slate-500 mt-1">Control access tiers, moderator permissions, and user authentication logs across the platform.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Recent Activity</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Added 24 new moderators for North India region.</span>
                  </div>
                </div>
                <Button className="w-full h-12 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2">
                  Manage Users <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              {/* Sthana Directory */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:shadow-[#1E3A8A]/5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                    <Landmark className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Active Nodes</p>
                    <p className="text-lg font-bold text-slate-900">{temples.length} Temples</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Sthana Directory</h3>
                  <p className="text-sm text-slate-500 mt-1">Comprehensive CRUD operations for heritage sites, history, geospatial data, and photography galleries.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Recent Activity</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C9A961]"></span>
                    <span>5 temple profile updates pending verification.</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/admin/sthana-directory")}
                  className="w-full h-12 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  Manage Directory <Map className="w-4 h-4" />
                </Button>
              </div>

              {/* Literature Hub */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:shadow-[#1E3A8A]/5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                    <PlayCircle className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Assets</p>
                    <p className="text-lg font-bold text-slate-900">12.5k Media</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Literature Hub</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage multimedia content, podcast episodes, video discourses, and curated heritage playlists.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Recent Activity</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A]"></span>
                    <span>New video series 'Vedic Science' uploaded successfully.</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/admin/literature")}
                  className="w-full h-12 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  Manage Media <PlayCircle className="w-4 h-4" />
                </Button>
              </div>

              {/* Raj Viharan */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-6 hover:shadow-xl hover:shadow-[#1E3A8A]/5 transition-all">
                <div className="flex items-start justify-between">
                  <div className="w-14 h-14 bg-[#1E3A8A]/10 rounded-2xl flex items-center justify-center text-[#1E3A8A]">
                    <MapPin className="w-8 h-8" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 font-bold uppercase">Dynamic Maps</p>
                    <p className="text-lg font-bold text-slate-900">Interactive Flows</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Raj Viharan</h3>
                  <p className="text-sm text-slate-500 mt-1">Manage interactive Raj Viharan sequences, timelines, hotspots, and media mapping for immersive navigation.</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Recent Activity</p>
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>New timeline sequence mapped for Central region.</span>
                  </div>
                </div>
                <Button
                  onClick={() => navigate("/admin/raj-viharan")}
                  className="w-full h-12 bg-[#1E3A8A] hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  Manage Raj Viharan <MapPin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* System Logs / Platform Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-900">Platform Features</h3>
                <span className="bg-[#C9A961]/10 text-[#C9A961] text-[10px] font-bold px-2 py-1 rounded">HOT UPDATES</span>
              </div>
              <div className="p-6 space-y-4">
                {/* Dummy Feature Items */}
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-bold">Q</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">Jigyasa Q&A</h4>
                    <p className="text-xs text-slate-500">28 new questions waiting for expert review.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
                <div className="flex items-center gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center font-bold">A</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900">Global Announcements</h4>
                    <p className="text-xs text-slate-500">Configure 'What's New' dashboard alerts.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-900">System Logs</h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {recentActivity.length > 0 ? recentActivity.map((activity, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${activity.color}`}></div>
                        {idx !== recentActivity.length - 1 && <div className="w-px h-full bg-slate-100 my-1"></div>}
                      </div>
                      <div>
                        <p className="text-sm font-bold">{activity.type}</p>
                        <p className="text-xs text-slate-500 mt-1">{activity.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 font-medium">{activity.time}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 italic">No recent system activity detected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* End of content */}
        </div>
      </div>
    </AdminLayout>
  );
}
