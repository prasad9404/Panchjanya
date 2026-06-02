import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import { Button } from "@/shared/components/ui/button";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/auth/firebase";
import { ArrowLeft, Check } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import TempleArchitectureAdmin from "./TempleArchitectureAdmin";
import { useLanguage } from "@/shared/contexts/LanguageContext";
import { getTranslatedValue, getLangCode } from "@/shared/utils/translationUtils";

export default function ArchiveEntryEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [entryData, setEntryData] = useState<any>(null);
  const [activeStep, setActiveStep] = useState<'sthan-info' | 'architecture-view' | 'sthana-details'>('sthan-info');
  
  const { language } = useLanguage();
  const langCode = getLangCode(language);

  const stepIds = ['sthan-info', 'architecture-view', 'sthana-details'];

  const fetchEntry = async () => {
    if (!id) return;
    try {
      const snap = await getDoc(doc(db, "architecture_entries", id));
      if (snap.exists()) {
        setEntryData(snap.data());
      }
    } catch (e) {
      console.error("Failed to load entry:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntry();
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!entryData) {
    return (
      <AdminLayout>
        <div className="p-10 text-center">
          <h2 className="text-xl font-bold">Architecture Entry Not Found</h2>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col hide-child-headers font-[Inter]">
        {/* Unified Process Header */}
        <div className="bg-white border-b border-slate-100 transition-all duration-300 mb-8 rounded-[32px] shadow-sm">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/admin/architectural-archives/${entryData.archiveId}`)}
                className="p-0 hover:bg-transparent text-slate-400 hover:text-slate-800"
              >
                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-3">
                  <ArrowLeft className="w-4 h-4" />
                </div>
                <span className="font-bold hidden sm:inline text-[10px] uppercase tracking-widest">Back to Archive</span>
              </Button>

              <div className="h-6 w-px bg-slate-100" />

              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                  {getTranslatedValue(entryData.title, langCode) || "Unnamed Entry"}
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 px-3 py-1 rounded-full border border-amber-100">
                    Archive Entry
                  </span>
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
                style={{ width: `${((stepIds.indexOf(activeStep) + 1) / stepIds.length) * 100}%` }}
              />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-visible scroll-smooth bg-white">
          <div className="w-full">
            <div className="p-12 lg:p-16">
              <div className="transition-all duration-700 delay-100 opacity-100 translate-y-0">
                <TempleArchitectureAdmin
                  initialStep={activeStep}
                  isEmbedded={true}
                  onStepChange={(step) => setActiveStep(step as any)}
                  collection="architecture_entries"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
