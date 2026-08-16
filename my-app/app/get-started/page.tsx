"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Shield, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GetStartedPage() {
  const [selectedPlan, setSelectedPlan] = useState<"observer" | "guardian">("guardian");

  return (
    <div className="min-h-screen w-full bg-zinc-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Ambience matches Landing */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
      
      {/* Subtle Light Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-5xl w-full z-10">
        <div className="text-center mb-12">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group cursor-pointer">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-zinc-200 shadow-sm group-hover:border-emerald-500/30 group-hover:shadow-emerald-500/10 transition-all">
              <Shield className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-zinc-900">Sentinel</span>
          </Link>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-bold text-zinc-900 mb-4 tracking-tight"
          >
            Choose Your Protocol
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-500 max-w-xl mx-auto text-lg font-light"
          >
            Select the level of autonomous protection required for your digital environment.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Free Plan */}
          <PlanCard
            type="observer"
            title="Observer"
            price="$0"
            description="Essential surveillance for individual agents."
            features={[
              "Real-time Threat Detection",
              "Basic Phishing Analysis",
              "Single Device Protection",
              "Standard Community Support"
            ]}
            selected={selectedPlan === "observer"}
            onSelect={() => setSelectedPlan("observer")}
            delay={0.2}
          />

          {/* Pro Plan */}
          <PlanCard
            type="guardian"
            title="Guardian"
            price="$12"
            period="/month"
            description="Full-spectrum defense for high-value targets."
            features={[
              "AI-Powered Predictive Defense",
              "Deep URL Forensics",
              "Priority Analysis Queue",
              "Multi-Device Synchronization",
              "API Access (10k req/mo)",
              "24/7 Dedicated Uplink"
            ]}
            selected={selectedPlan === "guardian"}
            onSelect={() => setSelectedPlan("guardian")}
            popular
            delay={0.3}
          />
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Link href="/dashboard">
            <Button 
              className="bg-zinc-900 hover:bg-zinc-800 text-white px-10 py-7 text-lg rounded-full shadow-2xl shadow-zinc-900/20 hover:shadow-zinc-900/30 transition-all duration-300 group hover:scale-105 active:scale-95"
            >
              Initiate {selectedPlan === "guardian" ? "Guardian" : "Observer"} Protocol
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <p className="mt-6 text-sm text-zinc-500">
            Already have an active directive? <Link href="/login" className="text-emerald-600 hover:text-emerald-500 font-medium hover:underline underline-offset-4">Re-authenticate here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function PlanCard({ 
  type, 
  title, 
  price, 
  period, 
  description, 
  features, 
  selected, 
  onSelect, 
  popular,
  delay 
}: { 
  type: string, 
  title: string, 
  price: string, 
  period?: string, 
  description: string, 
  features: string[], 
  selected: boolean, 
  onSelect: () => void, 
  popular?: boolean,
  delay: number
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      onClick={onSelect}
      className={cn(
        "relative rounded-2xl p-8 cursor-pointer transition-all duration-300 border-2",
        selected 
          ? "bg-white border-emerald-500/50 shadow-2xl shadow-emerald-500/10 scale-[1.02] z-10" 
          : "bg-white/80 border-transparent hover:border-zinc-200 hover:shadow-lg hover:shadow-zinc-200 scale-100"
      )}
    >
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-lg">
          Recommended
        </div>
      )}

      {selected && (
        <div className="absolute top-4 right-4 text-emerald-500">
          <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center border border-emerald-200">
            <Check className="w-4 h-4" />
          </div>
        </div>
      )}

      <div className="mb-6">
        <h3 className={cn("text-xl font-bold mb-2", selected ? "text-zinc-900" : "text-zinc-700")}>{title}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-zinc-900 tracking-tight">{price}</span>
          {period && <span className="text-zinc-500 text-sm font-normal">{period}</span>}
        </div>
        <p className="text-zinc-500 text-sm mt-4 min-h-[40px] leading-relaxed">{description}</p>
      </div>

      <div className="space-y-4">
        {features.map((feature, i) => (
          <div key={i} className="flex items-start gap-3">
            <Check className={cn("w-5 h-5 shrink-0 mt-0.5", selected ? "text-emerald-500" : "text-zinc-400")} />
            <span className={cn("text-sm", selected ? "text-zinc-700 font-medium" : "text-zinc-500")}>{feature}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
