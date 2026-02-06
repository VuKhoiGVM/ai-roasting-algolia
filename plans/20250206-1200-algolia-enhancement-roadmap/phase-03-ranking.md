# Phase 3: Custom Ranking Configuration

**Priority:** P1 (Quick Win - 30 minutes)
**Status:** Pending

## Overview

Configure Algolia ranking attributes to improve result relevance by default. Zero code changes, pure configuration.

## Ranking Strategy

### Default Ranking Order

Algolia applies these in order:

1. **words** - Number of matching words
2. **filters** - Filter matches
3. **typo** - Typo tolerance (fewer typos = better)
4. **geo** - Geographic distance (not used here)
5. **proximity** - How close words are to each other
6. **attribute** - Which attribute matched (name > description)
7. **exact** - Exact vs partial matches
8. **custom** - Our custom ranking below

### Custom Ranking Attributes

```json
{
  "customRanking": [
    "desc(survival_score)",     // Higher survival = higher rank
    "desc(status)",              // Active > inactive
    "desc(is_hiring)",           // Hiring companies = active/growing
    "asc(category)"              // Alphabetical for tie-breaking
  ]
}
```

## Implementation Script

**File:** `scripts/configure-ranking.js` (NEW)

```javascript
const algoliasearch = require('algoliasearch');

const client = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

// Settings for startups index
const STARTUPS_SETTINGS = {
  // Searchable attributes (order matters)
  searchableAttributes: [
    'name',
    'description',
    'long_description',
    'category',
    'sector',
    'tags',
    'batch',
    'location'
  ],

  // Attribute ranking (name matches > description matches)
  ranking: [
    'words',
    'filters',
    'typo',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],

  // Custom ranking (tie-breakers)
  customRanking: [
    'desc(survival_score)',
    'desc(is_hiring)',
    'asc(category)'
  ],

  // Faceting
  attributesForFaceting: [
    'category',
    'status',
    'sector',
    'batch',
    'is_hiring',
    'year_founded'
  ],

  // Highlighting
  attributesToHighlight: [
    'name',
    'description',
    'category'
  ],
  highlightPreTag: '<em>',
  highlightPostTag: '</em>',

  // Snippeting
  attributesToSnippet: [
    'description:50'
  ],

  // Query rules
  enableRules: true,

  // Typo tolerance
  typoTolerance: 'true',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,

  // Pagination
  maxValuesPerFacet: 100,

  // Relevancy
  relevancyStrictness: 50,
  ignorePlurals: true,
  removeStopWords: false,
  distinct: false
};

// Settings for graveyard index
const GRAVEYARD_SETTINGS = {
  searchableAttributes: [
    'name',
    'what_they_did',
    'why_they_failed',
    'takeaway',
    'category',
    'sector'
  ],

  ranking: [
    'words',
    'filters',
    'typo',
    'proximity',
    'attribute',
    'exact',
    'custom'
  ],

  customRanking: [
    'desc(raised_amount)',  // Bigger failures = more interesting
    'desc(year_closed)'
  ],

  attributesForFaceting: [
    'category',
    'sector',
    'year_founded',
    'year_closed',
    'lost_to_giants',
    'no_budget',
    'competition',
    'poor_market_fit',
    'monetization_failure'
  ],

  attributesToHighlight: [
    'name',
    'what_they_did',
    'why_they_failed'
  ],
  highlightPreTag: '<em>',
  highlightPostTag: '</em>',

  attributesToSnippet: [
    'what_they_did:60',
    'why_they_failed:60'
  ],

  enableRules: true,

  typoTolerance: 'true',
  minWordSizefor1Typo: 4,
  minWordSizefor2Typos: 8,
  maxValuesPerFacet: 100,
  ignorePlurals: true
};

async function configureRanking() {
  console.log('Configuring ranking settings...\n');

  // Configure startups index
  console.log('📊 Startups Index:');
  try {
    const task = await client.setSettings({
      indexName: 'startups',
      settings: STARTUPS_SETTINGS
    });
    console.log('✓ Settings updated, taskID:', task.taskID);
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  // Configure graveyard index
  console.log('\n💀 Graveyard Index:');
  try {
    const task = await client.setSettings({
      indexName: 'graveyard',
      settings: GRAVEYARD_SETTINGS
    });
    console.log('✓ Settings updated, taskID:', task.taskID);
  } catch (error) {
    console.error('✗ Failed:', error.message);
  }

  console.log('\nRanking configuration complete!');
  console.log('Wait a few minutes for changes to propagate.');
}

configureRanking().catch(console.error);
```

## Expected Behavior After Configuration

### Startups Index
- Higher survival_score companies rank higher
- Companies that are hiring get boost
- Alphabetical tie-breaking by category

### Graveyard Index
- Companies that raised more money rank higher (bigger failures = more lessons)
- More recent failures (year_closed) rank higher

## Verification

```bash
# Run configuration
ALGOLIA_APPLICATION_ID=xxx ALGOLIA_ADMIN_API_KEY=xxx node scripts/configure-ranking.js

# Test search behavior
# 1. Search generic term - high survival companies should appear first
# 2. Search graveyard - big failures (high raised_amount) first
```

## Acceptance Criteria

- [ ] Both indices configured via script
- [ ] Startups rank by survival_score first
- [ ] Hiring companies get boost
- [ ] Graveyard ranks by raised_amount (biggest failures first)
- [ ] Settings visible in Algolia dashboard
