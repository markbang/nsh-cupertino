#!/usr/bin/env bash
# Every demo page has its light and dark screenshot after the web run, plus the
# two increased-contrast ones and the four overlays open in both appearances.
# Run from the repository root. Pages after the directory check only those
# (CI's pull requests shoot the pages they touch, .github/ci/screens.json).
#
#   tools/check-screenshots.sh [docs/screenshots [page ...]]
set -euo pipefail
dir="${1:-docs/screenshots}"
pages=(gallery navigation lists buttons textfields search switches indicators scroll materials glass colors type sheet actionsheet alert contextmenu picker datepicker segmented slider tabbar swipe refresh bar-materials)
if [ $# -gt 1 ]; then
  shift
  for page in "$@"; do
    [[ " ${pages[*]} " == *" $page "* ]] || { echo "::error::$page is not a demo page (tools/check-screenshots.sh)"; exit 1; }
  done
  pages=("$@")
fi
selected() { [[ " ${pages[*]} " == *" $1 "* ]]; }
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
  if selected gallery; then
    file="$dir/gallery-$scheme-contrast.png"
    [ -s "$file" ] || { echo "::error::missing $file"; missing=1; }
  fi
  for page in sheet actionsheet alert contextmenu; do
    selected "$page" || continue
    file="$dir/$page-open-$scheme.png"
    [ -s "$file" ] || { echo "::error::missing $file"; missing=1; }
  done
done
# The tab bar's comparison images, for review (in the artifact, not published:
# tools/publish-shots.sh takes the top-level PNGs only).
if [ -s "$dir/motion/tab-bar-exact-light.json" ] && [ -s "$dir/motion/tab-bar-exact-dark.json" ]; then
  node tools/tab-bar-compare.mjs --dir "$dir" --out "$dir/compare" || missing=1
  node tools/tab-bar-tip-crops.mjs --dir "$dir" --out "$dir/compare" || missing=1
fi
echo "checked ${#pages[@]} pages in $dir"
exit "$missing"
