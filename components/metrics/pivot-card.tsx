import { ArrowRight, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
          <Button
            key={idx}
            onClick={() => onPivotClick?.(pivot)}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4 border-cyan-500/30 text-slate-300 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:text-cyan-400 transition-all group"
          >
            <span className="flex-1">{pivot}</span>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </Button>
        ))}
      </div>
    </div>
  );
}
