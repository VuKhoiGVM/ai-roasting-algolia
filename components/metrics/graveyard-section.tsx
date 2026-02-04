import { Skull } from 'lucide-react';

interface GraveyardEntry {
  name: string;
  failure_reason: string;
}

interface GraveyardSectionProps {
  entries: GraveyardEntry[];
}

export function GraveyardSection({ entries }: GraveyardSectionProps) {
  if (!entries || entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-pink-400 flex items-center gap-2">
        <Skull className="w-4 h-4" />
        Similar Failures from the Graveyard
      </h4>
      <div className="space-y-2">
        {entries.map((entry, idx) => (
          <div
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border border-pink-500/20 hover:bg-pink-500/5 hover:border-pink-500/40 transition-all"
          >
            <span className="text-pink-500 mt-0.5">💀</span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-white">{entry.name}</p>
              <p className="text-sm text-slate-400">{entry.failure_reason}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
