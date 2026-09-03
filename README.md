# Latchpoint

**Pre-Commitment Financial Risk Intelligence**  
_Autonomous behavioral risk evaluation, sequence modeling, deep client telemetry, and real-time gate interception._

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600?style=flat-square)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-0.46-blue?style=flat-square)](https://shap.readthedocs.io)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)

---

## Overview

Most financial fraud systems ask: _"Is this transaction legitimate?"_  
**Latchpoint** asks: _"Is committing to this **right now** — given the sequence, network, personal history, and behavioral biometrics — risky, even when the action itself looks authorized?"_

Latchpoint intervenes in the seconds **before** a financial commitment is executed, not after funds have already left the account.

```
[ User Intent ]
      │
      ▼
[ 1. Prepare ] ────────► POST /api/transactions/prepare  (Status: DRAFT — Balance untouched)
      │
      ▼
[ 2. Telemetry ] ──────► Deep client telemetry (keystroke timing, confirm hover hesitation, mouse kinematics)
      │
      ▼
[ 3. Staged SSE Engine] ► GET /api/risk/evaluate-stream/{id} (Baseline → Sequence → Network → Context → Behavior)
      │
      ▼
[ 4. Gate Verdict ] ───► ALLOW | VERIFY | HOLD | BLOCK (SHAP feature attribution & plain-English reasons)
      │
      ▼
[ 5. Execution ] ──────► POST /api/transactions/confirm  (Status: COMPLETED — Balance debited)
```

---

## Core Capabilities

### 1. First-Class Calibration Lifecycle

- **Visible 10-Transaction Calibration**: A newly registered user's first 10 transactions build their personal behavioral baseline.
- **Honest Calibrating Banner**: During calibration, transactions proceed normally without fabricated verdicts. The banner clearly states: _"Building your pattern (n/10) — this transaction is being processed normally."_
- **Dashboard Calibration Bar**: Persistent 10-segment visual progress indicator with caption in Montserrat 12px showing exact completion progress.
- **"Pattern Ready" Milestone**: On the 10th transaction, a dedicated full-screen moment displays: _"Your pattern is ready. Latchpoint is now actively watching for activity that doesn't match your established pattern — before it becomes irreversible."_
- **Materialized Baseline Snapshot**: Stores `mean_amount`, `std_amount`, `typical_entities`, `typical_hour_range`, and `typical_gap_days` as a reference artifact while rolling live windows continue scoring.

### 2. Advanced Client-Side Behavioral Telemetry (`BehavioralTracker.js`)

- **Passive Kinematics**: Throttled 10Hz sampling buffers mouse distance, velocity, and direction changes client-side. Only aggregates are dispatched.
- **Confirm Button Hesitation**: Specifically instruments the confirm button to measure `hover_ms_before_click` (cursor dwell time before landing the click).
- **Keystroke Timing**: Inter-keystroke interval mean and variance while typing amounts. Strictly timing metrics — raw keystroke values never leave the browser.
- **Custom Geolocation Consent**: Non-blocking modal prompt matching the design system (`LocationConsent.jsx`) before requesting browser geolocation.

### 3. Real-Time Staged Evaluation (Server-Sent Events)

- **Legible Computation**: Instead of a generic spinner, Confirm initiates an SSE stream (`/api/risk/evaluate-stream/{id}`).
- **5 Evaluation Stages**: Sequentially checks **Baseline**, **Sequence**, **Network**, **Context**, and **Behavior**.
- **Live Summaries**: Each stage checks off with a custom checkmark and plain-English summary line fading in (e.g. _"2 other recipients share this counterparty device fingerprint"_).

### 4. "White Studio" Design System v2

- Pure white canvas (`#FFFFFF`), 1px hairline borders (`#EBEBEE`), deep ink-indigo accents (`#23265C`), and semantic risk tokens.
- Strict typography: **Playfair Display** (wordmark, hero, titles, verdicts) and **Montserrat** (body copy, forms, tables, badges, captions).
- Streamlined clean flow: Landing (`/`) → Dashboard (`/dashboard`) → Transfer (`/transfer`) → Activity (`/activity`).

---

## Quickstart

### Prerequisites

- **Python** 3.11 or 3.12
- **Node.js** 18+ & **npm**

### 1. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Seed the demo user, active baseline, and live test scenarios
python seed_demo_data.py

# Start the API server
uvicorn app.main:app --reload --port 8000
```

Verify backend health:

```bash
curl http://localhost:8000/api/health
# {"status": "ok", "model_loaded": true, "db_connected": true}
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

---

## Live Demo Scenarios

The pre-seeded demo user starts in **active** status with 10 historical transactions establishing their personal baseline (routine utility payments of ₹1,800–₹2,400 to trusted payees).

Click **"Enter Live Demo →"** on the landing page for instant 1-click access:

| Scenario    | Type     | Target Payee                | Amount   | Signal Dimension                                                       | Expected Verdict                                                                       |
| :---------- | :------- | :-------------------------- | :------- | :--------------------------------------------------------------------- | :------------------------------------------------------------------------------------- |
| **Clean 1** | Transfer | _Rent - Sunview Apartments_ | ~₹1,900  | Familiar payee, baseline amount                                        | **ALLOW**<br/>Instant confirmation with non-blocking toast.                            |
| **Clean 2** | Transfer | _FiberNet Broadband_        | ~₹900    | Trusted utility, sub-baseline amount                                   | **ALLOW**<br/>Instant confirmation with non-blocking toast.                            |
| **Drift**   | Transfer | _Rent - Sunview Apartments_ | ~₹2,700  | 4th transfer today; cumulative daily exposure >3.2x baseline           | **HOLD**<br/>Pre-Commitment Gate modal opens; submit for review (`/holds/{id}`).       |
| **Network** | Transfer | _QuickCash Transfers_       | ~₹3,500  | Shared device fingerprint with 2 other newly added payees              | **VERIFY**<br/>Pre-Commitment Gate prompts in-flight 6-digit OTP step-up verification. |
| **Context** | Transfer | _CryptoVault Transfers_     | ~₹12,000 | 3 consecutive prior transfers to this entity resulted in disputes/loss | **BLOCK**<br/>Severe intervention; commitment aborted, balance protected.              |

> **Resetting Demo Data**: Run `rm -f backend/latchpoint.db && python backend/seed_demo_data.py` at any time.

---

## Design System Reference: "White Studio"

### Palette

| Token                      | Hex Value             | Role                                                     |
| :------------------------- | :-------------------- | :------------------------------------------------------- |
| `--bg`                     | `#FFFFFF`             | Primary background across all screens                    |
| `--bg-subtle`              | `#FAFAFA`             | Table row hover states and subtle secondary surfaces     |
| `--surface`                | `#FFFFFF`             | Card and container backgrounds                           |
| `--border`                 | `#EBEBEE`             | 1px hairline separator                                   |
| `--border-strong`          | `#DCDCE2`             | Focus states and active dividers                         |
| `--ink-900`                | `#14141B`             | High-contrast primary text                               |
| `--ink-600`                | `#63636D`             | Secondary body text and labels                           |
| `--ink-400`                | `#9C9CA4`             | Muted metadata and placeholders                          |
| `--accent`                 | `#23265C`             | Deep ink-indigo (wordmark, primary buttons, focus rings) |
| `--accent-tint`            | `#EEEEF5`             | 6% accent tint for active navigation states              |
| `--allow` / `--allow-bg`   | `#227A4E` / `#EAF6EE` | Allow status badge & toast icon                          |
| `--verify` / `--verify-bg` | `#A8720F` / `#FBF1DF` | Verify step-up challenge                                 |
| `--hold` / `--hold-bg`     | `#B0591F` / `#FBEEE1` | Under review hold state                                  |
| `--block` / `--block-bg`   | `#A93434` / `#FAEAEA` | Severe block state & form errors                         |

### Typography Rules

- **Playfair Display**: Used exclusively for:
  1. The wordmark _"Latchpoint"_ (600, 20px)
  2. Landing page hero headline (600, 40px/48px)
  3. Primary page titles `<h1>` (600, 28px/36px)
  4. Pre-Commitment Gate verdict line (_"Before you continue"_ / _"Verify it's you"_, 500, 22px/30px)
- **Montserrat**: Powers 95%+ of the interface:
  - Body copy: 400, 16px/24px
  - Form labels: 500, 14px/20px
  - Button text: 600, 14px (letter-spacing 0.01em)
  - Eyebrows: 600, 11px uppercase (letter-spacing 0.08em)

---

## API Architecture

| Method | Endpoint                                | Description                                               |
| :----- | :-------------------------------------- | :-------------------------------------------------------- |
| `POST` | `/api/auth/register`                    | Register new user (initiates 10-txn calibration mode)     |
| `POST` | `/api/auth/login`                       | Email/password login                                      |
| `POST` | `/api/auth/demo-login`                  | Zero-typing 1-click login for the seeded demo account     |
| `GET`  | `/api/users/me`                         | Fetch authenticated user, balance, and calibration status |
| `GET`  | `/api/payees`                           | List user payees                                          |
| `POST` | `/api/payees`                           | Register a new payee                                      |
| `POST` | `/api/transactions/prepare`             | Prepare draft transaction (balance untouched)             |
| `GET`  | `/api/risk/evaluate-stream/{id}`        | Real-time SSE staged risk evaluation                      |
| `POST` | `/api/risk/evaluate/{id}`               | Synchronous risk evaluation fallback                      |
| `POST` | `/api/transactions/{id}/confirm`        | Confirm allowed/verified transaction and debit account    |
| `POST` | `/api/transactions/{id}/cancel`         | Abort draft or held transaction                           |
| `POST` | `/api/transactions/{id}/step-up/verify` | Submit 6-digit OTP challenge code                         |
| `GET`  | `/api/cases`                            | Compliance hold review queue                              |
| `POST` | `/api/events`                           | Passive telemetry ingestion endpoint                      |
| `GET`  | `/api/health`                           | System status check (model loaded & DB connectivity)      |

---

## Project Structure

```
Latchpoint-Recursion/
├── README.md                           # Master architectural specification
├── package.json                        # Root workspace scripts
├── backend/
│   ├── app/
│   │   ├── config.py                   # Environment & JWT configuration
│   │   ├── database.py                 # SQLAlchemy engine & session factory
│   │   ├── dependencies.py             # Session & device fingerprint resolution
│   │   ├── error_handling.py           # Centralized exception formatting
│   │   ├── logging_config.py           # Structured JSON logger
│   │   ├── main.py                     # FastAPI application & middleware
│   │   ├── rate_limit.py               # SlowAPI rate limiting configuration
│   │   ├── security.py                 # Password hashing & JWT generation
│   │   ├── ml/                         # Synthetic data generation & training
│   │   ├── models/                     # User, Account, Payee, Device, Transaction, Session models
│   │   ├── routers/                    # Auth, Transactions, Risk, Events, Payees, Cases, Users, KPI
│   │   ├── schemas/                    # Pydantic validation schemas
│   │   └── services/                   # Decision engine, explanation, feature engine, risk model
│   ├── seed_demo_data.py               # Demo scenario seed script
│   └── requirements.txt                # Backend dependencies
└── frontend/
    ├── src/
    │   ├── api/client.js               # API client with session telemetry headers & SSE streamGet
    │   ├── components/                 # UI components (Button, Input, Layout, PreCommitmentGate,
    │   │                               # CalibrationBanner, PatternReady, LocationConsent, StagedAnalysis)
    │   ├── context/                    # AuthContext & EventTrackerContext
    │   ├── pages/                      # Landing, Dashboard, Transfer, Activity, Payees, HoldReview, etc.
    │   ├── styles/index.css            # White Studio design system tokens & shimmer animations
    │   ├── telemetry/                  # BehavioralTracker.js passive client-side telemetry
    │   ├── App.jsx                     # Application routing & protected route guards
    │   └── main.jsx                    # Root font imports & provider mount
    ├── tailwind.config.js              # Token configuration & typography scale
    └── package.json                    # Frontend dependencies
```

---

## Production Hygiene

- **Structured JSON Logging**: Centralized logger in `backend/app/logging_config.py` logging latency, risk scores, and decisions.
- **Centralized Error Handling**: Standardized error envelopes `{"error": {"code", "message"}}` via `backend/app/error_handling.py`.
- **Rate Limiting**: `slowapi` rate limiting on auth (`10/minute`) and risk evaluation endpoints (`30/minute`).
- **Health Probing**: Real model load check and database query check on `/api/health`.

---

## Verification

To verify that the entire stack compiles and runs without issues:

```bash
# Frontend build verification
cd frontend
npm run build    # Builds cleanly in ~1.1s with 0 errors

# Frontend lint check
npm run lint     # oxlint static analysis (0 errors)

# Backend demo login and scenario verification
cd ../backend
python -m venv venv
./venv/bin/python seed_demo_data.py
```

---

## License

This project is licensed under the [MIT License](LICENSE).
