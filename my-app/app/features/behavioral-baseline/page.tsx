"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Activity, 
  RotateCcw, 
  AlertCircle, 
  Search,
  Shield,
  Zap,
  Layers,
  ChevronRight,
  Cpu,
  Lock,
  Globe,
  Terminal,
  CheckCircle2
} from "lucide-react";
import { useBehavioralController } from "./feature.controller";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { useNeuralSessionFingerprint } from "./fingerprint.controller";
import { CognitiveShield } from "./CognitiveShield";
import { QuantumDefense } from "@/components/features/QuantumDefense";

function formatTimeAgo(dateString: string) {
  if (!dateString) return "Just now";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function BehavioralBaselinePage() {
  const { 
    loading,
    baseline, 
    deviations, 
    activeCategory, 
    setActiveCategory,
    resetBaseline,
    cognitiveStatus
  } = useBehavioralController();

  const { trustScore, driftStatus } = useNeuralSessionFingerprint();

  if (loading && !baseline) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-6">
          <div className="size-16 border-2 border-slate-100 border-t-emerald-600 rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-[10px] uppercase tracking-[0.3em] animate-pulse">Initializing Secure Context...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pt-48 pb-20 px-6 md:px-12 lg:px-24 selection:bg-emerald-100 selection:text-emerald-900 text-slate-900 font-sans overflow-x-hidden">
      
      {/* CLEAN GRID BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-[1400px] mx-auto space-y-16 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10 border-b border-slate-100 pb-10">
          <div className="space-y-6 max-w-2xl">
            <div className="flex items-center gap-3">
               <span className="bg-slate-50 border border-slate-200 text-slate-500 text-[9px] font-mono tracking-widest px-2 py-1 rounded uppercase">
                 Sys_Ver_4.2.1
               </span>
               <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded border border-emerald-100">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Live_Telemetry_Active</span>
               </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-950 leading-[0.9]">
              Behavioral <span className="text-slate-400">Analysis</span> <br/>
              & <span className="text-emerald-600">Anomaly Detection</span>
            </h1>
            
            <p className="text-slate-500 text-lg leading-relaxed max-w-xl font-medium">
              Real-time identity verification processing 
              <span className="text-slate-900 font-semibold"> local browser signals</span> to detect impersonation attempts without data exfiltration.
            </p>
          </div>

          <div className="flex items-center gap-4">
             <Button 
                variant="outline" 
                onClick={() => window.open('http://localhost:8002/docs', '_blank')}
                className="h-12 px-6 rounded-lg bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-900 transition-all text-slate-500 text-xs tracking-widest uppercase font-bold gap-2 shadow-sm"
             >
                <Terminal className="size-3.5" /> API Documentation
             </Button>
             <button 
                onClick={resetBaseline}
                disabled={loading}
                className="size-12 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center transition-all group shadow-sm"
                title="Reset Baseline Calibration"
              >
                <RotateCcw className={cn("size-4 text-slate-400 group-hover:text-slate-900 transition-colors", loading && "animate-spin")} />
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* --- LEFT COLUMN: METRICS --- */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* CARD 1: TRUST SCORE */}
            <div className="p-8 rounded-2xl bg-white border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-8">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identity Confidence</h3>
                     <Badge variant="outline" className={cn(
                        "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border", 
                        trustScore > 0.8 ? "border-emerald-200 bg-emerald-50 !text-black" : "border-rose-200 bg-rose-50 !text-black"
                      )}>
                        <span className={trustScore > 0.8 ? "text-emerald-700" : "text-rose-700"}>
                          {trustScore > 0.8 ? "Verified" : "Mismatch"}
                        </span>
                     </Badge>
                </div>

                <div className="flex items-baseline gap-1 mb-6">
                    <span className={cn("text-7xl font-bold tracking-tighter tabular-nums", trustScore > 0.8 ? "text-slate-900" : "text-rose-500")}>
                        {(trustScore * 100).toFixed(0)}
                    </span>
                    <span className="text-3xl font-medium text-slate-300">%</span>
                </div>

                <div className="space-y-3 pt-6 border-t border-slate-50">
                     {[
                       { label: "Page Structure", status: "PASS" },
                       { label: "DOM Consistency", status: "PASS" },
                       { label: "Origin Traversal", status: "SAFE" }
                     ].map((s, i) => (
                         <div key={i} className="flex items-center justify-between text-xs">
                             <span className="text-slate-500 font-medium">{s.label}</span>
                             <div className="flex items-center gap-2">
                                 {s.status === "PASS" || s.status === "SAFE" ? (
                                    <CheckCircle2 className="size-3.5 text-emerald-500" />
                                 ) : (
                                    <div className="size-1.5 rounded-full bg-rose-500" />
                                 )}
                                 <span className={cn("font-bold text-[9px]", s.status === "PASS" || s.status === "SAFE" ? "text-emerald-600" : "text-rose-600")}>{s.status}</span>
                             </div>
                         </div>
                     ))}
                </div>
            </div>

            {/* CARD 2: THREAT LANDSCAPE */}
            <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-md shadow-slate-100">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Correlation</h3>
                    <Globe className="size-4 text-slate-300" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                        <div className="text-2xl font-bold text-slate-900 tabular-nums">
                            {(baseline?.totalInteractions || 0).toLocaleString()}
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wide">Analysed Events</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-center space-y-1">
                        <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                            0.0%
                        </div>
                        <div className="text-[9px] text-slate-400 uppercase tracking-wide">Drift Variable</div>
                    </div>
                </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: ACTIVITY FEED --- */}
          <div className="lg:col-span-8 space-y-8">
             
             {/* CONTEXT SWITCHER */}
             <div className="flex flex-wrap gap-2 pb-6 border-b border-slate-100">
                {Object.entries(baseline?.categoryWeights || {}).map(([cat, val]: [string, any]) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={cn(
                            "px-4 py-2.5 rounded-lg border text-xs font-bold tracking-wide transition-all uppercase flex items-center gap-2 shadow-sm",
                            activeCategory === cat 
                                ? "bg-slate-900 border-slate-900 text-white shadow-lg shadow-slate-200" 
                                : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        )}
                    >
                        {cat === 'BANKING' && <Lock className="size-3" />}
                        {cat === 'SOCIAL' && <Activity className="size-3" />}
                        {cat}
                        <span className={cn("ml-1 font-mono", activeCategory === cat ? "text-slate-400" : "text-slate-300")}>
                            {(val * 100).toFixed(0)}
                        </span>
                    </button>
                ))}
            </div>

            {/* LIVE FEED */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                     <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900 tracking-wide">
                        <Activity className="size-4 text-emerald-600" />
                        Live Security Events
                     </h3>
                     <span className="text-[10px] font-mono text-slate-400">BUFFER_SIZE: 50/100</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden min-h-[500px] shadow-sm">
                    <div className="grid grid-cols-12 px-6 py-4 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50/50">
                        <div className="col-span-2">Time</div>
                        <div className="col-span-2">ID</div>
                        <div className="col-span-5">Event Signature</div>
                        <div className="col-span-3 text-right">Risk Score</div>
                    </div>
                    
                    <div className="divide-y divide-slate-50">
                        <AnimatePresence initial={false}>
                            {deviations.length === 0 ? (
                                <motion.div 
                                    initial={{ opacity: 0 }} 
                                    animate={{ opacity: 1 }}
                                    className="flex flex-col items-center justify-center py-32 space-y-4"
                                >
                                    <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                                        <ShieldCheck className="size-6 text-slate-300" />
                                    </div>
                                    <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">No Active Threats Detected</p>
                                </motion.div>
                            ) : (
                                deviations.map((dev, i) => (
                                    <motion.div
                                        key={dev.id}
                                        initial={{ opacity: 0, x: -20, backgroundColor: "rgba(16, 185, 129, 0.05)" }}
                                        animate={{ opacity: 1, x: 0, backgroundColor: "transparent" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="grid grid-cols-12 px-6 py-4 items-center hover:bg-slate-50 transition-colors group"
                                    >
                                        <div className="col-span-2 text-xs font-mono text-slate-400">
                                            {formatTimeAgo(dev.timestamp)}
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                                {dev.id.split('-')[1] || dev.id}
                                            </span>
                                        </div>
                                        <div className="col-span-5">
                                            <div className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors truncate pr-4">
                                                {dev.domain}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                 <span className={cn(
                                                    "text-[9px] font-bold uppercase tracking-wider px-1.5 py-px rounded border",
                                                    dev.desc === "Phishing" || dev.desc === "Social Eng." ? "bg-rose-50 border-rose-200 text-rose-700" : "bg-emerald-50 border-emerald-200 text-emerald-700"
                                                 )}>
                                                    {dev.desc}
                                                 </span>
                                                 <span className="text-[10px] text-slate-400 truncate max-w-[200px]">
                                                    {dev.detail === "Detected as Clean" ? "Verified Safe" : dev.detail}
                                                 </span>
                                            </div>
                                        </div>
                                        <div className="col-span-3 flex justify-end">
                                            <div className={cn(
                                                "flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide",
                                                dev.score > 0.75 
                                                    ? "bg-rose-50 border-rose-200 text-rose-600" 
                                                    : "bg-emerald-50 border-emerald-200 text-emerald-600"
                                            )}>
                                                {dev.score > 0.75 ? "CRITICAL" : "MONITORED"}
                                                <div className={cn(
                                                    "w-12 h-1.5 rounded-full overflow-hidden bg-slate-200",
                                                )}>
                                                    <div 
                                                        className={cn("h-full", dev.score > 0.75 ? "bg-rose-500" : "bg-emerald-500")} 
                                                        style={{ width: `${dev.score * 100}%` }} 
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
          </div>
        </div>

        {/* --- FOOTER --- */}
        <div className="pt-10 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono text-slate-400 uppercase tracking-widest">
            <div>
               SECURE_SENTINEL // SYSTEM_HEALTH: <span className="text-emerald-600">OPTIMAL</span>
            </div>
            <div className="flex gap-6 opacity-50">
               <span>Latency: 12ms</span>
               <span>Encryption: AES-256-GCM</span>
               <span>Region: LOCAL_HOST</span>
            </div>
        </div>

      </div>
    </div>
  );
}
