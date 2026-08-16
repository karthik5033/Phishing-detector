"use client";

import { motion } from "framer-motion";
import { Link2, ShieldCheck, GitMerge } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CARD 5: QUANTUM DEFENSE
 * Cross-channel correlation engine.
 * 
 * Design Constraints:
 * - Visually aligns with Cards 1-4
 * - Muted palette, NO red, NO sci-fi
 * - Technical, analyst-grade copy
 */
export function QuantumDefense() {
  const signals = [
    { name: "Web → Email Linkage", status: "Correlated" },
    { name: "Message → Login Proximity", status: "Observed" },
    { name: "Identity Request Pattern", status: "Correlated" }
  ];

  return (
    <div className="space-y-6">
      {/* 1. CARD HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link2 className="size-6 text-slate-400" />
            <h3 className="text-xl font-bold text-slate-950">Attack Chain Tracker</h3>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide">Multi-step threat detection engine</p>
        </div>
        <div className="px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
          Searching...
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 space-y-6">
        
        {/* 2. PRIMARY EXPLANATION */}
        <div className="py-2">
          <p className="text-lg text-slate-600 leading-relaxed font-bold italic">
            "One suspicious link might look okay, but when we connect it to a fake email and a login page, we see the full attack."
          </p>
          <p className="text-sm text-slate-400 mt-2 font-medium">
            We track these "dotted lines" to stop hackers before they complete their plan.
          </p>
        </div>

        {/* 3. CORRELATION SIGNALS */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 pb-2">
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Checks</span>
             <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Status</span>
          </div>
          {signals.map((signal, i) => (
            <div 
              key={i} 
              className="group flex items-center justify-between py-3 px-4 rounded-xl bg-zinc-50/50 hover:bg-zinc-100/50 transition-colors duration-200 cursor-default border border-transparent hover:border-zinc-200"
              title={`Correlating ${signal.name} across isolated events`}
            >
              <div className="flex items-center gap-3">
                 <div className={cn(
                    "size-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]",
                    signal.status === "Correlated" ? "bg-emerald-400" : "bg-slate-300"
                 )} />
                 <span className="text-sm font-bold text-slate-700">{signal.name}</span>
              </div>
              
              <span className={cn(
                "text-xs font-black uppercase tracking-wider",
                signal.status === "Correlated" ? "text-emerald-600" : "text-slate-400"
              )}>
                {signal.status}
              </span>
            </div>
          ))}
        </div>

        {/* 4. SYSTEM OUTCOME */}
        <div className="pt-4 border-t border-zinc-100">
          <p className="text-sm text-slate-500 leading-relaxed font-bold">
            Protection is automatically increased when suspicious patterns are found.
          </p>
        </div>
      </div>
    </div>
  );
}
