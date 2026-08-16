import React from 'react';
import { LabelAnalysis } from '../types/analysis';

interface ExplanationPanelProps {
    detections: Record<string, LabelAnalysis>;
}

export const ExplanationPanel: React.FC<ExplanationPanelProps> = ({ detections }) => {
    const getRiskColor = (prob: number) => {
        if (prob > 0.75) return 'text-rose-400';
        if (prob > 0.4) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(detections).map(([label, info]) => {
                const isFlagged = info.probability > 0.5;
                return (
                    <div
                        key={label}
                        className={`p-6 rounded-2xl border transition-all duration-300 ${isFlagged ? 'bg-zinc-900 border-zinc-700 shadow-lg' : 'bg-zinc-950/50 border-zinc-900 opacity-60'}`}
                    >
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold capitalize text-zinc-200">{label}</h3>
                            <span className={`font-mono text-sm font-bold ${getRiskColor(info.probability)}`}>
                                {Math.round(info.probability * 100)}%
                            </span>
                        </div>

                        {info.top_features.length > 0 ? (
                            <div className="space-y-3">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold">Evidence Markers</p>
                                <div className="flex flex-wrap gap-2">
                                    {info.top_features.map((feature, idx) => (
                                        <span
                                            key={idx}
                                            className="px-2.5 py-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded-lg hover:border-zinc-500 transition-colors"
                                        >
                                            {feature.word}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-zinc-600 italic">No significant triggers identified.</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
