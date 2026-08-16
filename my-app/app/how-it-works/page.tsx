"use client";

import React, { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, Zap, Search, Lock, Cpu, Database, ArrowRight, Activity, Terminal as TerminalIcon, Eye, Network, FileCode, Clock, Server, Code, GitBranch, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HowItWorks() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500/30 selection:text-emerald-900 font-sans overflow-hidden">
      
      {/* BACKGROUND GRID */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white via-transparent to-transparent z-10" />
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-32">
        
        {/* HEADER */}
        <div className="mb-24 text-center">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-mono uppercase tracking-[0.2em] mb-6 shadow-sm"
            >
                <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Hybrid Inference Engine v1.0
            </motion.div>
            
            <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="text-5xl md:text-7xl font-bold tracking-tighter text-slate-900 mb-6"
            >
                Zero-Trust <span className="text-slate-400">Pipeline</span>
            </motion.h1>
            
            <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light"
            >
                Sentinel combines local heuristics with server-side implementation. 
                We use <span className="font-mono text-sm bg-slate-100 px-1 py-0.5 rounded text-emerald-700">analysis.py</span> logic including Temporal Risk Assessment and Impersonation Checks.
            </motion.p>
        </div>

        {/* PROCESS TIMELINE */}
        <div className="relative">
            {/* Connecting Line */}
            <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-slate-300 to-transparent md:-translate-x-1/2" />
            
            <div className="space-y-16 md:space-y-24">
                
                {/* STEP 01: INJECTION */}
                <Step 
                    number="01"
                    title="MV3 Sentinel Injection"
                    desc="Upon page load, Sentinel injects a content script adhering to Manifest V3 protocols. It utilizes the MutationObserver API to watch for dynamic DOM changes."
                    icon={FileCode}
                    align="left"
                    techs={["MutationObserver", "Content Script"]}
                    detail={<ManifestPreview />}
                />

                {/* STEP 02: FEATURE EXTRACTION */}
                <Step 
                    number="02"
                    title="Feature & Signal Extraction"
                    desc="We extract key signals locally: URL Entropy (randomness), Page Title vs. Domain Levenshtein distance, and current local time for Temporal Analysis."
                    icon={Search}
                    align="right"
                    techs={["url_entropy", "levenshtein_dist"]}
                    detail={
                        <div className="mt-4 p-4 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs md:text-sm text-zinc-400 shadow-xl overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-2 opacity-20">
                                <Activity className="size-12 text-white" />
                            </div>
                            <div className="flex justify-between border-b border-white/10 pb-2 mb-2 relative z-10">
                                <span>feature_extractor.ts</span>
                                <span className="text-emerald-500 font-bold animate-pulse">ACTIVE</span>
                            </div>
                            <div className="space-y-1 relative z-10">
                                <div>{`> Extracting DOM signals...`}</div>
                                <div className="text-emerald-400 font-semibold">{`> Title: "Login to PayPal"`}</div>
                                <div className="text-red-400 font-semibold">{`> Domain: "paypa1-secure.com"`}</div>
                                <div>{`> Entropy Score: 4.2 (Elevated)`}</div>
                            </div>
                        </div>
                    }
                />

                 {/* INTERLUDE: LIVE TERMINAL */}
                 <div className="relative z-20 py-8 md:py-16">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        className="max-w-3xl mx-auto bg-[#09090b] rounded-xl border border-slate-800 shadow-2xl overflow-hidden"
                    >
                        <div className="flex items-center gap-4 px-4 py-3 border-b border-white/5 bg-[#121212]">
                            <div className="flex gap-1.5">
                                <div className="size-2.5 rounded-full bg-red-500/20 border border-red-500/50" />
                                <div className="size-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                <div className="size-2.5 rounded-full bg-green-500/20 border border-green-500/50" />
                            </div>
                            <div className="text-xs font-mono text-slate-500 flex-1 text-center">backend/app/routes/analysis.py</div>
                            <Server className="size-3 text-slate-500" />
                        </div>
                        <LiveTerminal />
                    </motion.div>
                 </div>

                {/* STEP 03: ANALYSIS.PY LOGIC */}
                <Step 
                    number="03"
                    title="Hybrid Inference Logic"
                    desc="The backend processes the request through analysis.py. It calculates a risk score based on NLP inference results multiplied by a Temporal Risk factor."
                    icon={Cpu}
                    align="left"
                    techs={["NLP Inference", "Temporal Multiplier"]}
                    detail={<NeuralGraph />}
                />

                {/* STEP 04: PERSISTENCE & BLOCK */}
                <Step 
                    number="04"
                    title="Enforcement & Persistence"
                    desc="If Risk Score > 0.75, the domain is added to the BlockedDomain database. A ScanResult is persisted via SQLAlchemy for the dashboard KPI."
                    icon={Database}
                    align="right"
                    techs={["PostgreSQL", "Blocklist DB"]}
                    detail={<BlockRecord />}
                    final
                />
            </div>
        </div>

        {/* CTA */}
        <div className="mt-24 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Ready to secure your workflow?</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                 <div className="px-5 py-3 rounded-lg bg-white border border-slate-200 text-left shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xl font-bold text-slate-900 mb-0.5">2.4ms</div>
                    <div className="text-xs text-slate-500">Average Latency</div>
                 </div>
                 <div className="px-5 py-3 rounded-lg bg-white border border-slate-200 text-left shadow-sm hover:shadow-md transition-shadow">
                    <div className="text-xl font-bold text-emerald-600 mb-0.5">99.9%</div>
                    <div className="text-xs text-slate-500">API Uptime</div>
                 </div>
            </div>
        </div>

      </main>
    </div>
  );
}

function Step({ number, title, desc, icon: Icon, align = "left", techs = [], detail, final = false }: any) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className={cn(
                "relative flex flex-col md:flex-row gap-6 md:gap-12 items-start md:items-center",
                align === "right" ? "md:flex-row-reverse" : ""
            )}
        >
            {/* Center Node */}
            <div className="absolute left-[20px] md:left-1/2 top-8 size-8 rounded-full bg-white border border-slate-300 flex items-center justify-center z-10 md:-translate-x-1/2 -translate-x-1/2 shadow-lg group-hover:scale-110 transition-transform duration-500">
                <div className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            {/* Content Side */}
            <div className={cn("pl-12 md:pl-0 md:w-1/2 group", align === "right" ? "md:pl-16 text-left" : "md:pr-16 md:text-right")}>
                 <div className={cn("inline-flex items-center gap-2 text-slate-400 font-mono text-[10px] mb-3 uppercase tracking-widest", align === "right" ? "" : "md:flex-row-reverse")}>
                    <span className="text-emerald-700 font-bold">Phase {number}</span>
                    <span className="w-6 h-px bg-slate-300" />
                 </div>
                 
                 <h3 className="text-3xl font-bold text-slate-900 mb-4 group-hover:text-emerald-700 transition-colors tracking-tight">{title}</h3>
                 <p className="text-slate-600 leading-relaxed text-base md:text-lg max-w-md ml-auto mr-auto lg:mr-0 lg:ml-0 font-medium">
                    {desc}
                 </p>

                 <div className={cn("flex flex-wrap gap-2 mt-4", align === "right" ? "justify-start" : "md:justify-end")}>
                    {techs.map((t: string, i: number) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] text-slate-500 font-mono font-semibold shadow-sm">
                            {t}
                        </span>
                    ))}
                 </div>
            </div>

            {/* Visual Side */}
            <div className="pl-12 md:pl-0 md:w-1/2 w-full">
                <div className={cn(
                    "p-6 rounded-xl bg-white border border-slate-200 hover:border-emerald-500/30 transition-all duration-500 group/card relative overflow-hidden shadow-xl shadow-slate-200/40 hover:-translate-y-1",
                    align === "right" ? "mr-auto" : "ml-auto"
                )}>
                    <div className="absolute -top-6 -right-6 p-0 opacity-[0.03] group-hover/card:opacity-[0.06] transition-opacity rotate-12">
                        <Icon className="size-40 text-slate-900" />
                    </div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="size-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center text-emerald-600 group-hover/card:scale-110 transition-transform shadow-sm">
                                <Icon className="size-4" />
                            </div>
                            <div className="h-px flex-1 bg-slate-100" />
                        </div>
                        
                        {detail || (
                            <div className="space-y-2 opacity-50">
                                <div className="h-2 w-3/4 bg-slate-100 rounded" />
                                <div className="h-2 w-1/2 bg-slate-100 rounded" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    )
}

function ManifestPreview() {
    return (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 font-mono text-xs md:text-sm text-slate-500 relative overflow-hidden group-hover/card:border-emerald-500/20 transition-colors">
            <div className="absolute top-2 right-2 text-xs text-slate-300 group-hover/card:text-emerald-500 transition-colors">
                <FileCode className="size-4" />
            </div>
            <div className="text-emerald-600 mb-1 font-bold">manifest.json</div>
            <div className="pl-2 border-l border-slate-200 space-y-0.5">
                <div><span className="text-purple-600">"manifest_version"</span>: <span className="text-blue-600">3</span>,</div>
                <div><span className="text-purple-600">"permissions"</span>: [</div>
                <div className="pl-2 text-amber-600">"activeTab", "scripting"</div>
                <div>],</div>
                <div><span className="text-purple-600">"host_permissions"</span>: [</div>
                <div className="pl-2 text-amber-600">"&lt;all_urls&gt;"</div>
                <div>]</div>
            </div>
        </div>
    )
}

function NeuralGraph() {
    return (
        <div className="relative h-24 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center gap-8">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000005_1px,transparent_1px),linear-gradient(to_bottom,#00000005_1px,transparent_1px)] bg-[size:10px_10px]" />
            
            {/* Input Node */}
            <div className="relative z-10 size-8 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center">
                <span className="text-[9px] font-bold text-slate-500">IN</span>
            </div>

            {/* Hidden Lines */}
            <div className="absolute inset-x-12 top-1/2 h-px bg-slate-200" />

            {/* Process Node */}
            <div className="relative z-10 size-10 rounded-full bg-white border border-emerald-500/50 shadow-sm flex items-center justify-center animate-pulse">
                <Cpu className="size-5 text-emerald-500" />
            </div>

             {/* Output Node */}
             <div className="relative z-10 size-8 rounded-full bg-white border border-slate-300 shadow-sm flex items-center justify-center">
                <span className="text-[9px] font-bold text-slate-500">OUT</span>
            </div>
        </div>
    )
}

function BlockRecord() {
    return (
        <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 text-xs space-y-3">
            <div className="flex items-center gap-2 text-slate-400 uppercase tracking-wider font-bold text-[9px]">
                <Database className="size-3" />
                <span>PostgreSQL Record</span>
            </div>
            <div className="bg-white border border-slate-200 rounded p-2 font-mono shadow-sm">
                 <div className="grid grid-cols-2 gap-2 text-slate-500">
                    <div>
                        <span className="text-slate-400 block text-[8px]">DOMAIN</span>
                        <span className="text-slate-700 font-bold">secure-login.xy</span>
                    </div>
                    <div className="text-right">
                        <span className="text-slate-400 block text-[8px]">RISK_SCORE</span>
                        <span className="text-red-500 font-bold">0.98</span>
                    </div>
                 </div>
                 <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-red-600 font-bold">
                    <AlertTriangle className="size-3" />
                    STATUS: BLOCKED
                 </div>
            </div>
        </div>
    )
}

function LiveTerminal() {
    const [lines, setLines] = useState<any[]>([
        "> Initializing Inference Engine...",
        <span key="1" className="text-zinc-500">{"> Loading 'transformers' pipeline for NLP tasks..."}</span>,
        <span key="2" className="text-emerald-500">{"> [OK] Database connection established (PostgreSQL)"}</span>
    ]);

    useEffect(() => {
        const sequence = [
            { text: "> POST /api/v1/analyze", delay: 1000 },
            { text: "> Payload: { url: 'http://secure-login.xy', local_hour: 03 }", delay: 1800 },
            { text: "> [Temporal] Hour=03 detected. Risk Multiplier: 1.2x", delay: 2800, color: "text-amber-500" },
            { text: "> [Impersonation] Title='Login' vs Domain='secure-login.xy'", delay: 3800 },
            { text: "> NLP Inference Score: 0.85", delay: 4500 },
            { text: "> Calculating Final Risk: min(0.85 * 1.2, 1.0) = 1.0", delay: 5200, color: "text-red-400" },
            { text: "> Action: RiskLevel.HIGH_RISK -> BLOCK", delay: 6000, color: "text-red-500 font-bold" },
            { text: "> Persisting ScanResult to DB...", delay: 6800 }
        ];

        let timeouts: NodeJS.Timeout[] = [];
        
        sequence.forEach(({ text, delay, color }) => {
            const t = setTimeout(() => {
                setLines(prev => {
                    const newLines = [...prev, color ? <span className={color}>{text}</span> : text] as any;
                    if (newLines.length > 9) newLines.shift();
                    return newLines;
                });
            }, delay);
            timeouts.push(t);
        });

        return () => timeouts.forEach(clearTimeout);
    }, []);

    return (
        <div className="p-8 font-mono text-sm md:text-base text-zinc-400 space-y-3 min-h-[300px]">
            {lines.map((line, i) => (
                <div key={i} className="border-l-2 border-transparent pl-2 animate-in fade-in slide-in-from-left-2">
                    {line}
                </div>
            ))}
            <div className="w-2 h-4 bg-emerald-500 animate-pulse inline-block align-middle" />
        </div>
    )
}
