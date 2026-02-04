# Phase 03: Algolia + Agent Studio Setup

**Status:** Pending
**Estimated:** 2 hours
**Dependencies:** Phase 02

## Goal

Create 2 Algolia indices (startups + graveyard) + configure ROAST agent with brutal honesty.

## Prerequisites

- Algolia account (free tier works)
- `data/startups.json` from Phase 02
- `data/graveyard.json` from Phase 02
- Environment variables ready

## Tasks

### 3.1 Install Algolia Dependencies

```bash
npm install algoliasearch
```

### 3.2 Create Upload Script (Both Indices)

Create `scripts/upload-to-algolia.js`:

```javascript
require('dotenv').config({ path: '.env.local' });
const algoliasearch = require('algoliasearch');
const fs = require('fs');
const path = require('path');

const { ALGOLIA_APPLICATION_ID, ALGOLIA_ADMIN_API_KEY } = process.env;

if (!ALGOLIA_APPLICATION_ID || !ALGOLIA_ADMIN_API_KEY) {
  console.error('Missing Algolia credentials in .env.local');
  process.exit(1);
}

const client = algoliasearch(ALGOLIA_APPLICATION_ID, ALGOLIA_ADMIN_API_KEY);

async function uploadIndex(indexName, jsonPath, searchableAttrs, facets) {
  const index = client.initIndex(indexName);
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

  console.log(`\nUploading ${data.length} records to ${indexName}...`);

  await index.clearObjects();
  console.log(`Cleared existing records from ${indexName}`);

  const batchSize = 1000;
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    await index.saveObjects(batch);
    console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1} to ${indexName}`);
  }

  await index.setSettings({
    searchableAttributes: searchableAttrs,
    attributesForFaceting: facets,
  });

  console.log(`✓ ${indexName} upload complete!`);
}

async function main() {
  // Upload startups index
  await uploadIndex(
    'startups',
    path.join(__dirname, '../data/startups.json'),
    ['name', 'description', 'tags', 'industry', 'sector'],
    ['industry', 'sector', 'status', 'tags']
  );

  // Upload graveyard index
  await uploadIndex(
    'graveyard',
    path.join(__dirname, '../data/graveyard.json'),
    ['name', 'failure_reason', 'tags', 'industry'],
    ['industry', 'tags']
  );

  console.log('\n✓ All indices uploaded!');
}

main().catch(console.error);
```

Run:

```bash
node scripts/upload-to-algolia.js
```

### 3.3 Create ROAST Agent in Agent Studio

1. Go to [Algolia Agent Studio](https://www.algolia.com/agent-studio)
2. Click "Create Agent"

**Agent Settings:**
- Name: `Startup Roast`
- Description: "Brutally honest AI co-founder that roasts startup ideas"

**Data Sources (Add both):**
- Index 1: `startups` (for competition analysis)
- Index 2: `graveyard` (for failed startup examples)

**Instructions (System Prompt) - CRITICAL:**
```
You are ROAST - a brutally honest AI co-founder. Your job is to tell entrepreneurs the hard truth about their startup ideas.

BRUTAL HONESTY RULES:
- Be direct, slightly sarcastic, but ultimately constructive
- Call out obvious bad ideas immediately
- Don't sugarcoat failure risks
- Use real data from our startup graveyard
- Reference failed companies that tried similar things

ANALYSIS REQUIREMENTS:
For each idea, you MUST provide:
1. Survival Probability: 0-100% (be realistic, not optimistic)
2. Market Saturation: Low/Medium/High with competition count
3. Funding Likelihood: 0-100% based on current investor trends
4. Similar Failed Startups: Search graveyard and list 2-3
5. Pivot Suggestions: If the idea is weak, suggest concrete pivots

RESPONSE FORMAT:
Start with the brutal truth. Then provide metrics in this structure:

**Survival Probability: X%**
**Market Saturation: [Low/Medium/High]**
**Funding Likelihood: X%**

**💀 The Graveyard (similar failures):**
- [Company Name]: [Brief failure reason]

**🔄 Pivot Suggestions:**
- [Concrete pivot idea 1]
- [Concrete pivot idea 2]

**The Roast:**
[Your brutally honest analysis here]

Always search BOTH indices (startups for competition, graveyard for failures).
```

**LLM Provider:**
- Select: Gemini (free tier) or OpenAI
- Configure API key

4. Save agent and copy `AGENT_ID`

### 3.4 Test Agent Studio Endpoint

Create `scripts/test-agent.js`:

```javascript
require('dotenv').config({ path: '.env.local' });

const { ALGOLIA_APPLICATION_ID, ALGOLIA_SEARCH_API_KEY, ALGOLIA_AGENT_ID } = process.env;

async function testAgent() {
  const response = await fetch(
    `https://${ALGOLIA_APPLICATION_ID}.algolia.net/agent-studio/1/agents/${ALGOLIA_AGENT_ID}/completions?stream=true`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-ID': ALGOLIA_APPLICATION_ID,
        'X-Algolia-API-Key': ALGOLIA_SEARCH_API_KEY,
      },
      body: JSON.stringify({
        message: 'I want to build a pet sitting app',
      }),
    }
  );

  console.log('Status:', response.status);

  if (response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      process.stdout.write(decoder.decode(value));
    }
  }
}

testAgent().catch(console.error);
```

Run:

```bash
node scripts/test-agent.js
```

Expected response (streamed):
```
**Survival Probability: 15%**
**Market Saturation: High**
**Funding Likelihood: 5%**

**💀 The Graveyard:**
- Rover (struggling with low margins)
- Wag (pivoted multiple times)

**The Roast:**
Another pet app? Really? There are 500+ pet sitting startups...
```

### 3.5 Configure Environment Variables

Update `.env.local`:

```env
# Algolia
ALGOLIA_APPLICATION_ID=your_app_id
ALGOLIA_SEARCH_API_KEY=your_search_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key
ALGOLIA_AGENT_ID=your_agent_id

# Gemini (free tier)
GEMINI_API_KEY=your_gemini_key
```

### 3.6 Create Algolia Helper

Create `lib/algolia.ts`:

```typescript
import algoliasearch from 'algoliasearch';

export function getAlgoliaClient() {
  const appId = process.env.ALGOLIA_APPLICATION_ID;
  const apiKey = process.env.ALGOLIA_SEARCH_API_KEY;

  if (!appId || !apiKey) {
    throw new Error('Missing Algolia credentials');
  }

  return algoliasearch(appId, apiKey);
}

export function getAgentId(): string {
  const agentId = process.env.ALGOLIA_AGENT_ID;
  if (!agentId) {
    throw new Error('Missing ALGOLIA_AGENT_ID');
  }
  return agentId;
}

export function getAppId(): string {
  const appId = process.env.ALGOLIA_APPLICATION_ID;
  if (!appId) {
    throw new Error('Missing ALGOLIA_APPLICATION_ID');
  }
  return appId;
}
```

## Completion Checklist

- [ ] `startups` index created and populated
- [ ] `graveyard` index created and populated
- [ ] ROAST agent configured with brutal prompt
- [ ] Agent ID saved to .env.local
- [ ] `/completions` endpoint tested successfully
- [ ] Streaming response verified
- [ ] Both indices searchable by agent

## Agent Studio Flow

```
User Idea → /api/roast → Agent Studio /completions
                              ↓
                    Search BOTH indices:
                    - startups (competition)
                    - graveyard (failures)
                              ↓
                    LLM generates brutal roast
                              ↓
                    Stream structured response
                              ↓
                    Parse metrics + display UI
```

## Expected Agent Response Structure

The agent should return responses with these sections:
- **Survival Probability**: 0-100%
- **Market Saturation**: Low/Medium/High
- **Funding Likelihood**: 0-100%
- **Graveyard**: List of failed startups
- **Pivot Suggestions**: Concrete alternatives
- **The Roast**: Brutal analysis

## Next Phase

[Phase 04: Frontend with Visual Metrics](./phase-04-frontend.md)
