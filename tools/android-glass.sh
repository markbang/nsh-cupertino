#!/usr/bin/env bash
# The Liquid Glass pages, captured on an Android emulator from the packaged
# demo — the evidence that the material draws on Android, where nobody had run
# it (`docs/releases/v0.3.1.md`). Light and dark, the page scrolled so its
# striped band is under the bar, the capsule variants, the glass sheet, and the
# calibration page `tools/android-glass-check.mjs` measures for the lens.
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
LOGCAT=${LOGCAT:-$here/android-glass.logcat.txt}
: > "$LOGCAT"
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

# A software GPU on a runner is slow: the launcher's own storm can raise an ANR
# dialog ("Pixel Launcher isn't responding") over the app. Never show one, and
# let the system settle before driving anything.
adb shell settings put global hide_error_dialogs 1
adb shell wm dismiss-keyguard >/dev/null 2>&1 || true
adb shell input keyevent KEYCODE_BACK >/dev/null 2>&1 || true
sleep 5

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

# The app in front, whatever the system put there first.
launch() {
  local attempt
  for attempt in 1 2 3; do
    adb shell am force-stop "$PKG"
    adb logcat -c
    adb shell am start -W -n "$PKG/com.longbridge.nsh.AppActivity" >/dev/null
    sleep 2
    if adb shell dumpsys window 2>/dev/null | grep -q "mCurrentFocus.*$PKG"; then
      return 0
    fi
    step "the app is not in front; dismissing what is"
    adb shell input keyevent KEYCODE_BACK >/dev/null 2>&1 || true
    sleep 1
  done
  echo "the app never came to the front:" >&2
  adb shell dumpsys window 2>/dev/null | grep -E "mCurrentFocus|mFocusedApp" >&2
  exit 1
}

# A page that did not mount says what is on screen instead. The tree is a
# reading aid, not the gate: a window that never idles (a shader redrawing, a
# list settling) makes `uiautomator` fail, and the capture still has to happen —
# `tools/android-glass-check.mjs` is what judges the frames.
wait_for() {
  ui wait "$1" --timeout 40 && return 0
  step "\"$1\" did not show through the accessibility tree; the screen holds:"
  ui dump || true
  adb shell dumpsys window 2>/dev/null | grep -E "mCurrentFocus" || true
  step "capturing anyway"
  sleep 3
}

shot() {
  step "capture android-glass-$1.png"
  adb exec-out screencap -p > "$OUT/android-glass-$1.png"
  [ -s "$OUT/android-glass-$1.png" ] || { echo "screencap wrote nothing" >&2; exit 1; }
  # What the app logged since it started: a crash, or the shader's warning.
  adb logcat -d -s nsh:V AndroidRuntime:E >> "$LOGCAT" 2>/dev/null || true
}

# A finger that drags the page by `$1` pixels and lifts, then the settle.
scroll_by() {
  adb shell input swipe 540 1600 540 $((1600 - $1)) 600 >/dev/null
  sleep 1
}

# One appearance at a time. Every state is seeded (`cupertino.page`,
# `cupertino.overlay`) and reached with a finger, never by a coordinate
# guessed from the layout: the demo seeds the sheet the same way a screenshot
# test opens it.
capture() {
  local scheme=$1
  step "— $scheme —"
  seed "cupertino.page=glass"
  launch
  wait_for "Under the bar"
  shot "$scheme"
  scroll_by 360
  shot "scrolled-$scheme"
  launch
  wait_for "Under the bar"
  scroll_by 900
  shot "capsules-$scheme"

  # The glass sheet, two ways: seeded open at launch (the seed a screenshot
  # test uses), then opened by a finger on its button.
  seed "cupertino.page=glass" "cupertino.overlay=glass"
  launch
  sleep 3
  adb shell dumpsys window 2>/dev/null | grep -E "Window #|mCurrentFocus" >> "$LOGCAT" || true
  shot "sheet-seeded-$scheme"
  seed "cupertino.page=glass"
  launch
  scroll_by 520
  adb shell input tap 540 2330
  sleep 2
  adb shell dumpsys window 2>/dev/null | grep -E "Window #|mCurrentFocus" >> "$LOGCAT" || true
  shot "sheet-$scheme"

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
grep -i "shader\|GPU\|adapter" "$LOGCAT" | tail -20 || echo "(no shader lines)"

step "done: $(ls "$OUT"/android-glass-*.png | wc -l) captures in $OUT"
