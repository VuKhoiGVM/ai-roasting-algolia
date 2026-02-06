# Phase 4: Agent Studio Tool Calling

**Priority:** P1 (High Impact - 2 hours)
**Status:** Pending

## Overview

Agent Studio has RAG built-in, but we can improve accuracy by defining explicit tools that the AI can call BEFORE generating analysis. This ensures the AI always searches for relevant context.

## Current State

The app uses Agent Studio with a pre-configured prompt. The agent automatically searches both indices (`startups` and `graveyard`) but we can enhance this with explicit tool definitions.

## Multi-Agent Architecture

### Agent Roles

1. **Researcher Agent** - Searches for similar companies and failures
2. **Analyst Agent** - Calculates survival metrics and market analysis
3. **Roaster Agent** - Generates the roast with context from other agents

## Implementation

### Step 1: Define Agent Tools

**File:** `lib/agent-tools.ts` (NEW)

```typescript
import type { Startup, FailedStartup } from './algolia';
import { searchStartups, searchGraveyard, getCategories, getGraveyardCategories } from './algolia';

/**
 * Agent Studio Tool Definitions
 *
 * These tools can be called by the AI agent to gather context before generating responses.
 */

export interface SimilarCompaniesResult {
  query: string;
  startups: Startup[];
  graveyard: FailedStartup[];
  marketSaturation: 'Low' | 'Medium' | 'High';
}

/**
 * Search for similar startups and failed companies
 * This tool helps the AI find relevant context before analyzing
 */
export async function searchSimilarCompanies(
  query: string,
  options?: { category?: string; maxResults?: number }
): Promise<SimilarCompaniesResult> {
  const [startups, graveyard] = await Promise.all([
    searchStartups(query, { category: options?.category, hitsPerPage: options?.maxResults || 10 }),
    searchGraveyard(query)
  ]);

  // Determine market saturation based on results count
  const totalStartups = startups.length;
  const marketSaturation: 'Low' | 'Medium' | 'High' =
    totalStartups > 500 ? 'High' :
    totalStartups > 100 ? 'Medium' : 'Low';

  return {
    query,
    startups: startups.slice(0, 5),  // Top 5 for reference
    graveyard: graveyard.slice(0, 3), // Top 3 failures
    marketSaturation
  };
}

/**
 * Get market context for a specific category
 */
export async function getMarketContext(category: string): Promise<{
  category: string;
  activeStartups: number;
  failedStartups: number;
  saturation: 'Low' | 'Medium' | 'High';
  failureRate: number;
}> {
  const [startups, failures] = await Promise.all([
    searchStartups('', { category, hitsPerPage: 1000 }),
    searchGraveyard(category)
  ]);

  const activeStartups = startups.length;
  const failedStartups = failures.length;
  const saturation: 'Low' | 'Medium' | 'High' =
    activeStartups > 500 ? 'High' :
    activeStartups > 100 ? 'Medium' : 'Low';

  const failureRate = activeStartups > 0
    ? Math.round((failedStartups / (activeStartups + failedStartups)) * 100)
    : 0;

  return {
    category,
    activeStartups,
    failedStartups,
    saturation,
    failureRate
  };
}

/**
 * Get failure patterns for a specific category
 */
export async function getFailurePatterns(category: string): Promise<{
  category: string;
  commonReasons: Array<{ reason: string; count: number }>;
  totalFailures: number;
}> {
  const failures = await searchGraveyard(category);

  const reasonCounts = new Map<string, number>();

  for (const failure of failures) {
    const reasons = failure.why_they_failed || '';
    // Split by common separators
    const parts = reasons.split(/[,;·•]/).map(s => s.trim()).filter(Boolean);

    for (const reason of parts) {
      const key = reason.charAt(0).toUpperCase() + reason.slice(1).toLowerCase();
      reasonCounts.set(key, (reasonCounts.get(key) || 0) + 1);
    }
  }

  const commonReasons = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    category,
    commonReasons,
    totalFailures: failures.length
  };
}

/**
 * Get all available categories for search
 */
export async function getAvailableCategories(): Promise<{
  startupCategories: Array<{ name: string; count: number }>;
  graveyardCategories: Array<{ name: string; count: number }>;
}> {
  const [startupCategories, graveyardCategories] = await Promise.all([
    getCategories(),
    getGraveyardCategories()
  ]);

  return {
    startupCategories: startupCategories.slice(0, 20),
    graveyardCategories: graveyardCategories.slice(0, 20)
  };
}

/**
 * Tool definitions for Agent Studio
 * These can be used to configure Agent Studio's tool calling
 */
export const AGENT_TOOLS = {
  searchSimilarCompanies: {
    name: 'searchSimilarCompanies',
    description: 'Search for similar active startups and failed companies based on a query',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query to find similar companies'
        },
        category: {
          type: 'string',
          description: 'Optional category filter for more targeted results'
        },
        maxResults: {
          type: 'number',
          description: 'Maximum number of results to return (default: 10)'
        }
      },
      required: ['query']
    }
  },

  getMarketContext: {
    name: 'getMarketContext',
    description: 'Get market analysis for a specific category including saturation and failure rate',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The category to analyze'
        }
      },
      required: ['category']
    }
  },

  getFailurePatterns: {
    name: 'getFailurePatterns',
    description: 'Get common failure reasons for a specific category from graveyard data',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'The category to analyze for failure patterns'
        }
      },
      required: ['category']
    }
  },

  getAvailableCategories: {
    name: 'getAvailableCategories',
    description: 'Get list of all available categories in startups and graveyard indices',
    parameters: {
      type: 'object',
      properties: {}
    }
  }
};

/**
 * Execute a tool call by name
 */
export async function executeToolCall(
  toolName: string,
  parameters: Record<string, any>
): Promise<any> {
  switch (toolName) {
    case 'searchSimilarCompanies':
      return await searchSimilarCompanies(
        parameters.query,
        { category: parameters.category, maxResults: parameters.maxResults }
      );

    case 'getMarketContext':
      return await getMarketContext(parameters.category);

    case 'getFailurePatterns':
      return await getFailurePatterns(parameters.category);

    case 'getAvailableCategories':
      return await getAvailableCategories();

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

### Step 2: Create API Endpoint for Tool Execution

**File:** `app/api/agent-tools/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { executeToolCall, AGENT_TOOLS } from '@/lib/agent-tools';

export async function POST(request: NextRequest) {
  try {
    const { toolName, parameters } = await request.json();

    if (!toolName) {
      return NextResponse.json(
        { error: 'toolName is required' },
        { status: 400 }
      );
    }

    const result = await executeToolCall(toolName, parameters || {});

    return NextResponse.json({
      toolName,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Tool execution error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET returns available tool definitions
export async function GET() {
  return NextResponse.json({
    tools: AGENT_TOOLS
  });
}
```

### Step 3: Agent Studio Prompt Enhancement

Update the Agent Studio prompt to include tool instructions:

```
IMPORTANT - Tools Available:

You have access to search tools that help you provide better analysis:

1. searchSimilarCompanies(query, category?) - Find similar startups and failures
2. getMarketContext(category) - Get market saturation and failure rates
3. getFailurePatterns(category) - Get common failure reasons from graveyard
4. getAvailableCategories() - List all available categories

**Before analyzing any startup idea:**
1. Search for similar companies using searchSimilarCompanies
2. Get market context for the relevant category
3. Check failure patterns in that category
4. Reference specific found companies in your analysis

**Response Format:**
Always include:
- **Survival Probability: X%** (Based on similar companies' survival scores)
- **Market Saturation: [Low/Medium/High]** (From market context)
- **Funding Likelihood: X%** (Based on category trends)
- **💀 The Graveyard:** 2-3 similar companies that failed with reasons
- **🔄 Pivot Suggestions:** 2-3 specific pivot ideas based on failure patterns
- **The Roast:** Your honest analysis

**Example:**
User: "AI-powered SaaS for healthcare"

You should:
1. Search for "AI healthcare SaaS"
2. Get market context for "Healthcare AI" or similar
3. Check failure patterns in healthcare
4. Reference specific companies in your response
```

## Verification

```bash
# Test tool endpoint
curl -X POST http://localhost:3000/api/agent-tools \
  -H "Content-Type: application/json" \
  -d '{"toolName":"searchSimilarCompanies","parameters":{"query":"AI healthcare"}}'

# Test market context
curl -X POST http://localhost:3000/api/agent-tools \
  -H "Content-Type: application/json" \
  -d '{"toolName":"getMarketContext","parameters":{"category":"Fintech"}}'
```

## Acceptance Criteria

- [ ] `lib/agent-tools.ts` exports all tool functions
- [ ] `/api/agent-tools` POST endpoint executes tools
- [ ] `/api/agent-tools` GET endpoint returns tool definitions
- [ ] Agent Studio prompt updated with tool instructions
- [ ] AI responses reference specific found companies
- [ ] Market context includes saturation level
- [ ] Failure patterns mention specific graveyard entries
