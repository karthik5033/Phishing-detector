"use client";
import Link from "next/link";
import { Logo } from "@/components/landing/logo";
import { Menu, X, Shield, Globe, Activity, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import React from "react";
import { useScroll, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

// Removed local menuItems array if it's unused or defined inside component in strict copy
// But I'll include it as per reasonable structure.

const menuItems = [
  { name: "Features", href: "/#features" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Install", href: "/install" },
  { name: "Docs", href: "/docs" },
];

export const HeroHeader = () => {
  const [menuState, setMenuState] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const { scrollYProgress } = useScroll();
  const [showFeatures, setShowFeatures] = React.useState(false);
  const pathname = usePathname();
  const featuresRef = React.useRef<HTMLDivElement | null>(null);
  const featuresButtonRef = React.useRef<HTMLButtonElement | null>(null);

  React.useEffect(() => {
    const unsub = scrollYProgress.on("change", (val) => {
      setScrolled(val > 0.05);
    });
    return () => unsub();
  }, [scrollYProgress]);

  // keydown/mousedown implementation same as before
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
        if (e.key === "Escape") setShowFeatures(false);
    }
    function onDocClick(e: MouseEvent) {
        const target = e.target as Node;
        if (showFeatures && featuresRef.current && !featuresRef.current.contains(target) && featuresButtonRef.current && !featuresButtonRef.current.contains(target)) {
            setShowFeatures(false);
        }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDocClick);
    return () => {
        document.removeEventListener("keydown", onKey);
        document.removeEventListener("mousedown", onDocClick);
    };

  }, [showFeatures]);


  return (
    <header>
      <nav
        data-state={menuState && "active"}
        className="fixed top-0 z-40 w-full pt-2 transition-all"
      >
        <div
          className={cn(
            "mx-auto max-w-7xl rounded-full px-8 transition-all duration-500",
            "bg-white/60 backdrop-blur-2xl border border-zinc-200/50",
            scrolled && "bg-white/90 border-zinc-200 shadow-xl shadow-zinc-200/20 px-6"
          )}
        >
          <motion.div
            className={cn(
              "flex items-center justify-between py-4 lg:py-5 transition-all",
              scrolled && "py-3"
            )}
          >
            {/* LEFT: Logo + Menu */}
            <div className="flex items-center gap-10 flex-none">
              <Link href="/" aria-label="home" className="flex items-center">
                <Logo className="h-7 w-auto" />
              </Link>
              {/* Desktop Menu */}

              <div className="hidden lg:flex items-center gap-10">
                {/* FEATURES DROPDOWN - Exact structure from tailark/header.tsx */}
                <div
                  className="relative"
                  onMouseEnter={() => setShowFeatures(true)}
                  onMouseLeave={() => setShowFeatures(false)}
                >
                  <button
                    id="features-menu"
                    ref={featuresButtonRef}
                    aria-haspopup="true"
                    aria-expanded={showFeatures}
                    className="flex items-center gap-2 text-black/90 hover:text-black transition font-medium"
                    onClick={() => setShowFeatures((s) => !s)}
                    onFocus={() => setShowFeatures(true)}
                  >
                    Features
                    <svg className="ml-1 h-3 w-3" viewBox="0 0 20 20" fill="none">
                      <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  <motion.div
                    id="features-panel"
                    ref={featuresRef}
                    initial={{ opacity: 0, scale: 0.96, y: -6, filter: "blur(4px)" }}
                    animate={showFeatures ? { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", pointerEvents: "auto" } : { opacity: 0, scale: 0.96, y: -6, filter: "blur(4px)", pointerEvents: "none" }}
                    transition={{ duration: 0.2 }}
                    className="absolute left-0 top-full mt-4 w-[600px] rounded-2xl bg-zinc-950/90 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 p-6 overflow-hidden"
                    style={{ pointerEvents: showFeatures ? 'auto' : 'none' }}
                  >
                     <div className="grid grid-cols-2 gap-4 relative z-10">
                        
                        <div className="space-y-4">
                            <h3 className="text-xs font-mono font-medium text-emerald-500 uppercase tracking-widest pl-2 mb-2">Core Defense</h3>
                            
                            <Link href="/dashboard" className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                                <div className="mt-1 p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                                    <Shield className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">Cognitive Shield</div>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Real-time heuristics engine guarding against social engineering.</p>
                                </div>
                            </Link>

                            <Link href="/dashboard" className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                                <div className="mt-1 p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                                    <Activity className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100 group-hover:text-blue-400 transition-colors">Behavioral Baseline</div>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Local-first ML model that learns your browsing patterns.</p>
                                </div>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-xs font-mono font-medium text-amber-500 uppercase tracking-widest pl-2 mb-2">Intelligence</h3>

                            <Link href="/dashboard" className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                                <div className="mt-1 p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                                    <Globe className="size-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100 group-hover:text-amber-400 transition-colors">Global Grid</div>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">Decentralized threat telemetry sharing across the mesh.</p>
                                </div>
                            </Link>

                             <Link href="/dashboard" className="group flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-all">
                                <div className="mt-1 p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                                    <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-zinc-100 group-hover:text-purple-400 transition-colors">Deep Inspection</div>
                                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">DOM-level analysis of suspicious interactive elements.</p>
                                </div>
                            </Link>
                        </div>

                     </div>
                     
                     {/* Footer / CTA */}
                     <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <div className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase">System_Active: v2.4.0</span>
                        </div>
                        <Link href="/dashboard" className="group/link flex items-center gap-2 text-xs font-bold text-zinc-300 hover:text-white transition-colors">
                            View all modules
                            <div className="size-5 rounded-full bg-white/5 flex items-center justify-center group-hover/link:bg-emerald-500 group-hover/link:text-black transition-all duration-300">
                               <ChevronRight className="size-3" />
                            </div>
                        </Link>
                     </div>
                  </motion.div>
                </div>

                <nav>
                  <ul className="flex items-center gap-8 text-sm">
                    <li><Link href="/how-it-works" className="text-black/80 hover:text-black transition">How It Works</Link></li>
                    <li><Link href="/docs" className="text-black/80 hover:text-black transition">Docs</Link></li>
                    <li><Link href="/dashboard" className="text-black/80 hover:text-black transition">Dashboard</Link></li>
                  </ul>
                </nav>
              </div>
            </div>

            {/* RIGHT: Buttons */}
            <div className="hidden lg:flex items-center gap-3 flex-none">
              <Button asChild variant="secondary" size="sm" className="rounded-full bg-zinc-50 border border-zinc-200 text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 transition-all font-medium">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild size="sm" className="rounded-full bg-zinc-950 text-white hover:bg-zinc-800 shadow-xl shadow-zinc-950/20 active:scale-95 transition-all font-semibold">
                <Link href="/install">Get Started</Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setMenuState(!menuState)} className="lg:hidden p-2.5">
               {menuState ? <X className="size-6 text-black" /> : <Menu className="size-6 text-black" />}
            </button>
          </motion.div>

           {/* Mobile Menu */}
           {menuState && (
            <div className="lg:hidden mt-3 pb-4 border-t border-white/10 pt-4 bg-black/80 backdrop-blur-md rounded-b-3xl px-6">
               <ul className="flex flex-col gap-4 text-white/90 text-lg">
                  {menuItems.map((item, i) => <li key={i}><Link href={item.href}>{item.name}</Link></li>)}
               </ul>
            </div>
           )}
        </div>
      </nav>
    </header>
  );
};
