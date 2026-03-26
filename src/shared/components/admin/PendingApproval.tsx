import React from "react";
import { useAuth } from "@/auth/AuthContext";
import { Button } from "@/shared/components/ui/button";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Eye,
  ArrowRight
} from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface PendingItem {
  id: string;
  title: string;
  type: string;
  submittedBy: string;
  submittedAt: string;
  status: 'PENDING' | 'CHANGES_REQUIRED';
}

interface PendingApprovalProps {
  items: PendingItem[];
  onReview: (id: string) => void;
  isLoading?: boolean;
}

export default function PendingApproval({ items, onReview, isLoading }: PendingApprovalProps) {
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-pulse">
        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full mb-4" />
        <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded mb-2" />
        <div className="h-3 w-48 bg-gray-50 dark:bg-gray-900 rounded" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50/50 dark:bg-gray-950/50 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
        <div className="w-16 h-16 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 italic">All caught up!</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">No pending approval requests at the moment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-start gap-4">
            <div className={cn(
              "p-3 rounded-xl shrink-0",
              item.status === 'CHANGES_REQUIRED' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : "bg-blue-50 dark:bg-blue-900/20 text-blue-600"
            )}>
              {item.status === 'CHANGES_REQUIRED' ? <AlertCircle className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">{item.type}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">v1.2</span>
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">{item.title}</h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
                Submitted by <span className="font-bold text-gray-700 dark:text-gray-300">{item.submittedBy}</span> • {item.submittedAt}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Button 
              variant="outline" 
              className="rounded-xl border-gray-200 dark:border-gray-800 h-11 px-6 font-black text-xs uppercase tracking-widest text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => onReview(item.id)}
            >
              Details
            </Button>
            <Button 
              className="bg-[#0f3c6e] hover:bg-[#0f2c4e] text-white font-black rounded-xl h-11 px-6 gap-2 shadow-lg shadow-[#0f3c6e]/20"
              onClick={() => onReview(item.id)}
            >
              Review <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
