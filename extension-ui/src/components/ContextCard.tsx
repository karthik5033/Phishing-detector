import React, { useEffect, useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface RiskData {
  max_risk_score: number;
  detections: Record<string, any>;
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
                    title: tab.title // Send page title for Impersonation Check (Module 3)
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
            setRiskData({ max_risk_score: 0.12, detections: {} });
            setLoading(false);
        }, 500);
    }
  }, []);

  const score = riskData?.max_risk_score || 0;
  const isHighRisk = score > 0.7;
  const isSuspicious = score > 0.4;
  
  const statusColor = isHighRisk ? "text-rose-500" : isSuspicious ? "text-amber-500" : "text-emerald-500";
  const statusBg = isHighRisk ? "bg-rose-500" : isSuspicious ? "bg-amber-500" : "bg-emerald-500";
  const statusBorder = isHighRisk ? "border-rose-500/20" : isSuspicious ? "border-amber-500/20" : "border-emerald-500/20";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Context</h2>
          <div className="mt-1 flex items-center gap-2">
            <span className="font-mono text-sm truncate max-w-[180px]">{currentUrl || 'Scanning...'}</span>
          </div>
        </div>
        {loading ? (
             <div className="animate-pulse w-8 h-8 rounded-full bg-muted" />
        ) : (
             <div className={cn("flex items-center justify-center w-8 h-8 rounded-full bg-opacity-10", statusBg)}>
                {isHighRisk ? <AlertTriangle className={cn("w-4 h-4", statusColor)} /> : 
                 isSuspicious ? <Search className={cn("w-4 h-4", statusColor)} /> :
                 <CheckCircle className={cn("w-4 h-4", statusColor)} />}
             </div>
        )}
      </div>

      <div className="relative pt-2 pb-6">
        {/* Risk Meter Bar */}
        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
           <motion.div 
             initial={{ width: 0 }}
             animate={{ width: `${score * 100}%` }}
             transition={{ duration: 0.5, ease: "easeOut" }}
             className={cn("h-full rounded-full", statusBg)}
           />
        </div>
        <div className="mt-2 flex justify-between items-center">
             <span className={cn("text-2xl font-bold", statusColor)}>
                {(score * 100).toFixed(0)}%
             </span>
             <span className="text-sm text-muted-foreground">
                {isHighRisk ? 'High Risk detected' : isSuspicious ? 'Suspicious patterns' : 'Likely Safe'}
             </span>
        </div>
      </div>

      {detailed && riskData && (
        <div className="mt-4 pt-4 border-t border-border space-y-2">
            <h3 className="text-xs font-medium mb-2">Analysis Vector</h3>
            <div className="space-y-2">
                {['urgency', 'authority', 'fear', 'impersonation'].map(label => {
                    const prob = riskData.detections[label]?.probability || 0;
                    if (prob < 0.1) return null;
                    return (
                        <div key={label} className="flex items-center justify-between text-xs">
                            <span className="capitalize text-muted-foreground">{label}</span>
                            <div className="flex items-center gap-2">
                                <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                                    <div className="h-full bg-primary/50" style={{ width: `${prob * 100}%` }} />
                                </div>
                                <span className="w-8 text-right">{(prob * 100).toFixed(0)}%</span>
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
