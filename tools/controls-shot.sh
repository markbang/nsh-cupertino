#!/usr/bin/env bash
# Renders the catalog-controls page at the scale of Cohub Mobile's iOS
# reference: 402 × 874 pt at 720 × 1565 px, so 1.791 px per point. Light and
# dark land in docs/screenshots/ (not committed). Run from the repository root.
#
# The web host draws at the browser's device scale, so the script starts
# Chrome with `--force-device-scale-factor`. The host also leaves 44 pt under
# the page, so the app is laid out 918 pt tall and the frame is cropped to
# 874 pt. `CHROME` picks the browser (default: google-chrome); `CHROME_ARGS`
# adds flags, for a sandbox that needs `--no-sandbox`. Needs Pillow.
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
cd ../..
python3 - "$scale" <<'PY'
import sys
from pathlib import Path
from PIL import Image

scale = float(sys.argv[1])
for scheme in ("light", "dark"):
    path = Path("docs/screenshots") / f"catalog-controls-{scheme}.png"
    image = Image.open(path)
    image.crop((0, 0, round(402 * scale), round(874 * scale))).save(path)
    print(f"{path}: {image.width} x {round(874 * scale)} px")
PY
