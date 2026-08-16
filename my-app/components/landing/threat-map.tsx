"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Globe, Zap, AlertTriangle, Terminal, Activity } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";

// Simplified world map dots for visual effect
const MAP_POINTS = [
  { x: 20, y: 30 }, { x: 25, y: 35 }, { x: 22, y: 32 }, { x: 28, y: 28 }, // NA
  { x: 45, y: 25 }, { x: 48, y: 28 }, { x: 50, y: 22 }, { x: 52, y: 26 }, // EU
  { x: 75, y: 35 }, { x: 78, y: 32 }, { x: 80, y: 38 }, { x: 72, y: 30 }, // ASIA
  { x: 30, y: 60 }, { x: 35, y: 65 }, // SA
  { x: 55, y: 55 }, { x: 60, y: 65 }, // AFRICA
  { x: 85, y: 75 }, { x: 82, y: 70 }, // AUS
];

const THREAT_TYPES = [
  { name: "SQL Injection", color: "text-red-500", icon: Terminal },
  { name: "DDoS Attack", color: "text-orange-500", icon: Activity },
  { name: "Phishing", color: "text-yellow-500", icon: AlertTriangle },
  { name: "Secure Scan", color: "text-emerald-500", icon: Shield },
];

const LOCATIONS = [
  "New York, US", "London, UK", "Tokyo, JP", "Berlin, DE", 
  "Sydney, AU", "Sao Paulo, BR", "Singapore, SG", "Toronto, CA"
];

export default function ThreatMap() {
  const [threats, setThreats] = useState<any[]>([]);
  const [stats, setStats] = useState({ blocked: 14205, active: 0, efficiency: 99.9 });

  useEffect(() => {
    async function fetchData() {
        try {
            const res = await fetch(`${API_BASE_URL}/dashboard`, { cache: 'no-store' }).catch(e => {
                console.warn("Backend not reachable for threat map data");
                return null;
            });
            if (!res || !res.ok) return;
            const data = await res.json();
            
            // Update Headers
            setStats({
                blocked: data.kpi.threats_blocked,
                active: data.kpi.critical_blocked, // Using critical count as "active" proxy
                efficiency: data.kpi.safety_score
            });

            // Map Recent Interventions (Raw Data)
            const mappedThreats = data.recent_interventions
                .slice(0, 8) // Increased to 8 to fill the card
                .map((item: any, i: number) => {
                    // Heuristic mapping of backend "type" to visual icons
                    let visualType = THREAT_TYPES[3]; // Default shield ("Secure Scan")
                    const displayDomain = item.domain;
                    const displayType = item.type;

                    if (item.type === "Phishing") visualType = THREAT_TYPES[2]; 
                    if (item.type === "Social Eng.") visualType = THREAT_TYPES[1]; 

                    return {
                        id: `${item.timestamp}-${item.domain}-${i}`, 
                        type: { ...visualType, name: displayDomain }, // Main text: Website Name
                        location: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' }), 
                        ip: displayType, // Sub text: Threat Type
                        timestamp: item.timestamp
                    };
                });
            
            setThreats(mappedThreats);
        } catch (e) {
            console.error("Failed to fetch threat map data", e);
        }
    }

    fetchData(); // Initial
    const interval = setInterval(fetchData, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-32 bg-zinc-950 relative overflow-hidden text-white">
      {/* BACKGROUND GRID */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:32px_32px] opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-3 gap-12 items-center">
        
        {/* LEFT COLUMN: STATS column */}
        <div className="space-y-8">
            <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    LIVE THREAT INTELLIGENCE
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tighter">
                    Global <br/>
                    <span className="text-emerald-500">Defense Grid</span>
                </h2>
                <p className="text-zinc-400 max-w-sm">
                    Real-time visualization of neutralized vectors across the decentralized Sentinel mesh network.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="text-3xl font-mono font-bold text-white mb-1">
                        {stats.blocked.toLocaleString()}
                    </div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Threats Blocked</div>
                </div>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                    <div className="text-3xl font-mono font-bold text-emerald-400 mb-1">
                        {stats.efficiency}%
                    </div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Efficiency Rate</div>
                </div>
            </div>
        </div>

        {/* MIDDLE/RIGHT: MAP VISUALIZATION */}
        <div className="lg:col-span-2 relative h-[600px] rounded-3xl bg-zinc-900/50 border border-white/10 overflow-hidden shadow-2xl shadow-emerald-900/10">
            {/* MAP OVERLAY */}
            <div className="absolute inset-0 opacity-20">
               {/* Abstract World Map Dots */}
               {MAP_POINTS.map((dot, i) => (
                   <div 
                    key={i} 
                    className="absolute bg-emerald-500/30 rounded-full w-1 h-1"
                    style={{ left: `${dot.x}%`, top: `${dot.y}%` }}
                   />
               ))}
                {/* SVG Map Lines (Decorative) */}
                <svg className="w-full h-full stroke-emerald-500/10" fill="none">
                    <path d="M 100 200 Q 250 100 400 250 T 700 300" strokeWidth="2" strokeDasharray="10 10" />
                    <path d="M 50 150 Q 200 350 500 150" strokeWidth="2" strokeDasharray="5 5" />
                </svg>
            </div>
            
            {/* SCANNING LINE */}
            <motion.div 
                className="absolute top-0 w-[2px] h-full bg-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.5)] z-0"
                animate={{ left: ["0%", "100%"] }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />

            {/* LIVE FEED LIST - UPGRADED LAYOUT */}
            <div className="absolute inset-0 p-8 z-20 flex flex-col justify-end">
                <div className="text-xs font-mono text-zinc-500 mb-4 uppercase tracking-widest pl-1">Recent Intercepts</div>
                <div className="flex flex-col gap-3">
                    <AnimatePresence>
                        {threats.map((threat) => (
                            <motion.div
                                key={threat.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-950/80 border border-white/10 backdrop-blur-md text-sm shadow-sm group hover:border-emerald-500/30 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <threat.type.icon className={`size-4 ${threat.type.color}`} />
                                    <span className="font-medium text-zinc-200">{threat.type.name}</span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                                    <span>{threat.ip}</span>
                                    <span className="text-emerald-500/80">{threat.location}</span>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* DECORATIVE HUD ELEMENTS */}
            <div className="absolute top-6 left-6 text-[10px] font-mono text-emerald-500/50">
                SYS.MONITOR.V2.4 <br/> NET_STATUS: SECURE
            </div>
            <div className="absolute top-6 right-6">
                 <Globe className="text-zinc-800 size-24 opacity-20 animate-pulse" strokeWidth={0.5} />
            </div>
        </div>

      </div>
    </section>
  );
}
