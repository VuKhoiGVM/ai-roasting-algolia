"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { searchStartups, type Startup } from "@/lib/algolia"
import { STARTUPS } from "@/lib/startups"

interface StartupSearchProps {
  onSelect: (startup: Startup | any) => void
}

export default function StartupSearch({ onSelect }: StartupSearchProps) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    const searchTimer = setTimeout(async () => {
      if (query.trim()) {
        setIsSearching(true)
        try {
          const searchResults = await searchStartups(query)
          setResults(searchResults.slice(0, 5))
        } catch (error) {
          // Fallback to local data if Algolia fails
          const filtered = STARTUPS.filter(
            (s) =>
              s.name.toLowerCase().includes(query.toLowerCase()) ||
              s.description.toLowerCase().includes(query.toLowerCase()) ||
              s.category.toLowerCase().includes(query.toLowerCase())
          )
          setResults(filtered.slice(0, 5))
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

  const handleSelect = (startup: any) => {
    setQuery("") // Clear search after selection
    setResults([]) // Clear results
    setIsOpen(false)
    onSelect(startup)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          placeholder="Search for a startup (e.g., Airbnb, Stripe, OpenAI)..."
          className="pl-12 h-14 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500 text-lg focus:border-orange-500/50 focus:ring-orange-500/20 backdrop-blur-sm transition-all focus:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
        />
        {isSearching && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-orange-500 animate-spin glow-orange" />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 bg-slate-900/95 border-slate-700/80 overflow-hidden z-50 shadow-2xl shadow-orange-500/10 backdrop-blur-md">
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
            {results.map((startup) => (
              <button
                key={startup.objectID || startup.id}
                onClick={() => handleSelect(startup)}
                className="w-full text-left px-4 py-3 hover:bg-gradient-to-r hover:from-orange-500/10 hover:to-red-500/10 transition-all duration-300 border-b border-slate-800/50 last:border-b-0 group"
              >
                <div className="flex items-center gap-3">
                  {(startup.image || startup.emoji) && (
                    startup.image ? (
                      <img
                        src={startup.image}
                        alt={startup.name}
                        className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-700 group-hover:ring-orange-500/50 transition-all"
                      />
                    ) : (
                      <span className="text-2xl">{startup.emoji}</span>
                    )
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white flex items-center gap-2 group-hover:text-orange-400 transition-colors">
                      {startup.name}
                      {startup.status === "Active" && (
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Active" />
                      )}
                    </div>
                    <div className="text-sm text-slate-400 truncate group-hover:text-slate-300 transition-colors">{startup.description}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {startup.batch && (
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                          {startup.batch}
                        </span>
                      )}
                      {startup.survival_score && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded border ${
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
                  </div>
                  <Badge variant="outline" className="text-xs border-cyan-500/50 text-cyan-400 whitespace-nowrap group-hover:border-cyan-400 group-hover:bg-cyan-500/10 transition-all">
                    {startup.category}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
