"use client";

import { useMemo, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DataPoint {
  date: string;
  count: number;
}

interface ActivityChartProps {
  data: DataPoint[];
  color?: string;
}

export function ActivityChart({ data, color = "#f43f5e" }: ActivityChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<DataPoint | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. ROBUST PATH GENERATION (Midpoint Bezier)
  // This guarantees continuity and prevents "overshoot" or "broken lines".
  const { points, pathD, areaPathD } = useMemo(() => {
    if (!data || data.length === 0) return { points: [], pathD: "", areaPathD: "" };
    
    // Y-Axis Scaling: Map 0 to maxVal -> height to 0 (SVG coords)
    // We leave padding: Top 5, Bottom 45
    const maxVal = Math.max(...data.map(d => d.count), 5) * 1.2;
    
    const pts = data.map((d, i) => ({
      x: (i / (data.length - 1 || 1)) * 100, // Handle length 1 case
      y: 45 - (d.count / maxVal) * 40, 
      ...d
    }));

    if (pts.length < 2) {
        // Single point case - draw a flat line or dot
        return { 
            points: pts, 
            pathD: `M 0,${pts[0]?.y || 45} L 100,${pts[0]?.y || 45}`,
            areaPathD: `M 0,${pts[0]?.y || 45} L 100,${pts[0]?.y || 45} L 100,50 L 0,50 Z`
        };
    }

    let d = `M ${pts[0].x},${pts[0].y}`;
    
    // Midpoint Bezier Interpolation
    for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        
        // Control points at mid-X, maintaining previous/next Y respectively
        // This creates a smooth "S" curve transition
        const midX = (p0.x + p1.x) / 2;
        
        d += ` C ${midX},${p0.y} ${midX},${p1.y} ${p1.x},${p1.y}`;
    }

    const areaD = `${d} L 100,50 L 0,50 Z`;

    return { points: pts, pathD: d, areaPathD: areaD };
  }, [data]);

  // 2. INTERACTION HANDLERS
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || points.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const xPercent = (x / width) * 100;

    // Find nearest point
    const closest = points.reduce((prev, curr) => 
      Math.abs(curr.x - xPercent) < Math.abs(prev.x - xPercent) ? curr : prev
    );

    setHoveredPoint(closest);
    setHoverPos({ x: closest.x, y: closest.y });
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
    setHoverPos(null);
  };

  if (!data.length) return <div className="h-full w-full flex items-center justify-center text-slate-300 text-[10px] uppercase tracking-widest">No Metric Data</div>;

  return (
    <div 
      className="relative w-full h-full select-none touch-none"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
        <svg 
            viewBox="0 0 100 50" 
            preserveAspectRatio="none" 
            className="w-full h-full overflow-visible"
        >
            <defs>
                <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.15" />
                    <stop offset="90%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* AREA FILL */}
            <motion.path 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                d={areaPathD} 
                fill="url(#chartFill)" 
                stroke="none"
            />

            {/* MAIN STROKE */}
            {/* Using standard stroke without custom filters for reliability */}
            <motion.path 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                d={pathD} 
                fill="none" 
                stroke={color} 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                vectorEffect="non-scaling-stroke"
            />
            
            {/* HOVER CURSOR LINE */}
            <AnimatePresence>
                {hoverPos && (
                    <motion.line
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        x1={hoverPos.x} y1={5} 
                        x2={hoverPos.x} y2={50}
                        stroke={color}
                        strokeOpacity={0.3}
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />
                )}
            </AnimatePresence>

             {/* HOVER DOT (Tiny & Precise) */}
            <AnimatePresence>
                {hoverPos && (
                    <motion.circle 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20 }}
                        cx={hoverPos.x} cy={hoverPos.y} r="3" 
                        fill={color} 
                        stroke="white" 
                        strokeWidth="2" 
                        vectorEffect="non-scaling-stroke"
                        className="drop-shadow-sm"
                    />
                )}
            </AnimatePresence>
        </svg>

        {/* COMPACT TOOLTIP */}
        <AnimatePresence>
            {hoveredPoint && hoverPos && (
                <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute z-30 pointer-events-none"
                    style={{
                        left: `${hoverPos.x}%`,
                        top: `${(hoverPos.y / 50) * 100}%`,
                    }}
                >
                    <div className="transform -translate-x-1/2 -translate-y-[150%] bg-slate-900 text-white text-[10px] rounded px-2 py-1 shadow-lg border border-slate-700 flex flex-col items-center">
                        <span className="font-bold">{hoveredPoint.count}</span>
                        {/* Tiny chevron arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-slate-900"></div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* X AXIS LABLES */}
        <div className="absolute bottom-0 left-0 w-full flex justify-between px-1">
             {data.map((d, i) => (
                 <span key={i} className={cn(
                     "text-[8px] font-bold text-slate-300 uppercase transition-colors duration-200 select-none",
                     hoveredPoint?.date === d.date ? "text-slate-900" : ""
                 )}>
                    {d.date}
                 </span>
             ))}
        </div>
    </div>
  );
}
