from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import shutil
import logging
from contextlib import asynccontextmanager

from database import get_db, init_db, IS_VERCEL, DB_PATH
from models import Contract, StreamingLog, PaymentLedger, AuditResult, Violation, AgentTrace
from agent_engine import AuditOrchestrator

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("[*] Application startup sequence initiated.")
    
    # Ensure database is in a writable location on Vercel
    if IS_VERCEL:
        original_db = os.path.join(os.path.dirname(__file__), "dlra_audit.db")
        try:
            # Check if we need to copy initial data to /tmp
            if os.path.exists(original_db):
                # Always copy if it doesn't exist, or if we want to ensure fresh data in /tmp
                # Vercel functions can be reused, so /tmp might persist for a short while.
                if not os.path.exists(DB_PATH):
                    logger.info(f"[*] Vercel detected: Copying bundled DB ({os.path.getsize(original_db)} bytes) to {DB_PATH}")
                    shutil.copy2(original_db, DB_PATH)
                    logger.info("[*] Copy completed successfully.")
                else:
                    logger.info(f"[*] Database already exists at {DB_PATH}, skipping copy.")
            else:
                logger.warning(f"[!] Warning: Bundled database not found at {original_db}")
        except Exception as e:
            logger.error(f"[!] Critical error during DB copy to /tmp: {str(e)}")
            # Do not raise here, let init_db try to create a new one, 
            # though it might fail if /tmp is somehow weird.
    
    # Ensure tables exist on startup
    try:
        init_db()
    except Exception as e:
        logger.error(f"[!] init_db failed: {str(e)}")
        # On Vercel, a startup crash will cause FUNCTION_INVOCATION_FAILED

    yield
    # --- Shutdown ---
    logger.info("[*] Application shutdown sequence initiated.")

app = FastAPI(
    title="Digital License Royalty Auditor API",
    lifespan=lifespan
)

# Update CORS for production and Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
@app.get("/health")
async def health_check():
    return {
        "status": "ok", 
        "database": "sqlite", 
        "is_vercel": IS_VERCEL,
        "db_path": DB_PATH,
        "db_exists": os.path.exists(DB_PATH),
        "message": "Backend is running"
    }

@app.post("/api/setup/generate")
async def generate_data_api():
    import subprocess
    import sys
    try:
        # Run the generate_data.py script (consolidated logic)
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "generate_data.py")
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
    from database import SessionLocal
    db = SessionLocal()
    try:
        orchestrator = AuditOrchestrator(db)
        # Process in background and return run_id immediately
        def background_audit():
            nonlocal db
            try:
                orchestrator.run_full_audit()
            except Exception as audit_err:
                logger.error(f"[!] Background Audit Failed: {audit_err}")
            finally:
                db.close()
        
        background_tasks.add_task(background_audit)
        return {"run_id": orchestrator.run_id, "status": "started"}
    except Exception as e:
        if db: db.close()
        logger.error(f"[!] Audit API Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats")
async def get_stats(db: Session = Depends(get_db)):
    try:
        total_contracts = db.query(Contract).count()
        total_logs = db.query(StreamingLog).count()
        total_audits = db.query(AuditResult).count()
        total_violations = db.query(Violation).count()
        
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
    except Exception as e:
        logger.error(f"Error fetching stats: {e}")
        raise HTTPException(status_code=500, detail="Database access error")

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
    ).group_by(StreamingLog.content_id).order_by(func.sum(StreamingLog.plays).desc()).all()
    
    return [{
        "content_id": r.content_id,
        "total_plays": r.total_plays,
        "date_range": {"min": r.min_date, "max": r.max_date},
        "countries": [] 
    } for r in results]
