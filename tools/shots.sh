#!/usr/bin/env bash
# Captures docs/screenshots from the web build. Run from the repository root;
# the demo app has no `fs` capability, so the directory is made here.
set -euo pipefail
mkdir -p docs/screenshots
cd examples/demo
exec nsh test screenshots.test.tsx --target web "$@"
