# Algolia Enhancement Implementation Roadmap

**Project:** Startup Roast - Hackathon Deadline: February 8, 2025
**Created:** February 6, 2025
**Status:** Ready for Implementation

---

## Executive Summary

This roadmap prioritizes high-impact, quick-win features that showcase Algolia SDK capabilities while significantly improving the startup analysis experience. Based on comprehensive research across survival scoring algorithms, Algolia advanced features, and Agent Studio patterns.

### Priority Matrix

| Feature | Impact | Effort | Time | Priority |
|---------|--------|--------|------|----------|
| **Survival Score Algorithm** | High | Medium | 2-3h | P0 |
| **Query Rules (AI boost)** | High | Low | 1h | P0 |
| **Custom Ranking** | Medium | Low | 30m | P1 |
| **Agent Studio Tools** | High | Medium | 2h | P1 |
| **Faceted Search UI** | Medium | Medium | 2h | P2 |

---

## Current State Analysis

### Data Assets
- **Startups Index:** 2,525 YC companies with survival scores
- **Graveyard Index:** 403 failed startups with rich failure metadata
- **Rich Fields:** `what_they_did`, `why_they_failed`, `takeaway`, `raised_amount`, 14 boolean failure flags

### Current Implementation
- **Search:** Custom `startup-search.tsx` with keyboard nav + recent searches ✅
- **AI:** Agent Studio direct integration (no local `/api/roast` route)
- **Metrics:** Parsed from AI responses via regex patterns
- **Survival Score:** Single-value from `survival_score` field (not weighted)

### Key Files
| File | Purpose | Changes Needed |
|------|---------|----------------|
| `lib/algolia.ts` | Search client v5 | Add ranking functions |
| `app/page.tsx` | Main chat UI | Integrate tools |
| `components/startup-search.tsx` | Search component | Add faceting |
| `components/metrics/survival-meter.tsx` | Display survival | Support multi-factor |

---

## Phase 1: Enhanced Survival Score Algorithm (P0)

**Why:** Current survival score is a single value. Research shows multi-factor scoring is more accurate (CB Insights Mosaic: 74% prediction accuracy).

### Implementation

**1. Create survival score calculator**
```typescript
// lib/survival-calculator.ts (NEW FILE)

interface SurvivalScoreBreakdown {
  total: number;
  growth: number;      // 35% weight
  market: number;      // 25% weight
  team: number;        // 20% weight
  funding: number;     // 15% weight
  trend: number;       // 5% weight
  penalty: number;     // Failure pattern penalty
}

export function calculateSurvivalScore(
  startup: Startup,
  graveyardData?: FailedStartup[]
): SurvivalScoreBreakdown {
  // Growth Score (35%) - YC metrics: 5-7% weekly = exceptional
  const growthScore = (startup.survival_score || 50) * 0.35;

  // Market Score (25%) - Category saturation penalty
  const marketScore = calculateMarketScore(startup.category, startup.saturation);

  // Team Score (20%) - YC batch = proven team
  const teamScore = startup.batch ? 20 : 5;

  // Funding Score (15%) - Based on presence of funding data
  const fundingScore = calculateFundingScore(startup);

  // Trend Score (5%) - Category hype awareness
  const trendScore = getCategoryTrendScore(startup.category);

  // Failure Pattern Penalty
  const penalty = analyzeFailurePatterns(startup, graveyardData);

  const total = Math.max(0, Math.min(100,
    growthScore + marketScore + teamScore + fundingScore + trendScore - penalty
  ));

  return { total, growth: growthScore * 100/35, market, team, funding, trend, penalty };
}
```

**2. Update SurvivalMeter component**
- Show score breakdown tooltip on hover
- Visual indicator for each factor
- Color-coded strength (green = strong, yellow = moderate, red = weak)

**3. Market saturation penalties**
```typescript
const SATURATION_PENALTIES: Record<string, number> = {
  'High': -15,   // Saturated market
  'Medium': -5,
  'Low': 0,
  'Unknown': -2,
};
```

**Files to modify:**
- `lib/survival-calculator.ts` (NEW)
- `components/metrics/survival-meter.tsx` (UPDATE)
- `lib/algolia.ts` (UPDATE - add to type exports)

---

## Phase 2: Algolia Query Rules (P0 - Quick Win)

**Why:** Query rules automatically boost/filter results based on query patterns. Zero code changes to UI, immediate impact.

### Rules to Implement

**1. AI/VC Query Auto-Boost**
```javascript
// Rule: When users search for AI/VC related terms, boost relevant results
{
  "conditions": [{
    "pattern": "{alternatives:AI,artificial intelligence,machine learning,ML,LLM,GPT}",
    "anchoring": "is"
  }],
  "actions": {
    "renders": [{
      "link": "https://www.algolia.com", // Optional promotional link
      "title": "AI Startups Trending"
    }],
    "ranking": [{
      "attribute": "category",
      "direction": "ascending"
    }]
  },
  "description": "Boost AI-related startups"
}
```

**2. "Failed" Query Filter**
```javascript
// Rule: When users search for failure-related terms, show graveyard first
{
  "conditions": [{
    "pattern": "{alternatives:failed,dead,shutdown,bankrupt,graveyard}",
    "anchoring": "contains"
  }],
  "actions": {
    "userData": {
      "showGraveyardFirst": true
    }
  },
  "description": "Prioritize graveyard for failure queries"
}
```

**3. Category Redirects**
```javascript
// Rule: Redirect category searches to filtered view
{
  "conditions": [{
    "pattern": "{alternatives:fintech,finance,payments,banking}",
    "anchoring": "is"
  }],
  "actions": {
    "filters": ["category:Fintech"],
    "userData": {
      "autoFilter": "Fintech"
    }
  }
}
```

### Implementation Script

**Create:** `scripts/setup-query-rules.js`
```javascript
const algoliasearch = require('algoliasearch/lite');

const client = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const rules = [
  // AI/VC boost rule
  {
    objectID: 'ai-boost',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:AI,artificial intelligence,machine learning,ML,GPT,Claude,Gemini}',
      anchoring: 'contains'
    }],
    consequence: {
      filterPromotes: false,
      params: {
        ranking: [
          'desc(category:AI)',
          'desc(category:Machine Learning)',
          'typo',
          'geo',
          'words',
          'proximity',
          'attribute',
          'exact',
          'custom'
        ]
      }
    },
    description: 'Boost AI-related startups'
  },
  // ... more rules
];

async function setupRules() {
  await client.saveRule({
    indexName: 'startups',
    objectID: 'ai-boost',
    rule: rules[0]
  });
}

setupRules();
```

**Files to create:**
- `scripts/setup-query-rules.js` (NEW)

---

## Phase 3: Custom Ranking Configuration (P1)

**Why:** Improve result relevance by configuring ranking attributes. Zero code changes, pure Algolia configuration.

### Ranking Strategy

```json
{
  "settings": {
    "ranking": [
      "words",
      "filters",
      "typo",
      "proximity",
      "attribute",
      "exact",
      "custom"
    ],
    "customRanking": [
      "desc(survival_score)",
      "desc(status)",
      "desc(is_hiring)",
      "asc(category)"  // Alphabetical for tie-breaking
    ],
    "relevancyStrictness": 50,
    "attributesForFaceting": [
      "category",
      "status",
      "sector",
      "batch",
      "is_hiring"
    ],
    "attributesToHighlight": [
      "name",
      "description",
      "category"
    ]
  }
}
```

**Files to create:**
- `scripts/configure-ranking.js` (NEW)

---

## Phase 4: Agent Studio Tool Calling (P1)

**Why:** Current Agent Studio has auto-search RAG. Explicit tool calling improves accuracy by searching BEFORE analysis.

### Multi-Agent Architecture

```typescript
// lib/agent-tools.ts (NEW FILE)

import { searchAll, searchStartups, searchGraveyard } from './algolia';

export const agentTools = {
  searchSimilarStartups: {
    description: "Search for similar startups to compare against",
    parameters: {
      query: { type: "string", description: "Search query for similar companies" },
      category?: { type: "string", description: "Optional category filter" }
    },
    execute: async ({ query, category }) => {
      return await searchStartups(query, { category });
    }
  },

  searchFailures: {
    description: "Search graveyard for failure patterns in similar companies",
    parameters: {
      query: { type: "string", description: "Search query for failed companies" },
      sector?: { type: "string", description: "Optional sector filter" }
    },
    execute: async ({ query, sector }) => {
      return await searchGraveyard(query);
    }
  },

  getMarketContext: {
    description: "Get market saturation and competition data for a category",
    parameters: {
      category: { type: "string", description: "Category to analyze" }
    },
    execute: async ({ category }) => {
      const [startups, failures] = await Promise.all([
        searchStartups('', { category }),
        searchGraveyard(category)
      ]);
      return {
        activeStartups: startups.length,
        failedStartups: failures.length,
        saturation: startups.length > 500 ? 'High' : startups.length > 100 ? 'Medium' : 'Low'
      };
    }
  }
};
```

### Enhanced Prompt with Tool Instructions

Update Agent Studio prompt to include:
```
IMPORTANT: Before analyzing any startup idea:
1. Use searchSimilarStartups to find comparable companies
2. Use searchFailures to find similar failures
3. Use getMarketContext to understand market saturation
4. Reference found companies in your analysis
```

**Files to create:**
- `lib/agent-tools.ts` (NEW)

---

## Phase 5: Faceted Search UI (P2 - Optional)

**Why:** Let users filter results without typing. More visual, showcases Algolia's faceting capabilities.

### UI Components

**1. FacetFilter Component**
```typescript
// components/facet-filter.tsx (NEW)

interface FacetFilterProps {
  facet: string;
  values: { value: string; count: number }[];
  selected: string[];
  onChange: (values: string[]) => void;
  color?: 'orange' | 'red';
}

export function FacetFilter({ facet, values, selected, onChange, color = 'orange' }: FacetFilterProps) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold capitalize">{facet}</h4>
      {values.map(({ value, count }) => (
        <label key={value} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(value)}
            onChange={(e) => {
              const newSelected = e.target.checked
                ? [...selected, value]
                : selected.filter(v => v !== value);
              onChange(newSelected);
            }}
            className={color === 'orange' ? 'accent-orange-500' : 'accent-red-500'}
          />
          <span className="flex-1">{value}</span>
          <span className="text-slate-500">({count})</span>
        </label>
      ))}
    </div>
  );
}
```

**2. Integration in StartupSearch**
```typescript
// Add to existing search component
const [selectedFacets, setSelectedFacets] = useState({
  category: [] as string[],
  status: [] as string[],
  batch: [] as string[]
});

// Update search to use facet filters
const searchWithFacets = async (query: string) => {
  const filters = Object.entries(selectedFacets)
    .filter(([_, values]) => values.length > 0)
    .map(([facet, values]) => values.map(v => `${facet}:"${v}"`).join(' OR '))
    .join(' AND ');

  return searchStartups(query, {
    hitsPerPage: 20,
    ...(filters && { filters })
  });
};
```

**Files to create:**
- `components/facet-filter.tsx` (NEW)
- `components/startup-search.tsx` (UPDATE)

---

## Implementation Order (Time-Constrained)

### Day 1 (Feb 6) - Focus: P0 Features
1. **Query Rules Setup** (1 hour) - Highest ROI, lowest effort
2. **Survival Score Calculator** (2-3 hours) - High impact on accuracy

### Day 2 (Feb 7) - Focus: P1 Features
3. **Custom Ranking Config** (30 min) - Quick configuration
4. **Agent Studio Tools** (2 hours) - Improves AI quality

### Day 3 (Feb 8) - Focus: Polish
5. **Faceted Search** (if time) - Nice-to-have visual enhancement
6. **Testing & Demo Prep** - Ensure everything works for pitch

---

## Testing Checklist

### Survival Score
- [ ] Score displays breakdown on hover
- [ ] YC startups get team boost
- [ ] High-saturation categories get penalty
- [ ] Failed patterns reduce score appropriately

### Query Rules
- [ ] "AI" queries boost AI companies to top
- [ ] "failed" queries show graveyard results
- [ ] Category queries auto-filter

### Agent Tools
- [ ] AI responses reference found companies
- [ ] Market context includes saturation level
- [ ] Failure patterns mention specific graveyard entries

---

## Success Metrics

### Before
- Single-value survival score
- No query personalization
- AI responses don't reference real data

### After
- Multi-factor survival score with breakdown
- Query rules boost relevant results automatically
- AI responses cite specific startups/failures
- Faceted search for power users

---

## References

- Research: `plans/search-enhancement/research-2025-02-06-comprehensive.md`
- Previous: `plans/search-enhancement/research-2025-02-05.md`
- Algolia v5 Docs: https://www.algolia.com/doc/libraries/javascript/v5/
- Agent Studio: https://www.algolia.com/doc/agent-studio/

---

## Appendix: Category Trend Scores

```typescript
const CATEGORY_TRENDS: Record<string, number> = {
  // Emerging / High Potential (4-5)
  'AI': 5,
  'Machine Learning': 5,
  'Climate Tech': 4,
  'Biotech': 4,
  'Web3': 3,

  // Established / Moderate (2-3)
  'SaaS': 3,
  'Fintech': 3,
  'E-commerce': 2,
  'Healthcare': 3,

  // Saturated / Low (0-1)
  'Social': 1,
  'Marketplaces': 1,
  'On-demand': 0,
  'Gig Economy': 1,
};
```

---

*Plan created for hackathon deadline. Focus on P0 features first for maximum impact.*
