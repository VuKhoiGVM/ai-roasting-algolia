import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Users, TrendingUp, DollarSign, ExternalLink } from "lucide-react"
import { SurvivalTooltip } from "@/components/survival-tooltip"

interface StartupCardProps {
  startup: {
    objectID?: string
    id?: string
    name: string
    description: string
    emoji?: string
    image?: string
    category?: string
    sector?: string
    year_founded?: number | string
    founded?: string
    funding?: string
    status?: string
    batch?: string
    tags?: string[]
    survival_score?: number
    website?: string
    url?: string
    location?: string
  }
}

export default function StartupCard({ startup }: StartupCardProps) {
  const displayCategory = startup.category || startup.sector || "Unknown"
  const displayYear = startup.year_founded || startup.founded || "N/A"
  const displayStatus = startup.status || (startup.batch ? "Active" : "Unknown")
  const displayFunding = startup.funding || "N/A"
  const displayTags = startup.tags || []

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {startup.image ? (
              <img
                src={startup.image}
                alt={startup.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : startup.emoji ? (
              <span className="text-4xl">{startup.emoji}</span>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold">
                {startup.name.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-white text-xl">{startup.name}</CardTitle>
                {(startup.website || startup.url) && (
                  <a
                    href={startup.website || startup.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 hover:text-orange-400 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
              <CardDescription className="text-slate-400">
                {displayYear !== "N/A" && `Founded ${displayYear}`} {startup.batch && `• ${startup.batch}`} • {displayStatus}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 border-orange-500/30">
            {displayCategory}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">{startup.description}</p>

        {startup.location && (
          <p className="text-sm text-slate-400 flex items-center gap-1">
            <Users className="h-3 w-3" />
            {startup.location}
          </p>
        )}

        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          <div className="text-center">
            <Building2 className="w-5 h-5 mx-auto mb-1 text-orange-400" />
            <div className="text-xs text-slate-400">Founded</div>
            <div className="text-sm font-semibold text-white">{displayYear}</div>
          </div>
          <div className="text-center">
            <DollarSign className="w-5 h-5 mx-auto mb-1 text-green-400" />
            <div className="text-xs text-slate-400">Funding</div>
            <div className="text-sm font-semibold text-white">{displayFunding}</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-blue-400" />
            <div className="text-xs text-slate-400">Status</div>
            <div className="text-sm font-semibold text-white">{displayStatus}</div>
          </div>
        </div>

        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {displayTags.slice(0, 5).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs border-slate-600 text-slate-400">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {startup.survival_score !== undefined && (
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={
                  startup.survival_score >= 70
                    ? "bg-green-500/20 text-green-400 border-green-500/30"
                    : startup.survival_score >= 40
                    ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                    : "bg-red-500/20 text-red-400 border-red-500/30"
                }
              >
                Survival Score: {startup.survival_score}%
              </Badge>
              <SurvivalTooltip score={startup.survival_score} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
