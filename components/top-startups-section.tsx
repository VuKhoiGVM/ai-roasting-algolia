"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TextTooltip } from "@/components/ui/tooltip"
import { TrendingUp, Sparkles, Info } from "lucide-react"
import { getTopStartups, searchStartups, getCategories, type Startup, calculateSurvivalScore } from "@/lib/algolia"
import { CategorySelectorPopup } from "@/components/category-selector-popup"
import type { SurvivalScoreBreakdown } from "@/lib/survival-calculator"

interface TopStartupsSectionProps {
  onSelect: (startup: Startup) => void
  selectedCategory?: string | null
  onCategoryChange?: (category: string | null) => void
}

// Survival Score Legend Component - hover tooltip below the button
function SurvivalScoreLegend() {
  return (
    <Tooltip
      side="bottom"
      maxWidth="20rem"
      content={
        <div className="flex items-center gap-3 py-1">
          <span className="text-green-400 text-xs">70%+ Excellent</span>
          <span className="w-px h-3 bg-slate-600"></span>
          <span className="text-yellow-400 text-xs">40-69% Good</span>
          <span className="w-px h-3 bg-slate-600"></span>
          <span className="text-red-400 text-xs">&lt;40% Risky</span>
        </div>
      }
    >
      <button className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-800/50 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 transition-all border border-slate-700/50 hover:border-orange-500/30">
        <Info className="w-3.5 h-3.5" />
      </button>
    </Tooltip>
  )
}

// Survival Breakdown Component - shows factor bars
function SurvivalBreakdown({ breakdown }: { breakdown: SurvivalScoreBreakdown }) {
  const FactorBar = ({
    icon,
    label,
    value,
    max = 100
  }: {
    icon: string
    label: string
    value: number
    max?: number
  }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100))
    const color =
      value >= 70 ? 'bg-green-500' : value >= 40 ? 'bg-yellow-500' : 'bg-red-500'

    return (
      <div className="flex items-center gap-2 text-xs">
        <span className="w-4 text-center">{icon}</span>
        <span className="w-20 text-slate-400">{label}</span>
        <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full ${color}`} style={{ width: `${percentage}%` }} />
        </div>
        <span className={`w-8 text-right font-medium ${
          value >= 70 ? 'text-green-400' : value >= 40 ? 'text-yellow-400' : 'text-red-400'
        }`}>
          {value}%
        </span>
      </div>
    )
  }

  return (
    <div className="space-y-2 pt-2 border-t border-slate-700/50 mt-2">
      <p className="text-xs text-slate-500 font-medium">Score Breakdown</p>
      <FactorBar icon="📈" label="Growth (35%)" value={breakdown.growth} />
      <FactorBar icon="⚡" label="Market (25%)" value={breakdown.market} />
      <FactorBar icon="👥" label="Team (20%)" value={breakdown.team} />
      <FactorBar icon="💰" label="Funding (15%)" value={breakdown.funding} />
      <FactorBar icon="🔥" label="Trend (5%)" value={breakdown.trend} />
      {breakdown.penalty > 0 && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <span className="w-4 text-center">⚠️</span>
          <span className="text-slate-400">Failure Penalty</span>
          <span className="ml-auto font-medium">-{breakdown.penalty}%</span>
        </div>
      )}
    </div>
  )
}

// Helper to get company logo with fallback
function getCompanyLogo(startup: Startup): string | null {
  return startup.logo || startup.image || startup.company_image || null
}

// Helper to generate initials from name
function getInitials(name: string): string {
  const words = name.split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 2)
}

// Helper to generate consistent color from name
function getColorFromName(name: string): string {
  const colors = [
    'text-orange-400',
    'text-blue-400',
    'text-green-400',
    'text-purple-400',
    'text-cyan-400',
    'text-pink-400',
    'text-indigo-400',
    'text-rose-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function TopStartupsSection({ onSelect, selectedCategory = null, onCategoryChange }: TopStartupsSectionProps) {
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Array<{ name: string; count: number }>>([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        // Number of items to show: 5 default, up to 10 when filtered
        const itemsToShow = selectedCategory ? 10 : 5

        const results = selectedCategory
          ? await searchStartups('', { category: selectedCategory, hitsPerPage: itemsToShow })
          : await getTopStartups()

        setStartups(results.slice(0, itemsToShow))

        // Fetch categories using the facets API
        const categoryData = await getCategories()
        setCategories(categoryData)
      } catch (error) {
        console.error('Error fetching startups:', error)
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

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-semibold text-white">Top Startups</h2>
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
        <TrendingUp className="w-6 h-6 text-orange-400" />
        <h2 className="text-2xl font-semibold text-white">Top Startups</h2>
        <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/50">
          <Sparkles className="w-3 h-3 mr-1" />
          By Survival Score
        </Badge>
        <SurvivalScoreLegend />
      </div>

      {/* Category Pills - Fixed height container */}
      <div className="min-h-[40px]">
        {categories.length > 0 && (
          <CategorySelectorPopup
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectionChange={handleCategoryChange}
            color="orange"
          />
        )}
      </div>

      {/* Startup Cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {startups.map((startup) => {
          const logo = getCompanyLogo(startup)
          const initials = getInitials(startup.name)
          const textColor = getColorFromName(startup.name)
          const breakdown = calculateSurvivalScore(startup)

          return (
            <Tooltip
              key={startup.objectID}
              content={
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-white text-base">{startup.name}</p>
                    {startup.survival_score && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                          startup.survival_score >= 70
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : startup.survival_score >= 40
                            ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                        }`}
                      >
                        {startup.survival_score}% survival
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{startup.description}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {startup.category && (
                      <span className="text-xs px-2 py-1 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        {startup.category}
                      </span>
                    )}
                    {startup.batch && (
                      <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300 border border-slate-600">
                        {startup.batch}
                      </span>
                    )}
                    {startup.saturation && (
                      <span className={`text-xs px-2 py-1 rounded border ${
                        startup.saturation === 'High'
                          ? 'bg-red-500/20 text-red-400 border-red-500/30'
                          : startup.saturation === 'Medium'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}>
                        {startup.saturation} Saturation
                      </span>
                    )}
                    {startup.year_founded && (
                      <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-400 border border-slate-600">
                        Since {startup.year_founded}
                      </span>
                  )}
                  </div>
                  {startup.website && (
                    <a
                      href={startup.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1"
                    >
                      <span className="underline">{startup.website}</span>
                    </a>
                  )}
                  <SurvivalBreakdown breakdown={breakdown} />
                </div>
              }
            >
              <Card
                onClick={() => onSelect(startup)}
                className="flex-shrink-0 w-64 h-32 p-3 bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 flex items-center justify-center shrink-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={startup.name}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-slate-600/50"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          const parent = e.currentTarget.parentElement
                          if (parent) {
                            parent.innerHTML = `<span class="font-bold text-sm ${textColor} ring-1 ring-slate-600/50 w-10 h-10 rounded-lg flex items-center justify-center">${initials}</span>`
                          }
                        }}
                      />
                    ) : (
                      <span className={`font-bold text-sm ${textColor} ring-1 ring-slate-600/50 w-10 h-10 rounded-lg flex items-center justify-center`}>{initials}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <TextTooltip text={startup.name} detectTruncated={true}>
                        <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors truncate max-w-[120px]">
                          {startup.name}
                        </h3>
                      </TextTooltip>
                      {startup.survival_score && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ${
                            startup.survival_score >= 70
                              ? "bg-green-500/20 text-green-400 border border-green-500/30"
                              : startup.survival_score >= 40
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                              : "bg-red-500/20 text-red-400 border border-red-500/30"
                          }`}
                        >
                          {startup.survival_score}%
                        </span>
                      )}
                    </div>
                    <TextTooltip text={startup.description} detectTruncated={false}>
                      <p className="text-sm text-slate-400 line-clamp-2 mb-1 line-clamp">
                        {startup.description}
                      </p>
                    </TextTooltip>
                    <div className="flex items-center gap-2">
                      {startup.category && (
                        <TextTooltip text={startup.category} detectTruncated={true}>
                          <span className="text-xs text-cyan-400 truncate max-w-[120px]">
                            {startup.category}
                          </span>
                        </TextTooltip>
                      )}
                      {startup.batch && (
                        <span className="text-xs text-slate-500">{startup.batch}</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Tooltip>
          )
        })}
      </div>
    </div>
  )
}
