# Latchpoint

**Risk Intelligence for the Last Reversible Moment**  
_Autonomous pre-commitment risk evaluation, multi-signal risk fusion, behavioral biometrics, journey intelligence, and real-time operations console._

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-1.5-F7931E?style=flat-square&logo=scikit-learn&logoColor=white)](https://scikit-learn.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600?style=flat-square)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-0.46-blue?style=flat-square)](https://shap.readthedocs.io)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)

---

## Overview

Most financial fraud systems ask: _"Is this transaction legitimate?"_  
**Latchpoint** asks: _"Is committing to this **right now** — given the sequence, network, personal history, and behavioral biometrics — risky, even when the action itself looks authorized?"_

Latchpoint operates at the **last reversible moment**: intervening in the seconds before a financial commitment is executed, while funds remain untouched and fully safe.

```
[ User Action / Intent ]
          │
          ▼
[ 1. Prepare ] ────────► POST /api/transactions/prepare (Status: DRAFT — Balance untouched)
          │
          ▼
[ 2. Telemetry ] ──────► Passive 10Hz kinematics (confirm hover hesitation, dwell, keystroke variance)
          │
          ▼
[ 3. Multi-Signal ] ───► Behavior (Isolation Forest) + Sequence + Transaction + History + Context + Network
          │
          ▼
[ 4. Gate Verdict ] ───► ALLOW | MONITOR | STEP-UP | HOLD | BLOCK
          │
          ▼
[ 5. Execution ] ──────► POST /api/transactions/confirm (Status: COMPLETED — Balance debited)
```

---

## Two Distinct Experiences

Latchpoint provides two tailored, purpose-built interfaces:

### A. Customer Banking Experience
Clean, restrained institutional consumer banking interface preserving user trust:
- **Dashboard (`/dashboard`)**: Account balances, personal baseline calibration progress (10-transaction window), recent transactions.
- **Transfer (`/transfer`)**: Multi-step transfer wizard instrumented with passive telemetry.
- **Pre-Commitment Gate Interceptor**: Non-accusatory step-up challenge triggered at confirmation when anomalous signals are detected. Reassures the user: _"Your payment has NOT been sent."_
- **Activity (`/activity`)**: Transaction history with pre-commitment decision verdicts.
- **Payees (`/payees`)**: Manage trusted counterparties.
- **Privacy & Data Governance Modal**: Transparent controls with zero-secret guarantee (raw passwords and OTPs are never stored).

### B. Risk Operations Console (Admin Experience)
High-density institutional command center designed for fintech risk analysts and security engineers:
- **Command Center (`/admin` & `/admin/overview`)**: Top 6 KPIs (Active Sessions, Pending Commitments, Elevated-Risk, Interventions Today, Prevented Exposure, P95 Decision Latency), live risk feed, system health, and calculated risk distribution.
- **Live Sessions (`/admin/live`)**: Real-time session monitoring table with expandable event timelines and duration tracking.
- **Users & Baselines (`/admin/users` & `/admin/users/:id`)**: Personal baseline window comparisons ($+4.9\sigma$ statistical deviation), historical activity charts, and signal breakdowns.
- **Commitments Hero Screen (`/admin/commitments` & `/admin/commitments/:id`)**: The signature inspection view displaying why an action is flagged, the 6-signal breakdown, and direct analyst action buttons (`VERIFY`, `HOLD`, `RELEASE`, `BLOCK`).
- **Risk Timeline (`/admin/timeline`)**: Interactive risk curve tracking risk score escalation across sequential micro-actions.
- **Network Intelligence (`/admin/network`)**: Interactive SVG entity relationship graph (Users, Accounts, Beneficiaries, Devices, IPs) with zoom, pan, type filtering, and an entity inspector panel.
- **Alert Center (`/admin/alerts`)**: Filterable triage workspace by status (`NEW`, `INVESTIGATING`, `VERIFIED`, `HELD`, `RESOLVED`) and risk tier.
- **Investigations (`/admin/investigations`)**: Multi-pane case workspace with forensic evidence packages and compliance adjudication notes.
- **Session Replay Engine (`/admin/replay`)**: Interactive event-by-event playback controls (`PLAY`, `PAUSE`, `NEXT`, `PREV`, `RESET`) dynamically updating timeline, radar, and triggering the Pre-Commitment Gate at confirmation.
- **Model Intelligence (`/admin/models`)**: Registry of active models (Isolation Forest, Sequence Model, XGBoost, Network Graph Analyzer) with input features, latency, and feature importances.
- **System Architecture (`/admin/system`)**: Visual end-to-end execution pipeline flowchart with live component latencies.

---

## 6-Signal Risk Fusion Architecture

Latchpoint separates policy decisions from raw anomaly detection through a configurable 6-factor fusion layer:

| Signal Dimension | Weight | Engine & Technique | Primary Inputs |
| :--- | :---: | :--- | :--- |
| **Behavioral Biometrics** | 20% | `IsolationForest` (Scikit-Learn) | Hover dwell time, cursor velocity, direction changes, idle intervals, typing cadence variance |
| **Sequence Journey** | 20% | Markov State Transitions | Transition ordering, back-navigations, repeated reviews, rapid completion bursts |
| **Transaction Dynamics** | 20% | Rolling Baseline ($\sigma$ deviation) | Amount vs personal mean, time of day anomaly, velocity |
| **Historical Outcomes** | 15% | Counterparty Track Record | Dispute streaks, prior loss history, recipient trust longevity |
| **Contextual Timing** | 15% | In-Session Drift Engine | Newly added beneficiary within session, multiple amount revisions |
| **Network Topology** | 10% | Relational Multi-Hop Analyzer | Shared device fingerprints across distinct payees, VPN/proxy flags, IP collision density |

### Decision Policy Tiers
- **ALLOW (0–30)**: Standard baseline transaction; executed without friction.
- **MONITOR (31–50)**: Mild anomaly; logged and silently monitored.
- **STEP-UP (51–70)**: Moderate deviation; triggers non-accusatory OTP or biometric challenge.
- **HOLD (71–85)**: High risk; intercepted before execution and queued for analyst compliance review.
- **BLOCK (86–100)**: Critical threat; hard stop (e.g. denylist match or repeat 3+ loss streak).

---

## Predefined Demo Scenarios

The Risk Console header includes a persistent **Demo Scenario Selector**:

1. **Signature Showcase: Multi-Signal High Risk (₹25,000)**:
   - Routine baseline: ₹1,800 – ₹3,500.
   - Sequence: `LOGIN` $\rightarrow$ `BENEFICIARY_ADDED` $\rightarrow$ `₹20,000 ENTERED` $\rightarrow$ `AMOUNT REVISED TO ₹25,000` $\rightarrow$ `REVIEW` $\rightarrow$ `REVIEW AGAIN` $\rightarrow$ `CONFIRM`.
   - Result: Pre-Commitment Risk **78/100 (HIGH)** $\rightarrow$ **STEP-UP** challenge intercepted before balance debit.
2. **Normal User Baseline (₹2,100)**: Routine utility payment matching historical habits $\rightarrow$ **ALLOW (14/100)**.
3. **Unusual But Legitimate (₹8,500)**: Higher amount at an off-peak hour to a known payee $\rightarrow$ **MONITOR (42/100)**.
4. **Escalating Velocity (₹2,700 4th transfer)**: 4th payment in single afternoon exceeding cumulative daily threshold $\rightarrow$ **HOLD (76/100)**.
5. **Network Risk / Shared Device (₹3,500)**: Target counterparty hardware fingerprint linked to multiple distinct external payees $\rightarrow$ **STEP-UP (58/100)**.
6. **Context Risk / Repeat Loss (₹12,000)**: Target entity associated with 3 consecutive prior disputes $\rightarrow$ **BLOCK (94/100)**.

---

## Realistic Seeded Dataset (§43)

- **Total Registered Users**: 22 (including primary demo user `demo@latchpoint.app`)
- **Total User Sessions**: 55 (with IP and hardware device linkages)
- **Total Financial Transactions**: 71
- **Total Telemetry Events**: 393 (mouse kinematics, hover dwells, edits, navigations)
- **Total Beneficiaries**: 82
- **Risk Distribution**: ~70% ALLOW, ~15% MONITOR, ~10% STEP-UP, ~4% HOLD, ~1% BLOCK

---

## Quickstart

### Prerequisites
- Python 3.11+
- Node.js 18+

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed realistic multi-user dataset (22 users, 55 sessions, 393 events)
python seed_demo_data.py

# Start FastAPI server (port 8000)
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install

# Run Vite dev server (port 5173)
npm run dev
```

### 3. Demo Credentials
- **Customer Portal**: `http://localhost:5173/login` (click **"Demo Login"** or use `demo@latchpoint.app` / `demo1234`)
- **Risk Operations Console**: `http://localhost:5173/admin`

---

## Automated Verification

Run the comprehensive test suite verifying behavioral models, sequence intelligence, risk fusion, and admin endpoints:

```bash
cd backend
./venv/bin/python test_risk_engine.py
```

Frontend production build check:
```bash
cd frontend
npm run build
npm run lint
```
