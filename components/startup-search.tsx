"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Search, Loader2, Skull, Calendar, Clock, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FacetFilter, type FacetValue } from "@/components/facet-filter"
import { ActiveFilters } from "@/components/active-filters"
import { searchStartups, searchGraveyard, getAllFacets, type Startup, type FailedStartup } from "@/lib/algolia"
import { STARTUPS } from "@/lib/startups"
import type { SurvivalScoreBreakdown } from "@/lib/survival-calculator"

interface StartupSearchProps {
  onSelect: (startup: Startup | FailedStartup) => void
}

export type SearchResult = (Startup | FailedStartup) & {
  source: 'startups' | 'graveyard'
  _highlightResult?: {
    name?: { value: string; matchLevel: string; matchedWords?: string[] }
    description?: { value: string; matchLevel: string; matchedWords?: string[] }
    category?: { value: string; matchLevel: string; matchedWords?: string[] }
    what_they_did?: { value: string; matchLevel: string; matchedWords?: string[] }
  }
}

interface RecentSearch {
  id: string
  query: string
  timestamp: number
}

// Storage key for recent searches
const RECENT_SEARCHES_KEY = 'STARTUP_ROAST_SEARCHES'
const MAX_RECENT_SEARCHES = 5

// Helper to get/set recent searches
function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveRecentSearches(searches: RecentSearch[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches))
  } catch (e) {
    console.error('Failed to save recent searches:', e)
  }
}

function addRecentSearch(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return

  const searches = getRecentSearches()
  const filtered = searches.filter(s => s.query !== trimmed)
  const newSearches = [
    { id: Date.now().toString(), query: trimmed, timestamp: Date.now() },
    ...filtered
  ].slice(0, MAX_RECENT_SEARCHES)

  saveRecentSearches(newSearches)
}

function clearRecentSearches() {
  saveRecentSearches([])
}

// Helper to render highlighted text safely
function renderHighlightedText(highlightedValue: string | undefined, fallbackText: string): React.ReactNode {
  if (!highlightedValue) return fallbackText

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
    'text-orange-400', 'text-blue-400', 'text-green-400', 'text-purple-400',
    'text-cyan-400', 'text-pink-400', 'text-indigo-400', 'text-rose-400',
  ]
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

// Compact survival breakdown indicator for search results
function SurvivalBreakdownIndicator({ startup }: { startup: Startup }) {
  // Use pre-calculated breakdown from data, or calculate fallback
  const breakdown: SurvivalScoreBreakdown = startup.survival_breakdown || {
    total: startup.survival_score || 50,
    growth: startup.survival_score || 50,
    market: 50,
    team: startup.batch ? 100 : 25,
    funding: startup.is_hiring ? 85 : 50,
    trend: 50,
    penalty: 0
  }

  const factors = [
    { name: 'Growth', value: breakdown.growth, icon: '📈' },
    { name: 'Market', value: breakdown.market, icon: '⚡' },
    { name: 'Team', value: breakdown.team, icon: '👥' },
    { name: 'Funding', value: breakdown.funding, icon: '💰' },
  ]

  return (
    <div className="flex items-center gap-1.5 mt-1.5">
      {factors.map(f => {
        const color = f.value >= 70 ? 'bg-green-500' : f.value >= 40 ? 'bg-yellow-500' : 'bg-red-500'
        return (
          <div key={f.name} className="flex items-center gap-1 group/bfactor" title={`${f.name}: ${f.value}%`}>
            <span className="text-[10px]">{f.icon}</span>
            <div className="w-8 h-1 bg-slate-700 rounded-full overflow-hidden">
              <div className={`h-full ${color}`} style={{ width: `${f.value}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function StartupSearch({ onSelect }: StartupSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [isKeyboardNav, setIsKeyboardNav] = useState(false)

  // Facet state
  const [showFacets, setShowFacets] = useState(false)
  const [facetFilters, setFacetFilters] = useState<{
    category: string[]
    batch: string[]
    status: string[]
  }>({ category: [], batch: [], status: [] })
  const [facetData, setFacetData] = useState<{
    categories: FacetValue[]
    batches: FacetValue[]
    status: FacetValue[]
  }>({ categories: [], batches: [], status: [] })
  const [facetsLoaded, setFacetsLoaded] = useState(false)

  // Stringified version for dependency (forces re-run when content changes)
  const facetFiltersString = JSON.stringify(facetFilters)

  // Get section title based on applied status filters
  const getStartupSectionTitle = () => {
    const statusFilters = facetFilters.status
    if (statusFilters.length === 0) {
      return '🚀 YC Startups'
    }
    if (statusFilters.length === 1) {
      const status = statusFilters[0]
      switch (status) {
        case 'Active':
          return '🟢 Active Startups'
        case 'Inactive':
          return '⚪ Inactive Startups'
        case 'Acquired':
          return '🔵 Acquired Startups'
        default:
          return `${status} Startups`
      }
    }
    // Multiple statuses selected
    return '🚀 YC Startups'
  }

  // Get section color based on applied status filters
  const getStartupSectionStyles = () => {
    const statusFilters = facetFilters.status
    if (statusFilters.length === 1) {
      const status = statusFilters[0]
      switch (status) {
        case 'Active':
          return 'text-green-400 bg-green-500/10'
        case 'Inactive':
          return 'text-slate-400 bg-slate-500/10'
        case 'Acquired':
          return 'text-blue-400 bg-blue-500/10'
        default:
          return 'text-orange-400 bg-orange-500/10'
      }
    }
    return 'text-orange-400 bg-orange-500/10'
  }

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const facetFiltersRef = useRef(facetFilters)

  // Keep ref in sync with state
  useEffect(() => {
    facetFiltersRef.current = facetFilters
  }, [facetFilters])

  // Load recent searches and facet data on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches())
    // Load facet data
    getAllFacets().then(data => {
      setFacetData({
        categories: data.categories,
        batches: data.batches.slice(0, 10), // Top 10 batches
        status: data.status
      })
      setFacetsLoaded(true)
    }).catch((err) => {
      console.error('Failed to load facets:', err)
      setFacetsLoaded(true) // Mark as loaded even on error to avoid infinite loading state
    })
  }, [])

  // Reset itemRefs when results change
  useEffect(() => {
    itemRefs.current = []
  }, [results, recentSearches])

  // Reset keyboard nav flag when query changes
  useEffect(() => {
    setSelectedIndex(-1)
    setIsKeyboardNav(false)
  }, [query])
  useEffect(() => {
    if (selectedIndex >= 0 && isKeyboardNav) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex, isKeyboardNav])

  // Debounced search
  useEffect(() => {
    clearTimeout(searchTimeoutRef.current)

    // Check if any filters are active
    const hasActiveFilters = Object.values(facetFilters).some(arr => arr.length > 0)

    if (!query.trim() && !hasActiveFilters) {
      setResults([])
      setSelectedIndex(-1)
      // Show recent searches if available
      if (recentSearches.length > 0) {
        setIsOpen(true)
      } else {
        setIsOpen(false)
      }
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      // Use ref to get latest facetFilters state (avoid closure stale state)
      const currentFilters = facetFiltersRef.current
      console.log('🔍 Search triggered with filters:', currentFilters)
      setIsSearching(true)
      try {
        // Build facet filters for Algolia
        // Format: [[facet1:val1, facet1:val2], [facet2:val1]] means (facet1=val1 OR val2) AND facet2=val1
        const filters: string[][] = []

        if (currentFilters.category.length > 0) {
          filters.push(currentFilters.category.map(c => `category:${c}`))
        }
        if (currentFilters.batch.length > 0) {
          filters.push(currentFilters.batch.map(b => `batch:${b}`))
        }
        if (currentFilters.status.length > 0) {
          filters.push(currentFilters.status.map(s => `status:${s}`))
        }

        console.log('🔍 Sending to Algolia:', { filters, hasFilters: filters.length > 0 })

        // Search both indices in parallel
        const [startupsResults, graveyardResults] = await Promise.all([
          searchStartups(query, {
            hitsPerPage: 20,
            ...(filters.length > 0 && {
              facetFilters: filters
            })
          }),
          searchGraveyard(query) // Graveyard not filtered by facets
        ])

        // Combine results with source tagging
        const startupItems = startupsResults.slice(0, 5).map(r => ({ ...r, source: 'startups' as const }))
        const graveyardItems = graveyardResults.slice(0, 5).map(r => ({ ...r, source: 'graveyard' as const }))

        setResults([...startupItems, ...graveyardItems])
        setSelectedIndex(-1)
      } catch (error) {
        // Fallback to local data
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
      setIsSearching(false)
      setIsOpen(true)
    }, 300)

    return () => clearTimeout(searchTimeoutRef.current)
  }, [query, recentSearches.length, facetFiltersString])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node) &&
        !filterContainerRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Selection handler (defined before keyboard nav)
  const handleSelect = useCallback((result: SearchResult) => {
    setQuery("")
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    setIsKeyboardNav(false)
    addRecentSearch(result.name)
    setRecentSearches(getRecentSearches())
    onSelect(result)
  }, [onSelect])

  const handleRecentSearchClick = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
    setSelectedIndex(-1)
    setIsKeyboardNav(false)
    inputRef.current?.focus()
  }, [])

  const handleClearRecent = useCallback(() => {
    clearRecentSearches()
    setRecentSearches([])
    setSelectedIndex(-1)
    if (!query.trim()) {
      setIsOpen(false)
    }
  }, [query])

  // Facet handlers
  const handleRemoveFilter = useCallback((facet: string, value: string) => {
    setFacetFilters(prev => ({
      ...prev,
      [facet]: prev[facet as keyof typeof prev].filter(v => v !== value)
    }))
  }, [])

  const handleClearAllFilters = useCallback(() => {
    setFacetFilters({ category: [], batch: [], status: [] })
  }, [])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const hasResults = query.trim() && results.length > 0
    const hasRecentSearches = !query.trim() && recentSearches.length > 0
    const itemsCount = hasResults ? results.length : hasRecentSearches ? recentSearches.length : 0

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen && (hasResults || hasRecentSearches)) {
          setIsOpen(true)
        }
        setIsKeyboardNav(true)
        setSelectedIndex(prev => {
          const next = prev + 1
          return next < itemsCount ? next : itemsCount - 1
        })
        break
      case 'ArrowUp':
        e.preventDefault()
        setIsKeyboardNav(true)
        setSelectedIndex(prev => {
          const next = prev - 1
          return next >= 0 ? next : -1
        })
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < itemsCount) {
          if (hasResults) {
            handleSelect(results[selectedIndex])
          } else if (hasRecentSearches) {
            const recent = recentSearches[selectedIndex]
            setQuery(recent.query)
            setSelectedIndex(-1)
            setIsKeyboardNav(false)
          }
        }
        break
      case 'Escape':
        if (query.trim()) {
          // First Esc: Clear search and show recent searches
          setQuery("")
          setResults([])
          setSelectedIndex(-1)
          setIsKeyboardNav(false)
        } else {
          // Second Esc: Close dropdown
          setIsOpen(false)
          setSelectedIndex(-1)
          setIsKeyboardNav(false)
        }
        break
    }
  }, [isOpen, query, results, recentSearches, selectedIndex, handleSelect])

  const isFailed = (result: SearchResult): result is FailedStartup & { source: 'graveyard' } => {
    return result.source === 'graveyard'
  }

  const formatTimeRange = (result: SearchResult): string => {
    if (isFailed(result)) {
      const founded = result.year_founded
      const closed = (result as any).year_closed
      if (founded && closed) return `${founded} - ${closed}`
      if ((result as any).years_of_operation) return (result as any).years_of_operation
      return "Unknown"
    }
    const founded = result.year_founded
    return founded ? `${founded} - Present` : "Unknown"
  }

  const formatFunding = (amount: number): string => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
    return `$${amount.toLocaleString()}`
  }

  // Suggested categories for empty state
  const suggestedCategories = [
    "SaaS", "fintech", "AI", "marketplace", "healthcare", "crypto"
  ]

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 z-10 pointer-events-none"/>
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() || recentSearches.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search startups or failed companies (e.g., Airbnb, Quibi)... ↑↓ navigate, Esc to see recent"
          className="pl-12 h-14 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 text-lg focus:border-orange-500/50 focus:ring-orange-500/20 backdrop-blur-sm transition-all focus:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin glow-orange pointer-events-none" />
        )}
        {query && !isSearching && (
          <button
            onClick={() => {
              setQuery("")
              setResults([])
              setSelectedIndex(-1)
              inputRef.current?.focus()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Filters Section - both button and panel in one container */}
      {isOpen && (
        <div className="mt-2" ref={filterContainerRef}>
          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFacets(!showFacets)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                showFacets
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                  : 'bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
              {Object.values(facetFilters).flat().length > 0 && (
                <Badge className="ml-1 bg-orange-500 text-white text-xs">
                  {Object.values(facetFilters).flat().length}
                </Badge>
              )}
            </button>

          {/* Facet Panel */}
          {showFacets && (
            <Card className="mt-2 bg-slate-900/95 border-slate-700/80 p-4">
              {/* Active Filters */}
              <ActiveFilters
            filters={facetFilters}
            onRemoveFilter={handleRemoveFilter}
            onClearAll={handleClearAllFilters}
            color="orange"
          />

          {/* Facet Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            <FacetFilter
              key="category"
              title="Category"
              values={facetData.categories}
              selected={facetFilters.category}
              onChange={(vals) => setFacetFilters(f => ({ ...f, category: vals }))}
              color="orange"
              isLoading={!facetsLoaded}
            />

            <FacetFilter
              key="status"
              title="Status"
              values={facetData.status}
              selected={facetFilters.status}
              onChange={(vals) => setFacetFilters(f => ({ ...f, status: vals }))}
              color="orange"
              isLoading={!facetsLoaded}
            />

            <FacetFilter
              key="batch"
              title="YC Batch"
              values={facetData.batches}
              selected={facetFilters.batch}
              onChange={(vals) => setFacetFilters(f => ({ ...f, batch: vals }))}
              color="orange"
              maxVisible={3}
              isLoading={!facetsLoaded}
            />
          </div>
        </Card>
          )}
        </div>
      )}

      {isOpen && (
        <Card ref={dropdownRef} className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border-slate-700/80 overflow-hidden z-50 shadow-2xl shadow-orange-500/10 backdrop-blur-md">
          <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
            {/* Recent Searches */}
            {!query.trim() && recentSearches.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-800/50 flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Recent Searches
                  </span>
                  <button
                    onClick={handleClearRecent}
                    className="text-slate-500 hover:text-red-400 transition-colors text-xs"
                  >
                    Clear
                  </button>
                </div>
                {recentSearches.map((recent, index) => (
                  <button
                    key={recent.id}
                    ref={el => { itemRefs.current[index] = el }}
                    onClick={() => handleRecentSearchClick(recent.query)}
                    onMouseEnter={() => !isKeyboardNav && setSelectedIndex(index)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-800/50 transition-colors border-b border-slate-800/50 last:border-b-0 flex items-center gap-3 ${
                      selectedIndex === index ? 'bg-orange-500/10 border-l-2 border-l-orange-500' : ''
                    }`}
                  >
                    <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="text-slate-300">{recent.query}</span>
                  </button>
                ))}
              </>
            )}

            {/* Search Results */}
            {query.trim() && results.length > 0 && (
              results.map((result, index) => {
                const firstFailedIndex = results.findIndex((r) => r.source === 'graveyard')
                const showSectionHeader = index === 0 || (index === firstFailedIndex && firstFailedIndex > 0)

                // Get logo info for active startups
                const logo = !isFailed(result) ? getCompanyLogo(result as Startup) : null
                const initials = getInitials(result.name)
                const gradient = getColorFromName(result.name)

                return (
                  <div key={result.objectID}>
                    {showSectionHeader && (
                      <div className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider sticky top-0 z-10 bg-slate-900/95 backdrop-blur-sm ${
                        result.source === 'startups' ? getStartupSectionStyles() : 'text-red-400 bg-red-500/10'
                      }`}>
                        {result.source === 'startups' ? getStartupSectionTitle() : '💀 Failed Companies'}
                      </div>
                    )}

                    <button
                      ref={el => { itemRefs.current[index] = el }}
                      onClick={() => handleSelect(result)}
                      onMouseEnter={() => !isKeyboardNav && setSelectedIndex(index)}
                      className={`w-full text-left px-4 py-3 hover:bg-gradient-to-r transition-all duration-300 border-b border-slate-800/50 last:border-b-0 group outline-none ${
                        selectedIndex === index ? 'bg-orange-500/10 border-l-2 border-l-orange-500 -ml-0.5 pl-[18px]' : ''
                      } ${
                        result.source === 'graveyard'
                          ? 'hover:from-red-500/10 hover:to-pink-500/10'
                          : 'hover:from-orange-500/10 hover:to-red-500/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon / Logo */}
                        {isFailed(result) ? (
                          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 ring-2 bg-red-500/20 ring-red-500/30 group-hover:ring-red-500/50 transition-all">
                            <Skull className="w-5 h-5 text-red-400" />
                          </div>
                        ) : logo ? (
                          <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                            <img
                              src={logo}
                              alt={result.name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none'
                                const parent = e.currentTarget.parentElement
                                if (parent) {
                                  parent.innerHTML = `<span class="text-white font-bold text-xs">${initials}</span>`
                                }
                              }}
                            />
                          </div>
                        ) : (
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

                            {/* Status Badge - shows actual status from data */}
                            {result.source === 'graveyard' ? (
                              <Badge className="text-xs bg-red-500/20 text-red-400 border-red-500/50">
                                Failed
                              </Badge>
                            ) : (result as Startup).status ? (
                              <Badge className={`text-xs ${
                                (result as Startup).status === 'Active'
                                  ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                  : (result as Startup).status === 'Inactive'
                                  ? 'bg-slate-500/20 text-slate-400 border-slate-500/50'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/50'
                              }`}>
                                {(result as Startup).status}
                              </Badge>
                            ) : null}

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
                              ? ((result as any).what_they_did || (result as any).sector || '')
                              : (result as Startup).description
                            }
                          >
                            {renderHighlightedText(
                              result._highlightResult?.description?.value || result._highlightResult?.what_they_did?.value,
                              isFailed(result)
                                ? ((result as any).what_they_did || (result as any).sector || '')
                                : (result as Startup).description
                            )}
                          </div>

                          {/* Metrics */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Category */}
                            <Badge
                              variant="outline"
                              className="text-xs border-slate-600 text-slate-400"
                              title={result.category || (result as any).sector || 'Unknown'}
                            >
                              {renderHighlightedText(
                                result._highlightResult?.category?.value,
                                result.category || (result as any).sector || 'Unknown'
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

                            {/* Survival Breakdown Indicator for startups */}
                            {!isFailed(result) && (result as Startup).survival_score && (
                              <SurvivalBreakdownIndicator startup={result as Startup} />
                            )}

                            {/* Failed-specific metrics */}
                            {isFailed(result) && (result as any).raised_amount && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
                                💰 {formatFunding((result as any).raised_amount)} raised
                              </span>
                            )}

                            {isFailed(result) && (result as any).why_they_failed && (
                              <span className="text-xs text-red-300 truncate max-w-[200px]" title={(result as any).why_they_failed}>
                                💀 {(result as any).why_they_failed}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  </div>
                )
              })
            )}

            {/* Empty State with Suggestions */}
            {query.trim() && results.length === 0 && !isSearching && (
              <div className="py-8 px-4 text-center">
                <p className="text-slate-400 mb-4">No companies found for "{query}"</p>
                <p className="text-slate-500 text-sm mb-4">Try searching for a popular category:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestedCategories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setQuery(cat)}
                      className="px-3 py-1.5 text-sm bg-slate-800/50 text-slate-400 hover:text-orange-400 hover:bg-orange-500/10 border border-slate-700/50 hover:border-orange-500/30 rounded-full transition-all"
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* No recent searches hint */}
            {!query.trim() && recentSearches.length === 0 && (
              <div className="py-8 px-4 text-center">
                <p className="text-slate-500 text-sm">
                  🔍 Start typing to search companies
                </p>
                <p className="text-slate-600 text-xs mt-2">
                  Use ↑↓ arrows to navigate, Enter to select
                </p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
