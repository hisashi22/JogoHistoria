#!/usr/bin/env bash
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/nikolareljin/500ad.git}"
TARGET_DIR="${TARGET_DIR:-$HOME/500ad}"

echo "500ad quickstart"
echo "Repo:   $REPO_URL"
echo "Target: $TARGET_DIR"

if ! command -v git >/dev/null 2>&1; then
  echo "Error: git is required but not installed." >&2
  exit 1
fi

if [ ! -d "$TARGET_DIR" ]; then
  echo "Cloning repository..."
  git clone "$REPO_URL" "$TARGET_DIR"
else
  if [ -d "$TARGET_DIR/.git" ]; then
    echo "Repository already exists; updating..."
    git -C "$TARGET_DIR" pull --ff-only || true
  else
    echo "Error: target exists and is not a git repository: $TARGET_DIR" >&2
    exit 1
  fi
fi

echo "Starting 500ad..."
cd "$TARGET_DIR"
chmod +x ./run
exec ./run
