/**
 * Algolia Query Rules Setup
 *
 * This script sets up query rules for the Startup Roast application.
 * Query rules automatically modify search behavior based on query patterns.
 *
 * Usage:
 *   ALGOLIA_APPLICATION_ID=xxx ALGOLIA_ADMIN_API_KEY=xxx node scripts/setup-query-rules.js
 */

const algoliasearch = require('algoliasearch');

// Get credentials from environment
const appId = process.env.ALGOLIA_APPLICATION_ID || process.env.NEXT_PUBLIC_ALGOLIA_APP_ID;
const apiKey = process.env.ALGOLIA_ADMIN_API_KEY;

if (!appId || !apiKey) {
  console.error('❌ Missing credentials!');
  console.error('Set ALGOLIA_APPLICATION_ID and ALGOLIA_ADMIN_API_KEY environment variables.');
  process.exit(1);
}

// Initialize client with admin API key
const client = algoliasearch(appId, apiKey);

/**
 * Query Rules Configuration
 *
 * Each rule has:
 * - objectID: Unique identifier
 * - enabled: Whether the rule is active
 * - conditions: When to trigger the rule
 * - consequence: What to do when triggered
 * - description: Human-readable description
 */
const RULES = [
  // ===== RULE 1: AI/VC Boost =====
  {
    objectID: 'ai-boost',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:AI,artificial intelligence,machine learning,ML,LLM,GPT,Claude,Gemini,Chatbot,large language model,deep learning}',
      anchoring: 'contains'
    }],
    consequence: {
      params: {
        optionalFilters: [
          'category:Artificial Intelligence<score=3>',
          'category:Machine Learning<score=2>',
          'category:Generative AI<score=2>',
          'category:AI<score=3>'
        ]
      }
    },
    description: 'Boost AI-related startups when searching for AI terms'
  },

  // ===== RULE 2: Failure Query Redirect =====
  {
    objectID: 'failure-redirect',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:failed,dead,died,shutdown,bankrupt,graveyard,collapsed,went under,out of business}',
      anchoring: 'contains'
    }],
    consequence: {
      filterPromotes: false,
      userData: { showGraveyardFirst: true }
    },
    description: 'Show graveyard prominently for failure-related queries'
  },

  // ===== RULE 3: Category Auto-Filter - Fintech =====
  {
    objectID: 'category-fintech',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:fintech,finance,payments,banking,financial,defi,crypto trading}',
      anchoring: 'is'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:Fintech'], ['category:Finance'], ['category:Payments']]
      }
    },
    description: 'Auto-filter fintech category'
  },

  // ===== RULE 4: Category Auto-Filter - Healthcare =====
  {
    objectID: 'category-healthcare',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:healthcare,health,medical,medicine,doctor,hospital,clinic}',
      anchoring: 'is'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:Healthcare'], ['category:Medical'], ['category:Health']]
      }
    },
    description: 'Auto-filter healthcare category'
  },

  // ===== RULE 5: Category Auto-Filter - E-commerce =====
  {
    objectID: 'category-ecommerce',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:ecommerce,e-commerce,online store,marketplace,shopping}',
      anchoring: 'is'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:E-commerce'], ['category:Marketplace'], ['category:Retail']]
      }
    },
    description: 'Auto-filter e-commerce category'
  },

  // ===== RULE 6: Category Auto-Filter - SaaS =====
  {
    objectID: 'category-saas',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:saas,software,platform,b2b software,enterprise software}',
      anchoring: 'contains'
    }],
    consequence: {
      params: {
        automaticFacetFilters: [['category:SaaS'], ['category:B2B'], ['category:Software']]
      }
    },
    description: 'Auto-filter SaaS category'
  },

  // ===== RULE 7: Recent YC Batch Boost =====
  {
    objectID: 'recent-batch-boost',
    enabled: true,
    conditions: [],  // Apply to all queries
    consequence: {
      params: {
        optionalFilters: [
          'batch:W24<score=2>',
          'batch:W23<score=1.5>',
          'batch:W22<score=1>',
          'batch:W21<score=0.5>'
        ]
      }
    },
    description: 'Boost recent YC batches (W21-W24)'
  },

  // ===== RULE 8: Developer Tools Boost =====
  {
    objectID: 'developer-tools-boost',
    enabled: true,
    conditions: [{
      pattern: '{alternatives:developer tools,devtools,api,infrastructure,devops,database}',
      anchoring: 'contains'
    }],
    consequence: {
      params: {
        optionalFilters: [
          'category:Developer Tools<score=3>',
          'category:Infrastructure<score=2>',
          'category:API<score=2>'
        ]
      }
    },
    description: 'Boost developer tools category'
  },
];

/**
 * Clear existing rules (optional - use with caution)
 */
async function clearExistingRules(indexName) {
  console.log(`⚠️  Clearing existing rules from ${indexName}...`);
  try {
    const { rules } = await client.searchRules({ indexName });
    for (const rule of rules) {
      await client.deleteRule({ indexName, objectID: rule.objectID });
    }
    console.log(`✓ Cleared ${rules.length} existing rules`);
  } catch (error) {
    console.log(`No existing rules to clear (or error: ${error.message})`);
  }
}

/**
 * Setup all query rules
 */
async function setupRules() {
  const indexName = 'startups';

  console.log('🔧 Setting up Algolia Query Rules');
  console.log(`📍 App ID: ${appId}`);
  console.log(`📦 Index: ${indexName}`);
  console.log(`📋 Rules to create: ${RULES.length}\n`);

  // Uncomment to clear existing rules first
  // await clearExistingRules(indexName);

  let successCount = 0;
  let failCount = 0;

  for (const rule of RULES) {
    try {
      await client.saveRule({ indexName, objectID: rule.objectID, rule });
      console.log(`✓ "${rule.objectID}" - ${rule.description}`);
      successCount++;
    } catch (error) {
      console.error(`✗ "${rule.objectID}" failed: ${error.message}`);
      failCount++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`📊 Summary: ${successCount} created, ${failCount} failed`);
  console.log(`${'='.repeat(50)}`);
  console.log(`\n🌍 View rules at:`);
  console.log(`https://www.algolia.com/apps/${appId}/search/rules/edit/${indexName}`);
  console.log(`\n💡 Test by searching for:`);
  console.log(`   - "AI healthcare" → AI companies boosted`);
  console.log(`   - "failed companies" → graveyard shown`);
  console.log(`   - "fintech" → auto-filtered`);
  console.log(`   - Recent batches (W24, W23) → boosted`);
}

// Run the setup
setupRules().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
