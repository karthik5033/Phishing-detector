"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, FileJson, Trash2, Eye, EyeOff, Save, Key, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { API_BASE_URL } from "@/lib/constants";

export default function PrivacyCenterPage() {
    const [piiMasked, setPiiMasked] = useState(true);
    const [retentionDays, setRetentionDays] = useState(30);
    const [purging, setPurging] = useState(false);
    const [saving, setSaving] = useState(false);

    // Fetch settings on mount
    useEffect(() => {
        fetch(`${API_BASE_URL}/privacy/settings`)
            .then(res => res.json())
            .then(data => {
                setPiiMasked(data.pii_masking ?? true);
                setRetentionDays(data.retention_days ?? 30);
            })
            .catch(err => {
                console.error(err);
                // Set defaults on error
                setPiiMasked(true);
                setRetentionDays(30);
            });
    }, []);

    // Save settings when changed
    const saveSettings = async (pii?: boolean, days?: number) => {
        setSaving(true);
        try {
            const params = new URLSearchParams();
            if (pii !== undefined) params.append('pii_masking', String(pii));
            if (days !== undefined) params.append('retention_days', String(days));
            
            await fetch(`${API_BASE_URL}/privacy/settings?${params.toString()}`, { 
                method: 'POST' 
            });
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handlePiiToggle = () => {
        const newValue = !piiMasked;
        setPiiMasked(newValue);
        saveSettings(newValue, undefined);
    };

    const handleRetentionChange = (days: number) => {
        setRetentionDays(days);
        // Debounce save to avoid too many requests
        clearTimeout((window as any)._retentionTimeout);
        (window as any)._retentionTimeout = setTimeout(() => saveSettings(undefined, days), 500);
    };

    const handlePurge = async () => {
        if (!confirm("⚠️ WARNING: This will permanently delete ALL collected telemetry data. This action cannot be undone. Are you sure?")) return;
        
        setPurging(true);
        try {
            const res = await fetch(`${API_BASE_URL}/reset`, { method: "DELETE" });
            if (res.ok) {
                alert("System Purge Complete. All telemetry data has been wiped.");
                window.location.reload();
            } else {
                alert("Purge failed. Check console.");
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to server.");
        } finally {
            setPurging(false);
        }
    };

    const handleExport = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/activity?limit=1000`);
            const data = await res.json();
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `sentinel_export_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
        } catch (e) {
            alert("Failed to export data.");
        }
    };

    return (
        <div className="space-y-8 min-h-screen pb-20 font-sans text-slate-900">
            {/* HEADER */}
            <div className="space-y-1 border-b border-slate-200/60 pb-6">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
                    <Shield className="size-8 text-emerald-600" />
                    Privacy Center
                </h1>
                <p className="text-slate-500 font-medium">
                    Manage data retention, PII masking, and sovereignty controls.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. DATA GOVERNANCE CARD */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                    <Lock className="size-5 text-slate-400" />
                                    Data Governance
                                </h2>
                                <p className="text-sm text-slate-500 mt-1">Configure how Sentinel handles sensitive information.</p>
                            </div>
                            <div className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full uppercase tracking-wider border border-emerald-100 flex items-center gap-1">
                                <CheckCircle2 className="size-3" /> Compliant
                            </div>
                        </div>

                        {/* PII Toggle */}
                        <div className="flex items-center justify-between py-6 border-b border-slate-100">
                            <div className="space-y-1">
                                <label className="text-sm font-bold text-slate-700">PII Masking Protocol</label>
                                <p className="text-xs text-slate-500 max-w-md">Automatically redact email addresses, phone numbers, and credit card patterns from collected logs.</p>
                            </div>
                            <button 
                                onClick={() => setPiiMasked(!piiMasked)}
                                className={cn(
                                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:ring-offset-2",
                                    piiMasked ? "bg-emerald-600" : "bg-slate-200"
                                )}
                            >
                                <span className={cn("inline-block h-4 w-4 transform rounded-full bg-white transition-transform", piiMasked ? "translate-x-6" : "translate-x-1")} />
                            </button>
                        </div>

                        {/* Retention Slider */}
                        <div className="pt-6 space-y-4">
                            <div className="flex justify-between">
                                <label className="text-sm font-bold text-slate-700">Telemetry Retention Period</label>
                                <span className="text-sm font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{retentionDays} Days</span>
                            </div>
                            <input 
                                type="range" 
                                min="1" 
                                max="90" 
                                value={retentionDays} 
                                onChange={(e) => setRetentionDays(parseInt(e.target.value))}
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                            />
                            <p className="text-xs text-slate-400">Data older than this limit is automatically purged from the local encrypted store.</p>
                        </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="grid grid-cols-2 gap-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleExport}
                            className="bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-slate-700 hover:text-emerald-700 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-sm group"
                        >
                            <div className="bg-slate-50 p-3 rounded-full group-hover:bg-emerald-100 transition-colors">
                                <FileJson className="size-6 text-slate-400 group-hover:text-emerald-600" />
                            </div>
                            <span className="font-bold text-sm">Export Data Report</span>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-slate-700 hover:text-indigo-700 p-6 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all shadow-sm group"
                        >
                            <div className="bg-slate-50 p-3 rounded-full group-hover:bg-indigo-100 transition-colors">
                                <Key className="size-6 text-slate-400 group-hover:text-indigo-600" />
                            </div>
                            <span className="font-bold text-sm">Manage Encryption Keys</span>
                        </motion.button>
                    </div>
                </div>

                {/* 2. DANGER ZONE */}
                <div className="lg:col-span-1">
                    <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5">
                            <AlertTriangle className="size-32 text-rose-500" />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="mb-6">
                                <h3 className="text-lg font-bold text-rose-900 flex items-center gap-2">
                                    <AlertTriangle className="size-5 text-rose-600" />
                                    Danger Zone
                                </h3>
                                <p className="text-sm text-rose-700/80 mt-2 leading-relaxed">
                                    Irreversible actions regarding your data footprint. Proceed with caution.
                                </p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-rose-200/50">
                                <button 
                                    onClick={handlePurge}
                                    disabled={purging}
                                    className="w-full bg-white border border-rose-200 text-rose-600 font-bold py-4 rounded-xl shadow-sm hover:bg-rose-600 hover:text-white hover:border-rose-600 transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {purging ? (
                                        <span className="animate-pulse">Purging System...</span>
                                    ) : (
                                        <>
                                            <Trash2 className="size-4 group-hover:animate-bounce" />
                                            Purge All Telemetry
                                        </>
                                    )}
                                </button>
                                <p className="text-[10px] text-rose-600/60 text-center mt-3 font-medium">
                                    This will wipe the local SQLite database.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
