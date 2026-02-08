"use client"

import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"
import { useState } from "react"

export interface FacetValue {
  value: string
  count: number
}

interface FacetFilterProps {
  title: string
  values: FacetValue[]
  selected: string[]
  onChange: (selected: string[]) => void
  color?: "orange" | "red"
  maxVisible?: number
  isLoading?: boolean
}

export function FacetFilter({
  title,
  values,
  selected,
  onChange,
  color = "orange",
  maxVisible = 5,
  isLoading = false
}: FacetFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

  // Show loading state
  if (isLoading) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/50 p-4">
        <div className="font-semibold text-white capitalize">{title}</div>
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
        </div>
      </div>
    )
  }

  // Only show "No values available" after loading is complete
  if (!values || values.length === 0) {
    return (
      <div className="border border-slate-700/50 rounded-lg bg-slate-900/50 p-4">
        <div className="font-semibold text-white capitalize">{title}</div>
        <div className="text-xs text-slate-500 mt-2">No values available</div>
      </div>
    )
  }

  const visibleValues = showAll ? values : values.slice(0, maxVisible)
  const hasMore = values.length > maxVisible

  const colorClasses = {
    orange: {
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      badgeSelected: "bg-orange-500 text-white border-orange-500",
      hover: "hover:bg-orange-500/30"
    },
    red: {
      badge: "bg-red-500/20 text-red-400 border-red-500/50",
      badgeSelected: "bg-red-500 text-white border-red-500",
      hover: "hover:bg-red-500/30"
    }
  }

  const colors = colorClasses[color]

  const toggleValue = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter(v => v !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  const clearAll = () => onChange([])

  return (
    <div className="border border-slate-700/50 rounded-lg bg-slate-900/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between text-left"
      >
        <span className="font-semibold text-white capitalize">{title}</span>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {selected.length > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-slate-500 hover:text-slate-300 mb-2"
            >
              Clear all ({selected.length})
            </button>
          )}

          {visibleValues.map(({ value, count }) => {
            const isSelected = selected.includes(value)
            return (
              <label
                key={value}
                className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                  isSelected ? colors.badgeSelected : "hover:bg-slate-800/50"
                }`}
              >
                {/* Temporarily visible checkbox for debugging */}
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleValue(value)}
                  className="w-4 h-4 rounded border-slate-500"
                />
                <span className="flex-1 text-sm capitalize text-left">{value}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${isSelected ? "bg-white/20 text-white border-white/30" : colors.badge}`}
                >
                  {count.toLocaleString()}
                </Badge>
              </label>
            )
          })}

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-xs text-orange-400 hover:text-orange-300 mt-2"
            >
              {showAll ? "Show less" : `Show ${values.length - maxVisible} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
