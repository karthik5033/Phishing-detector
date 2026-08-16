import React from "react";
import { cn } from "@/lib/utils";

export const Logo = ({ className }: { className?: string }) => {
  return (
    <div className={cn("flex items-center gap-2.5 font-bold text-xl tracking-tight text-slate-900", className)}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20">
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-5 w-5 text-white"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>
      <span>Sentinel</span>
    </div>
  );
};

export const LogoIcon = ({ className }: { className?: string }) => {
    return (
      <div className={cn("relative flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-slate-900/20", className)}>
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="h-5 w-5 text-white"
        >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            <path d="m9 12 2 2 4-4" />
        </svg>
        <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10" />
      </div>
    )
}
