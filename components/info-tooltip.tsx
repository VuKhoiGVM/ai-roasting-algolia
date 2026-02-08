"use client"

import { useState, useRef, useEffect } from "react"
import { createPortal } from "react-dom"
import { Info } from "lucide-react"

interface InfoTooltipProps {
  title: string
  children: React.ReactNode
  width?: string
}

/**
 * Reusable info tooltip component with hover interaction
 * Appears beside the button (right side), rendered using portal
 */
export function InfoTooltip({ title, children, width = "w-80" }: InfoTooltipProps) {
  const [show, setShow] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const tooltipId = `tooltip-${title.replace(/\s+/g, '-')}`

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

  // Clean up any existing tooltip with this ID when component mounts
  useEffect(() => {
    if (typeof document !== "undefined") {
      const existing = document.getElementById(tooltipId)
      if (existing) {
        existing.remove()
      }
    }
  }, [tooltipId])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      // Clean up tooltip when component unmounts
      if (typeof document !== "undefined") {
        const existing = document.getElementById(tooltipId)
        if (existing) {
          existing.remove()
        }
      }
    }
  }, [tooltipId])

  return (
    <>
      <button
        ref={buttonRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-slate-500 hover:text-orange-400 transition-colors inline-flex"
        aria-label={`What is ${title}?`}
        type="button"
      >
        <Info className="w-4 h-4" />
      </button>

      {show && typeof document !== "undefined" && createPortal(
        <div
          key={title}
          id={tooltipId}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          className={`${width} p-4 bg-slate-800/98 backdrop-blur-md border border-slate-700 rounded-lg shadow-2xl z-[10000] fixed`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
        >
          <h4 className="text-sm font-semibold text-orange-400 mb-2">{title}</h4>
          <div className="text-xs text-slate-300 leading-relaxed">
            {children}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
