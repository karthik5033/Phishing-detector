"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Scan, Fingerprint, Database, Binary, ShieldX, Check, ChevronRight } from "lucide-react";
import { useNeuralController } from "./feature.controller";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HIGH-FIDELITY PREMIUM NEURAL DETECTION
 * Structural identity verification with large scale integrated layout.
 */
export default function NeuralDetectionPage() {
  const { targetId, setTargetId, analysis, loading, runScan } = useNeuralController();

  useEffect(() => {
    // Handle deep-linking from extension
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlParam = params.get("url");
      if (urlParam) {
        setTargetId(urlParam);
        runScan(urlParam);
        return;
      }
    }
    runScan(targetId);
  }, []);

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-6 md:px-12 lg:px-32 selection:bg-emerald-100 selection:text-emerald-900 relative text-slate-900">
      {/* SEAMLESS BACKGROUND PATTERN */}
      <div className="absolute inset-x-0 top-0 h-[800px] pointer-events-none opacity-[0.15] overflow-hidden" 
           style={{ 
             backgroundImage: "radial-gradient(circle, #64748b 1px, transparent 1px)", 
             backgroundSize: "32px 32px" 
           }} />

      <div className="max-w-[1400px] mx-auto space-y-24 relative z-10">
        
        {/* --- PREMIUM HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12 group">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="bg-zinc-100 text-slate-500 border border-zinc-200/50 text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full uppercase">
                 ID_Core_V2
               </span>
               <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                  <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Active_Scan</span>
               </div>
            </div>
            <h1 className="text-7xl font-bold tracking-[-0.04em] text-slate-950 leading-[0.85] max-w-4xl">
              Website <br/>
              <span className="text-slate-400">Authenticity Scanner.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
              Check if a website is real or a phishing clone. We analyze the underlying code structure (DNA) to detect fakes that look visually identical to the original.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-zinc-200/60 transition-all hover:bg-zinc-50 hover:border-zinc-300 font-bold text-sm">
                Blueprint Schema <ChevronRight className="ml-2 size-4" />
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          
          {/* --- SCAN STATUS (LEFT) --- */}
          <div className="lg:col-span-5 space-y-20">
            <div className="flex flex-col items-center text-center gap-12">
                <div className="relative group/dna">
                  <div className="size-48 rounded-full border border-zinc-100 flex items-center justify-center bg-zinc-50/50 shadow-inner group-hover/dna:border-emerald-500/30 transition-all duration-700">
                    <Fingerprint className="size-24 text-slate-900 group-hover/dna:text-emerald-500 transition-colors" />
                  </div>
                  {loading && (
                    <motion.div 
                      className="absolute -inset-4 border-2 border-emerald-500 rounded-full border-t-transparent"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    />
                  )}
                </div>
                
                <div className="space-y-4 w-full">
                   <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.5em]">Enter Website URL</p>
                   <div className="flex gap-4">
                       <input 
                          className="flex-1 min-w-0 text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight tabular-nums bg-transparent border-b-2 border-transparent focus:border-emerald-500 focus:outline-none placeholder:text-slate-200 text-left overflow-hidden text-ellipsis pl-0"
                          value={targetId}
                          onChange={(e) => setTargetId(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && runScan(targetId)}
                          placeholder="example.com"
                       />
                       <Button onClick={() => runScan(targetId)} size="lg" className="rounded-full bg-slate-900 text-white font-bold px-8 hover:bg-slate-800 shrink-0">
                          SCAN
                       </Button>
                   </div>
                   <p className="text-xs text-slate-400 font-medium">Press <kbd className="font-sans px-1 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-xs">Enter</kbd> to analyze structure</p>
                </div>

                <div className="w-full space-y-8 pt-12 border-t border-zinc-100">
                  <div className="flex justify-between items-end">
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Consistency_Index</p>
                    <span className={cn("text-6xl font-bold tabular-nums tracking-tighter", analysis ? "text-slate-950" : "text-slate-200")}>
                      {analysis ? (analysis.confidence * 100).toFixed(0) : "00"}<span className="text-xl text-zinc-200">%</span>
                    </span>
                  </div>
                  <div className="h-4 w-full bg-zinc-100 rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      className={cn(
                        "h-full transition-colors duration-1000",
                        (analysis?.confidence || 0) > 0.75 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : 
                        (analysis?.confidence || 0) > 0.4 ? "bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" : 
                        "bg-rose-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
                      )} 
                      initial={{ width: 0 }}
                      animate={{ width: `${analysis ? analysis.confidence * 100 : 0}%` }}
                      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </div>
            </div>

            <div className="pt-12 border-t border-zinc-100 space-y-6">
               <div className="flex items-center gap-4">
                 <div className="size-10 rounded-xl bg-zinc-50 flex items-center justify-center text-emerald-500">
                   <Binary className="size-5" />
                 </div>
                 <h3 className="font-bold text-xl text-slate-950">Architectural DNA</h3>
               </div>
               <p className="text-slate-500 text-base leading-relaxed font-medium">
                 While surfaces can be spoofed, underlying coding fingerprints are immutable. Neural Detection validates the integrity of the navigation path.
               </p>
            </div>
          </div>

            {/* --- RESULTS FEED (RIGHT) --- */}
          <div className="lg:col-span-7 space-y-10">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 px-1">
               <h2 className="text-[11px] font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-4">
                 <Scan className="size-4 text-emerald-500" />
                 Safety Diagnostics
               </h2>
               <div className="flex items-center gap-2">
                  <div className={cn("size-1.5 rounded-full animate-pulse", loading ? "bg-emerald-500" : "bg-slate-300")} />
                  <span className="text-[10px] font-black text-slate-950 tracking-widest uppercase">{loading ? "ANALYZING..." : "SYSTEM READY"}</span>
               </div>
            </div>
            
            <div className="space-y-px divide-y divide-zinc-100 min-h-[300px]">
               {loading ? (
                   // SKELETON LOADER
                   <div className="space-y-6 pt-4">
                      {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center justify-between gap-6 animate-pulse opacity-60">
                              <div className="flex items-center gap-6 flex-1">
                                  <div className="size-12 rounded-2xl bg-zinc-100" />
                                  <div className="space-y-2 flex-1">
                                      <div className="h-3 w-24 bg-zinc-100 rounded" />
                                      <div className="h-5 w-48 bg-zinc-100 rounded" />
                                  </div>
                              </div>
                              <div className="h-6 w-16 bg-zinc-100 rounded-full" />
                          </div>
                      ))}
                   </div>
               ) : (!analysis || !analysis.signals || analysis.signals.length === 0) ? (
                   // EMPTY STATE
                   // EMPTY STATE
                   <div className="flex flex-col items-center justify-center h-[200px] text-center space-y-5">
                       <div className="size-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                           <Scan className="size-10 text-slate-300" />
                       </div>
                       <div className="space-y-1">
                           <h4 className="font-black text-lg text-slate-900 tracking-tight">Ready to Scan</h4>
                           <p className="text-sm text-slate-500 max-w-[280px] mx-auto font-medium leading-relaxed">
                             Enter a URL on the left to begin structural forensic analysis.
                           </p>
                       </div>
                   </div>
               ) : (
                   // RESULTS
                  <AnimatePresence mode="popLayout" initial={false}>
                    {analysis.signals.map((signal: any, i: number) => (
                      <motion.div 
                        key={i}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="group py-4 first:pt-0"
                      >
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                          <div className="flex items-center gap-6">
                             <div className={cn(
                               "size-12 rounded-2xl flex items-center justify-center shrink-0 border-2 transition-all duration-500",
                               signal.status === "VALID" || signal.status === "DETECTED" || signal.status === "ABSENT"
                                 ? "bg-emerald-100 border-emerald-200 text-emerald-700" 
                                 : "bg-rose-100 border-rose-200 text-rose-700"
                             )}>
                               {signal.status === "VALID" || (signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT") ? <Check className="size-6 stroke-[3]" /> : <ShieldX className="size-6 stroke-[3]" />}
                             </div>
                             <div className="space-y-1 text-left">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    {
                                      signal.id === "CONNECTION_HANDSHAKE" ? "Server Connection" :
                                      signal.id === "SSL_LAYER" ? "Secure Encryption" :
                                      signal.id === "DOM_LOGIN_NODE" ? "Login Security" :
                                      signal.id.replace(/_/g, " ")
                                    }
                                </p>
                                <h4 className={cn(
                                  "text-xl md:text-2xl font-black tracking-tight leading-none",
                                  (signal.status === "VALID" || (signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT")) ? "text-emerald-600" : "text-rose-600"
                                )}>
                                  { (signal.status === "VALID" || (signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT")) ? "Verified Safe" : "Potential Risk"}
                                </h4>
                                { (signal.status !== "VALID" && !(signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT")) && (
                                  <p className="text-xs text-rose-500 font-medium mt-1">
                                    {
                                      signal.id === "CONNECTION_HANDSHAKE" ? (signal.status === "UNREACHABLE" ? "Target server is unreachable." : "Failed to establish handshake.") :
                                      signal.id === "SSL_LAYER" ? "Insecure connection detected (No SSL)." :
                                      signal.id === "DOM_LOGIN_NODE" ? "Found password inputs on a suspicious layout." :
                                      signal.id === "DNS_RESOLUTION" ? "Domain name could not be resolved." :
                                      "Unexpected structural anomaly detected."
                                    }
                                  </p>
                                )}
                             </div>
                          </div>
                          <Badge className={cn(
                            "rounded-full px-5 py-1.5 text-[10px] font-black tracking-[0.1em] shadow-sm",
                            (signal.status === "VALID" || (signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT")) 
                              ? "bg-emerald-500 text-white border-none" 
                              : "bg-rose-500 text-white border-none"
                          )}>
                            {(signal.status === "VALID" || (signal.id === "DOM_LOGIN_NODE" && signal.status === "ABSENT")) ? "PASSED" : "FAILED"}
                          </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
               )}
            </div>

            {/* INTEGRATED FOOTER BLOCK */}
            <div className="pt-10 border-t border-zinc-100 flex flex-col md:flex-row items-center gap-12 group/f">
               <div className="size-24 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 shadow-sm group-hover/f:border-slate-900 transition-colors duration-700">
                  <Database className="text-slate-950 size-10" />
               </div>
               <div className="space-y-4">
                 <h3 className="text-xl font-bold text-slate-950 uppercase tracking-tight">Reliability Check</h3>
                 <p className="text-slate-500 text-base leading-relaxed font-medium max-w-2xl">
                    We compare this website against thousands of known legitimate sites to ensure it isn't an impostor trying to steal your data.
                 </p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
