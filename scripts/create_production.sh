#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./scripts/create_production.sh -t <tag> [--name <name>|--tag-name <name>|--branch <name>] [--remote <name>] [--repo <path>] [--fetch-tags]

Update a production-style tag (default: production) to point at an existing release tag.
EOF
}

release_tag=""
production_tag="production"
remote_name="origin"
repo_dir="${GITHUB_WORKSPACE:-$(pwd)}"
fetch_tags=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    -t|--tag)
      if [[ $# -lt 2 || -z ${2:-} ]]; then
        echo "Missing required tag argument (-t <tag>)" >&2
        usage >&2
        exit 2
      fi
      release_tag="$2"
      shift 2
      ;;
    --name|--tag-name|--branch)
      if [[ $# -lt 2 || -z ${2:-} ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 2
      fi
      production_tag="$2"
      shift 2
      ;;
    --remote)
      if [[ $# -lt 2 || -z ${2:-} ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 2
      fi
      remote_name="$2"
      shift 2
      ;;
    --repo)
      if [[ $# -lt 2 || -z ${2:-} ]]; then
        echo "Missing value for $1" >&2
        usage >&2
        exit 2
      fi
      repo_dir="$2"
      shift 2
      ;;
    --fetch-tags)
      fetch_tags=true
      shift
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ -z "$release_tag" ]]; then
  echo "Missing required tag argument (-t <tag>)" >&2
  usage >&2
  exit 2
fi

if $fetch_tags; then
  git -C "$repo_dir" fetch --tags --prune --force "$remote_name"
fi

if ! git -C "$repo_dir" rev-parse -q --verify "refs/tags/$release_tag" >/dev/null; then
  echo "Release tag not found: $release_tag" >&2
  exit 1
fi

git -C "$repo_dir" tag -f "$production_tag" "$release_tag"
git -C "$repo_dir" push "$remote_name" "refs/tags/$production_tag:refs/tags/$production_tag" --force

echo "Updated tag '$production_tag' -> '$release_tag'"
