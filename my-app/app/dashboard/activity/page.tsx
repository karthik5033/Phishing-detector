"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, AlertTriangle, Search, Filter, X, Eye, Activity, Globe, Lock, Ban, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";

interface ActivityItem {
  id: number | string;
  domain: string;
  hostname?: string; // New field for clean domain
  timestamp: string;
  risk_score: number;
  risk_level: string;
  status: string;
  category: string;
  explanation?: string;
  is_blocked?: boolean;
}

export default function ActivityInsightsPage() {
  const [data, setData] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ActivityItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 5000); // Poll every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchActivity = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/activity?limit=20`);
        const responseData = await response.json();
        // Ensure data is always an array
        const activityData = Array.isArray(responseData) ? responseData : [];
        setData(activityData);
    } catch (error) {
        console.error("Failed to fetch activity:", error);
        // Set empty array on error
        setData([]);
    } finally {
        setLoading(false);
    }
  };

  const handleBlockToggle = async () => {
    if (!selectedItem) return;
    const isBlocked = selectedItem.is_blocked;
    const endpoint = isBlocked ? "/unblock" : "/block";
    
    // Use proper hostname if available (clean domain), otherwise fallback to domain string
    const domainToBlock = selectedItem.hostname || selectedItem.domain;

    try {
        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain: domainToBlock }),
        });
        
        const responseData = await res.json();

        if (res.ok) {
            const newState = !isBlocked;
            const updatedItemPartial = { 
                is_blocked: newState,
                status: newState ? "BLOCKED" : "SAFE",
                risk_score: newState ? 1.0 : 0.0,
                category: newState ? "Blocked" : (selectedItem.category === "Blocked" ? "Safe" : selectedItem.category),
                explanation: newState ? "Permanently blocked by user." : "User override: Unblocked."
            };

            // Update selected item immediately
            setSelectedItem(prev => prev ? { ...prev, ...updatedItemPartial } : null);
            
            // Update the list data to reflect changes in the table
            setData(prev => prev.map(item => item.domain === selectedItem.domain ? {
                ...item,
                ...updatedItemPartial
            } : item));

            // Refresh data from backend to get the latest state
            await fetchActivity();

            // CRITICAL: Force extension to sync blocklist immediately
            try {
                // @ts-ignore - Chrome extension API
                if (typeof chrome !== 'undefined' && chrome.runtime) {
                    chrome.runtime.sendMessage(
                        {type: "SYNC_BLOCKLIST"}, 
                        (response: any) => {
                            if (response?.success) {
                                console.log(`✅ Extension synced: ${response.count} blocked domains`);
                            }
                        }
                    );
                }
            } catch (e) {
                console.log("Extension not available (running in browser without extension)");
            }

            alert(`Domain ${selectedItem.domain} has been ${newState ? 'blocked' : 'unblocked'} successfully.`);
        } else {
            console.error("Block/Unblock failed:", responseData);
            alert(`Failed to update domain status: ${responseData.detail || "Unknown error"}`);
        }
    } catch (e) {
        console.error("Network error:", e);
        alert("Failed to communicate with the server.");
    }
  };

  return (
    <div className="space-y-8 min-h-screen pb-20 relative font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/60 pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
             <Activity className="size-8 text-emerald-600" />
             Activity Insights
          </h1>
          <p className="text-slate-500 font-medium">
            Deep-dive analysis of all intercepted traffic and heuristic decisions.
          </p>
        </div>
        
        {/* FILTERS */}
        <div className="flex items-center gap-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-hover:text-slate-600 transition-colors z-10" />
                <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-64 shadow-sm transition-all relative z-0"
                />
            </div>
            <button className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-50 shadow-sm transition-colors">
                <Filter className="size-5" />
            </button>
        </div>
      </div>

      {/* CONTENT: TABLE VIEW */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden min-h-[500px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <div className="size-10 border-4 border-slate-100 border-t-emerald-500 rounded-full animate-spin" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Loading Telemetry...</p>
           </div>
        ) : (
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-wider">
                            <th className="px-6 py-4 font-black w-[35%]">Domain / Origin</th>
                            <th className="px-6 py-4 font-black w-[20%]">Timestamp</th>
                            <th className="px-6 py-4 font-black w-[15%]">Category</th>
                            <th className="px-6 py-4 font-black w-[20%]">Risk Factor</th>
                            <th className="px-6 py-4 font-black w-[10%] text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.filter(item => 
                            item.domain.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            item.category.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map((item, i) => (
                            <motion.tr 
                                key={item.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                onClick={() => setSelectedItem(item)}
                                className="hover:bg-slate-50 cursor-pointer transition-colors group group-hover:shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative z-10"
                            >
                                {/* DOMAIN */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-9 rounded-lg flex items-center justify-center border shadow-sm transition-colors",
                                            item.is_blocked
                                                ? "bg-slate-800 border-slate-700 text-slate-200"
                                                : item.risk_score > 0.5 
                                                    ? "bg-rose-50 border-rose-100 text-rose-500" 
                                                    : "bg-emerald-50 border-emerald-100 text-emerald-500"
                                        )}>
                                            {item.is_blocked
                                                ? <Ban className="size-5" /> 
                                                : item.risk_score > 0.5 ? <AlertTriangle className="size-5" /> : <Globe className="size-5" />}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-slate-700 group-hover:text-emerald-700 transition-colors break-all">{item.domain}</span>
                                            <span className="text-[10px] text-slate-400 font-mono tracking-tight">{item.status}</span>
                                        </div>
                                    </div>
                                </td>
                                
                                {/* TIMESTAMP */}
                                <td className="px-6 py-4">
                                    <span className="text-xs font-medium text-slate-500 font-mono">
                                        {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                    </span>
                                </td>

                                {/* CATEGORY */}
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide border shadow-sm",
                                        item.category === "Phishing" ? "bg-rose-50 text-rose-700 border-rose-100" :
                                        item.category === "Safe" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                        "bg-slate-50 text-slate-600 border-slate-200"
                                    )}>
                                        {item.category}
                                    </span>
                                </td>

                                {/* RISK FACTOR */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden ring-1 ring-slate-200/50">
                                            <div 
                                                className={cn("h-full rounded-full shadow-sm", item.risk_score > 0.75 ? "bg-rose-500" : item.risk_score > 0.4 ? "bg-amber-400" : "bg-emerald-400")} 
                                                style={{ width: `${item.risk_score * 100}%` }}
                                            />
                                        </div>
                                        <span className="text-[11px] font-mono font-bold text-slate-500">{(item.risk_score * 100).toFixed(0)}%</span>
                                    </div>
                                </td>

                                {/* ACTION */}
                                <td className="px-6 py-4 text-right">
                                    <button className="text-[10px] font-bold uppercase text-slate-300 group-hover:text-emerald-600 transition-colors flex items-center gap-1 justify-end tracking-wider">
                                        Inspect <Eye className="size-3" />
                                    </button>
                                </td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* TWEAK: DEEP INSPECTION DRAWER */}
      <AnimatePresence>
        {selectedItem && (
            <>
                {/* BACKDROP */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setSelectedItem(null)}
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[9998]"
                />

                {/* DRAWER */}
                <motion.div 
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "spring", damping: 30, stiffness: 350 }}
                    className="fixed top-0 right-0 h-full w-[480px] bg-white shadow-2xl z-[9999] border-l border-slate-200 flex flex-col"
                >
                    {/* DRAWER HEADER */}
                    <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
                        <div>
                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Deep Scan Analysis</span>
                            <h2 className="text-2xl font-bold text-slate-900 break-all leading-tight max-w-[340px]">{selectedItem.domain}</h2>
                        </div>
                        <button 
                            onClick={() => setSelectedItem(null)}
                            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-900"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* DRAWER CONTENT */}
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        
                        {/* 1. VISUAL RISK SCORE */}
                        <div className="flex items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-xl group hover:shadow-2xl transition-shadow">
                            <div>
                                <p className="text-sm font-medium text-slate-300">Composite Risk Score</p>
                                <div className="text-5xl font-bold tracking-tighter mt-1">{(selectedItem.risk_score * 100).toFixed(0)}<span className="text-2xl text-slate-500 font-normal">/100</span></div>
                            </div>
                            <div className="size-16 rounded-full border-4 border-white/10 flex items-center justify-center relative bg-white/5">
                                <ShieldCheck className={cn("size-8", selectedItem.risk_score > 0.5 ? "text-rose-400" : "text-emerald-400")} />
                            </div>
                        </div>

                        {/* 2. EXPLANATION ANALYSIS */}
                        <div className="space-y-3">
                            <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                                <Activity className="size-3" /> Heuristic Explanation
                            </h3>
                            <div className="p-5 rounded-xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-700 font-medium shadow-inner">
                                {selectedItem.explanation || "No specific heuristic anomalies detected. This traffic matches standard behavioral baselines and does not exhibit known threat vectors."}
                            </div>
                        </div>

                         {/* 3. METADATA GRID */}
                         <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-colors">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Category</span>
                                <span className="text-sm font-bold text-slate-900">{selectedItem.category}</span>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-slate-200 transition-colors">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Status</span>
                                <span className={cn("text-sm font-bold", selectedItem.risk_score > 0.5 ? "text-rose-600" : "text-emerald-600")}>
                                    {selectedItem.status}
                                </span>
                            </div>
                            <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm col-span-2 hover:border-slate-200 transition-colors">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Timestamp</span>
                                <span className="text-sm font-mono text-slate-600">{selectedItem.timestamp}</span>
                            </div>
                         </div>
                    </div>

                    {/* DRAWER FOOTER */}
                    <div className="p-6 border-t border-slate-100 bg-slate-50/50">

                        <button 
                            onClick={handleBlockToggle}
                            className={cn(
                                "w-full py-3 rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group",
                                selectedItem.is_blocked 
                                    ? "bg-emerald-600 text-white shadow-emerald-900/20 hover:bg-emerald-500" 
                                    : "bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800"
                            )}
                        >
                            {selectedItem.is_blocked ? (
                                <>
                                    <Unlock className="size-4" />
                                    Unblock Domain
                                </>
                            ) : (
                                <>
                                    <Lock className="size-4 group-hover:text-rose-400 transition-colors" />
                                    Block this Domain Permanently
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </>
        )}
      </AnimatePresence>
    </div>
  );
}
