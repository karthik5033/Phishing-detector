"use client";

import { motion } from "framer-motion";
import { Brain, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CARD 4: COGNITIVE SHIELD
 * Human-centric protection layer adapting to user cognitive load.
 * 
 * Design Constraints:
 * - Visually aligns with Cards 1-3
 * - Muted palette, NO red, NO alert styling
 * - Text-first state indication
 * - Supportive, neutral tone
 */
export interface CognitiveShieldProps {
  status?: {
    level: number;
    status: string;
    triggers: string[];
  } | null;
}

export function CognitiveShield({ status }: CognitiveShieldProps) {
  // Default fallback if no data yet (Loading or offline)
  const currentStatus = status?.status || "Normal";
  const currentLevel = status?.level || 0.1;
  const activeTriggers = status?.triggers || [];

  return (
    <div className="space-y-6">
      {/* 1. CARD HEADER */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="size-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-950">Cognitive Shield</h3>
          </div>
          <p className="text-[10px] text-slate-500 font-medium tracking-wide">Adaptive interface protection</p>
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors duration-500",
          currentStatus === "Elevated" || currentStatus === "Maximal" 
            ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
            : "bg-zinc-50 border-zinc-200 text-slate-500"
        )}>
          {currentStatus === "Maximal" ? "Shield Active" : "Adaptive"}
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-50 to-white border border-zinc-200 space-y-6">
        
        {/* 2. PRIMARY STATE INDICATOR */}
        <div className="flex flex-col items-center justify-center py-2 space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Current Status</p>
          <motion.div 
            key={currentStatus}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <span className={cn(
              "text-xl font-bold tracking-tight transition-colors duration-500",
              currentStatus === "Maximal" ? "text-emerald-600" : "text-slate-700"
            )}>
              Cognitive Load: {currentStatus}
            </span>
          </motion.div>
        </div>

        {/* 3. ACTIVE SIGNALS (Real Data) */}
        <div className="space-y-1">
          {activeTriggers.length > 0 ? (
            activeTriggers.map((trigger, i) => (
              <div 
                key={i} 
                className="group flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50/50 hover:bg-zinc-100/50 transition-colors duration-200"
              >
                <span className="text-[11px] font-medium text-slate-600">{trigger}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Detected</span>
                  <div className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            ))
          ) : (
            // Empty State (Optimal)
             <div className="py-3 text-center border border-dashed border-zinc-200 rounded-lg">
                <span className="text-[10px] text-zinc-400 font-medium">No stress signals detected</span>
             </div>
          )}
        </div>

        {/* 4. SYSTEM RESPONSE SUMMARY */}
        <div className="pt-4 border-t border-zinc-100">
          <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
            {currentLevel > 0.5 
              ? "System is currently suppressing secondary alerts to reduce cognitive load."
              : "Monitoring interaction density for signs of fatigue or decision stress."}
          </p>
        </div>
      </div>
    </div>
  );
}
