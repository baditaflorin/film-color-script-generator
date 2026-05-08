#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

PORT="${PORT:-$((4173 + RANDOM % 1000))}"
mkdir -p tmp

npm run build

node scripts/serve-pages.mjs --port "$PORT" >tmp/smoke-server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" >/dev/null 2>&1 || true' EXIT

READY=0
for _ in $(seq 1 40); do
  if curl -fsS "http://127.0.0.1:${PORT}/film-color-script-generator/" >/dev/null 2>&1; then
    READY=1
    break
  fi
  sleep 0.25
done

if [ "$READY" -ne 1 ]; then
  cat tmp/smoke-server.log
  exit 1
fi

PLAYWRIGHT_BASE_URL="http://127.0.0.1:${PORT}/film-color-script-generator/" npx playwright test --project=chromium
