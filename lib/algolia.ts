/**
 * Algolia Search Client v5
 *
 * Breaking changes from v4 to v5:
 * - initIndex() has been removed
 * - All methods take indexName as a parameter
 * - search() now takes a requests array for multiple indices
 *
 * Docs:
 * - https://www.algolia.com/doc/libraries/javascript/v5/
 * - https://www.algolia.com/doc/libraries/sdk/methods/search/search
 * - https://www.algolia.com/doc/libraries/sdk/upgrade/javascript
 */

import { algoliasearch } from 'algoliasearch';

export type Startup = {
  objectID: string;
  name: string;
  description: string;
  long_description?: string;
  batch?: string;
  status?: string;
  tags?: string[];
  location?: string;
  year_founded?: number;
  website?: string;
  url?: string;
  category?: string;
  survival_score?: number;
  saturation?: string;
  is_hiring?: boolean;
  team_size?: number;
  open_jobs?: number;
  index?: string;
  logo?: string;
  image?: string;
  company_image?: string;
};

// Re-export survival calculator types and functions
export type { SurvivalScoreBreakdown } from './survival-calculator';
export { calculateSurvivalScore, getSurvivalLabel, getTrendLabel } from './survival-calculator';

export type FailedStartup = {
  objectID: string;
  name: string;
  sector: string;
  category: string;
  years_of_operation: string;

  // Rich data from categorized files
  what_they_did?: string;
  how_much_raised?: string;
  raised_amount?: number;
  why_they_failed?: string;
  takeaway?: string;

  // Year breakdown
  year_founded?: number;
  year_closed?: number;
  operating_years?: number;

  // Failure flags (for filtering/analysis)
  lost_to_giants?: boolean;
  no_budget?: boolean;
  competition?: boolean;
  poor_market_fit?: boolean;
  acquisition_stagnation?: boolean;
  high_operational_costs?: boolean;
  platform_dependency?: boolean;
  monetization_failure?: boolean;
  niche_limits?: boolean;
  execution_flaws?: boolean;
  trend_shifts?: boolean;
  toxicity_trust_issues?: boolean;
  regulatory_pressure?: boolean;
  overhype?: boolean;

  // Legacy field (deprecated, use why_they_failed)
  failure_reason?: string;

  index?: string;
};

let client: ReturnType<typeof algoliasearch> | null = null;

export function getAlgoliaClient() {
  if (!client) {
    const appId = process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
    const apiKey = process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY;

    if (!appId || !apiKey) {
      return null;
    }

    client = algoliasearch(appId, apiKey);
  }

  return client;
}

/**
 * Search startups index with optional filters
 * v5 API: https://www.algolia.com/doc/libraries/sdk/methods/search/search
 */
export async function searchStartups(
  query: string,
  options?: { category?: string; hitsPerPage?: number }
): Promise<Startup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    // v5: Use client.search() with requests array instead of initIndex()
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'startups',
          query,
          hitsPerPage: options?.hitsPerPage || 20,
          filters: options?.category ? `category:"${options.category}"` : undefined,
          attributesToHighlight: ['name', 'description', 'category'],
          highlightPreTag: '<em>',
          highlightPostTag: '</em>',
        },
      ],
    });

    // Type assertion for hits from search response
    return (results[0] as any)?.hits || [];
  } catch (error) {
    console.error('Algolia search error:', error);
    return [];
  }
}

/**
 * Search graveyard (failed startups) index
 * v5 API: https://www.algolia.com/doc/libraries/sdk/methods/search/search
 */
export async function searchGraveyard(query: string): Promise<FailedStartup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    // v5: Use client.search() with requests array
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'graveyard',
          query,
          hitsPerPage: 10,
          attributesToHighlight: ['name', 'what_they_did', 'sector', 'category'],
          highlightPreTag: '<em>',
          highlightPostTag: '</em>',
        },
      ],
    });

    // Type assertion for hits from search response
    return (results[0] as any)?.hits || [];
  } catch (error) {
    console.error('Algolia graveyard search error:', error);
    return [];
  }
}

/**
 * Search both indices in parallel
 * More efficient than separate searches
 */
export async function searchAll(query: string): Promise<(Startup | FailedStartup)[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    // v5: Search multiple indices in a single request
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'startups',
          query,
          hitsPerPage: 20,
          attributesToHighlight: ['name', 'description', 'category'],
          highlightPreTag: '<em>',
          highlightPostTag: '</em>',
        },
        {
          type: 'default',
          indexName: 'graveyard',
          query,
          hitsPerPage: 10,
          attributesToHighlight: ['name', 'what_they_did', 'sector', 'category'],
          highlightPreTag: '<em>',
          highlightPostTag: '</em>',
        },
      ],
    });

    // Type assertions for hits from search responses
    const startups = (results[0] as any)?.hits || [];
    const graveyard = (results[1] as any)?.hits || [];

    return [...startups, ...graveyard];
  } catch (error) {
    console.error('Algolia search error:', error);
    return [];
  }
}

/**
 * Get top startups by survival score
 * Returns 10 startups with highest survival scores
 */
export async function getTopStartups(): Promise<Startup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'startups',
          query: '',
          hitsPerPage: 100, // Get more to sort locally
          // Filter for startups with survival_score >= 40 (good survival rate)
          filters: 'survival_score >= 40',
        },
      ],
    });

    const hits = (results[0] as any)?.hits || [];
    // Sort by survival_score descending
    return hits
      .filter((h: Startup) => h.survival_score !== undefined)
      .sort((a: Startup, b: Startup) => (b.survival_score || 0) - (a.survival_score || 0))
      .slice(0, 10);
  } catch (error) {
    console.error('Algolia getTopStartups error:', error);
    return [];
  }
}

/**
 * Get top graveyard entries by funding amount
 * Returns 10 failed startups that raised the most money
 */
export async function getTopGraveyardEntries(): Promise<FailedStartup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'graveyard',
          query: '',
          hitsPerPage: 100, // Get more to sort locally
        },
      ],
    });

    const hits = (results[0] as any)?.hits || [];
    // Sort by raised_amount descending and take top 10
    return hits
      .filter((h: FailedStartup) => h.raised_amount !== undefined && h.raised_amount > 0)
      .sort((a: FailedStartup, b: FailedStartup) => (b.raised_amount || 0) - (a.raised_amount || 0))
      .slice(0, 10);
  } catch (error) {
    console.error('Algolia getTopGraveyardEntries error:', error);
    return [];
  }
}

/**
 * Get all unique categories from startups
 * Returns array of category names with counts
 */
export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'startups',
          query: '',
          hitsPerPage: 0, // We only need facets
          facets: ['category'],
        },
      ],
    });

    const facets = (results[0] as any)?.facets?.category || {};
    return Object.entries(facets)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Algolia getCategories error:', error);
    return [];
  }
}

/**
 * Search startups by category
 */
export async function searchStartupsByCategory(category: string): Promise<Startup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'startups',
          query: '',
          hitsPerPage: 50,
          filters: `category:"${category}"`,
        },
      ],
    });

    return (results[0] as any)?.hits || [];
  } catch (error) {
    console.error('Algolia searchStartupsByCategory error:', error);
    return [];
  }
}

/**
 * Search graveyard (failed startups) by category
 */
export async function searchGraveyardByCategory(category: string): Promise<FailedStartup[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'graveyard',
          query: '',
          hitsPerPage: 50,
          filters: `category:"${category}"`,
        },
      ],
    });

    return (results[0] as any)?.hits || [];
  } catch (error) {
    console.error('Algolia searchGraveyardByCategory error:', error);
    return [];
  }
}

/**
 * Get graveyard categories with counts
 */
export async function getGraveyardCategories(): Promise<{ name: string; count: number }[]> {
  const algolia = getAlgoliaClient();
  if (!algolia) return [];

  try {
    const { results } = await algolia.search({
      requests: [
        {
          type: 'default',
          indexName: 'graveyard',
          query: '',
          hitsPerPage: 0,
          facets: ['category'],
        },
      ],
    });

    const facets = (results[0] as any)?.facets?.category || {};
    return Object.entries(facets)
      .map(([name, count]) => ({ name, count: count as number }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Algolia getGraveyardCategories error:', error);
    return [];
  }
}
