"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldAlert,
  Clock,
  User,
  Brain,
  Link as LinkIcon,
  Globe,
  Zap
} from "lucide-react";
import { motion } from "framer-motion";

const GlitchText = ({ text }: { text: string }) => {
  const [displayText, setDisplayText] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const scramble = () => {
      let iteration = 0;
      clearInterval(interval);
      
      interval = setInterval(() => {
        setDisplayText(prev => 
            text.split("").map((letter, index) => {
                if(index < iteration) {
                    return text[index];
                }
                return chars[Math.floor(Math.random() * chars.length)];
            }).join("")
        );
        
        if(iteration >= text.length) {
            clearInterval(interval);
        }
        
        iteration += 1 / 3;
    }, 30);
    };

    // Scramble on mount
    scramble();

    // Scramble every 5 seconds
    const loop = setInterval(scramble, 5000);

    return () => {
        clearInterval(interval);
        clearInterval(loop);
    };
  }, [text]);

  return <span className="font-mono text-emerald-600 font-medium">{displayText}</span>;
};

const features = [
  {
    title: "Behavioral Baseline",
    icon: User,
    description:
      "Advanced modeling of browsing intent performed strictly on-device to preserve zero-trust integrity.",
    href: "/features/behavioral-baseline",
    image: "/features/behavioral-baseline.png",
  },
  {
    title: "Temporal Analysis",
    icon: Clock,
    description:
      "Linguistic urgency detection that identifies 'Why Now?' psychological triggers in real-time.",
    href: "/features/temporal-analysis",
    image: "/features/temporal-analysis.png",
  },
  {
    title: "Neural Detection",
    icon: Zap,
    description:
      "Deep-layer verification of Page Titles vs. DOM structure to expose high-fidelity impersonation.",
    href: "/features/neural-detection",
    image: "/features/neural-detection.png",
  },
  {
    title: "Cognitive Shield",
    icon: Brain,
    description:
      "Dynamic UI simplification that activates during high-stress browsing sessions to prevent fatigue-errors.",
    href: "/features/cognitive-shield",
    image: "/features/cognitive-shield.png",
  },
  {
    title: "Quantum Defense",
    icon: LinkIcon,
    description:
      "Cross-channel correlation engine that neutralizes multi-stage attacks across fragmented workflows.",
    href: "/features/quantum-defense",
    image: "/features/quantum-defense.png",
  },
  {
    title: "Sentinel Mesh",
    icon: Globe,
    description:
      "Decentralized threat intelligence sharing that hardens your ecosystem against emerging zero-days.",
    href: "/features/sentinel-mesh",
    image: "/features/sentinel-mesh.png",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-32 bg-white relative overflow-hidden">
      {/* INDUSTRIAL LAB BACKGROUND */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-50/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-100 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-6xl space-y-16 px-6">
        {/* TITLE */}
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden inline-flex items-center px-4 py-1.5 rounded-full bg-zinc-950 border border-emerald-500/30 mb-4 group"
          >
            <div className="absolute inset-0 bg-emerald-500/10" />
            <motion.div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent w-[50%] skew-x-12"
                animate={{ x: ["-150%", "300%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            />
            <span className="relative z-10 text-xs font-bold tracking-[0.2em] text-emerald-400 uppercase">
                Protocol Security Layer
            </span>
          </motion.div>

          <h2 className="text-5xl md:text-6xl font-bold text-zinc-950 tracking-tighter leading-[1.05]">
            Engineered for <br />
            <GlitchText text="Zero-Trust Integrity" />
          </h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-500 text-xl leading-relaxed max-w-2xl mx-auto font-light"
          >
            Modular defensive components designed for <span className="text-zinc-950 font-medium">high-fidelity</span> threat detection and autonomous remediation.
          </motion.p>
        </div>

        {/* PROFESSIONAL GRID - HIGH IMPACT ROUNDED CARDS */}
        <div className="grid gap-8 max-w-6xl mx-auto sm:grid-cols-2 lg:grid-cols-3">
          {features.map((item, i) => {
            const Icon = item.icon;

            return (
              <Link
                key={i}
                href={item.href}
                className="
                    group relative p-10 flex flex-col justify-end
                    bg-white border border-zinc-200/60
                    hover:border-emerald-500/30
                    rounded-[2.5rem] transition-all duration-700
                    hover:cursor-pointer hover:-translate-y-2
                    h-[280px] overflow-hidden
                    ease-[cubic-bezier(0.19,1,0.22,1)]
                    hover:shadow-[0_40px_80px_rgba(0,0,0,0.04)]
                "
              >
                {/* BACKGROUND IMAGE WITH OVERLAY */}
                <div className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover opacity-40 group-hover:opacity-100 transition-opacity duration-700 grayscale group-hover:grayscale-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
                </div>

                {/* ELEGANT SECURITY GLOW */}
                <div className="absolute inset-0 bg-emerald-500/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none z-10" />
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none z-10" />

                <div className="relative z-20 flex flex-col gap-6 transform transition-transform duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] translate-y-[5.8rem] group-hover:translate-y-0">
                  <div className="flex items-center gap-5">
                    <div className="flex items-center justify-center size-14 bg-zinc-50 border border-zinc-100 rounded-2xl group-hover:bg-zinc-950 group-hover:text-white group-hover:border-zinc-950 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]">
                      <Icon className="size-7" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-950 tracking-tight">{item.title}</h3>
                  </div>
                  
                  <p className="text-[15px] text-zinc-500 leading-relaxed font-light opacity-0 group-hover:opacity-100 transform translate-y-6 group-hover:translate-y-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] delay-[80ms]">
                    {item.description}
                  </p>
                </div>

                {/* EMERALD INDUSTRIAL ACCENT */}
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-emerald-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-1000 ease-[cubic-bezier(0.19,1,0.22,1)]" />
                <div className="absolute top-6 right-8 opacity-0 group-hover:opacity-10 transition-opacity duration-700 text-emerald-600">
                    <ShieldAlert size={16} />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
