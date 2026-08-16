"use client";

import { useState } from "react";
import { Settings, Sliders, Bell, Cpu, Zap, Radio, Server, Fingerprint, Save } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ControlsPage() {
    const [sensitivity, setSensitivity] = useState(70);
    const [activeEngine, setActiveEngine] = useState("hybrid");
    const [notifications, setNotifications] = useState({
        email: true,
        desktop: true,
        slack: false
    });

    return (
        <div className="space-y-8 min-h-screen pb-20 font-sans text-slate-900">
            {/* HEADER */}
            <div className="space-y-1 border-b border-slate-200/60 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <Settings className="size-8 text-emerald-600" />
                    System Controls
                </h1>
                <p className="text-slate-500 font-medium">
                    Tune the heuristic engines and configure alert thresholds.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* 1. HEURISTIC ENGINE TUNING */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-emerald-100 p-2 rounded-lg">
                            <Cpu className="size-6 text-emerald-700" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Engine Sensitivity</h2>
                            <p className="text-xs text-slate-500">Adjust the aggressiveness of the threat detection models.</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-slate-700">Detection Threshold</label>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-emerald-600">{sensitivity}%</span>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Confidence</p>
                            </div>
                        </div>
                        
                        <div className="relative pt-2">
                             <input 
                                type="range" 
                                min="10" 
                                max="95" 
                                value={sensitivity} 
                                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                                className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <div className="flex justify-between mt-2 text-xs font-medium text-slate-400 px-1">
                                <span>Permissive</span>
                                <span>Balanced</span>
                                <span>Paranoid</span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 leading-relaxed">
                            <strong className="text-slate-900">Projected Impact:</strong> At <strong>{sensitivity}%</strong> sensitivity, the system will flag approx. 2.4% of traffic as suspicious. False positive rate estimated at 0.05%.
                        </div>
                    </div>
                </div>

                {/* 2. ENGINE ARCHITECTURE */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <Server className="size-6 text-indigo-700" />
                        </div>
                         <div>
                            <h2 className="text-lg font-bold text-slate-900">Inference Architecture</h2>
                            <p className="text-xs text-slate-500">Select the active analysis model.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {[
                            { id: "local", name: "Local Only (Privacy First)", desc: "100% On-device execution. No cloud latency.", icon: Fingerprint },
                            { id: "hybrid", name: "Hybrid Cloud (Recommended)", desc: "Local pre-filter + Cloud deep scan for high-risk items.", icon: Zap },
                            { id: "cloud", name: "Cloud Neural (Max Security)", desc: "Full metadata analysis via Sentinel Cloud Cluster.", icon: Cpu }
                        ].map((engine) => (
                            <div 
                                key={engine.id}
                                onClick={() => setActiveEngine(engine.id)}
                                className={cn(
                                    "p-4 rounded-xl border cursor-pointer transition-all flex items-center gap-4 group",
                                    activeEngine === engine.id 
                                        ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                                        : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full",
                                    activeEngine === engine.id ? "bg-white/20" : "bg-slate-100 group-hover:bg-slate-200"
                                )}>
                                    <engine.icon className="size-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm">{engine.name}</h3>
                                    <p className={cn("text-xs mt-0.5", activeEngine === engine.id ? "text-slate-400" : "text-slate-500")}>{engine.desc}</p>
                                </div>
                                <div className="ml-auto">
                                    <div className={cn(
                                        "size-5 rounded-full border-2 flex items-center justify-center",
                                        activeEngine === engine.id ? "border-emerald-400" : "border-slate-300"
                                    )}>
                                        {activeEngine === engine.id && <div className="size-2.5 bg-emerald-400 rounded-full" />}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. NOTIFICATION PREFERENCES */}
                 <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 lg:col-span-2">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-amber-100 p-2 rounded-lg">
                            <Bell className="size-6 text-amber-700" />
                        </div>
                         <div>
                            <h2 className="text-lg font-bold text-slate-900">Alert Channels</h2>
                            <p className="text-xs text-slate-500">Where should Sentinel notify you of critical blocks?</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {Object.entries(notifications).map(([key, enabled]) => (
                            <div key={key} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                <span className="capitalize font-bold text-slate-700">{key} Notifications</span>
                                <button 
                                    onClick={() => setNotifications(prev => ({ ...prev, [key]: !enabled }))}
                                    className={cn(
                                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500/20",
                                        enabled ? "bg-amber-500" : "bg-slate-200"
                                    )}
                                >
                                    <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", enabled ? "translate-x-6" : "translate-x-1")} />
                                </button>
                            </div>
                        ))}
                    </div>
                 </div>
            </div>
            
            <div className="flex justify-end pt-4">
                 <button className="bg-emerald-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-emerald-900/20 hover:bg-emerald-500 hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2">
                    <Save className="size-4" />
                    Save Configuration
                 </button>
            </div>
        </div>
    );
}
