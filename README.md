# Digital License Royalty Auditor (DLRA.SYS)

**A high-fidelity Audit Intelligence platform for detecting streaming royalty leakage at scale.**

Digital License Royalty Auditor (DLRA) is a full-stack application designed to solve the "Financial Leakage" problem in digital media. By cross-referencing multi-million record telemetry streams (100k+ logs) against complex, tiered royalty contracts, it identifies precisely where revenue is lost due to misapplied terms, expired licenses, or territorial violations.

---

## 🏗️ Architecture: The Agentic Core

Unlike a simple filter, DLRA uses a **Multi-Agent Audit Engine** in Python. The `AuditOrchestrator` simulates a pipeline of specialized agents:

1.  **ContractReaderAgent**: Parses legal text literals into compliance logic.
2.  **UsageAgent**: Aggregates raw telemetry (SQL-optimized) for content assets.
3.  **RoyaltyAgent**: Applies blended tier pricing & Minimum Guarantees (MGs).
4.  **AuditAgent**: Cross-checks expected vs. remitted payments from the ledger.
5.  **ViolationAgent**: Identifies territorial breaches & expired-license windows.

### Technical Stack
- **Backend**: FastAPI (Python 3.10+) + SQLAlchemy (SQLite)
- **Frontend**: React 18 + Vite + Framer Motion (Glassmorphism UI)
- **AI Integration**: Anthropic Claude-3 (Strategic Risk Analysis)
- **Data Engineering**: Custom Synthetic Generator (NumPy/Faker)

---

## 🚀 Quick Setup (Zero-Config)

### 1. Data Intelligence Setup
Generate the 100k+ record synthetic dataset and seed the SQLite database:
```bash
# Install dependencies
pip install -r requirements.txt

# Generate 100k+ streaming logs & seed SQLite
python generate_data.py
```

### 2. Backend Ignition
Launch the FastAPI server (Architecture is Vercel-ready with `/tmp` persistence):
```bash
# Start the API server
uvicorn api.index:app --reload
```

### 3. Frontend Terminal
The frontend uses a precision-grade "Bloomberg meets VS Code" design system:
```bash
cd frontend
npm install
npm run dev
```

---

## 🏆 Internship Demo Strategy

For a complete walkthrough of how to pitch this project in an interview, refer to the:
👉 [**INTERVIEW_GUIDE.md**](file:///d:/Projects/Cognify/digital_license_royalty_auditor/INTERVIEW_GUIDE.md)

---

*Built with precision for the 2026 Engineering Cohort - Cognify Labs.*
