# DEV.to Submission Post

*This is a submission for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia): Consumer-Facing Conversational Experiences*

---

## What I Built

**Startup Roast** is an AI-powered startup idea validator that provides brutally honest feedback by analyzing your idea against a database of **2,500+ real YC startups** and **403+ failed companies**.

Before you quit your job, raise money from friends and family, or spend months building something nobody wants - get a reality check in seconds, not months.

### The Problem

Every year, thousands of entrepreneurs start companies based on "gut feelings" and encouragement from supportive friends who don't want to hurt their feelings. Meanwhile, there are decades of startup data available showing patterns of success and failure that nobody consults until it's too late.

### The Solution

Startup Roast combines conversational AI with retrieval from thousands of real companies to provide:

- **Survival Probability Score** - Multi-factor algorithm (Growth 35%, Market 25%, Team 20%, Funding 15%, Trend 5%)
- **Market Saturation Analysis** - Know if you're entering a crowded space
- **Funding Likelihood** - Realistic assessment based on similar companies
- **Graveyard Insights** - See similar companies that failed and WHY they failed
- **Pivot Suggestions** - Actionable alternatives when your concept needs refinement

### The Experience

1. Search for any startup or describe your own idea
2. AI retrieves relevant context from 2,900+ companies using RAG
3. Get structured, visual feedback with actionable insights
4. Explore pivot suggestions with one click

---

## Demo

**Live URL:** https://ai-roasting-algolia.vercel.app

**Video Demo:** https://youtu.be/TuSimU_864U

[![Watch the 60-second demo](/docs/screenshots/official.png)](https://www.youtube.com/watch?v=TuSimU_864U)

**Repository:** https://github.com/VuKhoiGVM/ai-roasting-algolia.git

---

## How I Used Algolia Agent Studio

### Data Indexed

I created two Algolia indices with rich, structured data:

#### 1. Startups Index (2,500 records)

**Data Structure:**
```json
{
  "objectID": "yc_31306",
  "name": "Martini",
  "description": "Collaborative AI-native filmmaking for professionals",
  "long_description": "Martini is a collaborative, AI-native platform...",
  "batch": "W26",
  "status": "Active",
  "tags": ["Generative AI", "Entertainment", "Design Tools"],
  "location": "San Francisco",
  "year_founded": 2025,
  "team_size": 2,
  "website": "https://martini.film",
  "is_hiring": false,
  "open_jobs": 0,
  "category": "Generative AI",
  "survival_score": 64,
  "survival_breakdown": {
    "total": 64,
    "growth": 14,
    "market": 100,
    "team": 100,
    "funding": 60,
    "trend": 100,
    "penalty": 0
  },
  "saturation": "Medium"
}
```

**Searchable Attributes:** name, description, long_description, category, sector, tags, batch, location

**Custom Ranking:** Higher `survival_score` → higher rank, then hiring companies get boost

**Facets:** category, status, sector, batch, is_hiring, saturation, year_founded

#### 2. Graveyard Index (403 records)

**Data Structure:**
```json
{
  "objectID": "fail_Health_Care_0",
  "name": "Aira Health",
  "sector": "Health Care",
  "category": "Health Care",
  "years_of_operation": "2015-2019",
  "what_they_did": "Personalized asthma/allergy app",
  "how_much_raised": "$12M",
  "raised_amount": 12000000,
  "why_they_failed": "Small user base and cash shortage",
  "takeaway": "Niche apps need big audiences",
  "year_founded": 2015,
  "year_closed": 2019,
  "lost_to_giants": true,
  "no_budget": true,
  "competition": true,
  "poor_market_fit": true
}
```

**Searchable Attributes:** name, what_they_did, why_they_failed, takeaway, category, sector

**Custom Ranking:** Higher `raised_amount` → higher rank (bigger failures are more educational), then more recent failures

**Facets:** 40+ failure reason flags (lost_to_giants, no_budget, competition, poor_market_fit, monetization_failure, etc.)

### Index Configuration

I configured both indices with optimized settings:

**Custom Ranking** (primary - determines result order):
```javascript
// Startups: Prioritize high-quality, active companies
customRanking: [
  'desc(survival_score)',  // 🔥 Primary signal: companies with higher survival potential
  'desc(is_hiring)',       // 📈 Active growth signal: hiring = expanding
  'desc(batch)',           // 🆕 Recency bias: newer batches first (W26 > W25)
  'asc(name)'              // 📝 Alphabetical tie-breaker for consistency
]

// Graveyard: Most educational failures first
customRanking: [
  'desc(raised_amount)',   // 💰 Raised more $$ = more expensive lesson = higher priority
  'desc(year_closed)',     // 📅 Recent failures = more relevant to current market
  'asc(name)'              // 📝 Alphabetical tie-breaker
]
```

**Why This Ranking Works:**
- **survival_score first** ensures the best companies surface when browsing
- **is_hiring as boost** rewards actively growing companies
- **batch recency** gives newer YC companies visibility (they need it more!)
- **raised_amount for graveyard** shows the most dramatic failures ($3.5B Faraday Future story > $50K failure)

**Searchable Attributes** (after ranking - determines which fields are searched):
```javascript
searchableAttributes: [
  'name',           // Exact company name matches rank highest
  'description',    // Then description content
  'long_description',
  'category',       // Category matches
  'tags',           // Tag matches
  'batch',          // YC batch
  'location'
]
```

**Typo Tolerance:** Enabled for 4+ character words, 2 typos for 8+ character words

### Query Rules

I implemented 20+ query rules to enhance search experience:

#### AI/ML Boost Rules
```javascript
// Searching "ai", "machine learning", "llm", "gpt"
// → Automatically filter to AI/ML categories
{
  objectID: 'ai-boost-basic',
  conditions: [{ pattern: 'ai', anchoring: 'contains' }],
  consequence: {
    params: {
      filters: 'category:Artificial Intelligence OR category:AI OR category:Machine Learning'
    }
  }
}
```

#### Failure Query Redirects
```javascript
// Searching "failed", "dead", "shutdown", "bankrupt"
// → Prioritize graveyard results
{
  objectID: 'failure-redirect-failed',
  conditions: [{ pattern: 'failed', anchoring: 'contains' }],
  consequence: {
    filterPromotes: false,
    userData: { showGraveyardFirst: true }
  }
}
```

#### Category Auto-Filters
```javascript
// Searching exactly "fintech" → auto-filter to Fintech/Finance/Payments
// Searching exactly "healthcare" → auto-filter to Healthcare/Medical
// Searching exactly "saas" → auto-filter to SaaS/B2B
{
  objectID: 'category-fintech',
  conditions: [{ pattern: 'fintech', anchoring: 'is' }],
  consequence: {
    params: {
      automaticFacetFilters: [['category:Fintech'], ['category:Finance'], ['category:Payments']]
    }
  }
}
```

### Agent Configuration

In Algolia Agent Studio, I configured a custom agent:

#### Tools Configuration
Both indices enabled for retrieval:
- **startups** index search - For successful company analysis
- **graveyard** index search - For failure pattern analysis

#### LLM Selection
**Google Gemini 2.0 Flash** - Chosen for:
- Fast response times (<1 second)
- Strong reasoning capabilities
- Good with structured output

#### System Prompt Engineering

```
You are Startup Roast - a brutally honest startup advisor. Analyze ideas against real data.

Your response MUST follow this exact format:

**Survival Probability:** X%
**Market Saturation:** [Low/Medium/High]
**Funding Likelihood:** X%

**💀 The Graveyard (similar failures):**
- [Company Name]: [brief failure reason]

**🔄 Pivot Suggestions:**
- [Specific pivot idea with reasoning]

**The Roast:**
[Brutally honest analysis with specific references to similar companies from the retrieved data.
Be direct but constructive. Reference actual companies when making comparisons.]
```

**Key Prompt Techniques Used:**
1. **Structured output format** - Enables frontend parsing for visual metrics
2. **Specific section markers** - `**💀 The Graveyard:**` for regex parsing
3. **Retrieval grounding** - "Reference actual companies from retrieved data"
4. **Tone setting** - "Brutally honest but constructive"

### Frontend Integration

Using **Vercel AI SDK v6** with direct Agent Studio transport (no backend needed!):

```typescript
import { useChat, DefaultChatTransport } from "ai"

const transport = new DefaultChatTransport({
  api: `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?compatibilityMode=ai-sdk-5`,
  headers: {
    "x-algolia-application-id": appId,
    "x-algolia-api-key": searchKey,  // Search-only key (safe for client)
  },
})

const chat = useChat({ transport })

// Send message
chat.sendMessage({ text: userInput })
```

**Response Parsing:**
```typescript
// Extract metrics from structured AI response
const survivalMatch = text.match(/\*\*Survival Probability:\*\*\s*(\d+)%?/i)
const saturationMatch = text.match(/\*\*Market Saturation:\*\*\s*(Low|Medium|High)/i)
const fundingMatch = text.match(/\*\*Funding Likelihood:\*\*\s*(\d+)%?/i)

// Parse graveyard entries
const graveyardMatch = text.match(/\*\*💀[^*]*:\*\*([\s\S]*?)(?=\*\*🔄|\*\*The Roast|$)/i)
// Parse pivot suggestions
const pivotMatch = text.match(/\*\*🔄[^*]*:\*\*([\s\S]*?)(?=\*\*|$)/i)
```

**Rendering Components:**
- Survival probability → colored progress bar (green/yellow/red)
- Market saturation → visual meter with emoji indicators
- Funding likelihood → percentage meter with confidence level
- Graveyard section → cards showing failed companies with reasons
- Pivot suggestions → clickable chips that re-analyze the new direction

### Why This Approach

Instead of building a custom RAG pipeline with vector search and prompt engineering, Algolia Agent Studio gave me:

| Feature | Custom RAG Pipeline | Algolia Agent Studio |
|---------|-------------------|---------------------|
| **Infrastructure** | Vector DB, embedding API, backend server | Zero infra needed |
| **Setup Time** | Days to weeks | Hours |
| **Retrieval Speed** | 2-5 seconds | <100ms |
| **Cost** | Multiple API costs | Single platform |
| **Maintenance** | High | Low |
| **Grounding** | Manual prompt engineering | Built-in RAG |

---

## Why Fast Retrieval Matters

### The Speed Expectation

In a conversational interface, users expect responses in **seconds**, not minutes. When someone types "Uber for dog walking," they want feedback now, not after 30 seconds of loading spinners.

### What Would Happen with Slow Retrieval

Without Algolia's millisecond-level retrieval:

1. **User abandonment** - 53% of users abandon sites that take >3 seconds to load
2. **Context window limits** - Can't retrieve enough relevant examples with slow APIs
3. **Cold starts** - Every query needs new retrieval, no caching benefits
4. **Cascading delays** - Slow retrieval → slow LLM → slow generation → frustrated user

### How Algolia's Speed Improves Experience

| Metric | With Slow Search | With Algolia |
|--------|------------------|--------------|
| First response time | 5-10 seconds | <1 second |
| Relevant examples retrieved | 5-10 | 20-50 |
| Context quality | Sparse | Rich & diverse |
| User engagement | Drop off after 1 query | Continue exploring pivots |

### Real Example

When a user asks about "AI for legal contracts":

**Slow retrieval:** Finds 5-10 companies, misses key competitors, gives generic advice

**Algolia:** Retrieves 30+ relevant companies instantly, identifies proper competitors like Casetext, LegalZoom, Ironclad, provides specific competitive analysis with real company names and their outcomes

This speed allows users to iterate quickly - try an idea, get feedback, pivot, try again. In one session, a user might explore 5-6 variations of their concept. Each exploration compounds their understanding of the market.

---

## Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router + Turbopack), React 19
- **AI:** Algolia Agent Studio, Vercel AI SDK v6, Google Gemini 2.0 Flash
- **Search:** Algolia JavaScript SDK v5.35.0
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Data:** 2,500 YC startups + 403 failed companies

---

## What's Next

Potential improvements I'd love to add:
- [ ] User accounts to save favorite roasts
- [ ] Export analysis as PDF
- [ ] Industry trend visualization
- [ ] Investor perspective mode
- [ ] Co-founder matching based on complementary skills

---

**Built with 🔥 for the Algolia Agent Studio Challenge 2026**

*Demo: https://youtu.be/TuSimU_864U | Live: https://ai-roasting-algolia.vercel.app*
