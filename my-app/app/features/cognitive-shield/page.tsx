"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Brain, ShieldAlert, Eye, EyeOff, Wind, Waves, Coffee, ChevronRight, Zap } from "lucide-react";
import { useCognitiveController } from "./feature.controller";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HIGH-FIDELITY PREMIUM COGNITIVE SHIELD
 * Adaptive UI simplification with seamless integrated layout.
 */
export default function CognitiveShieldPage() {
  const { isShieldActive, stressData, suppressedElements, loading, toggleShield } = useCognitiveController();

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
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <span className="bg-zinc-100 text-slate-500 border border-zinc-200/50 text-[10px] font-black tracking-[0.2em] px-3 py-1 rounded-full uppercase">
                 Shield_Logic_V4
               </span>
               <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                  <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Buffer_Active</span>
               </div>
            </div>
            <h1 className="text-7xl font-bold tracking-[-0.04em] text-slate-950 leading-[0.85] max-w-4xl">
              Focus Mode <br/>
              <span className="text-slate-400">for your browser.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
              Cognitive Shield acts like noise-canceling headphones for the web. We automatically hide distracting ads, fake countdown timers, and panic-inducing popups so you can browse safely.
            </p>
          </div>
          <Button 
            size="lg"
            onClick={toggleShield}
            className={cn(
              "rounded-full px-12 gap-5 h-20 text-lg font-bold transition-all shadow-2xl active:scale-95 group/btn",
              isShieldActive 
                ? "bg-slate-950 text-white hover:bg-slate-800 shadow-slate-950/20" 
                : "bg-white border-2 border-zinc-200 text-slate-950 hover:bg-zinc-50"
            )}
          >
            {isShieldActive ? <EyeOff className="size-7 group-hover/btn:rotate-12 transition-transform" /> : <Eye className="size-7 group-hover/btn:-rotate-12 transition-transform" />}
            {isShieldActive ? "Shield Active" : "Activate Shield"}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          
          {/* --- STRESS MONITOR (LEFT) --- */}
          <div className="lg:col-span-5 space-y-20">
            <div className="space-y-12">
                <div className="flex flex-col gap-6">
                   <p className="text-sm font-black text-slate-400 uppercase tracking-[0.4em]">Cognitive_Load_Index</p>
                   <div className="flex items-end justify-between">
                     <h3 className={cn(
                       "text-8xl font-bold tracking-tighter tabular-nums transition-all duration-700",
                       isShieldActive ? "text-emerald-500" : "text-slate-950"
                     )}>
                       {loading || !stressData ? "--" : (stressData.level * 100).toFixed(0)}<span className="text-2xl opacity-10 ml-1">%</span>
                     </h3>
                     <Badge className={cn(
                       "rounded-full px-5 py-2 text-[10px] font-black tracking-[0.2em] shadow-sm mb-2 transition-all duration-700",
                       isShieldActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-zinc-50 text-zinc-400 border border-zinc-200"
                     )}>
                        {loading || !stressData ? "SCANNING" : stressData.status}
                     </Badge>
                   </div>
                </div>

                <div className="space-y-6">
                   <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                     <motion.div 
                        className={cn("h-full transition-colors duration-700", isShieldActive ? "bg-emerald-500" : "bg-slate-950")}
                        initial={{ width: 0 }}
                        animate={{ width: `${(stressData?.level || 0) * 100}%` }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                     />
                   </div>
                   
                   <div className="flex flex-wrap gap-3 pt-6">
                      {stressData?.triggers.map((t: string, i: number) => (
                        <span key={`${t}-${i}`} className="px-4 py-2 rounded-full bg-zinc-50 border border-zinc-100 text-[11px] font-bold text-slate-500 hover:bg-zinc-100 transition-colors">
                           {t}
                        </span>
                      ))}
                   </div>
                </div>
            </div>

            <div className="pt-12 border-t border-zinc-100 space-y-6 group">
               <div className="flex items-center gap-5">
                 <div className="size-12 rounded-2xl bg-zinc-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors duration-500">
                   <Coffee className="text-emerald-500 size-6" />
                 </div>
                 <h3 className="font-bold text-2xl text-slate-950">Focus Optimization</h3>
               </div>
               <p className="text-slate-500 text-xl leading-relaxed font-medium">
                 We optimize for "System 2" thinking by intentionally reducing the visual weight of secondary components during peak processing.
               </p>
            </div>
          </div>

          {/* --- RESULTS FEED (RIGHT) --- */}
          <div className="lg:col-span-7 space-y-16">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-100 px-1">
               <h2 className="text-[11px] font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-4">
                 <Zap className="size-4 text-emerald-500" />
                 Suppression_Manifest
               </h2>
               <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-950 tracking-widest uppercase">STREAM_BUFFERED</span>
               </div>
            </div>
            
            <div className="space-y-px divide-y divide-zinc-100">
              <AnimatePresence mode="popLayout" initial={false}>
                {suppressedElements.map((el, i) => (
                  <motion.div 
                    key={el.id}
                    layout={true}
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ 
                      opacity: isShieldActive ? 0.6 : 1,
                      scale: 1,
                      filter: isShieldActive ? "blur(0.5px)" : "none"
                    }}
                    transition={{ duration: 0.6, ease: "circOut" }}
                    className="group py-8 first:pt-0"
                  >
                    <div className="relative w-full overflow-hidden rounded-2xl transition-all duration-500">
                      {/* SHIELD INACTIVE: SHOW NOISE */}
                      {!isShieldActive && (
                        <div className={cn(
                          "p-5 flex items-center justify-between gap-6 border-2 transition-all",
                          el.id === "POPUP_ADS" ? "bg-rose-50 border-rose-200" :
                          el.id === "FOMO_TIMERS" ? "bg-amber-50 border-amber-200" :
                          "bg-white border-zinc-100"
                        )}>
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "size-10 rounded-full flex items-center justify-center text-white shadow-lg animate-pulse",
                                el.id === "POPUP_ADS" ? "bg-rose-500" :
                                el.id === "FOMO_TIMERS" ? "bg-amber-500" :
                                "bg-slate-950"
                              )}>
                                 {el.id === "POPUP_ADS" ? <Zap className="size-5" /> : <ShieldAlert className="size-5" />}
                              </div>
                              <div>
                                 <h4 className={cn(
                                   "text-lg font-black uppercase tracking-tight",
                                   el.id === "POPUP_ADS" ? "text-rose-600" :
                                   el.id === "FOMO_TIMERS" ? "text-amber-600" :
                                   "text-slate-900"
                                 )}>
                                   {el.id === "POPUP_ADS" ? "CLAIM PRIZE NOW!!!" : 
                                    el.id === "FOMO_TIMERS" ? "OFFER EXPIRES IN 05:00" :
                                    el.desc}
                                 </h4>
                                 <p className="text-[10px] font-bold opacity-60 mt-0.5 uppercase tracking-widest">
                                   {el.id === "POPUP_ADS" ? "Ad_Network_v3" : "Cognitive_Stressor"}
                                 </p>
                              </div>
                           </div>
                           <Button size="sm" variant="destructive" className="h-8 text-xs font-bold uppercase tracking-widest shrink-0 px-3">
                              {el.id === "POPUP_ADS" ? "CLICK HERE" : "View"}
                           </Button>
                        </div>
                      )}

                      {/* SHIELD ACTIVE: SHOW CALM UI */}
                      {isShieldActive && (
                         <div className="p-5 flex items-center justify-between gap-6 bg-zinc-50/50 border border-zinc-100/50 grayscale opacity-60">
                            <div className="flex items-center gap-4">
                               <div className="size-10 rounded-2xl bg-zinc-200 flex items-center justify-center text-zinc-400">
                                  <Wind className="size-5" />
                               </div>
                               <div>
                                  <h4 className="text-lg font-bold text-zinc-400 line-through decoration-zinc-300">
                                    {el.desc}
                                  </h4>
                                  <p className="text-[10px] font-bold text-emerald-500 mt-0.5 uppercase tracking-widest flex items-center gap-1">
                                    <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                                    {el.id === "POPUP_ADS" ? "Advertisement Blocked" : 
                                     el.id === "FOMO_TIMERS" ? "Pressure Tactic Blocked" : 
                                     "Content Suppressed"}
                                  </p>
                               </div>
                            </div>
                         </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* ADAPTIVE FOOTER */}
            <div className="pt-20 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-12 group/f">
               <div className="flex items-center gap-8">
                 <div className="size-20 rounded-full border border-zinc-200 flex items-center justify-center group-hover/f:border-emerald-500/50 transition-colors duration-700">
                    <Waves className="size-10 text-slate-950 group-hover/f:text-emerald-500 transition-colors" />
                 </div>
                 <div className="space-y-2">
                   <span className="text-xl font-black text-slate-950 tracking-tight uppercase">UI_Smoothing_Active</span>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Temporal Noise Cancellation</p>
                 </div>
               </div>
               <div className="flex gap-4">
                  {[1,2,3,4,5,6,7].map(i => (
                    <motion.div 
                     key={i}
                     animate={{ height: [12, 48, 12], opacity: [0.3, 1, 0.3] }}
                     transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                     className="w-2 rounded-full bg-emerald-300"
                    />
                  ))}
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
