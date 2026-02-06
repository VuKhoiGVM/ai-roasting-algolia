# Query Rules Setup Instructions

## What This Does

Sets up 8 query rules that automatically boost/filter search results:

1. **AI Boost** - AI/ML companies appear first when searching for "AI", "GPT", etc.
2. **Failure Redirect** - Shows graveyard when searching "failed", "bankrupt", etc.
3. **Category Auto-Filter** - Fintech, Healthcare, E-commerce, SaaS auto-filter
4. **Recent Batch Boost** - W21-W24 batches get ranking boost
5. **Developer Tools Boost** - Boosts devtools, infrastructure, APIs

## How to Run

### Option 1: One-time setup
```bash
ALGOLIA_APPLICATION_ID=your_app_id ALGOLIA_ADMIN_API_KEY=your_admin_key node scripts/setup-query-rules.js
```

### Option 2: Add to .env.local (permanent)
```bash
# Add these to your .env.local:
ALGOLIA_APPLICATION_ID=your_app_id
ALGOLIA_ADMIN_API_KEY=your_admin_key

# Then run:
npm run algolia:setup-rules
```

## Where to Get Admin API Key

1. Go to https://www.algolia.com/
2. Open your application
3. Go to **Settings** > **API Keys**
4. Copy the **Admin API Key** (starts with `...`)

**⚠️ Important:** The Admin API Key has full access - keep it secret!

## Test After Setup

Once rules are set up, test by searching:

| Search Query | Expected Behavior |
|--------------|------------------|
| "AI healthcare" | AI companies appear first |
| "failed companies" | Graveyard results prominent |
| "fintech" | Only fintech companies shown |
| "devtools" | Developer tools boosted |
| Any search | W24, W23 batches rank higher |
