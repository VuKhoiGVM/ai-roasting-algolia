"use client"

import { useState } from "react"
import { Info, TrendingUp, Users, DollarSign, Zap, AlertTriangle } from "lucide-react"
import type { SurvivalScoreBreakdown } from "@/lib/survival-calculator"

export function SurvivalTooltip({
  score,
  breakdown
}: {
  score?: number | null
  breakdown?: SurvivalScoreBreakdown
}) {
  const [show, setShow] = useState(false)

  // Get score level description
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-400", bg: "bg-green-500/20" }
    if (score >= 60) return { level: "Good", color: "text-lime-400", bg: "bg-lime-500/20" }
    if (score >= 40) return { level: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/20" }
    return { level: "Risky", color: "text-red-400", bg: "bg-red-500/20" }
  }

  const scoreInfo = score !== undefined && score !== null ? getScoreLevel(score) : null

  // Factor display component
  const FactorBar = ({
    icon: Icon,
    label,
    value,
    color
  }: {
    icon: any
    label: string
    value: number
    color: string
  }) => (
    <div className="flex items-center gap-2">
      <Icon className={`w-3.5 h-3.5 ${color}`} />
      <span className="flex-1 text-xs text-slate-400">{label}</span>
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className={`text-xs font-medium ${color} w-8 text-right`}>{value}%</span>
    </div>
  )

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-500 hover:text-orange-400 transition-colors"
        aria-label="What is Survival Score?"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && (
        <div className="absolute left-full ml-2 top-0 w-80 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="absolute right-full top-3 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-slate-800 border-b-8 border-b-transparent" />

          <h4 className="text-sm font-semibold text-orange-400 mb-2">Survival Score Breakdown</h4>

          {scoreInfo && (
            <div className={`mb-3 px-2 py-1 rounded ${scoreInfo.bg} ${scoreInfo.color} text-xs font-medium`}>
              {score}% - {scoreInfo.level}
            </div>
          )}

          {breakdown ? (
            <>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                Multi-factor analysis based on YC data, market trends, and failure patterns:
              </p>

              <div className="space-y-2 mb-3">
                <FactorBar
                  icon={TrendingUp}
                  label="Growth (35%)"
                  value={breakdown.growth}
                  color={breakdown.growth >= 60 ? 'text-green-400' : breakdown.growth >= 40 ? 'text-yellow-400' : 'text-red-400'}
                />
                <FactorBar
                  icon={Zap}
                  label="Market (25%)"
                  value={breakdown.market}
                  color={breakdown.market >= 60 ? 'text-green-400' : breakdown.market >= 40 ? 'text-yellow-400' : 'text-red-400'}
                />
                <FactorBar
                  icon={Users}
                  label="Team (20%)"
                  value={breakdown.team}
                  color={breakdown.team >= 60 ? 'text-green-400' : 'text-yellow-400'}
                />
                <FactorBar
                  icon={DollarSign}
                  label="Funding (15%)"
                  value={breakdown.funding}
                  color={breakdown.funding >= 60 ? 'text-green-400' : breakdown.funding >= 40 ? 'text-yellow-400' : 'text-red-400'}
                />
                <FactorBar
                  icon={TrendingUp}
                  label="Trend (5%)"
                  value={breakdown.trend}
                  color={breakdown.trend >= 60 ? 'text-green-400' : breakdown.trend >= 40 ? 'text-blue-400' : 'text-slate-400'}
                />
                {breakdown.penalty > 0 && (
                  <FactorBar
                    icon={AlertTriangle}
                    label="Penalty"
                    value={-breakdown.penalty}
                    color="text-red-400"
                  />
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-300 leading-relaxed mb-3">
                AI-calculated probability (<span className="text-white font-medium">0-100%</span>) of a startup's success based on:
              </p>

              <ul className="text-xs text-slate-400 space-y-2 mb-3">
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Growth (35%):</strong> Historical growth metrics from YC data</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Market (25%):</strong> Category competition & trends</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Team (20%):</strong> YC batch = proven team</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Funding (15%):</strong> Hiring status & signals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Trend (5%):</strong> Category hype cycle</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-400">•</span>
                  <span><strong className="text-slate-300">Penalty:</strong> Similar failures in graveyard</span>
                </li>
              </ul>
            </>
          )}

          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500 italic">
              Higher score = Better odds. Based on CB Insights Mosaic methodology & YC growth benchmarks.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
