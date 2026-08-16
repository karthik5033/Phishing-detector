"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Lock, Shield, ArrowRight, User } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full bg-zinc-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Dynamic Background Grid (Matches Landing) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Floating Gradient Orbs (Subtle) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6 group cursor-pointer">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-zinc-200 shadow-sm group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10 transition-all">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-zinc-900 tracking-tight">
              Sentinel
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Welcome Back</h1>
          <p className="text-zinc-500 text-sm">Authenticate to access your defense dashboard.</p>
        </div>

        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="bg-white/80 backdrop-blur-xl border border-white/40 ring-1 ring-zinc-200/50 rounded-2xl p-8 shadow-2xl shadow-zinc-200/50 relative overflow-hidden group"
        >
          {/* Decorative Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500/40 via-emerald-500 to-emerald-500/40 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
          
          <form className="space-y-6 relative z-10" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Identity</label>
              <div className="relative group/input">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-emerald-500 transition-colors" />
                <input 
                  type="email" 
                  placeholder="agent@sentinel.ai"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-zinc-400 shadow-sm focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider ml-1">Passcode</label>
              <div className="relative group/input">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within/input:text-emerald-500 transition-colors" />
                <input 
                  type="password" 
                  placeholder="••••••••••••"
                  className="w-full bg-zinc-50/50 border border-zinc-200 rounded-lg py-3 pl-10 pr-4 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all placeholder:text-zinc-400 shadow-sm focus:bg-white"
                />
              </div>
            </div>

            <Link href="/dashboard" className="w-full block">
              <Button 
                className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-6 rounded-lg transition-all duration-300 shadow-lg shadow-zinc-900/10 hover:shadow-xl hover:shadow-zinc-900/20 active:scale-[0.98]"
              >
                Initialize Session
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-zinc-100">
            <p className="text-xs text-zinc-500">
              New to Sentinel?{" "}
              <Link href="/install" className="text-emerald-600 hover:text-emerald-500 font-medium transition-colors hover:underline underline-offset-4">
                Establish Protocol
              </Link>
            </p>
          </div>
        </motion.div>

        <div className="mt-6 text-center">
           <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100/80 border border-zinc-200/50">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
             <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
               Secured by Sentinel Core
             </p>
           </div>
        </div>
      </motion.div>
    </div>
  );
}
