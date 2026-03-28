import React, { useState, useEffect } from "react";
import SuperAdminLayout from "@/shared/components/admin/SuperAdminLayout";
import { 
  Activity, 
  Search, 
  Filter, 
  Calendar,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  Database
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";
import { auth } from "@/auth/firebase";

interface LogEntry {
  id: string;
  timestamp: string;
  type: 'auth' | 'system' | 'data' | 'security';
  message: string;
  user: string;
  ip?: string;
}

export default function ActivityLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    // Mock data for initial implementation
    setLogs([
      { id: '1', timestamp: '2026-03-26 14:30:12', type: 'security', message: 'Super Admin permissions updated for Sakshi', user: 'System', ip: '192.168.1.1' },
      { id: '2', timestamp: '2026-03-26 13:15:05', type: 'auth', message: 'Successful login', user: 'admin@panchjanya.com', ip: '122.162.34.8' },
      { id: '3', timestamp: '2026-03-26 12:00:55', type: 'data', message: 'Sthan verification: "Omkareshwar" approved', user: 'Moderator 1', ip: '10.0.0.45' },
      { id: '4', timestamp: '2026-03-26 10:45:30', type: 'system', message: 'Firebase configuration refreshed', user: 'System' },
    ]);
  }, []);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.message.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === "all" || log.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'auth': return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case 'security': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'data': return <Database className="w-4 h-4 text-blue-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <SuperAdminLayout>
      <div className="flex-1 space-y-8 transition-all duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">System Activity Logs</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Comprehensive audit trail of all platform operations.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-gray-200 dark:border-gray-800 h-11 pr-4 gap-2">
              <Calendar className="w-4 h-4" /> Export CSV
            </Button>
            <Button className="h-11 bg-[#0f3c6e] hover:bg-[#0f2c4e] text-white font-black rounded-xl px-6 gap-2 shadow-lg shadow-[#0f3c6e]/20">
              Refresh Feed
            </Button>
          </div>
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input 
              placeholder="Search logs by message or email..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-11 h-12 bg-gray-50/50 dark:bg-gray-950/50 border-gray-100 dark:border-gray-800 rounded-xl focus:ring-[#0f3c6e]/30"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            <select 
              className="bg-gray-50/50 dark:bg-gray-950/50 border border-gray-100 dark:border-gray-800 rounded-xl h-12 px-4 text-sm font-bold text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0f3c6e]/30"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="auth">Authentication</option>
              <option value="security">Security Events</option>
              <option value="data">Data Operations</option>
              <option value="system">System Updates</option>
            </select>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-800">
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Event</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Actor</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400">IP Address</th>
                  <th className="p-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-bold text-gray-900 dark:text-gray-100">{log.timestamp.split(' ')[1]}</div>
                        <div className="text-[10px] text-gray-400">{log.timestamp.split(' ')[0]}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 group-hover:bg-white dark:group-hover:bg-gray-700 transition-colors">
                          {getLogIcon(log.type)}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{log.message}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{log.user}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <code className="text-[10px] text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-1 rounded-md">{log.ip || 'Local'}</code>
                    </td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                        Recorded
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredLogs.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">No logs found</h3>
              <p className="text-sm text-gray-500 mt-1 italic">Try adjusting your filters or search term.</p>
            </div>
          )}
        </div>
      </div>
    </SuperAdminLayout>
  );
}
