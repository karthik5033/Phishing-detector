"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface TrendChartProps {
    data?: Array<{
        date: string;
        count: number;
    }>;
}

export function TrendChart({ data }: TrendChartProps) {
  // Fallback to empty array if no data yet (will show empty chart)
  const chartData = data || [];

  return (
    <div className="p-6 rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
       <div className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activity Trend</h3>
          <p className="text-xs text-muted-foreground mt-1">Threats and scans analyzed this week</p>
       </div>
       <div className="h-[250px] w-full mt-auto">
         <ResponsiveContainer width="100%" height="100%">
           <LineChart data={chartData}>
             <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={11} 
                tickLine={false} 
                axisLine={false} 
                dy={10}
             />
             <Tooltip 
                cursor={{ stroke: '#e2e8f0' }}
                contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    color: '#1e293b',
                    fontSize: '12px'
                }}
             />
             <Line 
                type="monotone" 
                dataKey="count" 
                name="Scans"
                stroke="#f43f5e" 
                strokeWidth={3} 
                dot={{ r: 4, fill: "#f43f5e", strokeWidth: 2, stroke: "#fff" }} 
                activeDot={{ r: 6, fill: "#f43f5e" }} 
                isAnimationActive={true}
             />
           </LineChart>
         </ResponsiveContainer>
       </div>
    </div>
  );
}
