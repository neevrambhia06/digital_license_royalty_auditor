import os
import random
import numpy as np
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from faker import Faker

# Reproducibility
random.seed(42)
np.random.seed(42)
fake = Faker()

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or ANON_KEY) must be set in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

STUDIOS = [
    "HelixMedia", "StellarArts", "NovaCinema", "OrbitSound", "PrismStudios",
    "NexusFilms", "ApexRecords", "ZenithBroadcast", "AuroraMedia", "VortexTV",
    "ParallaxPics", "MeridianMusic", "SolsticeStudios", "EclipticArts", "HorizonRecords",
    "CatalystFilms", "NebulaBroadcast", "EquinoxMedia", "ZephyrSound", "ArchiveArts"
]

COUNTRIES = ["US", "CA", "UK", "IN", "DE", "JP", "BR", "AU", "FR"]

def generate_contracts():
    print("Generating 1000 contracts...")
    contracts = []
    content_ids = []
    
    # Generate content IDs: 250 each
    for prefix in ["Movie", "Show", "Album", "Podcast"]:
        for i in range(1, 251):
            content_ids.append(f"{prefix}_{i:03d}")
    
    random.shuffle(content_ids)
    
    for i in range(1, 1001):
        contract_id = f"C{i:04d}"
        content_id = content_ids[i-1]
        studio = random.choice(STUDIOS)
        royalty_rate = round(random.uniform(0.05, 0.20), 4)
        rate_per_play = round(random.uniform(0.01, 0.08), 4)
        territory = random.sample(COUNTRIES, k=random.randint(2, 6))
        
        start_date = date(2022, 1, 1) + timedelta(days=random.randint(0, (date(2024, 1, 1) - date(2022, 1, 1)).days))
        
        # 2% expired (every 50th)
        if i % 50 == 0:
            end_date = date(2023, 1, 1) + timedelta(days=random.randint(0, (date(2023, 12, 31) - date(2023, 1, 1)).days))
        else:
            end_date = date(2025, 6, 1) + timedelta(days=random.randint(0, (date(2027, 12, 31) - date(2025, 6, 1)).days))
            
        tier_threshold = random.choice([50000, 100000, 200000, 500000])
        tier_rate = round(rate_per_play * 0.85, 4)
        minimum_guarantee = round(random.uniform(500, 5000), 2) if i % 3 == 0 else 0
        
        contract_text = f"""
        This DIGITAL LICENSE ROYALTY AGREEMENT is entered into by and between {studio} ("Licensor") and the Streaming Platform ("Licensee") for the content titled {content_id}.
        
        1. GRANT OF RIGHTS: Licensor hereby grants Licensee a non-exclusive license to distribute and stream {content_id} within the specified territories: {', '.join(territory)}.
        
        2. COMPENSATION: Licensee shall pay Licensor a royalty rate of {royalty_rate*100}% of attributable revenue, plus a per-play rate of ${rate_per_play}.
        
        3. TIERED PRICING: Upon reaching {tier_threshold} plays, the per-play rate shall adjust to ${tier_rate} for all subsequent plays within the accounting period.
        
        4. TERM: This agreement is valid from {start_date} until {end_date}.
        
        5. MINIMUM GUARANTEE: Licensee guarantees a minimum payment of ${minimum_guarantee} for the duration of this term, regardless of actual stream performance.
        
        6. AUDIT RIGHTS: Licensor reserves the right to audit Licensee's records to ensure compliance with the terms stated herein.
        """
        # Ensure it's roughly 150 words by padding if needed, but the template is quite formal already.
        # Adding some filler legal jargon to hit the word count
        filler = " IN WITNESS WHEREOF, the parties hereto have executed this Agreement as of the date first above written. This document constitutes the entire agreement between the parties and supersedes all prior communications, representations, or agreements, either oral or written, with respect to the subject matter hereof. No change, modification, or discharge of this Agreement shall be valid unless in writing and signed by an authorized representative of each party. The failure of either party to enforce any provision shall not be construed as a waiver. This Agreement shall be governed by and construed in accordance with the laws of the applicable jurisdiction without regard to conflicts of law principles. All disputes arising out of this agreement shall be settled through binding arbitration in a venue mutually agreed upon by both parties."
        contract_text += filler
        
        contract = {
            "contract_id": contract_id,
            "content_id": content_id,
            "studio": studio,
            "royalty_rate": royalty_rate,
            "rate_per_play": rate_per_play,
            "territory": territory,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "tier_threshold": tier_threshold,
            "tier_rate": tier_rate,
            "minimum_guarantee": minimum_guarantee,
            "contract_text": contract_text
        }
        contracts.append(contract)
        
    # Batch upload
    for i in range(0, len(contracts), 500):
        batch = contracts[i:i+500]
        supabase.table("contracts").insert(batch).execute()
        print(f"Uploaded {i + len(batch)} contracts...")
        
    return contracts

def generate_streaming_logs(contracts):
    print("Generating 100,000 streaming logs...")
    logs = []
    content_ids = [c["content_id"] for c in contracts]
    contract_map = {c["content_id"]: c for c in contracts}
    
    # Weighted distribution: 10% of content IDs get 60% of plays
    num_content = len(content_ids)
    top_10_percent_count = int(num_content * 0.1)
    
    weights = np.ones(num_content)
    # Assign high weights to first 10%
    weights[:top_10_percent_count] = (0.6 / 0.1)
    # Remaining 40% of weight to 90% of content
    weights[top_10_percent_count:] = (0.4 / 0.9)
    # Normalize
    weights /= weights.sum()
    
    start_ts = datetime(2024, 1, 1)
    end_ts = datetime(2024, 12, 31, 23, 59, 59)
    delta_seconds = int((end_ts - start_ts).total_seconds())
    
    for i in range(1, 100001):
        content_id = np.random.choice(content_ids, p=weights)
        contract = contract_map[content_id]
        
        # 98% in territory, 2% NOT in territory
        if i % 50 == 0:
            country = random.choice([c for c in COUNTRIES if c not in contract["territory"]]) if any(c not in contract["territory"] for c in COUNTRIES) else "FR"
        else:
            country = random.choice(contract["territory"])
            
        timestamp = start_ts + timedelta(seconds=random.randint(0, delta_seconds))
        plays = int(np.random.lognormal(0, 0.5))
        plays = max(1, min(50, plays))
        
        user_type = random.choices(["premium", "free", "trial"], weights=[60, 30, 10])[0]
        device = random.choices(["mobile", "desktop", "tv", "tablet"], weights=[45, 30, 15, 10])[0]
        
        log = {
            "play_id": f"PL{i:08d}",
            "content_id": content_id,
            "timestamp": timestamp.isoformat(),
            "country": country,
            "plays": plays,
            "user_type": user_type,
            "device": device
        }
        logs.append(log)
        
        if len(logs) == 500:
            supabase.table("streaming_logs").insert(logs).execute()
            if (i // 500) % 10 == 0:
                print(f"Uploaded {i} logs...")
            logs = []
            
    if logs:
        supabase.table("streaming_logs").insert(logs).execute()
        
    return contract_map

def generate_payments(contract_map):
    print("Generating payment ledger...")
    # Fetch all logs for computation (In real scenarios we'd aggregate in DB, but script requires local logic)
    # To avoid memory issues and API limits, we'll fetch in batches if needed, but 100k is manageable.
    # Actually, we already have them in memory if we return them, but let's just group them as we generate or fetch.
    
    # We'll use the logs we just generated (if we kept them) or query them back.
    # Better to aggregate while generating to save time.
    # Let's re-simulate the aggregation logic based on the same random seed or just query.
    
    # Actually, I'll fetch from DB to be sure.
    response = supabase.table("streaming_logs").select("content_id, timestamp, plays").execute()
    logs = response.data
    
    aggregates = {}
    for log in logs:
        content_id = log["content_id"]
        month = log["timestamp"][:7] # YYYY-MM
        key = (content_id, month)
        aggregates[key] = aggregates.get(key, 0) + log["plays"]
        
    payments = []
    idx = 0
    total_leakage = 0
    
    for (content_id, month), total_plays in aggregates.items():
        contract = contract_map.get(content_id)
        if not contract: continue
        
        # Tiered formula
        if total_plays <= contract["tier_threshold"]:
            expected = total_plays * contract["rate_per_play"]
        else:
            expected = (contract["tier_threshold"] * contract["rate_per_play"]) + \
                       ((total_plays - contract["tier_threshold"]) * contract["tier_rate"])
        
        # Inject errors
        leak_type = "CLEAN"
        if idx % 20 == 0:
            amount_paid = round(expected * random.uniform(0.70, 0.95), 2)
            leak_type = "UNDERPAYMENT"
        elif idx % 33 == 0:
            amount_paid = round(expected * random.uniform(1.05, 1.30), 2)
            leak_type = "OVERPAYMENT"
        elif idx % 50 == 0:
            amount_paid = 0.0
            leak_type = "MISSING PAYMENT"
        elif idx % 47 == 0:
            amount_paid = round(total_plays * contract["rate_per_play"], 2)
            leak_type = "WRONG RATE TIER"
        else:
            amount_paid = round(expected, 2)
            
        total_leakage += max(0, expected - amount_paid)
        
        # Payment date: last day of month
        year, m = map(int, month.split('-'))
        if m == 12:
            last_day = date(year, 12, 31)
        else:
            last_day = date(year, m + 1, 1) - timedelta(days=1)
            
        payment = {
            "payment_id": f"PAY{idx:06d}",
            "content_id": content_id,
            "contract_id": contract["contract_id"],
            "amount_paid": amount_paid,
            "payment_date": str(last_day),
            "payment_month": month,
            "currency": "USD"
        }
        payments.append(payment)
        idx += 1
        
    # Batch upload
    for i in range(0, len(payments), 500):
        batch = payments[i:i+500]
        supabase.table("payment_ledger").insert(batch).execute()
        print(f"Uploaded {i + len(batch)} payment records...")
        
    print(f"\nSummary:")
    print(f"Contracts: 1000")
    print(f"Streaming Logs: 100,000")
    print(f"Payment Records: {len(payments)}")
    print(f"Estimated Total Leakage: ${total_leakage:,.2f}")

def main():
    print("Starting data generation...")
    contracts = generate_contracts()
    contract_map = generate_streaming_logs(contracts)
    generate_payments(contract_map)
    print("Data generation complete!")

if __name__ == "__main__":
    main()
