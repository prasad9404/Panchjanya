import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { 
  Search, 
  Filter, 
  User as UserIcon,
  MoreVertical,
  ChevronDown,
  ArrowRight,
  ShieldCheck,
  Ban,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Activity,
  Edit,
  UserCheck,
  UserX,
  Lock,
  Eye
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuLabel
} from "@/shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose
} from "@/shared/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useToast } from "@/shared/hooks/use-toast";
import { cn } from "@/shared/lib/utils";
import { db } from "@/auth/firebase";
import { collection, onSnapshot, doc, updateDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { useAuth } from "@/auth/AuthContext";
import { violationService } from "@/services/violationService";
import { SecurityViolation } from "@/services/securityService";

type UserRole = 'Super Admin' | 'Admin' | 'Moderator' | 'Temple Manager' | 'Volunteer' | 'Registered User';
type UserStatus = 'Active' | 'Suspended' | 'Blocked' | 'Pending';

interface AppUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isVerified: boolean;
  createdAt: any;
  lastLogin?: any;
  photoURL?: string;
  address?: string;
  documents?: string[];
  [key: string]: any;
}

export default function UserManagement() {
  const { user: currentUser, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Sorting
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"name" | "createdAt" | "lastLogin">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Selection & Bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // UI States
  const [viewUser, setViewUser] = useState<AppUser | null>(null);
  const [actionUser, setActionUser] = useState<{ user: AppUser, action: 'delete' | 'suspend' | 'block' | 'activate' | 'verify' } | null>(null);

  // Security Tab State
  const [activeTab, setActiveTab] = useState<'users' | 'security'>('users');
  const [violations, setViolations] = useState<(SecurityViolation & { id: string })[]>([]);
  const [secStats, setSecStats] = useState({ total: 0, critical: 0, blockedUsers: 0, today: 0 });
  const [secLoading, setSecLoading] = useState(false);
  const [secSearch, setSecSearch] = useState("");
  const [secSeverity, setSecSeverity] = useState("All");
  const [secPlatform, setSecPlatform] = useState("All");
  
  const [historyUser, setHistoryUser] = useState<AppUser | null>(null);
  const [userViolations, setUserViolations] = useState<(SecurityViolation & { id: string })[]>([]);

  const fetchViolations = async () => {
    setSecLoading(true);
    const v = await violationService.getAllViolations();
    const s = await violationService.getViolationStats();
    setViolations(v);
    setSecStats(s);
    setSecLoading(false);
  };

  useEffect(() => {
    if (activeTab === 'security') {
      fetchViolations();
      const interval = setInterval(fetchViolations, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const handleUnblock = async (userId: string) => {
    try {
      await violationService.unblockUser(userId);
      toast({ title: "User Unblocked", description: "The user has been restored." });
      if (activeTab === 'security') fetchViolations();
      if (historyUser) fetchUserHistory(historyUser);
    } catch (e) {
      toast({ title: "Error", description: "Failed to unblock.", variant: "destructive" });
    }
  };

  const handleBlock = async (userId: string) => {
    try {
      await violationService.blockUserInDB(userId, "manual_admin_block");
      toast({ title: "User Blocked", description: "The user has been blocked." });
      if (activeTab === 'security') fetchViolations();
      if (historyUser) fetchUserHistory(historyUser);
    } catch (e) {
      toast({ title: "Error", description: "Failed to block.", variant: "destructive" });
    }
  };

  const fetchUserHistory = async (u: AppUser) => {
    setHistoryUser(u);
    const v = await violationService.getUserViolations(u.id);
    setUserViolations(v);
  };

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Fallbacks for demo/legacy data
        role: doc.data().role || 'Registered User',
        status: doc.data().status || 'Active',
        isVerified: !!doc.data().isVerified,
        createdAt: doc.data().createdAt || new Date(),
      })) as AppUser[];
      
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter & Sort Logic
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = (u.name?.toLowerCase() || '').includes(search.toLowerCase()) || 
                            (u.email?.toLowerCase() || '').includes(search.toLowerCase()) ||
                            (u.phone || '').includes(search);
      const matchesRole = roleFilter === "All" || u.role === roleFilter;
      const matchesStatus = statusFilter === "All" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'createdAt' || sortField === 'lastLogin') {
        aVal = aVal?.toDate ? aVal.toDate().getTime() : new Date(aVal || 0).getTime();
        bVal = bVal?.toDate ? bVal.toDate().getTime() : new Date(bVal || 0).getTime();
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, search, roleFilter, statusFilter, sortField, sortOrder]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(u => u.status === 'Active').length,
      suspended: users.filter(u => u.status === 'Suspended' || u.status === 'Blocked').length,
      verified: users.filter(u => u.isVerified).length,
    };
  }, [users]);

  // Handlers
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredUsers.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      toast({ title: "Role Updated", description: "User role has been successfully updated." });
    } catch (e) {
      toast({ title: "Error", description: "Failed to update role.", variant: "destructive" });
    }
  };

  const executeAction = async () => {
    if (!actionUser) return;
    const { user, action } = actionUser;
    
    try {
      if (action === 'delete') {
        if (user.role === 'Super Admin' && !isSuperAdmin) {
          toast({ title: "Permission Denied", description: "Cannot delete a Super Admin.", variant: "destructive" });
          return;
        }
        await deleteDoc(doc(db, "users", user.id));
        toast({ title: "User Deleted", description: "The user has been permanently removed." });
      } else if (action === 'verify') {
        await updateDoc(doc(db, "users", user.id), { isVerified: true });
        toast({ title: "User Verified", description: "The user has been marked as verified." });
      } else {
        const newStatus: UserStatus = action === 'activate' ? 'Active' : action === 'suspend' ? 'Suspended' : 'Blocked';
        await updateDoc(doc(db, "users", user.id), { status: newStatus });
        toast({ title: "Status Updated", description: `User status changed to ${newStatus}.` });
      }
    } catch (e) {
      toast({ title: "Action Failed", description: "Could not perform the requested action.", variant: "destructive" });
    } finally {
      setActionUser(null);
    }
  };

  const exportCSV = () => {
    const dataToExport = selectedIds.size > 0 ? filteredUsers.filter(u => selectedIds.has(u.id)) : filteredUsers;
    const csvHeader = "ID,Name,Email,Phone,Role,Status,Verified,Joined\n";
    const csvContent = dataToExport.map(u => 
      `"${u.id}","${u.name}","${u.email}","${u.phone || ''}","${u.role}","${u.status}","${u.isVerified}","${new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleDateString()}"`
    ).join("\n");
    
    const blob = new Blob([csvHeader + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AdminLayout>
      <div className="flex-1 space-y-8 pb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Management</h1>
            <p className="text-gray-500 mt-1 font-medium italic">Comprehensive oversight of all platform users and roles.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="bg-white rounded-xl shadow-sm h-11 px-5 border-gray-200" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>

        <div className="flex border-b border-gray-200 mt-4 mb-8">
          <button
            className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors", activeTab === 'users' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={cn("px-6 py-3 font-bold text-sm border-b-2 transition-colors", activeTab === 'security' ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700")}
            onClick={() => setActiveTab('security')}
          >
            Security Violations
          </button>
        </div>

        {activeTab === 'users' ? (
          <>
        {/* Dashboard Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={stats.total} icon={UserIcon} color="bg-blue-50 text-blue-600" loading={loading} />
          <StatCard title="Active Users" value={stats.active} icon={Activity} color="bg-emerald-50 text-emerald-600" loading={loading} />
          <StatCard title="Verified Users" value={stats.verified} icon={ShieldCheck} color="bg-indigo-50 text-indigo-600" loading={loading} />
          <StatCard title="Suspended/Blocked" value={stats.suspended} icon={Ban} color="bg-red-50 text-red-600" loading={loading} />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm sticky top-0 z-10">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
             <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
               <Filter className="w-4 h-4 text-gray-400" />
               <select 
                 className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
                 value={roleFilter}
                 onChange={e => setRoleFilter(e.target.value)}
               >
                 <option value="All">All Roles</option>
                 <option value="Super Admin">Super Admin</option>
                 <option value="Admin">Admin</option>
                 <option value="Moderator">Moderator</option>
                 <option value="Temple Manager">Temple Manager</option>
                 <option value="Volunteer">Volunteer</option>
                 <option value="Registered User">Registered User</option>
               </select>
             </div>

             <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
               <Activity className="w-4 h-4 text-gray-400" />
               <select 
                 className="bg-transparent text-sm font-semibold text-gray-700 outline-none cursor-pointer"
                 value={statusFilter}
                 onChange={e => setStatusFilter(e.target.value)}
               >
                 <option value="All">All Statuses</option>
                 <option value="Active">Active</option>
                 <option value="Pending">Pending</option>
                 <option value="Suspended">Suspended</option>
                 <option value="Blocked">Blocked</option>
               </select>
             </div>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-blue-600 text-white p-3 px-6 rounded-2xl flex items-center justify-between shadow-xl shadow-blue-900/10 animate-in slide-in-from-bottom-4">
             <span className="font-bold text-sm">{selectedIds.size} users selected</span>
             <div className="flex items-center gap-2">
               <Button size="sm" variant="secondary" className="h-8 rounded-lg text-xs font-bold" onClick={exportCSV}>
                 Export Selected
               </Button>
               {isSuperAdmin && (
                 <Button size="sm" className="h-8 rounded-lg text-xs font-bold bg-white text-red-600 hover:bg-red-50" onClick={() => toast({ description: "Bulk delete coming soon."})}>
                   Delete Selected
                 </Button>
               )}
             </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left whitespace-nowrap">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="px-6 py-4 w-12">
                    <Checkbox 
                      checked={selectedIds.size > 0 && selectedIds.size === filteredUsers.length} 
                      onCheckedChange={toggleSelectAll} 
                      className="rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-600"
                    />
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-700" onClick={() => { setSortField('name'); setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); }}>
                    User Profile {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer hover:text-gray-700" onClick={() => { setSortField('createdAt'); setSortOrder(s => s === 'asc' ? 'desc' : 'asc'); }}>
                    Joined {sortField === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  Array.from({length: 5}).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-5"><Skeleton className="w-4 h-4 rounded" /></td>
                      <td className="px-6 py-5 flex items-center gap-3"><Skeleton className="w-10 h-10 rounded-xl" /><div className="space-y-2"><Skeleton className="w-32 h-3" /><Skeleton className="w-24 h-2" /></div></td>
                      <td className="px-6 py-5"><Skeleton className="w-20 h-6 rounded-full" /></td>
                      <td className="px-6 py-5"><Skeleton className="w-24 h-4" /></td>
                      <td className="px-6 py-5"><Skeleton className="w-16 h-6 rounded-full" /></td>
                      <td className="px-6 py-5 text-right"><Skeleton className="w-8 h-8 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                         <UserIcon className="w-12 h-12 mb-4 text-gray-200" />
                         <p className="text-lg font-bold text-gray-900">No users found</p>
                         <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-50/40 transition-colors group">
                      <td className="px-6 py-5">
                        <Checkbox 
                          checked={selectedIds.has(user.id)} 
                          onCheckedChange={() => toggleSelect(user.id)}
                          className="rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-600"
                        />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3 cursor-pointer group/prof" onClick={() => setViewUser(user)}>
                          {user.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-transparent group-hover/prof:ring-blue-100 transition-all" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 font-black text-sm ring-2 ring-transparent group-hover/prof:ring-blue-100 transition-all uppercase">
                              {user.name?.charAt(0) || '?'}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-gray-900 group-hover/prof:text-blue-600 tracking-tight transition-colors flex items-center gap-1.5">
                              {user.name}
                              {user.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              {(user.violationCount || 0) > 0 && (
                                <Badge className="bg-orange-100 text-orange-700 border-none px-1.5 py-0.5 text-[9px] uppercase font-black tracking-wider ml-2">
                                  {user.violationCount} Violations
                                </Badge>
                              )}
                              {(user.status === 'Blocked' || user.blocked) && (
                                <Badge className="bg-red-600 text-white border-none px-1.5 py-0.5 text-[9px] uppercase font-black tracking-wider ml-1">
                                  BLOCKED
                                </Badge>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className={cn(
                          "rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border shadow-none",
                          user.role === 'Super Admin' ? "bg-purple-50 text-purple-700 border-purple-200" :
                          user.role === 'Admin' ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                          user.role === 'Moderator' ? "bg-amber-50 text-amber-700 border-amber-200" :
                          "bg-slate-50 text-slate-600 border-slate-200"
                        )}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                         <div className="text-sm font-semibold text-gray-700">
                           {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString() : new Date(user.createdAt || Date.now()).toLocaleDateString()}
                         </div>
                         <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                           {user.lastLogin ? "Active Recently" : "New"}
                         </div>
                      </td>
                      <td className="px-6 py-5">
                         <Badge className={cn(
                           "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest border-none shadow-none",
                           user.status === 'Active' ? "bg-emerald-100 text-emerald-700" :
                           user.status === 'Suspended' ? "bg-amber-100 text-amber-700" :
                           user.status === 'Blocked' ? "bg-red-100 text-red-700" :
                           "bg-gray-100 text-gray-600"
                         )}>
                           {user.status}
                         </Badge>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 focus-visible:ring-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-xl border-gray-100">
                            <DropdownMenuItem className="rounded-xl cursor-pointer font-semibold text-sm" onClick={() => setViewUser(user)}>
                              <Eye className="w-4 h-4 mr-2 text-gray-400" /> View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl cursor-pointer font-semibold text-sm text-blue-600 focus:text-blue-700 focus:bg-blue-50" onClick={() => {
                              setActiveTab('security');
                              setSecSearch(user.email);
                            }}>
                              <ShieldCheck className="w-4 h-4 mr-2" /> View Violations
                            </DropdownMenuItem>
                            <DropdownMenuItem className="rounded-xl cursor-pointer font-semibold text-sm text-amber-600 focus:text-amber-700 focus:bg-amber-50" onClick={() => fetchUserHistory(user)}>
                              <AlertCircle className="w-4 h-4 mr-2" /> Violation History
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 my-1" />
                            
                            <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 py-1.5">Manage Status</DropdownMenuLabel>
                            {!user.isVerified && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={() => setActionUser({ user, action: 'verify' })}>
                                <UserCheck className="w-4 h-4 mr-2" /> Verify User
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'Active' && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold" onClick={() => setActionUser({ user, action: 'activate' })}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-gray-400" /> Activate
                              </DropdownMenuItem>
                            )}
                            {user.status === 'Active' && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold text-amber-600 focus:text-amber-700 focus:bg-amber-50" onClick={() => setActionUser({ user, action: 'suspend' })}>
                                <Clock className="w-4 h-4 mr-2" /> Suspend
                              </DropdownMenuItem>
                            )}
                            {user.status !== 'Blocked' && !user.blocked && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => handleBlock(user.id)}>
                                <Ban className="w-4 h-4 mr-2" /> Block User
                              </DropdownMenuItem>
                            )}
                            {(user.status === 'Blocked' || user.blocked) && (
                              <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold text-emerald-600 focus:text-emerald-700 focus:bg-emerald-50" onClick={() => handleUnblock(user.id)}>
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Unblock User
                              </DropdownMenuItem>
                            )}

                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator className="bg-gray-100 my-1" />
                                <DropdownMenuLabel className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-2 py-1.5">Danger Zone</DropdownMenuLabel>
                                <DropdownMenuItem className="rounded-xl cursor-pointer text-sm font-semibold text-red-600 focus:text-red-700 focus:bg-red-50" onClick={() => setActionUser({ user, action: 'delete' })}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-sm font-semibold text-gray-500">
            <div>Showing {filteredUsers.length} users</div>
            {/* Pagination controls would go here for extremely large sets. For now it's client-side filtered. */}
          </div>
        </div>
          </>
        ) : (
          <SecurityTabContent 
            violations={violations} 
            stats={secStats} 
            loading={secLoading}
            search={secSearch}
            setSearch={setSecSearch}
            severity={secSeverity}
            setSeverity={setSecSeverity}
            platform={secPlatform}
            setPlatform={setSecPlatform}
            onUnblock={handleUnblock}
          />
        )}
      </div>

      {/* User Details Slide-out Sheet */}
      <Sheet open={!!viewUser} onOpenChange={(open) => !open && setViewUser(null)}>
        <SheetContent className="w-full sm:max-w-lg p-0 overflow-y-auto border-none shadow-2xl">
          <SheetHeader className="sr-only">
             <SheetTitle>User Details</SheetTitle>
             <SheetDescription>Full profile details for this user.</SheetDescription>
          </SheetHeader>
          
          {viewUser && (
            <div className="bg-slate-50 min-h-full pb-10">
               {/* Cover & Avatar */}
               <div className="h-32 bg-gradient-to-br from-blue-600 to-indigo-700 relative">
                  <div className="absolute -bottom-12 left-6">
                    {viewUser.photoURL || viewUser.profileImage ? (
                      <img src={viewUser.photoURL || viewUser.profileImage} alt="" className="w-24 h-24 rounded-2xl object-cover ring-4 ring-slate-50 shadow-xl bg-white" />
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-white ring-4 ring-slate-50 shadow-xl flex items-center justify-center text-4xl font-black text-gray-300 uppercase">
                        {(viewUser.firstName || viewUser.name)?.charAt(0)}
                      </div>
                    )}
                  </div>
               </div>
               
               <div className="pt-16 px-6 space-y-5">
                  {/* Header */}
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                      {viewUser.displayName || viewUser.name}
                      {viewUser.isVerified && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                    </h2>
                    {(viewUser.username) && <p className="text-gray-400 text-sm font-bold">@{viewUser.username}</p>}
                    <div className="flex flex-wrap gap-2 mt-3">
                       <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-blue-200 text-blue-700 bg-blue-50">{viewUser.role}</Badge>
                       <Badge variant="outline" className={cn("rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border", 
                          viewUser.status === 'Active' ? "border-emerald-200 text-emerald-700 bg-emerald-50" : "border-red-200 text-red-700 bg-red-50"
                       )}>{viewUser.status}</Badge>
                       {viewUser.onboardingComplete && <Badge variant="outline" className="rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-widest border-amber-200 text-amber-700 bg-amber-50">Onboarded</Badge>}
                    </div>
                  </div>

                  {/* Section: Personal Details */}
                  <ProfileSection title="Personal Details" icon={<UserIcon className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-4">
                      <ProfileField label="First Name" value={viewUser.firstName} />
                      <ProfileField label="Last Name" value={viewUser.lastName} />
                      <ProfileField label="Gender" value={viewUser.gender} />
                      <ProfileField label="Age" value={viewUser.age} />
                      <ProfileField label="Preferred Language" value={viewUser.preferredLanguage?.toUpperCase()} />
                    </div>
                    {viewUser.bio && <ProfileField label="Bio" value={viewUser.bio} />}
                  </ProfileSection>

                  {/* Section: Contact Info */}
                  <ProfileSection title="Contact Info" icon={<Phone className="w-3.5 h-3.5" />}>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{viewUser.mobile || viewUser.phone || <span className="text-gray-400 italic font-normal">Not provided</span>}</span>
                      </div>
                      {viewUser.whatsapp && (
                        <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                          <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{viewUser.whatsapp} <span className="text-[10px] text-emerald-600 font-black uppercase tracking-widest ml-1">WhatsApp</span></span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm font-semibold text-gray-700">
                        <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="truncate">{viewUser.email}</span>
                      </div>
                    </div>
                  </ProfileSection>

                  {/* Section: Location */}
                  {(viewUser.state || viewUser.district || viewUser.city) && (
                    <ProfileSection title="Location" icon={<MapPin className="w-3.5 h-3.5" />}>
                      <div className="grid grid-cols-2 gap-4">
                        <ProfileField label="State" value={viewUser.state} />
                        <ProfileField label="District" value={viewUser.district} />
                        <ProfileField label="Taluka" value={viewUser.taluka} />
                        <ProfileField label="City / Village" value={viewUser.city} />
                      </div>
                    </ProfileSection>
                  )}

                  {/* Section: Spiritual Profile */}
                  {viewUser.spiritualProfile && (
                    <ProfileSection title="Spiritual Profile" icon={<ShieldCheck className="w-3.5 h-3.5" />} accent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Spiritual Status</p>
                            <p className="text-base font-black text-gray-900 mt-0.5">{viewUser.spiritualProfile.status || <span className="italic font-normal text-gray-400">Not set</span>}</p>
                          </div>
                          {viewUser.spiritualProfile.naamMantra !== undefined && (
                            <div className="flex flex-col items-center gap-1">
                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", viewUser.spiritualProfile.naamMantra ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400")}>
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest text-gray-400 text-center">Naam<br/>Mantra</span>
                            </div>
                          )}
                        </div>

                        {/* Guruvarya Details (Naam Dharak / Vasnik) */}
                        {viewUser.spiritualProfile.guruvaryaName && (
                          <div className="pt-3 border-t border-amber-100 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Guruvarya Details</p>
                            <div className="grid grid-cols-2 gap-3">
                              <ProfileField label="Guruvarya Name" value={viewUser.spiritualProfile.guruvaryaName} />
                              <ProfileField label="Year" value={viewUser.spiritualProfile.guruvaryaYear} />
                              <ProfileField label="Place / Ashram" value={viewUser.spiritualProfile.guruvaryaPlace} colSpan />
                            </div>
                          </div>
                        )}

                        {/* Vidya Details (Vasnik / Bhikshuk) */}
                        {viewUser.spiritualProfile.vidyaGuruvaryaName && (
                          <div className="pt-3 border-t border-amber-100 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Vidya Guruvarya Details</p>
                            <div className="grid grid-cols-2 gap-3">
                              <ProfileField label="Vidya Guruvarya" value={viewUser.spiritualProfile.vidyaGuruvaryaName} />
                              <ProfileField label="Year" value={viewUser.spiritualProfile.vidyaGuruvaryaYear} />
                              <ProfileField label="Place / Ashram" value={viewUser.spiritualProfile.vidyaGuruvaryaPlace} colSpan />
                              {viewUser.spiritualProfile.vidyaKnowledge && <ProfileField label="Knowledge of Bramhavidya" value={viewUser.spiritualProfile.vidyaKnowledge} colSpan />}
                              {viewUser.spiritualProfile.vidyaStudiedMode && <ProfileField label="Studied Mode" value={viewUser.spiritualProfile.vidyaStudiedMode} />}
                            </div>
                          </div>
                        )}

                        {/* Diksha Details (Bhikshuk) */}
                        {viewUser.spiritualProfile.dikshaGuruvaryaName && (
                          <div className="pt-3 border-t border-amber-100 space-y-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-600">Diksha Details</p>
                            <div className="grid grid-cols-2 gap-3">
                              <ProfileField label="Diksha Guruvarya" value={viewUser.spiritualProfile.dikshaGuruvaryaName} />
                              <ProfileField label="Year" value={viewUser.spiritualProfile.dikshaGuruvaryaYear} />
                              <ProfileField label="Place / Ashram" value={viewUser.spiritualProfile.dikshaGuruvaryaPlace} colSpan />
                            </div>
                          </div>
                        )}
                      </div>
                    </ProfileSection>
                  )}

                  {/* Section: Security */}
                  {((viewUser.violationCount || 0) > 0 || viewUser.status === 'Blocked') && (
                    <ProfileSection title="Security & Violations" icon={<AlertCircle className="w-3.5 h-3.5 text-red-500" />}>
                      <div className="grid grid-cols-2 gap-4">
                        <ProfileField label="Violation Count" value={String(viewUser.violationCount || 0)} />
                        <ProfileField label="Account Status" value={viewUser.status} />
                      </div>
                      <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                        <p className="text-xs text-gray-500 italic">Manage via Security Dashboard</p>
                      </div>
                    </ProfileSection>
                  )}

                  {/* Section: Account & Dates */}
                  <ProfileSection title="Account Details" icon={<Calendar className="w-3.5 h-3.5" />}>
                    <div className="grid grid-cols-2 gap-4">
                      <ProfileField label="Joined Date" value={viewUser.createdAt?.toDate ? viewUser.createdAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Unknown'} />
                      <ProfileField label="Last Login" value={viewUser.lastLoginAt?.toDate ? viewUser.lastLoginAt.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : viewUser.lastLogin?.toDate ? viewUser.lastLogin.toDate().toLocaleDateString() : 'Never'} />
                      <ProfileField label="User ID" value={viewUser.id?.slice(-12).toUpperCase()} />
                      <ProfileField label="Verification" value={viewUser.isVerified ? '✓ Verified' : '✗ Unverified'} />
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                       <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Change Role</p>
                       <select 
                         className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block p-3 font-semibold outline-none"
                         value={viewUser.role}
                         onChange={(e) => {
                           handleUpdateRole(viewUser.id, e.target.value as UserRole);
                           setViewUser({...viewUser, role: e.target.value as UserRole});
                         }}
                         disabled={viewUser.role === 'Super Admin' && !isSuperAdmin}
                       >
                         <option value="Registered User">Registered User</option>
                         <option value="Volunteer">Volunteer</option>
                         <option value="Temple Manager">Temple Manager</option>
                         <option value="Moderator">Moderator</option>
                         {isSuperAdmin && <option value="Admin">Admin</option>}
                         {isSuperAdmin && <option value="Super Admin">Super Admin</option>}
                       </select>
                    </div>
                  </ProfileSection>
                  
                  <div className="flex gap-3 pt-2">
                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setViewUser(null)}>Close</Button>
                    {viewUser.status === 'Active' ? (
                       <Button variant="destructive" className="flex-1 rounded-xl h-12 font-bold bg-red-50 text-red-600 hover:bg-red-100 shadow-none border-none" onClick={() => { setActionUser({ user: viewUser, action: 'suspend' }); setViewUser(null); }}>Suspend User</Button>
                    ) : (
                       <Button className="flex-1 rounded-xl h-12 font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shadow-none border-none" onClick={() => { setActionUser({ user: viewUser, action: 'activate' }); setViewUser(null); }}>Activate User</Button>
                    )}
                  </div>
               </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
      {/* Confirmation Dialogs */}
      <AlertDialog open={!!actionUser} onOpenChange={(open) => !open && setActionUser(null)}>
        <AlertDialogContent className="rounded-[2rem] p-6 max-w-sm text-center border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-full bg-gray-50 mx-auto flex items-center justify-center mb-4">
               {actionUser?.action === 'delete' ? <Trash2 className="w-8 h-8 text-red-500" /> :
                actionUser?.action === 'verify' ? <UserCheck className="w-8 h-8 text-emerald-500" /> :
                <AlertCircle className="w-8 h-8 text-amber-500" />}
            </div>
            <AlertDialogTitle className="text-xl font-black tracking-tight mx-auto text-gray-900">
              {actionUser?.action === 'delete' ? "Delete User?" :
               actionUser?.action === 'verify' ? "Verify User?" :
               actionUser?.action === 'suspend' ? "Suspend User?" :
               actionUser?.action === 'activate' ? "Activate User?" : "Block User?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium text-gray-500 pt-2 mx-auto max-w-[250px]">
              {actionUser?.action === 'delete' ? "This action cannot be undone. This will permanently delete the user account." :
               actionUser?.action === 'verify' ? "Mark this user as a verified community member." :
               `Are you sure you want to ${actionUser?.action} ${actionUser?.user.name}?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 flex-col gap-2 sm:flex-col">
            <AlertDialogAction 
              onClick={executeAction} 
              className={cn("w-full h-12 rounded-xl font-bold uppercase tracking-wider text-[11px]",
                actionUser?.action === 'delete' ? "bg-red-500 hover:bg-red-600" :
                actionUser?.action === 'verify' ? "bg-emerald-500 hover:bg-emerald-600" :
                "bg-amber-500 hover:bg-amber-600"
              )}>
              Confirm {actionUser?.action}
            </AlertDialogAction>
            <AlertDialogCancel className="w-full h-12 rounded-xl font-bold mt-0 border-gray-200 bg-gray-50">Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Violation History Modal */}
      <Sheet open={!!historyUser} onOpenChange={(open) => !open && setHistoryUser(null)}>
        <SheetContent className="w-full sm:max-w-xl p-0 overflow-y-auto border-none shadow-2xl">
          <SheetHeader className="p-6 pb-0 border-none">
            <SheetTitle>Violation History</SheetTitle>
            <SheetDescription>Security events for {historyUser?.name}</SheetDescription>
          </SheetHeader>
          <div className="p-6">
            {userViolations.length === 0 ? (
              <p className="text-gray-500 text-center py-10">No violations recorded.</p>
            ) : (
              <div className="space-y-4">
                {userViolations.map(v => (
                  <div key={v.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-sm text-gray-900">{v.type.replace(/_/g, ' ')}</p>
                      <Badge className={cn("text-[10px] font-black uppercase shadow-none border-none", 
                        v.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        v.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        v.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      )}>{v.severity}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">{new Date(v.timestamp).toLocaleString()}</p>
                    <p className="text-xs text-gray-600 bg-white p-2 rounded-lg border border-gray-100 font-mono overflow-x-auto">
                      {v.deviceInfo}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

function StatCard({ title, value, icon: Icon, color, loading }: { title: string, value: number, icon: any, color: string, loading: boolean }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
      <div>
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">{title}</p>
        {loading ? (
           <Skeleton className="w-16 h-8 rounded-lg" />
        ) : (
           <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{value}</h3>
        )}
      </div>
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110", color)}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  );
}

function ProfileSection({ title, icon, accent, children }: { title: string; icon: React.ReactNode; accent?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("rounded-2xl p-5 border shadow-sm", accent ? "bg-amber-50/60 border-amber-100" : "bg-white border-gray-100")}>
      <div className="flex items-center gap-2 mb-4">
        <div className={cn("p-1.5 rounded-lg", accent ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
          {icon}
        </div>
        <h3 className={cn("text-[10px] font-black uppercase tracking-widest", accent ? "text-amber-700" : "text-gray-400")}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ProfileField({ label, value, colSpan }: { label: string; value?: string | null; colSpan?: boolean }) {
  return (
    <div className={colSpan ? "col-span-2" : ""}>
      <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-gray-900 break-words">{value || <span className="text-gray-400 italic font-normal">—</span>}</p>
    </div>
  );
}

function SecurityTabContent({ 
  violations, stats, loading, search, setSearch, 
  severity, setSeverity, platform, setPlatform, onUnblock 
}: any) {
  const filtered = useMemo(() => {
    return violations.filter((v: any) => {
      const matchSearch = search === "" || 
        v.userEmail?.toLowerCase().includes(search.toLowerCase()) || 
        v.userName?.toLowerCase().includes(search.toLowerCase()) || 
        v.type.toLowerCase().includes(search.toLowerCase());
      const matchSeverity = severity === "All" || v.severity === severity;
      const matchPlatform = platform === "All" || v.platform === platform.toLowerCase();
      return matchSearch && matchSeverity && matchPlatform;
    });
  }, [violations, search, severity, platform]);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Violations" value={stats.total} icon={ShieldCheck} color="bg-blue-50 text-blue-600" loading={loading} />
        <StatCard title="Critical Incidents" value={stats.critical} icon={AlertCircle} color="bg-red-50 text-red-600" loading={loading} />
        <StatCard title="Blocked Users" value={stats.blockedUsers} icon={Ban} color="bg-amber-50 text-amber-600" loading={loading} />
        <StatCard title="Violations Today" value={stats.today} icon={Activity} color="bg-indigo-50 text-indigo-600" loading={loading} />
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input placeholder="Search by email, name or type..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11 bg-gray-50 border-gray-200 rounded-xl w-full" />
        </div>
        <div className="flex items-center gap-3">
          <select className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm font-semibold outline-none" value={severity} onChange={e => setSeverity(e.target.value)}>
            <option value="All">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select className="px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 text-sm font-semibold outline-none" value={platform} onChange={e => setPlatform(e.target.value)}>
            <option value="All">All Platforms</option>
            <option value="web">Web</option>
            <option value="android">Android</option>
            <option value="ios">iOS</option>
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Timestamp</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">User</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Violation Type</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Severity</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Platform/IP</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading violations...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-500">No violations found</td></tr>
              ) : (
                filtered.map((v: any) => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(v.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 text-sm">{v.userName}</p>
                      <p className="text-xs text-gray-500">{v.userEmail}</p>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700">{v.type.replace(/_/g, ' ')}</td>
                    <td className="px-6 py-4">
                      <Badge className={cn("text-[10px] font-black uppercase shadow-none border-none", 
                        v.severity === 'critical' ? 'bg-red-100 text-red-700' :
                        v.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                        v.severity === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
                      )}>{v.severity}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-xs text-gray-700 uppercase">{v.platform}</p>
                      <p className="text-xs text-gray-500">{v.ip}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {v.userId !== 'anonymous' && v.blocked && (
                        <Button size="sm" variant="outline" className="h-8 text-xs font-bold text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100" onClick={() => onUnblock(v.userId)}>
                          Unblock User
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
