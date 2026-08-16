"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Globe, Users, Zap, ShieldCheck, Share2, Lock, ArrowUpRight, Activity, ChevronRight, BarChart3 } from "lucide-react";
import { useMeshController } from "./feature.controller";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * HIGH-FIDELITY PREMIUM SENTINEL MESH
 * Decentralized threat intelligence with seamless integrated layout.
 */
export default function SentinelMeshPage() {
  const { signals, stats, isSharingEnabled, loading, toggleSharing } = useMeshController();

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
                 Mesh_Node_v0.9
               </span>
               <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100/50">
                  <div className="size-1 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Collective_Sync</span>
               </div>
            </div>
            <h1 className="text-7xl font-bold tracking-[-0.04em] text-slate-950 leading-[0.85] max-w-4xl">
              Collective threat <br/>
              <span className="text-slate-400">intelligence.</span>
            </h1>
            <p className="text-slate-500 text-lg max-w-2xl leading-relaxed font-medium">
              We harden the ecosystem against emerging vectors by sharing anonymized signals across the decentralized mesh.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-zinc-50 p-2 rounded-full border border-zinc-100/50 shadow-sm">
             <span className="text-[10px] font-black text-slate-300 px-6 uppercase tracking-[0.2em]">Privacy_Gateway</span>
             <Button 
              size="lg"
              onClick={toggleSharing}
              className={cn(
                "rounded-full px-8 gap-3 h-12 text-xs font-black uppercase transition-all shadow-lg active:scale-95 group/btn",
                isSharingEnabled 
                  ? "bg-slate-950 text-white hover:bg-slate-800" 
                  : "bg-white border border-zinc-200 text-slate-400 hover:bg-zinc-50"
              )}
             >
               {isSharingEnabled ? <Share2 className="size-4 group-hover/btn:rotate-12 transition-transform" /> : <Lock className="size-4 group-hover/btn:-rotate-12 transition-transform" />}
               {isSharingEnabled ? "Public" : "Private"}
             </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 items-start">
          
          {/* --- NETWORK STATUS (LEFT) --- */}
          <div className="lg:col-span-5 space-y-20">
            <div className="space-y-12">
                <div className="flex flex-col gap-6">
                   <p className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.5em]">Active_Consensus_Nodes</p>
                   <div className="flex items-end justify-between">
                     <h3 className="text-8xl font-bold tracking-tighter text-slate-950 tabular-nums">
                        {stats?.activeNodes || "--"}
                     </h3>
                     <span className="text-xs font-black text-slate-300 mb-2 uppercase tracking-[0.2em]">Mesh_Nodes</span>
                   </div>
                </div>

                <div className="space-y-6 pt-12 border-t border-zinc-100">
                   <div className="flex justify-between items-end">
                     <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mesh_Purity</p>
                     <span className="text-3xl font-bold text-slate-900 tabular-nums tracking-tighter">98.4<span className="text-sm opacity-20 ml-0.5">%</span></span>
                   </div>
                   <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "98.4%" }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                     />
                   </div>
                </div>

                <div className="flex items-center gap-4 text-emerald-600 bg-emerald-50/50 px-6 py-3 rounded-full border border-emerald-100/50 w-fit">
                   <Activity className="size-4 animate-pulse" />
                   <span className="text-[10px] font-black uppercase tracking-widest">Global Correlation Active</span>
                </div>
            </div>

            <div className="pt-12 border-t border-zinc-100 space-y-8 group">
               <div className="flex items-center gap-5">
                 <div className="size-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shadow-sm group-hover:bg-rose-50 transition-colors duration-500">
                   <Zap className="text-rose-500 size-7" />
                 </div>
                 <h3 className="font-bold text-2xl text-slate-950 tracking-tight leading-none uppercase">Threat_Drop_Rate</h3>
               </div>
               <div className="space-y-2">
                  <p className="text-6xl font-bold text-slate-950 tracking-tighter tabular-nums leading-none">{stats?.totalBlockedToday || "--"}</p>
                  <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em]">Injections_Neutralized</p>
               </div>
            </div>
          </div>

          {/* --- RESULTS FEED (RIGHT) --- */}
          <div className="lg:col-span-12 xl:col-span-7 space-y-16">
            <div className="flex items-center justify-between pb-6 border-b border-zinc-100 px-1">
               <h2 className="text-[11px] font-black tracking-[0.3em] text-slate-800 uppercase flex items-center gap-4">
                 <Users className="size-4 text-emerald-500" />
                 Anonymized_Intelligence_Feed
               </h2>
               <div className="flex items-center gap-2">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black text-slate-950 tracking-widest uppercase">BROADCAST_READY</span>
               </div>
            </div>
            
            <div className="space-y-px divide-y divide-zinc-100 min-h-[400px]">
              <AnimatePresence mode="popLayout" initial={false}>
                {signals.map((sig, i) => (
                  <motion.div 
                    key={sig.id}
                    layout={true}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group py-8 first:pt-0"
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-8">
                         <div className="size-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-all duration-500 group-hover:scale-110">
                            <span className="text-[10px] font-black uppercase text-zinc-300 group-hover:text-white transition-colors">{sig.region.split('-')[0]}</span>
                         </div>
                         <div className="space-y-2 text-left">
                            <h4 className="text-3xl font-bold text-slate-950 tracking-tight group-hover:text-emerald-600 transition-colors flex items-center gap-4">
                              {sig.threat}
                              <ArrowUpRight className="size-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                            </h4>
                            <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-[0.2em] font-mono">{sig.source} • {sig.time}</p>
                         </div>
                      </div>
                      <Badge className="bg-white text-slate-950 border border-zinc-200 text-[10px] font-black uppercase rounded-full px-6 py-2 group-hover:bg-emerald-500 group-hover:text-white group-hover:border-emerald-600 transition-all duration-500 shadow-sm">
                        Verified
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* INTEGRATED FOOTER BLOCK */}
            <div className="pt-20 border-t border-zinc-100 flex flex-col md:flex-row items-center gap-12 group/f">
               <div className="size-24 rounded-full border border-zinc-200 flex items-center justify-center shrink-0 shadow-sm group-hover/f:border-emerald-500/50 transition-all duration-700">
                  <BarChart3 className="text-slate-950 size-10 group-hover/f:text-emerald-500 transition-colors" />
               </div>
               <div className="space-y-4">
                 <h3 className="text-xl font-bold text-slate-950 uppercase tracking-tight leading-none">Statistical Hardening</h3>
                 <p className="text-slate-500 text-base leading-relaxed font-medium max-w-2xl">
                    By aggregating signals across millions of nodes, we create a mathematical shield that predicts and prevents emerging zero-day vectors before they manifest.
                 </p>
               </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
