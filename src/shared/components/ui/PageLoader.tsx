import { Loader2 } from "lucide-react";

export function PageLoader() {
    return (
        <div className="flex flex-1 min-h-full w-full items-center justify-center bg-[#F8F9FA] py-12">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-[#0f3c6e]" />
                <p className="text-sm font-medium text-slate-500 animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
