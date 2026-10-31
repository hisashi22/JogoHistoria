#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

VERSION="$(tr -d ' \t\n\r' < VERSION)"

if [[ -z "$VERSION" ]]; then
  echo "VERSION file is empty" >&2
  exit 1
fi

"$ROOT_DIR/scripts/check_release_version.sh"

if git rev-parse -q --verify "refs/tags/$VERSION" >/dev/null; then
  echo "Tag already exists: $VERSION" >&2
  exit 1
fi

git tag -a "$VERSION" -m "Release $VERSION"
echo "Created tag $VERSION"
echo "Push with: git push origin $VERSION"
