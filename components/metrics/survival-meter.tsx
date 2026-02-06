import { SurvivalTooltip } from "@/components/survival-tooltip"
import type { SurvivalScoreBreakdown } from "@/lib/survival-calculator"

interface SurvivalMeterProps {
  probability?: number | null;
  breakdown?: SurvivalScoreBreakdown;
}

export function SurvivalMeter({ probability = 50, breakdown }: SurvivalMeterProps) {
  const getColor = (p: number) => {
    if (p >= 70) return { bg: 'bg-green-500', text: 'text-green-400', glow: 'glow-green' };
    if (p >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'glow-yellow' };
    return { bg: 'bg-red-500', text: 'text-red-400', glow: 'glow-red' };
  };

  const { bg, text, glow } = getColor(probability ?? 50);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
          Survival Probability
          <SurvivalTooltip score={probability} breakdown={breakdown} />
        </span>
        <span className={`text-lg font-bold ${text} ${glow}`}>{probability ?? 50}%</span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} transition-all duration-500 ease-out`}
          style={{ width: `${probability ?? 50}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {(probability ?? 50) >= 70 ? 'Strong potential 💪' : (probability ?? 50) >= 40 ? 'Risky territory ⚠️' : 'Danger zone 💀'}
      </p>
    </div>
  );
}
