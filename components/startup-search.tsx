"use client"

import { useState, useEffect } from "react"
import { Search, Loader2, TrendingUp, Skull, Calendar, Building2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { searchAll, type Startup, type FailedStartup } from "@/lib/algolia"
import { STARTUPS } from "@/lib/startups"

interface StartupSearchProps {
  onSelect: (startup: Startup | FailedStartup) => void
}

export type SearchResult = (Startup | FailedStartup) & {
  source: 'startups' | 'graveyard'
  _highlightResult?: {
    name?: { value: string; matchLevel: string; matchedWords?: string[] }
    description?: { value: string; matchLevel: string; matchedWords?: string[] }
    category?: { value: string; matchLevel: string; matchedWords?: string[] }
  }
}

// Helper to render highlighted text safely
function renderHighlightedText(highlightedValue: string | undefined, fallbackText: string): React.ReactNode {
  if (!highlightedValue) return fallbackText

  // Split by <em> tags and render with proper styling
  const parts = highlightedValue.split(/(<em>.*?<\/em>)/g)
  return parts.map((part, index) => {
    if (part.startsWith('<em>') && part.endsWith('</em>')) {
      const content = part.slice(4, -5)
      return (
        <mark key={index} className="text-orange-400 font-semibold bg-orange-500/15 rounded-sm px-0.5 py-0.5 -mx-0.5">
          {content}
        </mark>
      )
    }
    return <span key={index}>{part}</span>
  })
}

// Helper functions for logos
function getCompanyLogo(startup: Startup): string | null {
  return startup.logo || startup.image || startup.company_image || null
}

function getInitials(name: string): string {
  const words = name.split(' ').filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].substring(0, 2).toUpperCase()
  return words.map(w => w[0]).join('').toUpperCase().substring(0, 2)
}

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

export default function StartupSearch({ onSelect }: StartupSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true)
        try {
          const searchResults = await searchAll(query)
          // Tag results with their source and sort: startups first, then graveyard
          const taggedResults = searchResults.map((r) => ({
            ...r,
            source: (r as any).raised_amount !== undefined ? 'graveyard' : 'startups'
          })) as SearchResult[]

          // Sort: startups first, then graveyard
          taggedResults.sort((a, b) => {
            if (a.source === 'startups' && b.source === 'graveyard') return -1
            if (a.source === 'graveyard' && b.source === 'startups') return 1
            return 0
          })

          setResults(taggedResults.slice(0, 8))
        } catch (error) {
          // Fallback to local data if Algolia fails
          const filtered = STARTUPS.filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.description.toLowerCase().includes(query.toLowerCase()) ||
              s.category.toLowerCase().includes(query.toLowerCase())
          )
          setResults(filtered.map((s) => ({
            ...s,
            objectID: s.id,
            source: 'startups' as const,
          })) as SearchResult[])
        }
        setIsOpen(true)
        setIsSearching(false)
      } else {
        setResults([])
        setIsOpen(false)
      }
    }, 300)

    return () => clearTimeout(searchTimer)
  }, [query])

  const handleSelect = (result: SearchResult) => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    onSelect(result)
  }

  const isFailed = (result: SearchResult): result is FailedStartup & { source: 'graveyard' } => {
    return result.source === 'graveyard'
  }

  const formatTimeRange = (result: SearchResult): string => {
    if (isFailed(result)) {
      const founded = result.year_founded
      const closed = result.year_closed
      if (founded && closed) {
        return `${founded} - ${closed}`
      } else if (result.years_of_operation) {
        return result.years_of_operation
      }
      return "Unknown"
    } else {
      const founded = result.year_founded
      return founded ? `${founded} - Present` : "Unknown"
    }
  }

  const formatFunding = (amount: number): string => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
    return `$${amount.toLocaleString()}`
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 z-10"/>
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search startups or failed companies (e.g., Airbnb, Quibi)..."
          className="pl-12 h-14 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 text-lg focus:border-orange-500/50 focus:ring-orange-500/20 backdrop-blur-sm transition-all focus:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin glow-orange" />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border-slate-700/80 overflow-hidden z-50 shadow-2xl shadow-orange-500/10 backdrop-blur-md">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {results.map((result, index) => {
              const firstFailedIndex = results.findIndex((r) => r.source === 'graveyard')
              const showSectionHeader = index === 0 || (index === firstFailedIndex && firstFailedIndex > 0)

              // Get logo info for active startups
              const logo = !isFailed(result) ? getCompanyLogo(result as Startup) : null
              const initials = getInitials(result.name)
              const gradient = getColorFromName(result.name)

              return (
                <div key={result.objectID}>
                  {showSectionHeader && (
                    <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider ${
                      result.source === 'startups' ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'
                    }`}>
                      {result.source === 'startups' ? '🟢 Active Startups' : '💀 Failed Companies'}
                    </div>
                  )}

                  <button
                    onClick={() => handleSelect(result)}
                    className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r transition-all duration-300 border-b border-slate-800/50 last:border-b-0 group ${
                      result.source === 'graveyard'
                        ? 'hover:from-red-500/10 hover:to-pink-500/10'
                        : 'hover:from-orange-500/10 hover:to-red-500/10'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon / Logo */}
                      {isFailed(result) ? (
                        // Failed companies get skull icon
                        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-2 bg-red-500/20 ring-red-500/30 group-hover:ring-red-500/50 transition-all">
                          <Skull className="w-5 h-5 text-red-400" />
                        </div>
                      ) : logo ? (
                        // Active startups with logo
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                          <img
                            src={logo}
                            alt={result.name}
                            className="w-8 h-8 rounded object-cover"
                            onError={(e) => {
                              // Fallback to initials on error
                              e.currentTarget.style.display = 'none'
                              const parent = e.currentTarget.parentElement
                              if (parent) {
                                parent.innerHTML = `<span class="text-white font-bold text-xs">${initials}</span>`
                              }
                            }}
                          />
                        </div>
                      ) : (
                        // Active startups without logo - show initials
                        <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                          <span className={`font-bold text-xs ${gradient}`}>{initials}</span>
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold group-hover:transition-colors ${
                              result.source === 'graveyard'
                                ? 'text-red-300 group-hover:text-red-400'
                                : 'text-white group-hover:text-orange-400'
                            }`}
                            title={result.name}
                          >
                            {renderHighlightedText(result._highlightResult?.name?.value, result.name)}
                          </span>

                          {/* Status Badge */}
                          <Badge className={`text-xs ${
                            result.source === 'graveyard'
                              ? 'bg-red-500/20 text-red-400 border-red-500/50'
                              : 'bg-green-500/20 text-green-400 border-green-500/50'
                          }`}>
                            {result.source === 'graveyard' ? 'Failed' : 'Active'}
                          </Badge>

                          {/* Time Range */}
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatTimeRange(result)}
                          </span>
                        </div>

                        {/* Description */}
                        <div
                          className="text-sm text-slate-400 truncate mt-1"
                          title={isFailed(result)
                            ? (result.what_they_did || result.sector || '')
                            : (result as Startup).description
                          }
                        >
                          {renderHighlightedText(
                            (result as SearchResult)._highlightResult?.description?.value,
                            isFailed(result)
                              ? (result.what_they_did || result.sector || '')
                              : (result as Startup).description
                          )}
                        </div>

                        {/* Metrics */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {/* Category */}
                          <Badge
                            variant="outline"
                            className="text-xs border-slate-600 text-slate-400"
                            title={result.category || (result as FailedStartup).sector || 'Unknown'}
                          >
                            {renderHighlightedText(
                              (result as SearchResult)._highlightResult?.category?.value,
                              result.category || (result as FailedStartup).sector || 'Unknown'
                            )}
                          </Badge>

                          {/* Startup-specific metrics */}
                          {!isFailed(result) && (result as Startup).batch && (
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              {(result as Startup).batch}
                            </span>
                          )}

                          {!isFailed(result) && (result as Startup).survival_score && (
                            <span
                              className={`text-xs px-2 py-0.5 rounded border ${
                                ((result as Startup).survival_score ?? 0) >= 70
                                  ? "bg-green-500/20 text-green-400 border-green-500/30"
                                  : ((result as Startup).survival_score ?? 0) >= 40
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-red-500/20 text-red-400 border-red-500/30"
                              }`}
                            >
                              {(result as Startup).survival_score}% survival
                            </span>
                          )}

                          {/* Failed-specific metrics */}
                          {isFailed(result) && result.raised_amount && (
                            <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                              💰 {formatFunding(result.raised_amount)} raised
                            </span>
                          )}

                          {isFailed(result) && result.why_they_failed && (
                            <span className="text-xs text-red-300 truncate max-w-[200px]" title={result.why_they_failed}>
                              💀 {result.why_they_failed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
