import { ArrowRight, RefreshCw } from 'lucide-react';

interface PivotCardProps {
  pivots: string[];
  onPivotClick?: (pivot: string) => void;
}

export function PivotCard({ pivots, onPivotClick }: PivotCardProps) {
  if (!pivots || pivots.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-cyan-400 flex items-center gap-2">
        <RefreshCw className="w-4 h-4" />
        Pivot Suggestions
      </h4>
      <div className="space-y-2">
        {pivots.map((pivot, idx) => (
          <button
            key={idx}
            onClick={(e) => {
              e.stopPropagation()
              onPivotClick?.(pivot)
            }}
            className="w-full text-left py-3 px-4 border border-cyan-500/30 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all group rounded-md flex items-start gap-2 min-h-0"
            type="button"
          >
            <span className="flex-1 break-words text-left leading-snug text-sm whitespace-normal">{pivot}</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
          </button>
        ))}
      </div>
    </div>
  );
}
