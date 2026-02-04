# Phase 05: End-to-End Integration

**Status:** Pending
**Estimated:** 4 hours
**Dependencies:** Phase 01-04

## Goal

Connect frontend to Algolia Agent Studio, parse structured responses (scores, metrics), deploy to Vercel.

## Tasks

### 5.1 Create Algolia Chat Library

Create `lib/roast-chat.ts`:

```typescript
import { getAppId, getAgentId } from './algolia';

interface RoastStreamOptions {
  onText: (text: string) => void;
  onMetrics: (metrics: any) => void;
  onError: (error: Error) => void;
  onComplete: () => void;
}

export async function streamRoast(
  userMessage: string,
  options: RoastStreamOptions
) {
  const { onText, onMetrics, onError, onComplete } = options;
  const appId = getAppId();
  const agentId = getAgentId();

  try {
    const response = await fetch(
      `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?stream=true`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Algolia-Application-ID': appId,
          'X-Algolia-API-Key': process.env.ALGOLIA_SEARCH_API_KEY!,
        },
        body: JSON.stringify({ message: userMessage }),
      }
    );

    if (!response.ok) {
      throw new Error(`Algolia error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n').filter(Boolean);

      for (const line of lines) {
        try {
          const data = JSON.parse(line);

          // Handle streaming text
          if (data.content || data.text) {
            fullText += data.content || data.text;
            onText(fullText);
          }

          // Handle Agent Studio specific format
          if (data.completion) {
            fullText = data.completion;
            onText(fullText);
          }
        } catch (e) {
          // Non-JSON line, append as text
          fullText += line;
          onText(fullText);
        }
      }
    }

    // Parse metrics from the response
    const metrics = parseRoastMetrics(fullText);
    if (metrics) {
      onMetrics(metrics);
    }

    onComplete();
  } catch (error) {
    onError(error as Error);
  }
}

// Parse metrics from AI response using regex
function parseRoastMetrics(text: string) {
  // Extract Survival Probability
  const survivalMatch = text.match(/\*\*Survival Probability:\s*(\d+)%?\*\*/i);
  const survivalProbability = survivalMatch ? parseInt(survivalMatch[1]) : null;

  // Extract Market Saturation
  const saturationMatch = text.match(/\*\*Market Saturation:\s*(Low|Medium|High)\*\*/i);
  const marketSaturation = saturationMatch ? saturationMatch[1] : null;

  // Extract Funding Likelihood
  const fundingMatch = text.match(/\*\*Funding Likelihood:\s*(\d+)%?\*\*/i);
  const fundingLikelihood = fundingMatch ? parseInt(fundingMatch[1]) : null;

  // Extract Graveyard entries
  const graveyardEntries: any[] = [];
  const graveyardSection = text.match(/\*\*💀\s*The Graveyard[^*]*\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (graveyardSection) {
    const lines = graveyardSection[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/-\s*([^:]+):\s*(.+)/);
      if (match) {
        graveyardEntries.push({
          name: match[1].trim(),
          failure_reason: match[2].trim(),
        });
      }
    }
  }

  // Extract Pivot Suggestions
  const pivots: string[] = [];
  const pivotSection = text.match(/\*\*🔄\s*Pivot Suggestions[^*]*\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (pivotSection) {
    const lines = pivotSection[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const match = line.match(/-\s*(.+)/);
      if (match) {
        pivots.push(match[1].trim());
      }
    }
  }

  // Only return metrics if we found at least one
  if (!survivalProbability && !marketSaturation && !fundingLikelihood) {
    return null;
  }

  return {
    survivalProbability: survivalProbability ?? 50,
    marketSaturation: marketSaturation ?? 'Medium',
    fundingLikelihood: fundingLikelihood ?? 50,
    graveyard: graveyardEntries,
    pivots,
    roast: text,
  };
}
```

### 5.2 Create API Route

Create `app/api/roast/route.ts`:

```typescript
import { NextRequest } from 'next/server';
import { streamText } from 'ai';

// Using Vercel AI SDK for streaming
export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  // Get last user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== 'user') {
    return new Response('Expected user message', { status: 400 });
  }

  const userMessage = lastMessage.content;

  // Call Agent Studio
  const appId = process.env.ALGOLIA_APPLICATION_ID!;
  const agentId = process.env.ALGOLIA_AGENT_ID!;

  const response = await fetch(
    `https://${appId}.algolia.net/agent-studio/1/agents/${agentId}/completions?stream=true&compatibilityMode=ai-sdk-4`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Algolia-Application-ID': appId,
        'X-Algolia-API-Key': process.env.ALGOLIA_SEARCH_API_KEY!,
      },
      body: JSON.stringify({ message: userMessage }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Agent Studio error:', error);
    return new Response(JSON.stringify({ error: 'Failed to get roast' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Stream the response
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 5.3 Update Roast Interface with Metrics Parsing

Update `components/roast-interface.tsx`:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { SurvivalMeter } from './survival-meter';
import { SaturationMeter } from './saturation-meter';
import { FundingIndicator } from './funding-indicator';
import { GraveyardSection } from './graveyard-section';
import { PivotCard } from './pivot-card';
import { Message, RoastResponse } from '@/types';
import { useEffect, useState } from 'react';

export function RoastInterface() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/roast',
  });

  // Parse metrics from assistant messages
  const messagesWithMetrics = messages.map((msg) => {
    if (msg.role === 'assistant') {
      const metrics = parseRoastMetrics(msg.content);
      return { ...msg, metrics };
    }
    return msg;
  });

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b px-6 py-4 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
              Startup Roast
            </h1>
            <p className="text-sm text-muted-foreground">
              Brutally honest AI co-founder
            </p>
          </div>
          <Badge variant="outline" className="border-orange-500/50 text-orange-500">
            🔥 Roast Mode
          </Badge>
        </div>
      </header>

      {/* Messages */}
      <ScrollArea className="flex-1 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <p className="text-2xl font-bold mb-2">Tell me your startup idea...</p>
              <p className="text-muted-foreground">
                I'll be brutally honest. Can you handle the truth?
              </p>
            </div>
          )}

          {messagesWithMetrics.map((message) => (
            <MessageBubble key={message.id} message={message as Message} />
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-500">
                🔥
              </Avatar>
              <Card className="px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce bg-muted-foreground rounded-full" />
                  <span className="h-2 w-2 animate-bounce bg-muted-foreground rounded-full delay-100" />
                  <span className="h-2 w-2 animate-bounce bg-muted-foreground rounded-full delay-200" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t p-4 bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Describe your startup idea..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-gradient-to-r from-orange-500 to-red-500">
            Roast It 🔥
          </Button>
        </div>
      </form>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <Card className="px-4 py-3 max-w-[80%] bg-primary text-primary-foreground">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </Card>
      </div>
    );
  }

  // Assistant message with metrics
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-500 shrink-0">
          🔥
        </Avatar>
        <Card className="px-4 py-3 flex-1">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </Card>
      </div>

      {/* Metrics Section */}
      {message.metrics && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4 space-y-4">
            <SurvivalMeter probability={message.metrics.survivalProbability} />
            <SaturationMeter saturation={message.metrics.marketSaturation} />
            <FundingIndicator likelihood={message.metrics.fundingLikelihood} />

            {message.metrics.graveyard?.length > 0 && (
              <GraveyardSection entries={message.metrics.graveyard} />
            )}

            {message.metrics.pivots?.length > 0 && (
              <PivotCard pivots={message.metrics.pivots} />
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Parse metrics from AI response
function parseRoastMetrics(text: string): RoastResponse | null {
  // Extract Survival Probability
  const survivalMatch = text.match(/\*\*Survival Probability:\s*(\d+)%?\*\*/i);
  const survivalProbability = survivalMatch ? parseInt(survivalMatch[1]) : null;

  // Extract Market Saturation
  const saturationMatch = text.match(/\*\*Market Saturation:\s*(Low|Medium|High)\*\*/i);
  const marketSaturation = saturationMatch ? saturationMatch[1] as 'Low' | 'Medium' | 'High' : null;

  // Extract Funding Likelihood
  const fundingMatch = text.match(/\*\*Funding Likelihood:\s*(\d+)%?\*\*/i);
  const fundingLikelihood = fundingMatch ? parseInt(fundingMatch[1]) : null;

  // Extract Graveyard entries
  const graveyardEntries: any[] = [];
  const graveyardMatch = text.match(/\*\*💀[^*]*\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (graveyardMatch) {
    const lines = graveyardMatch[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const entryMatch = line.match(/-\s*([^:]+):\s*(.+)/);
      if (entryMatch) {
        graveyardEntries.push({
          name: entryMatch[1].trim(),
          failure_reason: entryMatch[2].trim(),
        });
      }
    }
  }

  // Extract Pivot Suggestions
  const pivots: string[] = [];
  const pivotMatch = text.match(/\*\*🔄[^*]*\*\*([\s\S]*?)(?=\*\*|$)/i);
  if (pivotMatch) {
    const lines = pivotMatch[1].split('\n').filter(Boolean);
    for (const line of lines) {
      const pivotMatch = line.match(/-\s*(.+)/);
      if (pivotMatch) {
        pivots.push(pivotMatch[1].trim());
      }
    }
  }

  if (!survivalProbability && !marketSaturation && !fundingLikelihood) {
    return null;
  }

  return {
    survivalProbability: survivalProbability ?? 50,
    marketSaturation: marketSaturation ?? 'Medium',
    fundingLikelihood: fundingLikelihood ?? 50,
    graveyard: graveyardEntries,
    pivots,
    roast: text,
  };
}
```

### 5.4 Add Error Handling

Add error boundary and error display:

Create `app/error.tsx`:

```tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="max-w-md border-destructive">
        <CardContent className="p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-bold">Roast Failed</h2>
          <p className="text-muted-foreground">{error.message}</p>
          <Button onClick={reset} variant="outline">Try Again</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 5.5 Test Full Flow

```bash
npm run dev
```

Test steps:
1. Navigate to `/roast`
2. Type: "I want to build a dog walking app"
3. Submit
4. Verify:
   - Streaming response works
   - Survival probability displays
   - Market saturation shows
   - Funding likelihood shows
   - Graveyard section appears (if similar failures found)
   - Pivot suggestions appear (if applicable)

### 5.6 Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Environment Variables in Vercel:**
- `ALGOLIA_APPLICATION_ID`
- `ALGOLIA_SEARCH_API_KEY`
- `ALGOLIA_AGENT_ID`
- `GEMINI_API_KEY` (if using Gemini for Agent Studio)

### 5.7 Final Testing Checklist

| Test | Expected |
|------|----------|
| Landing page loads | ✓ |
| Navigate to /roast | ✓ |
| Type message | ✓ |
| See streaming response | ✓ |
| Survival probability displays | ✓ |
| Market saturation shows | ✓ |
| Funding likelihood shows | ✓ |
| Graveyard section appears | ✓ |
| Pivot suggestions appear | ✓ |
| Error handling works | ✓ |
| Mobile responsive | ✓ |

## Completion Checklist

- [ ] Algolia Agent Studio integration working
- [ ] API route handles streaming
- [ ] Metrics parsing from AI response
- [ ] All visual components render correctly
- [ ] Error handling implemented
- [ ] Environment variables configured in Vercel
- [ ] Deployed to production
- [ ] Full flow tested end-to-end

## Architecture Diagram

```
User → /roast → useChat hook → POST /api/roast
                              ↓
                    Algolia Agent Studio
                              ↓
                    ┌─────────────────────┐
                    │  Search BOTH:       │
                    │  - startups index   │
                    │  - graveyard index  │
                    └─────────────────────┘
                              ↓
                    LLM (Gemini/OpenAI)
                              ↓
                    Stream Response
                              ↓
                    Parse Metrics (regex)
                    - Survival %
                    - Saturation
                    - Funding %
                    - Graveyard data
                    - Pivots
                              ↓
                    Display Visual UI
```

## Known Limitations

- No user authentication (anonymous chat only)
- Rate limiting depends on Algolia tier
- Conversation context resets on page reload
- Metrics parsing relies on regex (AI must follow format)

## Stretch Goals (Post-MVP)

- Save roast history to localStorage
- Export roast report as PDF
- Share roast via URL
- Add more graveyard data
- Competitor grid view
- Funding estimate calculator

## Final Output

**Deliverable:** Working "Startup Roast" MVP at deployed URL with:
- Landing page at `/`
- Roast interface at `/roast`
- Real startup + graveyard data
- Streaming AI responses with metrics
- Brutally honest AI co-founder persona

---

**All phases complete! 🔥**
