# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Startup Roast** - An AI-powered startup idea validator that provides brutally honest feedback. Built for a hackathon (deadline Feb 8, 2025).

**Tech Stack:**
- Next.js 16.1.6 with App Router + Turbopack
- Vercel AI SDK v6 (`ai`, `@ai-sdk/react`)
- Algolia JavaScript SDK v5 (`algoliasearch@5.35.0`)
- Algolia Agent Studio (AI agent with RAG)
- shadcn/ui + Tailwind CSS v4
- React 19

## Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000

# Build
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint

# Data Processing (Algolia indices)
npm run data:process    # Run Python script to process CSV data
npm run data:upload     # Upload processed data to Algolia
```

## Architecture

### Single Page Application

All functionality exists on `/`. The app combines search, browsing, and AI chat in one view.

### Data Flow

1. **Raw Data** (`data/Fails/*.csv`, `data/yc.csv`) → Python processing script → **Processed JSON** (`data/processed/*.json`)
2. **Processed JSON** → Upload script → **Algolia Indices** (`startups`, `graveyard`)
3. **Frontend** → Algolia Search API → Startup/Failed startup results
4. **User Input** → **Algolia Agent Studio** (auto-searches indices) → Google Gemini AI → Streaming response
5. **AI Response** → Parsed metrics → Visual components displayed

### Agent Studio Integration

The app uses **Algolia Agent Studio** for Retrieval Augmented Generation (RAG). Instead of a custom `/api/roast` endpoint, the frontend calls Agent Studio directly:

```typescript
// app/page.tsx - Direct Agent Studio integration
const transport = new DefaultChatTransport({
  api: `https://${process.env.NEXT_PUBLIC_ALGOLIA_APP_ID}.algolia.net/agent-studio/1/agents/${process.env.NEXT_PUBLIC_ALGOLIA_AGENT_ID}/completions?compatibilityMode=ai-sdk-5`,
  headers: {
    "x-algolia-application-id": process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
    "x-algolia-api-key": process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!,
  },
})
```

**Agent Configuration (in Algolia Dashboard):**
- Agent ID: Set via `NEXT_PUBLIC_ALGOLIA_AGENT_ID` env var
- Tools: `startups` index search, `graveyard` index search
- LLM: Google Gemini 2.0 Flash
- System prompt configured in Agent Studio dashboard

### Component Structure

```
app/
├── page.tsx                      # Main page with chat, search, and sections
├── layout.tsx                    # Root layout with suppressHydrationWarning
├── globals.css                   # Cyberpunk theme styles
├── error.tsx                     # Error boundary
└── not-found.tsx                 # 404 page

components/
├── dynamic-background.tsx        # Animated canvas background
├── startup-search.tsx            # Unified search (startups + graveyard)
├── top-startups-section.tsx      # Top 4 startups by survival score
├── mega-failures-section.tsx     # Top 4 failed startups by funding
├── category-selector-popup.tsx   # Category filter with popup
└── metrics/
    ├── survival-meter.tsx        # Survival probability progress bar
    ├── saturation-meter.tsx      # Market saturation indicator
    ├── funding-indicator.tsx     # Funding likelihood meter
    ├── graveyard-section.tsx     # Similar failures display
    └── pivot-card.tsx            # Clickable pivot suggestions

lib/
├── algolia.ts                    # Algolia v5 search client
└── startups.ts                   # Fallback hardcoded data

scripts/
├── upload-to-algolia.js          # Algolia v5 batch upload script
└── process-data.py               # Data processing script
```

### Key Features

1. **Unified Search** - Single search box returns both active startups and failed companies, sorted with active first
2. **Top Startups** - Horizontal scroll showing top 4 by `survival_score` with color-coded badges
3. **Notable Failures** - Top 4 graveyard entries by `raised_amount` with inline `why_they_failed`
4. **Category Filtering** - Single-select category pills with popup for remaining categories
5. **Chat with Metrics** - AI responses parsed for survival probability, market saturation, funding, graveyard examples, pivots
6. **Fixed Height Layout** - 4 cards per section at `h-32` with `min-h-[40px]` category container

### Metric Parsing (Critical Pattern)

The app parses structured data from AI responses using regex in `parseRoastMetrics()`:

```typescript
// Expected AI response format:
**Survival Probability: X%**
**Market Saturation: [Low/Medium/High]**
**Funding Likelihood: X%**

**💀 The Graveyard (similar failures):**
- [Company]: [Reason]

**🔄 Pivot Suggestions:**
- [Pivot idea]

**The Roast:**
[Analysis text]
```

### Algolia v5 API Patterns

**Breaking change from v4:** `initIndex()` has been removed. All methods take `indexName` as a parameter.

```typescript
// CORRECT (v5):
const { results } = await client.search({
  requests: [{ type: 'default', indexName: 'startups', query, hitsPerPage: 20 }]
});
return (results[0] as any)?.hits || [];

// WRONG (v4 - doesn't exist):
const index = client.initIndex('startups'); // ERROR!
```

**Available search functions (lib/algolia.ts):**
- `searchStartups(query, options)` - Search with optional category filter
- `searchGraveyard(query)` - Search failed startups
- `searchAll(query)` - Search both indices in parallel
- `getTopStartups()` - Top 10 by survival_score (filtered to score >= 40)
- `getTopGraveyardEntries()` - Top 10 by raised_amount
- `getCategories()` - Category facets with counts
- `getGraveyardCategories()` - Graveyard category facets
- `searchStartupsByCategory(category)` - Filter by category
- `searchGraveyardByCategory(category)` - Filter graveyard by category

### Category Selector Pattern

Single-select category filtering with popup:

```typescript
interface CategorySelectorPopupProps {
  categories: Array<{ name: string; count: number }>
  selectedCategory: string | null
  onSelectionChange: (category: string | null) => void
  color?: "orange" | "red"  // Orange for startups, red for graveyard
}

// Shows only selected category when active, or first 3 + "+X more" button
// Clicking X on selected category clears the filter
```

### AI SDK v6 Patterns

**Direct Agent Studio integration (no API route):**

```typescript
// app/page.tsx
const transport = new DefaultChatTransport({
  api: `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?compatibilityMode=ai-sdk-5`,
  headers: {
    "x-algolia-application-id": appId,
    "x-algolia-api-key": searchKey,
  },
})

const chat = useChat({ transport })
chat.sendMessage({ text: input })
```

**Message structure:**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Array<{ type: 'text' | 'reasoning'; text?: string }>;
}
```

**localStorage persistence:** Chat history saved to `startup-roast-chat` key

## Environment Variables

```bash
# Algolia (search - frontend, public)
NEXT_PUBLIC_ALGOLIA_APP_ID=xxx
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=xxx  # Search-only key

# Algolia Agent Studio
NEXT_PUBLIC_ALGOLIA_AGENT_ID=xxx    # Agent ID from Agent Studio dashboard

# Algolia (admin - for upload script only)
ALGOLIA_APPLICATION_ID=xxx
ALGOLIA_ADMIN_API_KEY=xxx           # Admin key with addObject ACL
```

## Hydration Warnings

The body tag uses `suppressHydrationWarning` to avoid warnings from browser extensions:

```tsx
// app/layout.tsx
<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      suppressHydrationWarning>
```

## UI Patterns

### Fixed Height Containers

To prevent layout shift during category filtering:
- Category container: `min-h-[40px]`
- All cards: `h-32` fixed height
- Loading skeletons match same heights

### Color Coding

- **Survival Score:** Green (70%+), Yellow (40-69%), Red (<40%)
- **Status:** Green for Active startups, Red for Failed
- **Section Theme:** Orange for startups, Red for graveyard

## Data Statistics

- Startups index: 2,525 records (YC companies with survival scores)
- Graveyard index: 403 records (failed startups with rich failure metadata)
- Rich graveyard fields: `what_they_did`, `why_they_failed`, `takeaway`, `raised_amount`
- Top funded failures: Faraday Future ($3.5B), Dyson EV ($2.7B), ContextLogic ($1.8B)

## Known Issues / TODO

- InstantSearch integration for better UX (researched in `plans/search-enhancement/`)
- Natural language query processing
- Search analytics tracking
- AI context enhancement with search results

## Hackathon Notes

- Deadline: February 8, 2025
- Uses Algolia Agent Studio for RAG-powered AI responses
- localStorage for chat persistence (no authentication - session only)
