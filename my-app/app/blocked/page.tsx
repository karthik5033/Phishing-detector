"use client";

import { useSearchParams } from "next/navigation";
import { ShieldAlert, AlertOctagon, Lock, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function BlockedContent() {
  const searchParams = useSearchParams();
  const domain = searchParams.get("domain") || "Unknown Domain";
  const reason = searchParams.get("reason") || "This website has been flagged as high risk by your administrator.";

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-600 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-900/80 backdrop-blur-xl border border-rose-500/30 rounded-3xl overflow-hidden shadow-2xl shadow-rose-900/50">
        
        {/* Header */}
        <div className="bg-rose-600/10 border-b border-rose-500/20 p-8 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
            <div className="relative z-10 flex flex-col items-center">
                <div className="size-20 rounded-full bg-rose-500/20 flex items-center justify-center mb-4 ring-1 ring-rose-400/30 shadow-[0_0_40px_-10px_rgba(244,63,94,0.5)]">
                    <ShieldAlert className="size-10 text-rose-500" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-white uppercase">Access Denied</h1>
                <p className="text-rose-200 mt-2 font-medium">SecureSentinel Protection</p>
            </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
            <div className="space-y-2 text-center">
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Blocked Domain</p>
                <div className="bg-slate-950/50 rounded-xl p-4 border border-slate-800 text-slate-200 font-mono text-lg break-all">
                    {domain}
                </div>
            </div>

            <div className="space-y-2 text-center">
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Reason</p>
                 <p className="text-rose-200 leading-relaxed font-medium">
                    {reason}
                 </p>
            </div>

            <div className="pt-6">
                <Link 
                    href="/dashboard"
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 text-white font-bold shadow-lg shadow-rose-900/20 hover:shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                >
                    <ArrowLeft className="size-5 group-hover:-translate-x-1 transition-transform" />
                    Return to Safety
                </Link>
                <div className="mt-4 text-center">
                     <p className="text-xs text-slate-600">
                        Think this is a mistake? <span className="text-slate-400 underline cursor-pointer hover:text-white transition-colors">Request Review</span>
                     </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default function BlockedPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>}>
            <BlockedContent />
        </Suspense>
    );
}
