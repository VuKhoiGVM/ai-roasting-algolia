import { InfoTooltip } from "@/components/info-tooltip"

interface SaturationMeterProps {
  saturation?: 'Low' | 'Medium' | 'High' | null;
}

export function SaturationMeter({ saturation = 'Medium' }: SaturationMeterProps) {
  const getSaturationColor = (level: string) => {
    switch (level) {
      case 'Low':
        return { bg: 'bg-green-500', text: 'text-green-400', bgOpacity: 'bg-green-500/20', border: 'border-green-500/50' };
      case 'High':
        return { bg: 'bg-red-500', text: 'text-red-400', bgOpacity: 'bg-red-500/20', border: 'border-red-500/50' };
      default:
        return { bg: 'bg-yellow-500', text: 'text-yellow-400', bgOpacity: 'bg-yellow-500/20', border: 'border-yellow-500/50' };
    }
  };

  const getLevel = (level: string) => {
    switch (level) {
      case 'Low': return 25;
      case 'High': return 90;
      default: return 55;
    }
  };

  const { bg, text, bgOpacity, border } = getSaturationColor(saturation || 'Medium');
  const level = getLevel(saturation || 'Medium');

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-300 flex items-center gap-1">
          Market Saturation
          <InfoTooltip title="How Market Saturation is Calculated">
            <p className="mb-2">Based on the number of active startups in the same category:</p>
            <ul className="space-y-1">
              <li><span className="text-green-400">• Low (0-100 startups):</span> Blue ocean, untapped market</li>
              <li><span className="text-yellow-400">• Medium (101-300 startups):</span> Moderate competition, established players</li>
              <li><span className="text-red-400">• High (300+ startups):</span> Crowded market, differentiation crucial</li>
            </ul>
            <p className="mt-2 text-slate-400">Source: YC startup database analysis by category.</p>
          </InfoTooltip>
        </span>
        <span className={`text-sm font-bold ${text} px-2 py-0.5 rounded ${bgOpacity} ${border} border`}>
          {saturation}
        </span>
      </div>
      <div className="h-3 bg-slate-800 rounded-full overflow-hidden relative">
        <div
          className={`h-full ${bg} transition-all duration-500 ease-out`}
          style={{ width: `${level}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">
        {saturation === 'Low' ? 'Blue ocean opportunity 🌊' : saturation === 'High' ? 'Crowded market 👥' : 'Moderate competition ⚔️'}
      </p>
    </div>
  );
}
