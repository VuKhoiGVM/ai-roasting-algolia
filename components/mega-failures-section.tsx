"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skull, TrendingDown, DollarSign } from "lucide-react"
import { getTopGraveyardEntries, type FailedStartup } from "@/lib/algolia"

interface MegaFailuresSectionProps {
  onSelect?: (startup: FailedStartup) => void
}

export function MegaFailuresSection({ onSelect }: MegaFailuresSectionProps) {
  const [startups, setStartups] = useState<FailedStartup[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTopGraveyardEntries().then(results => {
      setStartups(results)
      setLoading(false)
    })
  }, [])

  const formatFunding = (amount: number) => {
    if (amount >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`
    return `$${amount.toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Skull className="w-6 h-6 text-pink-500" />
          <h2 className="text-2xl font-semibold text-white">Mega-Failures</h2>
        </div>
        <div className="grid gap-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-20 bg-slate-900/50 border border-slate-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Skull className="w-6 h-6 text-pink-500" />
        <h2 className="text-2xl font-semibold text-white">Mega-Failures</h2>
        <Badge className="ml-auto bg-pink-500/20 text-pink-400 border-pink-500/50">
          <DollarSign className="w-3 h-3 mr-1" />
          By Funding Raised
        </Badge>
      </div>

      <div className="grid gap-3">
        {startups.map((startup, index) => (
          <Card
            key={startup.objectID}
            className="bg-gradient-to-r from-slate-900/50 to-slate-900/30 border border-slate-700/50 backdrop-blur-sm hover:border-pink-500/50 hover:bg-pink-500/5 transition-all cursor-pointer group"
            onClick={() => onSelect?.(startup)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-pink-400 group-hover:text-pink-300 transition-colors">
                      #{index + 1}
                    </span>
                    <h3 className="font-semibold text-white group-hover:text-pink-400 transition-colors truncate">
                      {startup.name}
                    </h3>
                  </div>
                  {startup.sector && (
                    <Badge className="text-xs bg-slate-800/50 text-slate-400 border-slate-600 mb-2">
                      {startup.sector}
                    </Badge>
                  )}
                  {startup.why_they_failed && (
                    <p className="text-sm text-red-400 line-clamp-1">
                      💀 {startup.why_they_failed}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <TrendingDown className="w-4 h-4 text-red-400" />
                  <span className="text-lg font-bold text-red-400">
                    {formatFunding(startup.raised_amount || 0)}
                  </span>
                  <span className="text-xs text-slate-500">raised</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-slate-500 text-center">
        💀 These startups raised millions but still failed. Learn from their mistakes.
      </p>
    </div>
  )
}
