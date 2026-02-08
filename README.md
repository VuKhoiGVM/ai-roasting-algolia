# 🔥 Startup Roast

> An AI-powered startup idea validator that provides brutally honest feedback by analyzing your idea against 2,525+ real startups and 403+ failures.

[![Algolia Agent Studio](https://img.shields.io/badge/Algolia-Agent_Studio-orange)](https://www.algolia.com/products/agent-studio)
[![Next.js](https://img.shields.io/badge/Next.js-16.1-black)](https://nextjs.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel_AI_SDK-v6-blue)](https://sdk.vercel.ai/)

## ✨ Features

- **Unified Search** - Search both active startups and failed companies in one place
- **AI-Powered Analysis** - Get brutally honest feedback using Algolia Agent Studio with RAG
- **Survival Scoring** - Multi-factor algorithm (Growth 35%, Market 25%, Team 20%, Funding 15%, Trend 5%)
- **Structured Metrics** - Visual display of survival probability, market saturation, funding likelihood
- **Graveyard Insights** - Learn from 403+ failed startups with detailed failure reasons
- **Pivot Suggestions** - Get actionable pivot ideas when your concept needs refinement
- **Category Filtering** - Browse startups by industry (Fintech, Health, SaaS, etc.)
- **Top Startups** - Discover top performers by survival score
- **Notable Failures** - See the most expensive failures and what went wrong

## 🚀 Live Demo

[**View Live Demo**](https://startup-roast.vercel.app) *(coming soon)*

## 📸 Screenshots

![Homepage](docs/screenshots/ui-current.png)

## 🛠️ Tech Stack

- **Frontend**: Next.js 16.1.6 (App Router + Turbopack), React 19
- **AI**: Algolia Agent Studio, Vercel AI SDK v6, Google Gemini 2.0 Flash
- **Search**: Algolia JavaScript SDK v5.35.0
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Data**: 2,525 YC startups + 403 failed companies

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/startup-roast.git
cd startup-roast

# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your Algolia credentials
```

### Required Environment Variables

```bash
# Algolia Credentials
ALGOLIA_APPLICATION_ID=your_app_id
ALGOLIA_ADMIN_API_KEY=your_admin_key
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id

# Algolia Agent Studio
ALGOLIA_AGENT_ID=your_agent_id
NEXT_PUBLIC_ALGOLIA_AGENT_ID=your_agent_id
```

Get your credentials at:
- [Algolia Dashboard](https://www.algolia.com/) → Settings → API Keys
- [Algolia Agent Studio](https://www.algolia.com/products/agent-studio) → Create Agent

## 🏃 Running Locally

```bash
# Development server
npm run dev

# Open http://localhost:3000
```

## 📊 Data Upload

To upload your own startup data to Algolia:

```bash
# Process CSV data
npm run data:process

# Upload to Algolia
npm run data:upload

# Set up query rules for better search
npm run algolia:setup-rules
```

## 🎯 How It Works

1. **Search or Browse** - Find any startup or describe your own idea
2. **AI Analysis** - Agent Studio retrieves relevant context from 2,500+ companies
3. **Structured Response** - Get survival score, saturation level, funding likelihood, and pivot suggestions
4. **Learn from Failures** - See similar companies that failed and why

## 📁 Project Structure

```
├── app/
│   ├── page.tsx              # Main application with chat
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Cyberpunk theme styles
├── components/
│   ├── startup-search.tsx    # Unified search (startups + graveyard)
│   ├── top-startups-section.tsx
│   ├── mega-failures-section.tsx
│   ├── metrics/              # Survival, saturation, funding components
│   └── survival-tooltip.tsx  # Methodology explanation
├── lib/
│   ├── algolia.ts            # Algolia v5 search client
│   └── survival-calculator.ts # Survival score algorithm
└── scripts/
    ├── process-data.py       # CSV → JSON processing
    └── upload-to-algolia.js  # Batch upload script
```

## 🧠 Survival Score Algorithm

The survival score combines multiple factors:

| Factor | Weight | Description |
|--------|--------|-------------|
| Growth | 35% | YC growth benchmarks (5-7% weekly = exceptional) |
| Market | 25% | Category saturation & competitive landscape |
| Team | 20% | YC batch = vetted team & network |
| Funding | 15% | Hiring status & capital signals |
| Trend | 5% | Category hype cycle timing |
| Penalty | Variable | Similar failures in graveyard index |

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📄 License

MIT License - feel free to use this project for your own ideas!

## 🙏 Acknowledgments

- Data from [YC Startup School](https://www.ycombinator.com/companies) and [AutoCTO](https://github.com/AutoCTO/startup-graveyard)
- Built for the [Algolia Agent Studio Challenge](https://dev.to/challenges/algolia)
- Powered by [Algolia Agent Studio](https://www.algolia.com/products/agent-studio) and [Google Gemini](https://ai.google.dev/)

---

**Made with 🔥 for the Algolia Hackathon 2026**
