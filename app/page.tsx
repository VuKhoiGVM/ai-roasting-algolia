"use client"

import { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Flame, Search, Send, Skull, Info, TrendingUp, Target } from "lucide-react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import StartupSearch from "@/components/startup-search"
import { TopStartupsSection } from "@/components/top-startups-section"
import { MegaFailuresSection } from "@/components/mega-failures-section"
import { CategoryPills } from "@/components/category-pills"
import { SurvivalMeter } from "@/components/metrics/survival-meter"
import { SaturationMeter } from "@/components/metrics/saturation-meter"
import { FundingIndicator } from "@/components/metrics/funding-indicator"
import { GraveyardSection } from "@/components/metrics/graveyard-section"
import { PivotCard } from "@/components/metrics/pivot-card"
import { type Startup, type FailedStartup } from "@/lib/algolia"
import { DynamicBackground } from "@/components/dynamic-background"

const transport = new DefaultChatTransport({
  api: "/api/roast"
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
  const [categoryResults, setCategoryResults] = useState<Startup[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const chat = useChat({ transport })

  // Save chat history
  useEffect(() => {
    if (chat.messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chat.messages))
    }
  }, [chat.messages])

  const { messages, status } = chat
  const [input, setInput] = useState("")

  const handleStartupSelect = (startup: Startup) => {
    setSelectedStartupData(startup)
    setSelectedGraveyard(null)
    chat.sendMessage({ text: `Roast this startup: ${startup.name}. ${startup.description}` })
  }

  const handleGraveyardSelect = (startup: FailedStartup) => {
    setSelectedGraveyard(startup)
    setSelectedStartupData(null)
    chat.sendMessage({ text: `Analyze this failed startup: ${startup.name}. They raised $${(startup.raised_amount || 0) / 1_000_000}M and failed because: ${startup.why_they_failed}` })
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
    if (messages.length === 0 && categoryResults.length === 0) {
      return [{
        id: "welcome",
        role: "assistant" as const,
        parts: [{ type: "text" as const, text: "" }]
      }]
    }
    return messages
  }, [messages, categoryResults.length])

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
          <p className="text-slate-400 max-w-xl mx-auto">
            Get brutally honest feedback on your startup idea. Powered by AI + 81K+ startups + 21K+ failures.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-3xl mx-auto mb-6">
          <StartupSearch onSelect={handleStartupSelect} />
        </div>

        {/* Category Pills */}
        <div className="max-w-6xl mx-auto mb-8">
          <CategoryPills
            onResultsChange={(results) => {
              setCategoryResults(results)
              if (results.length > 0) {
                setSelectedCategory(results[0]?.category || null)
              } else {
                setSelectedCategory(null)
              }
            }}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>

        {/* Category Results */}
        {categoryResults.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-semibold text-white">
                {selectedCategory} Startups
              </h2>
              <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/50">
                {categoryResults.length} results
              </Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {categoryResults.slice(0, 10).map((startup) => (
                <Card
                  key={startup.objectID}
                  onClick={() => handleStartupSelect(startup)}
                  className="bg-slate-900/50 border-slate-700/50 hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer p-3"
                >
                  <h3 className="font-semibold text-white text-sm truncate">{startup.name}</h3>
                  {startup.survival_score && (
                    <span className="text-xs text-green-400">{startup.survival_score}%</span>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Top Startups */}
        <div className="max-w-6xl mx-auto mb-8">
          <TopStartupsSection onSelect={handleStartupSelect} />
        </div>

        {/* Two Column Layout */}
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6 mb-8">
          {/* Left - Mega Failures */}
          <div>
            <MegaFailuresSection onSelect={handleGraveyardSelect} />
          </div>

          {/* Right - Chat */}
          <div>
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm h-[650px] flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && categoryResults.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6">
                    <div className="w-20 h-20 mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                      <Flame className="w-10 h-10 text-orange-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to Roast</h3>
                    <p className="text-slate-400 text-sm max-w-xs mb-4">
                      Click a startup above or describe your idea below
                    </p>
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
                    placeholder="Describe your startup idea..."
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

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 shrink-0 flex items-center justify-center text-sm">
          🔥
        </div>
        <Card className="px-4 py-3 flex-1 bg-slate-800/80 border border-slate-700/50">
          <p className="whitespace-pre-wrap text-slate-100 text-sm">{text}</p>
        </Card>
      </div>

      {/* Metrics Section */}
      {(message as any).metrics && (
        <Card className="border-orange-500/30 bg-orange-500/5 ml-11">
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
      )}
    </div>
  )
}

// Parse metrics from AI response
function parseRoastMetrics(text: string): RoastResponse | null {
  const survivalMatch = text.match(/\*\*Survival Probability:\s*(\d+)%?\*\*/i)
  const survivalProbability = survivalMatch ? parseInt(survivalMatch[1]) : null

  const saturationMatch = text.match(/\*\*Market Saturation:\s*(Low|Medium|High)\*\*/i)
  const marketSaturation = saturationMatch ? saturationMatch[1] as 'Low' | 'Medium' | 'High' : null

  const fundingMatch = text.match(/\*\*Funding Likelihood:\s*(\d+)%?\*\*/i)
  const fundingLikelihood = fundingMatch ? parseInt(fundingMatch[1]) : null

  const graveyardEntries: any[] = []
  const graveyardMatch = text.match(/\*\*💀[^*]*\*\*([\s\S]*?)(?=\*\*🔄|\*\*The Roast|\*\*Pivot|$)/i)
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
  const pivotMatch = text.match(/\*\*🔄[^*]*\*\*([\s\S]*?)(?=\*\*|$)/i)
  if (pivotMatch) {
    const lines = pivotMatch[1].split('\n').filter(Boolean)
    for (const line of lines) {
      const pivotTextMatch = line.match(/[-•]\s*(.+)/)
      if (pivotTextMatch) {
        const pivotText = pivotTextMatch[1].trim()
        if (pivotText && !pivotText.includes('Pivot') && !pivotText.includes('Suggestion')) {
          pivots.push(pivotText.replace(/^\*\*/, '').replace(/\*\*$/, '').trim())
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
