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
node tools/glass-pixels.mjs
# The tab bar over the iOS 27 tab-bar fixture's own backdrop (`glass-shots`
# fetched the frames and checked their hashes): its body refitted to the
# two-scale model, against the iOS frames, and its readability floor.
node tools/tab-bar-pixels.mjs
