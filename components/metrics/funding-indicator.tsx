import { InfoTooltip } from "@/components/info-tooltip"

interface FundingIndicatorProps {
  likelihood?: number | null;
}

export function FundingIndicator({ likelihood = 50 }: FundingIndicatorProps) {
  const getColor = (p: number) => {
    if (p >= 70) return { bg: 'bg-cyan-500', text: 'text-cyan-400', glow: 'glow-cyan' };
    if (p >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-400', glow: 'glow-yellow' };
    return { bg: 'bg-red-500', text: 'text-red-400', glow: 'glow-red' };
  };

  const { bg, text, glow } = getColor(likelihood ?? 50);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
          Funding Likelihood
          <InfoTooltip title="How Funding Likelihood is Calculated">
            <p className="mb-2">AI-estimated probability of securing VC funding based on:</p>
            <ul className="space-y-1">
              <li><span className="text-cyan-400">• Category trends:</span> Hot sectors get more interest</li>
              <li><span className="text-cyan-400">• Survival score:</span> Higher score = more investable</li>
              <li><span className="text-cyan-400">• YC pedigree:</span> YC alumni have better odds</li>
              <li><span className="text-cyan-400">• Hiring status:</span> Actively hiring = growth signal</li>
            </ul>
            <p className="mt-2 text-slate-400">Note: This is an estimate, not a guarantee. Investor decisions depend on many factors including team, traction, and market conditions.</p>
          </InfoTooltip>
        </span>
        <span className={`text-lg font-bold ${text}`}>{likelihood}%</span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${bg} transition-all duration-500 ease-out`}
          style={{ width: `${likelihood}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {(likelihood ?? 50) >= 70 ? 'VCs will be calling 💰' : (likelihood ?? 50) >= 40 ? 'Bootstrap or find angels 🚀' : 'Better bring cash 💸'}
      </p>
    </div>
  );
}
