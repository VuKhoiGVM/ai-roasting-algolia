"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Flame, Search, Send, Skull, Info, TrendingUp, Target } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import StartupSearch, { type SearchResult } from "@/components/startup-search"
import { TopStartupsSection } from "@/components/top-startups-section"
import { FailuresSection } from "@/components/mega-failures-section"
import { SurvivalMeter } from "@/components/metrics/survival-meter"
import { SaturationMeter } from "@/components/metrics/saturation-meter"
import { FundingIndicator } from "@/components/metrics/funding-indicator"
import { GraveyardSection } from "@/components/metrics/graveyard-section"
import { PivotCard } from "@/components/metrics/pivot-card"
import { type Startup, type FailedStartup } from "@/lib/algolia"
import { DynamicBackground } from "@/components/dynamic-background"
import { MarkdownMessage } from "@/components/markdown-message"

const transport = new DefaultChatTransport({
  api: `https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID}/completions?compatibilityMode=ai-sdk-5`,
  headers: {
    "x-algolia-application-id": process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    "x-algolia-api-key": process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!,
  },
})

const STORAGE_KEY = "startup-roast-chat"

// Type for roast response with metrics
interface RoastResponse {
  survivalProbability?: number
  marketSaturation?: 'Low' | 'Medium' | 'High'
  fundingLikelihood?: number
  graveyard?: Array<{ name: string; failure_reason: string }>
  pivots?: string[]
  roast?: string
}

export default function Home() {
  const [selectedStartupData, setSelectedStartupData] = useState<Startup | null>(null)
  const [selectedGraveyard, setSelectedGraveyard] = useState<FailedStartup | null>(null)
  const [startupsCategory, setStartupsCategory] = useState<string | null>(null)
  const [graveyardCategory, setGraveyardCategory] = useState<string | null>(null)

  const chat = useChat({ transport })

  // Save chat history
  useEffect(() => {
    if (chat.messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chat.messages))
    }
  }, [chat.messages])

  const { messages, status } = chat
  const [input, setInput] = useState("")

  // Helper to check if result is a failed startup
  const isFailedStartup = (result: Startup | FailedStartup | SearchResult): result is FailedStartup => {
    return 'raised_amount' in result && result.raised_amount !== undefined
  }

  // Unified handler for both startups and failed startups from search
  const handleSearchSelect = (result: Startup | FailedStartup | SearchResult) => {
    if (isFailedStartup(result)) {
      setSelectedGraveyard(result)
      setSelectedStartupData(null)
      const funding = result.raised_amount ? `$${(result.raised_amount / 1_000_000).toFixed(0)}M` : 'unknown funding'
      chat.sendMessage({
        text: `Analyze this failed startup: ${result.name}. They raised ${funding} and failed because: ${result.why_they_failed || 'unknown reasons'}`
      })
    } else {
      setSelectedStartupData(result)
      setSelectedGraveyard(null)
      chat.sendMessage({
        text: `Roast this startup: ${result.name}. ${result.description}`
      })
    }
  }

  const handleStartupSelect = (startup: Startup) => {
    handleSearchSelect(startup)
  }

  const handleGraveyardSelect = (startup: FailedStartup) => {
    handleSearchSelect(startup)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      chat.sendMessage({ text: input })
      setInput("")
    }
  }

  const handlePivotClick = (pivot: string) => {
    setInput(pivot)
    setTimeout(() => {
      chat.sendMessage({ text: pivot })
      setInput("")
    }, 100)
  }

  const isLoading = status === "submitted" || status === "streaming"

  // Parse metrics from AI responses
  const messagesWithMetrics = useMemo(() => {
    return messages.map((msg) => {
      if (msg.role === 'assistant') {
        const text = msg.parts
          ?.filter((p: any) => p.type === 'text')
          .map((p: any) => p.text || '')
          .join('') || ''
        const metrics = parseRoastMetrics(text)
        return { ...msg, metrics, content: text }
      }
      return msg
    })
  }, [messages])

  const displayMessages = useMemo(() => {
    if (messages.length === 0) {
      return [{
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "" }]
      }]
    }
    return messages
  }, [messages])

  return (
    <main className="min-h-screen bg-slate-950 relative overflow-hidden">
      <DynamicBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10">
              <Flame className="w-6 h-6 text-orange-500" />
            </span>
            <h1 className="text-4xl md:text-5xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent glow-text">
                Startup Roast
              </span>
            </h1>
            <span className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10">
              <Flame className="w-6 h-6 text-orange-500" />
            </span>
          </div>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            Before you quit your job, get an honest reality check. We analyze your idea against <span className="text-orange-400 font-medium">2,500+ real startups</span> and <span className="text-red-400 font-medium">400+ failures</span>—so you don't become one.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto mb-8">
          <StartupSearch onSelect={handleSearchSelect} />
        </div>

        {/* Top Startups & Notable Failures - Side by Side with separate categories */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 mb-8 items-stretch">
          {/* Left - Top Startups */}
          <div className="flex flex-col h-full">
            <TopStartupsSection
              onSelect={handleStartupSelect}
              selectedCategory={startupsCategory}
              onCategoryChange={setStartupsCategory}
            />
          </div>

          {/* Right - Notable Failures */}
          <div className="flex flex-col h-full">
            <FailuresSection
              onSelect={handleGraveyardSelect}
              selectedCategory={graveyardCategory}
              onCategoryChange={setGraveyardCategory}
            />
          </div>
        </div>

        {/* Chat Section */}
        <div className="max-w-3xl mx-auto">
          <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-[500px] flex flex-col">
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <Flame className="w-10 h-10 text-orange-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Roast</h3>
                  <p className="text-slate-400 text-sm max-w-xs mb-4">
                    Click a startup above or describe your idea below
                  </p>

                  {/* Quick Suggestions */}
                  <div className="w-full max-w-sm mt-2">
                    <p className="text-xs text-slate-500 mb-3">Try these examples:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {[
                        "An AI-powered dog walking app",
                        "Uber for pet sitting",
                        "A B2B SaaS for coffee shops"
                      ].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => {
                            setInput(suggestion)
                            setTimeout(() => {
                              chat.sendMessage({ text: suggestion })
                              setInput("")
                            }, 100)
                          }}
                          className="px-3 py-1.5 text-xs bg-slate-800/50 hover:bg-orange-500/20 border border-slate-700 hover:border-orange-500/30 text-slate-400 hover:text-orange-400 rounded-full transition-all"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Guide text */}
                  <div className="mt-6 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50 max-w-sm">
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-orange-400 font-medium">💡 Tip:</span> Be specific about your idea. Include details like target market, revenue model, or unique features for better analysis.
                    </p>
                  </div>
                </div>
              ) : (
                messagesWithMetrics.map((message: any) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    onPivotClick={handlePivotClick}
                  />
                ))
              )}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-sm shrink-0">
                    🔥
                  </div>
                  <Card className="px-4 py-3 bg-slate-800/80 border border-slate-700/50">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce bg-orange-500 rounded-full" />
                      <span className="h-2 w-2 animate-bounce bg-orange-500 rounded-full delay-100" />
                      <span className="h-2 w-2 animate-bounce bg-orange-500 rounded-full delay-200" />
                    </div>
                  </Card>
                </div>
              )}
            </CardContent>
            <div className="border-t border-slate-700/50 p-4">
              <form onSubmit={handleSubmit} className="flex w-full gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="E.g., 'A marketplace for connecting freelance designers with startups' or 'Roast Stripe for competitors'"
                  className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-orange-500/50 focus:ring-orange-500/20"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 glow-orange"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}

function MessageBubble({ message, onPivotClick }: { message: any; onPivotClick?: (pivot: string) => void }) {
  const isUser = message.role === 'user'

  if (isUser) {
    const text = message.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('') || ''

    return (
      <div className="flex justify-end">
        <Card className="px-4 py-3 max-w-[85%] bg-gradient-to-br from-orange-600 to-red-600 text-white">
          <p className="whitespace-pre-wrap text-sm">{text}</p>
        </Card>
      </div>
    )
  }

  const text = (message as any).content || message.parts
    ?.filter((p: any) => p.type === 'text')
    .map((p: any) => p.text || '')
    .join('') || ''

  const hasMetrics = (message as any).metrics

  // Extract the roast section for separate display and remove metrics from main text
  const roastText = hasMetrics ? extractRoastSection(text) : null
  // When metrics exist, don't show main text (everything is in metrics cards + roast section)
  const mainText = hasMetrics ? '' : text

  return (
    <div className="space-y-4">
      {/* Only show main message card if there's text to display (non-metrics responses) */}
      {!hasMetrics && mainText && (
        <div className="flex gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shrink-0 flex items-center justify-center text-sm">
            🔥
          </div>
          <Card className="px-4 py-3 flex-1 bg-slate-800/80 border border-slate-700/50">
            <MarkdownMessage content={mainText} className="text-slate-100 text-sm" />
          </Card>
        </div>
      )}

      {/* Metrics Section */}
      {hasMetrics && (
        <div className="ml-11">
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-4 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <SurvivalMeter probability={(message as any).metrics.survivalProbability} />
                <FundingIndicator likelihood={(message as any).metrics.fundingLikelihood} />
              </div>
              <SaturationMeter saturation={(message as any).metrics.marketSaturation} />

              {(message as any).metrics.graveyard?.length > 0 && (
                <GraveyardSection entries={(message as any).metrics.graveyard} />
              )}

              {(message as any).metrics.pivots?.length > 0 && (
                <PivotCard pivots={(message as any).metrics.pivots} onPivotClick={onPivotClick} />
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* The Roast Section - displayed separately with markdown */}
      {roastText && (
        <Card className="border-red-500/30 bg-red-500/5 ml-11">
          <CardContent className="p-4">
            <h4 className="text-sm font-semibold text-red-400 flex items-center gap-2 mb-3">
              <Flame className="w-4 h-4" />
              The Roast
            </h4>
            <MarkdownMessage content={roastText.replace(/\*\*The Roast:\*\*/i, '').trim()} className="text-slate-200 text-sm" />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Extract the roast section from AI response
function extractRoastSection(text: string): string | null {
  const roastMatch = text.match(/\*\*The Roast:\*\*([\s\S]*)/i)
  return roastMatch ? roastMatch[0] : null
}

// Parse metrics from AI response
function parseRoastMetrics(text: string): RoastResponse | null {
  const survivalMatch = text.match(/\*\*Survival Probability:\*\*\s*(\d+)%?/i)
  const survivalProbability = survivalMatch ? parseInt(survivalMatch[1]) : null

  const saturationMatch = text.match(/\*\*Market Saturation:\*\*\s*(Low|Medium|High)/i)
  const marketSaturation = saturationMatch ? saturationMatch[1] as 'Low' | 'Medium' | 'High' : null

  const fundingMatch = text.match(/\*\*Funding Likelihood:\*\*\s*(\d+)%?/i)
  const fundingLikelihood = fundingMatch ? parseInt(fundingMatch[1]) : null

  const graveyardEntries: any[] = []
  const graveyardMatch = text.match(/\*\*💀[^*]*:\*\*([\s\S]*?)(?=\*\*🔄|\*\*The Roast|\*\*Pivot|$)/i)
  if (graveyardMatch) {
    const lines = graveyardMatch[1].split('\n').filter(Boolean)
    for (const line of lines) {
      const entryMatch = line.match(/[-•]\s*([^:]+):\s*(.+)/)
      if (entryMatch) {
        graveyardEntries.push({
          name: entryMatch[1].trim(),
          failure_reason: entryMatch[2].trim(),
        })
      }
    }
  }

  if (graveyardEntries.length === 0) {
    const bulletPattern = /[-•]\s*\*\*?([^*]+)\*\*?:\s*([^\n]+)/g
    let match
    while ((match = bulletPattern.exec(text)) !== null) {
      graveyardEntries.push({
        name: match[1].trim(),
        failure_reason: match[2].trim(),
      })
    }
  }

  const pivots: string[] = []
  const pivotMatch = text.match(/\*\*🔄[^*]*:\*\*([\s\S]*?)(?=\*\*|$)/i)
  if (pivotMatch) {
    const lines = pivotMatch[1].split('\n').filter(Boolean)
    for (const line of lines) {
      const pivotTextMatch = line.match(/[-•]\s*(.+)/)
      if (pivotTextMatch) {
        let pivotText = pivotTextMatch[1].trim()
        // Skip header lines
        if (pivotText && !pivotText.includes('Pivot') && !pivotText.includes('Suggestion')) {
          // Remove ALL ** markdown bold formatting
          pivots.push(pivotText.replace(/\*\*/g, '').replace(/:\s*/, ': ').trim())
        }
      }
    }
  }

  if (!survivalProbability && !marketSaturation && !fundingLikelihood) {
    return null
  }

  return {
    survivalProbability: survivalProbability ?? undefined,
    marketSaturation: marketSaturation ?? undefined,
    fundingLikelihood: fundingLikelihood ?? undefined,
    graveyard: graveyardEntries,
    pivots,
    roast: text,
  }
}
