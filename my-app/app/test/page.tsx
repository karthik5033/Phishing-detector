"use client";

import React, { useState } from 'react';

interface FeatureImportance {
  word: string;
  weight: number;
}

interface LabelResult {
  probability: number;
  top_features: FeatureImportance[];
}

interface DetectionResponse {
  text: string;
  max_risk_score: number;
  labels: Record<string, LabelResult>;
}

export default function TestPage() {
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState<DetectionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('http://localhost:8002/detect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) {
        throw new Error('Failed to connect to AI backend. Make sure it is running on port 8002.');
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (score: number) => {
    if (score > 0.75) return 'text-red-500';
    if (score > 0.4) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getRiskBg = (score: number) => {
    if (score > 0.75) return 'bg-red-500/10 border-red-500/30';
    if (score > 0.4) return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-green-500/10 border-green-500/30';
  };

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <header className="space-y-4 text-center">
          <h1 className="text-5xl font-extrabold tracking-tighter bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Social Engineering Detector
          </h1>
          <p className="text-zinc-400 text-lg max-w-xl mx-auto">
            Analyze messages for phishing, urgency, authority, and fear-based manipulation using our explainable AI system.
          </p>
        </header>

        {/* Form Section */}
        <section className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-zinc-300 ml-1">
                Enter Message to Analyze
              </label>
              <textarea
                id="message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="e.g., URGENT: Your bank account will be closed in 1 hour if you don't verify now..."
                className="w-full h-40 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all resize-none"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white font-bold rounded-2xl transition-all transform active:scale-[0.98] shadow-lg shadow-indigo-500/20"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Analyzing Pattern...
                </span>
              ) : (
                "Analyze Security Risk"
              )}
            </button>
          </form>
        </section>

        {/* Results Section */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-2xl text-center">
            {error}
          </div>
        )}

        {result && (
          <div className={`rounded-3xl p-8 border backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-4 duration-500 ${getRiskBg(result.max_risk_score)}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-1">Risk Analysis Result</h2>
                <p className="text-zinc-400">Model inference completed with explainability.</p>
              </div>
              <div className="text-center md:text-right">
                <div className={`text-6xl font-black ${getRiskColor(result.max_risk_score)}`}>
                  {Math.round(result.max_risk_score * 100)}%
                </div>
                <div className="text-sm uppercase tracking-widest text-zinc-500 font-bold">Risk Probability</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.labels).map(([label, info]) => (
                <div 
                  key={label}
                  className={`p-6 rounded-2xl border transition-all ${info.probability > 0.5 ? 'bg-zinc-900 border-zinc-700 shadow-xl' : 'bg-transparent border-zinc-800/50 opacity-60'}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold capitalize">{label}</h3>
                    <span className={`text-lg font-mono ${info.probability > 0.5 ? getRiskColor(info.probability) : 'text-zinc-600'}`}>
                      {Math.round(info.probability * 100)}%
                    </span>
                  </div>
                  
                  {info.top_features.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">Triggering Keywords</p>
                      <div className="flex flex-wrap gap-2">
                        {info.top_features.map((f, idx) => (
                          <span 
                            key={idx}
                            className="px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm rounded-full"
                          >
                            {f.word}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-600 italic">No significant triggers detected for this category.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer info */}
        <footer className="pt-12 border-t border-zinc-800 text-center text-zinc-600 text-sm">
          <p>Powered by TF-IDF + Logistic Regression explainable baseline.</p>
          <p className="mt-2">AI Security Research - Phase 6</p>
        </footer>
      </div>
    </div>
  );
}
