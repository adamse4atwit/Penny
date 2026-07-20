# Penny

Penny is an AI financial portfolio assistant that helps users track, analyze, and optimize what they own using data-driven insights and artificial intelligence. Alongside stock holdings, users can log physical assets — houses, cars, boats, jewelry, equipment — and Penny estimates what each is worth today based on its age, condition, location, and category-specific details. The AI insight covers the whole picture and is tailored to the user's stated risk tolerance and financial goal.

COMP 5500 senior project — Emily Adams and Nathaly Phrasavath.

## Architecture

```
app/
├── backend/                    FastAPI + SQLAlchemy + PostgreSQL
│   ├── app/
│   │   ├── main.py             App setup, CORS, router registration
│   │   ├── config.py           Settings loaded from .env
│   │   └── database.py         Engine, SessionLocal, Base
│   ├── models/                 SQLAlchemy tables
│   │   ├── user.py             User
│   │   └── portfolio.py        Portfolio, Asset, PhysicalAsset
│   ├── schemas/                Pydantic request/response shapes
│   │   ├── user.py
│   │   ├── portfolio.py
│   │   └── ai.py               Insight request (risk tolerance, goal)
│   ├── routes/
│   │   ├── api.py              Parent router
│   │   ├── auth.py             Register, login, JWT issuing
│   │   ├── portfolio.py        Portfolio + asset CRUD, token validation
│   │   ├── market.py           Live prices via yfinance
│   │   └── ai.py               Claude insight + physical asset estimates
│   └── tests/                  pytest suite (SQLite, no network)
└── frontend/                   React + Vite + Tailwind
    └── src/
        ├── api.js              Axios instance, attaches the bearer token
        ├── pages/              Login, Register, Dashboard
        ├── components/         AllocationChart, AiInsight, PhysicalAsset*
        └── config/             Asset category definitions and helpers
```

**Data model.** A `User` owns many `Portfolio` rows. Each portfolio holds `Asset` rows (stocks: ticker, shares, purchase price) and `PhysicalAsset` rows (items: name, category, make/model, condition, a JSON `specs` blob for category-specific fields, purchase price and year, location). Physical assets also carry Penny's estimate — `est_low`, `est_high`, `est_summary`, `estimated_at` — populated when the user asks for one.

**Auth.** Register and login are open; everything else requires a JWT bearer token. `get_current_user_id` in `routes/portfolio.py` decodes the token and every query filters on the resulting owner ID, so users only ever see their own data.

**AI.** Both Claude calls use tool schemas rather than free text, so the backend gets typed fields back and the frontend renders them directly — no markdown ever reaches the page. `report_insight` returns a headline, observations, and suggestions; `report_estimate` returns a low/high resale range plus a summary.

## Prerequisites

- Python 3.14+
- Node.js 18+
- PostgreSQL 16

## Setup

### 1. Environment

Create a `.env` in the repository root. Contact a team admin for keys.

```
DATABASE_URL=postgresql://<user>@localhost:5432/penny_db
JWT_SECRET_KEY=<a long random string>
ANTHROPIC_API_KEY=<key>
AI_MODEL=claude-haiku-4-5-20251001
```

`AI_MODEL` is optional and defaults to Haiku. Switching it to `claude-opus-4-8` gives noticeably better financial reasoning at higher cost per request.

### 2. Database

```bash
createdb penny_db
```

Tables are created automatically on first startup.

### 3. Backend

```bash
cd app/backend
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload
```

The API runs at http://localhost:8000 with interactive docs at http://localhost:8000/docs.

### 4. Frontend

```bash
cd app/frontend
npm install
npm run dev
```

The app runs at http://localhost:5173.

## Tests

```bash
cd app/backend
source venv/bin/activate
pytest
```

The suite covers registration, login, token rejection, portfolio and asset CRUD, owner scoping, and physical asset serialization. It runs against a throwaway SQLite file rather than the Postgres database, and only exercises AI paths that return before Claude is called — so tests need no network connection and spend no API credits.

## API

All routes except `/auth/*` require an `Authorization: Bearer <token>` header.

| Method | Route | Purpose |
|---|---|---|
| POST | `/auth/register` | Create an account |
| POST | `/auth/login` | Exchange credentials for a JWT (form-encoded) |
| GET | `/portfolios/` | List the current user's portfolios with their assets |
| POST | `/portfolios/` | Create a portfolio |
| DELETE | `/portfolios/{id}` | Delete a portfolio and everything in it |
| POST | `/portfolios/{id}/assets` | Add a stock holding |
| DELETE | `/portfolios/{id}/assets/{asset_id}` | Remove a stock holding |
| POST | `/portfolios/{id}/physical-assets` | Add a physical item |
| DELETE | `/portfolios/{id}/physical-assets/{asset_id}` | Remove a physical item |
| GET | `/market/{ticker}` | Current market price |
| POST | `/ai/recommendations` | Portfolio insight; optional `risk_tolerance` and `financial_goal` |
| POST | `/ai/estimate/{asset_id}` | Estimate a physical item's current resale value |

## Notes

- `risk_tolerance` must be one of `conservative`, `moderate`, or `aggressive`. Both it and `financial_goal` are optional — omitting them just yields more general advice.
- The allocation chart values stocks at their live price when one is available and physical items at the midpoint of Penny's estimate, falling back to purchase price in both cases.
- Estimates and insights are educational, not professional financial advice.
