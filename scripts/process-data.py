#!/usr/bin/env python3
"""
Process YC startups and failed startups data for Algolia import.
- Cleans and normalizes data
- Adds Algolia-friendly objectID
- Outputs JSON files ready for upload
"""

import csv
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any

# Paths
ROOT_DIR = Path("/Users/dm-vu-khoi.nguyen/Documents/CookProject/hackathon/algolia")
DATA_DIR = ROOT_DIR / "data"
OUTPUT_DIR = ROOT_DIR / "data" / "processed"
FAILS_DIR = DATA_DIR / "Fails"

# Create output directory
OUTPUT_DIR.mkdir(exist_ok=True)


def clean_text(text: str) -> str:
    """Clean and normalize text content."""
    if not text or text == "[]":
        return ""
    text = str(text).strip()
    # Remove extra quotes from stringified arrays
    if text.startswith("'") and text.endswith("'"):
        text = text[1:-1]
    elif text.startswith('"') and text.endswith('"'):
        text = text[1:-1]
    return text


def safe_int(value: Any, default=0) -> int:
    """Safely convert to int."""
    try:
        return int(value) if value else default
    except (ValueError, TypeError):
        return default


def parse_tags(tags_str: str) -> List[str]:
    """Parse tag string from YC data."""
    if not tags_str or tags_str == "[]":
        return []
    # Remove brackets and quotes, split by comma
    tags_str = tags_str.strip("[]'")
    tags = [t.strip().strip('"').strip("'") for t in tags_str.split(",")]
    return [t for t in tags if t]


def extract_year(year_str: str) -> int:
    """Extract year from various formats."""
    if not year_str:
        return None
    match = re.search(r"\d{4}", str(year_str))
    return int(match.group()) if match else None


def parse_founders(founders_str: str) -> List[Dict[str, str]]:
    """Parse founders JSON string."""
    if not founders_str or founders_str == "[]":
        return []
    try:
        founders = eval(founders_str) if isinstance(founders_str, str) else founders_str
        if isinstance(founders, list):
            return [
                {
                    "name": f.get("name", ""),
                    "title": f.get("title", ""),
                }
                for f in founders
            ]
    except:
        pass
    return []


def parse_funding(funding_str: str) -> int:
    """Parse funding string to integer (in USD)."""
    if not funding_str:
        return 0
    funding_str = str(funding_str).strip()

    # Handle formats like "$655M", "$1.5B", "$30M (est.)", "N/A"
    funding_str = re.sub(r'\(est\.\)', '', funding_str, flags=re.IGNORECASE)
    funding_str = funding_str.strip().lower()

    if funding_str in ['n/a', '', '-', '0', '$0']:
        return 0

    # Extract the pattern
    match = re.search(r'\$?([\d.]+)([kmb]?)', funding_str, re.IGNORECASE)
    if not match:
        return 0

    amount = float(match.group(1))
    unit = match.group(2).lower() if match.group(2) else ''

    # Convert to actual dollar amount
    if unit == 'b':
        return int(amount * 1_000_000_000)
    elif unit == 'm':
        return int(amount * 1_000_000)
    elif unit == 'k':
        return int(amount * 1_000)
    else:
        return int(amount)


def extract_years(years_str: str) -> Dict[str, int]:
    """Extract start and end year from 'Years of Operation' field."""
    if not years_str:
        return {"start": None, "end": None, "duration": None}

    # Extract all years from the string
    years = re.findall(r'\d{4}', str(years_str))

    if len(years) >= 2:
        return {
            "start": int(years[0]),
            "end": int(years[-1]),
            "duration": int(years[-1]) - int(years[0])
        }
    elif len(years) == 1:
        return {
            "start": int(years[0]),
            "end": None,
            "duration": None
        }
    else:
        return {"start": None, "end": None, "duration": None}


def process_yc_data() -> List[Dict[str, Any]]:
    """Process YC startups CSV data."""
    startups = []
    csv_path = DATA_DIR / "yc.csv"

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            # Extract relevant fields for Algolia
            startup = {
                "objectID": f"yc_{row.get('company_id', i)}",
                "name": clean_text(row.get("company_name", "")),
                "description": clean_text(row.get("short_description", "")),
                "long_description": clean_text(row.get("long_description", "")),
                "batch": clean_text(row.get("batch", "")),
                "status": clean_text(row.get("status", "Active")),
                "tags": parse_tags(row.get("tags", "[]")),
                "location": clean_text(row.get("company_location", "")),
                "year_founded": extract_year(row.get("year_founded")),
                "team_size": safe_int(row.get("team_size")),
                "website": clean_text(row.get("website", "")),
                "url": clean_text(row.get("url", "")),
                "founders": parse_founders(row.get("founders", "[]")),
                "is_hiring": row.get("is_hiring", "False") == "True",
                "open_jobs": safe_int(row.get("number_of_open_jobs")),
                "image": clean_text(row.get("company_image", "")),
                "category": parse_tags(row.get("tags", "[]"))[0] if parse_tags(row.get("tags", "[]")) else "Other",
                "index": "startups",  # For Algolia
            }
            startups.append(startup)

    print(f"Processed {len(startups)} YC startups")
    return startups


def process_fails_data() -> List[Dict[str, Any]]:
    """Process failed startups CSV data with full field mapping."""
    fails = []

    # Process categorized fail files (these have the rich data!)
    category_files = [
        ("Startup Failure (Health Care).csv", "Health Care"),
        ("Startup Failure (Retail Trade).csv", "Retail Trade"),
        ("Startup Failure (Finance and Insurance).csv", "Finance and Insurance"),
        ("Startup Failure (Manufactures).csv", "Manufacturing"),
        ("Startup Failures (Information Sector).csv", "Information Technology"),
        ("Startup Failure (Food and services).csv", "Food & Services"),
    ]

    for filename, default_category in category_files:
        file_path = FAILS_DIR / filename
        if not file_path.exists():
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                # Get name with fallbacks
                name = clean_text(row.get("Name") or row.get("Company") or row.get("Startup") or "")
                if not name:
                    continue

                # Extract years information
                years_info = extract_years(row.get("Years of Operation") or row.get("Years") or "")

                # Parse all the rich fields!
                fail = {
                    "objectID": f"fail_{default_category.replace(' ', '_').replace('&', 'and')}_{i}",
                    "name": name,

                    # Basic info
                    "sector": clean_text(row.get("Sector") or default_category),
                    "category": clean_text(row.get("Sector") or default_category),
                    "years_of_operation": clean_text(row.get("Years of Operation") or row.get("Years") or ""),

                    # The RICH data!
                    "what_they_did": clean_text(row.get("What They Did") or ""),
                    "how_much_raised": clean_text(row.get("How Much They Raised") or "N/A"),
                    "raised_amount": parse_funding(row.get("How Much They Raised") or "0"),
                    "why_they_failed": clean_text(row.get("Why They Failed") or ""),
                    "takeaway": clean_text(row.get("Takeaway") or ""),

                    # Years data
                    "year_founded": years_info["start"],
                    "year_closed": years_info["end"],
                    "operating_years": years_info["duration"],

                    # Failure flags (useful for filtering/analysis)
                    "lost_to_giants": safe_int(row.get("Giants", 0)) == 1,
                    "no_budget": safe_int(row.get("No Budget", 0)) == 1,
                    "competition": safe_int(row.get("Competition", 0)) == 1,
                    "poor_market_fit": safe_int(row.get("Poor Market Fit", 0)) == 1,
                    "acquisition_stagnation": safe_int(row.get("Acquisition Stagnation", 0)) == 1,
                    "high_operational_costs": safe_int(row.get("High Operational Costs", 0)) == 1,
                    "platform_dependency": safe_int(row.get("Platform Dependency", 0)) == 1,
                    "monetization_failure": safe_int(row.get("Monetization Failure", 0)) == 1,
                    "niche_limits": safe_int(row.get("Niche Limits", 0)) == 1,
                    "execution_flaws": safe_int(row.get("Execution Flaws", 0)) == 1,
                    "trend_shifts": safe_int(row.get("Trend Shifts", 0)) == 1,
                    "toxicity_trust_issues": safe_int(row.get("Toxicity/Trust Issues", 0)) == 1,
                    "regulatory_pressure": safe_int(row.get("Regulatory Pressure", 0)) == 1,
                    "overhype": safe_int(row.get("Overhype", 0)) == 1,

                    # Index identifier
                    "index": "graveyard",
                }
                fails.append(fail)

    # Also process main Startup Failures.csv (simple columns only)
    main_fails = FAILS_DIR / "Startup Failures.csv"
    if main_fails.exists():
        with open(main_fails, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                name = clean_text(row.get("Name", ""))
                if not name:
                    continue

                years_info = extract_years(row.get("Years of Operation", ""))

                fail = {
                    "objectID": f"fail_main_{i}",
                    "name": name,
                    "sector": clean_text(row.get("Sector", "Unknown")),
                    "category": clean_text(row.get("Sector", "Unknown")),
                    "years_of_operation": clean_text(row.get("Years of Operation", "")),
                    "what_they_did": "",
                    "how_much_raised": "N/A",
                    "raised_amount": 0,
                    "why_they_failed": "",
                    "takeaway": "",
                    "year_founded": years_info["start"],
                    "year_closed": years_info["end"],
                    "operating_years": years_info["duration"],
                    "lost_to_giants": False,
                    "competition": False,
                    "poor_market_fit": False,
                    "index": "graveyard",
                }

                # Only add if not already in fails (by name)
                if not any(f["name"].lower() == name.lower() for f in fails):
                    fails.append(fail)

    # Remove duplicates by name
    seen = set()
    unique_fails = []
    for fail in fails:
        key = fail["name"].lower()
        if key not in seen:
            seen.add(key)
            unique_fails.append(fail)

    print(f"Processed {len(unique_fails)} failed startups")
    return unique_fails


def enhance_with_insights(startups: List[Dict]) -> List[Dict]:
    """Add computed insights for better search/recommendation."""
    for startup in startups:
        # Compute survival score based on status and batch
        status = startup.get("status", "Active")
        batch = startup.get("batch", "")

        # Extract batch number (e.g., "W24" -> 24)
        batch_num = 0
        if batch:
            match = re.search(r"\d+", batch)
            if match:
                batch_num = int(match.group())

        # Survival probability (0-100)
        if status == "Active":
            # Newer batches = higher uncertainty
            base_score = 75
            batch_penalty = (24 - batch_num) * 2 if batch_num > 0 else 0
            startup["survival_score"] = max(20, min(95, base_score - batch_penalty))
        else:
            startup["survival_score"] = 30

        # Market saturation (simplified)
        category = startup.get("category", "Other")
        high_saturation = ["E-commerce", "Social Media", "Fintech", "SaaS", "Marketplace"]
        medium_saturation = ["Healthcare", "Education", "Logistics"]

        if category in high_saturation:
            startup["saturation"] = "High"
        elif category in medium_saturation:
            startup["saturation"] = "Medium"
        else:
            startup["saturation"] = "Low"

    return startups


def main():
    print("🔥 Processing Startup Roast datasets...\n")

    # Process YC startups
    print("📊 Processing YC startups...")
    startups = process_yc_data()
    startups = enhance_with_insights(startups)

    # Save startups
    startups_path = OUTPUT_DIR / "startups.json"
    with open(startups_path, "w", encoding="utf-8") as f:
        json.dump(startups, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved {len(startups)} startups to {startups_path}")

    # Process failed startups
    print("\n💀 Processing failed startups...")
    fails = process_fails_data()

    # Save fails
    fails_path = OUTPUT_DIR / "graveyard.json"
    with open(fails_path, "w", encoding="utf-8") as f:
        json.dump(fails, f, indent=2, ensure_ascii=False)
    print(f"✅ Saved {len(fails)} failed startups to {fails_path}")

    # Stats
    print("\n📈 Dataset Statistics:")
    print(f"   Active Startups: {len(startups)}")
    print(f"   Failed Startups: {len(fails)}")

    # Category breakdown for startups
    categories = {}
    for s in startups:
        cat = s.get("category", "Other")
        categories[cat] = categories.get(cat, 0) + 1
    print(f"\n   Top Categories:")
    for cat, count in sorted(categories.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"      {cat}: {count}")

    # Failure breakdown
    failure_reasons = {}
    for f in fails:
        if f.get("poor_market_fit"):
            failure_reasons["Poor Market Fit"] = failure_reasons.get("Poor Market Fit", 0) + 1
        if f.get("competition"):
            failure_reasons["Competition"] = failure_reasons.get("Competition", 0) + 1
        if f.get("monetization_failure"):
            failure_reasons["Monetization Failure"] = failure_reasons.get("Monetization Failure", 0) + 1
        if f.get("execution_flaws"):
            failure_reasons["Execution Flaws"] = failure_reasons.get("Execution Flaws", 0) + 1
        if f.get("ran_out_of_cash"):
            failure_reasons["Ran Out of Cash"] = failure_reasons.get("Ran Out of Cash", 0) + 1

    print(f"\n   Top Failure Reasons:")
    for reason, count in sorted(failure_reasons.items(), key=lambda x: x[1], reverse=True)[:5]:
        print(f"      {reason}: {count}")


if __name__ == "__main__":
    main()
