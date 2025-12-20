"use client";

import { RiskScoreCard } from "@/components/overview/RiskScoreCard";
import { TrendChart } from "@/components/overview/TrendChart";
import { AlertTriangle, Activity, Loader2, Clock, CheckCircle2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface DashboardData {
    kpi: {
        total_scans: number;
        threats_blocked: number;
        critical_blocked: number;
        safety_score: number;
    };
    recent_interventions: Array<{
        domain: string;
        timestamp: string; // ISO string
        type: string;
        risk: string;
    }>;
    activity_trend: Array<{
        date: string;
        count: number;
    }>;
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1
        }
    }
};

const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/dashboard");
            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  // Time formatter
  const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
      }).format(date);
  };
  
  const getRelativeTime = (isoString: string) => {
      const date = new Date(isoString);
      const now = new Date();
      const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
      
      if (diffInSeconds < 60) return "Just now";
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      return "Yesterday";
  };

  if (loading || !data) {
      return (
          <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                 <Loader2 className="w-8 h-8 text-blue-500" />
              </motion.div>
              <p className="animate-pulse">Syncing Security Insights...</p>
          </div>
      );
  }

  const { kpi, recent_interventions } = data;

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* Welcome Section */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Security Overview</h1>
        <p className="text-slate-500 mt-2 flex items-center gap-2">
          System Status: 
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${kpi.safety_score > 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
             {kpi.safety_score > 70 ? <CheckCircle2 size={12}/> : <AlertTriangle size={12}/>}
             {kpi.safety_score > 70 ? "Stable & Protected" : "Attention Needed"}
          </span>
        </p>
      </motion.div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div variants={item} whileHover={{ y: -5 }} className="h-full">
            <RiskScoreCard score={1 - (kpi.safety_score / 100)} />
        </motion.div>
        
        <motion.div variants={item} whileHover={{ y: -5 }} className="group p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Total Scans</h3>
              <div className="mt-4 flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-bold text-slate-900">{kpi.total_scans.toLocaleString()}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-xs font-medium animate-pulse">
                  <Activity size={10} /> Live
                </span>
              </div>
            </div>
            <div className="mt-6 text-sm text-slate-500 relative z-10">
              Analyzed pages across your active session.
            </div>
        </motion.div>

        <motion.div variants={item} whileHover={{ y: -5 }} className="group p-6 rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-full relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <div>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Threats Blocked</h3>
              <div className="mt-4 flex items-baseline gap-2 relative z-10">
                <span className="text-4xl font-bold text-slate-900">{kpi.threats_blocked}</span>
                {kpi.critical_blocked > 0 && (
                    <span className="text-xs text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full font-medium">
                    {kpi.critical_blocked} Critical
                    </span>
                )}
              </div>
            </div>
            <div className="mt-6 text-sm text-slate-500 relative z-10">
               Most frequent: <strong className="text-slate-700">Urgency Patterns</strong>
            </div>
        </motion.div>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <motion.div variants={item} className="lg:col-span-2">
           <TrendChart data={data.activity_trend} />
        </motion.div>
        
        <motion.div variants={item} className="space-y-6">
           {/* Recent Alerts Feed */}
           <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                 <h3 className="text-sm font-semibold text-slate-900">Recent Interventions</h3>
                 <span className="text-xs text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-full shadow-sm">
                    {recent_interventions.length} items
                 </span>
              </div>
              <div className="divide-y divide-slate-100 flex-1">
                 {recent_interventions.length === 0 ? (
                     <div className="p-8 text-center flex flex-col items-center justify-center h-48 text-slate-400">
                         <Shield className="w-10 h-10 mb-3 text-slate-200" />
                         <p className="text-sm">No threats detected recently.</p>
                         <p className="text-xs mt-1">You are browsing safely.</p>
                     </div>
                 ) : (
                     recent_interventions.map((item, i) => (
                        <motion.div 
                            key={i} 
                            whileHover={{ backgroundColor: "rgba(241, 245, 249, 0.5)" }}
                            className="p-4 flex items-start justify-between group transition-colors cursor-default"
                        >
                            <div className="flex gap-3 overflow-hidden">
                                <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${item.risk.includes("HIGH") ? "bg-rose-100 text-rose-600" : "bg-amber-100 text-amber-600"}`}>
                                    <AlertTriangle size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-slate-800 truncate" title={item.domain}>{item.domain}</div>
                                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                                        <span>{item.type}</span>
                                        <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                        <span className="flex items-center gap-0.5 text-slate-400">
                                            <Clock size={10} />
                                            {formatTime(item.timestamp)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className={`text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded uppercase ${
                                    item.risk.includes("HIGH") 
                                    ? "text-rose-600 bg-rose-50" 
                                    : "text-amber-600 bg-amber-50"
                                }`}>
                                    {item.risk}
                                </span>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {getRelativeTime(item.timestamp)}
                                </span>
                            </div>
                        </motion.div>
                        ))
                 )}
                 
                 <div className="p-3 text-center border-t border-slate-100">
                    <button className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors flex items-center justify-center gap-1 w-full">
                       View full activity log &rarr;
                    </button>
                 </div>
              </div>
           </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

