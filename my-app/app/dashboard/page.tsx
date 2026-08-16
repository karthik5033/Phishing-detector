"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useSpring, useTransform, useInView } from "framer-motion";
import { ShieldCheck, AlertTriangle, ArrowUpRight, Shield, Activity, Lock, Users, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ActivityChart } from "@/components/dashboard/activity-chart";

import { API_BASE_URL } from "@/lib/constants";

interface DashboardStats {
  kpi: {
    total_scans: number;
    threats_blocked: number;
    critical_blocked: number;
    safety_score: number;
  };
  recent_interventions: Array<{
    domain: string;
    timestamp: string;
    type: string;
    risk: string;
    score: number;
  }>;
  activity_trend: Array<{
    date: string;
    count: number;
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard`);
        if (res.ok) {
           const data = await res.json();
           setStats(data);
        }
      } catch (e) {
        console.error("Dashboard sync failed", e);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Poll every 10s for live updates
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
     return (
        <div className="h-96 flex flex-col items-center justify-center gap-4">
            <div className="size-10 border-2 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest animate-pulse">Synchronizing Telemetry...</p>
        </div>
     );
  }

  // Fallback defaults if stats are null (backend offline)
  const safeStats = stats || {
     kpi: { total_scans: 0, threats_blocked: 0, critical_blocked: 0, safety_score: 0 },
     recent_interventions: [],
     activity_trend: []
  };

  const scoreColor = safeStats.kpi.safety_score > 80 ? "text-emerald-500" : (safeStats.kpi.safety_score > 50 ? "text-amber-500" : "text-rose-500");
  const barColor = safeStats.kpi.safety_score > 80 ? "bg-emerald-500" : (safeStats.kpi.safety_score > 50 ? "bg-amber-500" : "bg-rose-500");

  // DYNAMIC GRAPH LOGIC
  // Map activity_trend (7 days) to SVG coordinate points (0-100 x, 0-50 y)
  // Max count determines Y scale
  const maxCount = Math.max(...safeStats.activity_trend.map(d => d.count), 5); // Avoid div/0, min height 5
  
  const getPoints = () => {
     if (!safeStats.activity_trend || safeStats.activity_trend.length === 0) return "";
     
     const width = 100;
     const height = 50;
     const gap = width / (safeStats.activity_trend.length - 1 || 1);
     
     return safeStats.activity_trend.map((point, i) => {
        const x = i * gap;
        // Invert Y because SVG 0 is top
        const y = height - ((point.count / maxCount) * (height * 0.8)); // Use 80% height for headroom
        return `${x},${y}`;
     }).join(" ");
  };

  // Convert points string to smooth curve command (catmull-rom or simpler bezier)
  // For simplicity here, we use a basic polyline or a simple curved logic if libraries aren't available.
  // We'll trust a standard L command for robust accuracy as requested ("no bluff data").
  const pointsStr = getPoints();
  const pathD = pointsStr ? `M ${pointsStr.replace(/ /g, " L ")}` : "M 0,50 L 100,50";

  // HELPER: Animated Counter Component
  function Counter({ value, className }: { value: number; className?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true });
    const spring = useSpring(0, { bounce: 0, duration: 2000 });
    const display = useTransform(spring, (current) => Math.floor(current).toLocaleString());

    useEffect(() => {
      if (inView) {
        spring.set(value);
      }
    }, [spring, value, inView]);

    return <motion.span ref={ref} className={className}>{display}</motion.span>;
  }
  
  // ANIMATION VARIANTS
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.98 },
    show: { 
        opacity: 1, 
        y: 0, 
        scale: 1,
        transition: { type: "spring", stiffness: 45, damping: 15, mass: 1 } as any
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 font-sans text-slate-900 relative pb-20"
    >
      
      {/* 1. WELCOME MESSAGE */}
      <motion.div variants={cardVariants} className="space-y-1 border-b border-slate-200/60 pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Overview</h1>
        <p className="text-slate-500 max-w-2xl font-medium text-sm">
          System integrity check complete. Real-time monitoring active.
        </p>
      </motion.div>

      {/* 2. KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: SAFETY HEALTH */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.12)" }}
          className="p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between h-56 group relative overflow-hidden"
        >
           {/* Decorative BG Icon */}
           <div className="absolute -top-6 -right-6 p-4 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity duration-500 rotate-12">
              <ShieldCheck className="size-40 text-slate-900" />
           </div>

           <div className="relative z-10 flex items-start justify-between">
              <div>
                 <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider group-hover:text-emerald-600 transition-colors">Safety Index</p>
                 <p className="text-[10px] text-slate-400 font-medium">System Health</p>
              </div>
              <div className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-emerald-500 shadow-[0_2px_8px_-2px_rgba(16,185,129,0.15)] group-hover:scale-105 transition-transform">
                 <ShieldCheck className="size-5" />
              </div>
           </div>
           
           <div className="relative z-10 space-y-5">
              <div className="flex items-baseline gap-1.5">
                 <Counter value={safeStats.kpi.safety_score} className={cn("text-6xl lg:text-7xl font-bold tracking-tighter transition-all duration-500", scoreColor)} />
                 <span className="text-sm font-bold text-slate-300">/ 100</span>
              </div>
              
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                    <span>Vulnerability</span>
                    <span>Secure</span>
                 </div>
                 <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/50">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${safeStats.kpi.safety_score}%` }}
                        transition={{ duration: 1.5, ease: "circOut", delay: 0.2 }}
                        className={cn("h-full rounded-full shadow-[0_0_12px_rgba(0,0,0,0.2)] relative overflow-hidden", barColor)}
                    >
                         {/* Shimmer effect on bar */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full -translate-x-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* CARD 2: TOTAL SCANS */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.12)" }}
          className="p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between h-56 group"
        >
           <div className="flex items-start justify-between">
              <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider group-hover:text-blue-600 transition-colors">Total Scans</p>
                  <div className="flex items-center gap-2 mt-1">
                      <span className="flex size-2 rounded-full bg-blue-500 animate-pulse"></span>
                      <span className="text-[10px] font-medium text-slate-400">Monitoring Active</span>
                  </div>
              </div>
              <div className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover:text-blue-500 transition-colors">
                 <Activity className="size-5" />
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <Counter value={safeStats.kpi.total_scans} className="text-6xl lg:text-7xl font-bold text-slate-900 tracking-tighter" />
           </div>

           <div className="flex items-center justify-between border-t border-slate-50 pt-3">
             <div className="flex -space-x-2.5">
                {[1,2,3].map(i => (
                  <div key={i} className="size-7 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center text-[9px] font-bold text-slate-400 hover:z-10 hover:scale-110 transition-transform">
                     <Users className="size-3.5" />
                  </div>
                ))}
                <div className="size-7 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-[9px] font-bold text-slate-500">
                    +12
                </div>
             </div>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                Global Nodes
                <Globe className="size-3" />
             </p>
           </div>
        </motion.div>

        {/* CARD 3: THREATS BLOCKED */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -4, boxShadow: "0 12px 40px -12px rgba(0,0,0,0.12)" }}
          className="p-6 rounded-2xl border border-slate-200/60 bg-gradient-to-br from-white to-slate-50/20 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col justify-between h-56 group"
        >
           <div className="flex items-start justify-between">
              <div>
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider group-hover:text-rose-600 transition-colors">Threats Zeroed</p>
                  <p className="text-[10px] text-slate-400 font-medium">Auto-mitigation</p>
              </div>
              <div className="size-9 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-500 shadow-sm group-hover:text-rose-500 transition-colors">
                 <Lock className="size-5" />
              </div>
           </div>
           
           <div className="flex items-center gap-4">
              <Counter value={safeStats.kpi.threats_blocked} className="text-6xl lg:text-7xl font-bold text-slate-900 tracking-tighter" />
           </div>
            
           <div className="relative z-10">
              {safeStats.kpi.critical_blocked > 0 ? (
                  <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 shadow-sm w-full">
                    <AlertTriangle className="size-4 fill-rose-200 text-rose-600" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wide leading-none">{safeStats.kpi.critical_blocked} Critical</span>
                        <span className="text-[9px] text-rose-600/80 leading-tight">Requires Attention</span>
                    </div>
                  </div>
              ) : (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm w-full">
                    <ShieldCheck className="size-4 fill-emerald-200 text-emerald-600" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase tracking-wide leading-none">All Nominal</span>
                        <span className="text-[9px] text-emerald-600/80 leading-tight">No actions needed</span>
                    </div>
                </div>
              )}
           </div>
        </motion.div>
      </div>

      {/* 3. CHARTS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         
         {/* ACTIVITY TREND (2 Cols) */}
         <motion.div 
            variants={cardVariants}
            whileHover={{ boxShadow: "0 12px 40px -12px rgba(0,0,0,0.08)" }}
            className="md:col-span-2 p-8 rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] h-[28rem] flex flex-col"
          >
            <div className="mb-6 flex items-center justify-between">
                <div> 
                  <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                     <Activity className="size-3.5" />
                     Activity Vector
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 font-medium">7-day live threat volume analysis</p>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                   <div className="size-2 rounded-sm bg-rose-500 animate-pulse" />
                   <span>Blocked Attempts</span>
                </div>
            </div>
            
            <div className="flex-1 w-full min-h-0 pt-2">
                <ActivityChart data={safeStats.activity_trend} color="#f43f5e" />
            </div>
         </motion.div>

         {/* RECENT INTERVENTIONS (1 Col) */}
         <motion.div 
            variants={cardVariants}
            whileHover={{ boxShadow: "0 12px 40px -12px rgba(0,0,0,0.08)" }}
            className="p-8 rounded-2xl border border-slate-200/60 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.06)] h-[28rem] flex flex-col"
          >
            <div className="mb-6 flex-none flex items-center justify-between">
                <div>
                    <p className="text-[11px] font-bold uppercase text-slate-400 tracking-wider flex items-center gap-2">
                        <Globe className="size-3.5" />
                        Flux Log
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Real-time interceptions</p>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 shadow-sm">
                    <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-wide">Live</span>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
               {safeStats.recent_interventions.length > 0 ? safeStats.recent_interventions.map((item, i) => (
                 <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    whileHover={{ scale: 1.02, backgroundColor: "rgb(248 250 252)", y: -1 }}
                    className="p-3.5 rounded-xl bg-white border border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all duration-200 cursor-pointer group"
                 >
                    <div className="flex items-start gap-3">
                       <div className={cn(
                           "mt-0.5 size-8 rounded-lg flex items-center justify-center border flex-shrink-0 transition-colors shadow-sm",
                           item.risk === "SAFE" || item.risk === "LOW" 
                              ? "bg-emerald-50/50 border-emerald-100 text-emerald-600" 
                              : "bg-rose-50/50 border-rose-100 text-rose-500"
                        )}>
                           {item.risk === "SAFE" || item.risk === "LOW" ? <ShieldCheck className="size-4" /> : <AlertTriangle className="size-4" />}
                        </div>
                       <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                             <p className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors truncate font-sans tracking-tight leading-tight" title={item.domain}>
                                {item.domain}
                             </p>
                             <span className={cn(
                                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ml-auto shrink-0 shadow-sm",
                                item.risk.includes("HIGH") ? "text-rose-700 border-rose-100 bg-rose-50" : 
                                item.risk.includes("MODERATE") || item.risk.includes("SUSPICIOUS") ? "text-amber-700 border-amber-100 bg-amber-50" :
                                "text-emerald-700 border-emerald-100 bg-emerald-50"
                             )}>
                                {item.risk}
                             </span>
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                             <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide group-hover:text-slate-500 transition-colors">{item.type || "Scan"}</p>
                             <p className="text-[10px] text-slate-300 font-mono group-hover:text-slate-500 transition-colors tracking-tight">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                          </div>
                       </div>
                    </div>
                 </motion.div>
               )) : (
                 <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                    <div className="size-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center">
                        <ShieldCheck className="size-8 opacity-20" />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest font-bold opacity-50">No active threats detected</span>
                 </div>
               )}
            </div>
            
            <div className="pt-4 mt-2 border-t border-slate-50 text-center">
                <button className="text-[9px] font-black uppercase text-slate-300 hover:text-slate-900 transition-colors tracking-[0.2em] flex items-center justify-center gap-1 mx-auto hover:gap-2 duration-300">
                    View Analysis Matrix <ArrowUpRight className="size-3" />
                </button>
            </div>
         </motion.div>
      </div>
    </motion.div>
  );
}
