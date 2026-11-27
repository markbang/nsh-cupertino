# The glass pixel checks, the tab bar's among them (`tools/glass-pixels.mjs`
# runs `tab-bar-pixels.mjs` and `tab-bar-motion.mjs`), as CI's glass-pixels job
# runs them.
node tools/glass-pixels.mjs
#!/usr/bin/env bash
# Captures docs/screenshots from the web build and checks the separators it
# drew. Run from the repository root; the demo app has no `fs` capability, so
# the directory is made here.
#
# The Liquid Glass pages are shot by `tools/glass-shots.mjs` instead: they need
# a shader, and `nsh test` regenerates the runtime that `tools/patch-runtime.mjs`
# has to fix (see docs/design-notes.md), so a test's page can never draw one.
set -euo pipefail
mkdir -p docs/screenshots
cd examples/demo
nsh test screenshots.test.tsx --target web "$@"
nsh test separators.test.tsx --target web "$@"
cd ../..
node tools/glass-shots.mjs "$@"
# The glass pixel checks, the tab bar's among them (`tools/glass-pixels.mjs`
# runs `tab-bar-pixels.mjs` and `tab-bar-motion.mjs`), as CI's glass-pixels job
# runs them.
node tools/glass-pixels.mjs
