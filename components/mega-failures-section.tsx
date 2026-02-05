"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TextTooltip } from "@/components/ui/tooltip"
import { Skull, TrendingDown, DollarSign } from "lucide-react"
import { getTopGraveyardEntries, searchGraveyardByCategory, getGraveyardCategories, type FailedStartup } from "@/lib/algolia"
import { CategorySelectorPopup } from "@/components/category-selector-popup"

interface FailuresSectionProps {
  onSelect?: (startup: FailedStartup) => void
  selectedCategory?: string | null
  onCategoryChange?: (category: string | null) => void
}

export function FailuresSection({ onSelect, selectedCategory = null, onCategoryChange }: FailuresSectionProps) {
  const [startups, setStartups] = useState<FailedStartup[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Number of items to show: 5 default, up to 10 when filtered
        const itemsToShow = selectedCategory ? 10 : 5

        const results = selectedCategory
          ? await searchGraveyardByCategory(selectedCategory)
          : await getTopGraveyardEntries()

        setStartups(results.slice(0, itemsToShow))

        // Fetch categories for filtering
        const cats = await getGraveyardCategories()
        setCategories(cats.slice(0, 15))
      } catch (error) {
        console.error('Error fetching graveyard entries:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [selectedCategory])

  const handleCategoryChange = (category: string | null) => {
    if (onCategoryChange) {
      onCategoryChange(category)
    }
  }

  const formatFunding = (amount: number) => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
    return `$${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Skull className="w-6 h-6 text-red-400" />
          <h2 className="text-2xl font-semibold text-white">Notable Failures</h2>
        </div>
        {/* Fixed height skeleton for categories */}
        <div className="h-10 flex gap-2">
          <div className="h-8 w-20 bg-slate-800 rounded-full animate-pulse"></div>
          <div className="h-8 w-24 bg-slate-800 rounded-full animate-pulse"></div>
          <div className="h-8 w-16 bg-slate-800 rounded-full animate-pulse"></div>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-64 h-32 bg-slate-900/50 border border-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <Skull className="w-6 h-6 text-red-400" />
        <h2 className="text-2xl font-semibold text-white">Notable Failures</h2>
        <Badge className="ml-auto bg-red-500/20 text-red-400 border-red-500/50">
          <DollarSign className="w-3 h-3 mr-1" />
          By Funding Raised
        </Badge>
      </div>

      {/* Category Pills - Fixed height container */}
      <div className="min-h-[40px]">
        {categories.length > 0 && (
          <CategorySelectorPopup
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectionChange={handleCategoryChange}
            color="red"
          />
        )}
      </div>

      {/* Failure Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {startups.map((startup) => (
          <Tooltip
            key={startup.objectID}
            content={
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-white text-base">{startup.name}</p>
                  {startup.raised_amount && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30 flex-shrink-0">
                      💰 {formatFunding(startup.raised_amount)}
                    </span>
                  )}
                </div>
                {startup.what_they_did && (
                  <p className="text-slate-300 text-sm leading-relaxed">{startup.what_they_did}</p>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  {startup.sector && (
                    <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                      {startup.sector}
                    </span>
                  )}
                  {startup.year_founded && (
                    <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 border border-slate-600">
                      {startup.year_founded}{startup.year_closed ? `-${startup.year_closed}` : ''}
                    </span>
                  )}
                </div>
                {startup.why_they_failed && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                    <p className="text-red-300 text-sm font-medium">💀 Failure: {startup.why_they_failed}</p>
                  </div>
                )}
                {startup.takeaway && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2">
                    <p className="text-yellow-300 text-sm">💡 {startup.takeaway}</p>
                  </div>
                )}
              </div>
            }
          >
            <Card
              onClick={() => onSelect?.(startup)}
              className="flex-shrink-0 w-64 h-32 p-3 bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-red-500/50 hover:bg-red-500/5 transition-all cursor-pointer group flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <TextTooltip text={startup.name} detectTruncated={true}>
                  <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors truncate max-w-[140px]">
                    {startup.name}
                  </h3>
                </TextTooltip>
                <TrendingDown className="w-4 h-4 text-red-400 shrink-0" />
              </div>

              {startup.what_they_did && (
                <TextTooltip text={startup.what_they_did} detectTruncated={false}>
                  <p className="text-sm text-slate-400 line-clamp-2 mb-2 line-clamp flex-1">
                    {startup.what_they_did}
                  </p>
                </TextTooltip>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {startup.sector && (
                    <TextTooltip text={startup.sector} detectTruncated={true}>
                      <span className="text-xs text-red-300 truncate max-w-[80px]">
                        {startup.sector}
                      </span>
                    </TextTooltip>
                  )}
                  {startup.year_founded && (
                    <span className="text-xs text-slate-500">
                      {startup.year_founded}{startup.year_closed ? `-${startup.year_closed.toString().slice(2)}` : ''}
                    </span>
                  )}
                </div>

                {startup.raised_amount && (
                  <span className="text-sm font-bold text-red-400">
                    {formatFunding(startup.raised_amount)}
                  </span>
                )}
              </div>

              {startup.why_they_failed && (
                <TextTooltip text={startup.why_they_failed} detectTruncated={false}>
                  <p className="text-xs text-red-300 line-clamp-1 line-clamp">
                    💀 {startup.why_they_failed}
                  </p>
                </TextTooltip>
              )}
            </Card>
          </Tooltip>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center">
        💀 These startups raised millions but still failed. Learn from their mistakes.
      </p>
    </div>
  )
}
