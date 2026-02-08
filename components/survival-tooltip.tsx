"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Info, TrendingUp, Users, DollarSign, Zap, AlertTriangle, Target } from "lucide-react"
import type { SurvivalScoreBreakdown } from "@/lib/survival-calculator"

export function SurvivalTooltip({
  score,
  breakdown
}: {
  score?: number | null
  breakdown?: SurvivalScoreBreakdown
}) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const updatePosition = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const offset = 8

      let top = rect.top
      let left = rect.right + offset

      setPosition({ top, left })
    }
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    updatePosition()
    setShow(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShow(false)
    }, 100)
  }

  const handleTooltipMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  const handleTooltipMouseLeave = () => {
    setShow(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  // Get score level description
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: "Excellent", color: "text-green-400", bg: "bg-green-500/20", desc: "Strong survival indicators" }
    if (score >= 60) return { level: "Good", color: "text-lime-400", bg: "bg-lime-500/20", desc: "Above-average prospects" }
    if (score >= 40) return { level: "Moderate", color: "text-yellow-400", bg: "bg-yellow-500/20", desc: "Significant risks present" }
    return { level: "Risky", color: "text-red-400", bg: "bg-red-500/20", desc: "High failure probability" }
  }

  const scoreInfo = score !== undefined && score !== null ? getScoreLevel(score) : null

  // Factor display component
  const FactorBar = ({
    icon: Icon,
    label,
    value,
    color,
    description
  }: {
    icon: any
    label: string
    value: number
    color: string
    description?: string
  }) => (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="flex-1 text-xs text-slate-400">{label}</span>
        <span className={`text-xs font-medium ${color}`}>{value}%</span>
      </div>
      <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden ml-6">
        <div
          className={`h-full ${color.replace('text-', 'bg-')}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      {description && <p className="text-xs text-slate-500 ml-6 italic">{description}</p>}
    </div>
  )

  return (
    <>
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-slate-500 hover:text-orange-400 transition-colors inline-flex"
        aria-label="How is Survival Score calculated?"
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && typeof document !== "undefined" && createPortal(
        <div
          ref={tooltipRef}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          className="w-80 p-4 bg-slate-800/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl z-[10000] fixed"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <h4 className="text-sm font-semibold text-orange-400 mb-2">Survival Score Methodology</h4>

          {scoreInfo && (
            <div className={`mb-3 px-2 py-1 rounded ${scoreInfo.bg} ${scoreInfo.color} text-xs font-medium`}>
              {score}% - {scoreInfo.level} ({scoreInfo.desc})
            </div>
          )}

          <p className="text-xs text-slate-300 leading-relaxed mb-3">
            Multi-factor survival probability (<span className="text-white font-medium">0-100%</span>) based on YC startup data and failure patterns:
          </p>

          {breakdown ? (
            <div className="space-y-3 mb-3">
              <FactorBar
                icon={TrendingUp}
                label="Growth (35%)"
                value={breakdown.growth}
                color={breakdown.growth >= 60 ? 'text-green-400' : breakdown.growth >= 40 ? 'text-yellow-400' : 'text-red-400'}
                description="YC growth benchmarks (5-7% weekly = exceptional)"
              />
              <FactorBar
                icon={Zap}
                label="Market (25%)"
                value={breakdown.market}
                color={breakdown.market >= 60 ? 'text-green-400' : breakdown.market >= 40 ? 'text-yellow-400' : 'text-red-400'}
                description="Category saturation & competitive landscape"
              />
              <FactorBar
                icon={Users}
                label="Team (20%)"
                value={breakdown.team}
                color={breakdown.team >= 60 ? 'text-green-400' : 'text-yellow-400'}
                description="YC batch = vetted team & network"
              />
              <FactorBar
                icon={DollarSign}
                label="Funding (15%)"
                value={breakdown.funding}
                color={breakdown.funding >= 60 ? 'text-green-400' : breakdown.funding >= 40 ? 'text-yellow-400' : 'text-red-400'}
                description="Hiring status & capital signals"
              />
              <FactorBar
                icon={Target}
                label="Trend (5%)"
                value={breakdown.trend}
                color={breakdown.trend >= 60 ? 'text-green-400' : breakdown.trend >= 40 ? 'text-blue-400' : 'text-slate-400'}
                description="Category hype cycle timing"
              />
              {breakdown.penalty > 0 && (
                <FactorBar
                  icon={AlertTriangle}
                  label="Failure Pattern Penalty"
                  value={-breakdown.penalty}
                  color="text-red-400"
                  description="Similar failures in graveyard index"
                />
              )}
            </div>
          ) : (
            <ul className="text-xs text-slate-400 space-y-1.5 mb-3">
              <li className="flex items-start gap-2">
                <TrendingUp className="w-3 h-3 mt-0.5 text-green-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Growth (35%):</strong> YC growth benchmarks & traction signals</span>
              </li>
              <li className="flex items-start gap-2">
                <Zap className="w-3 h-3 mt-0.5 text-yellow-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Market (25%):</strong> Category saturation & competition level</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Team (20%):</strong> YC batch = proven team pedigree</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="w-3 h-3 mt-0.5 text-cyan-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Funding (15%):</strong> Hiring status & capital signals</span>
              </li>
              <li className="flex items-start gap-2">
                <Target className="w-3 h-3 mt-0.5 text-purple-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Trend (5%):</strong> Category hype cycle timing</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-3 h-3 mt-0.5 text-red-400 flex-shrink-0" />
                <span><strong className="text-slate-300">Penalty:</strong> Similar failures in graveyard</span>
              </li>
            </ul>
          )}

          <div className="pt-2 border-t border-slate-700">
            <p className="text-xs text-slate-500 italic">
              Based on CB Insights Mosaic methodology & analysis of 2,500+ YC companies.
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
