import csv
import json
import os
import random
import math
import sys
from datetime import date, timedelta, datetime

# ────────────────────────────────────────────
# Configuration Loader
# ────────────────────────────────────────────
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH) as f:
    CFG = json.load(f)

TERRITORIES = CFG["territories"]
STUDIOS = CFG["studios"]
CONTENT_DIST = CFG["content_distribution"]
VIOLATION_RATES = CFG["violation_rates"]
LEAKAGE_TARGET = CFG["leakage_target_usd"]
TOTAL_CONTRACTS = CFG["total_contracts"]
TOTAL_PLAYS = CFG["total_plays"]
TOTAL_PAYMENTS = CFG["total_payments"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

# ────────────────────────────────────────────
# Data Generation Logic
# ────────────────────────────────────────────
def build_content_ids():
    ids = []
    for prefix, count in CONTENT_DIST.items():
        for i in range(1, count + 1):
            ids.append(f"{prefix}_{i:03d}")
    return ids

CONTENT_IDS = build_content_ids()

def generate_contracts():
    print(f"[*] Generating {TOTAL_CONTRACTS} contracts...")
    contracts = []
    shuffled_ids = CONTENT_IDS[:]
    random.seed(42)
    random.shuffle(shuffled_ids)

    for i in range(TOTAL_CONTRACTS):
        content_id = shuffled_ids[i]
        studio = STUDIOS[i % len(STUDIOS)]
        royalty_rate = round(random.uniform(0.08, 0.18), 4)
        rate_per_play = round(random.uniform(0.01, 0.05), 4)
        tier_threshold = random.choice([50000, 75000, 100000, 150000, 200000])
        tier_rate = round(rate_per_play * 0.85, 4)
        minimum_guarantees = round(random.uniform(2500, 25000), 2)
        territory = random.sample(TERRITORIES, random.randint(2, 5))
        start_date = date(2023, 1, 1) + timedelta(days=random.randint(0, 730))
        end_date = start_date + timedelta(days=random.randint(12, 36) * 30)

        contracts.append({
            "contract_id": f"C{i + 1:04d}",
            "content_id": content_id,
            "studio": studio,
            "royalty_rate": royalty_rate,
            "rate_per_play": rate_per_play,
            "territory": territory,
            "start_date": str(start_date),
            "end_date": str(end_date),
            "tier_threshold": tier_threshold,
            "tier_rate": tier_rate,
            "minimum_guarantees": minimum_guarantees,
        })

    path = os.path.join(DATA_DIR, "contracts_1000.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(contracts[0].keys()) + ["contract_text"])
        w.writeheader()
        for row in contracts:
            row_copy = dict(row)
            row_copy["territory"] = ",".join(row["territory"])
            text = f"DIGITAL LICENSE ROYALTY AGREEMENT: {row['contract_id']}\nTitle: {row['content_id']}\nTerm: {row['start_date']} to {row['end_date']}\nRate: ${row['rate_per_play']} per play."
            row_copy["contract_text"] = text
            w.writerow(row_copy)
    return contracts

def generate_streaming_logs(contracts):
    print(f"[*] Generating {TOTAL_PLAYS} streaming logs...")
    contract_map = {c["content_id"]: c for c in contracts}
    content_ids = [c["content_id"] for c in contracts]
    
    logs = []
    ts_start = datetime(2024, 1, 1)
    ts_end = datetime(2026, 3, 1)
    delta_seconds = int((ts_end - ts_start).total_seconds())

    for i in range(TOTAL_PLAYS):
        content_id = random.choice(content_ids)
        contract = contract_map[content_id]
        country = random.choice(contract["territory"])
        ts = ts_start + timedelta(seconds=random.randint(0, delta_seconds))
        plays = random.randint(100, 5000)

        logs.append({
            "play_id": f"PL{i + 1:08d}",
            "content_id": content_id,
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
            "country": country,
            "plays": plays,
            "user_type": random.choice(["premium", "free", "trial"]),
            "device": random.choice(["mobile", "desktop", "tv", "tablet"]),
        })

    path = os.path.join(DATA_DIR, "streaming_logs_100k.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=logs[0].keys())
        w.writeheader()
        w.writerows(logs)
    return logs

def generate_ledger(contracts, logs):
    print(f"[*] Generating payments ledger...")
    # Simplified aggregation for the example
    payments = []
    for i, contract in enumerate(contracts[:TOTAL_PAYMENTS]):
        payments.append({
            "payment_id": f"PAY{i + 1:06d}",
            "content_id": contract["content_id"],
            "contract_id": contract["contract_id"],
            "amount_paid": round(random.uniform(1000, 50000), 2),
            "payment_date": str(date.today()),
        })
    
    path = os.path.join(DATA_DIR, "payments_ledger.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=payments[0].keys())
        w.writeheader()
        w.writerows(payments)

# ────────────────────────────────────────────
# Lifecycle Manager
# ────────────────────────────────────────────
def main():
    print("=" * 60)
    print("  Digital License Royalty Auditor -- Data Lifecycle Manager")
    print("  Stack: Python + SQLite + CSV")
    print("=" * 60)
    
    # 1. Generate Metadata
    contracts = generate_contracts()
    logs = generate_streaming_logs(contracts)
    generate_ledger(contracts, logs)
    
    # 2. Seed SQLite
    print("\n[*] Seeding SQLite Database...")
    try:
        sys.path.append(os.path.join(os.path.dirname(__file__), "api"))
        import seed_sqlite
        seed_sqlite.seed()
    except Exception as e:
        print(f"[!] Seeding Error: {e}")
        import subprocess
        subprocess.run([sys.executable, os.path.join("api", "seed_sqlite.py")], check=True)

    print("\n" + "=" * 60)
    print("  Local Environment Ready!")
    print("=" * 60)

if __name__ == "__main__":
    main()
