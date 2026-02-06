/**
 * Survival Score Calculator
 *
 * Multi-factor survival scoring based on VC best practices:
 * - CB Insights Mosaic methodology (74% unicorn prediction accuracy)
 * - YC growth metrics (5-7% weekly = exceptional)
 * - Valley of death analysis (Series A to B gap)
 *
 * Weight Distribution:
 * - Growth (35%): Historical growth metrics from YC data
 * - Market (25%): Category saturation and trend analysis
 * - Team (20%): YC batch = proven team quality
 * - Funding (15%): Hiring status and funding signals
 * - Trend (5%): Category hype cycle position
 * - Penalty (0-20): Failure patterns from graveyard data
 */

import type { Startup, FailedStartup } from './algolia';

export interface SurvivalScoreBreakdown {
  total: number;           // Final score 0-100
  growth: number;          // Growth component score (0-100 normalized)
  market: number;          // Market component score (0-100 normalized)
  team: number;            // Team component score (0-100 normalized)
  funding: number;         // Funding component score (0-100 normalized)
  trend: number;           // Trend component score (0-100 normalized)
  penalty: number;         // Failure pattern penalty (0-20)
}

/**
 * Category trend scores based on market cycle (hype curve)
 * Higher score = emerging/growing category
 * Lower score = saturated/declining category
 */
const CATEGORY_TRENDS: Record<string, number> = {
  // Emerging / High Potential (4-5)
  'AI': 5,
  'Artificial Intelligence': 5,
  'Machine Learning': 5,
  'ML': 5,
  'LLM': 5,
  'Generative AI': 5,
  'Climate Tech': 4,
  'Climate': 4,
  'Biotech': 4,
  'Biology': 4,
  'Web3': 3,
  'Crypto': 2,
  'Blockchain': 2,

  // Established / Solid (2-3)
  'SaaS': 3,
  'B2B': 3,
  'Developer Tools': 4,
  'Infrastructure': 3,
  'Fintech': 3,
  'Finance': 3,
  'Payments': 3,
  'E-commerce': 2,
  'Healthcare': 3,
  'Health': 3,
  'Medical': 3,

  // Saturated / Challenged (0-1)
  'Social': 1,
  'Social Media': 1,
  'Marketplace': 1,
  'Marketplaces': 1,
  'Consumer': 2,
  'Food': 1,
  'Food Delivery': 1,
  'Transportation': 1,
  'Mobility': 1,
  'Gig': 1,
  'On-demand': 1,
};

/**
 * Market saturation penalties
 * Higher saturation = higher penalty
 */
const SATURATION_PENALTIES: Record<string, number> = {
  'High': -15,
  'Medium': -5,
  'Low': 0,
  'Unknown': -2,
};

/**
 * Find category trend score with fuzzy matching
 */
function getCategoryTrendScore(category?: string): number {
  if (!category) return 2; // Neutral

  // Direct match
  if (CATEGORY_TRENDS[category]) {
    return CATEGORY_TRENDS[category];
  }

  // Fuzzy match - check if category name contains known trend keywords
  const catLower = category.toLowerCase();
  for (const [key, score] of Object.entries(CATEGORY_TRENDS)) {
    if (key.toLowerCase().split(' ').some(word =>
      catLower.includes(word.toLowerCase()) || word.toLowerCase().includes(catLower)
    )) {
      return score;
    }
  }

  return 2; // Default neutral
}

/**
 * Calculate market score based on category and saturation
 */
function calculateMarketScore(
  category?: string,
  saturation?: string
): number {
  const baseScore = 25; // Max possible score for this factor

  // Saturation penalty
  const saturationPenalty = saturation
    ? SATURATION_PENALTIES[saturation] || SATURATION_PENALTIES['Unknown']
    : 0;

  // Category trend bonus (convert 0-5 scale to -5 to +10 bonus)
  const trendScore = getCategoryTrendScore(category);
  const trendBonus = (trendScore - 2.5) * 4; // -10 to +10

  return Math.max(0, Math.min(25, baseScore + saturationPenalty + trendBonus));
}

/**
 * Calculate funding score based on available signals
 */
function calculateFundingScore(startup: Startup): number {
  const maxScore = 15;

  // Active hiring = strong signal
  if (startup.is_hiring) {
    return maxScore * 0.85;
  }

  // YC companies typically have some baseline funding
  if (startup.batch) {
    return maxScore * 0.60;
  }

  // Has team size > 10 suggests some funding
  if (startup.team_size && startup.team_size > 10) {
    return maxScore * 0.50;
  }

  return maxScore * 0.25; // Base score for unknown
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
    f.category?.toLowerCase() === startup.category?.toLowerCase() ||
    f.sector?.toLowerCase() === startup.category?.toLowerCase()
  );

  if (similarFailures.length === 0) return 0;

  // Penalty based on number of similar failures
  // More failures in category = higher risk
  if (similarFailures.length > 20) return 8;
  if (similarFailures.length > 10) return 5;
  if (similarFailures.length > 5) return 3;
  return 1;
}

/**
 * Main survival score calculation function
 *
 * @param startup - The startup to score
 * @param graveyardData - Optional graveyard data for failure pattern analysis
 * @returns SurvivalScoreBreakdown with total and component scores
 */
export function calculateSurvivalScore(
  startup: Startup,
  graveyardData?: FailedStartup[]
): SurvivalScoreBreakdown {
  // Growth Score (35%) - Based on existing survival_score from YC data
  // This represents historical growth metrics and base survival probability
  const growthScore = (startup.survival_score || 50) * 0.35;

  // Market Score (25%) - Category saturation and trend
  const marketScore = calculateMarketScore(startup.category, startup.saturation);

  // Team Score (20%) - YC batch indicates proven team with vetting
  const teamScore = startup.batch ? 20 : 5;

  // Funding Score (15%) - Based on hiring status and YC participation
  const fundingScore = calculateFundingScore(startup);

  // Trend Score (5%) - Category hype cycle awareness
  const trendScore = getCategoryTrendScore(startup.category);

  // Failure Pattern Penalty - Based on similar companies that failed
  const penalty = analyzeFailurePatterns(startup, graveyardData);

  const total = Math.max(0, Math.min(100,
    growthScore + marketScore + teamScore + fundingScore + trendScore - penalty
  ));

  // Normalize components to 0-100 for display
  return {
    total: Math.round(total),
    growth: Math.round((growthScore / 0.35)),
    market: Math.round((marketScore / 0.25) * 100),
    team: startup.batch ? 100 : 25, // 20/20 = 100%, 5/20 = 25%
    funding: Math.round((fundingScore / 0.15) * 100),
    trend: Math.round((trendScore / 5) * 100),
    penalty: Math.round(penalty),
  };
}

/**
 * Get survival score label and color
 */
export function getSurvivalLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 70) {
    return {
      label: 'Strong',
      color: 'text-green-400',
      bg: 'bg-green-500/20'
    };
  }
  if (score >= 50) {
    return {
      label: 'Moderate',
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/20'
    };
  }
  if (score >= 30) {
    return {
      label: 'Risky',
      color: 'text-orange-400',
      bg: 'bg-orange-500/20'
    };
  }
  return {
    label: 'Critical',
    color: 'text-red-400',
    bg: 'bg-red-500/20'
  };
}

/**
 * Get category trend label
 */
export function getTrendLabel(score: number): { label: string; color: string } {
  if (score >= 4) return { label: 'Emerging', color: 'text-green-400' };
  if (score >= 3) return { label: 'Established', color: 'text-blue-400' };
  if (score >= 2) return { label: 'Stable', color: 'text-yellow-400' };
  return { label: 'Saturated', color: 'text-red-400' };
}
