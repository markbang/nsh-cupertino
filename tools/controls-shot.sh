#!/usr/bin/env bash
# Renders the catalog-controls page at the scale of Cohub Mobile's iOS
# reference: 402 × 874 pt at 720 × 1565 px, so 1.791 px per point. Light and
# dark land in docs/screenshots/ (not committed). Run from the repository root.
#
# The web host draws at the browser's device scale, so the script starts
# Chrome with `--force-device-scale-factor`. `CHROME` picks the browser
# (default: google-chrome); `CHROME_ARGS` adds flags, for a sandbox that needs
# `--no-sandbox`.
set -euo pipefail
scale="${CONTROLS_SCALE:-1.791}"
chrome="${CHROME:-google-chrome}"
wrapper="$(mktemp -d)/chrome"
cat > "$wrapper" <<SH
#!/bin/sh
exec "$chrome" --force-device-scale-factor=$scale \${CHROME_ARGS:-} "\$@"
SH
chmod +x "$wrapper"
mkdir -p docs/screenshots
cd examples/demo
nsh test controls.test.tsx --target web --browser "$wrapper"
