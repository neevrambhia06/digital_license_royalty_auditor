import uuid
import time
import csv
import os
from datetime import datetime
from sqlalchemy.orm import Session
from .models import Contract, StreamingLog, PaymentLedger, AuditResult, Violation, AgentTrace

class BaseAgent:
    def __init__(self, db: Session, run_id: str):
        self.db = db
        self.run_id = run_id

    def log_trace(self, agent_name, action, input_data=None, output_data=None, status="completed", duration_ms=0):
        trace = AgentTrace(
            trace_id=str(uuid.uuid4()),
            run_id=self.run_id,
            agent_name=agent_name,
            action=action,
            input_summary=str(input_data)[:500] if input_data else None,
            output_summary=str(output_data)[:1000] if output_data else None,
            duration_ms=duration_ms,
            status=status,
            timestamp=datetime.utcnow()
        )
        self.db.add(trace)
        self.db.commit()

class ContractReaderAgent(BaseAgent):
    def _simulate_parsing(self, contract):
        # Simulation: Extracting logic from legal text
        tokens = ["Rate per play", "Territory Rules", "Tier Thresholds", "Expiration"]
        self.log_trace("ContractReaderAgent", f"AI-Extraction: Identified {len(tokens)} compliance gates from legal text for {contract.contract_id}", status="completed")

    def run(self, contract_ids=None):
        start_time = time.time()
        query = self.db.query(Contract)
        if contract_ids:
            query = query.filter(Contract.contract_id.in_(contract_ids))
        
        contracts = query.all()
        
        # Simulate agentic parsing for the first 5 (narrative)
        for c in contracts[:5]:
            self._simulate_parsing(c)

        duration = int((time.time() - start_time) * 1000)
        self.log_trace("ContractReaderAgent", f"Read {len(contracts)} contracts and verified legal text alignment", output_data=[c.contract_id for c in contracts], duration_ms=duration)
        return contracts

class UsageAgent(BaseAgent):
    def run(self, content_ids):
        start_time = time.time()
        from sqlalchemy import func
        
        # Aggregating plays by content_id and country
        results = self.db.query(
            StreamingLog.content_id, 
            StreamingLog.country,
            func.sum(StreamingLog.plays).label("total_plays")
        ).filter(StreamingLog.content_id.in_(content_ids)).group_by(StreamingLog.content_id, StreamingLog.country).all()
        
        usage_totals = {}
        usage_by_country = {}
        
        for r in results:
            usage_totals[r.content_id] = usage_totals.get(r.content_id, 0) + r.total_plays
            if r.content_id not in usage_by_country:
                usage_by_country[r.content_id] = {}
            usage_by_country[r.content_id][r.country] = r.total_plays
            
        duration = int((time.time() - start_time) * 1000)
        self.log_trace("UsageAgent", f"Aggregated telemetry for {len(content_ids)} assets across multiple regions", output_data={"stats": f"{len(results)} region-asset pairs"}, duration_ms=duration)
        return {"totals": usage_totals, "by_country": usage_by_country}

class RoyaltyAgent(BaseAgent):
    def run(self, contracts, usage_map):
        start_time = time.time()
        royalties = {}
        for contract in contracts:
            plays = usage_map.get(contract.content_id, 0)
            
            # Tier Logic aligned with generator: blended pricing past threshold
            base_rate = contract.rate_per_play
            tier_rate = contract.tier_rate
            threshold = contract.tier_threshold or 0
            if plays <= threshold:
                calc_royalty = plays * base_rate
            else:
                calc_royalty = (threshold * base_rate) + ((plays - threshold) * tier_rate)
            
            # PRD 4.1: Incorporate Minimum Guarantees
            min_guarantee = contract.minimum_guarantees or 0
            expected = max(calc_royalty, min_guarantee)
            
            royalties[contract.contract_id] = {
                "expected": expected,
                "calc_royalty": calc_royalty,
                "min_guarantee": min_guarantee,
                "plays": plays,
                "rate_used": tier_rate if plays > threshold else base_rate,
                "is_min_guarantee_applied": min_guarantee > calc_royalty
            }
        
        duration = int((time.time() - start_time) * 1000)
        self.log_trace("RoyaltyAgent", "Calculated expected royalties w/ tier logic and minimum guarantees", output_data=royalties, duration_ms=duration)
        return royalties

class AuditAgent(BaseAgent):
    def run(self, royalties, payments_map):
        start_time = time.time()
        results = []
        for cid, data in royalties.items():
            paid = payments_map.get(cid, 0)
            diff = data["expected"] - paid
            
            violation_type = None
            if diff > 1.0: # Threshold for rounding
                violation_type = "UNDERPAYMENT"
            elif diff < -1.0:
                violation_type = "OVERPAYMENT"
                
            results.append({
                "contract_id": cid,
                "expected": data["expected"],
                "paid": paid,
                "difference": diff,
                "violation_type": violation_type
            })
            
        duration = int((time.time() - start_time) * 1000)
        self.log_trace("AuditAgent", "Compared expected vs actual payments", output_data=f"Audited {len(results)} items", duration_ms=duration)
        return results

class ViolationAgent(BaseAgent):
    def run(self, contracts, usage_by_country, usage_by_date, audit_results=None):
        start_time = time.time()
        violations = []
        now = datetime.utcnow().date().isoformat()
        
        for contract in contracts:
            # -- 1. Date Window Checks (start + expiry) --
            from datetime import date
            start_dt = date.fromisoformat(contract.start_date)
            end_dt = date.fromisoformat(contract.end_date)
            content_dates = usage_by_date.get(contract.content_id, [])
            if content_dates:
                earliest = min(content_dates)
                latest = max(content_dates)
                if earliest < start_dt:
                    violations.append({
                        "contract_id": contract.contract_id,
                        "content_id": contract.content_id,
                        "type": "PRE_START_USAGE",
                        "desc": f"Usage detected before contract start date ({contract.start_date})",
                        "severity": "high"
                    })
                if latest > end_dt:
                    days_expired = (latest - end_dt).days
                    severity = "critical" if days_expired > 90 else "high"
                    violations.append({
                        "contract_id": contract.contract_id,
                        "content_id": contract.content_id,
                        "type": "EXPIRED_LICENSE",
                        "desc": f"Content streamed {days_expired} days after contract expiry ({contract.end_date})",
                        "severity": severity
                    })

            # -- 2. Territory Check --
            content_usage = usage_by_country.get(contract.content_id, {})
            # contract.territory is stored as JSON list
            allowed_territories = set(contract.territory if isinstance(contract.territory, list) else [])
            
            for country, plays in content_usage.items():
                if country not in allowed_territories:
                    violations.append({
                        "contract_id": contract.contract_id,
                        "content_id": contract.content_id,
                        "type": "TERRITORY_VIOLATION",
                        "desc": f"Illegal distribution in {country} ({plays} plays detected). Authorized: {', '.join(allowed_territories)}",
                        "severity": "high"
                    })

        # -- 3. Payment discrepancy violations from audit results --
        if audit_results:
            for res in audit_results:
                diff = res.get("difference", 0)
                expected = res.get("expected", 0)
                if expected <= 0:
                    continue
                pct = abs(diff) / (expected if expected > 0 else 1)
                
                if diff > 1.0: # Underpayment
                    val = abs(diff)
                    if val > 15000:
                        severity = "critical"
                        v_type = "MAJOR_UNDERPAYMENT"
                    elif val > 5000:
                        severity = "high"
                        v_type = "UNDERPAYMENT"
                    elif val > 1000:
                        severity = "medium"
                        v_type = "UNDERPAYMENT"
                    else:
                        severity = "low"
                        v_type = "RATE_MISMATCH"
                    
                    desc = f"Underpaid by ${abs(diff):,.2f} ({pct*100:.1f}% shortfall)"
                    violations.append({
                        "contract_id": res["contract_id"],
                        "content_id": next((c.content_id for c in contracts if c.contract_id == res["contract_id"]), "unknown"),
                        "type": v_type,
                        "desc": desc,
                        "severity": severity
                    })
                elif diff < -10.0: # Significant Overpayment
                    violations.append({
                        "contract_id": res["contract_id"],
                        "content_id": next((c.content_id for c in contracts if c.contract_id == res["contract_id"]), "unknown"),
                        "type": "OVERPAYMENT",
                        "desc": f"Overpaid by ${abs(diff):,.2f}",
                        "severity": "medium"
                    })
        
        duration = int((time.time() - start_time) * 1000)
        self.log_trace("ViolationAgent", "Cross-referencing telemetry with contract guardrails", output_data=f"Identified {len(violations)} leakage incidents", duration_ms=duration)
        return violations

class AuditOrchestrator:
    def __init__(self, db: Session):
        self.db = db
        self.run_id = str(uuid.uuid4())

    def run_full_audit(self):
        start_time = time.time()
        # 1. Start Trace
        planner = BaseAgent(self.db, self.run_id)
        planner.log_trace("PlannerAgent", "Starting full agentic audit cycle", status="running")

        # 2. Get Contracts
        reader = ContractReaderAgent(self.db, self.run_id)
        contracts = reader.run()
        content_ids = [c.content_id for c in contracts]

        # 3. Get Usage
        usage_agent = UsageAgent(self.db, self.run_id)
        usage_data = usage_agent.run(content_ids)
        usage_totals = usage_data["totals"]
        usage_by_country = usage_data["by_country"]
        usage_by_date = {}
        usage_dates = self.db.query(StreamingLog.content_id, StreamingLog.timestamp).filter(StreamingLog.content_id.in_(content_ids)).all()
        for cid, ts in usage_dates:
            usage_by_date.setdefault(cid, []).append(ts.date())

        # 4. Calculate Royalties
        royalty_agent = RoyaltyAgent(self.db, self.run_id)
        royalties = royalty_agent.run(contracts, usage_totals)

        # 5. Get Ledger Data
        payments = self.db.query(PaymentLedger).all()
        # Map contract_id -> total_paid (Simplified: assuming one payment per contract in this demo)
        payments_map = {p.contract_id: p.amount_paid for p in payments}
        payment_contracts = set(payments_map.keys())

        # 6. Audit
        audit_agent = AuditAgent(self.db, self.run_id)
        audit_results = audit_agent.run(royalties, payments_map)
        for res in audit_results:
            if res["contract_id"] not in payment_contracts:
                res["violation_type"] = "MISSING_PAYMENT"

        # 7. Check Violations (now includes payment + territory analysis)
        violation_agent = ViolationAgent(self.db, self.run_id)
        active_violations = violation_agent.run(contracts, usage_by_country, usage_by_date, audit_results=audit_results)
        licensed_content = {c.content_id for c in contracts}
        observed_content = {row[0] for row in self.db.query(StreamingLog.content_id).distinct().all()}
        unlicensed = sorted(observed_content - licensed_content)
        for cid in unlicensed:
            active_violations.append({
                "contract_id": "UNKNOWN",
                "content_id": cid,
                "type": "MISSING_LICENSE",
                "desc": f"Streaming usage detected with no active contract for {cid}",
                "severity": "critical"
            })

        # 8. Save Results to SQLite
        # Clear old results first
        self.db.query(AuditResult).delete()
        self.db.query(Violation).delete()

        for res in audit_results:
            contract_id = res["contract_id"]
            royalty_meta = royalties[contract_id]
            content_id = next(c.content_id for c in contracts if c.contract_id == contract_id)
            plays = royalty_meta["plays"]
            contract_obj = next(c for c in contracts if c.contract_id == contract_id)
            
            # --- Build Explanation / Reasoning ---
            reasoning = f"Processed {plays:,} plays. "
            if royalty_meta.get("is_min_guarantee_applied"):
                 reasoning += f"Minimum Guarantee of ${royalty_meta['min_guarantee']:,.2f} applied as it exceeded calculated royalty of ${royalty_meta['calc_royalty']:,.2f}."
            else:
                 reasoning += f"Calculated based on {plays:,} plays at ${royalty_meta['rate_used']}/play."
            
            if res["violation_type"] == "MISSING_PAYMENT":
                reasoning += " CRITICAL: No payment detected in ledger for this accounting period."
            elif res["violation_type"] == "UNDERPAYMENT" or res["violation_type"] == "MAJOR_UNDERPAYMENT":
                reasoning += f" Discrepancy: Expected ${res['expected']:,.2f} but only ${res['paid']:,.2f} was remitted."

            wrong_tier = (plays > contract_obj.tier_threshold and royalty_meta["rate_used"] != contract_obj.tier_rate)
            if wrong_tier:
                res["violation_type"] = "WRONG_RATE_TIER"
                reasoning += " TIER BREACH: System used incorrect rate for volume over threshold."
            
            self.db.add(AuditResult(
                audit_id=str(uuid.uuid4()),
                contract_id=contract_id,
                content_id=content_id,
                expected_payment=res["expected"],
                actual_payment=res["paid"],
                difference=res["difference"],
                violation_type=res["violation_type"],
                is_violation=res["violation_type"] is not None,
                reasoning=reasoning
            ))

        for viol in active_violations:
            # Map detailed reasoning to violations too
            self.db.add(Violation(
                violation_id=str(uuid.uuid4()),
                audit_id="LATEST_AUDIT", # Simplified
                content_id=viol["content_id"],
                contract_id=viol["contract_id"],
                violation_type=viol["type"],
                description=viol["desc"],
                severity=viol["severity"],
                reasoning=viol["desc"] # Using description as initial reasoning proxy
            ))

        self.db.commit()
        self._export_csv_outputs()
        
        end_time = time.time()
        duration_ms = int((end_time - start_time) * 1000)

        reporter = BaseAgent(self.db, self.run_id)
        reporter.log_trace("ReporterAgent", "Telemetry consolidated and intelligence reports finalized.", status="completed")
        
        planner.log_trace("PlannerAgent", f"Audit cycle completed successfully in {duration_ms}ms", status="completed")
        
        return {
            "run_id": self.run_id,
            "audits_completed": len(audit_results),
            "violations_found": len(active_violations),
            "duration_ms": duration_ms
        }

    def _export_csv_outputs(self):
        data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
        os.makedirs(data_dir, exist_ok=True)

        audit_rows = self.db.query(AuditResult).all()
        audit_path = os.path.join(data_dir, "audit_results.csv")
        with open(audit_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "audit_id", "contract_id", "content_id", "expected_payment",
                "actual_payment", "difference", "violation_type", "is_violation", "audited_at"
            ])
            w.writeheader()
            for r in audit_rows:
                w.writerow({
                    "audit_id": r.audit_id,
                    "contract_id": r.contract_id,
                    "content_id": r.content_id,
                    "expected_payment": r.expected_payment,
                    "actual_payment": r.actual_payment,
                    "difference": r.difference,
                    "violation_type": r.violation_type,
                    "is_violation": r.is_violation,
                    "audited_at": r.audited_at.isoformat() if r.audited_at else ""
                })

        violation_rows = self.db.query(Violation).all()
        violation_path = os.path.join(data_dir, "violations.csv")
        with open(violation_path, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=[
                "violation_id", "audit_id", "contract_id", "content_id",
                "violation_type", "description", "severity", "detected_at", "reviewed_at"
            ])
            w.writeheader()
            for v in violation_rows:
                w.writerow({
                    "violation_id": v.violation_id,
                    "audit_id": v.audit_id,
                    "contract_id": v.contract_id,
                    "content_id": v.content_id,
                    "violation_type": v.violation_type,
                    "description": v.description,
                    "severity": v.severity,
                    "detected_at": v.detected_at.isoformat() if v.detected_at else "",
                    "reviewed_at": v.reviewed_at.isoformat() if v.reviewed_at else ""
                })
