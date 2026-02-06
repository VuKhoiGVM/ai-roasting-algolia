# Phase 1: Enhanced Survival Score Algorithm

**Priority:** P0 (High Impact)
**Estimated Time:** 2-3 hours
**Status:** Pending

## Overview

Replace single-value survival score with multi-factor weighted algorithm based on VC best practices (CB Insights Mosaic: 74% unicorn prediction accuracy).

## Weight Distribution

| Factor | Weight | Source |
|--------|--------|--------|
| Growth | 35% | YC metrics (5-7% weekly = exceptional) |
| Market | 25% | Saturation analysis from graveyard data |
| Team | 20% | YC batch = proven team |
| Funding | 15% | Runway calculation proxy |
| Trend | 5% | Category hype cycle |

## Implementation

### Step 1: Create Survival Calculator

**File:** `lib/survival-calculator.ts` (NEW)

```typescript
import type { Startup, FailedStartup } from './algolia';

export interface SurvivalScoreBreakdown {
  total: number;           // Final score 0-100
  growth: number;          // Growth component score
  market: number;          // Market component score
  team: number;            // Team component score
  funding: number;         // Funding component score
  trend: number;           // Trend component score
  penalty: number;         // Failure pattern penalty (0-20)
}

// Category trend scores based on market cycle
const CATEGORY_TRENDS: Record<string, number> = {
  'AI': 5,
  'Machine Learning': 5,
  'Artificial Intelligence': 5,
  'Climate Tech': 4,
  'Biotech': 4,
  'Web3': 3,
  'Crypto': 2,
  'Blockchain': 2,
  'SaaS': 3,
  'Fintech': 3,
  'E-commerce': 2,
  'Healthcare': 3,
  'Social': 1,
  'Marketplace': 1,
  'Marketplaces': 1,
  'Consumer': 2,
  'Enterprise': 3,
};

// Market saturation penalties
const SATURATION_PENALTIES: Record<string, number> = {
  'High': -15,
  'Medium': -5,
  'Low': 0,
  'Unknown': -2,
};

/**
 * Calculate market score based on category and saturation
 */
function calculateMarketScore(
  category?: string,
  saturation?: string
): number {
  const baseScore = 25; // Max possible score
  const saturationPenalty = saturation
    ? SATURATION_PENALTIES[saturation] || SATURATION_PENALTIES['Unknown']
    : 0;

  // Category adjustment based on trends
  const trendBonus = category
    ? (CATEGORY_TRENDS[category] || CATEGORY_TRENDS[Object.keys(CATEGORY_TRENDS).find(k => category?.toLowerCase().includes(k.toLowerCase()) || '')!] || 2)
    : 2;

  return Math.max(0, Math.min(25, baseScore + saturationPenalty + (trendBonus - 2) * 2));
}

/**
 * Calculate funding score based on available data
 */
function calculateFundingScore(startup: Startup): number {
  const maxScore = 15;

  // If we know they're hiring and active, positive signal
  if (startup.is_hiring) return maxScore * 0.8;

  // YC companies typically have some funding
  if (startup.batch) return maxScore * 0.6;

  return maxScore * 0.3; // Base score for unknown
}

/**
 * Calculate trend score for category
 */
function getCategoryTrendScore(category?: string): number {
  if (!category) return 2; // Neutral

  const trend = CATEGORY_TRENDS[category] ||
    CATEGORY_TRENDS[Object.keys(CATEGORY_TRENDS).find(k =>
      category.toLowerCase().includes(k.toLowerCase())
    ) || ''];

  return trend || 2;
}

/**
 * Analyze failure patterns from graveyard data
 */
function analyzeFailurePatterns(
  startup: Startup,
  graveyardData?: FailedStartup[]
): number {
  if (!graveyardData || graveyardData.length === 0) return 0;

  // Find similar failed startups by category
  const similarFailures = graveyardData.filter(f =>
    f.category === startup.category ||
    f.sector === startup.category
  );

  if (similarFailures.length === 0) return 0;

  // Count failure reasons
  const failureReasons = similarFailures.map(f => f.why_they_failed).filter(Boolean);

  // If many similar failures, higher penalty
  if (similarFailures.length > 10) return 5;
  if (similarFailures.length > 5) return 3;
  return 0;
}

/**
 * Main survival score calculation function
 */
export function calculateSurvivalScore(
  startup: Startup,
  graveyardData?: FailedStartup[]
): SurvivalScoreBreakdown {
  // Growth Score (35%) - Based on existing survival_score from YC data
  // This represents historical growth metrics
  const growthScore = (startup.survival_score || 50) * 0.35;

  // Market Score (25%) - Category saturation and trend
  const marketScore = calculateMarketScore(startup.category, startup.saturation);

  // Team Score (20%) - YC batch indicates proven team
  const teamScore = startup.batch ? 20 : 5;

  // Funding Score (15%) - Based on hiring status and YC participation
  const fundingScore = calculateFundingScore(startup);

  // Trend Score (5%) - Category hype cycle awareness
  const trendScore = getCategoryTrendScore(startup.category);

  // Failure Pattern Penalty - Similar companies that failed
  const penalty = analyzeFailurePatterns(startup, graveyardData);

  const total = Math.max(0, Math.min(100,
    growthScore + marketScore + teamScore + fundingScore + trendScore - penalty
  ));

  return {
    total: Math.round(total),
    growth: Math.round(growthScore * 100 / 35), // Normalize to 0-100 for display
    market: Math.round(marketScore * 100 / 25),
    team: Math.round(teamScore * 100 / 20),
    funding: Math.round(fundingScore * 100 / 15),
    trend: Math.round(trendScore * 100 / 5),
    penalty: Math.round(penalty),
  };
}

/**
 * Get survival score label/color
 */
export function getSurvivalLabel(score: number): { label: string; color: string } {
  if (score >= 70) return { label: 'Strong', color: 'text-green-400' };
  if (score >= 50) return { label: 'Moderate', color: 'text-yellow-400' };
  if (score >= 30) return { label: 'Risky', color: 'text-orange-400' };
  return { label: 'Critical', color: 'text-red-400' };
}
```

### Step 2: Update Survival Meter Component

**File:** `components/metrics/survival-meter.tsx` (UPDATE)

Add tooltip with score breakdown:

```typescript
import { calculateSurvivalScore, getSurvivalLabel } from '@/lib/survival-calculator';

// In component props, add optional startup data
interface SurvivalMeterProps {
  probability?: number;
  startup?: Startup;
}

export function SurvivalMeter({ probability, startup }: SurvivalMeterProps) {
  // Calculate detailed breakdown if startup data available
  const breakdown = startup ? calculateSurvivalScore(startup) : null;
  const score = probability ?? breakdown?.total ?? 50;
  const { label, color } = getSurvivalLabel(score);

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-slate-400">Survival Probability</span>
        {breakdown && (
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-4 h-4 text-slate-500" />
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1 text-xs">
                <div>Growth: {breakdown.growth}%</div>
                <div>Market: {breakdown.market}%</div>
                <div>Team: {breakdown.team}%</div>
                <div>Funding: {breakdown.funding}%</div>
                <div>Trend: {breakdown.trend}%</div>
                {breakdown.penalty > 0 && (
                  <div className="text-red-400">Penalty: -{breakdown.penalty}</div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {/* ... rest of component */}
    </div>
  );
}
```

### Step 3: Update Type Exports

**File:** `lib/algolia.ts` (UPDATE)

Add re-export:

```typescript
export type { SurvivalScoreBreakdown, getSurvivalLabel } from './survival-calculator';
```

## Testing

```typescript
// Test cases
const ycStartup: Startup = {
  objectID: 'test',
  name: 'Test AI Startup',
  description: 'AI company',
  batch: 'W24',
  survival_score: 75,
  category: 'AI',
  is_hiring: true,
};

const breakdown = calculateSurvivalScore(ycStartup);
console.log(breakdown);
// Expected: total > 70 (strong score due to YC, AI trend, hiring)
```

## Acceptance Criteria

- [ ] Survival calculator returns scores 0-100
- [ ] YC batch companies get higher team scores (20 vs 5)
- [ ] AI category gets trend bonus
- [ ] High saturation categories get market penalty
- [ ] Survival meter shows breakdown tooltip
- [ ] Color-coded labels (Strong/Moderate/Risky/Critical)
