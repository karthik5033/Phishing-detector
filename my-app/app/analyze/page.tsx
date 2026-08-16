"use client";

import React, { useState } from 'react';
import { analyzeMessage } from '@/lib/api';
import { AnalysisResponse } from '@/types/analysis';
import { RiskMeter } from '@/components/RiskMeter';
import { ExplanationPanel } from '@/components/ExplanationPanel';

export default function AnalyzePage() {
    const [text, setText] = useState("");
    const [result, setResult] = useState<AnalysisResponse | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    const handleAnalyze = async () => {
        if (!text.trim()) return;

        setStatus('loading');
        setError(null);
        try {
            const data = await analyzeMessage({ text });
            setResult(data);
            setStatus('idle');
        } catch (err: any) {
            setError(err.message || "Analysis failed");
            setStatus('error');
        }
    };

    return (
        <main className="min-h-screen bg-black text-zinc-100 p-6 md:p-12 font-sans selection:bg-rose-500/30">
            <div className="max-w-5xl mx-auto space-y-16">
                {/* Navigation / Logo Area */}
                <nav className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-amber-600 rounded-lg" />
                        <span className="text-xl font-black tracking-tight underline decoration-rose-500/30">SECURE_SENTINEL</span>
                    </div>
                    <div className="text-xs text-zinc-500 font-mono">v1.0.0-PROD</div>
                </nav>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* Input Area */}
                    <div className="lg:col-span-12 space-y-6">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                                Analyze Adversarial Phishing
                            </h1>
                            <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
                                Paste suspicious emails, SMS, or chat messages to identify manipulation techniques using our production-grade inference engine.
                            </p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/20 to-amber-500/20 rounded-3xl blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-1 shadow-2xl">
                                <textarea
                                    className="w-full h-48 bg-transparent text-zinc-100 p-6 rounded-xl focus:outline-none placeholder:text-zinc-700 resize-none leading-relaxed transition-all"
                                    placeholder="Paste message text here..."
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                />
                                <div className="p-4 border-t border-zinc-900 flex justify-between items-center">
                                    <span className="text-xs text-zinc-600 font-mono">{text.length} characters</span>
                                    <button
                                        onClick={handleAnalyze}
                                        disabled={status === 'loading'}
                                        className="px-8 py-3 bg-zinc-100 hover:bg-white text-black font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center gap-3"
                                    >
                                        {status === 'loading' ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                                Inference Active...
                                            </>
                                        ) : (
                                            "Run Analysis"
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                ⚠️ {error}
                            </div>
                        )}
                    </div>

                    {/* Result Area */}
                    {result && status === 'idle' && (
                        <div className="lg:col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="lg:col-span-4 lg:sticky lg:top-8 self-start">
                                <RiskMeter score={result.max_risk_score} />
                            </div>
                            <div className="lg:col-span-8 space-y-6">
                                <div className="flex items-center gap-4 text-zinc-400">
                                    <div className="h-px flex-1 bg-zinc-800" />
                                    <span className="text-[10px] uppercase tracking-widest font-black">Detected Patterns</span>
                                    <div className="h-px flex-1 bg-zinc-800" />
                                </div>
                                <ExplanationPanel detections={result.detections} />
                                <div className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-2xl">
                                    <h4 className="text-xs uppercase tracking-wider text-zinc-500 font-black mb-3">Analytic Insight</h4>
                                    <p className="text-zinc-400 text-sm leading-relaxed">
                                        This message was analyzed against our multi-label baseline for various linguistic markers.
                                        The total risk score reflects the maximum probability across detected attack vectors.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <footer className="pt-24 pb-12 text-center">
                    <p className="text-zinc-700 text-[10px] tracking-widest uppercase font-black">
                        End-to-End Encryption & Inference Isolation Protocol Active
                    </p>
                </footer>
            </div>
        </main>
    );
}
