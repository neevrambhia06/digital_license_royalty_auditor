"""
generate_seed_data.py
=====================
Generates CSV seed data for the Digital License Royalty Auditor.

Outputs:
  - data/contracts_1000.csv
  - data/streaming_logs_100k.csv
  - data/payments_ledger.csv

Run:
  python generate_seed_data.py
"""

import csv
import json
import os
import random
import math
from datetime import date, timedelta, datetime

# ────────────────────────────────────────────
# Reproducibility
# ────────────────────────────────────────────
random.seed(42)

# ────────────────────────────────────────────
# Load config
# ────────────────────────────────────────────
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "config.json")
with open(CONFIG_PATH) as f:
    CFG = json.load(f)

TERRITORIES = CFG["territories"]
STUDIOS = CFG["studios"]
CONTENT_DIST = CFG["content_distribution"]  # {"Movie": 500, "Show": 300, "Music": 200}
VIOLATION_RATES = CFG["violation_rates"]
LEAKAGE_TARGET = CFG["leakage_target_usd"]
TOTAL_CONTRACTS = CFG["total_contracts"]
TOTAL_PLAYS = CFG["total_plays"]
TOTAL_PAYMENTS = CFG["total_payments"]

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)


# ────────────────────────────────────────────
# Build content ID pool
# ────────────────────────────────────────────
def build_content_ids():
    ids = []
    for prefix, count in CONTENT_DIST.items():
        for i in range(1, count + 1):
            ids.append(f"{prefix}_{i:03d}")
    return ids


CONTENT_IDS = build_content_ids()  # 1000 total


# ============================================
# 1.  CONTRACTS
# ============================================
def generate_contracts():
    print(f"Generating {TOTAL_CONTRACTS} contracts...")
    contracts = []
    shuffled_ids = CONTENT_IDS[:]
    random.shuffle(shuffled_ids)

    for i in range(TOTAL_CONTRACTS):
        content_id = shuffled_ids[i]
        studio = STUDIOS[i % len(STUDIOS)]

        royalty_rate = round(random.uniform(0.08, 0.18), 4)
        rate_per_play = round(random.uniform(0.01, 0.05), 4)
        tier_threshold = random.choice([50000, 75000, 100000, 150000, 200000])
        tier_rate = round(rate_per_play * 0.85, 4)

        num_territories = random.randint(2, 5)
        territory = random.sample(TERRITORIES, num_territories)

        start_date = date(2023, 1, 1) + timedelta(days=random.randint(0, 730))
        contract_months = random.randint(12, 36)
        end_date = start_date + timedelta(days=contract_months * 30)

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
        })

    path = os.path.join(DATA_DIR, "contracts_1000.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=contracts[0].keys())
        w.writeheader()
        for row in contracts:
            row_copy = dict(row)
            # Store territory as PostgreSQL array literal
            row_copy["territory"] = "{" + ",".join(row["territory"]) + "}"
            w.writerow(row_copy)

    print(f"  -> {path}  ({len(contracts)} rows)")
    return contracts


# ============================================
# 2.  STREAMING LOGS
# ============================================
def generate_streaming_logs(contracts):
    print(f"Generating {TOTAL_PLAYS} streaming log rows...")
    contract_map = {c["content_id"]: c for c in contracts}
    content_ids = [c["content_id"] for c in contracts]

    # Weighted distribution: top 10% of content gets 60% of plays
    n = len(content_ids)
    top_n = max(1, n // 10)
    weights = []
    for i in range(n):
        weights.append(6.0 if i < top_n else (4.0 / 9.0))
    total_w = sum(weights)
    weights = [w / total_w for w in weights]

    logs = []
    ts_start = datetime(2024, 1, 1)
    ts_end = datetime(2026, 3, 1)
    delta_seconds = int((ts_end - ts_start).total_seconds())

    user_types = ["premium", "free", "trial"]
    user_weights = [60, 30, 10]
    devices = ["mobile", "desktop", "tv", "tablet"]
    device_weights = [45, 30, 15, 10]

    territory_violation_count = int(TOTAL_PLAYS * VIOLATION_RATES["territory_violation"])
    expired_violation_count = int(TOTAL_PLAYS * VIOLATION_RATES["expired_license"])

    territory_violation_indices = set(random.sample(range(TOTAL_PLAYS), territory_violation_count))
    expired_violation_indices = set(random.sample(
        [i for i in range(TOTAL_PLAYS) if i not in territory_violation_indices],
        expired_violation_count
    ))

    for i in range(TOTAL_PLAYS):
        # Weighted content selection
        r = random.random()
        cumulative = 0
        chosen_idx = 0
        for idx, w in enumerate(weights):
            cumulative += w
            if r <= cumulative:
                chosen_idx = idx
                break
        content_id = content_ids[chosen_idx]
        contract = contract_map[content_id]

        # Determine country
        if i in territory_violation_indices:
            # Pick a country NOT in the contract territory
            outside = [c for c in TERRITORIES if c not in contract["territory"]]
            country = random.choice(outside) if outside else random.choice(TERRITORIES)
        else:
            country = random.choice(contract["territory"])

        # Determine timestamp
        if i in expired_violation_indices:
            # Timestamp after contract end_date
            end_dt = datetime.strptime(contract["end_date"], "%Y-%m-%d")
            after_end = end_dt + timedelta(days=random.randint(1, 180))
            # Clamp to ts_end
            if after_end > ts_end:
                after_end = ts_end - timedelta(days=random.randint(1, 30))
            ts = after_end
        else:
            ts = ts_start + timedelta(seconds=random.randint(0, delta_seconds))

        plays = random.randint(100, 5000)
        user_type = random.choices(user_types, weights=user_weights, k=1)[0]
        device = random.choices(devices, weights=device_weights, k=1)[0]

        logs.append({
            "play_id": f"PL{i + 1:08d}",
            "content_id": content_id,
            "timestamp": ts.strftime("%Y-%m-%dT%H:%M:%S+00:00"),
            "country": country,
            "plays": plays,
            "user_type": user_type,
            "device": device,
        })

    path = os.path.join(DATA_DIR, "streaming_logs_100k.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=logs[0].keys())
        w.writeheader()
        w.writerows(logs)

    print(f"  -> {path}  ({len(logs)} rows)")
    return logs


# ============================================
# 3.  PAYMENT LEDGER
# ============================================
def generate_payments(contracts, logs):
    print(f"Generating ~{TOTAL_PAYMENTS} payment ledger rows...")
    contract_map = {c["content_id"]: c for c in contracts}

    # Aggregate plays per content_id per month
    agg = {}
    for log in logs:
        cid = log["content_id"]
        month = log["timestamp"][:7]  # YYYY-MM
        key = (cid, month)
        agg[key] = agg.get(key, 0) + log["plays"]

    payments = []
    total_leakage = 0.0
    idx = 0

    # Sort for determinism
    sorted_keys = sorted(agg.keys())

    # Determine which payment indices get errors
    n_payments = len(sorted_keys)
    n_underpay = int(n_payments * VIOLATION_RATES["underpayment"])
    n_overpay = int(n_payments * VIOLATION_RATES["overpayment"])

    underpay_indices = set(random.sample(range(n_payments), n_underpay))
    remaining = [i for i in range(n_payments) if i not in underpay_indices]
    overpay_indices = set(random.sample(remaining, n_overpay))

    for i, (content_id, month) in enumerate(sorted_keys):
        contract = contract_map.get(content_id)
        if not contract:
            continue

        total_plays = agg[(content_id, month)]

        # Compute expected payment using tiered formula
        threshold = contract["tier_threshold"]
        base_rate = contract["rate_per_play"]
        tier_rate = contract["tier_rate"]

        if total_plays <= threshold:
            expected = total_plays * base_rate
        else:
            expected = (threshold * base_rate) + ((total_plays - threshold) * tier_rate)

        expected = round(expected, 2)

        # Inject leakage
        if i in underpay_indices:
            discount = random.uniform(0.10, 0.25)
            amount_paid = round(expected * (1 - discount), 2)
            leakage = expected - amount_paid
            total_leakage += leakage
        elif i in overpay_indices:
            surplus = random.uniform(0.05, 0.15)
            amount_paid = round(expected * (1 + surplus), 2)
        else:
            amount_paid = expected

        # Payment date: end of the accounting month
        year, m = int(month.split("-")[0]), int(month.split("-")[1])
        if m == 12:
            pay_date = date(year, 12, 31)
        else:
            pay_date = date(year, m + 1, 1) - timedelta(days=1)

        payments.append({
            "payment_id": f"PAY{idx + 1:06d}",
            "content_id": content_id,
            "contract_id": contract["contract_id"],
            "amount_paid": amount_paid,
            "payment_date": str(pay_date),
        })
        idx += 1

    # Scale underpayments to hit the leakage target if needed
    if total_leakage < LEAKAGE_TARGET * 0.8:
        scale_factor = LEAKAGE_TARGET / max(total_leakage, 1)
        for i, p in enumerate(payments):
            if i in underpay_indices:
                key = (p["content_id"], str(p["payment_date"])[:7])
                expected_val = agg.get(key, 0) * contract_map[p["content_id"]]["rate_per_play"]
                new_discount = random.uniform(0.15, 0.35)
                p["amount_paid"] = round(expected_val * (1 - new_discount), 2)

    path = os.path.join(DATA_DIR, "payments_ledger.csv")
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=payments[0].keys())
        w.writeheader()
        w.writerows(payments)

    print(f"  -> {path}  ({len(payments)} rows)")
    print(f"  -> Estimated leakage: ${total_leakage:,.2f}")
    return payments


# ============================================
# Main
# ============================================
def main():
    print("=" * 60)
    print("  Digital License Royalty Auditor -- Seed Data Generator")
    print("=" * 60)
    print()

    contracts = generate_contracts()
    logs = generate_streaming_logs(contracts)
    payments = generate_payments(contracts, logs)

    print()
    print("=" * 60)
    print("  Summary")
    print("=" * 60)
    print(f"  Contracts:      {len(contracts):>10,}")
    print(f"  Streaming Logs: {len(logs):>10,}")
    print(f"  Payments:       {len(payments):>10,}")
    print(f"  Output dir:     {os.path.abspath(DATA_DIR)}")
    print("=" * 60)
    print()
    print("Next step: python seed_supabase.py")


if __name__ == "__main__":
    main()
