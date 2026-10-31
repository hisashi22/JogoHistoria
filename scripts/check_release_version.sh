#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(tr -d ' \t\n\r' < VERSION)"

if ! [[ "$VERSION" =~ ^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$ ]]; then
  echo "VERSION is invalid: $VERSION" >&2
  exit 1
fi

grep -Fq "window.APP_VERSION = '$VERSION';" assets/version.js || {
  echo "assets/version.js is not synced to VERSION=$VERSION. Run ./scripts/version_set.sh \"$VERSION\" to sync all files." >&2
  exit 1
}

grep -Fq "**Version $VERSION**" README.md || {
  echo "README version line is not synced to VERSION=$VERSION. Run ./scripts/version_set.sh \"$VERSION\" to sync all files." >&2
  exit 1
}

grep -Fq "const SAVE_VERSION = resolveAppVersion();" js/state.js || {
  echo "js/state.js must derive SAVE_VERSION from resolveAppVersion() (backed by assets/version.js)." >&2
  exit 1
}

grep -Fq "window.APP_VERSION" js/state.js || {
  echo "js/state.js must reference window.APP_VERSION as the runtime version source." >&2
  exit 1
}

if grep -nE "const[[:space:]]+SAVE_VERSION[[:space:]]*=[[:space:]]*'([0-9]+\\.){2}[0-9]+'" js/state.js >/dev/null; then
  echo "Hardcoded SAVE_VERSION literal detected in js/state.js. Use resolveAppVersion() and VERSION/assets/version.js as the single source of truth." >&2
  exit 1
fi

branch="${GITHUB_HEAD_REF:-}"
if [[ -z "$branch" && "${GITHUB_REF_TYPE:-}" == "branch" ]]; then
  branch="${GITHUB_REF_NAME:-}"
fi
if [[ -z "$branch" ]]; then
  branch="$(git rev-parse --abbrev-ref HEAD)"
fi
if [[ "$branch" =~ ^release/([0-9]+\.[0-9]+\.[0-9]+)$ ]]; then
  branch_version="${BASH_REMATCH[1]}"
  if [[ "$branch_version" != "$VERSION" ]]; then
    echo "Release branch/version mismatch: branch=$branch version=$VERSION" >&2
    exit 1
  fi
fi

echo "Version check passed: $VERSION"
