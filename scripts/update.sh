#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SUBMODULE_PATH="scripts/script-helpers"
SUBMODULE_DIR="$ROOT_DIR/$SUBMODULE_PATH"

cd "$ROOT_DIR"

echo "Synchronizing submodule metadata..."
git submodule sync -- "$SUBMODULE_PATH"

echo "Initializing/updating $SUBMODULE_PATH..."
git submodule update --init --recursive "$SUBMODULE_PATH"

if [[ ! -d "$SUBMODULE_DIR/.git" && ! -f "$SUBMODULE_DIR/.git" ]]; then
  echo "Submodule checkout is missing at $SUBMODULE_DIR" >&2
  exit 1
fi

cd "$SUBMODULE_DIR"

echo "Fetching production ref and tags..."
git fetch --tags origin production

production_sha="$(git rev-parse --verify origin/production)"
production_tag="$(git tag --points-at "$production_sha" | grep -E '^[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1 || true)"

if [[ -n "$production_tag" ]]; then
  echo "Pinning submodule to production tag: $production_tag"
  git checkout --detach "$production_tag"
else
  echo "No semver tag found at origin/production; pinning to origin/production commit $production_sha"
  git checkout --detach "$production_sha"
fi

cd "$ROOT_DIR"
echo "Submodule updated successfully."
