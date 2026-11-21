#!/usr/bin/env python3
"""The iOS clip's menu beside GlassMenu at the same timestamps, light and dark.

    node tools/glass-shots.mjs --menu-frames --out <shots>   # GlassMenu, held at each time
    python3 tools/compare-glass-menu.py <shots> <out dir>    # morph-open.png, morph-close.png

Rows: iOS (research/ios-reference/motion/motion-menu.mp4, light only), ours in
light, ours in dark. Columns: ms after the press (the clip's frame 0 is 107 ms
after it, tools/fit-glass-menu.py), then ms into the close (the clip's frame 60,
where the menu's shadow goes). The clip repeats frames 1-4 and 6-8: those
columns are marked "copy". Both sides are cut around the menu button at the
same scale, 2 px per pt.
"""
import argparse
import os
import subprocess

import numpy as np
from PIL import Image, ImageDraw, ImageFont

FONT = ImageFont.load_default(size=22)
CLIP = "research/ios-reference/motion/motion-menu.mp4"
IOS_PX, OURS_PX, OUT_PX = 1.0995, 3.0, 2.0
IOS_BUTTON = (32 / IOS_PX, 171 / IOS_PX)  # the menu icon's centre, pt
OURS_BUTTON = (37.8, 169.8)  # the demo's button centre in a 390 pt shot, pt
WINDOW = (-30.0, -45.0, 270.0, 420.0)  # pt around the button: left, top, right, bottom
OPEN_MS = [0, 107, 140, 174, 207, 240, 274, 307, 340, 374, 407, 507]
CLOSE_MS = [0, 33, 67, 100, 133]
START_MS = 107.0
COPIES = {1, 2, 3, 4, 6, 7, 8}


def clip_frames(path, wanted):
    process = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-i", path, "-vf", "crop=442:960:0:0",
         "-pix_fmt", "rgb24", "-f", "rawvideo", "-"], stdout=subprocess.PIPE)
    out = {}
    for index in range(max(wanted) + 1):
        raw = process.stdout.read(442 * 960 * 3)
        if index in wanted:
            out[index] = Image.frombytes("RGB", (442, 960), raw)
    process.kill()
    return out


def cut(image, px_per_pt, centre):
    left, top, right, bottom = WINDOW
    box = tuple(round(v * px_per_pt) for v in (centre[0] + left, centre[1] + top,
                                               centre[0] + right, centre[1] + bottom))
    size = (round((right - left) * OUT_PX), round((bottom - top) * OUT_PX))
    return image.crop(box).resize(size, Image.LANCZOS)


def blank(size, text):
    tile = Image.new("RGB", size, (60, 60, 60))
    ImageDraw.Draw(tile).text((10, size[1] // 2), text, fill=(220, 220, 220), font=FONT)
    return tile


def strip(columns, rows, title, path):
    tile_w, tile_h = rows[0][1][0].size
    label_w, head_h, gap = 150, 70, 6
    out = Image.new("RGB", (label_w + len(columns) * (tile_w + gap), head_h + len(rows) * (tile_h + gap)),
                    (255, 255, 255))
    draw = ImageDraw.Draw(out)
    draw.text((6, 6), title, fill=(0, 0, 0), font=FONT)
    for c, name in enumerate(columns):
        draw.text((label_w + c * (tile_w + gap) + 4, 38), name, fill=(0, 0, 0), font=FONT)
    for r, (name, tiles) in enumerate(rows):
        y = head_h + r * (tile_h + gap)
        draw.text((6, y + tile_h // 2), name, fill=(0, 0, 0), font=FONT)
        for c, tile in enumerate(tiles):
            out.paste(tile, (label_w + c * (tile_w + gap), y))
    out.save(path)
    print(path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("shots")
    parser.add_argument("out")
    parser.add_argument("--clip", default=CLIP)
    args = parser.parse_args()
    os.makedirs(args.out, exist_ok=True)
    open_frames = {ms: round((ms - START_MS) * 30 / 1000) for ms in OPEN_MS}
    close_frames = {ms: 60 + round(ms * 30 / 1000) for ms in CLOSE_MS}
    clip = clip_frames(args.clip, set(open_frames.values()) | set(close_frames.values()) | {0})

    def ours(kind, ms, scheme):
        shot = Image.open(os.path.join(args.shots, f"glassmenu-{kind}-{ms}-{scheme}.png")).convert("RGB")
        return cut(shot, OURS_PX, OURS_BUTTON)

    size = cut(clip[0], IOS_PX, IOS_BUTTON).size
    ios_open, columns = [], []
    for ms in OPEN_MS:
        frame = open_frames[ms]
        if frame < 0:
            ios_open.append(blank(size, "before the clip"))
            columns.append(f"{ms} ms")
        else:
            ios_open.append(cut(clip[frame], IOS_PX, IOS_BUTTON))
            columns.append(f"{ms} ms f{frame}" + (" copy" if frame in COPIES else ""))
    strip(columns, [("iOS (light)", ios_open),
                    ("ours light", [ours("open", ms, "light") for ms in OPEN_MS]),
                    ("ours dark", [ours("open", ms, "dark") for ms in OPEN_MS])],
          "GlassMenu opening vs iOS (ms after the press)", os.path.join(args.out, "morph-open.png"))
    strip([f"+{ms} ms f{close_frames[ms]}" for ms in CLOSE_MS],
          [("iOS (light)", [cut(clip[close_frames[ms]], IOS_PX, IOS_BUTTON) for ms in CLOSE_MS]),
           ("ours light", [ours("close", ms, "light") for ms in CLOSE_MS]),
           ("ours dark", [ours("close", ms, "dark") for ms in CLOSE_MS])],
          "GlassMenu close vs iOS (ms after the close starts)", os.path.join(args.out, "morph-close.png"))


if __name__ == "__main__":
    main()
