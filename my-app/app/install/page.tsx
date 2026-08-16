"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Chrome, ShieldCheck, Download, FolderOpen, Terminal } from "lucide-react";
import { HeroHeader as Header } from "@/components/landing/header";
import { cn } from "@/lib/utils";

import { motion } from "framer-motion";

export default function InstallPage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Stronger Moving Grid */}
          <motion.div 
             initial={{ backgroundPosition: "0% 0%" }}
             animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
             transition={{ duration: 60, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
             className="absolute inset-0 opacity-[0.6]"
             style={{
                 backgroundImage: "radial-gradient(#94a3b8 1.5px, transparent 1.5px)", // Slate-400 for visibility
                 backgroundSize: "40px 40px"
             }}
          />
          
          {/* Vibrant Glow Blobs */}
          <motion.div 
             animate={{ 
                 x: [100, 200, 250, 400, 25],
                 y: [100, 250, 100, 300, 200],
                 scale: [1, 1.2, 1, 1.1, 1],
                 opacity: [0.4, 0.6, 0.4, 0.7, 0.4], // Higher opacity
                 rotate: [0, 90, 180, 270, 0]
             }}
             transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
             className="absolute -top-20 -left-20 w-[600px] h-[600px] bg-emerald-400/30 rounded-full blur-[100px]" // Darker Emerald
          />
           <motion.div 
             animate={{ 
                 x: [-20, -100, 50, -50],
                 y: [10, -50, 100, 0],
                 scale: [1, 1.3, 1],
             }}
             transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", repeatType: "mirror" }}
             className="absolute top-1/2 right-0 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px]" // Darker Blue
          />

          {/* HOLOGRAPHIC RINGS SYSTEM */}
          {/* Ring 1 - Outer Giant */}
          <motion.div
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full border border-slate-300/30 border-t-transparent border-l-transparent"
             animate={{ rotate: 360 }}
             transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          {/* Ring 2 - Middle Section */}
          <motion.div
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] rounded-full border border-slate-400/20 border-b-transparent border-r-transparent"
             animate={{ rotate: -360 }}
             transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          />
          {/* Ring 3 - Inner Dashed */}
          <motion.div
             className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border-[1px] border-dashed border-emerald-500/20"
             animate={{ rotate: 180 }}
             transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
      </div>

      <Header />
      
      <main className="pt-32 pb-16 px-6 relative z-10">
        <div className="mx-auto max-w-4xl text-center space-y-12">
          
          {/* Hero Content */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1.5 text-[11px] font-black tracking-widest text-emerald-700 uppercase">
                <ShieldCheck className="size-3.5" />
                <span>Enterprise Grade Deployment</span>
            </div>
            <h1 className="text-5xl font-bold tracking-tighter text-slate-950 sm:text-6xl max-w-2xl mx-auto leading-[0.9]">
              Deploy Sentinel <br />
              <span className="text-zinc-500 font-light italic">Instantly</span>
            </h1>
            <p className="text-lg text-slate-500 max-w-lg mx-auto font-light">
              One-click setup for developers and security teams. Professional-grade deployment for any Windows workstation.
            </p>
          </div>

          {/* Installation Card */}
          <div className="group relative mx-auto bg-white border border-slate-200 rounded-[2.5rem] p-12 text-left shadow-2xl shadow-slate-200/40">
            
            {/* Primary Action */}
            <div className="mb-14 text-center space-y-6">
                 <Button size="lg" className="h-20 px-20 rounded-[1.5rem] text-xl bg-zinc-950 text-zinc-50 hover:bg-zinc-900 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] hover:scale-[1.03] active:scale-95 transition-all w-full sm:w-auto relative group overflow-hidden" asChild>
                    <a href="/sentinel_v2.zip" download="Sentinel_Installer.zip">
                        <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Download className="mr-4 size-6 relative z-10" />
                        <span className="relative z-10">Download Sentinel Core</span>
                    </a>
                 </Button>
                 <div className="flex items-center justify-center gap-4">
                    <span className="h-[1px] w-8 bg-zinc-200" />
                    <p className="text-[10px] text-zinc-400 font-black tracking-[0.3em] uppercase">Deployment Build v2.4.9</p>
                    <span className="h-[1px] w-8 bg-zinc-200" />
                 </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8 border-t border-zinc-100 pt-16 text-left">
                
                {/* Step 1: Prep */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-50 p-10 transition-all hover:bg-white hover:shadow-xl border border-zinc-100">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="size-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
                            <FolderOpen size={24} className="text-zinc-600 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <span className="text-6xl font-black text-zinc-100 select-none">01</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-zinc-950 tracking-tight">Prepare Environment</h3>
                    <div className="space-y-4 text-base text-zinc-500 font-medium leading-relaxed">
                        <p>Extract <code className="font-mono text-zinc-900 font-bold bg-white px-2 py-0.5 rounded border border-zinc-200">sentinel_v2.zip</code> to a safe folder.</p>
                        <div className="bg-white rounded-xl p-4 border border-zinc-200/50 shadow-sm">
                             <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider mb-1">Recommended Path</p>
                             <code className="text-xs text-emerald-700 font-bold font-mono block break-all">C:\Users\You\Documents\Sentinel</code>
                        </div>
                    </div>
                </div>

                {/* Step 2: Extensions Page */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-50 p-10 transition-all hover:bg-white hover:shadow-xl border border-zinc-100">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="size-14 rounded-2xl bg-white border border-zinc-200 flex items-center justify-center text-zinc-900 shadow-sm">
                            <Chrome size={24} className="text-zinc-600 group-hover:text-emerald-600 transition-colors" />
                        </div>
                        <span className="text-6xl font-black text-zinc-100 select-none">02</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-zinc-950 tracking-tight">Developer Mode</h3>
                    <div className="space-y-4 text-base text-zinc-500 font-medium leading-relaxed">
                        <p>Go to chrome settings or type <code className="bg-white border border-zinc-200 px-2 py-1 rounded text-sm select-all font-mono font-bold text-zinc-900 mx-1">chrome://extensions</code></p>
                        <div className="flex items-center gap-3 bg-emerald-50/50 px-4 py-3 rounded-xl border border-emerald-100/50 w-full transition-colors group-hover:bg-emerald-50">
                             <div className="w-8 h-5 rounded-full bg-emerald-500 relative shadow-sm shrink-0">
                                <div className="absolute right-0.5 top-0.5 size-4 bg-white rounded-full shadow-sm" />
                             </div>
                             <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Toggle "Developer mode"</span>
                        </div>
                    </div>
                </div>

                {/* Step 3: Load */}
                <div className="group relative overflow-hidden rounded-3xl bg-zinc-50 p-10 transition-all hover:bg-white hover:shadow-xl border border-zinc-100">
                   <div className="mb-6 flex items-center justify-between">
                        <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-white shadow-xl shadow-zinc-900/10">
                            <Terminal size={24} className="text-emerald-400" />
                        </div>
                        <span className="text-6xl font-black text-zinc-100 select-none">03</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-zinc-950 tracking-tight">Load Unpacked</h3>
                    <div className="space-y-4 text-base text-zinc-500 font-medium leading-relaxed">
                        <p>Click <strong className="text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-sm">Load unpacked</strong> (top left) and select your extracted folder.</p>
                        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400">
                             <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                             <span>Extension activates instantly</span>
                        </div>
                    </div>
                </div>

                 {/* Step 4: Verify */}
                 <div className="group relative overflow-hidden rounded-3xl bg-zinc-50 p-10 transition-all hover:bg-white hover:shadow-xl border border-zinc-100">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="size-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <ShieldCheck size={26} />
                        </div>
                        <span className="text-6xl font-black text-zinc-100 select-none">04</span>
                    </div>
                    <h3 className="mb-3 text-2xl font-bold text-zinc-950 tracking-tight">Pin & Secure</h3>
                    <div className="space-y-4 text-base text-zinc-500 font-medium leading-relaxed">
                        <p>Click the <span className="inline-flex size-6 items-center justify-center bg-white border border-zinc-200 rounded text-sm mx-1 shadow-sm">🧩</span> icon and <strong className="text-emerald-600">Pin</strong> Sentinel.</p>
                        <Button variant="outline" className="w-full rounded-xl border-2 border-zinc-100 hover:border-emerald-100 hover:bg-emerald-50/50 hover:text-emerald-700 transition-all font-bold" asChild>
                            <Link href="/dashboard">Open Dashboard &rarr;</Link>
                        </Button>
                    </div>
                </div>

            </div>
          </div>

          <div className="pt-8">
             <Link href="/" className="text-sm text-slate-500 hover:text-blue-600 hover:underline transition-colors">
                Need help? View Documentation &rarr;
             </Link>
          </div>

        </div>
      </main>
    </div>
  );
}
