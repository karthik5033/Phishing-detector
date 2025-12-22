import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search, UserCheck, Timer, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface BehavioralReason {
  id: string;
  desc: string;
  detail: string;
}

interface RiskData {
  max_risk_score: number;
  detections: Record<string, any>;
  explanation?: string;
  behavioral_reasons?: BehavioralReason[];
}

export function ContextCard({ detailed = false }: { detailed?: boolean }) {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [riskData, setRiskData] = useState<RiskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get current tab
    if (chrome?.tabs) {
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        const tab = tabs[0];
        if (tab?.url) {
          const urlObj = new URL(tab.url);
          setCurrentUrl(urlObj.hostname);
          
          // 2. Ask background for cached result
          chrome.runtime.sendMessage({ 
            type: 'GET_CACHED_RESULT', 
            payload: { url: tab.url } 
          }, (response) => {
             if (response?.result) {
               setRiskData(response.result);
               setLoading(false);
             } else {
               // Cache miss? Trigger fresh analysis
               chrome.runtime.sendMessage({
                  type: 'CHECK_RISK',
                  payload: { 
                    url: tab.url,
                    title: tab.title 
                  }
               }, (scanResponse) => {
                  if (scanResponse?.success) {
                      setRiskData(scanResponse.data);
                  }
                  setLoading(false);
               });
             }
          });
        }
      });
    } else {
        // Dev Mock
        setTimeout(() => {
            setCurrentUrl('example-bank.com');
            setRiskData({ 
                max_risk_score: 0.65, 
                detections: { impersonation: { probability: 0.4 } },
                behavioral_reasons: [
                    { 
                        id: "SUDDEN_INTERACTION", 
                        desc: "Sudden interaction detected", 
                        detail: "You interacted with this page much faster than your usual pattern for banking sites." 
                    }
                ]
            });
            setLoading(false);
        }, 500);
    }
  }, []);

  const score = riskData?.max_risk_score || 0;
  const isHighRisk = score > 0.7;
  const isSuspicious = score > 0.4;
  
  const statusColor = isHighRisk ? "text-rose-500" : isSuspicious ? "text-amber-500" : "text-emerald-500";
  const statusBg = isHighRisk ? "bg-rose-500" : isSuspicious ? "bg-amber-500" : "bg-emerald-500";

  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-5">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Context Analysis</h2>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-semibold truncate max-w-[180px]">{currentUrl || 'Scanning...'}</span>
          </div>
        </div>
        {loading ? (
             <div className="animate-pulse w-9 h-9 rounded-xl bg-muted" />
        ) : (
             <div className={cn("flex items-center justify-center w-9 h-9 rounded-xl transition-colors duration-500", statusBg, "bg-opacity-10")}>
                {isHighRisk ? <AlertTriangle className={cn("w-5 h-5", statusColor)} /> : 
                 isSuspicious ? <Search className={cn("w-5 h-5", statusColor)} /> :
                 <CheckCircle className={cn("w-5 h-5", statusColor)} />}
             </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="h-1.5 w-full bg-secondary/50 rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${score * 100}%` }}
             transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
             className={cn("h-full rounded-full transition-colors duration-500", statusBg)}
           />
        </div>
        <div className="flex justify-between items-end">
             <div className="flex flex-col">
                <span className={cn("text-3xl font-black tracking-tighter transition-colors duration-500", statusColor)}>
                    {(score * 100).toFixed(0)}%
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Risk Level</span>
             </div>
             <span className="text-xs font-medium bg-secondary px-2 py-1 rounded-md text-secondary-foreground mb-1">
                {isHighRisk ? 'High Threat' : isSuspicious ? 'Suspicious' : 'Likely Safe'}
             </span>
        </div>
      </div>

      <AnimatePresence>
        {riskData?.behavioral_reasons && riskData.behavioral_reasons.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 space-y-3"
          >
            <div className="flex items-center gap-2 text-amber-600">
                <UserCheck className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">Behavioral Insight</span>
            </div>
            
            {riskData.behavioral_reasons.map((reason, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center gap-2 text-[13px] font-semibold text-amber-900">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    {reason.desc}
                </div>
                <p className="text-xs text-amber-800/70 leading-relaxed font-medium pl-3.5">
                    {reason.detail}
                </p>
              </div>
            ))}
            
            <div className="pt-2 flex items-center gap-2 text-[10px] text-amber-700/60 italic font-medium">
                <Info size={10} />
                <span>This check is performed locally for your privacy.</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {detailed && riskData && (
        <div className="pt-4 border-t border-border space-y-4">
            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Heuristic Signals</h3>
            <div className="grid grid-cols-1 gap-3">
                {['urgency', 'authority', 'fear', 'impersonation'].map(label => {
                    const prob = riskData.detections[label]?.probability || 0;
                    if (prob < 0.1) return null;
                    return (
                        <div key={label} className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                                <span className="capitalize text-muted-foreground">{label}</span>
                                <span className="text-primary">{(prob * 100).toFixed(0)}%</span>
                            </div>
                            <div className="h-1 w-full bg-secondary/30 rounded-full overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${prob * 100}%` }}
                                    className="h-full bg-primary/40 rounded-full" 
                                />
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
      )}
    </div>
  );
}
