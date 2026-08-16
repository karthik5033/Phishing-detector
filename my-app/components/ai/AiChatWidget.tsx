"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Loader2, ShieldCheck, Terminal, Cpu } from "lucide-react";
import { API_BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial greeting
  useEffect(() => {
    if (messages.length === 0) {
        setMessages([{ role: "assistant", content: "Sentinel Protocol v2.0 initialized. Awaiting queries." }]);
        setSuggestions(["Analyze current page security", "Explain Zero-Trust Architecture", "What is Neural Detection?"]);
    }
  }, []);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg = { role: "user" as const, content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setSuggestions([]); 
    setError(null);

    try {
        const pageContext = document.body.innerText.substring(0, 3000);

        const res = await fetch(`${API_BASE_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                context: pageContext
            })
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({ detail: res.statusText }));
            throw new Error(errData.detail || `Server Error: ${res.status}`);
        }

        const data = await res.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.response }]);
        if (data.suggestions) {
            setSuggestions(data.suggestions);
        }

    } catch (error: any) {
        console.error("Chat Error:", error);
        setError(`Connect Error: ${error.message}`);
        setMessages((prev) => [...prev, { 
            role: "assistant", 
            content: "CONNECTION SEVERED. Backend link unstable. Retrying handshake..." 
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="mb-6 w-[400px] max-h-[calc(100vh-120px)] h-[600px] flex flex-col overflow-hidden rounded-xl shadow-[0_0_50px_rgba(16,185,129,0.1)] bg-zinc-950 border border-zinc-800 ring-1 ring-white/5"
          >
            {/* TACTICAL HEADER */}
            <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex justify-between items-center relative overflow-hidden">
               {/* Scanning Line Effect */}
               <motion.div 
                    initial={{ left: "-100%" }}
                    animate={{ left: "200%" }}
                    transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                    className="absolute top-0 bottom-0 w-10 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent skew-x-12 pointer-events-none"
               />
               
               <div className="flex items-center gap-3 relative z-10">
                   <div className="w-10 h-10 rounded-lg bg-zinc-900 flex items-center justify-center border border-zinc-700 text-emerald-500">
                      <Terminal size={20} />
                   </div>
                   <div>
                       <h3 className="font-bold text-zinc-100 text-sm tracking-wider uppercase">SENTINEL // <span className="text-emerald-500">COMMAND</span></h3>
                       <div className="flex items-center gap-2">
                           <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                           <p className="text-[10px] text-zinc-400 font-mono">SECURE UPLINK ESTABLISHED</p>
                       </div>
                   </div>
               </div>
               <button 
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-all z-10"
               >
                   <X size={18} />
               </button>
            </div>

            {/* ERROR TERMINAL */}
            {error && (
                <div className="bg-red-950/30 px-4 py-2 text-[11px] text-red-400 font-mono flex items-center gap-2 border-b border-red-900/50">
                    <span className="font-bold">[ERR]</span>
                    <span className="opacity-90">{error}</span>
                </div>
            )}

            {/* MESSAGES CONSOLE */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth bg-zinc-950">
                {messages.map((m, i) => (
                    <div key={i} className={cn("flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300", m.role === "user" ? "justify-end" : "justify-start")}>
                        <div className={cn(
                            "max-w-[85%] px-4 py-3 text-[13px] leading-relaxed relative",
                            m.role === "user" 
                              ? "bg-zinc-800 text-zinc-100 rounded-lg border border-zinc-700" 
                              : "bg-emerald-950/20 text-emerald-100/90 rounded-lg border border-emerald-500/20 font-mono shadow-[0_0_15px_rgba(16,185,129,0.05)]"
                        )}>
                            {m.role === "user" ? null : (
                                <div className="absolute -left-2 top-3 w-1 h-3 bg-emerald-500/50 rounded-r-sm" />
                            )}
                            <p className="whitespace-pre-wrap">{m.content}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="bg-zinc-900 border border-zinc-800 px-4 py-3 rounded-lg flex items-center gap-3">
                             <Loader2 className="size-4 animate-spin text-emerald-500" />
                             <span className="text-[12px] text-zinc-400 font-mono animate-pulse">PROCESSING DATA...</span>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* TACTICAL SUGGESTIONS */}
            {suggestions.length > 0 && !isLoading && (
                <div className="px-4 py-3 bg-zinc-950 border-t border-zinc-900 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
                    {suggestions.map((s, i) => (
                        <button 
                           key={i} 
                           onClick={() => handleSend(s)}
                           className="whitespace-nowrap px-3 py-1.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[11px] font-mono rounded hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-950/20 transition-all"
                        >
                            {">"} {s}
                        </button>
                    ))}
                </div>
            )}

            {/* COMMAND INPUT */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800">
                <form 
                    onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
                    className="flex gap-2 items-center bg-zinc-900 p-1.5 rounded-lg border border-zinc-800 focus-within:ring-1 focus-within:ring-emerald-500/50 focus-within:border-emerald-500/50 transition-all"
                >
                    <div className="pl-2 text-emerald-500">
                        <Terminal size={14} />
                    </div>
                    <input
                        className="flex-1 bg-transparent px-2 text-sm outline-none text-zinc-200 placeholder:text-zinc-600 font-mono h-9"
                        placeholder="Enter system command..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)} 
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className={cn(
                            "h-8 w-8 rounded flex items-center justify-center transition-all shrink-0", 
                            isLoading ? "bg-zinc-800 text-zinc-600" : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-[0_0_10px_rgba(16,185,129,0.4)]"
                        )}
                    >
                        <Send size={14} />
                    </button>
                </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FLOATING TRIGGER */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
            "w-14 h-14 rounded-full shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center transition-all duration-300 relative group z-[9999] border-2",
            isOpen 
                ? "bg-zinc-950 border-emerald-500 text-emerald-500" 
                : "bg-zinc-950 border-emerald-500/50 text-white hover:border-emerald-400"
        )}
      >
        {isOpen ? (
            <X size={24} />
        ) : (
             <div className="relative">
                <ShieldCheck size={26} className="text-emerald-500" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
             </div>
        )}
      </motion.button>
    </div>
  );
}
