#!/usr/bin/env bash
set -euo pipefail

GIT_HOOKS_DIR=".git/hooks"
PRE_COMMIT_FILE="$GIT_HOOKS_DIR/pre-commit"

if [ ! -d ".git" ]; then
  echo "Not a git repository (no .git directory) — skipping hook installation." >&2
  exit 0
fi

mkdir -p "$GIT_HOOKS_DIR"
cat > "$PRE_COMMIT_FILE" <<'HOOK'
#!/usr/bin/env bash
# Pre-commit hook: run inline-style checker
./scripts/check-inline-styles.sh || { echo "Pre-commit: inline style check failed. Fix inline styles before committing."; exit 1; }
HOOK

chmod +x "$PRE_COMMIT_FILE"

echo "Installed pre-commit hook at $PRE_COMMIT_FILE"
