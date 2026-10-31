#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VERSION_FILE="$ROOT_DIR/VERSION"
NEW_VERSION="${1:-}"

if [[ -z "$NEW_VERSION" ]]; then
  echo "Usage: $0 <X.Y.Z>" >&2
  exit 2
fi

if ! [[ "$NEW_VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "Invalid version: $NEW_VERSION (expected canonical semver X.Y.Z)" >&2
  exit 2
fi

printf '%s\n' "$NEW_VERSION" > "$VERSION_FILE"

cat > "$ROOT_DIR/assets/version.js" <<EOT
// Generated from VERSION. Update with: ./scripts/version_set.sh <semver>
window.APP_VERSION = '$NEW_VERSION';
EOT

replace_in_file() {
  local awk_program="$1"
  local target_file="$2"
  local tmp_file
  if ! tmp_file="$(mktemp)"; then
    echo "Failed to create temporary file for $target_file" >&2
    exit 1
  fi
  if ! awk "$awk_program" "$target_file" > "$tmp_file"; then
    rm -f "$tmp_file"
    echo "Failed to update $target_file" >&2
    exit 1
  fi
  mv "$tmp_file" "$target_file"
}

replace_in_file "{ gsub(/\\*\\*Version [0-9]+\\.[0-9]+\\.[0-9]+\\*\\*/, \"**Version ${NEW_VERSION}**\"); print }" "$ROOT_DIR/README.md"

echo "Version synchronized to $NEW_VERSION"
