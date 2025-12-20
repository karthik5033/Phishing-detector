"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";


function SimpleSwitch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) {
    return (
        <button 
            className={cn("w-11 h-6 rounded-full transition-colors relative", checked ? "bg-emerald-500" : "bg-secondary")}
            onClick={() => onCheckedChange(!checked)}
        >
            <div className={cn("w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm", checked ? "left-[22px]" : "left-0.5")} />
        </button>
    )
}

export default function SettingsPage() {
  const [sensitivity, setSensitivity] = useState(50);
  const [autoBlock, setAutoBlock] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Controls & Preferences</h1>
        <p className="text-muted-foreground">Customize how SecureSentinel protects your browsing experience.</p>
      </div>

      {/* Sensitivity */}
      <div className="p-6 rounded-xl border border-border bg-card">
         <h3 className="text-base font-medium mb-1">Detection Sensitivity</h3>
         <p className="text-sm text-muted-foreground mb-6">Adjust how aggressive the AI should be when flagging suspicious content.</p>
         
         <div className="space-y-4">
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={sensitivity} 
                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary" 
            />
            <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wide">
                <span>Conservative</span>
                <span>Balanced</span>
                <span>Aggressive</span>
            </div>
         </div>
      </div>

      {/* Toggles */}
      <div className="p-6 rounded-xl border border-border bg-card space-y-6 divide-y divide-border/50">
          <div className="flex items-center justify-between pt-2">
              <div>
                  <h4 className="font-medium">Auto-Block High Risk</h4>
                  <p className="text-sm text-muted-foreground">Automatically prevent loading of sites with &gt;90% risk score.</p>
              </div>
              <SimpleSwitch checked={autoBlock} onCheckedChange={setAutoBlock} />
          </div>

          <div className="flex items-center justify-between pt-6">
              <div>
                  <h4 className="font-medium">Community Intel Sharing</h4>
                  <p className="text-sm text-muted-foreground">Share anonymized hashes to help protect other users.</p>
              </div>
              <SimpleSwitch checked={dataCollection} onCheckedChange={setDataCollection} />
          </div>
      </div>

      {/* Danger Zone */}
      <div className="p-6 rounded-xl border border-rose-900/20 bg-rose-950/5">
          <h4 className="font-medium text-rose-500 mb-2">Danger Zone</h4>
          <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Reset all learning models and clear local history.</p>
              <button className="px-4 py-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-md text-sm font-medium transition-colors">
                  Reset Data
              </button>
          </div>
      </div>
    </div>
  );
}
