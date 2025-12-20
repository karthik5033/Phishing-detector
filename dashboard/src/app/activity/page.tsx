"use client";

import { Shield, Globe, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface ActivityItem {
    id: number;
    domain: string;
    timestamp: string;
    risk_score: number;
    risk_level: string;
    status: string;
    category: string;
}

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivity = async () => {
        try {
            const res = await fetch("http://localhost:8000/api/v1/activity");
            const data = await res.json();
            setActivity(data);
        } catch (error) {
            console.error("Failed to fetch activity:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchActivity();
    // Refresh every 15s
    const interval = setInterval(fetchActivity, 15000);
    return () => clearInterval(interval);
  }, []);

  // Time formatter
  const formatTime = (isoString: string) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          month: 'short',
          day: 'numeric'
      }).format(date);
  };

  if (loading) {
      return (
          <div className="flex h-[50vh] flex-col items-center justify-center text-muted-foreground gap-4">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p>Loading Activity Log...</p>
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Activity Insights</h1>
          <p className="text-muted-foreground">Detailed log of scanned interactions and blocked threats.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors">Export CSV</button>
           <button className="px-3 py-1.5 text-sm font-medium border border-border rounded-md hover:bg-secondary transition-colors">Filter</button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-secondary/50 border-b border-border/50 text-muted-foreground font-medium">
             <tr>
               <th className="px-6 py-3">Timestamp</th>
               <th className="px-6 py-3">Domain</th>
               <th className="px-6 py-3">Risk Category</th>
               <th className="px-6 py-3">Status</th>
               <th className="px-6 py-3 text-right">Risk Score</th>
             </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
             {activity.length === 0 ? (
                 <tr>
                     <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                        No activity recorded yet. Start browsing to see data.
                     </td>
                 </tr>
             ) : (
                 activity.map((item) => (
                    <tr key={item.id} className="hover:bg-secondary/10 group transition-colors">
                    <td className="px-6 py-3 flex items-center gap-2 text-muted-foreground whitespace-nowrap">
                        <Clock size={14} className="text-slate-400" /> {formatTime(item.timestamp)}
                    </td>
                    <td className="px-6 py-3 font-medium text-foreground">
                        {item.domain}
                    </td>
                    <td className="px-6 py-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary/50 text-xs font-medium border border-border/50">
                            <Globe size={11} className="text-slate-500" /> {item.category}
                        </span>
                    </td>
                    <td className="px-6 py-3">
                        {item.status === 'SAFE' && (
                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full flex w-fit items-center gap-1 font-medium text-xs">
                            <Shield size={11} /> Safe
                            </span>
                        )}
                        {item.status === 'BLOCKED' && (
                            <span className="text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full flex w-fit items-center gap-1 font-medium text-xs">
                            <Shield size={11} fill="currentColor" /> Blocked
                            </span>
                        )}
                        {item.status === 'WARNED' && (
                            <span className="text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full flex w-fit items-center gap-1 font-medium text-xs">
                            <AlertTriangle size={11} /> Warned
                            </span>
                        )}
                    </td>
                    <td className="px-6 py-3 text-right font-mono text-muted-foreground">
                        <span className={item.risk_score > 0.5 ? "text-rose-500 font-bold" : ""}>
                            {(item.risk_score * 100).toFixed(0)}%
                        </span>
                    </td>
                    </tr>
                ))
             )}
          </tbody>
        </table>
        <div className="p-4 border-t border-border/50 text-center text-xs text-muted-foreground bg-secondary/20">
           Showing last {activity.length} events.
        </div>
      </div>
    </div>
  );
}
