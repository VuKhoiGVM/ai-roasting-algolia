"use client"

import { useState, useRef, useEffect } from "react"
import React from "react"
import { createPortal } from "react-dom"

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactElement
  side?: "top" | "bottom" | "left" | "right"
  align?: "start" | "center" | "end"
  maxWidth?: string
  delay?: number
}

export function Tooltip({
  content,
  children,
  side = "top",
  align = "center",
  maxWidth = "24rem",
  delay = 150
}: TooltipProps) {
  const [show, setShow] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2 pb-1",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2 pt-1",
    left: "right-full top-1/2 -translate-y-1/2 mr-2 pr-1",
    right: "left-full top-1/2 -translate-y-1/2 ml-2 pl-1",
  }

  const arrowClasses = {
    top: "bottom-[-6px] left-1/2 -translate-x-1/2 border-t-orange-500/90 border-l-transparent border-r-transparent border-b-transparent",
    bottom: "top-[-6px] left-1/2 -translate-x-1/2 border-b-orange-500/90 border-l-transparent border-r-transparent border-t-transparent",
    left: "right-[-6px] top-1/2 -translate-y-1/2 border-l-orange-500/90 border-t-transparent border-b-transparent border-r-transparent",
    right: "left-[-6px] top-1/2 -translate-y-1/2 border-r-orange-500/90 border-t-transparent border-b-transparent border-l-transparent",
  }

  // Enhanced content rendering
  const renderEnhancedContent = (content: React.ReactNode) => {
    if (typeof content === 'string') {
      return <p className="leading-relaxed">{content}</p>
    }

    // Check if it's an array or has specific structure
    const contentElement = content as any
    if (contentElement?.props?.children) {
      // It's a React element, render as-is
      return content
    }

    return content
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {show && (
        <div
          className={`absolute z-50 pointer-events-none ${positionClasses[side]}`}
          style={{ maxWidth }}
        >
          {/* Multi-layered glow effect */}
          <div className="absolute inset-0 bg-orange-500/30 blur-2xl rounded-full scale-150 animate-pulse" />
          <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />

          {/* Tooltip content with animation */}
          <div className="relative animate-in fade-in slide-in-from-bottom-1 duration-200 ease-out bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-orange-500/40 rounded-xl shadow-2xl shadow-orange-500/30 backdrop-blur-md p-4 ring-1 ring-orange-500/20">
            {/* Inner glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent rounded-xl pointer-events-none" />

            {/* Arrow */}
            <div className={`absolute w-3 h-3 ${arrowClasses[side]} border-[6px]`} />

            {/* Content with enhanced styling */}
            <div className="text-sm text-slate-100 relative">
              {renderEnhancedContent(content)}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// NEW APPROACH: Smart TextTooltip with better truncation detection
// Uses multiple detection methods and visual enhancements
// ============================================================================

interface TextTooltipProps {
  text: string
  children: React.ReactElement
  delay?: number
  detectTruncated?: boolean  // If false, always show tooltip (default: true)
}

export function TextTooltip({ text, children, delay = 80, detectTruncated = true }: TextTooltipProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const checkTruncated = (): boolean => {
    if (!detectTruncated) return true  // Always show if detection disabled

    const wrapper = wrapperRef.current
    if (!wrapper) return false

    // Find truncated element
    const truncateEl = wrapper.querySelector('[class*="truncate"]') as HTMLElement
    const clampEl = wrapper.querySelector('[class*="line-clamp"]') as HTMLElement

    const targetEl = truncateEl || clampEl
    if (!targetEl) return false

    // Measure the FULL text (from prop) against the container width
    // Use the prop text, not DOM textContent, since CSS doesn't modify textContent
    const temp = document.createElement('span')
    temp.style.visibility = 'hidden'
    temp.style.whiteSpace = 'nowrap'
    temp.style.font = window.getComputedStyle(targetEl).font
    temp.textContent = text  // Use prop text, not DOM textContent
    document.body.appendChild(temp)
    const textWidth = temp.offsetWidth
    document.body.removeChild(temp)

    const containerWidth = targetEl.offsetWidth

    // For line-clamp: also check scrollHeight
    if (clampEl) {
      return textWidth > containerWidth || clampEl.scrollHeight > clampEl.clientHeight
    }

    // Only truncated if text is actually wider than container (with small tolerance)
    return textWidth > containerWidth + 2
  }

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    if (!checkTruncated()) return

    const wrapper = wrapperRef.current
    if (!wrapper) return

    const rect = wrapper.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const tooltipWidth = Math.min(text.length * 8, 280)

    let left = rect.left
    if (left + tooltipWidth > viewportWidth - 12) {
      left = Math.max(12, viewportWidth - tooltipWidth - 12)
    }

    setPosition({
      top: rect.bottom + 6,
      left
    })

    timeoutRef.current = setTimeout(() => setShow(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setShow(false)
  }

  return (
    <span
      ref={wrapperRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline"
    >
      {children}
      {show && createPortal(
        <div
          className="fixed z-[100] animate-in fade-in zoom-in-95 duration-150 pointer-events-none"
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            maxWidth: '280px',
          }}
        >
          <div className="relative">
            {/* Glow effect for cyberpunk aesthetic */}
            <div className="absolute inset-0 bg-orange-500/20 blur-md rounded-lg" />
            {/* Main tooltip */}
            <div className="relative bg-slate-900/98 backdrop-blur-xl rounded-lg shadow-xl border border-orange-500/40 px-3 py-1.5">
              <p className="text-xs text-white leading-snug break-words whitespace-pre-wrap">
                {text}
              </p>
            </div>
          </div>
        </div>,
        document.body
      )}
    </span>
  )
}
