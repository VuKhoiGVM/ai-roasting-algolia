# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Startup Roast** - An AI-powered startup idea validator that provides brutally honest feedback. Built for a hackathon (deadline Feb 8, 2025).

**Tech Stack:**
- Next.js 16.1.6 with App Router
- Vercel AI SDK v6 (`ai`, `@ai-sdk/react`, `@ai-sdk/google`)
- Algolia JavaScript SDK v5 (`algoliasearch@5.35.0`)
- shadcn/ui + Tailwind CSS v4
- Google Gemini 2.5 Flash (AI model)

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

The app uses a **single-page design** - all functionality exists on `/`. The `/roast` route was removed to simplify UX.

### Data Flow

1. **Raw Data** (`data/Fails/*.csv`, `data/yc.csv`) → Python processing script → **Processed JSON** (`data/processed/*.json`)
2. **Processed JSON** → Upload script → **Algolia Indices** (`startups`, `graveyard`)
3. **Frontend** → Algolia Search API → Startup/Failed startup results
4. **User Input** → `/api/roast` → Google Gemini AI → Structured roast response
5. **AI Response** → Parsed metrics → Visual components displayed

### Component Structure

```
app/
├── page.tsx                    # Main landing page with chat, categories, top startups, mega-failures
├── layout.tsx                  # Root layout
├── globals.css                 # Cyberpunk theme styles
├── error.tsx                   # Error boundary
└── not-found.tsx               # 404 page
└── api/
    └── roast/
        └── route.ts            # AI roast endpoint with streaming

components/
├── dynamic-background.tsx      # Animated canvas background (orbs + particles)
├── category-pills.tsx          # Clickable category filter pills
├── top-startups-section.tsx    # Top 5 startups by survival score (horizontal scroll)
├── mega-failures-section.tsx   # Top 5 failed startups by funding raised
├── startup-search.tsx          # Search input with dropdown
├── startup-card.tsx            # Startup display card
├── survival-tooltip.tsx        # Info tooltip explaining survival score
└── metrics/
    ├── survival-meter.tsx      # Survival probability progress bar
    ├── saturation-meter.tsx    # Market saturation indicator
    ├── funding-indicator.tsx   # Funding likelihood meter
    ├── graveyard-section.tsx   # Similar failures display
    └── pivot-card.tsx          # Clickable pivot suggestions

lib/
├── algolia.ts                  # Algolia v5 search client (frontend)
└── startups.ts                 # Fallback startup data

scripts/
├── upload-to-algolia.js        # Algolia v5 batch upload script
└── process-data.py             # Data processing script
```

### Key Features

1. **Top 5 Startups** - Horizontal scroll showing top startups by `survival_score`
2. **Mega-Failures** - Top 5 graveyard entries sorted by `raised_amount`, with inline `why_they_failed`
3. **Category Pills** - Clickable category filters with startup counts (uses Algolia facets)
4. **Search** - Real-time Algolia search with dropdown, clears on selection
5. **Chat with Metrics** - AI responses parsed for survival probability, market saturation, funding likelihood, graveyard comparisons, pivot suggestions
6. **Survival Tooltip** - ⓘ icon explains what survival score means

### Metric Parsing (Critical Pattern)

The roast interface parses structured data from unstructured AI responses using regex patterns in `parseRoastMetrics()`:

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

This pattern must be maintained when modifying the AI system prompt or response parsing.

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

**Available search functions:**
- `searchStartups(query)` - Search startups index
- `searchGraveyard(query)` - Search graveyard index
- `getTopStartups()` - Get top 5 by survival_score
- `getTopGraveyardEntries()` - Get top 5 by raised_amount
- `getCategories()` - Get category facets with counts
- `searchStartupsByCategory(category)` - Filter by category

**Index settings (configured via `setSettings`):**
- `attributesForFaceting: ['category', 'status', ...]` - Must be configured for facets to work
- `customRanking: ['desc(survival_score)']` - For startups
- `customRanking: ['desc(raised_amount)']` - For graveyard

### AI SDK v6 Patterns

**Message structure (from useChat):**
```typescript
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: Array<{ type: 'text' | 'reasoning'; text?: string }>;
}
```

**Chat with streaming:**
```typescript
const transport = new DefaultChatTransport({ api: '/api/roast' });
const chat = useChat({ transport });
chat.sendMessage({ text: input }); // NOT { parts: [...] }
```

**API route transforms UI format to CoreMessage format:**
```typescript
const transformedMessages = messages.map((msg: any) => {
  if (msg.parts && Array.isArray(msg.parts)) {
    const text = msg.parts
      .filter((p: any) => p.type === 'text')
      .map((p: any) => p.text || '')
      .join('');
    return { role: msg.role, content: text };
  }
  return { role: msg.role, content: msg.content || msg.text || '' };
});
```

**API route response:**
```typescript
const result = streamText({
  model: google('gemini-2.5-flash'),
  system: ROAST_SYSTEM_PROMPT,
  messages: transformedMessages,
  temperature: 0.8,
});
return result.toUIMessageStreamResponse();
```

## Environment Variables

```bash
# Algolia (search - frontend, public)
NEXT_PUBLIC_ALGOLIA_APP_ID=xxx
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=xxx  # Search-only key

# Algolia (admin - for upload script)
ALGOLIA_APPLICATION_ID=xxx
ALGOLIA_ADMIN_API_KEY=xxx           # Admin key with addObject ACL

# Google AI (Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=xxx    # Get from https://aistudio.google.com/app/apikey
```

## Hydration Warnings

The `DynamicBackground` component uses `suppressHydrationWarning` prop to avoid hydration mismatch warnings since canvas only works client-side:

```typescript
<canvas ref={canvasRef} suppressHydrationWarning />
```

## Data Statistics

- Startups index: 2,525 records (YC companies with survival scores)
- Graveyard index: 891 records (failed startups with funding amounts and failure reasons)
- Rich graveyard fields: `what_they_did`, `why_they_failed`, `takeaway`, `raised_amount`, 14 boolean failure flags
- Top funded failures: Faraday Future ($3.5B), Dyson EV ($2.7B), ContextLogic ($1.8B)

## Hackathon Notes

- Deadline: February 8, 2025
- Algolia Agent Studio integration (see `/plans/`)
- Uses Algolia search for both startups and graveyard data
- localStorage for chat persistence (no auth - session only)
