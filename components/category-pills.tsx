"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { getCategories, searchStartupsByCategory, type Startup } from "@/lib/algolia"

interface CategoryPillsProps {
  onResultsChange?: (results: Startup[]) => void
  selectedCategory?: string | null
  onCategorySelect?: (category: string | null) => void
}

export function CategoryPills({ onResultsChange, selectedCategory, onCategorySelect }: CategoryPillsProps) {
  const [categories, setCategories] = useState<{ name: string; count: number }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCategories().then(cats => {
      setCategories(cats.slice(0, 15))
      setLoading(false)
    })
  }, [])

  const handleCategoryClick = async (category: string | null) => {
    onCategorySelect?.(category)

    if (!category) {
      onResultsChange?.([])
      return
    }

    const results = await searchStartupsByCategory(category)
    onResultsChange?.(results)
  }

  if (loading) {
    return (
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
          <div key={i} className="h-8 w-24 bg-slate-800 rounded-full animate-pulse" />
        ))}
      </div>
    )
  }

  return (
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
        All ({categories.reduce((sum, c) => sum + c.count, 0).toLocaleString()})
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
  )
}
