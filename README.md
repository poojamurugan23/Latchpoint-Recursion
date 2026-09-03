# Latchpoint

> **Pre-Commitment Financial Risk Intelligence**  
> _Design System v2 ("White Studio") Edition_

Most financial risk systems ask: _"Is this transaction legitimate?"_  
**Latchpoint** asks: _"Is committing to this **right now** — given the sequence, network, and context surrounding it — risky, even when the action itself looks completely legitimate?"_

Latchpoint intervenes in the seconds **before** a transfer or trade is finalized, not after money has moved.

---

## What's New in Design System v2 ("White Studio")

- **Executive "White Studio" Visuals**: True white (`#FFFFFF`) canvas, hairline borders (`#EBEBEE`), restrained ink-indigo (`#23265C`) accents, and muted semantic risk tokens. Designed to look at home alongside Stripe, Linear, Arc, or Mercury.
- **Editorial Typography Scale**:
  - **Playfair Display** (600/500): Reserved strictly for the wordmark _"Latchpoint"_, the landing page hero headline, page titles (`<h1>`), and the Pre-Commitment Gate verdict line (_"Before you continue"_).
  - **Montserrat** (400/500/600): Drives ~95% of all interface elements (navigation, buttons, forms, tables, card data, badges, and captions).
- **Public Landing Page (`/`)**: Dedicated first touchpoint featuring real-time scroll navigation, hero proposition, dual CTAs, and a 3-pillar architectural overview (Sequence, Network, Context).
- **1-Click Live Demo Flow**: "Enter Live Demo →" directly triggers `POST /api/auth/demo-login`, generating a signed JWT for the pre-seeded demo user with zero typing and zero wait.
- **Persistent Demo Indicator**: Subtle `Demo Mode` pill in the authenticated top navigation indicating seeded sandbox data.
- **Robust Skeletons & Empty States**: Every data-driven screen (Dashboard, Activity, Payees, Insights) features shimmer loading skeletons and informative empty states with contextual CTAs.

---

## Quickstart

### Prerequisites

- **Node.js** 18+ & **npm**
- **Python** 3.11 or 3.12

### 1. One-Time Setup

```bash
# Clone the repository
git clone https://github.com/poojamurugan23/Latchpoint-Recursion.git
cd Latchpoint-Recursion

# Setup Backend Environment & Dependencies
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Train XGBoost Model & Seed Baseline Demo Scenarios
python -m app.ml.generate_synthetic_data   # generates synthetic baseline dataset
python -m app.ml.train_model               # trains XGBoost + SHAP TreeExplainer
python seed_demo_data.py                   # seeds demo@latchpoint.app + scenarios

# Setup Frontend Dependencies
cd ../frontend
npm install
```

### 2. Running Locally

You can run both backend and frontend concurrently from the project root:

```bash
# From project root
npm run dev
```

Or run each service in separate terminals:

```bash
# Terminal 1 — Backend (port 8000)
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (port 5173)
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## Live Demo Scenarios

Click **"Enter Live Demo →"** on the landing page (or sign in via `/login` using `demo@latchpoint.app` / `demo1234`).

The demo user is pre-seeded with 10 historical transactions that establish a stable personal baseline (small, routine transfers between 10:00–14:00 to familiar utilities). Run these scenarios through the UI to witness the Pre-Commitment Gate's multi-signal engine:

| Scenario        | Flow / Action                                        | Triggered Signals                                                          | Expected Decision & Gate Behavior                                                                                |
| --------------- | ---------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **Clean 1**     | Transfer **₹1,900** to _"Rent - Sunview Apartments"_ | Baseline amount, trusted payee, standard timing                            | **ALLOW** — Instant confirmation with non-blocking toast. Balance updates immediately.                           |
| **Clean 2**     | Transfer **₹900** to _"FiberNet Broadband"_          | Low amount, trusted payee                                                  | **ALLOW** — Instant confirmation with non-blocking toast.                                                        |
| **Drift**       | Transfer **₹2,700** to _"Rent - Sunview Apartments"_ | 4th transfer in a single day; cumulative daily volume reaches ~6x baseline | **HOLD** — Calm Gate modal details exposure drift. Offers _"Submit for Review"_ to open a compliance case.       |
| **Network**     | Transfer **₹3,500** to _"QuickCash Transfers"_       | Payee shares a device fingerprint hash with 2 other newly added payees     | **VERIFY** — Pre-Commitment Gate prompts _"Verify & Continue"_, requiring mock 6-digit OTP step-up verification. |
| **Repeat-Loss** | Trade **₹12,000** on symbol **"ZYX"**                | User has 3 consecutive prior losing trades on symbol ZYX                   | **BLOCK** — Severe risk intervention. Prevents execution, offering support contact.                              |

> **Resetting Demo Data**: Delete `backend/latchpoint.db` and re-run `python seed_demo_data.py` inside `backend/`.

---

## Architecture & System Design

```
Latchpoint/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application, startup model loading, CORS
│   │   ├── config.py               # Settings (DATABASE_URL, JWT secret, session configs)
│   │   ├── database.py             # SQLAlchemy engine & session factory
│   │   ├── models/                 # SQLAlchemy models (User, Account, Payee, Device, Transaction, Event, Case)
│   │   ├── schemas/                # Pydantic v2 request/response contracts
│   │   ├── routers/
│   │   │   ├── auth.py             # Login, register, and 1-click demo-login
│   │   │   ├── risk.py             # POST /api/risk/evaluate/{id} pre-commitment gate
│   │   │   ├── transactions.py     # prepare, confirm, cancel, step-up/verify
│   │   │   ├── events.py           # Behavioral event ingest (batchable 202)
│   │   │   ├── payees.py           # Saved recipients & trust toggling
│   │   │   ├── cases.py            # Analyst queue for held commitments
│   │   │   └── kpi.py              # Telemetry summaries (lead time, accuracy)
│   │   ├── services/
│   │   │   ├── feature_engine.py   # 10-transaction personal window & vectorizer
│   │   │   ├── risk_model.py       # XGBoost scoring + SHAP TreeExplainer
│   │   │   ├── explanation.py      # SHAP feature attribution → plain English reasons
│   │   │   ├── decision_engine.py  # ALLOW / VERIFY / HOLD / BLOCK thresholds
│   │   │   └── identity_device.py  # Device fingerprinting & IP/ASN enrichment
│   │   └── ml/
│   │       ├── generate_synthetic_data.py # 2,000-user baseline synthesis
│   │       ├── train_model.py             # XGBClassifier training pipeline
│   │       └── model_artifact.pkl         # Serialized model & explainer
│   ├── seed_demo_data.py           # Populates demo accounts, payees, & scenarios
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── api/client.js           # Fetch wrapper with JWT, device fingerprint, & session IDs
    │   ├── context/
    │   │   ├── AuthContext.jsx     # Auth state, login/demoLogin/logout
    │   │   └── EventTrackerContext.jsx # Keystrokes, pauses (>4s), and flush loop (2s)
    │   ├── components/
    │   │   ├── Layout.jsx          # Shell with Playfair wordmark & "Demo Mode" pill
    │   │   ├── PreCommitmentGate.jsx # 20px radius modal with Playfair verdict lines
    │   │   ├── StepUpModal.jsx     # 6-digit OTP verification modal
    │   │   ├── Button.jsx          # 10px radius, 120ms transitions, focus rings
    │   │   ├── Card.jsx            # 12px radius, shadow-sm, hairline borders
    │   │   ├── Input.jsx           # 10px radius, 3px soft-glow focus ring
    │   │   ├── RiskBadge.jsx       # Pill-shaped semantic badges
    │   │   ├── Skeleton.jsx        # CSS shimmer loading blocks
    │   │   └── EmptyState.jsx      # Icon + guidance + action for empty lists
    │   ├── pages/
    │   │   ├── Landing.jsx         # Public landing page with feature pillars
    │   │   ├── Dashboard.jsx       # Balance, daily exposure progress, recent activity
    │   │   ├── Transfer.jsx        # Payee transfer flow with gate integration
    │   │   ├── Trade.jsx           # Market order flow with gate integration
    │   │   ├── Activity.jsx        # Filterable transaction history
    │   │   ├── Payees.jsx          # Payee management & trust controls
    │   │   ├── KpiDashboard.jsx    # Detection metrics & decisions distribution
    │   │   ├── HoldReview.jsx      # Calm status screen for held transactions
    │   │   └── RiskExplanation.jsx # Transaction deep-dive with plain-English signals
    │   ├── styles/index.css        # CSS tokens, shimmer keyframes, focus outlines
    │   ├── App.jsx                 # Route definitions & ProtectedRoute guards
    │   └── main.jsx                # Font imports & React root
    ├── tailwind.config.js          # White Studio color tokens, type scale, radii
    └── package.json
```

---

## The 10-Transaction Pattern Window

Latchpoint avoids rigid global rules by continuously learning each user's personal baseline:

1. **Dynamic Historical Window**: When evaluating a transaction, Latchpoint loads the user's last 10 completed transactions.
2. **Cold-Start Blending**:
   - `0–2 transactions`: Relies on population-level baselines (`baseline_confidence: "low"`).
   - `3–9 transactions`: Blends personal baseline with population baseline (`baseline_confidence: "medium"`).
   - `10+ transactions`: Full personal baseline (`baseline_confidence: "high"`).
3. **CommitmentContext Vector**:
   - **Baseline Deviation**: `(amount - mean) / max(std, mean * 0.1)`
   - **Cumulative Pacing**: `exposure_today`, `exposure_vs_baseline_ratio`, `txn_count_today`
   - **Behavioral Sequence**: Client telemetry capturing `pause_count` (>4s hesitations), `edit_count`, and `time_in_flow_sec`
   - **Structural Network**: Cross-payee device fingerprint matching and proxy/VPN flags
   - **Outcome Context**: Historical loss streaks on specific symbols/payees

---

## API Summary

All endpoints are hosted under `/api`. Protected routes require `Authorization: Bearer <token>`.

### Authentication

- `POST /api/auth/demo-login` — Issues a JWT for `demo@latchpoint.app` without credentials.
- `POST /api/auth/login` — Standard credential login (`{ email, password }`).
- `POST /api/auth/register` — User registration.
- `GET /api/users/me` — Fetches current user, account balance, and `is_demo` flag.

### Risk & Pre-Commitment Gate

- `POST /api/transactions/prepare` — Creates a `draft` transaction before money moves.
- `POST /api/risk/evaluate/{id}` — Evaluates behavioral context and returns `{ risk_score, decision, reasons, top_features }`. Updates status to `allowed`, `verifying`, `held`, or `blocked`.
- `POST /api/transactions/{id}/step-up/verify` — Validates OTP for `verifying` transactions.
- `POST /api/transactions/{id}/confirm` — Finalizes transaction to `completed` and debits balance.
- `POST /api/transactions/{id}/cancel` — Marks transaction as `cancelled`.

### Telemetry & Analytics

- `POST /api/events` — High-throughput telemetry ingestion (page views, field revisions, idle pauses).
- `GET /api/kpi/summary` — Aggregated metrics (lead time, false challenge rate, intervention accuracy).
- `GET /api/cases` & `POST /api/cases/{id}/resolve` — Analyst compliance workflow.

---

## Design System Reference (Tokens)

```css
/* Surface & Separators */
--bg: #ffffff;
--bg-subtle: #fafafa;
--surface: #ffffff;
--border: #ebebee;
--border-strong: #dcdce2;

/* Typography Ink */
--ink-900: #14141b;
--ink-600: #63636d;
--ink-400: #9c9ca4;

/* Restrained Brand Accent */
--accent: #23265c; /* Deep ink-indigo */
--accent-hover: #191b45;
--accent-tint: #eeeef5;

/* Muted Semantic Risk Colors */
--allow: #227a4e;
--allow-bg: #eaf6ee;
--verify: #a8720f;
--verify-bg: #fbf1df;
--hold: #b0591f;
--hold-bg: #fbeee1;
--block: #a93434;
--block-bg: #faeaea;

/* Elevation */
--shadow-sm: 0 1px 2px rgba(20, 20, 27, 0.04);
--shadow-md: 0 8px 24px rgba(20, 20, 27, 0.08);
```

---

## License & Attribution

Built as part of the **Latchpoint** pre-commitment financial risk intelligence platform.
Styled in accordance with **Design System v2 ("White Studio")**.
