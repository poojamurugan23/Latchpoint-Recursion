<div align="center">

# LATCHPOINT

### **Pre-Commitment Financial Risk Intelligence**
*Autonomous behavioral risk evaluation, sequence modeling, and real-time gate interception.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600?style=flat-square)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-0.46-blue?style=flat-square)](https://shap.readthedocs.io)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)

<br/>

```
       [ Client Intent ]
               │
               ▼
   [ POST /transactions/prepare ] ───► Status: DRAFT (Ledger untouched)
               │
               ▼
   [ Real-Time Behavioral Ingest ] ──► Session Velocity, Pauses, Keystrokes
               │
               ▼
   [ 10-Txn Baseline & Feature Engine ]
               │
               ▼
   [ XGBoost Inference + SHAP Attribution ]
               │
               ▼
   [ Pre-Commitment Gate Interception ]
      ├── ALLOW  ──► Immediate execution (<200ms non-blocking toast)
      ├── VERIFY ──► In-flight step-up verification (OTP challenge)
      ├── HOLD   ──► Paced pause & compliance review routing
      └── BLOCK  ──► Severe irreversible anomaly intervention
               │
               ▼
   [ POST /transactions/confirm ] ───► Status: COMPLETED (Balance debited)
```

</div>

---

## Table of Contents
- [Executive Overview](#executive-overview)
- [The Paradigm Shift](#the-paradigm-shift)
- [Detection Engine: The 10-Transaction Personal Baseline](#detection-engine-the-10-transaction-personal-baseline)
- [Live Interactive Demo Scenarios](#live-interactive-demo-scenarios)
- [Design System v2: "White Studio"](#design-system-v2-white-studio)
- [System Architecture](#system-architecture)
- [API Reference](#api-reference)
- [Getting Started & Local Development](#getting-started--local-development)
- [Verification & Model Reproduction](#verification--model-reproduction)
- [Repository Structure](#repository-structure)

---

## Executive Overview

Legacy financial security systems evaluate transactions **in arrears** or rely exclusively on static rulebooks (e.g., daily velocity limits, device IP blocklists). These systems ask a binary question:  
> *"Is this transaction authorized and structurally valid?"*

**Latchpoint** reframes fraud and financial risk intelligence around pre-commitment behavioral dynamics:  
> *"Is committing to this action **right now** — given the user's sequential rhythm, counterparty network structure, and historical context — abnormally risky, even when credentials, device, and payload appear completely legitimate?"*

By decoupling transaction preparation (`DRAFT`) from commitment (`CONFIRM`), Latchpoint evaluates behavioral telemetry, sliding personal baselines, and counterparty graph linkages in the critical sub-second window before value moves.

---

## The Paradigm Shift

| Operational Dimension | Legacy Fraud Detection & AML | Latchpoint Pre-Commitment Intelligence |
|:---|:---|:---|
| **Intervention Point** | Post-execution batch or synchronous authorization webhook | **Pre-commitment window**: Between draft review and user confirmation |
| **Balance Impact** | Ledger debited first; chargebacks or clawbacks initiated upon breach | **Zero-balance mutation**: Funds never move until decision clears `ALLOW` or `VERIFIED` |
| **Behavioral Context** | Basic IP, location, and global aggregate limits | Real-time sequence pacing, in-form idle pauses (>4s), edit counts, back-navigations |
| **Baseline Resolution** | Broad population-level buckets (e.g., tier, geography) | **Sliding 10-transaction personal window** with dynamic cold-start blending |
| **Explainability** | Opaque binary risk scores with uninformative error codes | **SHAP TreeExplainer attribution** translated into deterministic plain-English rationale |
| **Friction Model** | Intrusive challenges applied indiscriminately | Proportional escalation: Silent `ALLOW` → Step-up `VERIFY` → Paced `HOLD` → Terminal `BLOCK` |

---

## Detection Engine: The 10-Transaction Personal Baseline

At the core of Latchpoint is a dynamic feature engineering pipeline that evaluates each pending transaction against the user's personal behavioral trajectory:

### 1. The Sliding Historical Window
On every risk evaluation (`POST /api/risk/evaluate/{id}`), Latchpoint queries the user's last 10 completed transactions (`status = "completed"` ordered by `created_at DESC`).

### 2. Cold-Start Blending Formula
To ensure high precision across both new and mature accounts:
- **0–2 Transactions (Low Confidence)**: Baseline relies primarily on population priors computed across the network ($\text{weight} = 0.3$).
- **3–9 Transactions (Medium Confidence)**: Blends personal statistics with population baselines using linear smoothing:
  $$\text{weight} = \min\left(\frac{N}{10}, 1.0\right)$$
- **10+ Transactions (High Confidence)**: Full autonomous personal baseline ($\text{weight} = 1.0$).

### 3. Feature Vector Formulation ($\vec{x} \in \mathbb{R}^{14}$)

```python
features = {
    # 1. Personal Baseline Deviations
    "deviation_ratio": (amount - mean_amount) / max(std_amount, mean_amount * 0.1),
    "is_new_payee": 1 if payee_id not in typical_payees else 0,
    "is_odd_hour": 1 if current_hour outside typical_hour_range(buffer=2) else 0,
    "baseline_confidence_score": 0.3 | 0.6 | 1.0,

    # 2. Cumulative Pacing & Velocity
    "exposure_today": float(sum_amount_today),
    "exposure_vs_baseline_ratio": exposure_today / max(baseline_daily_mean, 1000.0),
    "txn_count_today": int(count_today),

    # 3. Micro-Behavioral Sequence Telemetry
    "pause_count": int(client_side_idle_events_gt_4s),
    "edit_count": int(form_field_mutations),
    "back_navigation_count": int(review_to_edit_reversals),
    "time_in_flow_sec": float(session_duration_seconds),

    # 4. Network & Shared Structural Topography
    "device_shared_with_other_payees_count": int(payee_device_overlap_count),
    "recipient_is_new_device_pairing": int(is_unseen_device_link),
    "ip_is_vpn_or_proxy": 1 if proxy_detected else 0,

    # 5. Historical Context & Loss Streaks
    "repeat_pattern_negative_outcome": int(prior_symbol_or_payee_loss_count),
    "prior_negative_outcome_streak": int(consecutive_loss_streak),
}
```

### 4. ML Model & Explainability
- **Classifier**: Binary `XGBClassifier` trained on 2,000 synthetic behavioral profiles with controlled anomalous signal injection (AUC: ~0.98).
- **Attribution**: Model weights are packaged alongside an exact `shap.TreeExplainer` instance inside `model_artifact.pkl`.
- **Reasoning**: The top 3 absolute SHAP values map deterministically to verified, human-legible explanations without non-deterministic LLM hallucinations during live transactions.

---

## Live Interactive Demo Scenarios

The seeded demo environment (`demo@latchpoint.app` / `demo1234`) provides 10 clean completed baseline transfers (routine ₹1,800–₹2,300 utility payments).

Access the application via the **"Enter Live Demo →"** CTA on the landing page to run these scenarios:

```
──────────────────────────────────────────────────────────────────────────────────────────
SCENARIO      FLOW      ACTION SPECIFICATION              SIGNAL ENGINE             EXPECTED VERDICT
──────────────────────────────────────────────────────────────────────────────────────────
Clean 1       Transfer  ₹1,900 to "Rent - Sunview"        Standard amount, regular   ALLOW
                        (Checking account)                payee, routine hour       (Silent instant commit)

Clean 2       Transfer  ₹900 to "FiberNet Broadband"      Small routine utility,     ALLOW
                        (Checking account)                trusted counterparty      (Silent instant commit)

Drift         Transfer  ₹2,700 to "Rent - Sunview"        4th transfer today;        HOLD
                        (Checking account)                cumulative volume 6x      (Under review case created)
                                                          baseline

Network       Transfer  ₹3,500 to "QuickCash Transfers"   Payee device fingerprint   VERIFY
                        (Checking account)                shared with 2 other        (In-flight OTP step-up)
                                                          independent payees

Repeat-Loss   Trade     ₹12,000 on symbol "ZYX"           3 consecutive prior loss   BLOCK
                        (Trading account)                 trades on symbol ZYX      (Terminal block; ledger safe)
──────────────────────────────────────────────────────────────────────────────────────────
```

---

## Design System v2: "White Studio"

Latchpoint's visual layer is built upon an institutional **"White Studio"** aesthetic:

```
--bg:              #FFFFFF;   /* True white surface throughout */
--bg-subtle:       #FAFAFA;   /* Hover states, alternating table rows */
--surface:         #FFFFFF;   /* Elevation zero card backgrounds */
--border:          #EBEBEE;   /* 1px hairline border */
--border-strong:   #DCDCE2;   /* Focus rings, active dividers */

--ink-900:         #14141B;   /* Primary high-contrast typography */
--ink-600:         #63636D;   /* Secondary captions & labels */
--ink-400:         #9C9CA4;   /* Placeholder & muted meta */

--accent:          #23265C;   /* Deep ink-indigo (CTA, Wordmark, Active) */
--accent-hover:    #191B45;
--accent-tint:     #EEEEF5;   /* 6% accent tint for active navigation */

/* Semantic Risk Hierarchy (Strictly isolated to risk surfaces) */
--allow:      #227A4E;  --allow-bg:  #EAF6EE;
--verify:     #A8720F;  --verify-bg: #FBF1DF;
--hold:       #B0591F;  --hold-bg:   #FBEEE1;
--block:      #A93434;  --block-bg:  #FAEAEA;
```

### Strict Typography Hierarchy
- **Playfair Display**: Appears **only** in four deliberate locations:
  1. Wordmark *"Latchpoint"* (600, 20px)
  2. Landing Hero Headline (600, 40px/48px)
  3. Primary Page Titles `<h1>` (600, 28px/36px)
  4. Pre-Commitment Gate Verdict line (*"Before you continue"* / *"Verify it's you"*, 500, 22px/30px)
- **Montserrat**: Powers 95%+ of the interface:
  - Body Text: 400, 16px/24px
  - Form Labels & Subheads: 500, 14px/20px
  - Buttons: 600, 14px (letter-spacing 0.01em)
  - Eyebrows & Metadata: 600, 11px uppercase (letter-spacing 0.08em)

---

## System Architecture

```mermaid
graph TD
    subgraph Client ["Client Browser (React 19)"]
        UI["UI Surfaces (Transfer / Trade)"]
        ET["EventTrackerContext (Telemetry)"]
        AUTH["AuthContext (JWT + Session)"]
        MODAL["PreCommitmentGate Modal"]
    end

    subgraph Backend ["Application Layer (FastAPI)"]
        ROUTER["Routers (/api/*)"]
        DEP["Session & Device Resolver"]
        FE["Feature Engine (10-Txn Window)"]
        MODEL["XGBoost Risk Scorer"]
        SHAP_E["SHAP TreeExplainer"]
        DECIDE["Decision Engine (Policy Thresholds)"]
    end

    subgraph Data ["Persistence Layer (SQLite / PostgreSQL)"]
        DB_U[("Users & Accounts")]
        DB_T[("Transactions (Draft/Completed)")]
        DB_E[("Event Store (Telemetry)")]
        DB_D[("Device & Fingerprint Registry")]
        DB_C[("Compliance Cases")]
    end

    UI -->|1. POST /transactions/prepare| ROUTER
    ET -->|Telemetry Flush (2s)| ROUTER
    ROUTER --> DEP
    ROUTER -->|2. POST /risk/evaluate/:id| FE
    FE -->|Extracts Personal History| DB_T
    FE -->|Compiles Vector| MODEL
    MODEL --> SHAP_E
    SHAP_E --> DECIDE
    DECIDE -->|Verdict + Reasons| ROUTER
    ROUTER -->|ALLOW / VERIFY / HOLD / BLOCK| MODAL
    MODAL -->|Confirm Commitment| ROUTER
    ROUTER -->|Finalize & Debit Balance| DB_T
    ROUTER -->|Update Balance| DB_U
```

---

## API Reference

All routes are mounted under `/api`. Protected routes require standard `Authorization: Bearer <jwt>` headers.

### Authentication & Identity
| Method | Endpoint | Request Body | Response | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/api/auth/demo-login` | *None* | `{ token, user }` | **1-Click Demo Login**: Authenticates as `demo@latchpoint.app` directly. |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ token, user }` | Standard password authentication. |
| `POST` | `/api/auth/register` | `{ name, email, password }` | `{ token, user }` | Onboards a new user with baseline checking accounts. |
| `GET` | `/api/users/me` | *None* | `UserOut` | Returns current user profile, balance, and `is_demo` flag. |

### Transaction Lifecycle & Pre-Commitment Gate
| Method | Endpoint | Request Body | Response | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/api/transactions/prepare` | `{ type, amount, payee_id?, symbol? }` | `{ transaction_id, status: "draft" }` | Stage 1: Records pending draft. No money moves. |
| `POST` | `/api/risk/evaluate/{id}` | *None* | `RiskEvaluationResponse` | Stage 2: Runs feature engine & XGBoost model, returning SHAP reasons. |
| `POST` | `/api/transactions/{id}/step-up/verify` | `{ otp_code }` | `{ status: "completed" }` | Stage 3a: Validates mock 6-digit OTP challenge for `VERIFY`. |
| `POST` | `/api/transactions/{id}/confirm` | *None* | `{ status: "completed" }` | Stage 3b: Confirms commitment, marks completed, debits balance. |
| `POST` | `/api/transactions/{id}/cancel` | *None* | `{ status: "cancelled" }` | Aborts transaction; marks cancelled. |
| `GET` | `/api/transactions` | Query: `status`, `limit`, `offset` | `list[TransactionOut]` | Retrieves paginated historical commitments. |

### Telemetry, Payees & Analytics
| Method | Endpoint | Request Body | Response | Description |
|:---|:---|:---|:---|:---|
| `POST` | `/api/events` | `EventIn` or `list[EventIn]` | `202 Accepted` | Asynchronous batch ingestion of micro-behavioral events. |
| `GET` | `/api/payees` | *None* | `list[PayeeOut]` | Returns user's saved counterparty beneficiaries. |
| `POST` | `/api/payees` | `{ name, masked_account_number }` | `PayeeOut` | Creates and links a new payee. |
| `PATCH` | `/api/payees/{id}` | `{ is_trusted: bool }` | `PayeeOut` | Updates payee trust rating. |
| `GET` | `/api/kpi/summary` | *None* | `KpiSummary` | Returns aggregate metrics: lead times, accuracy, and prevented exposure. |

---

## Getting Started & Local Development

### Installation

```bash
# 1. Clone repository
git clone https://github.com/poojamurugan23/Latchpoint-Recursion.git
cd Latchpoint-Recursion

# 2. Python Environment Setup
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 3. Model Training & Database Seeding
python -m app.ml.generate_synthetic_data
python -m app.ml.train_model
python seed_demo_data.py

# 4. Frontend Setup
cd ../frontend
npm install
```

### Execution

#### Single-Command Run (from project root)
```bash
npm run dev
```

#### Individual Process Run
```bash
# Backend (Port 8000)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Frontend (Port 5173)
cd frontend
npm run dev
```

---

## Verification & Model Reproduction

To verify end-to-end operational integrity:

```bash
# Verify Frontend Production Compilation
cd frontend
npm run build    # Should complete with 0 errors in ~1.1s
npm run lint     # oxlint static analysis

# Verify Backend Auth & Demo-Login Contract
cd ../backend
./venv/bin/python -c "
from app.database import SessionLocal
from app.routers.auth import demo_login
db = SessionLocal()
res = demo_login(db)
print('Demo Login Verification:', res.user.email, 'Auth Token:', res.token[:15] + '...')
"
```

---

## Repository Structure

```
Latchpoint-Recursion/
├── README.md                           # Master architectural specification
├── package.json                        # Monorepo root scripts
├── backend/
│   ├── app/
│   │   ├── config.py                   # Environment & JWT configuration
│   │   ├── database.py                 # SQLAlchemy engine & session maker
│   │   ├── dependencies.py             # Device fingerprinting & session resolver
│   │   ├── main.py                     # FastAPI entrypoint & middleware
│   │   ├── security.py                 # Password hashing & JWT handlers
│   │   ├── ml/
│   │   │   ├── generate_synthetic_data.py # 2,000-user synthetic dataset generator
│   │   │   ├── train_model.py             # XGBoost training pipeline
│   │   │   └── model_artifact.pkl         # Trained XGBoost + SHAP explainer
│   │   ├── models/                     # SQLAlchemy ORM models
│   │   ├── routers/                    # FastAPI route controllers
│   │   ├── schemas/                    # Pydantic v2 validation contracts
│   │   └── services/
│   │       ├── decision_engine.py      # Threshold policy function
│   │       ├── explanation.py          # SHAP feature attribution formatter
│   │       ├── feature_engine.py       # 10-transaction personal baseline window
│   │       └── risk_model.py           # Model inference interface
│   ├── seed_demo_data.py               # Deterministic demo scenario seeder
│   └── requirements.txt                # Python dependencies
└── frontend/
    ├── src/
    │   ├── api/client.js               # Network transport with session telemetry
    │   ├── context/
    │   │   ├── AuthContext.jsx         # Authentication & 1-click demo state
    │   │   └── EventTrackerContext.jsx # Behavioral telemetry capture
    │   ├── components/                 # Atomic White Studio UI primitives
    │   ├── pages/                      # Application view controllers
    │   ├── styles/index.css            # White Studio design system tokens
    │   ├── App.jsx                     # Route registration & guards
    │   └── main.jsx                    # Root font loader & provider wrapper
    ├── tailwind.config.js              # Token definitions & type scale
    └── package.json                    # Frontend dependencies
```

---

<div align="center">
  <sub>Built for pre-commitment financial risk intelligence. Styled to Design System v2 ("White Studio") specifications.</sub>
</div>
