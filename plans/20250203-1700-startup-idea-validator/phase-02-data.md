# Phase 02: Data Collection (Startups + Graveyard)

**Status:** Pending
**Estimated:** 4 hours
**Dependencies:** Phase 01

## Goal

Collect and process TWO datasets: successful startups AND failed startups (graveyard).

## Data Sources

### Dataset 1: Active/Successful Startups
- **Source:** Kaggle 2024-2025 Startup Dataset
- **Purpose:** Show competition, market saturation
- **Fields:** name, industry, funding, status, description, tags

### Dataset 2: Startup Graveyard (Failed)
- **Source:** CB Insights Startup Failure List, AutoMat data, or curated list
- **Purpose:** Show failed similar startups with failure reasons
- **Fields:** name, industry, failure_reason, shutdown_date, raised_amount

## Tasks

### 2.1 Setup Python Environment

Create `scripts/requirements.txt`:

```txt
pandas
kaggle
python-dotenv
requests
```

Install:

```bash
pip install -r scripts/requirements.txt
```

### 2.2 Create Active Startups Processing Script

Create `scripts/fetch_active_startups.py`:

```python
import os
import json
import pandas as pd
from pathlib import Path

OUTPUT_DIR = Path("../data")
OUTPUT_DIR.mkdir(exist_ok=True)

def load_dataset(csv_path: str) -> pd.DataFrame:
    """Load startup dataset from CSV."""
    df = pd.read_csv(csv_path)
    return df

def clean_data(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and standardize data."""
    df = df[df['name'].notna()].copy()

    column_map = {
        'company_name': 'name',
        'Company_Name': 'name',
        'industry': 'industry',
        'Industry': 'industry',
        'sector': 'sector',
        'funding_total': 'funding',
        'Funding_Total': 'funding',
        'status': 'status',
        'description': 'description',
        'tags': 'tags',
    }
    df = df.rename(columns=column_map)

    required_cols = ['name']
    for col in required_cols:
        if col not in df.columns:
            df[col] = ''

    return df

def to_algolia_format(df: pd.DataFrame) -> list:
    """Convert to Algolia records."""
    records = []

    for idx, row in df.iterrows():
        record = {
            'objectID': f"active_{idx}",
            'name': str(row.get('name', ''))[:100],
            'industry': str(row.get('industry', 'Unknown'))[:50],
            'sector': str(row.get('sector', 'Unknown'))[:50],
            'funding': parse_funding(row.get('funding', 0)),
            'status': str(row.get('status', 'Active'))[:30],
            'description': str(row.get('description', ''))[:500],
            'tags': parse_tags(row.get('tags', [])),
        }
        records.append(record)

    return records

def parse_funding(value) -> int:
    """Parse funding to integer (in USD)."""
    try:
        if pd.isna(value):
            return 0
        s = str(value).replace('$', '').replace(',', '').upper()
        if 'M' in s:
            return int(float(s.replace('M', '')) * 1_000_000)
        if 'B' in s:
            return int(float(s.replace('B', '')) * 1_000_000_000)
        return int(float(s))
    except:
        return 0

def parse_tags(value) -> list:
    """Parse tags to list."""
    if pd.isna(value):
        return []
    if isinstance(value, list):
        return [str(t)[:30] for t in value[:10]]
    return [str(t).strip()[:30] for t in str(value).split(',')[:10]]

def save_to_json(records: list, output_path: str):
    """Save records to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} records to {output_path}")

def main():
    csv_path = "../data/raw/active_startups.csv"
    if not os.path.exists(csv_path):
        print(f"Error: {csv_path} not found.")
        return

    df = load_dataset(csv_path)
    print(f"Loaded {len(df)} rows")

    df = clean_data(df)
    records = to_algolia_format(df)

    output_path = OUTPUT_DIR / "startups.json"
    save_to_json(records, str(output_path))

if __name__ == "__main__":
    main()
```

### 2.3 Create Graveyard Processing Script

Create `scripts/fetch_graveyard.py`:

```python
import os
import json
import pandas as pd
from pathlib import Path
from datetime import datetime

OUTPUT_DIR = Path("../data")
OUTPUT_DIR.mkdir(exist_ok=True)

# Sample graveyard data (if no dataset found)
SAMPLE_GRAVEYARD = [
    {
        "name": "Quibi",
        "industry": "Streaming",
        "failure_reason": "No product-market fit, expensive content, poor timing (launched during COVID)",
        "shutdown_date": "2020-12-01",
        "raised_amount": 1750000000,
        "founded_year": 2018
    },
    {
        "name": "Theranos",
        "industry": "Healthtech",
        "failure_reason": "Fraud, technology didn't work",
        "shutdown_date": "2018-09-04",
        "raised_amount": 700000000,
        "founded_year": 2003
    },
    {
        "name": "Juicero",
        "industry": "Consumer Hardware",
        "failure_reason": "Overpriced hardware, unnecessary product",
        "shutdown_date": "2017-09-01",
        "raised_amount": 120000000,
        "founded_year": 2013
    },
    {
        "name": "Away",
        "industry": "E-commerce",
        "failure_reason": "Culture issues, overexpansion",
        "shutdown_date": "2023-01-01",
        "raised_amount": 31000000,
        "founded_year": 2015
    },
    {
        "name": "Bowery Farming",
        "industry": "Agtech",
        "failure_reason": "High costs, scalability issues",
        "shutdown_date": "2024-11-01",
        "raised_amount": 700000000,
        "founded_year": 2017
    },
    {
        "name": "Zume Pizza",
        "industry": "Food Tech",
        "failure_reason": "Over-automation, high capital costs",
        "shutdown_date": "2020-10-01",
        "raised_amount": 445000000,
        "founded_year": 2015
    },
    {
        "name": "Brandless",
        "industry": "E-commerce",
        "failure_reason": "Low margins, high customer acquisition costs",
        "shutdown_date": "2020-02-10",
        "raised_amount": 240000000,
        "founded_year": 2017
    },
    {
        "name": "Razor scooter",
        "industry": "Mobility",
        "failure_reason": "Market saturation, safety concerns",
        "shutdown_date": "2020-01-01",
        "raised_amount": 555000000,
        "founded_year": 2017
    },
    {
        "name": "Homebrew",
        "industry": "Social Club",
        "failure_reason": "No product-market fit",
        "shutdown_date": "2023-06-01",
        "raised_amount": 35000000,
        "founded_year": 2020
    },
    {
        "name": "Fast",
        "industry": "E-commerce",
        "failure_reason": "Low retention, high CAC",
        "shutdown_date": "2023-04-01",
        "raised_amount": 15000000,
        "founded_year": 2019
    },
]

def to_algolia_graveyard_format(data: list) -> list:
    """Convert graveyard data to Algolia records."""
    records = []

    for idx, item in enumerate(data):
        record = {
            'objectID': f"graveyard_{idx}",
            'name': str(item.get('name', ''))[:100],
            'industry': str(item.get('industry', 'Unknown'))[:50],
            'failure_reason': str(item.get('failure_reason', 'Unknown'))[:500],
            'shutdown_date': str(item.get('shutdown_date', '')),
            'raised_amount': int(item.get('raised_amount', 0)),
            'founded_year': int(item.get('founded_year', 2020)),
            'tags': extract_tags(item),
        }
        records.append(record)

    return records

def extract_tags(item: dict) -> list:
    """Extract tags from failure reason and industry."""
    tags = [item.get('industry', 'Unknown')]
    reason = item.get('failure_reason', '').lower()

    if 'market' in reason:
        tags.append('No product-market fit')
    if 'cost' in reason or 'expensive' in reason:
        tags.append('Cost issues')
    if 'competition' in reason or 'saturation' in reason:
        tags.append('Competitive market')
    if 'timing' in reason:
        tags.append('Bad timing')
    if 'fraud' in reason:
        tags.append('Fraud')

    return tags[:5]

def save_to_json(records: list, output_path: str):
    """Save records to JSON file."""
    with open(output_path, 'w') as f:
        json.dump(records, f, indent=2)
    print(f"Saved {len(records)} graveyard records to {output_path}")

def main():
    # Use sample data for now
    records = to_algolia_graveyard_format(SAMPLE_GRAVEYARD)

    output_path = OUTPUT_DIR / "graveyard.json"
    save_to_json(records, str(output_path))

    print("\nSample graveyard record:")
    print(json.dumps(records[0], indent=2))

if __name__ == "__main__":
    main()
```

### 2.4 Run Scripts

```bash
cd scripts

# Active startups
python fetch_active_startups.py

# Graveyard
python fetch_graveyard.py
```

### 2.5 Expected Outputs

`data/startups.json`:
```json
[
  {
    "objectID": "active_0",
    "name": "TechCorp Inc",
    "industry": "SaaS",
    "sector": "Technology",
    "funding": 5000000,
    "status": "Active",
    "description": "B2B software platform...",
    "tags": ["SaaS", "B2B", "Cloud"]
  }
]
```

`data/graveyard.json`:
```json
[
  {
    "objectID": "graveyard_0",
    "name": "Quibi",
    "industry": "Streaming",
    "failure_reason": "No product-market fit...",
    "shutdown_date": "2020-12-01",
    "raised_amount": 1750000000,
    "founded_year": 2018,
    "tags": ["Streaming", "No product-market fit"]
  }
]
```

### 2.6 Validate Both Files

Create `scripts/validate.py`:

```python
import json
from pathlib import Path

def validate_json(path: str, required_fields: list):
    """Validate JSON has correct schema."""
    with open(path) as f:
        data = json.load(f)

    for i, record in enumerate(data[:5]):
        for field in required_fields:
            if field not in record:
                print(f"Error: Record {i} missing {field}")
                return False

    print(f"✓ {path} valid ({len(data)} records)")
    return True

if __name__ == "__main__":
    validate_json("../data/startups.json",
        ['objectID', 'name', 'industry', 'funding', 'status'])
    validate_json("../data/graveyard.json",
        ['objectID', 'name', 'industry', 'failure_reason', 'shutdown_date'])
```

## Completion Checklist

- [ ] `data/startups.json` generated (1000+ active startups)
- [ ] `data/graveyard.json` generated (50+ failed startups)
- [ ] Both files validated
- [ ] Sample records verified
- [ ] Failure reasons descriptive

## Data Schemas

**Active Startup:**
```typescript
interface StartupRecord {
  objectID: string;
  name: string;
  industry: string;
  sector: string;
  funding: number;
  status: string;
  description: string;
  tags: string[];
}
```

**Graveyard Record:**
```typescript
interface GraveyardRecord {
  objectID: string;
  name: string;
  industry: string;
  failure_reason: string;
  shutdown_date: string;
  raised_amount: number;
  founded_year: number;
  tags: string[];
}
```

## Next Phase

[Phase 03: Algolia + Agent Studio Setup](./phase-03-algolia.md)
