import React from "react";
import AdminLayout from "@/shared/components/admin/AdminLayout";
import AdminCsvUpload from "./AdminCsvUpload";

import { useNavigate } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AdminCsvImport() {
  const navigate = useNavigate();
  return (
    <AdminLayout>
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 font-bold transition-all px-0 hover:bg-transparent"
        >
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-slate-200 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Dashboard
        </Button>
      </div>
      <AdminCsvUpload />
    </AdminLayout>
  );
}
