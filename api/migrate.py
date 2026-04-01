import csv
import json
import os
from datetime import datetime
from sqlalchemy.orm import Session
from api.database import SessionLocal, init_db
from api.models import Contract, StreamingLog, PaymentLedger

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

def parse_territory(t_str):
    """Converts {US,CA} to ["US", "CA"]"""
    if not t_str: return []
    return [x.strip() for x in t_str.replace("{", "").replace("}", "").split(",") if x.strip()]

def migrate():
    # 1. Initialize DB
    init_db()
    db: Session = SessionLocal()
    
    try:
        # 2. Seed Contracts
        print("[*] Seeding Contracts...")
        contracts_path = os.path.join(DATA_DIR, "contracts_1000.csv")
        with open(contracts_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            contracts = []
            for row in reader:
                contracts.append(Contract(
                    contract_id=row["contract_id"],
                    content_id=row["content_id"],
                    studio=row["studio"],
                    royalty_rate=float(row["royalty_rate"]),
                    rate_per_play=float(row["rate_per_play"]),
                    territory=parse_territory(row["territory"]),
                    start_date=row["start_date"],
                    end_date=row["end_date"],
                    tier_threshold=int(row["tier_threshold"]),
                    tier_rate=float(row["tier_rate"]),
                    minimum_guarantees=float(row.get("minimum_guarantees", 0) or 0)
                ))
            db.bulk_save_objects(contracts)
            db.commit()
            print(f"  [+] Seeded {len(contracts)} contracts.")

        # 3. Seed Streaming Logs
        print("[*] Seeding Streaming Logs (This may take a moment)...")
        logs_path = os.path.join(DATA_DIR, "streaming_logs_100k.csv")
        with open(logs_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            logs = []
            count = 0
            for row in reader:
                logs.append(StreamingLog(
                    play_id=row["play_id"],
                    content_id=row["content_id"],
                    timestamp=datetime.fromisoformat(row["timestamp"].replace("Z", "+00:00")),
                    country=row["country"],
                    plays=int(row["plays"]),
                    user_type=row["user_type"],
                    device=row["device"]
                ))
                count += 1
                if count % 10000 == 0:
                    db.bulk_save_objects(logs)
                    db.commit()
                    logs = []
                    print(f"  ... seeded {count} logs")
            
            if logs:
                db.bulk_save_objects(logs)
                db.commit()
            print(f"  [+] Seeded {count} streaming logs.")

        # 4. Seed Payments
        print("[*] Seeding Payments...")
        payments_path = os.path.join(DATA_DIR, "payments_ledger.csv")
        with open(payments_path, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            payments = []
            for row in reader:
                payments.append(PaymentLedger(
                    payment_id=row["payment_id"],
                    content_id=row["content_id"],
                    contract_id=row["contract_id"],
                    amount_paid=float(row["amount_paid"]),
                    payment_date=row["payment_date"]
                ))
            db.bulk_save_objects(payments)
            db.commit()
            print(f"  [+] Seeded {len(payments)} payments.")

        print("\n[SUCCESS] Migration and seeding complete.")
        
    except Exception as e:
        db.rollback()
        print(f"[ERROR] Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
