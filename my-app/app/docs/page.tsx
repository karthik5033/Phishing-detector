"use client";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Book, Code, Terminal, Shield, Download, Lock, 
  HelpCircle, ChevronRight, ExternalLink, Globe, 
  Key, Hash, Cpu, Zap, Activity, Filter, Info, 
  AlertCircle, CheckCircle2, Search as SearchIcon
} from "lucide-react";
import Link from "next/link";

const sidebarItems = [
  { group: "Foundation", items: [
    { name: "Executive Overview", icon: <Book className="w-4 h-4" />, href: "#overview" },
    { name: "Core Architecture", icon: <Globe className="w-4 h-4" />, href: "#architecture" },
    { name: "Deployment Protocols", icon: <Download className="w-4 h-4" />, href: "#deployment" },
  ]},
  { group: "Detection Engine", items: [
    { name: "Heuristic Signals", icon: <Activity className="w-4 h-4" />, href: "#signals" },
    { name: "ML Behavioral Model", icon: <Cpu className="w-4 h-4" />, href: "#ml-model" },
    { name: "Threat Taxonomies", icon: <Filter className="w-4 h-4" />, href: "#taxonomies" },
  ]},
  { group: "Security & Privacy", items: [
    { name: "Encryption Standards", icon: <Lock className="w-4 h-4" />, href: "#encryption" },
    { name: "Compliance (GDPR)", icon: <CheckCircle2 className="w-4 h-4" />, href: "#compliance" },
    { name: "Transparency Log", icon: <Hash className="w-4 h-4" />, href: "#transparency" },
  ]},
  { group: "API Integration", items: [
    { name: "Authentication", icon: <Key className="w-4 h-4" />, href: "#auth" },
    { name: "REST API v1.2", icon: <Terminal className="w-4 h-4" />, href: "#api-ref" },
    { name: "Error Codes", icon: <AlertCircle className="w-4 h-4" />, href: "#errors" },
  ]}
];

const subSections = [
  { id: "overview", label: "Overview" },
  { id: "architecture", label: "Architecture" },
  { id: "signals", label: "Analysis Signals" },
  { id: "ml-model", label: "ML Logic" },
  { id: "api-ref", label: "API Reference" },
  { id: "encryption", label: "Security Specs" },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: "-100px 0px -50% 0px" }
    );

    subSections.forEach((sub) => {
      const el = document.getElementById(sub.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white selection:bg-slate-900 selection:text-white">
      {/* Executive Top Border / Progress */}
      <div className="h-px w-full bg-slate-100 fixed top-0 z-50 bg-white border-b border-slate-200">
         <div className="max-w-7xl mx-auto h-12 flex items-center px-6 lg:px-12 justify-between">
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <Shield className="w-3 h-3" />
                <span>Sentinel Documentation</span>
                <span className="mx-2 text-slate-200">/</span>
                <span className="text-slate-900">v2.1.0-STABLE</span>
            </div>
            <div className="hidden md:flex items-center gap-4">
                <button className="text-[10px] font-bold text-slate-400 hover:text-slate-900 transition-colors uppercase">Status: Operational</button>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 flex pt-28 pb-32">
        {/* LEFT SIDEBAR: Global Navigation */}
        <aside className="w-64 hidden xl:block sticky top-32 h-[calc(100vh-160px)] pr-8 overflow-y-auto no-scrollbar border-r border-slate-100">
          <div className="space-y-12">
            {sidebarItems.map((group, idx) => (
              <div key={idx}>
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-6">{group.group}</h4>
                <ul className="space-y-1">
                  {group.items.map((item, i) => (
                    <li key={i}>
                      <a 
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-[13px] font-medium group ${
                          activeSection === item.href.slice(1) 
                          ? "text-slate-900 bg-slate-50 border border-slate-200/50" 
                          : "text-slate-500 hover:text-slate-900 hover:bg-slate-50/50"
                        }`}
                      >
                        <span className={`transition-colors ${activeSection === item.href.slice(1) ? "text-slate-900" : "text-slate-300 group-hover:text-slate-500"}`}>
                           {item.icon}
                        </span>
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* MAIN ULTIMATE CONTENT */}
        <main className="flex-1 lg:px-12 xl:px-16 min-w-0">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-12">
             <Link href="/" className="hover:text-slate-900 transition-colors">Home</Link>
             <ChevronRight className="w-3 h-3" />
             <span className="text-slate-900">Developer Portal</span>
          </nav>

          <article className="prose prose-slate max-w-none prose-headings:font-medium prose-headings:tracking-tight prose-p:text-slate-600 prose-p:leading-relaxed">
            
            {/* Header / Intro */}
            <header className="mb-24">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900 text-[10px] font-bold uppercase tracking-widest mb-8 border border-slate-200"
              >
                <Zap className="w-3 h-3" />
                <span>Executive Technical Whitepaper</span>
              </motion.div>
              <h1 className="text-6xl lg:text-8xl font-semibold text-slate-900 tracking-tighter mb-10 leading-[0.85]">
                Sentinel <br />
                <span className="text-slate-400">Security Engine.</span>
              </h1>
              <p className="text-2xl text-slate-500 font-light max-w-3xl leading-relaxed">
                A highly optimized, multi-threaded detection pipeline designed to neutralize social engineering via the browser runtime. Built for security architects and elite engineering teams.
              </p>
            </header>

            {/* Overview Section */}
            <section id="overview" className="mb-32 scroll-mt-32">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-1.5 h-10 bg-slate-900 rounded-full" />
                 <h2 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Technical Overview</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                 <div>
                    <p className="text-lg text-slate-600 leading-[1.8]">
                      SecureSentinel represents a paradigm shift in endpoint protection. Unlike traditional blocklist-based filters that rely on stale reactive data, Sentinel uses <strong>Predictive Behavioral Baselines</strong> to identify malicious intent as it manifests in the DOM.
                    </p>
                 </div>
                 <div className="p-8 rounded-[32px] bg-slate-50 border border-slate-100 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-200/50 rounded-full blur-[60px] translate-x-12 -translate-y-12" />
                    <h4 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-2">
                       <Activity className="w-4 h-4" /> 
                       Key Capabilities
                    </h4>
                    <ul className="space-y-4 m-0 p-0 list-none">
                       {[
                         "Real-time DOM mutation monitoring",
                         "ML-based linguistic urgency scoring",
                         "Sub-150ms cloud verification",
                         "Automatic PII sanitization",
                         "E2EE threat logging & telemetry"
                       ].map((cap, i) => (
                         <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                            <CheckCircle2 className="w-4 h-4 text-slate-900" />
                            {cap}
                         </li>
                       ))}
                    </ul>
                 </div>
              </div>
            </section>

            {/* Architecture Section */}
            <section id="architecture" className="mb-32 scroll-mt-32">
               <div className="flex items-center gap-4 mb-10">
                 <div className="w-1.5 h-10 bg-slate-200 rounded-full" />
                 <h2 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight italic">N-Tier Architecture</h2>
              </div>
              <p className="text-slate-500 mb-12 max-w-2xl">
                The Sentinel ecosystem is distributed across three distinct execution layers to balance performance, privacy, and detection depth.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative">
                 <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-100 hidden lg:block -translate-y-1/2 -z-10" />
                 {[
                   { 
                     name: "Layer 01: The Edge", 
                     desc: "Local heuristics and pattern matching. Operates within the browser tab runtime with zero external calls.",
                     tech: "Content Scripts / SharedWorkers"
                   },
                   { 
                     name: "Layer 02: Analysis", 
                     desc: "Proprietary Logistic Regression pipelines performing high-speed linguistic verification.",
                     tech: "FastAPI / PyTorch Runtime" 
                   },
                   { 
                     name: "Layer 03: Intelligence", 
                     desc: "Authenticated pings to the Global Threat Intelligence (GTI) database for confirmed confirmation.",
                     tech: "SQL / Redis Cache Cluster"
                   }
                 ].map((layer, i) => (
                   <div key={i} className="bg-white border border-slate-200 p-8 rounded-[40px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Execution Stack / {i+1}</div>
                      <h4 className="text-lg font-bold text-slate-900 mb-4">{layer.name}</h4>
                      <p className="text-[13px] text-slate-500 leading-relaxed mb-6">{layer.desc}</p>
                      <div className="inline-block px-3 py-1 rounded-full bg-slate-900 text-white text-[9px] font-mono font-bold">{layer.tech}</div>
                   </div>
                 ))}
              </div>
            </section>

            {/* Analysis Signals Section */}
            <section id="signals" className="mb-32 scroll-mt-32">
               <div className="flex items-center gap-4 mb-10">
                 <div className="w-1.5 h-10 bg-slate-900 rounded-full" />
                 <h2 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">Linguistic & Temporal Signals</h2>
              </div>
              <p className="text-slate-600 mb-12">Our engine analyzes over 50 specific feature signals to compute a unified Risk Score (0.0 to 1.0).</p>
              
              <div className="overflow-hidden rounded-[32px] border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 m-0 border-collapse">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-900">Signal Category</th>
                      <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-900">Indicator Example</th>
                      <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest font-bold text-slate-900">Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 italic font-medium">
                    {[
                      { cat: "Typosquatting", ind: "Levenshtein distance <= 2 to Top Brands", w: "High (0.85)" },
                      { cat: "Linguistic Sentiment", ind: "Urgency tokens + Fear-based imperatives", w: "Critical (0.92)" },
                      { cat: "Metadata Symmetry", ind: "Title/URL mismatches in DOM headers", w: "Medium (0.45)" },
                      { cat: "Temporal Velocity", ind: "Form submission within < 2s of page load", w: "Medium (0.50)" },
                      { cat: "DNS Origin", ind: "TLD Age < 48h since registration", w: "High (0.78)" },
                    ].map((row, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm text-slate-900 font-bold">{row.cat}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{row.ind}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-900">{row.w}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* API Reference */}
            <section id="api-ref" className="mb-32 scroll-mt-32">
              <div className="flex items-center gap-4 mb-10">
                 <div className="w-1.5 h-10 bg-slate-200 rounded-full" />
                 <h2 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight">API Interface v1.2</h2>
              </div>
              
              <div className="space-y-12">
                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      POST /api/v1/analyze
                   </h4>
                   <p className="text-sm text-slate-500 mb-6">Executes a full deep-scan of the provided text chunk using our ML pipeline.</p>
                   <div className="rounded-2xl border border-slate-200 bg-slate-900 overflow-hidden">
                      <div className="px-6 py-3 border-b border-slate-800 flex justify-between items-center text-[10px] font-mono font-bold text-slate-500 uppercase">
                         <span>JSON REQUEST</span>
                         <span className="text-slate-700 font-normal italic lowercase underline">application/json</span>
                      </div>
                      <div className="p-8">
                         <pre className="text-xs text-slate-400 font-mono italic leading-[1.8] m-0">
                           {`{`} <br />
                           {"  "}<span className="text-emerald-400">"text_chunk"</span>: <span className="text-sky-300">"Urgent: Your account will be locked in 5 minutes..."</span>, <br />
                           {"  "}<span className="text-emerald-400">"domain"</span>: <span className="text-sky-300">"security-update-91.com"</span>, <br />
                           {"  "}<span className="text-emerald-400">"is_extension"</span>: <span className="text-indigo-400">true</span> <br />
                           {`}`}
                         </pre>
                      </div>
                   </div>
                </div>

                <div>
                   <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400" />
                      RESPONSE SCHEMA
                   </h4>
                   <div className="rounded-2xl border border-slate-200 bg-slate-50 p-8 italic">
                      <pre className="text-xs text-slate-600 font-mono leading-[1.8] m-0">
                        {`{`} <br />
                        {"  "}<span className="text-slate-900 font-bold">"risk_score"</span>: 0.941, <br />
                        {"  "}<span className="text-slate-900 font-bold">"verdict"</span>: "CRITICAL_PHISH", <br />
                        {"  "}<span className="text-slate-900 font-bold">"triggers"</span>: ["typosquatting", "low_tld_age", "urgency_intent"] <br />
                        {`}`}
                      </pre>
                   </div>
                </div>
              </div>
            </section>

            {/* Errors Section */}
            <section id="errors" className="mb-32">
               <div className="p-8 rounded-[40px] bg-slate-900 text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]" />
                  <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                     <AlertCircle className="w-5 h-5 text-rose-400" />
                       Standard Error States
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-mono text-slate-400 leading-relaxed">
                     <div className="p-6 border border-white/10 rounded-2xl">
                        <span className="text-rose-400 block mb-2 font-bold uppercase tracking-widest">429 - Quota Exceeded</span>
                        Requested tokens per minute (TPM) exceeded the global limit for this key. Fallback rotation initiated.
                     </div>
                     <div className="p-6 border border-white/10 rounded-2xl">
                        <span className="text-amber-400 block mb-2 font-bold uppercase tracking-widest">403 - Domain Blacklisted</span>
                        The requesting origin domain is currently undergoing human-review for security compliance violations.
                     </div>
                  </div>
               </div>
            </section>

            {/* Enterprise Security Standards */}
            <section id="encryption" className="mb-32 scroll-mt-32">
               <div className="flex items-center gap-4 mb-10">
                 <div className="w-1.5 h-10 bg-slate-900 rounded-full" />
                 <h2 className="text-3xl font-semibold text-slate-900 m-0 tracking-tight italic">Technical Security Assurance</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                 <div className="space-y-8">
                    <p className="text-lg text-slate-500 font-light">
                      Sentinel employs a defense-in-depth strategy for data preservation and transport. We maintain a strict Zero-Trust policy across all nodes.
                    </p>
                    <div className="flex items-center gap-5 p-6 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-default">
                       <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 flex-none"><Lock className="w-5 h-5" /></div>
                       <div>
                          <div className="text-sm font-bold text-slate-900 mb-1 italic tracking-tight">AES-256-GCM Encryption</div>
                          <p className="text-xs text-slate-500 m-0">Stored threat snapshots are encrypted using authenticated locally-derived keys.</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-5 p-6 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors cursor-default">
                       <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 flex-none"><Shield className="w-5 h-5" /></div>
                       <div>
                          <div className="text-sm font-bold text-slate-900 mb-1 italic tracking-tight">E2EE Data Ingestion</div>
                          <p className="text-xs text-slate-500 m-0">All telemetry pings use mutual TLS 1.3 with rigorous certificate pinning protocols.</p>
                       </div>
                    </div>
                 </div>
                 <div className="relative group">
                    <div className="absolute inset-0 bg-slate-900 rounded-[50px] scale-95 blur-2xl opacity-10 group-hover:opacity-20 transition-all" />
                    <div className="relative bg-white border-[0.5px] border-slate-200 p-12 rounded-[50px] shadow-2xl">
                       <div className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em] mb-8">Security Scorecard</div>
                       <div className="space-y-6">
                          {[
                            { label: "Data Leak Protection", score: 99.9 },
                            { label: "AI Decision Integrity", score: 98.4 },
                            { label: "System Uptime", score: 99.99 },
                            { label: "Encryption Grade", score: 100 }
                          ].map((s, i) => (
                            <div key={i}>
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-[11px] font-bold text-slate-900 italic tracking-tighter uppercase">{s.label}</span>
                                  <span className="text-[11px] font-mono text-slate-400">{s.score}%</span>
                               </div>
                               <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${s.score}%` }}
                                    transition={{ duration: 1, delay: i * 0.1 }}
                                    className="h-full bg-slate-900" 
                                  />
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>
            </section>

          </article>
        </main>

        {/* RIGHT SIDEBAR: "ON THIS PAGE" Navigation */}
        <aside className="w-48 hidden 2xl:block sticky top-32 h-fit pl-8 border-l border-slate-100 italic">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 border-b border-slate-50 pb-4">On This Page</div>
          <ul className="space-y-4">
            {subSections.map((sub, i) => (
              <li key={i}>
                 <a 
                   href={`#${sub.id}`} 
                   className={`text-[11px] font-medium transition-all flex items-center gap-2 group underline-offset-4 hover:underline ${
                     activeSection === sub.id ? "text-slate-900 font-bold" : "text-slate-400 hover:text-slate-600"
                   }`}
                 >
                   {activeSection === sub.id && <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />}
                   {sub.label}
                 </a>
              </li>
            ))}
          </ul>
          
          <div className="mt-20">
             <div className="text-[9px] font-mono text-slate-300 mb-4 tracking-widest uppercase">Community & Social</div>
             <div className="flex flex-col gap-4 text-[11px] font-medium text-slate-500">
                <a href="#" className="flex items-center gap-2 hover:text-slate-900 transition-colors"><ChevronRight className="w-3 h-3" /> Discord Server</a>
                <a href="#" className="flex items-center gap-2 hover:text-slate-900 transition-colors"><ChevronRight className="w-3 h-3" /> GitHub Repo</a>
                <a href="#" className="flex items-center gap-2 hover:text-slate-900 transition-colors"><ChevronRight className="w-3 h-3" /> System Status</a>
             </div>
          </div>
        </aside>
      </div>

      {/* Floating CTA / Quick Help */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-50"
        >
          {/* We already have the AI Chat Widget here globally from layout.tsx, so we don't need another one. */}
          {/* This is a placeholder for any other doc-specific actions like "Download PDF" */}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Minimal Button Polyfill for Docs
function Button({ children, asChild, className, ...props }: any) {
  const Comp = asChild ? "div" : "button";
  return (
    <Comp className={`inline-flex items-center justify-center font-semibold transition-all ${className}`} {...props}>
      {children}
    </Comp>
  );
}
