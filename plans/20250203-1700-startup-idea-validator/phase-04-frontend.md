# Phase 04: Frontend with Visual Metrics

**Status:** Pending
**Estimated:** 4 hours
**Dependencies:** Phase 01, Phase 03

## Goal

Build roast interface with chat UI + visual metrics (survival bar, saturation meter, graveyard cards).

## Tasks

### 4.1 Create Types

Create `types/index.ts`:

```typescript
// Vercel AI SDK v6 Message Types
export interface RoastResponse {
  survivalProbability: number; // 0-100
  marketSaturation: 'Low' | 'Medium' | 'High';
  fundingLikelihood: number; // 0-100
  graveyard: GraveyardEntry[];
  pivots: string[];
  roast: string;
}

export interface GraveyardEntry {
  name: string;
  failure_reason: string;
  raised_amount?: number;
  shutdown_date?: string;
}

// AI SDK v6 uses parts array instead of content
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  parts: Array<{
    type: 'text' | 'reasoning' | 'file' | 'image';
    text?: string;
    url?: string;
    mediaType?: string;
  }>;
  metrics?: RoastResponse;
}

// Helper to extract text from message parts
export function getMessageText(message: Message): string {
  return message.parts
    .filter(p => p.type === 'text')
    .map(p => p.text || '')
    .join('');
}
```

### 4.2 Create Survival Meter Component

Create `components/survival-meter.tsx`:

```tsx
'use client';

import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface SurvivalMeterProps {
  probability: number;
}

export const SurvivalMeter = memo(function SurvivalMeter({ probability }: SurvivalMeterProps) {
  const getColor = (p: number) => {
    if (p < 20) return 'bg-destructive';
    if (p < 40) return 'bg-orange-500';
    if (p < 60) return 'bg-yellow-500';
    if (p < 80) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getLabel = (p: number) => {
    if (p < 20) return 'Dead on Arrival';
    if (p < 40) return 'Pivot or Die';
    if (p < 60) return 'Risky Venture';
    if (p < 80) return 'Has Potential';
    return 'Unicorn Material';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Survival Probability</span>
        <Badge variant={probability < 40 ? 'destructive' : 'default'} className="focus-visible:ring-2 focus-visible:ring-orange-500">
          {probability}%
        </Badge>
      </div>
      <Progress value={probability} className={getColor(probability)} />
      <p className="text-xs text-muted-foreground">{getLabel(probability)}</p>
    </div>
  );
});
```

### 4.3 Create Saturation Meter Component

Create `components/saturation-meter.tsx`:

```tsx
'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';

interface SaturationMeterProps {
  saturation: 'Low' | 'Medium' | 'High';
  competitionCount?: number;
}

export const SaturationMeter = memo(function SaturationMeter({ saturation, competitionCount = 0 }: SaturationMeterProps) {
  const getValue = (s: string) => {
    switch (s) {
      case 'Low': return 25;
      case 'Medium': return 50;
      case 'High': return 90;
      default: return 50;
    }
  };

  const getColor = (s: string) => {
    switch (s) {
      case 'Low': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'High': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Market Saturation</span>
        <Badge className={getColor(saturation) + ' focus-visible:ring-2 focus-visible:ring-orange-500'}>{saturation}</Badge>
      </div>
      <Slider value={[getValue(saturation)]} max={100} disabled />
      {competitionCount > 0 && (
        <p className="text-xs text-muted-foreground">
          {competitionCount}+ competitors detected
        </p>
      )}
    </div>
  );
});
```

### 4.4 Create Funding Indicator Component

Create `components/funding-indicator.tsx`:

```tsx
'use client';

import { memo } from 'react';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface FundingIndicatorProps {
  likelihood: number; // 0-100
}

export const FundingIndicator = memo(function FundingIndicator({ likelihood }: FundingIndicatorProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Funding Likelihood</span>
        <div className="flex items-center gap-1">
          {likelihood > 50 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm font-bold">{likelihood}%</span>
        </div>
      </div>
      <Progress value={likelihood} className={likelihood > 50 ? 'bg-green-500' : 'bg-red-500'} />
      <p className="text-xs text-muted-foreground">
        {likelihood > 70 && "Investors will be interested"}
        {likelihood > 40 && likelihood <= 70 && "Tough but possible"}
        {likelihood <= 40 && "Bootstrapping is your only option"}
      </p>
    </div>
  );
});
```

### 4.5 Create Graveyard Section Component

Create `components/graveyard-section.tsx`:

```tsx
'use client';

import { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skull } from 'lucide-react';
import { GraveyardEntry } from '@/types';

interface GraveyardSectionProps {
  entries: GraveyardEntry[];
}

export const GraveyardSection = memo(function GraveyardSection({ entries }: GraveyardSectionProps) {
  if (entries.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Skull className="h-5 w-5 text-destructive" />
        <h3 className="font-semibold text-destructive">The Graveyard</h3>
        <span className="text-xs text-muted-foreground">(similar failures)</span>
      </div>

      <div className="grid gap-3">
        {entries.map((entry, i) => (
          <Card key={i} className="border-destructive/50 bg-destructive/5 focus-visible:ring-2 focus-visible:ring-orange-500">
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium">{entry.name}</h4>
                  <p className="text-sm text-muted-foreground">{entry.failure_reason}</p>
                </div>
                {entry.raised_amount && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    ${(entry.raised_amount / 1_000_000).toFixed(0)}M burned
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});
```

### 4.6 Create Pivot Card Component

Create `components/pivot-card.tsx`:

```tsx
'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface PivotCardProps {
  pivots: string[];
  onPivotClick?: (pivot: string) => void;
}

export const PivotCard = memo(function PivotCard({ pivots, onPivotClick }: PivotCardProps) {
  if (pivots.length === 0) return null;

  return (
    <Card className="border-blue-500/50 bg-blue-500/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <RefreshCw className="h-4 w-4 text-blue-500" />
          Pivot Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pivots.map((pivot, i) => (
          <Button
            key={i}
            variant="outline"
            className="w-full justify-start text-left h-auto py-3 px-4 focus-visible:ring-2 focus-visible:ring-orange-500"
            onClick={() => onPivotClick?.(pivot)}
          >
            <span className="text-sm">{pivot}</span>
          </Button>
        ))}
      </CardContent>
    </Card>
  );
});
```

### 4.7 Create Roast Interface (AI SDK v6)

Create `components/roast-interface.tsx`:

```tsx
'use client';

import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
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
import { Message } from '@/types';
import { useState } from 'react';

export function RoastInterface() {
  // AI SDK v6: Use DefaultChatTransport for streaming
  const { messages, sendMessage, status, error, input, setInput } = useChat({
    transport: new DefaultChatTransport({ api: '/api/roast' }),
    onError: (error) => {
      console.error('Chat error:', error);
    },
    onFinish: ({ finishReason }) => {
      // Handle completion
      console.log('Chat finished:', finishReason);
    },
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

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message as Message} />
          ))}

          {status !== 'ready' && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-500">
                🔥
              </Avatar>
              <Card className="px-4 py-2">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce motion-reduce:hidden bg-muted-foreground rounded-full" />
                  <span className="h-2 w-2 animate-bounce motion-reduce:hidden bg-muted-foreground rounded-full delay-100" />
                  <span className="h-2 w-2 animate-bounce motion-reduce:hidden bg-muted-foreground rounded-full delay-200" />
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (input.trim()) {
          sendMessage({ text: input });
          setInput('');
        }
      }} className="border-t p-4 bg-card/50 backdrop-blur">
        <div className="max-w-4xl mx-auto flex gap-2">
          <Input
            name="startup-idea"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe your startup idea..."
            disabled={status !== 'ready'}
            className="flex-1 focus-visible:ring-2 focus-visible:ring-orange-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && input.trim()) {
                e.preventDefault();
                sendMessage({ text: input });
                setInput('');
              }
            }}
          />
          <Button
            type="button"
            onClick={() => {
              sendMessage({ text: input });
              setInput('');
            }}
            disabled={status !== 'ready' || !input.trim()}
            className="bg-gradient-to-r from-orange-500 to-red-500 focus-visible:ring-2 focus-visible:ring-orange-500"
          >
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
    const text = message.parts
      ?.filter(p => p.type === 'text')
      .map(p => p.text)
      .join('') || '';

    return (
      <div className="flex justify-end">
        <Card className="px-4 py-3 max-w-[80%] bg-primary text-primary-foreground">
          <p className="whitespace-pre-wrap">{text}</p>
        </Card>
      </div>
    );
  }

  // Assistant message with metrics
  const text = message.parts
    ?.filter(p => p.type === 'text')
    .map(p => p.text)
    .join('') || '';

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-500 shrink-0">
          🔥
        </Avatar>
        <Card className="px-4 py-3 flex-1">
          <p className="whitespace-pre-wrap">{text}</p>
        </Card>
      </div>

      {/* Metrics Section */}
      {message.metrics && (
        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4 space-y-4">
            <SurvivalMeter probability={message.metrics.survivalProbability} />
            <SaturationMeter
              saturation={message.metrics.marketSaturation}
            />
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
```

### 4.8 Create Roast Page

Create `app/roast/page.tsx`:

```tsx
import { RoastInterface } from '@/components/roast-interface';

export default function RoastPage() {
  return <RoastInterface />;
}
```

### 4.9 Update Landing Page

Update `app/page.tsx`:

```tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Flame, Skull, TrendingDown } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-orange-950/10 to-background">
      <div className="container mx-auto px-4 py-20">
        <div className="text-center space-y-8 max-w-3xl mx-auto">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Startup<span className="text-orange-500">Roast</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Get your startup idea roasted by AI. Brutal honesty, real data, zero sugarcoating.
            </p>
          </div>

          <Link href="/roast">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-red-500 text-lg px-8 focus-visible:ring-2 focus-visible:ring-orange-500">
              <Flame className="mr-2 h-5 w-5" />
              Roast My Idea
            </Button>
          </Link>

          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto pt-8">
            <Card className="focus-visible:ring-2 focus-visible:ring-orange-500">
              <CardContent className="p-4 text-center">
                <Skull className="h-8 w-8 mx-auto mb-2 text-destructive" />
                <p className="text-sm font-medium">Graveyard Data</p>
                <p className="text-xs text-muted-foreground">Failed startups</p>
              </CardContent>
            </Card>
            <Card className="focus-visible:ring-2 focus-visible:ring-orange-500">
              <CardContent className="p-4 text-center">
                <TrendingDown className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                <p className="text-sm font-medium">Survival Score</p>
                <p className="text-xs text-muted-foreground">Probability %</p>
              </CardContent>
            </Card>
            <Card className="focus-visible:ring-2 focus-visible:ring-orange-500">
              <CardContent className="p-4 text-center">
                <Flame className="h-8 w-8 mx-auto mb-2 text-red-500" />
                <p className="text-sm font-medium">Pivot Ideas</p>
                <p className="text-xs text-muted-foreground">Save yourself</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 4.10 Install Icons

```bash
npm install lucide-react
```

### 4.11 Verify UI

```bash
npm run dev
```

Test:
1. Visit `/` - see landing page
2. Click "Roast My Idea" - goes to `/roast`
3. Type message (won't get response yet - Phase 05)

## Completion Checklist

- [ ] Types defined (`types/index.ts`)
- [ ] SurvivalMeter component created
- [ ] SaturationMeter component created
- [ ] FundingIndicator component created
- [ ] GraveyardSection component created
- [ ] PivotCard component created
- [ ] RoastInterface created
- [ ] Landing page updated
- [ ] Dark mode styling applied
- [ ] All components render without errors

## Component Tree

```
app/
├── page.tsx              # Landing page
├── roast/
│   └── page.tsx          # Roast interface
└── layout.tsx
components/
├── ui/                   # shadcn components
├── roast-interface.tsx   # Main chat UI
├── survival-meter.tsx    # Progress bar
├── saturation-meter.tsx  # Slider visualization
├── funding-indicator.tsx # Progress + icon
├── graveyard-section.tsx # Failed startups cards
└── pivot-card.tsx        # Pivot suggestions
```

## Next Phase

[Phase 05: End-to-End Integration](./phase-05-integration.md)
