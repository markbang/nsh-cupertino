#!/usr/bin/env bash
# The Liquid Glass pages, captured on an Android emulator from the packaged
# demo — the evidence that the material draws on Android, where nobody had run
# it (`docs/releases/v0.3.1.md`). Light and dark, the page scrolled so its
# striped band is under the bar (and scrolled further until `tools/android-bar.mjs`
# reads the stripes through the bar itself), the capsule variants, the glass
# sheet, and the calibration page `tools/android-glass-check.mjs` measures for
# the lens.
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

# A frame, taken again while it holds nothing: a window shows white (or black)
# until its first surface draws, and a sheet's dialog takes seconds on a
# software GPU. `$2` is the shade count a drawn frame has — a page has hundreds,
# the calibration page a few by design, so only the pages ask.
shot() {
  local name=$1 least=${2:-0} file=$OUT/android-glass-$1.png attempt
  step "capture android-glass-$name.png"
  for attempt in 1 2 3 4 5 6 7 8; do
    adb exec-out screencap -p > "$file"
    [ -s "$file" ] || { echo "screencap wrote nothing" >&2; exit 1; }
    node "$here/tools/android-frame.mjs" "$file" --min-shades "$least" >/dev/null && break
    step "the frame holds almost nothing yet; taking it again"
    sleep 1
  done
  # What the app logged since it started: a crash, or the shader's warning.
  adb logcat -d -s nsh:V AndroidRuntime:E >> "$LOGCAT" 2>/dev/null || true
}

# A finger that drags the page by `$1` pixels and lifts, then the settle.
scroll_by() {
  adb shell input swipe 540 1600 540 $((1600 - $1)) 600 >/dev/null
  sleep 1
}

# The same finger the other way: the content comes back, the tab bar expands.
scroll_up_by() {
  adb shell input swipe 540 $((1600 - $1)) 540 1600 600 >/dev/null
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
  wait_for "Liquid Glass"
  shot "$scheme"
  # The hero band and the sections below it: the controls float over content
  # and the scroll edge dissolves it under them.
  scroll_by 300
  shot "mid-$scheme"
  # Further down the tab bar minimizes to its selected tab; a drag back up
  # expands it again, which is the state the material is measured in.
  scroll_by 500
  sleep 1
  shot "tabmin-$scheme"
  scroll_up_by 320
  sleep 1
  shot "scrolled-$scheme"

  # The chosen tab changes after mount, then the page scrolls: the minimised
  # pill must be Settings' at Settings' slot (0.4.1). The Settings tab sits at
  # the fourth of four cells, 20 pt in from the edges.
  launch
  wait_for "Liquid Glass"
  adb shell input tap 906 2221 >/dev/null
  sleep 1
  scroll_by 900
  sleep 2
  shot "tabmin-settings-$scheme"

  # The glass sheet, seeded open at launch — the seed a screenshot test uses.
  # Its window takes seconds to draw on a software GPU.
  seed "cupertino.page=glass" "cupertino.overlay=glass"
  launch
  sleep 1
  shot "sheet-$scheme" 100

  # A white page of 14 pt rows: no strokes through the bar, a pill with a
  # shape, and an edge that reaches the page's colour.
  seed "cupertino.page=glass-rows"
  launch
  wait_for "All inboxes"
  shot "rows-top-$scheme"
  scroll_by 70
  shot "rows-edge-$scheme"
  scroll_by 350
  scroll_up_by 120
  sleep 1
  shot "rows-scrolled-$scheme"
  scroll_by 500
  sleep 2
  shot "rows-tabmin-$scheme"

  local mode
  for mode in none material shader; do
    seed "cupertino.page=glass-calibration" "cupertino.glass=$mode"
    launch
    sleep 2
    shot "calibration-$mode-$scheme" 30
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
