"use client"

import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { X, ChevronDown } from "lucide-react"
import { createPortal } from "react-dom"

interface Category {
  name: string
  count: number
}

interface CategorySelectorPopupProps {
  categories: Category[]
  selectedCategory: string | null
  onSelectionChange: (category: string | null) => void
  color?: "orange" | "red"
}

export function CategorySelectorPopup({
  categories,
  selectedCategory,
  onSelectionChange,
  color = "orange"
}: CategorySelectorPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  const colorClasses = {
    orange: {
      badge: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      badgeHover: "hover:bg-orange-500/30",
      popup: "border-orange-500/30",
      radio: "accent-orange-400"
    },
    red: {
      badge: "bg-red-500/20 text-red-400 border-red-500/50",
      badgeHover: "hover:bg-red-500/30",
      popup: "border-red-500/30",
      radio: "accent-red-400"
    }
  }

  const colors = colorClasses[color]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const selectCategory = (categoryName: string) => {
    // If clicking the same category, deselect it
    if (selectedCategory === categoryName) {
      onSelectionChange(null)
    } else {
      onSelectionChange(categoryName)
    }
  }

  const clearSelection = () => {
    onSelectionChange(null)
  }

  const remainingCategories = categories.slice(3)
  const visibleCategories = categories.slice(0, 3)

  const handleOpenPopup = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const popupWidth = 320

      let left = rect.left
      if (left + popupWidth > viewportWidth - 16) {
        left = Math.max(16, viewportWidth - popupWidth - 16)
      }

      setPosition({
        top: rect.bottom + 8,
        left,
        width: Math.max(popupWidth, rect.width)
      })
    }
    setIsOpen(true)
  }

  return (
    <div className="flex flex-wrap gap-2 items-center min-h-[40px]">
      {/* Show selected category or all categories */}
      {selectedCategory ? (
        <Badge
          className={`${colors.badge} ${colors.badgeHover} cursor-pointer`}
          onClick={clearSelection}
        >
          {selectedCategory}
          <X className="w-3 h-3 ml-1 inline" />
        </Badge>
      ) : (
        <>
          {/* Show first 3 categories */}
          {visibleCategories.map((cat) => (
            <Badge
              key={cat.name}
              onClick={() => selectCategory(cat.name)}
              className="cursor-pointer bg-slate-800/50 text-slate-300 border-slate-700/50 hover:bg-slate-700/50 hover:text-slate-200 transition-all"
            >
              {cat.name} ({cat.count})
            </Badge>
          ))}

          {/* More button */}
          {remainingCategories.length > 0 && (
            <button
              ref={buttonRef}
              onClick={handleOpenPopup}
              className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors border border-slate-700/50 rounded-full hover:border-slate-600 bg-slate-800/50"
            >
              +{remainingCategories.length} more
              <ChevronDown className="w-3 h-3" />
            </button>
          )}
        </>
      )}

      {/* Popup */}
      {isOpen && createPortal(
        <div
          ref={popupRef}
          className={`fixed z-[100] bg-slate-900/98 backdrop-blur-xl rounded-xl shadow-2xl border ${colors.popup} p-4 max-h-[400px] overflow-y-auto`}
          style={{
            top: `${position.top}px`,
            left: `${position.left}px`,
            width: `${Math.min(position.width, 350)}px`
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">Select Category</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-500 mb-3">
            {selectedCategory ? `Selected: ${selectedCategory}` : "Select a category to filter"}
          </p>

          <div className="space-y-1">
            {remainingCategories.map((cat) => {
              const isSelected = selectedCategory === cat.name
              return (
                <label
                  key={cat.name}
                  className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    isSelected ? 'bg-slate-700/50' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={isSelected}
                    onChange={() => selectCategory(cat.name)}
                    className={`w-4 h-4 bg-slate-800 ${colors.radio}`}
                  />
                  <span className={`flex-1 text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                    {cat.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {cat.count}
                  </span>
                </label>
              )
            })}
          </div>

          {selectedCategory && (
            <div className="mt-3 pt-3 border-t border-slate-700/50">
              <button
                onClick={clearSelection}
                className="text-xs text-slate-500 hover:text-red-400 transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
