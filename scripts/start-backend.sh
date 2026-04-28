#!/usr/bin/env bash
# Start API (8001), LLM service (8002), and Celery worker for local development.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT/backend"

if [[ ! -x .venv/bin/uvicorn ]]; then
  echo "Missing backend/.venv — run: cd backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:5432/llmsecurity}"

PIDS=()
cleanup() {
  for pid in "${PIDS[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
}
trap cleanup EXIT INT TERM

echo "Starting API on http://127.0.0.1:8001 ..."
.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8001 &
PIDS+=($!)

echo "Starting LLM service on http://127.0.0.1:8002 ..."
.venv/bin/uvicorn llm_interactions.main_llm:app --host 127.0.0.1 --port 8002 &
PIDS+=($!)

echo "Starting Celery worker ..."
.venv/bin/celery -A llm_interactions.celery.celery_app worker --loglevel=info &
PIDS+=($!)

echo "Backend running (Ctrl+C to stop)."
wait
