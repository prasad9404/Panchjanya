import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  Timestamp,
  arrayUnion,
  getDoc
} from "firebase/firestore";
import { db } from "@/auth/firebase";
import { useAuth } from "@/auth/AuthContext";
import { useToast } from "@/shared/hooks/use-toast";
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  MapPin,
  Calendar,
  User,
  ShieldCheck,
  LayoutGrid,
  List as ListIcon,
  ChevronRight,
  History,
  AlertCircle,
  MessageSquare,
  Clock,
  Send,
  ArrowRight,
  Map as MapIcon,
  Image as ImageIcon,
  FileText,
  ExternalLink,
  Info,
  X,
  Wrench,
  Globe,
  CircleDot
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/shared/lib/utils";
import { useNavigate } from "react-router-dom";
import { getAvatarColor } from "@/shared/utils/sthanTypes";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import SuperAdminLayout from "@/shared/components/admin/SuperAdminLayout";

interface ReviewComment {
  comment: string;
  createdBy: string;
  createdAt: any;
  status: "OPEN" | "RESOLVED";
}

interface PendingSthana {
  id: string;
  name: string;
  oldName?: string;
  todaysName?: string;
  todaysNameTitle?: string;
  district: string;
  taluka: string;
  address?: string;
  primaryAvatar: string;
  sthanType: string;
  status: string;
  reviewStatus?: "PENDING" | "CHANGES_REQUIRED" | "APPROVED";
  reviewComments?: ReviewComment[];
  updatedAt: any;
  updatedBy?: string;
  thumbnail?: string;
  sthanImages?: string[];
  presentImages?: string[];
  architectureImages?: string[];
  description?: string;
  sthanInfo?: string;
  description_text?: string;
  sthana_info_text?: string;
  directions_text?: string;
  locationLink?: string;
  latitude?: string | number;
  longitude?: string | number;
  hasArchitecture?: boolean;

  // Sthan Details specific fields
  details?: any[];
  glanceItems?: any[];
  contactName?: string;
  contactNumber?: string;
  contactDetails?: string;
  leelas?: any[];
  customBlocks?: any[];
  sthanPothiDescription?: string;
  globalPothiDescription?: string;
  architectureDescription?: string;
  abbreviationItems?: any[];
  relatedAvatars?: any[];
  descriptionSections?: any[];
  description_title?: string;
  sthana_info_title?: string;
  primarySubtype?: string[];
  verifiedBy?: string;
  verifiedAt?: any;
}

export const getLocalizedString = (val: any): string => {
  if (!val) return "";
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.en || val.mr || val.hi || Object.values(val)[0] || "";
  }
  return String(val);
};

export default function SthanaVerification({ isSuperAdmin = false }: { isSuperAdmin?: boolean }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Choose Layout
  const Layout = isSuperAdmin ? SuperAdminLayout : AdminLayout;

  // Data States
  const [pendingSthanas, setPendingSthanas] = useState<PendingSthana[]>([]);
  const [changesRequested, setChangesRequested] = useState<PendingSthana[]>([]);
  const [approvedHistory, setApprovedHistory] = useState<PendingSthana[]>([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedSthana, setSelectedSthana] = useState<PendingSthana | null>(null);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    fetchSthanas();
  }, []);

  const fetchSthanas = async () => {
    try {
      setLoading(true);

      const qPending = query(collection(db, "temples"), where("status", "==", "COMPLETE"));
      const snapPending = await getDocs(qPending);
      const dataPending = snapPending.docs.map(d => ({ id: d.id, ...d.data() })) as PendingSthana[];

      const actuallyPending = dataPending.filter(s => !s.reviewStatus || s.reviewStatus === "PENDING");
      const actuallyChangesRequested = dataPending.filter(s => s.reviewStatus === "CHANGES_REQUIRED");

      const qHistory = query(collection(db, "temples"), where("status", "in", ["VERIFIED", "PUBLISHED"]));
      const snapHistory = await getDocs(qHistory);
      const dataHistory = snapHistory.docs.map(d => ({ id: d.id, ...d.data() })) as PendingSthana[];

      const sortByDate = (a: any, b: any) => {
        const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return tB - tA;
      };

      setPendingSthanas(actuallyPending.sort(sortByDate));
      setChangesRequested(actuallyChangesRequested.sort(sortByDate));
      setApprovedHistory(dataHistory.sort(sortByDate));

    } catch (error) {
      console.error("Error fetching sthanas:", error);
      toast({ title: "Error", description: "Failed to load sthanas.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, name: string) => {
    if (!user) return;
    const sthana = [...pendingSthanas, ...changesRequested].find(s => s.id === id);
    const hasUnresolved = sthana?.reviewComments?.some(c => c.status === "OPEN");

    if (hasUnresolved) {
      toast({
        title: "Unresolved Comments",
        description: "Please resolve all review comments before approving.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingReview(true);
      const ref = doc(db, "temples", id);
      await updateDoc(ref, {
        status: "VERIFIED",
        reviewStatus: "APPROVED",
        verifiedBy: user.uid,
        verifiedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });

      toast({ title: "Sthana Verified", description: `${name} is now approved.` });
      fetchSthanas();
      setSelectedSthana(null);
    } catch (error) {
      console.error("Error verifying:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!selectedSthana || !user) return;
    if (!newComment.trim()) {
      toast({ title: "Comment Required", description: "Please add a comment explaining the requested changes.", variant: "destructive" });
      return;
    }

    try {
      setIsSubmittingReview(true);
      const ref = doc(db, "temples", selectedSthana.id);
      const commentObj: ReviewComment = {
        comment: newComment.trim(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: "OPEN"
      };

      await updateDoc(ref, {
        reviewStatus: "CHANGES_REQUIRED",
        status: "IN_PROGRESS",
        reviewComments: arrayUnion(commentObj),
        updatedAt: Timestamp.now()
      });

      toast({ title: "Changes Requested", description: "Feedback sent to the editor." });
      setNewComment("");
      fetchSthanas();
      setSelectedSthana(null);
    } catch (error) {
      console.error("Error requesting changes:", error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedSthana || !user || !newComment.trim()) return;

    try {
      const ref = doc(db, "temples", selectedSthana.id);
      const commentObj: ReviewComment = {
        comment: newComment.trim(),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        status: "OPEN"
      };

      await updateDoc(ref, {
        reviewComments: arrayUnion(commentObj),
        updatedAt: Timestamp.now()
      });

      toast({ title: "Comment Added", description: "Your feedback has been recorded." });
      setNewComment("");

      const updatedSnap = await getDoc(ref);
      if (updatedSnap.exists()) {
        setSelectedSthana({ id: updatedSnap.id, ...updatedSnap.data() } as PendingSthana);
      }
      fetchSthanas();
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  return (
    <Layout>
      <div className="p-0 space-y-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Review Workflow</h1>
            </div>
            <p className="text-slate-500 font-medium">Verify submissions, add comments, and manage quality standards.</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
            <Button variant={viewMode === "grid" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("grid")} className="rounded-xl h-9 w-9 p-0">
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button variant={viewMode === "list" ? "default" : "ghost"} size="sm" onClick={() => setViewMode("list")} className="rounded-xl h-9 w-9 p-0">
              <ListIcon className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <TabsList className="bg-slate-100/50 p-1 rounded-2xl border border-slate-200/50">
              <TabsTrigger value="pending" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 font-bold">
                Pending Review ({pendingSthanas.length})
              </TabsTrigger>
              <TabsTrigger value="changes" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 font-bold">
                Fix Requested ({changesRequested.length})
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-xl px-6 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 font-bold">
                Approved History
              </TabsTrigger>
            </TabsList>

            <div className="relative group flex-1 max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
              <Input placeholder="Quick Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-11 rounded-2xl border-slate-200 bg-white/50" />
            </div>
          </div>

          <TabsContent value="pending" className="mt-0 outline-none">
            <ReviewList loading={loading} items={pendingSthanas} searchQuery={searchQuery} viewMode={viewMode} onViewDetails={setSelectedSthana} />
          </TabsContent>

          <TabsContent value="changes" className="mt-0 outline-none">
            <ReviewList loading={loading} items={changesRequested} searchQuery={searchQuery} viewMode={viewMode} onViewDetails={setSelectedSthana} />
          </TabsContent>

          <TabsContent value="history" className="mt-0 outline-none">
            <HistoryTable items={approvedHistory} navigate={navigate} />
          </TabsContent>
        </Tabs>

        {/* --- FULL DATA READ-ONLY REVIEW DIALOG --- */}
        <Dialog open={!!selectedSthana} onOpenChange={(open) => !open && (setSelectedSthana(null), setNewComment(""))}>
          <DialogContent className="max-w-[95vw] w-[1400px] h-[95vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl" aria-describedby={undefined}>
            <DialogTitle className="sr-only">{selectedSthana ? getLocalizedString(selectedSthana.name) : "Sthana Review"}</DialogTitle>
            {selectedSthana && (
              <div className="flex flex-col lg:flex-row h-full bg-white overflow-hidden scroll-smooth">
                {/* --- LEFT PANEL: STHANA DETAILS --- */}
                <div className="flex-1 min-w-0 flex flex-col h-full bg-slate-50/10">
                  {/* Sticky Header */}
                  <div className="h-24 shrink-0 border-b border-slate-100 flex items-center justify-between px-10 bg-white/95 backdrop-blur-md z-30 shadow-sm sticky top-0">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black shadow-xl shadow-blue-500/10" style={{ backgroundColor: getAvatarColor(selectedSthana.primaryAvatar) }}>
                        {getLocalizedString(selectedSthana.name)[0] || "?"}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight line-clamp-1">{getLocalizedString(selectedSthana.name)}</h2>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 bg-slate-50/50">{getLocalizedString(selectedSthana.sthanType)}</Badge>
                          <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Reviewing Dataset</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={cn(
                        "rounded-xl px-4 py-2 font-black text-[10px] uppercase tracking-widest border shadow-sm",
                        selectedSthana.reviewStatus === "CHANGES_REQUIRED" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          selectedSthana.status === "VERIFIED" ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                            "bg-blue-50 text-blue-600 border-blue-100"
                      )}>
                        {selectedSthana.reviewStatus || "PENDING"}
                      </Badge>
                    </div>
                  </div>

                  {/* Main Content Area: Independent Scrolling */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar px-6 lg:px-10 py-10 space-y-16 min-h-0 bg-white">
                    <div className="max-w-full mx-auto space-y-16 pb-24">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-10">
                          <DataSection title="Primary Identity" icon={<FileText className="w-4 h-4" />}>
                            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                              <DataItem label="Core Name" value={selectedSthana.name} />
                              <DataItem label="Old/Alternate Name" value={selectedSthana.oldName || "N/A"} />
                              <DataItem label={getLocalizedString(selectedSthana.todaysNameTitle) || "Today's Name"} value={selectedSthana.todaysName || "N/A"} />
                              <DataItem label="District" value={selectedSthana.district} />
                              <DataItem label="Taluka" value={selectedSthana.taluka} />
                              <DataItem label="Sthan Type" value={selectedSthana.sthanType} isBadge />
                              <DataItem label="Primary Avatar" value={selectedSthana.primaryAvatar} isBadge />

                              {selectedSthana.primarySubtype && selectedSthana.primarySubtype.length > 0 && (
                                <div className="col-span-2 space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Avatar Subdivisions</label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedSthana.primarySubtype.map((s: string, idx: number) => (
                                      <Badge key={idx} variant="outline" className="rounded-lg h-7 px-3 bg-blue-50/50 border-blue-100/50 text-[9px] font-black uppercase text-blue-700">
                                        {s}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {selectedSthana.relatedAvatars && selectedSthana.relatedAvatars.length > 0 && (
                                <div className="col-span-2 space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Related Avatars</label>
                                  <div className="flex flex-wrap gap-2">
                                    {selectedSthana.relatedAvatars.map((av: any, idx: number) => (
                                      <Badge key={idx} variant="outline" className="rounded-lg h-7 px-3 bg-slate-50 border-slate-100 text-[9px] font-black uppercase text-slate-600">
                                        {typeof av === 'string' ? av : (av.avatar || "Unnamed")}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-6">
                              <DataItem label="Detailed Address" value={selectedSthana.address || "No detailed address provided."} isLongText />
                            </div>
                          </DataSection>

                          <DataSection title="Location & Navigation" icon={<MapPin className="w-4 h-4" />}>
                            <div className="grid grid-cols-2 gap-6">
                              <DataItem label="Latitude" value={String(selectedSthana.latitude || "N/A")} />
                              <DataItem label="Longitude" value={String(selectedSthana.longitude || "N/A")} />
                            </div>
                            {selectedSthana.locationLink && (
                              <div className="mt-4 pt-4 border-t border-slate-50 italic">
                                <a href={selectedSthana.locationLink} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 font-black uppercase flex items-center gap-2">
                                  View on Google Maps <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}
                            <div className="mt-6">
                              <DataItem label="Directions / Way to Reach" value={selectedSthana.directions_text || "No directions provided."} isLongText />
                            </div>
                          </DataSection>

                          <DataSection title="Sthan Descriptions" icon={<AlertCircle className="w-4 h-4" />}>
                            <div className="space-y-6">
                              <DataItem label={getLocalizedString(selectedSthana.description_title) || "Glance Description"} value={selectedSthana.description_text || selectedSthana.description || "No specific glance info."} isLongText />
                              <DataItem label={getLocalizedString(selectedSthana.sthana_info_title) || "Main Sthana Info"} value={selectedSthana.sthana_info_text || selectedSthana.sthanInfo || "No general description."} isLongText />
                              <DataItem label={getLocalizedString(selectedSthana.description_title) || "Glance Description"} value={getLocalizedString(selectedSthana.description_text) || getLocalizedString(selectedSthana.description) || "No specific glance info."} isLongText />
                              <DataItem label={getLocalizedString(selectedSthana.sthana_info_title) || "Main Sthana Info"} value={getLocalizedString(selectedSthana.sthana_info_text) || getLocalizedString(selectedSthana.sthanInfo) || "No general description."} isLongText />
                              <DataItem label="Architecture Description" value={getLocalizedString(selectedSthana.architectureDescription) || "No architectural description."} isLongText />
                              <DataItem label="Sthan Pothi (Global)" value={getLocalizedString(selectedSthana.sthanPothiDescription) || getLocalizedString(selectedSthana.globalPothiDescription) || "No global pothi entry."} isLongText />

                              {selectedSthana.descriptionSections && selectedSthana.descriptionSections.length > 0 && (
                                <div className="pt-4 space-y-4">
                                  {selectedSthana.descriptionSections.map((s, i) => (
                                    <DataItem key={i} label={getLocalizedString(s.title) || `Section ${i + 1}`} value={getLocalizedString(s.content)} isLongText />
                                  ))}
                                </div>
                              )}
                            </div>
                          </DataSection>
                        </div>

                        <div className="space-y-8">
                          <DataSection title="Media Gallery" icon={<ImageIcon className="w-4 h-4" />}>
                            <div className="space-y-8">
                              <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Sthan Photos</h4>
                                <div className="overflow-x-auto pb-2">
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-w-[300px]">
                                    {selectedSthana.sthanImages?.map((img, i) => (
                                      <img key={i} src={img} className="aspect-square rounded-xl object-cover border border-slate-100 shadow-sm" />
                                    ))}
                                    {(!selectedSthana.sthanImages || selectedSthana.sthanImages.length === 0) && (
                                      <div className="col-span-full aspect-[4/1] rounded-xl bg-slate-50 border border-dashed border-slate-200 flex items-center justify-center text-slate-300 text-[10px] font-black uppercase">No Sthan Images</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Architecture Visuals</h4>
                                <div className="overflow-x-auto pb-2">
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-w-[300px]">
                                    {selectedSthana.architectureImages?.map((img, i) => (
                                      <img key={i} src={img} className="aspect-square rounded-xl object-cover border border-slate-100 shadow-sm" />
                                    ))}
                                    {(!selectedSthana.architectureImages || selectedSthana.architectureImages.length === 0) && (
                                      <p className="text-[10px] text-slate-400 font-bold italic col-span-full py-4 px-2">No arch visuals uploaded</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Present Day Photos</h4>
                                <div className="overflow-x-auto pb-2">
                                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 min-w-[300px]">
                                    {selectedSthana.presentImages?.map((img, i) => (
                                      <img key={i} src={img} className="aspect-square rounded-xl object-cover border border-slate-100 shadow-sm" />
                                    ))}
                                    {(!selectedSthana.presentImages || selectedSthana.presentImages.length === 0) && (
                                      <p className="text-[10px] text-slate-400 font-bold italic col-span-full py-4 px-2">No present photos uploaded</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </DataSection>

                          {selectedSthana.glanceItems && selectedSthana.glanceItems.length > 0 && (
                            <DataSection title="At a Glance" icon={<LayoutGrid className="w-4 h-4" />}>
                              <div className="grid grid-cols-2 gap-4">
                                {selectedSthana.glanceItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    {item.icon && <img src={item.icon} alt="" className="w-5 h-5 opacity-70" />}
                                    <span className="text-[11px] font-bold text-slate-700">{getLocalizedString(item.description)}</span>
                                  </div>
                                ))}
                              </div>
                            </DataSection>
                          )}

                          {(selectedSthana.contactName || selectedSthana.contactNumber) && (
                            <DataSection title="Contact Information" icon={<User className="w-4 h-4" />}>
                              <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-6">
                                  <DataItem label="Contact Person" value={getLocalizedString(selectedSthana.contactName) || "N/A"} />
                                  <DataItem label="Phone Number" value={selectedSthana.contactNumber || "N/A"} />
                                </div>
                                <DataItem label="Additional Contact Details" value={getLocalizedString(selectedSthana.contactDetails) || "None"} isLongText />
                              </div>
                            </DataSection>
                          )}
                        </div>
                      </div>

                      {/* Sacred Points */}
                      {selectedSthana.details && selectedSthana.details.length > 0 && (
                        <div className="space-y-8">
                          <div className="flex items-center gap-3 px-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg text-blue-600">
                              <MapIcon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Sacred Points & Structures ({selectedSthana.details.length})</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {selectedSthana.details.map((detail, idx) => (
                              <div key={idx} className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase leading-snug">{getLocalizedString(detail.title) || "Sacred Point"}</h4>
                                    <Badge variant="secondary" className="mt-1 text-[8px] font-black uppercase tracking-widest">{getLocalizedString(detail.type) || "Structure"}</Badge>
                                  </div>
                                  {detail.images?.[0] && <img src={detail.images[0]} className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-50" />}
                                </div>
                                <p className="text-[11px] text-slate-500 font-medium line-clamp-3 bg-slate-50/50 p-3 rounded-xl">{getLocalizedString(detail.description) || "No detailed description provided."}</p>
                                {(detail.sthanPothiTitle || detail.sthanPothiDescription) && (
                                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                    <h5 className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1 flex items-center gap-1">
                                      <History className="w-3 h-3" /> {getLocalizedString(detail.sthanPothiTitle) || "Sthan Pothi Entry"}
                                    </h5>
                                    <p className="text-[10px] text-slate-600 font-medium italic line-clamp-2">{getLocalizedString(detail.sthanPothiDescription)}</p>
                                  </div>
                                )}
                                {detail.leelas?.length > 0 && (
                                  <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{detail.leelas.length} Associated Leelas</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Global Leelas */}
                      {selectedSthana.leelas && selectedSthana.leelas.length > 0 && (
                        <DataSection title="Global Leela References" icon={<History className="w-4 h-4" />}>
                          <div className="space-y-4">
                            {selectedSthana.leelas.map((leela, idx) => (
                              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-[10px] font-black">
                                    {idx + 1}
                                  </div>
                                  <span className="text-sm font-bold text-slate-700">{getLocalizedString(leela.title || leela)}</span>
                                </div>
                                <Badge variant="outline" className="text-[8px] font-black uppercase">Leela Record</Badge>
                              </div>
                            ))}
                          </div>
                        </DataSection>
                      )}

                      {/* Custom Content Blocks */}
                      {selectedSthana.customBlocks && selectedSthana.customBlocks.length > 0 && (
                        <div className="space-y-10">
                          {selectedSthana.customBlocks.map((block, idx) => (
                            <DataSection key={idx} title={getLocalizedString(block.title) || `Content Block ${idx + 1}`} icon={<FileText className="w-4 h-4" />}>
                              <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{getLocalizedString(block.content)}</p>
                            </DataSection>
                          ))}
                        </div>
                      )}

                      {/* Abbreviations */}
                      {selectedSthana.abbreviationItems && selectedSthana.abbreviationItems.length > 0 && (
                        <DataSection title="Terminology / Abbreviations" icon={<Info className="w-4 h-4" />}>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedSthana.abbreviationItems.map((item: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                {item.icon && <img src={item.icon} alt="" className="w-5 h-5" />}
                                <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{getLocalizedString(item.description)}</span>
                              </div>
                            ))}
                          </div>
                        </DataSection>
                      )}
                    </div>
                  </div>
                </div>

                {/* --- RIGHT PANEL: REVIEW COMMENTS --- */}
                <div className="w-full lg:w-[380px] h-full flex flex-col border-l border-slate-100 bg-white z-40">
                  {/* Panel Header */}
                  <div className="h-20 shrink-0 border-b border-slate-100 flex items-center justify-between px-8 bg-white sticky top-0">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-blue-600" /> Review Comments
                    </h3>
                    <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all" onClick={() => setSelectedSthana(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Comments list: Independent Scrolling */}
                  <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 custom-scrollbar relative">
                    <div className="space-y-6 pb-12">
                      {selectedSthana.reviewComments?.map((c, i) => (
                        <div key={i} className={cn(
                          "bg-white rounded-[1.5rem] p-5 shadow-sm border border-slate-100 space-y-3 relative overflow-hidden transition-all duration-300 hover:shadow-md",
                          c.status === "RESOLVED" && "opacity-60 grayscale-[0.5]"
                        )}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                                <User className="w-4 h-4 text-slate-400" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">Admin Review</span>
                                <span className="text-[8px] font-bold text-slate-400 capitalize">{c.createdAt?.toDate ? c.createdAt.toDate().toLocaleDateString() : "Just now"}</span>
                              </div>
                            </div>
                            <Badge className={cn(
                              "rounded-lg text-[7px] font-black p-1 px-2 uppercase border shadow-none",
                              c.status === "OPEN" ? "bg-amber-50 text-amber-600 border-amber-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"
                            )}>
                              {c.status}
                            </Badge>
                          </div>
                          <p className="text-[13px] text-slate-600 leading-relaxed font-medium pl-2 border-l-2 border-slate-100 ml-2">{c.comment}</p>
                        </div>
                      ))}
                      {(!selectedSthana.reviewComments || selectedSthana.reviewComments.length === 0) && (
                        <div className="text-center py-20 bg-white/50 rounded-[2rem] border border-dashed border-slate-200 mx-2">
                          <Clock className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                          <p className="text-[10px] text-slate-400 font-bold px-8 uppercase tracking-widest">No review history</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Bar & Comment Input */}
                  <div className="p-6 border-t border-slate-100 bg-white space-y-4 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <Textarea
                      placeholder="Add a specific correction note..."
                      className="rounded-[1.5rem] border-slate-200 text-sm min-h-[120px] bg-slate-50/50 focus:bg-white transition-all resize-none shadow-none"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex flex-col gap-3">
                      <Button className="w-full h-12 rounded-xl bg-slate-900 hover:bg-black text-white font-black text-[11px] uppercase tracking-[0.2em] gap-2 shadow-xl shadow-slate-900/10 transition-all active:scale-95" onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingReview}>
                        Post Comment <Send className="w-4 h-4" />
                      </Button>

                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="rounded-xl border-slate-200 font-black text-[10px] uppercase tracking-widest text-slate-600 h-12 hover:bg-amber-50 hover:text-amber-700 transition-all" onClick={handleRequestChanges} disabled={isSubmittingReview}>
                          Request Fix
                        </Button>
                        <Button className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest h-12 shadow-md shadow-emerald-500/10 transition-all disabled:opacity-50" onClick={() => handleApprove(selectedSthana.id, selectedSthana.name)} disabled={isSubmittingReview || selectedSthana.reviewComments?.some(c => c.status === "OPEN")}>
                          Approve
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}

function ReviewList({ loading, items, searchQuery, viewMode, onViewDetails }: { loading: boolean; items: PendingSthana[]; searchQuery: string; viewMode: "grid" | "list"; onViewDetails: (s: PendingSthana) => void; }) {
  const filtered = items.filter(s => getLocalizedString(s.name).toLowerCase().includes(searchQuery.toLowerCase()) || getLocalizedString(s.district).toLowerCase().includes(searchQuery.toLowerCase()));
  if (loading) return <LoadingGrid />;
  if (filtered.length === 0) return <EmptyState icon={<CheckCircle2 className="w-12 h-12 text-blue-100" />} title="Nothing to review" description="This queue is currently empty." />;
  return (
    <div className={cn("grid gap-6", viewMode === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1")}>
      <AnimatePresence mode="popLayout">
        {filtered.map((sthana) => (
          <ReviewCard key={sthana.id} sthana={sthana} viewMode={viewMode} onView={() => onViewDetails(sthana)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

const statusConfig = {
  PENDING:           { label: "Pending Review",   icon: Clock,         bg: "bg-blue-500",   text: "text-white" },
  CHANGES_REQUIRED:  { label: "Fix Requested",    icon: Wrench,        bg: "bg-amber-500",  text: "text-white" },
  APPROVED:          { label: "Approved",          icon: CheckCircle2,  bg: "bg-emerald-500", text: "text-white" },
  VERIFIED:          { label: "Verified",          icon: ShieldCheck,   bg: "bg-emerald-600", text: "text-white" },
  PUBLISHED:         { label: "Published",         icon: Globe,         bg: "bg-indigo-500", text: "text-white" },
};

const ReviewCard = React.forwardRef<HTMLDivElement, { sthana: PendingSthana; viewMode: "grid" | "list"; onView: () => void }>(function ReviewCard({ sthana, viewMode, onView }, ref) {
  const statusKey = sthana.status === "VERIFIED" ? "VERIFIED"
    : sthana.status === "PUBLISHED" ? "PUBLISHED"
    : sthana.reviewStatus === "CHANGES_REQUIRED" ? "CHANGES_REQUIRED"
    : sthana.reviewStatus === "APPROVED" ? "APPROVED"
    : "PENDING";
  const status = statusConfig[statusKey];
  const StatusIcon = status.icon;
  const openComments = sthana.reviewComments?.filter(c => c.status === "OPEN").length ?? 0;

  return (
    <motion.div ref={ref} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className={cn("group bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500", viewMode === "list" ? "flex flex-col md:flex-row h-auto md:h-44" : "flex flex-col h-full")}>
      <div className={cn("relative shrink-0 overflow-hidden", viewMode === "list" ? "w-full md:w-56 h-44 md:h-full" : "h-40 w-full")}>
        <img src={sthana.thumbnail || sthana.sthanImages?.[0] || "/placeholder-sthan.jpg"} alt={getLocalizedString(sthana.name)} className="w-full h-full object-cover grayscale-[0.4] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" />
        {/* Sthan type — bottom left */}
        <div className="absolute bottom-3 left-3">
          <Badge className="bg-black/50 text-white border-none backdrop-blur-sm shadow-sm rounded-lg py-1 px-2.5 text-[8px] font-black uppercase tracking-wider">{getLocalizedString(sthana.sthanType)}</Badge>
        </div>
        {/* Status pill — top right */}
        <div className={cn("absolute top-3 right-3 flex items-center gap-1.5 rounded-full px-2.5 py-1 shadow-lg", status.bg)}>
          <StatusIcon className={cn("w-3 h-3", status.text)} />
          <span className={cn("text-[8px] font-black uppercase tracking-wide", status.text)}>{status.label}</span>
        </div>
      </div>
      <div className="flex-1 p-6 flex flex-col justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-black text-slate-900 tracking-tight transition-colors uppercase">{getLocalizedString(sthana.name)}</h3>
          <div className="flex items-center gap-1.5 text-slate-400">
            <MapPin className="w-3 h-3" />
            <span className="text-[10px] font-black uppercase tracking-widest">{getLocalizedString(sthana.district)}</span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            {openComments > 0 && (
              <div className="flex items-center gap-1 text-amber-500">
                <MessageSquare className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-black">{openComments} open</span>
              </div>
            )}
          </div>
          <Button variant="ghost" className="rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all gap-2" onClick={onView}>
            Review Data <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
});

function HistoryTable({ items, navigate }: { items: PendingSthana[]; navigate: any }) {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead className="bg-slate-50/50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b border-slate-100">
            <tr>
              <th className="px-8 py-5 text-left font-black">Sthana Info</th>
              <th className="px-8 py-5 text-left font-black">Location</th>
              <th className="px-8 py-5 text-left font-black">Status</th>
              <th className="px-8 py-5 text-left font-black">Date</th>
              <th className="px-8 py-5 text-right font-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => (
              <tr key={item.id} className="group hover:bg-slate-50/30 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-black">{getLocalizedString(item.name)[0] || "?"}</div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 line-clamp-1">{getLocalizedString(item.name)}</p>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">{getLocalizedString(item.sthanType)}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs text-slate-500 font-medium">{getLocalizedString(item.district)}, {getLocalizedString(item.taluka)}</td>
                <td className="px-8 py-5">
                  <Badge variant="outline" className={cn("rounded-lg text-[9px] px-2.5 py-1 font-black uppercase tracking-widest border", item.status === 'PUBLISHED' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-emerald-50 text-emerald-600 border-emerald-100")}>{item.status}</Badge>
                </td>
                <td className="px-8 py-5">
                  <div className="flex items-center gap-2">
                    <User className="w-3 h-3 text-slate-300" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{item.verifiedBy ? "Verified Admin" : "Auto"}</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-bold tabular-nums">
                    {item.verifiedAt?.toDate ? item.verifiedAt.toDate().toLocaleDateString() : 'N/A'}
                  </div>
                </td>
                <td className="px-8 py-5 text-right">
                  <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9 text-slate-400 hover:text-blue-600" onClick={() => navigate(`/admin/temples/${item.id}/edit`)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && <div className="py-24 text-center"><Clock className="w-12 h-12 text-slate-100 mx-auto mb-4" /><p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No History Yet</p></div>}
      </div>
    </div>
  );
}

function DataSection({ title, icon, children }: { title: any; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500">{icon}</div>
        <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">{getLocalizedString(title)}</h3>
      </div>
      <div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm">{children}</div>
    </div>
  );
}

function DataItem({ label, value, isBadge, isLongText }: { label: any; value: any; isBadge?: boolean; isLongText?: boolean }) {
  const strValue = getLocalizedString(value);
  const strLabel = getLocalizedString(label);
  if (!strValue) return null;
  return (
    <div className="space-y-2">
      <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] ml-1">{strLabel}</span>
      {isLongText ? (
        <div className="text-sm text-slate-600 leading-relaxed font-medium bg-slate-50/50 p-5 rounded-[1.5rem] border border-slate-100/50 hover:bg-white hover:border-blue-100 transition-all duration-300">
          {strValue.split('\n').map((line, i) => <p key={i} className={i > 0 ? "mt-2" : ""}>{line}</p>)}
        </div>
      ) : isBadge ? (
        <div className="flex">
          <Badge className="bg-blue-50/50 text-blue-600 border border-blue-100/50 shadow-none rounded-xl px-4 py-1.5 text-[10px] font-black uppercase tracking-tight">
            {strValue}
          </Badge>
        </div>
      ) : (
        <p className="text-sm font-bold text-slate-800 bg-white px-4 py-2.5 rounded-xl border border-slate-50 shadow-[0_2px_4px_rgba(0,0,0,0.01)]">
          {strValue}
        </p>
      )}
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="bg-white h-80 rounded-[2.5rem] animate-pulse border border-slate-50" />
      ))}
    </div>
  );
}

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string; }) {
  return (
    <div className="py-32 flex flex-col items-center justify-center text-center bg-white rounded-[3rem] border border-slate-100 shadow-sm">
      <div className="mb-6 p-6 bg-slate-50 rounded-full">{icon}</div>
      <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{title}</h3>
      <p className="text-slate-400 font-medium mt-2 max-w-xs">{description}</p>
    </div>
  );
}
