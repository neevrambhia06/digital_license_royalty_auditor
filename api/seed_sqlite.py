import csv
import os
import sys
from datetime import datetime

# Add parent directory to sys.path to allow importing from api
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.database import SessionLocal, init_db, DB_PATH
from api.models import Contract, StreamingLog, PaymentLedger, AuditResult, Violation, AgentTrace

def parse_date(date_str):
    if not date_str:
        return None
    try:
        # Try ISO format first
        return datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        try:
            # Try YYYY-MM-DD
            return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None

def seed():
    print("[*] Initializing SQLite database...")
    # On Windows, we can't delete the file while it's in use by the FastAPI server.
    # We'll rely on the table truncation below instead.
    init_db()
    db = SessionLocal()
    
    # Robust pathing: Ensure we find the data directory relative to this script
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(current_dir)
    data_dir = os.path.join(project_root, "data")
    
    # 1. Clear existing data
    print("[*] Clearing existing data...")
    db.query(Violation).delete()
    db.query(AuditResult).delete()
    db.query(PaymentLedger).delete()
    db.query(StreamingLog).delete()
    db.query(Contract).delete()
    db.query(AgentTrace).delete()
    db.commit()
    
    # 2. Seed Contracts
    contracts_path = os.path.join(data_dir, "contracts_1000.csv")
    if os.path.exists(contracts_path):
        print(f"[*] Loading contracts from {contracts_path}...")
        with open(contracts_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                territory = row["territory"].split(",") if row["territory"] else []
                db.add(Contract(
                    contract_id=row["contract_id"],
                    content_id=row["content_id"],
                    studio=row["studio"],
                    royalty_rate=float(row["royalty_rate"]),
                    rate_per_play=float(row["rate_per_play"]),
                    territory=territory,
                    start_date=row["start_date"],
                    end_date=row["end_date"],
                    tier_threshold=int(row["tier_threshold"]),
                    tier_rate=float(row["tier_rate"]),
                    minimum_guarantees=float(row.get("minimum_guarantees", 0) or 0),
                    contract_text=row.get("contract_text", "")
                ))
        db.commit()

    # 3. Seed Logs
    logs_path = os.path.join(data_dir, "streaming_logs_100k.csv")
    if os.path.exists(logs_path):
        print(f"[*] Loading logs from {logs_path} (this may take a moment)...")
        with open(logs_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            batch = []
            count = 0
            for row in reader:
                ts = parse_date(row["timestamp"])
                batch.append(StreamingLog(
                    play_id=row["play_id"],
                    content_id=row["content_id"],
                    timestamp=ts,
                    country=row["country"],
                    plays=int(row["plays"]),
                    user_type=row["user_type"],
                    device=row["device"]
                ))
                count += 1
                if len(batch) >= 2000:
                    db.bulk_save_objects(batch)
                    db.commit()
                    batch = []
                    if count % 10000 == 0:
                        print(f"    -> Processed {count} logs...")
            if batch:
                db.bulk_save_objects(batch)
                db.commit()

    # 4. Seed Payments
    payments_path = os.path.join(data_dir, "payments_ledger.csv")
    if os.path.exists(payments_path):
        print(f"[*] Loading payments from {payments_path}...")
        with open(payments_path, encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                db.add(PaymentLedger(
                    payment_id=row["payment_id"],
                    content_id=row["content_id"],
                    contract_id=row["contract_id"],
                    amount_paid=float(row["amount_paid"]),
                    payment_date=row["payment_date"]
                ))
        db.commit()

    print("[*] Seeding complete!")
    db.close()

if __name__ == "__main__":
    seed()
