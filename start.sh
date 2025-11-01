#!/usr/bin/env bash
set -euo pipefail

# Start Python FastAPI on loopback
python3 -m uvicorn python_app.main:app --host ${PY_HOST:-127.0.0.1} --port ${PY_PORT:-5001} &
PY_PID=$!

# Trap termination to clean Python up
cleanup() {
  kill -TERM "$PY_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Start Node
node src/server.js
