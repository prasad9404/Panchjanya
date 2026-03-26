import React, { useState, useEffect } from "react";
import SuperAdminLayout from "@/shared/components/admin/SuperAdminLayout";
import { 
  ShieldCheck, 
  UserPlus, 
  Search,
  MoreVertical,
  Activity
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { cn } from "@/shared/lib/utils";

export default function AdminManagement() {
  const [admins, setAdmins] = useState<any[]>([]);

  useEffect(() => {
    // Demo data
    setAdmins([
      { id: '1', name: 'Sakshi Admin', email: 'admin@panchajanya.com', level: 'Super Admin', status: 'Active' },
      { id: '2', name: 'Moderator 1', email: 'mod1@panchajanya.com', level: 'Moderator', status: 'Active' },
      { id: '3', name: 'Coordinator North', email: 'north@panchajanya.com', level: 'Area Admin', status: 'Idle' },
    ]);
  }, []);

  return (
    <SuperAdminLayout>
      <div className="flex-1 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Admin Access</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium italic">Provision and audit system-wide administrative privileges.</p>
          </div>
          <Button className="h-12 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl px-6 gap-2 shadow-lg shadow-blue-500/20">
            <UserPlus className="w-5 h-5" /> Create New Admin
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm relative group overflow-hidden">
              <div className="flex items-start justify-between mb-6">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <button className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1 tracking-tight">{admin.name}</h3>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mb-4 font-black uppercase tracking-widest">{admin.level}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800 mt-4">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", 
                    admin.status === 'Active' ? "bg-emerald-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" : "bg-amber-500")} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{admin.status}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase text-blue-600 hover:text-blue-500 p-0">
                  Edit
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Audit Log */}
        <div className="mt-12 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight italic">Access Logs</h3>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <div className="space-y-4">
            <LogItem 
              time="2h ago" 
              message="Super Admin updated permissions for Moderator 1" 
              user="Sakshi Admin" 
            />
            <LogItem 
              time="5h ago" 
              message="New Area Admin created (Coordinator North)" 
              user="Sakshi Admin" 
              color="indigo"
            />
            <LogItem 
              time="1d ago" 
              message="Failed login attempt detected from 192.168.1.1" 
              user="System" 
              color="red"
            />
          </div>
        </div>
      </div>
    </SuperAdminLayout>
  );
}

const LogItem = ({ time, message, user, color }: any) => (
  <div className="flex items-center gap-6 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all border border-transparent hover:border-gray-100 dark:hover:border-gray-800 group">
    <div className="text-[10px] font-black text-gray-400 uppercase w-16">{time}</div>
    <div className="flex-1">
      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{message}</p>
      <p className="text-xs text-gray-500 mt-1">By {user}</p>
    </div>
    {color && (
      <div className={cn("w-2 h-2 rounded-full", 
        color === 'red' ? "bg-red-500" : "bg-indigo-500")} />
    )}
  </div>
);
