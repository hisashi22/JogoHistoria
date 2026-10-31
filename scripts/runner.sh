#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HELPERS_DIR="$ROOT_DIR/scripts/script-helpers"
UPDATE_SCRIPT="$ROOT_DIR/scripts/update.sh"

if [[ ! -f "$HELPERS_DIR/helpers.sh" ]]; then
  echo "script-helpers not installed. Running scripts/update.sh first..."
  "$UPDATE_SCRIPT"
fi

# shellcheck source=/dev/null
source "$HELPERS_DIR/helpers.sh"
shlib_import logging browser

PORT="${PORT:-8000}"
HOST="${HOST:-127.0.0.1}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_CMD=(python3)
elif command -v python >/dev/null 2>&1; then
  PYTHON_CMD=(python)
else
  log_error "Python is required to run a local web server"
  exit 1
fi

REQUESTED_PORT="$PORT"
for ((i = 0; i < 50; i++)); do
  if ! check_port "$PORT" "$HOST" 2>/dev/null; then
    break
  fi
  PORT=$((PORT + 1))
done

if check_port "$PORT" "$HOST" 2>/dev/null; then
  log_error "No available local server port found from ${REQUESTED_PORT} through ${PORT}"
  exit 1
fi

if [[ "$PORT" != "$REQUESTED_PORT" ]]; then
  log_info "Port ${REQUESTED_PORT} is in use; using ${PORT} instead."
fi

URL="http://${HOST}:${PORT}/"

log_info "Starting 500 A.D. local server at ${URL}"
(
  cd "$ROOT_DIR"
  "${PYTHON_CMD[@]}" -m http.server "$PORT" --bind "$HOST"
) &
SERVER_PID=$!

cleanup() {
  if kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

for ((i = 0; i < 50; i++)); do
  if check_port "$PORT" "$HOST"; then
    break
  fi
  sleep 0.1
done

open_url "$URL"
log_info "Browser opened at ${URL}"
log_info "Press Ctrl+C to stop the server"

wait "$SERVER_PID"
