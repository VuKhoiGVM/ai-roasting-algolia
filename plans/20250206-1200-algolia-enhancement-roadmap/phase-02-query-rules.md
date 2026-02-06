# Phase 2: Algolia Query Rules

**Priority:** P0 (Quick Win - 1 hour)
**Status:** Pending

## Overview

Query rules automatically modify search behavior based on query patterns. Zero UI code changes, immediate impact on search relevance.

## Rules to Implement

### Rule 1: AI/VC Query Auto-Boost

**Purpose:** When users search for AI-related terms, boost AI companies to top results.

```javascript
{
  "objectID": "ai-boost",
  "enabled": true,
  "conditions": [{
    "pattern": "{alternatives:AI,artificial intelligence,machine learning,ML,LLM,GPT,Claude,Gemini,Chatbot}",
    "anchoring": "contains"
  }],
  "consequence": {
    "params": {
      "automaticFacetFilters": [["category:AI"], ["category:Machine Learning"]],
      "optionalFilters": ["category:AI<score=3>", "category:Machine Learning<score=2>"]
    }
  },
  "description": "Boost AI-related startups when searching for AI terms"
}
```

### Rule 2: Failure Query Redirect

**Purpose:** When users search for failure-related terms, show graveyard results prominently.

```javascript
{
  "objectID": "failure-redirect",
  "enabled": true,
  "conditions": [{
    "pattern": "{alternatives:failed,dead,died,shutdown,bankrupt,graveyard,collapsed,went under}",
    "anchoring": "contains"
  }],
  "consequence": {
    "filterPromotes": false,
    "userData": {
      "showGraveyardFirst": true
    },
    "params": {
      "automaticFacetFilters": [["index:graveyard"]]
    }
  },
  "description": "Prioritize graveyard results for failure queries"
}
```

### Rule 3: Category Auto-Filter

**Purpose:** Direct category searches to filtered views.

```javascript
// Fintech
{
  "objectID": "category-fintech",
  "enabled": true,
  "conditions": [{
    "pattern": "{alternatives:fintech,finance,payments,banking,financial}",
    "anchoring": "is"
  }],
  "consequence": {
    "filterPromotes": false,
    "params": {
      "automaticFacetFilters": [["category:Fintech"], ["category:Finance"], ["category:Payments"]]
    }
  }
}

// Healthcare
{
  "objectID": "category-healthcare",
  "enabled": true,
  "conditions": [{
    "pattern": "{alternatives:healthcare,health,medical,medicine,doctor,hospital}",
    "anchoring": "is"
  }],
  "consequence": {
    "params": {
      "automaticFacetFilters": [["category:Healthcare"], ["category:Medical"], ["category:Health"]]
    }
  }
}
```

### Rule 4: YC Batch Boost

**Purpose:** Recent YC batches get boosted (more relevant to current trends).

```javascript
{
  "objectID": "recent-batch-boost",
  "enabled": true,
  "conditions": [],  // Apply to all queries
  "consequence": {
    "params": {
      "optionalFilters": [
        "batch:W24<score=2>",
        "batch:W23<score=1.5>",
        "batch:W22<score=1>"
      ]
    }
  },
  "description": "Boost recent YC batches"
}
```

## Implementation Script

**File:** `scripts/setup-query-rules.js` (NEW)

```javascript
const algoliasearch = require('algoliasearch');

// Use admin API key for rules
const client = algoliasearch(
  process.env.ALGOLIA_APPLICATION_ID,
  process.env.ALGOLIA_ADMIN_API_KEY
);

const RULES = [
  // AI/VC Boost
  {
    objectID: 'ai-boost',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:AI,artificial intelligence,machine learning,ML,LLM,GPT,Claude,Gemini,Chatbot,large language model}',
      anchoring: 'contains'
    }],
    consequence: {
      params: {
        optionalFilters: ['category:AI<score=3>', 'category:Machine Learning<score=2>']
      }
    },
    description: 'Boost AI-related startups'
  },

  // Failure Redirect
  {
    objectID: 'failure-redirect',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:failed,dead,died,shutdown,bankrupt,graveyard,collapsed}',
      anchoring: 'contains'
    }],
    consequence: {
      filterPromotes: false,
      userData: { showGraveyardFirst: true }
    },
    description: 'Show graveyard for failure queries'
  },

  // Category: Fintech
  {
    objectID: 'category-fintech',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:fintech,finance,payments,banking}',
      anchoring: 'is'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:Fintech'], ['category:Finance'], ['category:Payments']]
      }
    },
    description: 'Auto-filter fintech category'
  },

  // Category: Healthcare
  {
    objectID: 'category-healthcare',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:healthcare,health,medical,medicine}',
      anchoring: 'is'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:Healthcare'], ['category:Medical']]
      }
    },
    description: 'Auto-filter healthcare category'
  },

  // Recent Batch Boost
  {
    objectID: 'recent-batch-boost',
    enabled: true,
    conditions: [],
    consequence: {
      params: {
        optionalFilters: [
          'batch:W24<score=2>',
          'batch:W23<score=1.5>',
          'batch:W22<score=1>'
        ]
      }
    },
    description: 'Boost recent YC batches'
  },
];

async function setupRules() {
  const indexName = 'startups';

  console.log(`Setting up ${RULES.length} rules for index: ${indexName}`);

  for (const rule of RULES) {
    try {
      await client.saveRule({ indexName, objectID: rule.objectID, rule });
      console.log(`✓ Rule "${rule.objectID}" created`);
    } catch (error) {
      console.error(`✗ Rule "${rule.objectID}" failed:`, error.message);
    }
  }

  console.log('\nRules setup complete!');
  console.log('View at: https://www.algolia.com/apps/' + process.env.ALGOLIA_APPLICATION_ID + '/search/rules');
}

setupRules().catch(console.error);
```

## Usage

```bash
# Run with admin credentials
ALGOLIA_APPLICATION_ID=xxx ALGOLIA_ADMIN_API_KEY=xxx node scripts/setup-query-rules.js
```

## Verification

1. **Test AI boost:** Search "AI startup for healthcare" → AI companies should appear first
2. **Test failure redirect:** Search "companies that failed" → Graveyard results prominent
3. **Test category filter:** Search "fintech" → Only fintech companies shown

## Acceptance Criteria

- [ ] All 5 rules created via script
- [ ] AI queries boost AI companies to top 3 results
- [ ] Failure queries show graveyard prominently
- [ ] Category queries auto-filter correctly
- [ ] Recent batches (W24, W23) get ranking boost
