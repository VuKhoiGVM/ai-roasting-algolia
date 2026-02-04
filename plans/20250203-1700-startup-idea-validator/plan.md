# Startup Roast - Implementation Plan

**Hackathon Deadline:** Feb 8, 2025 (5 days)
**Principle:** KISS - Keep It Simple, Stupid
**Created:** 2025-02-03
**Updated:** 2025-02-03 (Pivot to "Startup Roast")

## Project Overview

**Startup Roast** - An AI Co-founder that gives brutally honest feedback on startup ideas.

**User Flow:**
1. User describes startup idea in natural language
2. AI roasts the idea with brutal honesty
3. Shows survival probability, market saturation, funding likelihood
4. Displays graveyard of similar failed startups
5. Suggests pivots

**MVP Features:**
- Chat interface for idea input
- Brutally honest AI co-founder persona
- Survival probability score (0-100%)
- Market saturation meter (Low/Medium/High)
- Funding likelihood indicator
- Graveyard section with failed similar startups
- Pivot suggestions

## Tech Stack (Latest Versions - Feb 2025)

| Component | Technology | Version |
|-----------|------------|---------|
| Frontend | Next.js | v16.1.5 |
| UI | shadcn/ui + Tailwind CSS | Latest / v4 |
| AI | Vercel AI SDK | v6.0.0-beta.128 |
| AI Provider | Google Gemini | gemini-3-flash-preview |
| Search | Algolia Agent Studio | Latest |
| Data | Python scripts → JSON → Algolia | - |

## Data Requirements (2 Indices)

| Index | Purpose | Fields |
|-------|---------|--------|
| `startups` | Active/successful startups | name, industry, funding, status, description |
| `graveyard` | Failed/acquired startups | name, industry, failure_reason, shutdown_date, raised_amount |

## Phases

| Phase | File | Status | Priority |
|-------|------|--------|----------|
| 01 | [phase-01-setup.md](./phase-01-setup.md) | ✅ Done | P0 |
| 02 | [phase-02-data.md](./phase-02-data.md) | ✅ Done | P0 |
| 03 | [phase-03-algolia.md](./phase-03-algolia.md) | ⏳ Manual | P0 |
| 04 | [phase-04-frontend.md](./phase-04-frontend.md) | ✅ Done | P0 |
| 05 | [phase-05-integration.md](./phase-05-integration.md) | ✅ Done | P0 |

## Phase 01: Project Scaffolding (2 hours)

**Goal:** Ready-to-code Next.js project with shadcn/ui

- Create Next.js 16.1.5 project "startup-roast"
- Install AI SDK v6 + @ai-sdk/react + @ai-sdk/google
- Install shadcn/ui + components (Progress, Slider, Badge, Alert)
- Configure environment variables (include GEMINI_API_KEY)
- Verify project runs

**Output:** Working Next.js app at `localhost:3000`

## Phase 02: Data Collection (4 hours)

**Goal:** Two datasets - successful startups + failed startups

- Active startups dataset (Kaggle/Crunchbase)
- Failed startups graveyard (AutoMat, CB Insights graveyard data)
- Python processing scripts
- Output: `data/startups.json` + `data/graveyard.json`

**Output:** 2 JSON files ready for Algolia

## Phase 03: Algolia + Agent Studio (2 hours)

**Goal:** 2 indices + brutally honest agent

- Create `startups` and `graveyard` indices
- Upload both datasets
- Configure Agent Studio with ROAST persona
- Test /completions endpoint

**Output:** Working AGENT_ID + 2 populated indices

## Phase 04: Frontend (4 hours)

**Goal:** Chat UI + visual metrics

- Chat interface with useChat hook (v6)
- Survival probability component (Progress bar)
- Market saturation meter (Slider visualization)
- Funding likelihood indicator
- Graveyard cards section
- Dark mode aesthetic (startup roast vibe)

**Output:** Full UI at `/roast`

## Phase 05: Integration (4 hours)

**Goal:** Connected MVP with Agent Studio

- API route connecting to Agent Studio
- Parse structured responses (scores, metrics)
- Stream responses with visual updates
- End-to-end testing

**Output:** Working MVP

## Success Criteria

- [ ] User types idea → gets brutally honest roast
- [ ] Survival probability displays (0-100%)
- [ ] Market saturation meter shows competition
- [ ] Funding likelihood indicator
- [ ] Graveyard section shows failed similar startups
- [ ] Pivot suggestions provided
- [ ] Streams responses in real-time
- [ ] Deployed on Vercel

## UI Components Needed

| Component | Purpose |
|-----------|---------|
| Progress | Survival probability bar |
| Badge | Status indicators (High/Low saturation) |
| Card | Graveyard entries |
| Slider | Visual meters |
| Dialog | Pivot suggestions |

## AI Co-founder Persona

```
You are ROAST - a brutally honest AI co-founder. You tell it like it is.
- Be direct, slightly sarcastic, but constructive
- Call out bad ideas immediately
- Reference real data from startup graveyard
- Always provide a survival probability score
- Suggest pivots when the idea is weak
- Use metrics: saturation (0-100%), funding likelihood (0-100%)
```

## LLM Configuration

**Primary Model:** `gemini-3-flash-preview`
- Fast responses (good for chat)
- Free tier friendly
- Sufficient for roasting

**Alternative (for deeper analysis):** `gemini-3-pro-preview`
- Better reasoning
- Use for complex pivot suggestions

## Cut Features (Post-MVP)

- User authentication
- Idea saving/history
- Detailed financial projections
- Investor matching
- Multi-language support

## Timeline

| Day | Phase | Hours |
|-----|-------|-------|
| Feb 3 | Phase 01 + 02 | 6 |
| Feb 4 | Phase 03 | 2 |
| Feb 5 | Phase 04 | 4 |
| Feb 6 | Phase 05 | 4 |
| Feb 7 | Buffer/Testing | 4 |
| Feb 8 | Final Polish | - |

## Unresolved Questions

- [ ] Gemini API key setup for Agent Studio (need to verify compatibility)
- [ ] Graveyard data source (need to confirm CB Insights or alternative)
- [ ] Agent Studio streaming with structured data (scores, metrics)

---

## Audit Findings

**Date:** 2025-02-03
**Status:** All critical issues addressed

### Issues Found and Fixed

#### 1. Incorrect sendMessage API Usage
**Issue:** Using AI SDK v6 syntax `sendMessage({ parts: [{ type: 'text', text: input }] })` which is incorrect.
**Fix:** Changed to `sendMessage({ text: input })` throughout all components.
**Files:** `phase-04-frontend.md` (roast-interface.tsx)

#### 2. Missing Focus Indicators for Accessibility
**Issue:** Interactive elements lacked visible focus indicators for keyboard navigation.
**Fix:** Added `className="focus-visible:ring-2 focus-visible:ring-orange-500"` to:
- All Button components
- All Input components
- Cards with onClick handlers (graveyard cards, landing page feature cards, pivot buttons)
**Files:** `phase-04-frontend.md`

#### 3. Missing Form Attributes on Input
**Issue:** Chat input lacked proper form attributes for accessibility and autocomplete behavior.
**Fix:** Added `name="startup-idea"` and `autoComplete="off"` to the main chat input.
**Files:** `phase-04-frontend.md` (roast-interface.tsx)

#### 4. Non-Memoized Metric Components
**Issue:** Performance-critical components were not memoized, causing unnecessary re-renders.
**Fix:** Converted all metric components to use `memo()`:
- `SurvivalMeter`
- `SaturationMeter`
- `FundingIndicator`
- `GraveyardSection`
- `PivotCard`
**Files:** `phase-04-frontend.md`

#### 5. Missing Error Handling in useChat
**Issue:** No error handling or completion callbacks for the chat hook.
**Fix:** Added `onError` and `onFinish` handlers to `useChat()` configuration.
**Files:** `phase-04-frontend.md` (roast-interface.tsx)

#### 6. Missing Reduced Motion Support
**Issue:** Loading animations continued to animate for users who prefer reduced motion.
**Fix:** Added `motion-reduce:hidden` class to all animated loading indicators and added corresponding CSS to `globals.css`.
**Files:** `phase-04-frontend.md`, `phase-01-setup.md` (globals.css)

#### 7. Missing Next.js Config Optimization
**Issue:** lucide-react icons were not being tree-shaken efficiently.
**Fix:** Created `next.config.ts` with `optimizePackageImports: ['lucide-react']`.
**Files:** `phase-01-setup.md`

#### 8. Missing Color Scheme Attribute
**Issue:** Dark mode styling didn't extend to browser native elements (scrollbars, form controls).
**Fix:** Added `style={{ colorScheme: 'dark' }}` to the html element in layout.tsx.
**Files:** `phase-01-setup.md` (layout.tsx)

### Summary of Changes

| Phase | Fixes Applied |
|-------|---------------|
| Phase 01 | Added `next.config.ts`, updated `layout.tsx` with colorScheme, added reduced motion CSS to `globals.css` |
| Phase 04 | Fixed sendMessage API, added focus-visible rings, memoized all metric components, added error handling, added motion-reduce classes |

### Testing Recommendations

1. **Keyboard Navigation:** Tab through all interactive elements to verify focus indicators appear
2. **Screen Reader:** Verify form inputs have proper labels and roles
3. **Reduced Motion:** Test with `prefers-reduced-motion: reduce` enabled
4. **Error States:** Simulate API failures to verify error handling
5. **Performance:** Verify memoized components don't re-render unnecessarily
