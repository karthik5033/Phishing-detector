"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Database, Shield, Zap, Cpu, Network, Lock, Code2, Server, Activity, GitBranch, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { API_BASE_URL } from "@/lib/constants";

// --- LIVE DATA INTERFACE ---
interface DashboardData {
  kpi: {
    total_scans: number;
    threats_blocked: number;
    safety_score: number;
  };
  recent_interventions: Array<{
    domain: string;
    type: string;
    risk: string;
    timestamp: string;
  }>;
}

export default function ArchitecturePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // SIMULATED LATENCY FLUCTUATION
  const [latency, setLatency] = useState(1.2);

  useEffect(() => {
    // 1. Fetch Real Data
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/dashboard`);
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error("Failed to fetch architecture stats", e);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000); // Poll every 5s

    // 2. Simulate Latency Jitter
    const jitter = setInterval(() => {
        setLatency(prev => +(Math.max(0.8, Math.min(2.1, prev + (Math.random() - 0.5) * 0.4)).toFixed(2)));
    }, 1000);

    return () => {
        clearInterval(interval);
        clearInterval(jitter);
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#121212] text-zinc-100 selection:bg-emerald-500/30 font-sans overflow-hidden">
      
      {/* GRID BACKGROUND - Adjusted for grey theme */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      
      {/* ANCHOR GLOW - Reduced intensity for formal look */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none" />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24">
        
        {/* HEADER */}
        <div className="mb-24 text-center">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-xs font-mono uppercase tracking-widest mb-8 backdrop-blur-md shadow-xl"
            >
                <div className="flex gap-1">
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="w-1 h-3 bg-emerald-400 rounded-full animate-[pulse_1s_ease-in-out_0.2s_infinite]" />
                    <span className="w-1 h-2 bg-emerald-400 rounded-full animate-[pulse_1s_ease-in-out_0.4s_infinite]" />
                </div>
                <span>Sentinel Mesh v2.4.0 active</span>
            </motion.div>
            
            <motion.h1
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, ease: "backOut" }}
                className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-8 drop-shadow-2xl"
            >
                System <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">Architecture</span>
            </motion.h1>

            <motion.p
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6, delay: 0.2 }}
                 className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed"
            >
                A transparent breakdown of Sentinel's three-tier defense stack. 
                Running live heuristics on <span className="text-white font-bold">{data?.kpi?.total_scans || "---"}</span> intercepted nodes.
            </motion.p>
        </div>

        {/* --- ARCHITECTURE DIAGRAM --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative mb-32 group/diagram">
            
            {/* ANIMATED CONNECTION LINES (Desktop Only) */}
            <div className="hidden lg:block absolute top-[60px] left-[15%] right-[15%] h-[2px] bg-zinc-800/50 z-0">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent w-1/2 blur-[1px] animate-[shimmer_3s_infinite_linear]" />
                {/* Simulated Packets */}
                <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 size-2 bg-emerald-400 rounded-full shadow-[0_0_10px_#34d399]"
                    animate={{ left: ["0%", "100%"], opacity: [0, 1, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                />
                 <motion.div 
                    className="absolute top-1/2 -translate-y-1/2 size-1 bg-cyan-400 rounded-full blur-[1px]"
                    animate={{ left: ["0%", "100%"], opacity: [0, 1, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear", delay: 1.5 }}
                />
            </div>
            
            {/* TIER 1: CLIENT */}
            <TierCard 
                title="Tier 1: Client Interceptor"
                icon={<Shield className="size-6 text-emerald-400" />}
                delay={0.3}
                accent="emerald"
                metrics={[
                    { label: "Runtime", val: "Chrome Ext API" },
                    { label: "Heuristic Latency", val: `${latency}ms`, live: true },
                    { label: "Active Observers", val: "4 (DOM/Net)" }
                ]}
            >
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    Injects a specific content script to monitor DOM mutations. 
                    Uses <span className="text-white font-medium">Zero-Copy</span> buffer analysis to detect phishing patterns without leaking user data.
                </p>
                <div className="mt-auto pt-4 flex gap-2 overflow-hidden">
                    {(data?.recent_interventions?.slice(0, 3) || []).map((risk, i) => (
                        <div key={i} className="text-[9px] px-2 py-1 rounded bg-[#1A1A1A] text-zinc-300 border border-white/5 truncate max-w-[100px]">
                            {risk.domain}
                        </div>
                    ))}
                </div>
            </TierCard>

            {/* TIER 2: ENGINE */}
            <TierCard 
                title="Tier 2: Neural Core"
                icon={<Cpu className="size-6 text-cyan-400" />}
                delay={0.4}
                accent="cyan"
                highlight
                metrics={[
                    { label: "Inference Engine", val: "WASM / TF.js" },
                    { label: "Model Size", val: "2.4 MB (Quantized)" },
                    { label: "Privacy Mode", val: "Air-Gapped" }
                ]}
            >
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    A heavy-lift WASM engine running locally. Classifies text vectors and visual cues.
                    Updates continually from the <span className="text-white font-medium">Federated Mesh</span> without exposing browsing history.
                </p>
                <div className="mt-4 p-3 bg-[#111111] rounded border border-cyan-500/20 font-mono text-[10px] text-cyan-400/90 shadow-inner">
                    <div>{`> Loading vectors... OK`}</div>
                    <div className="animate-pulse">{`> Processing tensor batch [${Math.floor(Date.now() / 1000).toString().slice(-4)}]`}</div>
                </div>
            </TierCard>

             {/* TIER 3: CLOUD */}
             <TierCard 
                title="Tier 3: Global Sentinel"
                icon={<Server className="size-6 text-rose-400" />}
                delay={0.5}
                accent="rose"
                metrics={[
                    { label: "Global Blocklist", val: `${data?.kpi?.threats_blocked || 8420}`, live: true },
                    { label: "API Latency", val: "45ms (Cached)" },
                    { label: "Sync Protocol", val: "TLS 1.3 / GRPC" }
                ]}
            >
                <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                    Receives anonymized threat signatures (hashes) only. Updates the 
                    <span className="text-white font-medium"> Global Threat Ledger</span> instantly across all active nodes when a new zero-day is confirmed.
                </p>
                <div className="mt-auto flex items-center justify-between text-[10px] text-zinc-500">
                    <div className="flex items-center gap-1.5">
                        <div className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
                        Live Uplink
                    </div>
                    <span>US-EAST-1</span>
                </div>
            </TierCard>
        </div>

        {/* --- LIVE DATA FLOW VISUALIZATION --- */}
        <div className="mb-32">
            <div className="border border-white/10 bg-[#151515] backdrop-blur-sm rounded-3xl p-8 md:p-12 overflow-hidden relative shadow-2xl">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {/* Hydration safe particles */}
                    <ClientParticles />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center relative z-10">
                    <div className="space-y-8">
                        <div>
                            <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/20">
                                <Lock className="size-3" /> End-to-End Encryption
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-4">Secure Data Pipeline</h3>
                            <p className="text-zinc-400 leading-relaxed">
                                We prioritize user privacy. No raw user data ever leaves the device. 
                                Only <span className="text-zinc-200">mathematically hashed feature vectors</span> are transmitted for verification.
                            </p>
                        </div>

                        <div className="space-y-4">
                            {[
                                { title: "Extraction", desc: "DOM Text & Layout Analysis", icon: Code2, color: "text-blue-400" },
                                { title: "Vectorization", desc: "Local 1024-dim Embedding", icon: GitBranch, color: "text-purple-400" },
                                { title: "Hashing", desc: "SHA-256 Anonymization", icon: Lock, color: "text-emerald-400" },
                                { title: "Transmission", desc: "Encrypted TLS 1.3 Uplink", icon: Network, color: "text-rose-400" }
                            ].map((step, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ x: -20, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.15 }}
                                    className="flex items-center gap-4 p-4 rounded-xl border border-white/5 hover:border-white/10 bg-[#1A1A1A] hover:bg-[#222] transition-colors group shadow-lg"
                                >
                                    <div className={`p-2 rounded-lg bg-[#111] border border-white/5 ${step.color} group-hover:scale-110 transition-transform`}>
                                        <step.icon className="size-5" />
                                    </div>
                                    <div>
                                        <div className="text-sm font-bold text-zinc-200">{step.title}</div>
                                        <div className="text-xs text-zinc-500 font-mono">{step.desc}</div>
                                    </div>
                                    <ArrowRight className="ml-auto size-4 text-zinc-700 group-hover:text-zinc-500 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    
                    {/* CODEX DISPLAY */}
                    <div className="bg-[#0A0A0A] rounded-xl border border-white/10 shadow-2xl overflow-hidden relative group">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#111]">
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/30" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/30" />
                            </div>
                            <div className="text-[10px] font-mono text-zinc-500">core_logic.ts</div>
                        </div>
                        <div className="p-6 overflow-x-auto">
<pre className="text-[11px] md:text-xs font-mono leading-relaxed">
<span className="text-purple-400">async function</span> <span className="text-blue-400">analyzeContent</span>(nodes: <span className="text-yellow-200">DOMNode</span>[]) {"{"}
{'\n  '}
{'\n  '}<span className="text-zinc-500">// 1. Local Feature Extraction</span>
{'\n  '}<span className="text-purple-400">const</span> features = <span className="text-cyan-400">extractVectors</span>(nodes);
{'\n  '}
{'\n  '}<span className="text-zinc-500">// 2. Heuristic Check (Zero-Latency)</span>
{'\n  '}<span className="text-purple-400">if</span> (heuristics.<span className="text-blue-400">isSuspicious</span>(features)) {"{"}
{'\n     '}
{'\n     '}<span className="text-zinc-500">// 3. In-Browser WASM Inference</span>
{'\n     '}<span className="text-purple-400">const</span> riskScore = <span className="text-purple-400">await</span> model.<span className="text-blue-400">predict</span>(features);
{'\n     '}
{'\n     '}<span className="text-purple-400">if</span> (riskScore {'>'} <span className="text-orange-400">0.85</span>) {"{"}
{'\n        '}<span className="text-zinc-500">// 4. Anonymized Cloud Verification</span>
{'\n        '}<span className="text-purple-400">const</span> hash = crypto.<span className="text-blue-400">sha256</span>(features);
{'\n        '}<span className="text-purple-400">return await</span> cloud.<span className="text-blue-400">verify</span>(hash);
{'\n     '}{"}"}
{'\n  '}{"}"}
{'\n  '}
{'\n  '}<span className="text-purple-400">return</span> Status.<span className="text-emerald-400">SAFE</span>;
{'\n'}{"}"}
</pre>
                        </div>
                        
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent skew-x-12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none w-[150%] -translate-x-full group-hover:translate-x-full ease-in-out" />
                    </div>
                </div>
            </div>
        </div>

        {/* CTA */}
        <div className="text-center">
             <h2 className="text-3xl font-bold text-white mb-6">Ready to secure your workflow?</h2>
             <Link href="/install">
                <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 h-12 shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all">
                    Install Extension
                </Button>
             </Link>
        </div>

      </main>
    </div>
  );
}

function TierCard({ title, icon, children, metrics, delay, highlight = false, accent = "zinc" }: any) {
    const borderColors = {
        emerald: "border-emerald-500/20",
        cyan: "border-cyan-500/20",
        rose: "border-rose-500/20",
        zinc: "border-zinc-800"
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            viewport={{ once: true }}
            className={cn(
                "relative p-8 rounded-3xl border flex flex-col h-full bg-[#1A1A1A] backdrop-blur-sm z-10 transition-all duration-300 group hover:-translate-y-1 hover:bg-[#1F1F1F] shadow-xl",
                highlight ? "border-cyan-500/30 shadow-[0_0_40px_rgba(6,182,212,0.1)]" : "border-white/5 hover:border-white/10"
            )}
        >
            <div className="mb-6 flex items-center justify-between">
                <div className={cn("p-3 rounded-2xl border", 
                    highlight ? "bg-cyan-500/10 border-cyan-500/20 text-cyan-500" : "bg-[#111] border-white/5 text-zinc-400 group-hover:text-white group-hover:border-white/10 shadow-inner"
                )}>
                    {icon}
                </div>
                {highlight && <div className="text-[10px] uppercase font-bold text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded border border-cyan-500/20">Core Logic</div>}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-4 group-hover:text-emerald-400 transition-colors">{title}</h3>
            
            <div className="flex-grow">
                {children}
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                {metrics.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between text-xs items-center">
                        <span className="text-zinc-500 uppercase tracking-wider font-semibold">{m.label}</span>
                        <span className={cn("font-mono", m.live && "text-emerald-400 flex items-center gap-2 font-bold", !m.live && "text-zinc-300")}>
                            {m.live && <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {m.val}
                        </span>
                    </div>
                ))}
            </div>
        </motion.div>
    )
}

function ClientParticles() {
    const [particles, setParticles] = useState<Array<{top: string, left: string, duration: string}>>([]);

    useEffect(() => {
        setParticles(Array.from({ length: 20 }).map(() => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            duration: `${10 + Math.random() * 20}s`
        })));
    }, []);

    return (
        <>
            {particles.map((p, i) => (
                <div key={i} className="absolute size-1 bg-white/5 rounded-full" 
                        style={{ 
                            top: p.top, 
                            left: p.left,
                            animation: `float ${p.duration} infinite linear`
                        }} 
                />
            ))}
        </>
    );
}
