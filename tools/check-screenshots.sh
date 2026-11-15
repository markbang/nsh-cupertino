#!/usr/bin/env bash
# Every demo page has its light and dark screenshot after the web run, plus the
# two increased-contrast ones and the four overlays open in both appearances.
# Run from the repository root.
set -euo pipefail
dir="${1:-docs/screenshots}"
pages=(gallery navigation lists buttons textfields search switches indicators scroll materials colors type sheet actionsheet alert contextmenu picker datepicker segmented slider tabbar swipe refresh bar-materials)
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
  for page in sheet actionsheet alert contextmenu; do
    file="$dir/$page-open-$scheme.png"
    [ -s "$file" ] || { echo "::error::missing $file"; missing=1; }
  done
done
exit "$missing"
