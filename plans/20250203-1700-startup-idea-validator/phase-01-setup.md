# Phase 01: Project Scaffolding

**Status:** ✅ Complete
**Completed:** 2025-02-03
**Estimated:** 2 hours | **Actual:** ~3 hours

## Goal

Initialize a production-ready Next.js 16.1.5 project with shadcn/ui configured for "Startup Roast".

## Tech Stack (Latest Versions - Feb 2025)

| Technology | Version | Package |
|------------|---------|---------|
| Next.js | v16.1.5 | `next` |
| Vercel AI SDK | v6.0.0-beta.128 | `ai`, `@ai-sdk/react` |
| Google Provider | Latest | `@ai-sdk/google` |
| shadcn/ui | Latest | via CLI |
| Tailwind CSS | v4 | bundled with Next.js |
| Algolia Client | v5.35.0 | `algoliasearch` |
| Lucide Icons | Latest | `lucide-react` |

## Tasks

### 1.1 Quick Start (One Command)

```bash
# Create Next.js project with all defaults (TS, Tailwind, App Router, Turbopack)
npx create-next-app@latest startup-roast --yes
cd startup-roast
```

**What `--yes` includes:**
- ✅ TypeScript
- ✅ ESLint
- ✅ Tailwind CSS (v4)
- ✅ App Router
- ✅ Turbopack (faster builds)
- ✅ Import alias `@/*`
- ✅ No src/ directory (flat structure)

### 1.2 Install AI SDK + Google Provider

```bash
# Vercel AI SDK v6 + React hooks + Google Gemini provider
npm install ai@latest @ai-sdk/react@latest @ai-sdk/google@latest
```

**Key imports in v6:**
```tsx
// New v6 imports
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { google } from '@ai-sdk/google';
```

### 1.3 Install Additional Dependencies

```bash
# Algolia search client
npm install algoliasearch@5.35.0

# Icons (for visual components)
npm install lucide-react
```

### 1.4 Initialize shadcn/ui

```bash
npx shadcn@latest init --yes
```

**Default config:**
- Style: New York (modern look)
- Base color: Zinc (darker, fits "roast" theme)
- CSS variables: Yes
- Tailwind config: Auto-detected

### 1.5 Add Required shadcn Components

```bash
npx shadcn@latest add button card input field dialog scroll-area avatar badge progress slider alert
```

| Component | Purpose |
|-----------|---------|
| `button` | Submit actions, "Roast It" button |
| `card` | Message containers, graveyard entries, metric panels |
| `input` | Chat input field |
| `field` | Form labels with validation |
| `dialog` | Pivot suggestions modal, settings |
| `scroll-area` | Chat message history |
| `avatar` | User/roast-bot avatars |
| `badge` | Status indicators (saturation, survival tier) |
| `progress` | Survival probability bar, funding likelihood |
| `slider` | Visual market saturation meter |
| `alert` | Warning messages for brutal feedback |

### 1.6 Create Environment Template

Create `.env.local`:

```env
# Algolia
ALGOLIA_APPLICATION_ID=
ALGOLIA_SEARCH_API_KEY=
ALGOLIA_ADMIN_API_KEY=
ALGOLIA_AGENT_ID=

# Google Gemini (Free Tier) - For Agent Studio LLM
GEMINI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Create `.env.example` with same content (empty values).

### 1.7 Create Base Folder Structure

```
startup-roast/
├── app/
│   ├── api/
│   │   └── roast/
│   │       └── route.ts
│   ├── roast/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   └── (shadcn components)
│   ├── roast-interface.tsx
│   ├── survival-meter.tsx
│   ├── saturation-meter.tsx
│   ├── funding-indicator.tsx
│   ├── graveyard-section.tsx
│   └── pivot-card.tsx
├── lib/
│   ├── utils.ts
│   ├── algolia.ts
│   └── gemini.ts
├── scripts/
│   ├── fetch-active-startups.py
│   ├── fetch-graveyard.py
│   ├── upload-to-algolia.js
│   └── test-agent.js
├── data/
│   └── .gitkeep
├── types/
│   └── index.ts
├── .env.local
├── .env.example
├── components.json  # shadcn config
├── tailwind.config.ts
├── next.config.ts
└── tsconfig.json
```

### 1.8 Configure Next.js

Create or update `next.config.ts` with lucide-react optimization:

```ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default config;
```

### 1.9 Update Root Layout

`app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Startup Roast - Brutally Honest AI Co-founder",
  description: "Get your startup idea roasted by AI. Survival probability, market analysis, and brutal truth.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: 'dark' }}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

**Note:** Default to dark mode for the roast aesthetic. The `colorScheme: 'dark'` ensures browser UI elements (scrollbars, form controls) also use dark styling.

### 1.10 Configure Tailwind (v4)

Update `app/globals.css` with custom theme and reduced motion support:

```css
@import "tailwindcss";

@theme {
  --color-roast-orange: oklch(0.65 0.2 45);
  --color-roast-red: oklch(0.6 0.25 25);
}

/* Accessibility: Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  .motion-reduce\:hidden {
    display: none;
  }
}
```

### 1.11 Create Gemini Helper

Create `lib/gemini.ts`:

```typescript
import { google } from '@ai-sdk/google';

export function getGeminiModel() {
  // Gemini 3.0 Flash for fast responses (free tier friendly)
  return google('gemini-3-flash-preview');

  // OR Gemini 3 Pro for deeper reasoning
  // return google('gemini-3-pro-preview');
}

export function getGeminiModelWithThinking() {
  // For complex analysis with reasoning
  return google('gemini-3-pro-preview', {
    thinkingConfig: {
      thinkingLevel: 'low',
      includeThoughts: false,
    },
  });
}
```

### 1.12 Verify Setup

```bash
npm run dev
```

Visit `http://localhost:3000` - should see Next.js welcome page.

## Completion Checklist

- [x] Next.js 16.1.6 project created (v16.1.5→16.1.6)
- [x] AI SDK v6 installed with `@ai-sdk/react` and `@ai-sdk/google`
- [x] shadcn/ui initialized with New York style + Zinc theme
- [x] All UI components added (11 components: button, card, input, textarea, badge, label, progress, dialog, avatar, slider, alert, scroll-area)
- [x] Algolia client v5.35.0 installed
- [x] Environment template created with GEMINI_API_KEY
- [x] Folder structure created
- [x] Dark mode enabled by default with `colorScheme: 'dark'`
- [x] `next.config.ts` configured with lucide-react optimization
- [x] `globals.css` includes reduced motion support
- [x] Project runs and builds successfully

## API Changes Summary (v5 → v6)

| v5 (Old) | v6 (New) |
|----------|----------|
| `import { useChat } from 'ai/react'` | `import { useChat } from '@ai-sdk/react'` |
| `useChat({ api: '/api/chat' })` | `useChat({ transport: new DefaultChatTransport({ api: '/api/chat' }) })` |
| `messages` array with `content` | `messages` array with `parts[]` |
| `handleSubmit` | `sendMessage({ parts: [{ type: 'text', text: input }] })` |

## Next Phase

[Phase 02: Data Collection (Startups + Graveyard)](./phase-02-data.md)
