# LLM Security Suite

A full-stack **Multimodal LLM Security Suite** — a platform for AI vulnerability testing. Tests LLMs against adversarial prompts categorized by attack type, records results, and surfaces vulnerability findings.

## Architecture

- **Frontend**: React + Vite (TypeScript) with Tailwind CSS and React Router — runs on port 5000
- **Backend**: FastAPI (Python) with SQLAlchemy ORM — runs on port 8000
- **Database**: PostgreSQL (Replit managed, `DATABASE_URL` env var)
- **Design**: Dark security theme (`#0b0d14` bg, `#10121c` surface, `#1e2236` border, `#6366f1` indigo accent)

## Project Structure

```
frontend/
  src/
    api.ts              Axios API client — all backend calls + TypeScript interfaces
    App.tsx             Router: /, /scans, /reports, /prompts, /models
    components/
      Layout.tsx        Sidebar navigation with ShieldAlert branding
    pages/
      Dashboard.tsx     Security KPIs, attack category bars, risk distribution, coverage stats, recent scans
      Scans.tsx         Scan management — initiate runs, expand rows, record results
      Reports.tsx       Vulnerability findings — filter by status/category, export JSON
      Prompts.tsx       Prompt library — category cards, filterable table, add new prompts
      Models.tsx        Model registry — provider-colored cards, register/delete

LLMSecuritySuite-bukunmi-db-and-api/
  backend/
    main.py             FastAPI app, CORS, route registration, auto-creates DB tables
    database.py         SQLAlchemy engine + session
    models.py           ORM models: User, Model, Prompt, TestRun, Result
    schemas.py          Pydantic request/response schemas
    routers/
      users.py          GET /users/, GET /users/{id}
      models.py         CRUD /models/
      scans.py          /scans/prompts/, /scans/, /scans/{id}/results,
                        /scans/stats/overview, /scans/results/all
    start.sh            Backend startup script
```

## Prompt Attack Categories

- `prompt_injection` — Attempts to override system instructions
- `jailbreak` — Bypasses safety guardrails
- `data_exfiltration` — Extracts sensitive system data
- `normal` — Baseline / control inputs

## Risk Levels

`low` | `medium` | `high`

## Result Severities

`none` | `low` | `medium` | `high` | `critical`

## Database Schema

- **users**: id, name, email
- **models**: id, name, provider, model_type, access_method, credential_reference
- **prompts**: id, input_text, category, risk_level, created_by (FK users)
- **test_runs**: id, prompt_id (FK), model_id (FK), run_status, created_at
- **results**: id, test_run_id (FK), output_text, vulnerability_detected, notes, severity

## Seed Data

- 3 users, 2 models (gpt-4 / claude), 5 prompts, 5 test runs with results

## Workflows

- **Start application**: `cd frontend && npm run dev` — webview on port 5000
- **Backend API**: `bash LLMSecuritySuite-bukunmi-db-and-api/backend/start.sh` — console on port 8000

## Frontend → Backend Proxy

Vite proxies `/api/*` → `http://localhost:8000/*`
