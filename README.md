# Latchpoint

A pre-commitment financial risk intelligence system. Instead of asking "is this
transaction legitimate?", Latchpoint asks "is committing to this *right now* —
given the sequence, network, and context surrounding it — risky, even when the
action itself looks completely legitimate?" It intervenes in the seconds
*before* a transfer or trade is confirmed, not after.

A brand-new user spends their first 10 transactions in a **calibration phase**
(genuine usage, no risk verdict shown) while Latchpoint builds their personal
pattern; once calibrated, every transaction is checked against that pattern in
real time — combining transaction history, session behavior, device/network
signals, and behavioral biometrics (mouse movement, click/touch patterns,
keystroke timing, hover-before-confirm hesitation, and location) — with the
analysis itself shown live, stage by stage, before the verdict.

## One-time setup

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python -m app.ml.generate_synthetic_data   # generates training data
python -m app.ml.train_model               # trains the XGBoost risk model
python seed_demo_data.py                   # seeds demo@latchpoint.app / demo1234

# Frontend
cd ../frontend
npm install
```

## Running it (two commands)

```bash
# Terminal 1 — backend, from backend/
source venv/bin/activate && uvicorn app.main:app --reload --port 8000

# Terminal 2 — frontend, from frontend/
npm run dev
```

Open http://localhost:5173 and log in as `demo@latchpoint.app` / `demo1234`.

## Live demo scenarios

The demo user starts with 10 clean historical transactions (a stable personal
baseline) plus three seeded setups. Run these through the UI to see the
Pre-Commitment Gate respond differently to each:

| Scenario | Action | Expect |
|---|---|---|
| Clean 1 | Transfer ~₹1,900 to "Rent - Sunview Apartments" | Quick toast, no modal (ALLOW) |
| Clean 2 | Transfer ~₹900 to "FiberNet Broadband" | Quick toast, no modal (ALLOW) |
| Drift | Transfer ~₹2,700 to "Rent - Sunview Apartments" (this becomes the 4th transfer today) | Gate: HOLD |
| Network | Transfer ~₹3,500 to "QuickCash Transfers" (shares a device fingerprint with 2 other payees) | Gate: VERIFY/HOLD/BLOCK |
| Repeat-loss | Trade ~₹12,000 on symbol "ZYX" (3 prior losing trades on this symbol) | Gate: BLOCK |

Re-run `python seed_demo_data.py` any time after deleting `backend/latchpoint.db`
to reset the demo user to a fresh state (it's a no-op if the demo user already
exists — delete the DB file first for a clean reset).

## Architecture

- **Backend**: FastAPI + SQLAlchemy + SQLite (`backend/app`), JWT auth.
- **ML**: scikit-learn/XGBoost + SHAP (`backend/app/ml`), retrained via the
  two `python -m app.ml.*` commands above. Feature engineering — the
  10-transaction personal baseline window — lives in
  `backend/app/services/feature_engine.py`.
- **Frontend**: React (Vite, plain JSX) + Tailwind + React Router
  (`frontend/src`), proxying `/api/*` to the backend in dev.

The `DATABASE_URL` in `backend/app/config.py` is the single line to change to
swap SQLite for Postgres later.
