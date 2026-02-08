"use client"

import { memo } from "react"
import { Streamdown } from "streamdown"
import { code } from "@streamdown/code"

interface MarkdownMessageProps {
  content: string
  className?: string
  isStreaming?: boolean
}

/**
 * Markdown message renderer powered by Streamdown.
 * Optimized for streaming AI responses with proper markdown rendering.
 *
 * @see [vercel/streamdown](https://github.com/vercel/streamdown)
 */
export const MarkdownMessage = memo(function MarkdownMessage({
  content,
  className = "",
  isStreaming = false
}: MarkdownMessageProps) {
  return (
    <div className={`markdown-message streamdown-content ${className}`}>
      <Streamdown
        plugins={{ code }}
        isAnimating={isStreaming}
        parseIncompleteMarkdown={true}
      >
        {content}
      </Streamdown>
    </div>
  )
})
