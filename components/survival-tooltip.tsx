"use client"

import { useState } from "react"
import { Info } from "lucide-react"

export function SurvivalTooltip({ score }: { score?: number | null }) {
  const [show, setShow] = useState(false)

  // Get score level description
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-400", bg: "bg-green-500/20" }
    if (score >= 60) return { level: "Good", color: "text-lime-400", bg: "bg-lime-500/20" }
    if (score >= 40) return { level: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/20" }
    return { level: "Risky", color: "text-red-400", bg: "bg-red-500/20" }
  }

  const scoreInfo = score !== undefined && score !== null ? getScoreLevel(score) : null

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
        <div className="absolute left-full ml-2 top-0 w-72 p-4 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="absolute right-full top-3 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-slate-800 border-b-8 border-b-transparent" />

          <h4 className="text-sm font-semibold text-orange-400 mb-2">Survival Score</h4>

          {scoreInfo && (
            <div className={`mb-3 px-2 py-1 rounded ${scoreInfo.bg} ${scoreInfo.color} text-xs font-medium`}>
              {score}% - {scoreInfo.level}
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            AI-calculated probability (<span className="text-white font-medium">0-100%</span>) of a startup's success based on:
          </p>

          <ul className="text-xs text-slate-400 space-y-2 mb-3">
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span><strong className="text-slate-300">Market fit:</strong> Category competition & trends</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span><strong className="text-slate-300">Funding signals:</strong> Investment rounds & amounts</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span><strong className="text-slate-300">Failure patterns:</strong> Analysis of 400+ failed startups</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-orange-400">•</span>
              <span><strong className="text-slate-300">Success factors:</strong> YC batch & ecosystem data</span>
            </li>
          </ul>

          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500 italic">
              Higher score = Better odds of survival. Not a guarantee—past performance doesn't predict future results.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
