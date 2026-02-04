"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Sparkles } from "lucide-react"
import { getTopStartups, type Startup } from "@/lib/algolia"

interface TopStartupsSectionProps {
  onSelect: (startup: Startup) => void
}

export function TopStartupsSection({ onSelect }: TopStartupsSectionProps) {
  const [startups, setStartups] = useState<Startup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopStartups().then(results => {
      setStartups(results)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-6 h-6 text-orange-400" />
          <h2 className="text-2xl font-semibold text-white">Top Startups</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-shrink-0 w-72 h-32 bg-slate-900/50 border border-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-6 h-6 text-orange-400" />
        <h2 className="text-2xl font-semibold text-white">Top Startups</h2>
        <Badge className="ml-auto bg-orange-500/20 text-orange-400 border-orange-500/50">
          <Sparkles className="w-3 h-3 mr-1" />
          By Survival Score
        </Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {startups.map((startup) => (
          <Card
            key={startup.objectID}
            onClick={() => onSelect(startup)}
            className="flex-shrink-0 w-72 p-4 bg-slate-900/50 border-slate-700/50 backdrop-blur-sm hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-white group-hover:text-orange-400 transition-colors line-clamp-1">
                {startup.name}
              </h3>
              {startup.survival_score && (
                <span
                  className={`text-xs px-2 py-0.5 rounded flex-shrink-0 ml-2 ${
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
            <p className="text-sm text-slate-400 line-clamp-2 mb-3">{startup.description}</p>
            <div className="flex items-center justify-between">
              {startup.category && (
                <span className="text-xs text-cyan-400">{startup.category}</span>
              )}
              {startup.batch && (
                <span className="text-xs text-slate-500">{startup.batch}</span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
