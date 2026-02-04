"use client"

import { useState } from "react"
import { Info } from "lucide-react"

export function SurvivalTooltip({ score }: { score?: number | null }) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
        className="text-slate-500 hover:text-orange-400 transition-colors"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && (
        <div className="absolute left-full ml-2 top-0 w-64 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
          <div className="absolute right-full top-3 w-0 h-0 border-t-8 border-t-transparent border-r-8 border-r-slate-800 border-b-8 border-b-transparent" />
          <h4 className="text-sm font-semibold text-orange-400 mb-2">Survival Score</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            AI-calculated probability (0-100%) of startup success based on:
          </p>
          <ul className="text-xs text-slate-400 mt-2 space-y-1">
            <li>• Market conditions & competition</li>
            <li>• Current funding trends</li>
            <li>• Historical data from 21K+ failed startups</li>
          </ul>
        </div>
      )}
    </div>
  )
}
