#!/usr/bin/env bash
# Every demo page has its light and dark screenshot after the web run, plus the
# two increased-contrast ones. Run from the repository root.
set -euo pipefail
dir="${1:-docs/screenshots}"
pages=(gallery navigation lists buttons textfields search switches indicators scroll colors type)
missing=0
for page in "${pages[@]}"; do
  for scheme in light dark; do
    file="$dir/$page-$scheme.png"
    if [ ! -s "$file" ]; then
      echo "::error::missing $file"
      missing=1
    elif [ "$(wc -c < "$file")" -lt 2000 ]; then
      echo "::error::$file is too small to be a screenshot"
      missing=1
    fi
  done
done
for scheme in light dark; do
  file="$dir/gallery-$scheme-contrast.png"
  [ -s "$file" ] || { echo "::error::missing $file"; missing=1; }
done
exit "$missing"
