"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export interface ActiveFiltersProps {
  filters: Record<string, string[]>
  onRemoveFilter: (facet: string, value: string) => void
  onClearAll: () => void
  color?: "orange" | "red"
}

export function ActiveFilters({
  filters,
  onRemoveFilter,
  onClearAll,
  color = "orange"
}: ActiveFiltersProps) {
  const totalFilters = Object.values(filters).reduce((sum, values) => sum + values.length, 0)

  if (totalFilters === 0) return null

  const colorClasses = {
    orange: "bg-orange-500/20 text-orange-400 border-orange-500/50 hover:bg-orange-500/30",
    red: "bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30"
  }

  const badgeClass = colorClasses[color]

  return (
    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-900/30 border border-slate-700/30 rounded-lg">
      <span className="text-sm text-slate-500">Filters:</span>

      {Object.entries(filters).map(([facet, values]) =>
        values.map(value => (
          <Badge
            key={`${facet}-${value}`}
            variant="outline"
            className={`${badgeClass} cursor-pointer`}
            onClick={() => onRemoveFilter(facet, value)}
          >
            {facet}: {value}
            <X className="w-3 h-3 ml-1" />
          </Badge>
        ))
      )}

      {totalFilters > 1 && (
        <button
          onClick={onClearAll}
          className="text-xs text-slate-500 hover:text-slate-300 ml-2"
        >
          Clear all
        </button>
      )}
    </div>
  )
}
