# Phase 5: Faceted Search UI (Optional)

**Priority:** P2 (Medium Impact - 2 hours)
**Status:** Nice to Have

## Overview

Add visual filter components that showcase Algolia's faceting capabilities. Let users filter by category, status, YC batch without typing.

## Components

### 1. FacetFilter Component

**File:** `components/facet-filter.tsx` (NEW)

```typescript
"use client"

import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"

interface FacetValue {
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
}

export function FacetFilter({
  title,
  values,
  selected,
  onChange,
  color = "orange",
  maxVisible = 5
}: FacetFilterProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showAll, setShowAll] = useState(false)

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
    if (selected.includes(value)) {
      onChange(selected.filter(v => v !== value))
    } else {
      onChange([...selected, value])
    }
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
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleValue(value)}
                  className="sr-only"
                />
                <span className="flex-1 text-sm capitalize">{value}</span>
                <Badge
                  variant="outline"
                  className={`text-xs ${isSelected ? "bg-white/20 text-white border-white/30" : colors.badge}`}
                >
                  {count}
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
```

### 2. ActiveFilters Component

**File:** `components/active-filters.tsx` (NEW)

```typescript
"use client"

import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

interface ActiveFiltersProps {
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
```

### 3. Integration in StartupSearch

**File:** `components/startup-search.tsx` (UPDATE)

Add faceted search panel:

```typescript
import { FacetFilter } from "@/facet-filter"
import { ActiveFilters } from "@/active-filters"
import { getCategories, getGraveyardCategories } from "@/lib/algolia"

// In component, add state for facets
const [facetFilters, setFacetFilters] = useState({
  category: [] as string[],
  status: [] as string[],
  batch: [] as string[]
})

// Load facets on mount
useEffect(() => {
  getCategories().then(cats => setCategoryFacets(cats))
}, [])

// Update search to use facet filters
const searchWithFacets = async (query: string) => {
  const filters = Object.entries(facetFilters)
    .filter(([_, values]) => values.length > 0)
    .map(([facet, values]) =>
      values.map(v => `${facet}:"${v}"`).join(' OR ')
    )
    .join(' AND ')

  const [startups, graveyard] = await Promise.all([
    searchStartups(query, {
      hitsPerPage: 20,
      ...(filters && { filters })
    }),
    searchGraveyard(query) // Graveyard not filtered by facets
  ])

  return { startups, graveyard }
}

// UI addition - add filter panel next to or below results
{isOpen && (
  <div className="relative">
    {/* Existing results dropdown */}

    {/* NEW: Facet panel */}
    <div className="absolute top-full left-0 right-0 mt-2 p-4 bg-slate-900/98 border border-slate-700/50 rounded-lg">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FacetFilter
          title="Category"
          values={categoryFacets}
          selected={facetFilters.category}
          onChange={(vals) => setFacetFilters(f => ({ ...f, category: vals }))}
        />

        <FacetFilter
          title="Status"
          values={[
            { value: "Active", count: 2525 },
            { value: "Inactive", count: 100 }
          ]}
          selected={facetFilters.status}
          onChange={(vals) => setFacetFilters(f => ({ ...f, status: vals }))}
        />

        <FacetFilter
          title="YC Batch"
          values={[
            { value: "W24", count: 200 },
            { value: "W23", count: 400 },
            { value: "W22", count: 350 }
          ]}
          selected={facetFilters.batch}
          onChange={(vals) => setFacetFilters(f => ({ ...f, batch: vals }))}
          maxVisible={3}
        />
      </div>

      <ActiveFilters
        filters={facetFilters}
        onRemoveFilter={(facet, value) => {
          setFacetFilters(f => ({
            ...f,
            [facet]: f[facet].filter(v => v !== value)
          }))
        }}
        onClearAll={() => setFacetFilters({ category: [], status: [], batch: [] })}
      />
    </div>
  </div>
)}
```

## Design Notes

1. **Mobile:** Stack filters vertically, use accordion style
2. **Desktop:** Show filters in 3-column grid
3. **Color:** Use orange for startups, red for graveyard
4. **Collapse:** Facets start expanded, can collapse to save space

## Acceptance Criteria

- [ ] FacetFilter component displays values with counts
- [ ] Checkboxes toggle filter selection
- [ ] Selected filters shown as badges
- [ ] ActiveFilters component shows current selections
- [ ] Clear all removes all filters
- [ ] Search results update when filters change
- [ ] Mobile responsive (stacked layout)
