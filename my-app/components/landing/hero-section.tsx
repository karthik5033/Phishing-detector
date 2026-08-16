"use client";
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Rocket, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function HeroSection() {
    const [particles, setParticles] = useState<any[]>([]);

    useEffect(() => {
        const newParticles = [...Array(20)].map(() => ({
            width: Math.random() * 4 + 1 + "px",
            height: Math.random() * 4 + 1 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            y: [0, Math.random() * -100 - 50],
            duration: Math.random() * 10 + 10,
            delay: Math.random() * 5,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <main className="overflow-hidden relative min-h-[90vh] flex items-center justify-center bg-zinc-50/50">
            {/* DYNAMIC BACKGROUND GRID */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
            
            {/* CONTINUOUS RADAR SCAN */}
            <motion.div 
                className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent z-0 pointer-events-none"
                animate={{ top: ["0%", "100%"] }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            />

            {/* FLOATING PARTICLES */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {particles.map((p, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-emerald-500/20 rounded-full"
                        style={{
                            width: p.width,
                            height: p.height,
                            left: p.left,
                            top: p.top,
                        }}
                        animate={{
                            y: p.y,
                            opacity: [0, 0.5, 0],
                        }}
                        transition={{
                            duration: p.duration,
                            repeat: Infinity,
                            ease: "linear",
                            delay: p.delay,
                        }}
                    />
                ))}
            </div>
            
            {/* SHIELD ACTIVATION ANIMATION (Behind content) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center -top-20">
                 <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="relative"
                 >
                    {/* Concentric Rings - Subtle Gradient Rotation */}
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            className={`absolute inset-0 m-auto border border-emerald-500/10 border-t-emerald-500/30 border-l-emerald-500/20 rounded-full`}
                            style={{ width: `${i * 300 + 400}px`, height: `${i * 300 + 400}px` }}
                            animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                            transition={{ duration: 40 + (i * 10), repeat: Infinity, ease: "linear" }}
                        />
                    ))}
                 </motion.div>
            </div>

            <section className="relative z-10 w-full max-w-7xl px-6 md:px-12 pt-20">
                <div className="text-center mx-auto max-w-4xl">
                     {/* Badge */}
                     <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="flex justify-center mb-8"
                     >
                        <Link
                            href="/flow"
                            className="group relative flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 border border-zinc-200 shadow-sm hover:border-emerald-500/50 hover:shadow-emerald-500/10 transition-all duration-300"
                        >
                            <span className="flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-semibold text-zinc-600 group-hover:text-zinc-900">Sentinel v2.0 Online</span>
                            <ArrowRight className="size-3.5 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                        </Link>
                    </motion.div>

                    {/* Main Title */}
                    <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-zinc-900 leading-[0.95]"
                    >
                        Detect <span className="text-zinc-300">Social</span> <br className="hidden md:block"/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-br from-emerald-600 to-zinc-900">
                            Engineering.
                        </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mx-auto mt-8 max-w-2xl text-xl text-zinc-500 font-light leading-relaxed"
                    >
                        Stop sophisticated phishing attacks before they strike. <br className="hidden sm:block"/>
                        Your autonomous defense layer against human-targeted exploits.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                        <Button
                            size="lg"
                            asChild
                            className="h-14 rounded-full px-10 text-lg bg-zinc-900 hover:bg-zinc-800 text-white shadow-xl shadow-zinc-900/20 transition-all hover:scale-105 active:scale-95 group"
                        >
                            <Link href="/install">
                                <ShieldCheck className="mr-2 size-5 group-hover:text-emerald-400 transition-colors" />
                                <span>Activate Protocol</span>
                            </Link>
                        </Button>
                        
                        <Button
                            size="lg"
                            asChild
                            variant="ghost"
                            className="h-14 rounded-full px-8 text-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-all border border-transparent hover:border-zinc-200"
                        >
                            <Link href="/architecture">
                                <span>View Architecture</span>
                            </Link>
                        </Button>
                    </motion.div>
                </div>
            </section>
        </main>
    )
}
