#!/usr/bin/env python3
"""The GlassMenu morph fitted to the iOS clip research/ios-reference/motion/motion-menu.mp4.

    python3 tools/fit-glass-menu.py [mp4]            # the fit table
    python3 tools/fit-glass-menu.py [mp4] --rust     # the 30 ms trajectories src/glass_menu.rs pins

The clip is 30 fps, the iOS screen its left 442 px (1.0995 px per pt). Frames 0-4
and 5-8 are copies, so the opening has three states that differ: frame 0 (a
round blob, no items), 5 (the peak, items in) and 9 (at rest). The tap is before
frame 0; the fit puts the start 107 ms before it.

Edges: the panel's right edge is where the bars under it change (|frame - closed|
> 30 on the bars' rows), its top and bottom where it is lighter than the cream
page (> 241.5). Frame 0's blob is no lighter than the page: its top and bottom are
those of the largest region that changed (by 25 and by 10 levels, as
tools/measure-menu-morph.py finds it), less 8 px of shadow at the bottom
(about +-8 px). The left edge sits on the bars' own start (x 17 px), so
it is not used. The source is a 44 pt button around the menu icon (x 26-38, y 166-176 px).
Corner radius: a circle fitted to the bottom corners over the page.
"""
import argparse
import subprocess

import numpy as np
from scipy import ndimage

PX = 1.0995
W, H = 442, 960
CLOSED = 1000
SHADOW_PX = 8  # how far the shadow reaches past the glass (tools/measure-menu-morph.py)
BARS = [(189, 228), (237, 277), (286, 325), (334, 373), (382, 421), (431, 470), (479, 518)]
SOURCE = dict(cx=32 / PX, cy=171 / PX, w=44.0, h=44.0)
START_MS = 107.0  # the fitted press, before frame 0

# The model src/glass_menu.rs implements (ms from the press).
SHAPE = (0.76, 380.0)            # zeta, stiffness: width, height, centre x
DROP = (380.0, 540.0, 270.0)     # pt x (critical k 540 - critical k 270)
CORNERS = (180.0, 230.0)         # delay, duration, ease-in-out: capsule -> 28 pt
ITEMS = (110.0, 140.0)           # delay, duration, ease-out
CLOSE_FADE = (70.0, 60.0)        # delay, duration, ease-in
CLOSE_SHRINK = (70.0, 30.0)      # delay, duration, ease-out
CLOSE_SCALE, CLOSE_SHIFT = 0.94, (-5.0, 17.0)
RADIUS = 28.0


def frames(path, wanted):
    keep = set(wanted) | {CLOSED}
    process = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", path, "-vf", f"crop={W}:{H}:0:0",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    out = {}
    for index in range(max(keep) + 1):
        raw = process.stdout.read(W * H * 3)
        if len(raw) < W * H * 3:
            break
        if index in keep:
            out[index] = np.frombuffer(raw, np.uint8).reshape(H, W, 3).astype(np.float32)
    process.kill()
    return out


def edges(f, closed):
    grey = f.mean(2)
    diff = np.abs(f - closed).max(2)
    right = [np.where(diff[y] > 30)[0].max() for a, b in BARS for y in range(a + 8, b - 8, 3)
             if (diff[y] > 30).any()]
    top, bottom = [], []
    for x in range(60, 200, 4):
        below = np.where(grey[519:700, x] > 241.5)[0]
        above = np.where(grey[100:189, x] > 241.5)[0]
        if len(below):
            bottom.append(519 + below.max())
        if len(above):
            top.append(100 + above.min())
    if not top or not bottom:  # the blob: the largest region that changed
        top = [blob(diff, 25)[0]]
        bottom = [blob(diff, 10)[1] - SHADOW_PX]
    return np.median(right), np.median(top), np.median(bottom)


def blob(diff, threshold):
    """The top and bottom row of the largest region that changed by `threshold`."""
    diff = diff.copy()
    diff[:130] = 0
    mask = ndimage.binary_opening(diff > threshold, iterations=2)
    labels, count = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    ys, _ = np.where(labels == int(np.argmax(sizes)) + 1)
    return ys.min(), ys.max()


def bottom_radius(f, bottom, right):
    grey = f.mean(2)
    rows = []
    for k in range(0, 70):
        y = int(bottom) - k
        if y < 522:
            break
        xs = np.where(grey[y, :330] > 241.5)[0]
        if len(xs) > 5:
            rows.append((k, xs.max()))
    best = (1e9, 0)
    for b0 in np.arange(bottom - 3, bottom + 3, 0.5):
        for r in range(5, 200):
            err = []
            for k, x in rows:
                kk = b0 - (bottom - k)
                if kk < 0:
                    continue
                inset = 0 if kk > r else r - np.sqrt(max(r * r - (r - kk) ** 2, 0))
                err.append((x - (right - inset)) ** 2)
            if err and np.sqrt(np.mean(err)) < best[0]:
                best = (np.sqrt(np.mean(err)), r)
    return best[1] / PX


def opacity(f, closed, rest):
    ys = np.concatenate([np.arange(a + 6, b - 6) for a, b in BARS])
    xs = np.arange(200, 265)
    d, s = (f - closed)[np.ix_(ys, xs)], (rest - closed)[np.ix_(ys, xs)]
    return float((d * s).sum() / (s * s).sum())


def spring(ms, zeta, k):
    w, t = np.sqrt(k), np.maximum(np.asarray(ms, float), 0) / 1000
    if abs(zeta - 1) < 1e-3:
        return 1 - (1 + w * t) * np.exp(-w * t)
    wd = w * np.sqrt(1 - zeta * zeta)
    return 1 - np.exp(-zeta * w * t) * (np.cos(wd * t) + zeta * w / wd * np.sin(wd * t))


def bezier(x1, y1, x2, y2, x):
    """CSS cubic-bezier at x (bisection on the curve's x)."""
    lo, hi = 0.0, 1.0
    for _ in range(60):
        t = (lo + hi) / 2
        bx = 3 * (1 - t) ** 2 * t * x1 + 3 * (1 - t) * t * t * x2 + t ** 3
        lo, hi = (t, hi) if bx < x else (lo, t)
    t = (lo + hi) / 2
    return 3 * (1 - t) ** 2 * t * y1 + 3 * (1 - t) * t * t * y2 + t ** 3


EASE = dict(ease_in=(0.42, 0, 1, 1), ease_out=(0, 0, 0.58, 1), ease_in_out=(0.42, 0, 0.58, 1))


def timing(ms, delay, duration, easing):
    x = min(max((ms - delay) / duration, 0.0), 1.0)
    return x if x in (0.0, 1.0) else bezier(*EASE[easing], x)


def model(ms):
    p = spring(ms, *SHAPE)
    d, kf, ks = DROP
    return dict(
        grow=float(p),
        drop=float(d * (spring(ms, 1, kf) - spring(ms, 1, ks))),
        roundness=1 - timing(ms, *CORNERS, "ease_in_out"),
        items=timing(ms, *ITEMS, "ease_out"),
    )


def close(ms):
    shrink = timing(ms, *CLOSE_SHRINK, "ease_out")
    return dict(opacity=1 - timing(ms, *CLOSE_FADE, "ease_in"),
                scale=1 + (CLOSE_SCALE - 1) * shrink,
                shift_y=CLOSE_SHIFT[1] * shrink)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mp4", nargs="?", default="research/ios-reference/motion/motion-menu.mp4")
    parser.add_argument("--rust", action="store_true")
    args = parser.parse_args()
    if args.rust:
        grid = range(0, 601, 30)
        for name in ("grow", "drop", "roundness", "items"):
            print(f"{name}: [{', '.join(f'{model(t)[name]:.4f}' for t in grid)}]")
        for name in ("opacity", "scale", "shift_y"):
            print(f"close {name}: [{', '.join(f'{close(t)[name]:.4f}' for t in range(0, 151, 30))}]")
        return

    clip = frames(args.mp4, [0, 5, 9, 12, 61, 63, 64])
    closed, rest = clip[CLOSED], clip[12]
    r_right, r_top, r_bottom = edges(rest, closed)
    left = 16
    rest_box = dict(w=(r_right - left) / PX, h=(r_bottom - r_top) / PX,
                    cx=(left + r_right) / 2 / PX, cy=(r_top + r_bottom) / 2 / PX)
    print(f"rest panel: {rest_box['w']:.1f} x {rest_box['h']:.1f} pt; source: 44 pt at "
          f"({SOURCE['cx']:.1f}, {SOURCE['cy']:.1f}) pt")
    print("| frame | ms from press | channel | iOS | model | off |")
    print("| --- | --- | --- | --- | --- | --- |")
    for index in (0, 5, 9):
        f = clip[index]
        right, top, bottom = edges(f, closed)
        lft = 18 if index == 0 else left
        ios = dict(w=(right - lft) / PX, h=(bottom - top) / PX,
                   cx=(lft + right) / 2 / PX, cy=(top + bottom) / 2 / PX)
        ms = index * 1000 / 30 + START_MS
        m = model(ms)
        shape = {k: SOURCE[k] + (rest_box[k] - SOURCE[k]) * m["grow"] for k in ("w", "h", "cx", "cy")}
        shape["cy"] += m["drop"]
        for k in ("w", "h", "cx", "cy"):
            print(f"| {index} | {ms:.0f} | {k} (pt) | {ios[k]:.1f} | {shape[k]:.1f} | {shape[k] - ios[k]:+.1f} |")
        if index > 0:
            radius = bottom_radius(f, bottom, right)
            half = min(shape["w"], shape["h"]) / 2
            model_r = RADIUS + (half - RADIUS) * m["roundness"]
            print(f"| {index} | {ms:.0f} | corner (pt) | {radius:.1f} | {model_r:.1f} | {model_r - radius:+.1f} |")
    print("Close (ms from frame 60, where the shadow goes; +-17 ms):")
    for index in (61, 63, 64):
        ms = (index - 60) * 1000 / 30
        print(f"| {index} | {ms:.0f} | opacity | {opacity(clip[index], closed, rest):.2f} | "
              f"{close(ms)['opacity']:.2f} | |")


if __name__ == "__main__":
    main()
