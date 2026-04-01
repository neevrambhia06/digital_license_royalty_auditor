from sqlalchemy import Column, String, Float, Integer, Date, DateTime, Boolean, JSON, ForeignKey, Text
from sqlalchemy.orm import DeclarativeBase, relationship
from datetime import datetime

class Base(DeclarativeBase):
    pass

class Contract(Base):
    __tablename__ = "contracts"
    
    contract_id = Column(String, primary_key=True)
    content_id = Column(String, index=True, nullable=False)
    studio = Column(String, index=True, nullable=False)
    royalty_rate = Column(Float, nullable=False)
    rate_per_play = Column(Float, nullable=False)
    territory = Column(JSON, nullable=False)  # Store list as JSON text
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)
    tier_threshold = Column(Integer, default=100000)
    tier_rate = Column(Float, nullable=False)
    minimum_guarantees = Column(Float, default=0.0)
    contract_text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class StreamingLog(Base):
    __tablename__ = "streaming_logs"
    
    play_id = Column(String, primary_key=True)
    content_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, index=True, nullable=False)
    country = Column(String, index=True, nullable=False)
    plays = Column(Integer, default=1)
    user_type = Column(String, nullable=False) # free, premium, trial
    device = Column(String, nullable=False)    # mobile, desktop, tv, tablet

class PaymentLedger(Base):
    __tablename__ = "payment_ledger"
    
    payment_id = Column(String, primary_key=True)
    content_id = Column(String, index=True, nullable=False)
    contract_id = Column(String, ForeignKey("contracts.contract_id"), index=True)
    amount_paid = Column(Float, nullable=False)
    payment_date = Column(String, nullable=False)

class AuditResult(Base):
    __tablename__ = "audit_results"
    
    audit_id = Column(String, primary_key=True)
    contract_id = Column(String, ForeignKey("contracts.contract_id"), index=True)
    content_id = Column(String, index=True, nullable=False)
    expected_payment = Column(Float, nullable=False)
    actual_payment = Column(Float, nullable=False)
    difference = Column(Float, nullable=False)
    violation_type = Column(String) # UNDERPAYMENT, OVERPAYMENT, EXPIRED, TERRITORY, WRONG_TIER
    is_violation = Column(Boolean, default=False)
    reasoning = Column(Text) # Agent's logical explanation
    audited_at = Column(DateTime, default=datetime.utcnow)
    
    contract = relationship("Contract")

class Violation(Base):
    __tablename__ = "violations"
    
    violation_id = Column(String, primary_key=True)
    audit_id = Column(String, ForeignKey("audit_results.audit_id"), index=True)
    content_id = Column(String, nullable=False)
    contract_id = Column(String, nullable=False)
    violation_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(String, nullable=False) # low, medium, high, critical
    reasoning = Column(Text)  # Detailed agent explanation
    detected_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime)

class AgentTrace(Base):
    __tablename__ = "agent_traces"
    
    trace_id = Column(String, primary_key=True)
    run_id = Column(String, index=True, nullable=False)
    agent_name = Column(String, index=True, nullable=False)
    action = Column(String, nullable=False)
    input_summary = Column(Text)
    output_summary = Column(Text)
    duration_ms = Column(Integer)
    status = Column(String, default="running") # running, completed, error
    timestamp = Column(DateTime, default=datetime.utcnow)
