from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os

from .database import get_db, init_db
from .models import Contract, StreamingLog, PaymentLedger, AuditResult, Violation, AgentTrace
from .agent_engine import AuditOrchestrator

app = FastAPI(title="Digital License Royalty Auditor API")

# Update CORS for production and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    # Ensure tables exist on startup
    init_db()

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {"status": "ok", "database": "sqlite", "message": "Backend is running on Vercel"}

@app.post("/api/setup/generate")
async def generate_data_api():
    import subprocess
    import sys
    try:
        # Run the generate_seed_data.py script
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generate_seed_data.py")
        subprocess.run([sys.executable, script_path], check=True)
        return {"status": "success", "message": "Synthetic CSV data generated in /data directory"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/api/setup/seed")
async def seed_database_api():
    import subprocess
    import sys
    try:
        # Run the api/seed_sqlite.py script
        script_path = os.path.join(os.path.dirname(__file__), "seed_sqlite.py")
        subprocess.run([sys.executable, script_path], check=True)
        return {"status": "success", "message": "SQLite database seeded from /data/*.csv"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Seeding failed: {str(e)}")

# ─────────────────────────────────────────────
# Audit Engine Endpoints
# ─────────────────────────────────────────────

@app.post("/api/audit/run")
async def run_audit(background_tasks: BackgroundTasks):
    from .database import SessionLocal
    db = SessionLocal()
    try:
        orchestrator = AuditOrchestrator(db)
        # Process in background and return run_id immediately
        def background_audit():
            try:
                orchestrator.run_full_audit()
            finally:
                db.close()
        
        background_tasks.add_task(background_audit)
        return {"run_id": orchestrator.run_id, "status": "started"}
    except Exception as e:
        if db: db.close()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    total_contracts = db.query(Contract).count()
    total_logs = db.query(StreamingLog).count()
    total_audits = db.query(AuditResult).count()
    total_violations = db.query(Violation).count()
    
    # Calculate Total Leakage
    from sqlalchemy import func
    leakage = db.query(func.sum(AuditResult.difference)).filter(AuditResult.difference > 0).scalar() or 0
    overpayment = db.query(func.sum(AuditResult.difference)).filter(AuditResult.difference < 0).scalar() or 0
    
    return {
        "contracts": total_contracts,
        "logs": total_logs,
        "audits": total_audits,
        "violations": total_violations,
        "leakage": round(float(leakage), 2),
        "overpayment": round(abs(float(overpayment)), 2)
    }

# ─────────────────────────────────────────────
# Data Fetching Endpoints
# ─────────────────────────────────────────────

@app.get("/api/contracts")
async def get_contracts(db: Session = Depends(get_db), limit: int = 100):
    return db.query(Contract).limit(limit).all()

@app.get("/api/logs")
async def get_logs(content_id: Optional[str] = None, db: Session = Depends(get_db), limit: int = 100):
    query = db.query(StreamingLog)
    if content_id:
        query = query.filter(StreamingLog.content_id == content_id)
    return query.order_by(StreamingLog.timestamp.desc()).limit(limit).all()

@app.get("/api/payments")
async def get_payments(content_id: Optional[str] = None, db: Session = Depends(get_db), limit: int = 100):
    query = db.query(PaymentLedger)
    if content_id:
        query = query.filter(PaymentLedger.content_id == content_id)
    return query.limit(limit).all()

@app.get("/api/audit-results")
async def get_audit_results(content_id: Optional[str] = None, db: Session = Depends(get_db), limit: int = 100):
    from sqlalchemy.orm import joinedload
    query = db.query(AuditResult).options(joinedload(AuditResult.contract))
    if content_id:
        query = query.filter(AuditResult.content_id == content_id)
    results = query.limit(limit).all()
    
    # Flatten or structure for frontend
    frontend_results = []
    for r in results:
        res_dict = {
            "audit_id": r.audit_id,
            "contract_id": r.contract_id,
            "content_id": r.content_id,
            "expected_payment": r.expected_payment,
            "actual_payment": r.actual_payment,
            "difference": r.difference,
            "violation_type": r.violation_type,
            "is_violation": r.is_violation,
            "audited_at": r.audited_at,
            "studio": r.contract.studio if r.contract else "Unknown"
        }
        frontend_results.append(res_dict)
    
    return frontend_results

@app.get("/api/violations")
async def get_violations(db: Session = Depends(get_db), limit: int = 100):
    return db.query(Violation).order_by(Violation.detected_at.desc()).limit(limit).all()

@app.get("/api/traces")
async def get_traces(run_id: Optional[str] = None, db: Session = Depends(get_db), limit: int = 50):
    query = db.query(AgentTrace)
    if run_id:
        query = query.filter(AgentTrace.run_id == run_id)
    return query.order_by(AgentTrace.timestamp.asc()).limit(limit).all()

@app.get("/api/usage/aggregation")
async def get_usage_aggregation(db: Session = Depends(get_db)):
    from sqlalchemy import func
    results = db.query(
        StreamingLog.content_id,
        func.sum(StreamingLog.plays).label("total_plays"),
        func.min(StreamingLog.timestamp).label("min_date"),
        func.max(StreamingLog.timestamp).label("max_date"),
        # Get list of countries? SQLAlchemy doesn't do this easily in SQLite. 
        # We'll just return the counts for now.
    ).group_by(StreamingLog.content_id).order_by(func.sum(StreamingLog.plays).desc()).all()
    
    return [{
        "content_id": r.content_id,
        "total_plays": r.total_plays,
        "date_range": {"min": r.min_date, "max": r.max_date},
        "countries": [] # Will be lazy-loaded or fetched separately
    } for r in results]
