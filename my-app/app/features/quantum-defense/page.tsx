"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Link2, MessageSquare, Mail, Globe, ShieldAlert, Workflow, RefreshCw, CheckCircle2 } from "lucide-react";
import { useQuantumController } from "./feature.controller";
import { QuantumDefense } from "@/components/features/QuantumDefense";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * SIMPLIFIED PREMIUM ATTACK TRACKER
 * Event correlation and chain isolation with seamless integrated layout.
 */
export default function QuantumDefensePage() {
  const { chain, loading, refreshChain } = useQuantumController();

  const getIcon = (channel: string) => {
    switch(channel) {
      case "SMS": return <MessageSquare className="size-8" />;
      case "EMAIL": return <Mail className="size-8" />;
      case "WEB": return <Globe className="size-8" />;
      default: return <Link2 className="size-8" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pt-32 pb-20 px-6 md:px-12 lg:px-24 selection:bg-emerald-100 selection:text-emerald-900 relative text-slate-900 font-sans">
      
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.4]" 
           style={{ 
             backgroundImage: "radial-gradient(#cbd5e1 1.5px, transparent 1.5px)", 
             backgroundSize: "40px 40px" 
           }} />

      <div className="max-w-[1400px] mx-auto space-y-20 relative z-10">
        
        {/* --- HEADER --- */}
        <div className="max-w-4xl space-y-6">
            <div className="flex items-center gap-3">
               <span className="bg-white text-slate-500 border border-slate-200 text-xs font-bold tracking-[0.2em] px-3 py-1 rounded-md uppercase shadow-sm">
                 Sentinel Core
               </span>
               <div className="flex items-center gap-2 bg-emerald-100/50 px-3 py-1 rounded-md border border-emerald-200/50">
                  <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">Active Protection</span>
               </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tight text-slate-900 leading-[0.9]">
              Quantum <br/>
              <span className="text-slate-400">Defense.</span>
            </h1>
            <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
              Our engine correlates isolated events across SMS, Email, and Web to identify and block sophisticated multi-stage attacks.
            </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* --- LEFT COLUMN: TRACKER & STATUS (STICKY) --- */}
          <div className="lg:col-span-5 sticky top-32 space-y-8">
             <div className="bg-white rounded-3xl p-1 shadow-sm border border-slate-200/60">
                <QuantumDefense />
             </div>
             
             {/* QUICK ACTION */}
             <Button 
              size="lg"
              variant="outline" 
              onClick={refreshChain}
              disabled={loading}
              className="w-full h-14 rounded-2xl border-2 border-slate-200 font-bold text-slate-600 hover:text-slate-900 hover:border-slate-300 hover:bg-white transition-all active:scale-[0.98] uppercase tracking-wider text-sm bg-slate-50"
            >
              <RefreshCw className={cn("mr-2 size-5", loading && "animate-spin")} />
              Run Simulation
            </Button>
          </div>

          {/* --- RIGHT COLUMN: ATTACK TIMELINE --- */}
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between mb-8 px-2">
               <h2 className="text-sm font-black tracking-[0.2em] text-slate-400 uppercase flex items-center gap-3">
                 <Workflow className="size-5" />
                 Attack Chain Timeline
               </h2>
               <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200">
                  MONITORING ACTIVE
               </Badge>
            </div>
            
            <div className="relative pl-0">
               {/* Timeline Connector Line - Perfectly centered in the gutter */}
               <div className="absolute left-[31px] top-6 bottom-6 w-0.5 bg-slate-200 z-0" />

                 <AnimatePresence mode="popLayout">
                    {loading ? (
                      <div className="space-y-8 pl-20">
                        {[1,2].map(i => (
                          <div key={i} className="flex gap-8 opacity-50">
                             <div className="flex-1 h-32 bg-slate-100 rounded-2xl animate-pulse" />
                          </div>
                        ))}
                      </div>
                    ) : chain.length === 0 ? (
                      <div className="ml-12 py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="size-16 rounded-xl bg-emerald-50 mx-auto flex items-center justify-center text-emerald-600">
                           <CheckCircle2 className="size-8" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-bold text-slate-900">All Clear</h4>
                          <p className="text-sm text-slate-500 font-medium">No active correlation chains found.</p>
                        </div>
                      </div>
                    ) : (
                      chain.map((step, i) => (
                        <motion.div 
                           key={step.id}
                           layout
                           initial={{ opacity: 0, x: -20 }}
                           animate={{ opacity: 1, x: 0 }}
                           transition={{ duration: 0.3, delay: i * 0.1 }}
                           className="relative mb-8 last:mb-0 group pl-20"
                        >
                           {/* TIMELINE NODE */}
                           <div className={cn(
                             "absolute left-[8px] top-0 size-12 rounded-xl flex items-center justify-center shadow-md border-2 z-10 bg-white transition-all group-hover:scale-110",
                             step.status === "BLOCKED" ? "border-slate-800 text-slate-800" : "border-emerald-500 text-emerald-500"
                           )}>
                              {getIcon(step.channel)}
                           </div>
                        
                           {/* CONTENT CARD */}
                           <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group-hover:border-emerald-500/30">
                              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                                <div className="flex items-center gap-2">
                                   <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                      {step.timestamp}
                                   </span>
                                   <span className="text-[10px] font-extrabold tracking-widest uppercase text-slate-500">{step.channel} LAYER</span>
                                </div>
                                <Badge className={cn(
                                  "rounded-md px-2 py-0.5 text-[10px] font-black tracking-wider uppercase border shadow-none",
                                  step.status === "BLOCKED" ? "bg-slate-800 text-white border-slate-800" : "bg-emerald-50 text-emerald-700 border-emerald-200"
                                )}>
                                  {step.status === "BLOCKED" ? "BLOCKED" : "DETECTED"}
                                </Badge>
                              </div>
                              
                              <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight">
                                {step.channel === 'WEB' ? 'Malicious Site Navigation' : 
                                 step.channel === 'SMS' ? 'Phishing Payload Delivery' : 
                                 'Suspicious Authentication'}
                              </h3>
                              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                                {step.desc}
                              </p>
                           </div>
                       </motion.div>
                   ))
                 )}
               </AnimatePresence>
            </div>
            
            {/* FOOTER */}
            {chain.length > 0 && !loading && (
                <div className="mt-16 ml-12 p-8 bg-slate-900 rounded-3xl text-white flex items-center gap-8 shadow-2xl shadow-slate-900/20">
                    <ShieldAlert className="size-12 text-emerald-400 shrink-0" />
                    <div>
                        <h4 className="text-2xl font-bold mb-1">Attack Chain Neutralized</h4>
                        <p className="text-slate-400 font-medium">Quantum Defense successfully isolated this multi-vector attempt.</p>
                    </div>
                </div>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
