"use client"

import { useEffect, useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, X } from "lucide-react"
import { getCategories, searchStartupsByCategory, type Startup } from "@/lib/algolia"

interface CategoryPillsProps {
  onResultsChange?: (results: Startup[]) => void
  selectedCategory?: string | null
  onCategorySelect?: (category: string | null) => void
}

export function CategoryPills({ onResultsChange, selectedCategory, onCategorySelect }: CategoryPillsProps) {
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [allCategories, setAllCategories] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    getCategories().then(cats => {
      // Sort by count and take top 5
      const sorted = cats.sort((a, b) => b.count - a.count)
      setCategories(sorted.slice(0, 5))
      setAllCategories(sorted)
      setLoading(false)
    })
  }, [])

  const handleCategoryClick = async (category: string | null) => {
    onCategorySelect?.(category)
    setShowDropdown(false)

    if (!category) {
      onResultsChange?.([])
      return
    }

    const results = await searchStartupsByCategory(category)
    onResultsChange?.(results)
  }

  const totalCount = allCategories.reduce((sum, c) => sum + c.count, 0)

  if (loading) {
    return (
      <div className="flex gap-2 items-center">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-8 w-20 bg-slate-800 rounded-full animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      {/* Main category pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <Badge
          variant={selectedCategory === null ? "default" : "outline"}
          className={`cursor-pointer whitespace-nowrap transition-all ${
            selectedCategory === null
              ? "bg-orange-500 text-white border-orange-500"
              : "border-slate-600 text-slate-400 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400"
          }`}
          onClick={() => handleCategoryClick(null)}
        >
          All ({totalCount.toLocaleString()})
        </Badge>

        {categories.map((category) => (
          <Badge
            key={category.name}
            variant={selectedCategory === category.name ? "default" : "outline"}
            className={`cursor-pointer whitespace-nowrap transition-all ${
              selectedCategory === category.name
                ? "bg-orange-500 text-white border-orange-500"
                : "border-slate-600 text-slate-400 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400"
            }`}
            onClick={() => handleCategoryClick(category.name)}
          >
            {category.name} ({category.count.toLocaleString()})
          </Badge>
        ))}
      </div>

      {/* Dropdown for more categories */}
      <div className="relative" ref={dropdownRef}>
        <Badge
          variant="outline"
          className={`cursor-pointer transition-all ${
            showDropdown
              ? "bg-orange-500 text-white border-orange-500"
              : "border-slate-600 text-slate-400 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400"
          }`}
          onClick={() => setShowDropdown(!showDropdown)}
        >
          <span className="flex items-center gap-1">
            More <ChevronDown className="w-3 h-3" />
          </span>
        </Badge>

        {showDropdown && (
          <div className="absolute top-full left-0 mt-2 w-56 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 custom-scrollbar">
            <div className="p-2 space-y-1">
              {allCategories
                .filter(cat => !categories.slice(0, 5).some(c => c.name === cat.name))
                .map((category) => (
                  <button
                    key={category.name}
                    onClick={() => handleCategoryClick(category.name)}
                    className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                      selectedCategory === category.name
                        ? "bg-orange-500 text-white"
                        : "text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    {category.name}
                    <span className="text-slate-500 ml-2">({category.count.toLocaleString()})</span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
