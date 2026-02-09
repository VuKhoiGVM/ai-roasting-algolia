# DEV.to Submission Post

*This is a submission for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia): Consumer-Facing Conversational Experiences*

---

## What I Built

**Startup Roast** is an AI-powered startup idea validator that provides brutally honest feedback by analyzing your idea against a database of **2,525+ real YC startups** and **403+ failed companies**.

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

[![Watch the 60-second demo](https://img.youtube.com/vi/TuSimU_864U/0.jpg)](https://www.youtube.com/watch?v=TuSimU_864U)

**Repository:** https://github.com/yourusername/startup-roast

---

## How I Used Algolia Agent Studio

### Data Indexed

I created two Algolia indices:

1. **startups** (2,525 records) - YC companies with survival scores
2. **graveyard** (403 records) - Failed startups with detailed failure reasons

Each record contains rich metadata:
- Company name, description, category, batch
- Survival score breakdown (growth, market, team, funding, trend)
- Funding amounts, hiring status, saturation levels
- For graveyard: what they did, why they failed, key takeaways

### Agent Configuration

In Algolia Agent Studio, I configured:

**Tools:** Both indices enabled for retrieval
- `startups` index search
- `graveyard` index search

**LLM:** Google Gemini 2.0 Flash for fast, intelligent responses

**System Prompt:** Engineered to return structured data with specific formatting for parsing:

```
You are Startup Roast - a brutally honest startup advisor. Analyze ideas against real data.

Your response must follow this exact format:

**Survival Probability:** X%
**Market Saturation:** [Low/Medium/High]
**Funding Likelihood:** X%

**💀 The Graveyard (similar failures):**
- [Company Name]: [brief failure reason]

**🔄 Pivot Suggestions:**
- [Specific pivot idea with reasoning]

**The Roast:**
[Brutally honest analysis with specific references to similar companies. Be direct but constructive.]
```

This structured output allows the frontend to parse and display visual metrics cards separately from the conversational roast text.

### Frontend Integration

Using Vercel AI SDK v6 with direct Agent Studio transport:

```typescript
import { DefaultChatTransport } from "ai"

const transport = new DefaultChatTransport({
  api: `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?compatibilityMode=ai-sdk-5`,
  headers: {
    "x-algolia-application-id": appId,
    "x-algolia-api-key": searchKey,
  },
})

const chat = useChat({ transport })
```

The frontend parses the structured AI response and renders:
- Progress bars for survival probability and funding likelihood
- Color-coded saturation meter
- Graveyard cards with failure reasons
- Clickable pivot suggestion chips

### Why This Approach

Instead of building a custom RAG pipeline with vector search and prompt engineering, Algolia Agent Studio gave me:
- **Instant retrieval** - keyword and semantic search in one API
- **Grounded responses** - AI cites actual companies, not hallucinations
- **Structured output** - parseable metrics without complex prompt engineering
- **Zero infrastructure** - no vector database, no embedding API, no backend needed

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

**Algolia:** Retrieves 30+ relevant companies instantly, identifies proper competitors, provides specific competitive analysis with real company names and their outcomes

This speed allows users to iterate quickly - try an idea, get feedback, pivot, try again. In one session, a user might explore 5-6 variations of their concept. Each exploration compounds their understanding of the market.

---

## Tech Stack

- **Frontend:** Next.js 16.1.6 (App Router + Turbopack), React 19
- **AI:** Algolia Agent Studio, Vercel AI SDK v6, Google Gemini 2.0 Flash
- **Search:** Algolia JavaScript SDK v5.35.0
- **Styling:** Tailwind CSS v4, shadcn/ui
- **Data:** 2,525 YC startups + 403 failed companies

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
