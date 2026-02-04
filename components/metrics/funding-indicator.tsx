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
        <span className="text-sm font-medium text-slate-300">Funding Likelihood</span>
        <span className={`text-lg font-bold ${text} ${glow}`}>{likelihood}%</span>
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
