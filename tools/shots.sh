#!/usr/bin/env bash
# Captures docs/screenshots from the web build and checks the separators it
# drew. Run from the repository root; the demo app has no `fs` capability, so
# the directory is made here.
set -euo pipefail
mkdir -p docs/screenshots
cd examples/demo
nsh test screenshots.test.tsx --target web "$@"
nsh test separators.test.tsx --target web "$@"
