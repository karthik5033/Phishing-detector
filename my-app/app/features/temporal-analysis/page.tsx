"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Timer, Zap, AlertTriangle, Scale, Clock, ChevronRight, ChevronLeft, Shield, Search, Terminal, Activity, Lock } from "lucide-react";
import { useTemporalController } from "./feature.controller";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HIGH-FIDELITY PREMIUM TEMPORAL ANALYSIS
 * "Analyst-Grade" overhaul: Terminal-style input, Visual Gauge, Timeline Results.
 */
export default function TemporalAnalysisPage() {
  const { text, setText, analysis, loading, runAnalysis, history, isLive, selectedIndex, selectHistoryItem, goToPrevious, goToNext, canGoPrevious, canGoNext } = useTemporalController();
  const [isFocused, setIsFocused] = useState(false);

  // Auto-execute analysis on mount if no analysis is present (but text is)
  useEffect(() => {
    if (text && !analysis && !loading) {
      runAnalysis(text);
    }
  }, []); // Run once on mount

  const riskPercent = analysis ? analysis.riskScore * 100 : 0;
  
  // PRESSURE GAUGE CALCS
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (riskPercent / 100) * circumference;

  return (
    <div className="min-h-screen bg-white pt-24 pb-20 px-6 md:px-12 lg:px-32 selection:bg-emerald-900 selection:text-emerald-50 relative text-slate-900 font-sans">
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
                 Module_T-Sync
               </span>
               <div className={cn(
                 "flex items-center gap-1.5 px-2 py-0.5 rounded-full border",
                 isLive 
                   ? "bg-rose-50 border-rose-100/50" 
                   : "bg-emerald-50 border-emerald-100/50"
               )}>
                  <div className={cn(
                    "size-1 rounded-full animate-pulse",
                    isLive ? "bg-rose-500" : "bg-emerald-500"
                  )} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-widest",
                    isLive ? "text-rose-600" : "text-emerald-600"
                  )}>
                    {isLive ? "LIVE_INTERCEPT" : "Demo_Mode"}
                  </span>
               </div>
            </div>
            <h1 className="text-7xl font-bold tracking-[-0.03em] text-slate-950 leading-[0.9] max-w-4xl">
              Temporal pressure <br/>
              <span className="text-slate-400">analysis in real-time.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
              We decompose linguistic urgency and psychological triggers as they are computed, providing a window of intentionality.
            </p>
          </div>
          <div className="flex items-center gap-4">
             <Button 
               variant="default" 
               size="lg" 
               className="h-14 px-8 rounded-full bg-rose-500 hover:bg-rose-600 font-bold text-sm gap-2"
               onClick={() => runAnalysis("⚠️ URGENT: Your account has been compromised! Verify your credentials immediately to prevent permanent suspension. You have 5 minutes before access is blocked. Click here NOW to secure your account.")}
             >
                <Zap className="size-4" /> Simulate Intercept
             </Button>
             <Button variant="outline" size="lg" className="h-14 px-8 rounded-full border-zinc-200/60 transition-all hover:bg-zinc-50 hover:border-zinc-300 font-bold text-sm gap-2">
                <Terminal className="size-4" /> View Schema
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          
          {/* --- LEFT COLUMN: TERMINAL & ANALYTICS --- */}
          <div className="lg:col-span-5 space-y-16">
            
            {/* TERMINAL INPUT */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Secure_Console_Input</p>
                   <div className="flex items-center gap-2">
                      <div className={cn("size-1.5 rounded-full transition-colors duration-300", isFocused ? "bg-emerald-500 shadow-md shadow-emerald-500/50" : "bg-zinc-300")} />
                      <span className={cn("text-[9px] font-mono font-bold uppercase transition-colors", isFocused ? "text-emerald-600" : "text-zinc-300")}>
                        {isFocused ? "LINKED" : "IDLE"}
                      </span>
                   </div>
                </div>
                
                <div className={cn(
                  "relative group rounded-3xl overflow-hidden transition-all duration-500 border-2",
                  isFocused ? "border-zinc-900 shadow-2xl shadow-zinc-900/10 ring-4 ring-zinc-100" : "border-zinc-200 bg-zinc-50"
                )}>
                   {/* Terminal Header */}
                   <div className="h-10 bg-zinc-950 flex items-center px-4 justify-between select-none">
                      <div className="flex items-center gap-2">
                         <div className="size-2.5 rounded-full bg-rose-500/20" />
                         <div className="size-2.5 rounded-full bg-amber-500/20" />
                         <div className="size-2.5 rounded-full bg-emerald-500/20" />
                      </div>
                      <div className="flex items-center gap-2 opacity-30 text-[9px] font-mono text-white">
                         <Lock className="size-3" />
                         <span>SECURE_SHELL_V4</span>
                      </div>
                   </div>

                   <div className="relative bg-zinc-950 p-1">
                      <textarea 
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => { setIsFocused(false); runAnalysis(text); }}
                        spellCheck={false}
                        className="w-full h-64 bg-transparent p-6 text-emerald-500/90 font-mono text-base leading-relaxed focus:bg-zinc-900/50 resize-none transition-all outline-none selection:bg-emerald-500/30 selection:text-emerald-50 placeholder:text-zinc-700"
                        placeholder="// Awaiting input stream..."
                      />
                      {/* Scanline Effect */}
                      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))]" style={{ backgroundSize: "100% 2px, 3px 100%" }} />
                   </div>
                </div>

                <Button 
                  onClick={() => runAnalysis(text)}
                  disabled={loading}
                  className="w-full h-14 bg-slate-950 text-white hover:bg-slate-800 rounded-xl font-bold text-sm shadow-xl shadow-slate-950/10 transition-all active:scale-[0.98] border border-zinc-800"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                       <Activity className="size-4 animate-spin" />
                       Processing Stream...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                       <Terminal className="size-4" />
                       Execute Analysis
                    </span>
                  )}
                </Button>

                {/* HISTORY NAVIGATION */}
                {history.length > 1 && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToPrevious}
                      disabled={!canGoPrevious}
                      className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    >
                      <ChevronLeft className="size-4" />
                      Older
                    </Button>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Intercept
                      </span>
                      <span className="bg-slate-900 text-white text-xs font-bold px-2 py-1 rounded-md tabular-nums">
                        {selectedIndex + 1} / {history.length}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={goToNext}
                      disabled={!canGoNext}
                      className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-900 disabled:opacity-30"
                    >
                      Newer
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                )}
            </div>

            {/* REAL-TIME SYNTAX DECOMPOSITION (Fills Space) */}
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <Search className="size-4 text-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Syntax_Decomposition</h3>
               </div>
               <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 font-mono text-base leading-relaxed text-slate-400 min-h-[120px]">
                  {text.split(/\s+/).map((word, i) => {
                     // Simple heuristic check for demo highlighting
                     const isRisk = ['immediately', 'expire', 'credentials', 'locked', 'permanentely', 'urgent', 'now'].some(t => word.toLowerCase().includes(t));
                     return (
                       <span key={i} className={cn("mr-1.5 inline-block", isRisk ? "text-rose-500 font-bold bg-rose-50 px-1 rounded" : "")}>
                         {word}
                       </span>
                     );
                  })}
                  <span className="inline-block w-2 h-4 bg-emerald-500 animate-pulse align-middle ml-1" />
               </div>
            </div>

            {/* PRESSURE GAUGE BLOCK */}
            <div className="pt-8 border-t border-zinc-100">
               <div className="flex items-center gap-3 mb-8">
                 <Scale className="size-4 text-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Pressure_Gauge</h3>
               </div>
               
               <div className="grid grid-cols-2 gap-8 items-center">
                  {/* Circular Gauge */}
                  <div className="relative size-40 mx-auto">
                     <svg className="size-full -rotate-90 transform" viewBox="0 0 100 100">
                        {/* Background Circle */}
                        <circle
                          className="text-zinc-100"
                          strokeWidth="8"
                          stroke="currentColor"
                          fill="transparent"
                          r={radius}
                          cx="50"
                          cy="50"
                        />
                        {/* Progress Circle */}
                        <motion.circle
                          className={cn("transition-colors duration-1000", riskPercent > 70 ? "text-rose-500" : riskPercent > 40 ? "text-amber-500" : "text-emerald-500")}
                          strokeWidth="8"
                          strokeDasharray={circumference}
                          strokeDashoffset={strokeDashoffset}
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="transparent"
                          r={radius}
                          cx="50"
                          cy="50"
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset }}
                          transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                     </svg>
                     <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-slate-950 tabular-nums tracking-tighter">
                           {riskPercent.toFixed(0)}<span className="text-sm text-zinc-400">%</span>
                        </span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mt-1">Composite</span>
                     </div>
                  </div>

                  {/* Metrics */}
                  <div className="space-y-6">
                     <div className="space-y-1 border-l-2 border-zinc-100 pl-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Density_Factor</p>
                        <p className="text-xl font-bold text-slate-900">
                          {analysis?.triggers.length > 3 ? "Critical" : analysis?.triggers.length > 0 ? "Elevated" : "Nominal"}
                        </p>
                     </div>
                     <div className="space-y-1 border-l-2 border-zinc-100 pl-4">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Total_Triggers</p>
                        <p className="text-xl font-bold text-slate-900 tabular-nums">
                          {analysis?.triggers.length || 0}
                        </p>
                     </div>
                  </div>
               </div>
            </div>

            {/* SESSION TRACE LOG (History) */}
            <div className="pt-8 border-t border-zinc-100">
               <div className="flex items-center gap-3 mb-6">
                 <Clock className="size-4 text-emerald-500" />
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Session_Trace_Log</h3>
               </div>
               <div className="space-y-3">
                 {history.map((entry: any, i: number) => (
                   <div key={i} className="group flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200 transition-all cursor-default">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className={cn(
                           "size-2 rounded-full", 
                           entry.result?.riskScore > 0.75 ? "bg-rose-500" : entry.result?.riskScore > 0.4 ? "bg-amber-500" : "bg-emerald-500"
                         )} />
                         <span className="text-sm font-mono text-slate-500 truncate max-w-[150px]">
                           {entry.text.substring(0, 25)}...
                         </span>
                      </div>
                      <div className="flex items-center gap-3">
                         <span className="text-xs font-black text-slate-900 tabular-nums">
                            {(entry.result?.riskScore * 100).toFixed(0)}%
                         </span>
                         <span className="text-xs font-mono text-zinc-300">
                           {entry.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                         </span>
                      </div>
                   </div>
                 ))}
                 {history.length === 0 && (
                   <p className="text-[10px] text-zinc-300 font-mono text-center py-4">-- NO TRACE DATA --</p>
                 )}
               </div>
            </div>
          </div>

          {/* --- RIGHT COLUMN: TIMELINE & RESULTS --- */}
          <div className="lg:col-span-7 space-y-12">
            
            {/* TIMELINE HEADER */}
            <div className="flex items-center justify-between pb-6 px-1">
               <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-4">
                 <AlertTriangle className="size-4 text-emerald-500" />
                 Trigger_Timeline
               </h3>
            </div>

            {/* STAGGERED FEED */}
            <div className="relative min-h-[400px]">
              {/* Timeline Line */}
              <div className="absolute left-[27px] top-4 bottom-4 w-px bg-slate-100" />

              <div className="space-y-8">
                <AnimatePresence mode="popLayout" initial={false}>
                  {analysis?.triggers.map((trigger: any, i: number) => (
                    <motion.div 
                      key={i}
                      layout
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.4 }}
                      className="relative pl-16 group"
                    >
                       {/* Timeline Dot */}
                       <div className="absolute left-[22px] top-6 size-2.5 rounded-full bg-white border-2 border-zinc-200 group-hover:border-emerald-500 group-hover:scale-125 transition-all z-10" />

                       <div className="bg-white rounded-2xl border border-zinc-100 p-6 shadow-sm hover:shadow-xl hover:border-emerald-500/20 transition-all duration-300 flex items-start justify-between gap-6">
                          <div className="space-y-2">
                             <div className="flex items-center gap-2">
                                 <span className={cn(
                                  "text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider",
                                  trigger.category === "URGENCY" ? "bg-amber-50 text-amber-600" :
                                  trigger.category === "FEAR" ? "bg-rose-50 text-rose-600" :
                                  trigger.category === "AUTHORITY" ? "bg-blue-50 text-blue-600" :
                                  "bg-zinc-100 text-zinc-500"
                                )}>
                                  {trigger.category}
                                </span>
                                <span className="text-[9px] font-mono text-zinc-300">Pos: {trigger.position || i}</span>
                             </div>
                             <h4 className="text-3xl font-bold text-slate-950 group-hover:text-emerald-700 transition-colors leading-tight">
                               "{trigger.word}"
                             </h4>
                          </div>
                          
                          <div className="flex flex-col items-end shrink-0">
                             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Impact</span>
                             <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-slate-900 tabular-nums leading-none">
                                  {trigger.score.toFixed(2)}
                                </span>
                                <span className="text-xs text-zinc-400">λ</span>
                             </div>
                          </div>
                       </div>
                    </motion.div>
                  ))}

                  {analysis?.triggers.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} 
                      animate={{ opacity: 1 }} 
                      className="flex flex-col items-center justify-center p-24 select-none opacity-50"
                    >
                       <div className="size-24 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-6">
                          <Zap className="size-8 text-slate-200" />
                       </div>
                       <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">NO_TRIGGERS_FOUND</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* INTEGRATED VECTOR WARD */}
            <div className="pt-12 space-y-8">
               <div className="flex items-center gap-4 border-b border-zinc-100 pb-6">
                  <div className="size-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500">
                     <Shield className="size-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-950 uppercase tracking-tight">Isolated Vector Ward</h3>
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Quarantined Patterns (Risk &gt; 0.75)</p>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {analysis?.triggers.filter((t: any) => t.score > 0.75).map((t: any, i: number) => (
                    <div key={i} className="group relative overflow-hidden bg-zinc-900 rounded-xl p-5 border border-zinc-800 hover:border-rose-500/50 transition-colors">
                       {/* Background Noise */}
                       <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")" }} />
                       
                       <div className="relative z-10 flex justify-between items-start mb-4">
                          <code className="text-xs font-mono text-rose-500 bg-rose-950/30 px-2 py-0.5 rounded">0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()}</code>
                          <Lock className="size-3 text-zinc-600 group-hover:text-rose-500 transition-colors" />
                       </div>
                       <p className="text-2xl font-bold text-white mb-2">"{t.word}"</p>
                       <p className="text-xs text-zinc-500 font-mono">QUARANTINE_LEVEL::{t.score.toFixed(4)}</p>
                    </div>
                  ))}
                  
                  {(!analysis || analysis.triggers.filter((t: any) => t.score > 0.75).length === 0) && (
                    <div className="col-span-full h-32 flex flex-col items-center justify-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200">
                       <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">Sector_Clear</p>
                    </div>
                  )}
               </div>
            </div>

            {/* INTEGRATED FOOTER BLOCK */}
            <div className="pt-20 border-t border-zinc-100 flex flex-col md:flex-row items-center gap-12 text-center md:text-left opacity-60 hover:opacity-100 transition-opacity">
               <div className="size-16 rounded-2xl bg-zinc-50 flex items-center justify-center shrink-0">
                  <Shield className="text-slate-300 size-6" />
               </div>
               <div className="space-y-2">
                 <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Awareness Protocol</h3>
                 <p className="text-slate-500 text-sm md:text-base leading-relaxed max-w-xl">
                    Temporal analysis restores your cognitive processing window, allowing System 2 reasoning to override instinctive, high-pressure responses.
                 </p>
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
