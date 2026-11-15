#!/usr/bin/env bash
# The Liquid Glass pages, captured on an Android emulator from the packaged
# demo — the evidence that the material draws on Android, where nobody had run
# it (`docs/releases/v0.3.1.md`). Light and dark, the rows under the bar
# mid-scroll, the capsule variants, the glass sheet, and the calibration page
# `tools/android-glass-check.mjs` measures for refraction.
#
#   tools/android-glass.sh <apk or directory of APKs> [out dir]
#
# The emulator is rooted (`adb root`) so the app's storage is seeded with the
# page to land on, the same keys `open(entry, { storage })` seeds in a test.
# Everything else is a finger: `input swipe` scrolls, `input tap` presses.
set -euo pipefail

here=$(cd "$(dirname "$0")/.." && pwd)
APK=${1:?usage: tools/android-glass.sh <apk or directory of APKs> [out dir]}
OUT=${2:-$here/docs/screenshots}
if [ -d "$APK" ]; then
  APK=$(find "$APK" -maxdepth 2 -name '*.apk' | head -1)
  [ -n "$APK" ] || { echo "no APK in $1" >&2; exit 1; }
fi
PKG=dev.nsh.cupertino.demo
DATA=/data/data/$PKG/files/nsh/$PKG
mkdir -p "$OUT"

step() { echo "== $*"; }
ui() { python3 "$here/tools/android-ui.py" "$@"; }

adb wait-for-device
step "the emulator is up: $(adb shell getprop ro.product.model | tr -d '\r')"

# Root, for the app's storage: a packaged app is not debuggable, so `run-as`
# cannot seed it.
adb root >/dev/null 2>&1 || true
adb wait-for-device
if [ "$(adb shell id -u | tr -d '\r')" != "0" ]; then
  echo "adb is not root: the app's storage cannot be seeded, and the pages" >&2
  echo "would be the gallery's first one. Use an image that allows adb root" >&2
  echo "(google_apis, not google_apis_playstore)." >&2
  exit 1
fi

step "installing $(basename "$APK")"
adb install -r -g "$APK" >/dev/null

# The app's storage, as `open(entry, { storage })` seeds it: `key=value ...`.
seed() {
  local json="{" sep="" pair
  for pair in "$@"; do
    json+="$sep\"${pair%%=*}\":\"${pair#*=}\""
    sep=","
  done
  json+="}"
  adb shell "mkdir -p $DATA"
  adb shell "printf '%s' '$json' > $DATA/storage.json"
  local owner
  owner=$(adb shell stat -c '%u:%g' "/data/data/$PKG" | tr -d '\r')
  adb shell "chown -R $owner $DATA"
  adb shell "restorecon -R /data/data/$PKG/files" >/dev/null 2>&1 || true
}

launch() {
  adb shell am force-stop "$PKG"
  adb logcat -c
  adb shell am start -W -n "$PKG/com.longbridge.nsh.AppActivity" >/dev/null
  sleep 2
}

# A page that did not mount says what is on screen instead: a seeded page the
# app did not read is the likely misstep, and the tree names the one it showed.
wait_for() {
  ui wait "$1" --timeout 40 && return 0
  step "\"$1\" never appeared; the screen holds:"
  ui dump || true
  adb logcat -d -s nsh:V | tail -20 || true
  exit 1
}

shot() {
  step "capture android-glass-$1.png"
  adb exec-out screencap -p > "$OUT/android-glass-$1.png"
  [ -s "$OUT/android-glass-$1.png" ] || { echo "screencap wrote nothing" >&2; exit 1; }
}

# A finger dragging for 3 s, with the frame taken while it moves: the rows are
# part-way under the bar, which is where the lens and the blur follow content.
mid_scroll() {
  adb shell input swipe 540 1900 540 500 3000 >/dev/null 2>&1 &
  local finger=$!
  sleep 1.2
  shot "scrolled-$1"
  wait "$finger"
}

# The three pages of the glass: one appearance at a time.
capture() {
  local scheme=$1
  step "— $scheme —"
  seed "cupertino.page=glass"
  launch
  wait_for "Under the bar"
  shot "$scheme"
  mid_scroll "$scheme"
  ui scroll-to "thick" --exact
  sleep 0.8
  shot "capsules-$scheme"
  ui scroll-to "Glass sheet" --exact
  ui tap "Glass sheet" --exact
  sleep 1.2
  shot "sheet-$scheme"
  adb shell input keyevent KEYCODE_BACK
  sleep 1

  local mode
  for mode in none material shader; do
    seed "cupertino.page=glass-calibration" "cupertino.glass=$mode"
    launch
    sleep 1
    shot "calibration-$mode-$scheme"
  done
}

adb shell cmd uimode night no >/dev/null
capture light

adb shell cmd uimode night yes >/dev/null
sleep 2
capture dark
adb shell cmd uimode night no >/dev/null

# What the GPU is, and whether the shader opened a device: the run's answer to
# "did it draw, or fall back?" (the material's fill is the fallback).
step "the shader's log"
adb logcat -d -s nsh:V > "${LOGCAT:-/tmp/logcat.txt}" 2>/dev/null || true
grep -i "shader" "${LOGCAT:-/tmp/logcat.txt}" | tail -20 || echo "(no shader lines)"

step "done: $(ls "$OUT"/android-glass-*.png | wc -l) captures in $OUT"
