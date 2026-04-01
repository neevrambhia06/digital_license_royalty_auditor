import os
import sys
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from api.database import SessionLocal
from api.agent_engine import AuditOrchestrator

def verify():
    db = SessionLocal()
    orchestrator = AuditOrchestrator(db)
    print("[*] Running full audit cycle...")
    result = orchestrator.run_full_audit()
    print(f"[*] Audit complete: {result}")
    
    # Check for territory violations
    from api.models import Violation
    viols = db.query(Violation).filter(Violation.violation_type == "TERRITORY_VIOLATION").all()
    print(f"[*] Territory Violations Found: {len(viols)}")
    for v in viols[:5]:
        print(f"    - {v.content_id}: {v.description} (Severity: {v.severity})")
    
    # Check for underpayments
    under = db.query(Violation).filter(Violation.violation_type.like("%UNDERPAYMENT%")).all()
    print(f"[*] Underpayments Found: {len(under)}")
    for u in under[:5]:
        print(f"    - {u.content_id}: {u.description}")

    db.close()

if __name__ == "__main__":
    verify()
