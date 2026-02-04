# Plan: Simplified User Flow & UI Improvements

**Date:** 2025-02-04
**Status:** Planning
**Priority:** High (Hackathon Deadline: Feb 8, 2025)

---

## Overview
Simplify the user experience by removing the separate `/roast` page and consolidating all functionality into a single-page interface. Reduce cognitive load and make features more discoverable.

---

## Requirements Breakdown

### 1. Show Top 5 Target Startups on Homepage
**Current:** Search only, no pre-selected startups shown
**Target:** Display 5 interesting/trending startups at page load

**Implementation:**
- Add new Algolia search function `getTopStartups()` with filters/facets
- Sort by: survival_score OR manual curation
- Display in a horizontal scroll or grid section
- Each card: name, description, category, survival_score badge

**Files:**
- `lib/algolia.ts` - Add `getTopStartups()` function
- `app/page.tsx` - Add `TopStartupsSection` component

---

### 2. Show Top 5 Startup Graveyard (Highest Funding)
**Current:** Random 6 graveyard entries, no funding sort
**Target:** Top 5 by raised_amount with failure reasons

**Data found:**
- Babylon Health: $635M - Overexpansion and losses
- Cue Health: $404M - Post-COVID crash
- CareZone: $161M - Lost to free tools
- Augmedix: $150M - Lost to software rivals
- Quibi (add): $1.75B - Failed to gain traction

**Implementation:**
- Add `getTopGraveyardEntries()` function, sort by `raised_amount` desc
- Display in prominent "💀 Mega-Failures" section
- Each card: name, funding amount, failure reason (prominent)

**Files:**
- `lib/algolia.ts` - Add `getTopGraveyardEntries()` function
- `app/page.tsx` - Update graveyard section

---

### 3. Remove Full Roast Mode
**Current:** Separate `/roast` page, "Full Roast Mode" button
**Target:** All chat functionality on landing page

**Implementation:**
- Delete `app/roast/page.tsx` and related components
- Move metric components (`survival-meter.tsx`, etc.) to main components
- Update navigation - remove roast link
- Ensure landing page chat handles all roast responses with metrics

**Files:**
- DELETE: `app/roast/` directory
- MOVE: `app/roast/*.tsx` → `components/metrics/`

---

### 4. Show All Categories
**Current:** No category browsing
**Target:** Category filter/chip list for easy discovery

**Categories (top 15+):**
Artificial Intelligence, Fintech, SaaS, Developer Tools, Generative AI, B2B, Marketplace, AIOps, Machine Learning, Health Tech, Consumer, Education, E-commerce, Hardware, Robotics

**Implementation:**
- Add category pills/chips below search bar
- Clicking filters startups by that category
- Show count for each category
- "All" option to reset filter

**Files:**
- `lib/algolia.ts` - Add `searchStartupsByCategory()` function
- `components/category-pills.tsx` - New component
- `app/page.tsx` - Add category filter state

---

### 5. Remove Search Text After Click
**Current:** Search text stays after clicking a result
**Target:** Clear search input and hide dropdown after selection

**Implementation:**
- In `startup-search.tsx` `handleSelect()`:
  - Set `setQuery("")` instead of `setQuery(startup.name)`
  - Call `setIsOpen(false)`
  - Optional: Show brief "Selected: {name}" toast

**Files:**
- `components/startup-search.tsx`

---

### 6. Explain Survival Score
**Current:** Score displayed with no explanation
**Target:** Tooltip or info icon explaining the metric

**Content:**
```
Survival Score: AI-calculated probability (0-100%) of startup success
based on market conditions, competition, funding trends, and
historical data from 21K+ failed startups.
```

**Implementation:**
- Add info icon (ⓘ) next to survival score badges
- Show tooltip on hover/click
- Add to empty state or help section

**Files:**
- `components/startup-card.tsx` - Add info tooltip
- `components/survival-meter.tsx` - Add explanation
- CSS: Add tooltip styles

---

### 7. Debug Chat Issues
**Current:** Unknown bugs when chatting with model
**Target:** Verify Algolia Agent Studio integration and fix bugs

**Investigation Areas:**
- [ ] Check `GEMINI_API_KEY` is valid and has quota
- [ ] Test `/api/roast` endpoint directly (curl/Postman)
- [ ] Verify AI SDK v6 streaming is working
- [ ] Check browser console for client-side errors
- [ ] Verify Algolia indices are accessible
- [ ] Test message parsing in `parseRoastMetrics()`

**Potential Issues:**
- Stream interruption from CORS
- Response format mismatch
- localStorage quota exceeded
- AI rate limiting

**Files:**
- `app/api/roast/route.ts` - Add error logging
- Test with actual API calls

---

## Implementation Order

1. **Phase 1: Data Layer** (30 min)
   - Add `getTopStartups()` to Algolia client
   - Add `getTopGraveyardEntries()` with funding sort
   - Add `searchStartupsByCategory()` for category filtering

2. **Phase 2: Component Updates** (45 min)
   - Create `TopStartupsSection` component
   - Update graveyard section with funding display
   - Create `CategoryPills` component
   - Add survival score tooltip

3. **Phase 3: Page Consolidation** (30 min)
   - Move metric components to `/components/metrics/`
   - Delete `/roast` page
   - Update navigation

4. **Phase 4: Bug Fixes** (30 min)
   - Fix search input clearing
   - Debug and test chat functionality
   - Add error logging

**Total Time Estimate:** ~2.5 hours

---

## Files to Create

| File | Purpose |
|------|---------|
| `components/top-startups-section.tsx` | Top 5 startups display |
| `components/category-pills.tsx` | Category filter chips |
| `components/survival-tooltip.tsx` | Reusable survival score explainer |
| `components/metrics/survival-meter.tsx` | Moved from roast page |
| `components/metrics/saturation-meter.tsx` | Moved from roast page |
| `components/metrics/funding-indicator.tsx` | Moved from roast page |

## Files to Modify

| File | Changes |
|------|---------|
| `lib/algolia.ts` | Add new search functions |
| `app/page.tsx` | Add sections, remove roast link |
| `components/startup-search.tsx` | Clear input on select |
| `components/startup-card.tsx` | Add survival tooltip |

## Files to Delete

| File | Reason |
|------|---------|
| `app/roast/page.tsx` | Consolidating to main page |
| `app/roast/survival-meter.tsx` | Moving to components |
| `app/roast/saturation-meter.tsx` | Moving to components |
| `app/roast/funding-indicator.tsx` | Moving to components |
| `app/roast/graveyard-section.tsx` | Moving to components |
| `app/roast/pivot-card.tsx` | Moving to components |

---

## Open Questions

1. Should categories be clickable filters or just visual navigation?
2. Should Top Startups be manually curated or algorithmically selected?
3. Do we keep the graveyard modal or show inline details?
4. Should survival score explanation be a modal or simple tooltip?

---

## Success Criteria

- [ ] Single-page application (no /roast route)
- [ ] Top 5 startups displayed on load
- [ ] Top 5 graveyard entries (by funding) displayed
- [ ] All 15+ categories browsable
- [ ] Search clears after selection
- [ ] Survival score has explanation
- [ ] Chat works without errors
- [ ] Build passes (`npm run build`)
