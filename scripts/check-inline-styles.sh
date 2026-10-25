#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
echo 'Checking for inline style attributes in HTML files...'
found=0
while IFS= read -r -d '' file; do
  if grep -HnE 'style[[:space:]]*=' "$file"; then found=1; fi
done < <(find . -type f -name '*.html' -not -path './node_modules/*' -not -path './.git/*' -print0)
if (( found )); then
  echo 'Inline styles found. Use the shared stylesheets.' >&2
  exit 1
fi
echo 'No inline style attributes found.'
