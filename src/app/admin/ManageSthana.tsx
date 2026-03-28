import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { doc, getDoc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { ArrowLeft, Check, ExternalLink, AlertTriangle, MessageSquare, CheckCircle2, Send, Clock } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/auth/AuthContext";

import { SthanaIdentifier } from "@/shared/components/admin/SthanaIdentifier";
import TempleForm from "@/shared/components/admin/TempleForm";
import TempleArchitectureAdmin from "./TempleArchitectureAdmin";
import { getAvatarColor } from "@/shared/utils/sthanTypes";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

export default function ManageSthana() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [templeData, setTempleData] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<'sthan-info' | 'architecture-view' | 'sthana-details'>('sthan-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { language } = useLanguage();
  const langCode = getLangCode(language);

  const stepIds = ['sthan-info', 'architecture-view', 'sthana-details'];

  const fetchTemple = async () => {
    if (!id) return;
    try {
      const snap = await getDoc(doc(db, "temples", id));
      if (snap.exists()) {
        setTempleData(snap.data());
      }
    } catch (e) {
      console.error("Failed to load sthana for manager:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemple();
  }, [id]);

  const handleMarkAsReady = async () => {
    if (!id) return;
    try {
      setIsSubmitting(true);
      const ref = doc(db, "temples", id);
      await updateDoc(ref, {
        status: "COMPLETE",
        reviewStatus: "PENDING",
        updatedAt: Timestamp.now()
      });
      toast({ title: "Submitted for Review", description: "The admin has been notified." });
      fetchTemple();
    } catch (error) {
       console.error("Error submitting:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveComment = async (commentIndex: number) => {
    if (!id || !templeData.reviewComments) return;
    try {
      const updatedComments = [...templeData.reviewComments];
      updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        status: "RESOLVED"
      };
      
      const ref = doc(db, "temples", id);
      await updateDoc(ref, {
        reviewComments: updatedComments,
        updatedAt: Timestamp.now()
      });
      
      fetchTemple();
      toast({ title: "Comment Resolved", description: "Feedback marked as addressed." });
    } catch (error) {
      console.error("Error resolving comment:", error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!templeData) {
    return (
      <AdminLayout>
        <div className="p-10 text-center">
          <h2 className="text-xl font-bold">Sthana Not Found</h2>
          <Button className="mt-4" onClick={() => navigate("/admin/sthana-directory")}>
            Return to Directory
          </Button>
        </div>
      </AdminLayout>
    );
  }

  // Determine architecture status mapping
  const hasArchitecture = templeData.hasArchitecture !== undefined
    ? templeData.hasArchitecture
    : (templeData.isStandalone !== undefined ? !templeData.isStandalone : (!!templeData.architectureImage || !!templeData.architectureImages?.length));

  const hasComments = templeData.reviewComments && templeData.reviewComments.filter((c: any) => c.status === 'OPEN').length > 0;



  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col hide-child-headers font-[Inter]">

        {/* Unified Process Header - Integrated and Scrollable */}
        <div className="bg-white border-b border-slate-100 transition-all duration-300 mb-8 rounded-[32px] shadow-sm">
            <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin/sthana-directory")}
              className="p-0 hover:bg-transparent text-slate-400 hover:text-slate-800"
            >
              <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                <ArrowLeft className="w-4 h-4" />
              </div>
              <span className="font-bold hidden sm:inline text-[10px] uppercase tracking-widest">Directory</span>
            </Button>

            <div className="h-6 w-px bg-slate-100" />

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                {getTranslatedValue(templeData.name, langCode)}
                {hasArchitecture ? (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
                    Architecture
                  </span>
                ) : (
                  <span className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100">
                    Standalone
                  </span>
                )}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">


             {/* Step Navigation */}
            <div className="hidden md:flex items-center gap-10 px-4 py-1">
              {[
                { id: 'sthan-info', label: 'Info' },
                { id: 'architecture-view', label: 'Architecture' },
                { id: 'sthana-details', label: 'Details' },
              ].map((step, index, array) => {
                const currentIndex = stepIds.indexOf(activeStep);
                const isActive = activeStep === step.id;
                const isCompleted = stepIds.indexOf(step.id) < currentIndex;

                return (
                  <div key={step.id} className="flex items-center gap-3">
                    <button
                      onClick={() => setActiveStep(step.id as any)}
                      className={cn(
                        "group relative flex h-7 w-7 items-center justify-center rounded-full transition-all duration-700 ease-out",
                        isCompleted && "bg-blue-50 text-blue-600",
                        isActive && "bg-blue-900 text-white shadow-[0_0_15px_-5px_rgba(30,58,138,0.4)]",
                        !isActive && !isCompleted && "bg-slate-50 text-slate-300"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-3 w-3" strokeWidth={4} />
                      ) : (
                        <span className="text-[10px] font-black tabular-nums">{index + 1}</span>
                      )}
                    </button>
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-[0.25em] transition-colors",
                      isActive ? "text-blue-900" : "text-slate-300"
                    )}>
                      {step.label}
                    </span>
                    {index < array.length - 1 && (
                      <div className="h-[1px] w-8 bg-slate-100 mx-2" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
            </div>

            {/* Integrated Progress Line */}
            <div className="bg-slate-50 h-[1.5px] w-full relative">
                <div
                  className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                  style={{
                    width: `${((stepIds.indexOf(activeStep) + 1) / stepIds.length) * 100}%`
                  }}
                />
            </div>
        </div>

        {/* Content Area - Seamless Workspace */}
        <div className="flex-1 overflow-visible scroll-smooth bg-white">
          <div className="w-full">
            {/* Review Changes Banner */}
            {templeData.reviewStatus === "CHANGES_REQUIRED" && (
              <div className="bg-amber-50 border-b border-amber-100 px-12 py-6 flex items-start gap-6 animate-in slide-in-from-top duration-700">
                <div className="p-3 bg-white rounded-2xl shadow-sm border border-amber-100">
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                </div>
                <div className="flex-1">
                   <h3 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1 flex items-center gap-2">
                     <Clock className="w-4 h-4" /> Changes Requested by Admin
                   </h3>
                   <p className="text-xs text-amber-700 font-medium leading-relaxed">
                     Please review the comments below and update the sthana data. Once resolved, mark them as fixed and re-submit for review.
                   </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
              {/* Left Column: Form Content (8/12 or 12/12) */}
              <div className={cn(
                "space-y-20 p-12 lg:p-16",
                hasComments ? "lg:col-span-8 border-r border-slate-50" : "lg:col-span-12"
              )}>
                <div className="transition-all duration-700 delay-100 opacity-100 translate-y-0">
                  <TempleArchitectureAdmin
                    initialStep={activeStep}
                    isEmbedded={true}
                    onStepChange={(step) => setActiveStep(step as any)}
                  />
                </div>
              </div>

              {/* Right Column: Sidebar Tools (Only if comments exist) */}
              {hasComments && (
                <div className="lg:col-span-4 hidden lg:block bg-slate-50/[0.02]">
                  <div className="sticky top-20 transition-all p-12 lg:p-16 space-y-12">
                     {/* Comments Section */}
                     <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                            <MessageSquare className="w-3.5 h-3.5" /> Review Feedback
                          </h3>
                        </div>
                        <div className="space-y-4">
                          {templeData.reviewComments.filter((c: any) => c.status === 'OPEN').map((comment: any, idx: number) => (
                            <div key={idx} className="p-5 rounded-2xl border bg-white border-slate-100 shadow-sm transition-all duration-500 relative overflow-hidden">
                              <div className="flex items-start justify-between gap-4">
                                <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
                                  {comment.comment}
                                </p>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleResolveComment(idx)}
                                  className="h-8 w-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 shrink-0"
                                  title="Mark as Resolved"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <div className="mt-3 flex items-center gap-2">
                                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Admin Note • {comment.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
