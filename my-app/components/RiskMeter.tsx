import React from 'react';

interface RiskMeterProps {
    score: number;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score }) => {
    const percentage = Math.round(score * 100);

    const getRiskColor = (s: number) => {
        if (s > 0.75) return 'text-rose-500';
        if (s > 0.4) return 'text-amber-500';
        return 'text-emerald-500';
    };

    const getRiskBg = (s: number) => {
        if (s > 0.75) return 'bg-rose-500/10 border-rose-500/20';
        if (s > 0.4) return 'bg-amber-500/10 border-amber-500/20';
        return 'bg-emerald-500/10 border-emerald-500/20';
    };

    return (
        <div className={`p-8 rounded-3xl border transition-all duration-500 ${getRiskBg(score)}`}>
            <div className="flex flex-col items-center justify-center space-y-2">
                <div className={`text-7xl font-black tracking-tighter ${getRiskColor(score)}`}>
                    {percentage}%
                </div>
                <div className="text-zinc-500 uppercase tracking-widest font-bold text-xs">Total Risk Score</div>

                <div className="w-full mt-6 h-1.5 bg-zinc-800/50 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-1000 ${score > 0.75 ? 'bg-rose-500' : score > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${percentage}%` }}
                    />
                </div>
            </div>
        </div>
    );
};
