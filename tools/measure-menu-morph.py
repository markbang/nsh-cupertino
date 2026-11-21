#!/usr/bin/env python3
"""Per-frame bounds of the iOS glass menu in research/ios-reference/motion/motion-menu.mp4.

    python3 tools/measure-menu-morph.py [mp4] [--frames 0-12,52-66]

The clip is 892 px wide: the iOS screen is the left 442 px (402 pt, so 1.0995 px
per pt). The page is static apart from the menu, so each frame is compared with a
closed-menu frame (1000), and the largest connected region that differs by more
than 10 grey levels is the menu, glass and shadow included. The bounds carry a
bias of about 8 px from the shadow; use them for timing and for shape changes,
not for absolute edges. Prints one CSV row per frame: ms, left, right, top, bottom
in px (full resolution, y from the top of the clip).
"""
import argparse
import subprocess

import numpy as np
from scipy import ndimage

IOS_WIDTH = 442
CLOSED_FRAME = 1000
NAV_BAR_ROWS = 55  # half-resolution rows above the page content (status and nav bars)
THRESHOLD = 10


def frames(path, wanted):
    """The grey, half-resolution frames in `wanted` (and the closed-menu frame)."""
    size = 960 * IOS_WIDTH * 3
    keep = set(wanted) | {CLOSED_FRAME}
    process = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", path, "-vf", f"crop={IOS_WIDTH}:960:0:0",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"],
        stdout=subprocess.PIPE,
        stderr=subprocess.DEVNULL,
    )
    kept = {}
    for index in range(max(keep) + 1):
        raw = process.stdout.read(size)
        if len(raw) < size:
            break
        if index in keep:
            rgb = np.frombuffer(raw, dtype=np.uint8).reshape(960, IOS_WIDTH, 3)
            kept[index] = rgb[::2, ::2].astype(np.float32).mean(axis=2)
    process.stdout.close()
    process.wait()
    return kept


def bounds(gray, index):
    diff = np.abs(gray[index] - gray[CLOSED_FRAME])
    diff[:NAV_BAR_ROWS] = 0
    mask = ndimage.binary_opening(diff > THRESHOLD, iterations=1)
    labels, count = ndimage.label(mask)
    if count == 0:
        return None
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    ys, xs = np.where(labels == int(np.argmax(sizes)) + 1)
    return 2 * xs.min(), 2 * xs.max() + 2, 2 * ys.min(), 2 * ys.max() + 2


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("mp4", nargs="?", default="research/ios-reference/motion/motion-menu.mp4")
    parser.add_argument("--frames", default="0-12,52-66")
    args = parser.parse_args()
    wanted = []
    for part in args.frames.split(","):
        first, _, last = part.partition("-")
        wanted.extend(range(int(first), int(last or first) + 1))
    gray = frames(args.mp4, wanted)
    print("frame,ms,left,right,top,bottom")
    for index in wanted:
        box = bounds(gray, index)
        if box is None:
            print(f"{index},{index * 1000 / 30:.0f},,,,")
        else:
            print(f"{index},{index * 1000 / 30:.0f},{','.join(str(v) for v in box)}")


if __name__ == "__main__":
    main()
