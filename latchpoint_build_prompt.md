# LATCHPOINT — Full-Stack Build Prompt for AI Coding Agent

## How to use this document
This is a complete, self-contained build specification. Paste this entire document as
the instruction to your coding agent (Claude Code, Cursor, etc.) in one shot. Every
section is a hard requirement unless marked "optional/stretch." Do not ask clarifying
questions — every decision needed to build this has already been made below. Build in
the order given in §12.

---

## 0. Role & Mission

You are building **Latchpoint**, a pre-commitment financial risk intelligence system.

**Core principle (do not deviate from this framing anywhere in the product):**
Most risk systems ask "is this transaction legitimate?" Latchpoint asks "is committing
to this *right now*, given the sequence, network, and context surrounding it, risky —
even when the action itself looks completely legitimate?" It intervenes in the seconds
*before* a transfer or trade is confirmed, not after.

Build a working, demoable, production-shaped MVP — not a prototype held together with
mocks. Real database, real (if simple) ML model, real event tracking, real decision
logic. The only things allowed to be "simulated" are: external IP-intelligence APIs
(stub with realistic fake data) and multi-bank data (single database, clearly labeled).

---

## 1. Tech Stack (locked — do not substitute)

**Frontend:** React (Vite), JavaScript (not TypeScript — keep it plain JSX), Tailwind
CSS, React Router, React Context for state (no Redux). No component library
(shadcn/MUI/etc.) — build all components from scratch to match the design system in §2
exactly.

**Backend:** Python, FastAPI, SQLAlchemy ORM, Pydantic v2 for request/response schemas,
SQLite as the database (via SQLAlchemy — connection string isolated in one config
variable so it's a one-line swap to PostgreSQL later). JWT auth via `python-jose` +
`passlib[bcrypt]`.

**ML:** `scikit-learn` + `xgboost` + `shap`. Feature engineering in plain Python/pandas.
No deep learning, no external ML services.

**Everything runs as two processes:** `uvicorn` (backend, port 8000) and `vite dev`
(frontend, port 5173), frontend proxies `/api/*` to the backend.

---

## 2. Design System — "Clean System UI" (Mac / Claude-inspired minimalism)

Implement these as Tailwind config tokens (`tailwind.config.js` `theme.extend`) and a
`:root` CSS variables block. Every screen must use only these tokens — no ad-hoc colors.

```css
/* Base surface & text */
--color-bg:            #FAFAF9;   /* warm off-white app background */
--color-surface:       #FFFFFF;   /* cards, modals */
--color-surface-alt:   #F4F3F1;   /* subtle secondary surface, hover states */
--color-border:        #E8E6E1;   /* hairline borders */
--color-text-primary:  #1C1B1A;
--color-text-secondary:#6B6963;
--color-text-tertiary: #A6A49E;

/* Accent (used sparingly — primary buttons, links, active states) */
--color-accent:        #C96442;   /* muted terracotta */
--color-accent-hover:  #B5573A;

/* Semantic risk colors — all muted/desaturated, never neon */
--color-allow:         #3A8A4A;   /* muted green */
--color-allow-bg:      #EDF5EE;
--color-verify:        #C98A2E;   /* muted amber */
--color-verify-bg:     #FBF3E6;
--color-hold:          #C9622E;   /* muted orange */
--color-hold-bg:       #FBEFE6;
--color-block:         #B3402F;   /* muted red */
--color-block-bg:      #FAECE9;

/* Typography */
font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", "Segoe UI", sans-serif;
/* Scale: 12 / 14 / 16 / 20 / 24 / 32 / 40 (px), line-height 1.4-1.5 */

/* Shape & elevation */
--radius-sm: 8px;    /* inputs, buttons, small chips */
--radius-md: 12px;   /* cards */
--radius-lg: 20px;   /* modals, the pre-commitment gate */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
--shadow-md: 0 4px 16px rgba(0,0,0,0.08);
--shadow-lg: 0 12px 40px rgba(0,0,0,0.12);
```

**Design rules for every screen:**
- Generous whitespace. Minimum 24px padding inside cards, 16px between stacked elements.
- No heavy borders — use 1px `--color-border` or shadow instead of thick outlines.
- Buttons: solid accent for primary action, ghost/outline for secondary, never more
  than one solid-accent button visible at once.
- No pure black (#000) or pure white (#FFF) text-on-background anywhere.
- Icons: simple line icons (use `lucide-react`), 18-20px, `--color-text-secondary` by
  default.
- Motion: 150-200ms ease-out transitions on modals/hover states. No bouncy easing.
- The Pre-Commitment Gate modal is the single most important visual surface in the
  product — it must look calm and trustworthy, never alarming (no red flashing, no
  aggressive iconography), even at BLOCK severity. Convey severity through the muted
  semantic colors above and copy, not visual aggression.

---

## 3. Repository Structure

```
latchpoint/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI app, router mounting, CORS, startup (load ML model)
│   │   ├── config.py                # env vars, DB URL, JWT secret
│   │   ├── database.py              # SQLAlchemy engine/session
│   │   ├── models/                  # SQLAlchemy models — one file per entity (see §4)
│   │   ├── schemas/                 # Pydantic request/response schemas
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── payees.py
│   │   │   ├── transactions.py
│   │   │   ├── events.py
│   │   │   ├── risk.py              # the pre-commitment gate endpoint
│   │   │   ├── cases.py
│   │   │   └── kpi.py
│   │   ├── services/
│   │   │   ├── identity_device.py   # IP/proxy enrichment, device fingerprint
│   │   │   ├── feature_engine.py    # builds CommitmentContext (§5)
│   │   │   ├── risk_model.py        # loads model, scores, SHAP
│   │   │   ├── explanation.py       # SHAP → plain-English reasons
│   │   │   └── decision_engine.py   # thresholds → ALLOW/VERIFY/HOLD/BLOCK
│   │   └── ml/
│   │       ├── generate_synthetic_data.py
│   │       ├── train_model.py
│   │       └── model_artifact.pkl   # produced by train_model.py, loaded at startup
│   ├── seed_demo_data.py            # populates the 3 demo scenarios (§11)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                  # routes
    │   ├── api/client.js            # fetch wrapper, attaches JWT
    │   ├── context/AuthContext.jsx
    │   ├── context/EventTrackerContext.jsx   # global behavioral event capture
    │   ├── components/
    │   │   ├── PreCommitmentGate.jsx
    │   │   ├── RiskBadge.jsx
    │   │   ├── StepUpModal.jsx
    │   │   └── ... (shared UI atoms: Button, Card, Input)
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Transfer.jsx
    │   │   ├── Trade.jsx
    │   │   ├── HoldReview.jsx
    │   │   ├── RiskExplanation.jsx
    │   │   ├── Activity.jsx
    │   │   ├── Payees.jsx
    │   │   └── KpiDashboard.jsx
    │   └── styles/index.css
    ├── tailwind.config.js
    └── package.json
```

---

## 4. Database Schema (SQLAlchemy models)

```
User
  id (pk), name, email (unique), password_hash, created_at

Account
  id (pk), user_id (fk), balance (float), account_type (enum: checking/trading)

Payee
  id (pk), user_id (fk), name, masked_account_number,
  is_trusted (bool, default False), first_seen_at (datetime)

Device
  id (pk), user_id (fk, nullable — device may be seen before login),
  fingerprint_hash, ip_address, asn, geo_country, is_vpn_or_proxy (bool),
  first_seen_at, last_seen_at

Session
  id (pk), user_id (fk), device_id (fk), started_at, ended_at (nullable)

Transaction
  id (pk), user_id (fk), type (enum: transfer/trade),
  amount (float), payee_id (fk, nullable), symbol (str, nullable, for trades),
  status (enum: draft/allowed/verifying/verified/held/blocked/completed/cancelled),
  risk_score (float, nullable), decision (enum, nullable),
  reasons (JSON — list of strings), top_features (JSON — list of {feature, shap_value}),
  outcome (enum: profit/loss/neutral/null — set later for trades, simulated),
  created_at, confirmed_at (nullable)

Event
  id (pk), user_id (fk), session_id (fk), transaction_id (fk, nullable),
  event_type (str — see §7), payload (JSON), created_at

Case
  id (pk), transaction_id (fk), status (enum: open/resolved),
  analyst_note (text, nullable), resolved_at (nullable)
```

Relationships: standard SQLAlchemy `relationship()` back-references. Cascade delete not
required for MVP.

---

## 5. Core Detection Mechanism — The 10-Transaction Pattern Window

This is the heart of the product. Implement exactly this logic in
`services/feature_engine.py`:

**Step 1 — Pull history.** For the user making a new commitment, fetch their most
recent 10 completed transactions (`status = completed`, ordered by `created_at desc`,
limit 10).

**Step 2 — Cold-start handling.** If the user has fewer than 10 historical
transactions:
- 0-2 transactions: rely almost entirely on population-level baseline (computed once
  at startup from all seed/demo users) instead of personal baseline. Flag
  `baseline_confidence: "low"` in the CommitmentContext.
- 3-9 transactions: blend personal baseline with population baseline, weighted by
  `min(count/10, 1)`. Flag `baseline_confidence: "medium"`.
- 10+ transactions: full personal baseline. Flag `baseline_confidence: "high"`.

**Step 3 — Compute the personal pattern from those (up to) 10 transactions:**
```python
mean_amount = mean(amounts)
std_amount = std(amounts)  # use population std with fallback floor if std == 0
typical_payees = set of payee_ids used
typical_hour_range = (min_hour, max_hour) of created_at.hour across the window
typical_gap_days = mean(days between consecutive transactions)
```

**Step 4 — Score the pending commitment against that pattern** to produce the
`baseline_signals` block of CommitmentContext:
```python
deviation_ratio = (current_amount - mean_amount) / max(std_amount, mean_amount * 0.1)
is_new_payee = payee_id not in typical_payees
is_odd_hour = current_hour outside typical_hour_range (with 2hr buffer)
is_early_relative_to_pattern = days_since_last_txn < typical_gap_days * 0.3
```

**Step 5 — Feed this into the full CommitmentContext** alongside cumulative exposure,
sequence, network, and context signals (§8) and pass the whole object to the risk
model.

This 10-transaction window is what makes the system "personal" — it must run on every
single `/api/risk/evaluate` call, not be precomputed/cached beyond the session, since
the window shifts with every completed transaction.

---

## 6. Backend API Contract

All endpoints under `/api`. JWT required (Authorization: Bearer) except `/auth/*`.

```
POST   /api/auth/register        { name, email, password } → { token, user }
POST   /api/auth/login           { email, password } → { token, user }
GET    /api/users/me             → user profile + account balance

GET    /api/payees               → list of payees for current user
POST   /api/payees               { name, masked_account_number } → payee

POST   /api/transactions/prepare
  body: { type: "transfer"|"trade", amount, payee_id?, symbol? }
  → { transaction_id, status: "draft" }
  Creates a DRAFT transaction row. Nothing has moved yet.

POST   /api/events
  body: { session_id, transaction_id?, event_type, payload }
  → 202 (fire-and-forget, batchable — frontend may send array of events)

POST   /api/risk/evaluate/{transaction_id}
  → {
      transaction_id,
      risk_score: 0.0-1.0,
      decision: "ALLOW"|"VERIFY"|"HOLD"|"BLOCK",
      reasons: ["You've committed ₹37,000 today across 4 transfers — about 6x your typical daily total.", ...],
      top_features: [{ "feature": "cumulative_exposure_ratio", "shap_value": 0.31 }, ...],
      baseline_confidence: "low"|"medium"|"high"
    }
  THIS is the pre-commitment gate call. Runs feature_engine → risk_model → explanation
  → decision_engine, persists risk_score/decision/reasons onto the Transaction row,
  updates status accordingly (allowed / verifying / held / blocked).

POST   /api/transactions/{id}/step-up/verify
  body: { otp_code }   # accept any 6-digit code as "correct" for demo — mock OTP
  → { status: "verified" } → then auto-confirms

POST   /api/transactions/{id}/confirm
  → finalizes: status → "completed", confirmed_at set, balance updated

POST   /api/transactions/{id}/cancel
  → status → "cancelled"

GET    /api/transactions?status=&limit=&offset=   → paginated history

GET    /api/cases                 → open cases (HOLD transactions) for analyst view
POST   /api/cases/{id}/resolve    { outcome: "confirmed_risk"|"false_positive", note }
  → resolves case AND writes back a label used by future model retraining (§8)

GET    /api/kpi/summary
  → {
      detection_lead_time_avg_sec,
      false_challenge_rate,
      intervention_accuracy,
      total_prevented_exposure,
      decisions_by_type: { ALLOW: n, VERIFY: n, HOLD: n, BLOCK: n }
    }
```

---

## 7. Event Tracking Specification

Track every one of these client-side, batched and POSTed to `/api/events` every 2
seconds or on page unload, whichever first:

```
event_type values:
  "page_view"        payload: { path }
  "field_focus"       payload: { field_name }
  "field_edit"        payload: { field_name, value_length }  # never log raw values for amount/payee free text beyond length
  "amount_change"      payload: { new_amount }
  "payee_selected"      payload: { payee_id, is_new_payee }
  "pause_detected"      payload: { duration_ms }   # client-side idle timer, fire if idle > 4s mid-flow
  "back_navigation"      payload: { from_path, to_path }
  "review_reached"      payload: {}                 # user reached the review-before-confirm step
  "gate_shown"          payload: { decision }
  "gate_reason_expanded" payload: {}                 # user clicked "why" — feeds comprehension KPI
  "confirm_clicked"      payload: {}
  "cancel_clicked"       payload: {}
  "step_up_attempted"     payload: { success: bool }
```

`session_id` is created client-side on app load (uuid), stored in memory (NOT
localStorage — regenerate per tab load, this is intentional for the demo's session
model). Every event and every risk evaluation call includes it.

Server side, `identity_device.py` on session creation:
- Extract client IP from request (trust `X-Forwarded-For` first hop only if you set up
  a reverse proxy locally; for local dev just use `request.client.host`).
- Stub an "IP intelligence" lookup — write a function `enrich_ip(ip)` that returns
  `{ asn: fake, geo_country: fake, is_vpn_or_proxy: bool }` using a deterministic hash
  of the IP so results are stable across calls (no real external API needed for MVP;
  structure the function so a real provider call — e.g. IPQualityScore — can be
  dropped in later without changing callers).
- Compute/accept a device fingerprint hash sent from the frontend (use `FingerprintJS`
  client-side, or for MVP a simple hash of `navigator.userAgent + screen.width +
  screen.height + timezone`).
- Upsert into `Device` table; this is what powers the network/shared-device signal.

---

## 8. ML Pipeline

**8.1 Feature vector** (output of `feature_engine.py`, this is the CommitmentContext
flattened for the model):

```python
features = {
    # baseline (from §5)
    "deviation_ratio": float,
    "is_new_payee": int,
    "is_odd_hour": int,
    "baseline_confidence_score": float,  # 0.3/0.6/1.0 for low/medium/high

    # cumulative exposure
    "exposure_today": float,
    "exposure_vs_baseline_ratio": float,
    "txn_count_today": int,

    # sequence (from Event log for this session)
    "pause_count": int,
    "edit_count": int,
    "back_navigation_count": int,
    "time_in_flow_sec": float,

    # network
    "device_shared_with_other_payees_count": int,
    "recipient_is_new_device_pairing": int,
    "ip_is_vpn_or_proxy": int,

    # context
    "repeat_pattern_negative_outcome": int,  # same payee/symbol + prior 'loss' outcome
    "prior_negative_outcome_streak": int,
}
```

**8.2 Synthetic training data** — `ml/generate_synthetic_data.py`:
Generate 2,000 synthetic users, each with a randomized personal baseline (mean amount,
std, preferred hours, 3-5 regular payees). For each, generate a history of 15-30
transactions. Label ~15% of transactions as "risky" by explicitly injecting one of the
three patterns:
1. **Drift**: 4+ same-day transactions escalating cumulative exposure to 4-8x baseline.
2. **Network**: transaction to a payee sharing a device/IP fingerprint with 2+ other
   payees the same user paid recently.
3. **Repeat-loss**: 3+ prior transactions to the same payee/symbol all labeled
   `outcome=loss`, followed by another attempt at a similar or larger amount.
Everything else is labeled clean (label=0). Output a CSV with the full feature vector
(§8.1) + label column.

**8.3 Model training** — `ml/train_model.py`:
Train an `XGBClassifier` (binary) on the synthetic CSV. 80/20 train/test split. Print
AUC and a classification report. Save the fitted model AND a `shap.TreeExplainer` built
from it to `model_artifact.pkl` (pickle a dict `{ "model": ..., "explainer": ... }`).
This script is run once during setup (§12), not at request time.

**8.4 Inference** — `services/risk_model.py`:
Load `model_artifact.pkl` once at FastAPI startup (module-level, not per-request).
`score(features_dict) -> (risk_score, shap_values)`. Convert the raw feature dict to
the exact column order the model was trained on before predicting.

**8.5 Explanation** — `services/explanation.py`:
Take the top 3 features by absolute SHAP value. Map each to a plain-English template,
e.g.:
```python
TEMPLATES = {
    "exposure_vs_baseline_ratio": lambda v, ctx: f"You've committed ₹{ctx['exposure_today']:,.0f} today — about {v:.1f}x your typical daily total.",
    "deviation_ratio": lambda v, ctx: f"This amount is unusually large compared to your typical transaction of about ₹{ctx['mean_amount']:,.0f}.",
    "device_shared_with_other_payees_count": lambda v, ctx: f"This recipient shares a device fingerprint with {int(v)} other recipients you've paid recently.",
    "repeat_pattern_negative_outcome": lambda v, ctx: f"You've made {ctx['prior_negative_outcome_streak']} similar transactions recently that resulted in a loss.",
    "is_new_payee": lambda v, ctx: "This is a new recipient you haven't paid before.",
    # ...cover every feature in §8.1
}
```
Deterministic templates are the primary path (fast, reliable, zero network calls during
a live demo). **Optional/stretch:** if time remains, add a LangChain call to an LLM
that takes the top SHAP features + values and generates more natural phrasing, with the
templated version as a fallback if the LLM call fails or times out (>1.5s).

**8.6 Retraining loop (describe, don't need to fully build for MVP):** `Case` resolutions
(`confirmed_risk` / `false_positive`) should be exportable as additional labeled rows to
append to the synthetic dataset for periodic retraining. Stub a `export_case_labels()`
function even if retraining isn't automated yet.

---

## 9. Decision & Policy Engine

`services/decision_engine.py` — pure function, no ML inside it:

```python
def decide(risk_score: float, context: dict) -> str:
    if context.get("payee_id") in DENYLIST:          # static list, empty by default
        return "BLOCK"
    if risk_score < 0.30:
        return "ALLOW"
    elif risk_score < 0.60:
        return "VERIFY"
    elif risk_score < 0.85:
        return "HOLD"
    else:
        return "BLOCK"
```

Status transitions on the Transaction row:
`draft → (evaluate) → allowed|verifying|held|blocked → (user action) → completed|cancelled`

---

## 10. Frontend Screens (build all of these)

**Login/Register** — single centered card, email+password, minimal branding
(wordmark "Latchpoint", no logo needed). Toggle between login/register.

**Dashboard** — balance card top, "Exposure today" widget (sum of today's confirmed
transactions vs personal baseline, shown as a subtle progress-style bar, not alarming
colors unless genuinely high), recent activity list (last 5), quick action buttons
(Transfer / Trade).

**Transfer** — amount input, payee select-or-add, a "Review" step (does NOT move
money) that shows a summary card, then a "Confirm" button. All field interactions fire
events per §7. Clicking "Review" fires `review_reached`. Clicking "Confirm" triggers
`POST /api/risk/evaluate/{id}` BEFORE anything is finalized — this is the actual gate
integration point, not decoration.

**Trade** — same pattern as Transfer but with symbol + amount instead of payee.

**PreCommitmentGate (modal component, not a page)** — appears over Transfer/Trade on
non-ALLOW decisions (and briefly, non-blockingly, on ALLOW too — show a quick
"Looks good" toast instead of a full modal for ALLOW to avoid friction on legitimate
activity). Modal shows: severity badge (color per §2 semantic tokens), 2-3 reason
bullets in plain language (from `reasons[]`), a "Why am I seeing this?" expandable
section (fires `gate_reason_expanded`), and action buttons scaled to decision:
- VERIFY → "Verify & Continue" (opens StepUpModal) / "Cancel"
- HOLD → "Submit for Review" / "Cancel" (routes to HoldReview page)
- BLOCK → "Cancel" only, plus a "Contact Support" ghost link

**StepUpModal** — 6-digit OTP input (any input accepted as correct for demo), shows
the same reasons again above the input for context.

**HoldReview** — shown after a HOLD submission: calm "Under review" state, estimated
time, the reasons again, a way to view status later from Activity.

**RiskExplanation** — full-page deep-dive for a given transaction: all `top_features`
listed with plain-language descriptions (reuse the same template mapping), not raw
SHAP numbers.

**Activity** — table/list of past transactions with status badges, filterable by
decision type, clicking a row opens RiskExplanation.

**Payees** — manage saved payees, mark trusted.

**KpiDashboard** — 4-6 stat cards pulling from `/api/kpi/summary`: detection lead
time, false-challenge rate, intervention accuracy, prevented exposure, a simple bar
chart of decisions-by-type (use a lightweight chart lib like `recharts`).

---

## 11. Demo Seed Data / Scenarios

`backend/seed_demo_data.py` must create a demo user (`demo@latchpoint.app` /
`demo1234`) with exactly 10 historical completed transactions establishing a clean
personal baseline (small, regular amounts, 3 regular payees, consistent hours), so
the demo user is immediately out of cold-start and every live scenario below produces
a meaningful, non-trivial risk evaluation:

1. **Drift scenario**: seed the demo flow so that during the live demo, submitting a
   4th same-day transfer (after 3 pre-seeded smaller ones "already made today") should
   trigger VERIFY or HOLD via `exposure_vs_baseline_ratio`.
2. **Network scenario**: seed one payee that shares a `Device` fingerprint with two
   other payees already in the demo user's payee list, so paying that specific payee
   triggers the network signal.
3. **Repeat-loss scenario**: seed 3 prior "trade" transactions to the same symbol, all
   with `outcome=loss`, so placing a 4th similar trade triggers the context signal.

Also seed 2-3 clearly clean scenarios (normal small transfer to a trusted, frequently
used payee) that should resolve ALLOW — this is what your false-challenge-rate KPI
needs a denominator for.

---

## 12. Build Order

```
1. Backend: models, database.py, config.py, alembic-free (create_all on startup is fine for MVP)
2. Backend: auth router + JWT, users, payees, accounts — test with curl/httpie
3. ML: generate_synthetic_data.py → train_model.py → verify model_artifact.pkl loads
4. Backend: feature_engine.py (§5, §8.1), risk_model.py, explanation.py, decision_engine.py
5. Backend: transactions router (prepare/confirm/cancel/step-up), events router, risk router
6. Backend: seed_demo_data.py — run it, verify via API calls that the 3 scenarios score correctly
7. Frontend: scaffold, Tailwind config with §2 tokens, AuthContext, api client
8. Frontend: Login, Dashboard, Payees — get auth flow fully working end to end
9. Frontend: Transfer flow + EventTrackerContext wiring + PreCommitmentGate modal
10. Frontend: StepUpModal, HoldReview, RiskExplanation, Activity
11. Frontend: Trade flow (reuse Transfer patterns)
12. Backend: cases router, kpi router → Frontend: KpiDashboard
13. End-to-end pass: run all 3 seeded scenarios live through the UI, fix anything that
    doesn't visibly demonstrate sequence/network/context detection
14. Polish pass against §2 design rules — nothing ships with default browser styling,
    inconsistent spacing, or harsh colors
```

---

## 13. Definition of Done

- [ ] All 3 demo scenarios (drift, network, repeat-loss) produce visibly different,
      correctly-reasoned gate responses when run live through the UI.
- [ ] At least 2 clean scenarios resolve ALLOW with minimal friction (toast, not modal).
- [ ] Every field interaction and navigation on Transfer/Trade fires an event that
      lands in the `Event` table (verify by querying the DB after a demo run).
- [ ] `/api/risk/evaluate` is called before any balance changes — confirm this by
      checking the balance is untouched if a HOLD/BLOCK is issued.
- [ ] Cold-start path works: a brand-new registered user with 0 history can still
      complete a transaction (falls back to population baseline, doesn't crash).
- [ ] KPI dashboard shows non-zero, non-fake numbers computed from actual logged
      decisions after running the seeded scenarios.
- [ ] Every screen uses only the design tokens from §2 — no default Tailwind blue,
      no pure black/white, no harsh red alert-boxes.
- [ ] The Pre-Commitment Gate modal is legible and calm at all four severity levels.
- [ ] `README.md` documents exactly two commands to run the whole thing locally
      (backend + frontend), including the one-time ML training step.
