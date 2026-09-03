# Latchpoint

**Pre-Commitment Financial Risk Intelligence**  
*Autonomous behavioral risk evaluation, sequence modeling, and real-time gate interception.*

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![XGBoost](https://img.shields.io/badge/XGBoost-2.1-FF6600?style=flat-square)](https://xgboost.readthedocs.io)
[![SHAP](https://img.shields.io/badge/SHAP-0.46-blue?style=flat-square)](https://shap.readthedocs.io)
[![License](https://img.shields.io/badge/License-MIT-black?style=flat-square)](LICENSE)

---

## Overview

Most financial fraud systems ask: *"Is this transaction legitimate?"*  
**Latchpoint** asks: *"Is committing to this **right now** — given the sequence, network, and context surrounding it — risky, even when the action itself looks completely legitimate?"*

Latchpoint intervenes in the seconds **before** a transfer or trade is confirmed, not after funds have already left the account.

```
[ User Intent ]
      │
      ▼
[ 1. Prepare ] ────────► POST /api/transactions/prepare  (Status: DRAFT — Balance untouched)
      │
      ▼
[ 2. Telemetry ] ──────► Event stream (keystrokes, field revisions, >4s idle hesitations)
      │
      ▼
[ 3. Baseline & ML ] ──► 10-transaction personal window + XGBoost + SHAP feature attribution
      │
      ▼
[ 4. Gate Verdict ] ───► ALLOW | VERIFY | HOLD | BLOCK
      │
      ▼
[ 5. Execution ] ──────► POST /api/transactions/confirm  (Status: COMPLETED — Balance debited)
```

### What's New in Design System v2 ("White Studio")

- **"White Studio" Visuals**: True white (`#FFFFFF`) surface, 1px hairline borders (`#EBEBEE`), restrained ink-indigo (`#23265C`) accents, and muted semantic risk tokens. Built to sit naturally alongside Stripe, Linear, Arc, or Mercury.
- **Strict Typography Scale**:
  - **Playfair Display**: Reserved strictly for the wordmark *"Latchpoint"*, the landing page hero headline, page titles (`<h1>`), and the Pre-Commitment Gate verdict line (*"Before you continue"*).
  - **Montserrat**: Powers 95%+ of all copy across navigation, buttons, forms, tables, card data, badges, and captions.
- **Public Landing Page (`/`)**: Dedicated first touchpoint with scroll-reactive header, value proposition, feature strip (Sequence, Network, Context), and dual CTAs.
- **1-Click Live Demo Flow**: Click **"Enter Live Demo →"** to instantly sign in as the pre-seeded demo user with zero typing via a real backend JWT.
- **Persistent Demo Indicator**: Subtle `Demo Mode` badge in the top navigation when signed in via the demo user.
- **Skeletons & Empty States**: Shimmer loading skeletons and contextual empty states across all data-driven screens.

---

## Quickstart

### Prerequisites

- **Python** 3.11 or 3.12
- **Node.js** 18+ & **npm**

### Setup & Launch

```bash
# 1. Clone repository
git clone https://github.com/poojamurugan23/Latchpoint-Recursion.git
cd Latchpoint-Recursion

# 2. Setup Backend & Train Model
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.ml.generate_synthetic_data   # Generates baseline synthetic dataset
python -m app.ml.train_model               # Trains XGBoost + SHAP TreeExplainer
python seed_demo_data.py                   # Seeds demo@latchpoint.app & scenarios

# 3. Setup Frontend
cd ../frontend
npm install

# 4. Start the Application
cd ..
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

> **Running Individually**:
> - Backend: `cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000`
> - Frontend: `cd frontend && npm run dev`

---

## Live Demo Scenarios

Click **"Enter Live Demo →"** on the landing page (or sign in via `/login` with `demo@latchpoint.app` / `demo1234`).

The demo user starts with 10 completed historical transfers establishing a clean personal baseline (small routine payments of ₹1,800–₹2,300 to trusted utility payees).

| Scenario | Flow | Action | Risk Signals | Expected Verdict |
|:---|:---|:---|:---|:---|
| **Clean 1** | Transfer | ₹1,900 to *"Rent - Sunview Apartments"* | In-pattern amount, trusted payee, standard time | **ALLOW**<br/>Instant confirmation with non-blocking toast. |
| **Clean 2** | Transfer | ₹900 to *"FiberNet Broadband"* | Low amount, trusted counterparty | **ALLOW**<br/>Instant confirmation with non-blocking toast. |
| **Drift** | Transfer | ₹2,700 to *"Rent - Sunview Apartments"* | 4th transfer in a single day; daily cumulative volume escalates to ~6x baseline | **HOLD**<br/>Pre-Commitment Gate modal opens; option to submit for compliance review. |
| **Network** | Transfer | ₹3,500 to *"QuickCash Transfers"* | Payee shares a device fingerprint with 2 other newly added payees | **VERIFY**<br/>Pre-Commitment Gate prompts in-flight 6-digit OTP step-up verification. |
| **Repeat-Loss** | Trade | ₹12,000 on symbol **"ZYX"** | 3 consecutive prior losing trades on symbol ZYX | **BLOCK**<br/>Terminal intervention; transaction aborted, balance preserved. |

> **Resetting Demo Data**: Delete `backend/latchpoint.db` and re-run `python seed_demo_data.py` inside `backend/`.

---

## Detection Engine: The 10-Transaction Baseline

Latchpoint avoids brittle static rules by continuously evaluating a user's personal behavioral baseline:

1. **Sliding Window**: Every risk check (`POST /api/risk/evaluate/{id}`) queries the user's last 10 completed transactions (`status = "completed"` ordered by date descending).
2. **Cold-Start Smoothing**:
   - `0–2 transactions`: Uses population-level baseline priors (`confidence: low`).
   - `3–9 transactions`: Linearly blends personal and population baselines based on transaction count (`confidence: medium`).
   - `10+ transactions`: Pure personal baseline (`confidence: high`).
3. **CommitmentContext Feature Vector**:
   - **Baseline Deviation**: Relative delta against personal mean and standard deviation.
   - **Cumulative Velocity**: Same-day total committed exposure and transaction count.
   - **Micro-Behavioral Sequence**: Client telemetry measuring hesitations (>4s idle pauses), field edits, and review-to-edit back-navigations.
   - **Network Overlap**: Cross-payee device fingerprint matching and proxy/VPN detection.
   - **Outcome Context**: Negative outcome streaks and loss patterns on symbols or recipients.
4. **Explainable AI (SHAP)**:
   - Binary `XGBClassifier` scores the feature vector.
   - `shap.TreeExplainer` calculates exact feature contributions.
   - The top 3 absolute SHAP values map deterministically to clear, plain-English reasons (e.g., *"You've committed ₹37,000 today — about 6x your typical daily total."*).

---

## Design System Reference: "White Studio"

### Palette

| Token | Hex Value | Role |
|:---|:---|:---|
| `--bg` | `#FFFFFF` | Primary background across all screens |
| `--bg-subtle` | `#FAFAFA` | Table row hover states and subtle secondary surfaces |
| `--surface` | `#FFFFFF` | Card and container backgrounds |
| `--border` | `#EBEBEE` | 1px hairline separator |
| `--border-strong` | `#DCDCE2` | Focus states and active dividers |
| `--ink-900` | `#14141B` | High-contrast primary text |
| `--ink-600` | `#63636D` | Secondary body text and labels |
| `--ink-400` | `#9C9CA4` | Muted metadata and placeholders |
| `--accent` | `#23265C` | Deep ink-indigo (wordmark, primary buttons, focus rings) |
| `--accent-tint` | `#EEEEF5` | 6% accent tint for active navigation states |
| `--allow` / `--allow-bg` | `#227A4E` / `#EAF6EE` | Allow status badge & toast icon |
| `--verify` / `--verify-bg` | `#A8720F` / `#FBF1DF` | Verify step-up challenge |
| `--hold` / `--hold-bg` | `#B0591F` / `#FBEEE1` | Under review hold state |
| `--block` / `--block-bg` | `#A93434` / `#FAEAEA` | Severe block state & form errors |

### Typography Rules

- **Playfair Display**: Used exclusively for:
  1. The wordmark *"Latchpoint"* (600, 20px)
  2. Landing page hero headline (600, 40px/48px)
  3. Primary page titles `<h1>` (600, 28px/36px)
  4. Pre-Commitment Gate verdict line (*"Before you continue"* / *"Verify it's you"*, 500, 22px/30px)
- **Montserrat**: Powers 95%+ of the interface:
  - Body copy: 400, 16px/24px
  - Form labels: 500, 14px/20px
  - Button text: 600, 14px (letter-spacing 0.01em)
  - Eyebrows: 600, 11px uppercase (letter-spacing 0.08em)

### Elevation & Radii

- **Border Radius**: `8px` (inputs/buttons 10px, badges pill/rounded-full, cards 12px, modals 20px).
- **Shadows**: `shadow-sm` (`0 1px 2px rgba(20,20,27,0.04)`) for resting cards; `shadow-md` (`0 8px 24px rgba(20,20,27,0.08)`) exclusively for modals.

---

## API Reference

All endpoints are hosted under `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication
- `POST /api/auth/demo-login` — Issues a JWT for `demo@latchpoint.app` without password entry.
- `POST /api/auth/login` — Standard credential sign-in (`{ email, password }`).
- `POST /api/auth/register` — User account creation.
- `GET /api/users/me` — Fetches current user profile, balance, and demo status flag.

### Transaction Lifecycle & Pre-Commitment Gate
- `POST /api/transactions/prepare` — Stages a transaction (`status: draft`). Balance is untouched.
- `POST /api/risk/evaluate/{id}` — Evaluates behavioral context. Returns `{ risk_score, decision, reasons, top_features }` and updates status to `allowed`, `verifying`, `held`, or `blocked`.
- `POST /api/transactions/{id}/step-up/verify` — Validates 6-digit OTP for transactions awaiting verification.
- `POST /api/transactions/{id}/confirm` — Finalizes transaction (`status: completed`) and debits account balance.
- `POST /api/transactions/{id}/cancel` — Aborts transaction (`status: cancelled`).
- `GET /api/transactions` — Retrieves paginated transaction history with optional status filter.

### Telemetry & Compliance
- `POST /api/events` — Ingests client behavioral events (page views, field edits, idle pauses).
- `GET /api/payees` — Lists saved payees for the authenticated user.
- `POST /api/payees` — Adds a new counterparty payee.
- `PATCH /api/payees/{id}` — Updates payee trust status (`is_trusted: bool`).
- `GET /api/kpi/summary` — Returns system metrics (lead time, accuracy, prevented exposure, decision breakdown).
- `GET /api/cases` & `POST /api/cases/{id}/resolve` — Compliance analyst case resolution queue.

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
│   │   ├── main.py                     # FastAPI entry point & CORS
│   │   ├── security.py                 # Password hashing & JWT generation
│   │   ├── ml/
│   │   │   ├── generate_synthetic_data.py # 2,000-user synthetic dataset generation
│   │   │   ├── train_model.py             # XGBoost model training pipeline
│   │   │   └── model_artifact.pkl         # Trained model & SHAP TreeExplainer
│   │   ├── models/                     # SQLAlchemy database models
│   │   ├── routers/                    # FastAPI route definitions
│   │   ├── schemas/                    # Pydantic v2 validation schemas
│   │   └── services/
│   │       ├── decision_engine.py      # Risk threshold policy logic
│   │       ├── explanation.py          # SHAP attribution to plain-English reason mapper
│   │       ├── feature_engine.py       # 10-transaction personal baseline window
│   │       ├── identity_device.py      # IP enrichment & device fingerprinting
│   │       └── risk_model.py           # Model loading & inference
│   ├── seed_demo_data.py               # Demo user & scenario seed script
│   └── requirements.txt                # Backend Python dependencies
└── frontend/
    ├── src/
    │   ├── api/client.js               # API client with session telemetry headers
    │   ├── context/
    │   │   ├── AuthContext.jsx         # Auth state & demo login handler
    │   │   └── EventTrackerContext.jsx # Behavioral event capture & flush loop
    │   ├── components/                 # Reusable UI atoms (Button, Card, Input, Modal, Skeletons)
    │   ├── pages/                      # Page components (Landing, Dashboard, Transfer, Trade, etc.)
    │   ├── styles/index.css            # White Studio design system tokens & shimmer animations
    │   ├── App.jsx                     # Route definitions & protected route guards
    │   └── main.jsx                    # Root font loader & provider wrapper
    ├── tailwind.config.js              # Token configuration & typography scale
    └── package.json                    # Frontend dependencies
```

---

## Verification

To verify that the entire stack compiles and runs without issues:

```bash
# Frontend build verification
cd frontend
npm run build    # Builds cleanly in ~1.1s with 0 errors

# Frontend lint check
npm run lint     # oxlint static analysis (0 errors)

# Backend demo login verification
cd ../backend
./venv/bin/python -c "
from app.database import SessionLocal
from app.routers.auth import demo_login
db = SessionLocal()
res = demo_login(db)
print('Demo Login:', res.user.email, '| is_demo:', res.user.is_demo)
"
```

---

## License

This project is licensed under the [MIT License](LICENSE).
