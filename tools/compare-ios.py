"""Compares a rendered catalog page with its iOS reference shot, from pixels.

    python3 tools/compare-ios.py controls light out/controls-light.png
    python3 tools/compare-ios.py controls dark out/controls-dark.png --table out/controls-dark.md

Three columns, 720 px wide each: the iOS reference, ours, and ours diffed
against the reference, with each measured element boxed and labelled. The
numbers are measured in the same frame (402 × 874 pt at 720 × 1565 px, so
1.791 px per point) and printed as a Markdown table with `--table`.

Method: a fill is found by its colour (within `TOL`), and its box by the run of
that colour through a probe point. Height and width are the run's extent. The
radius is a least-squares circle fit to the left inset of the top rows. Ink is
the share of a text box that differs from its background, a proxy for weight.
Colour is the fill sampled at the probe, in the lossy webp's ±3. Needs Pillow.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "research" / "ios-reference" / "shots"
SHOT = {"controls": "catalog-controls"}
PT = 720 / 402
TOL = 20
BG_TOL = 14
GAP = 6  # px of background a run may cross: a label's antialiased edge is not a gap

# name, probe (px in the 720 frame, on the fill), reference fill, kind, label box (px) for ink.
ELEMENTS = {
    "controls": {
        "light": [
            ("button primary", (200, 320), "fill", (270, 300, 450, 350)),
            ("button secondary", (200, 437), "fill", None),
            ("button danger", (200, 666), "fill", None),
            ("button loading", (200, 780), "fill", None),
            ("segmented 3 track", (590, 1034), "fill", None),
            ("segmented 3 thumb", (120, 1040), "fill", None),
            ("segmented 2 track", (600, 1130), "fill", None),
            ("chip selected", (45, 1220), "fill", None),
            ("chip unselected", (222, 1220), "fill", None),
            ("switch on", (45, 1300), "fill", None),
            ("switch off", (265, 1300), "fill", None),
            ("search field", (500, 1395), "fill", None),
            ("status pill neutral", (40, 1475), "fill", None),
            ("status pill running", (175, 1475), "fill", None),
        ],
        "dark": [
            ("button primary", (200, 320), "fill", (270, 300, 450, 350)),
            ("button secondary", (200, 437), "fill", None),
            ("button danger", (200, 666), "fill", None),
            ("button loading", (200, 780), "fill", None),
            ("segmented 3 track", (590, 1034), "fill", None),
            ("segmented 2 track", (600, 1130), "fill", None),
            ("chip selected", (45, 1220), "fill", None),
            ("switch on", (45, 1300), "fill", None),
            ("switch off", (265, 1300), "fill", None),
            ("search field", (500, 1395), "fill", None),
        ],
    }
}


def rgb(im, x, y):
    return im.getpixel((int(x), int(y)))


def close(p, q, tol=TOL):
    return sum(abs(a - b) for a, b in zip(p[:3], q[:3])) <= tol


def hexc(p):
    return "#%02x%02x%02x" % tuple(p[:3])


def ink_of(im, x, y, bg):
    """A pixel is part of an element when it differs from the page background."""
    return not close(rgb(im, x, y), bg, BG_TOL)


def column_runs(im, x, bg):
    """The runs of element pixels down column `x`: (top, bottom) pairs."""
    runs, start = [], None
    for y in range(im.height):
        on = ink_of(im, x, y, bg)
        if on and start is None:
            start = y
        elif not on and start is not None:
            runs.append((start, y - 1))
            start = None
    if start is not None:
        runs.append((start, im.height - 1))
    return runs


def measure(im, probe, ref_box=None):
    """The element through `probe`: its box in px, its colour and its radius.

    In the reference the run through the probe is the element. In ours, the run
    down the probe's column that overlaps the reference box most; a rendering
    that moved an element still gets measured where it is.
    """
    x, y = probe
    bg = rgb(im, 2, y)
    runs = column_runs(im, x, bg)
    if not runs:
        return None
    if ref_box is None:
        top, bottom = next(((a, b) for a, b in runs if a <= y <= b), (None, None))
        if top is None:
            return None
    else:
        rt, rb = ref_box[1], ref_box[3]
        top, bottom = max(runs, key=lambda r: min(r[1], rb) - max(r[0], rt))
    # The widest run over the middle rows: a label cuts the middle row, not every row.
    h = bottom - top + 1
    left, right = x, x
    for row in range(top + h * 3 // 10, bottom - h * 3 // 10 + 1):
        a = x
        while a > 0 and any(ink_of(im, max(0, a - 1 - d), row, bg) for d in range(GAP)):
            a -= 1
        b = x
        while b < im.width - 1 and any(ink_of(im, min(im.width - 1, b + 1 + d), row, bg) for d in range(GAP)):
            b += 1
        left, right = min(left, a), max(right, b)
    box = (left, top, right, bottom)
    sample = (min(left + max(12, (bottom - top) // 2), right), (top + bottom) // 2)
    return {
        "box": box,
        "h": (bottom - top + 1) / PT,
        "w": (right - left + 1) / PT,
        "colour": rgb(im, *sample),
        "radius": radius_pt(im, box, bg),
    }


def radius_pt(im, box, bg):
    """Least-squares corner radius (pt) from the left inset of the top rows."""
    left, top, right, bottom = box
    h = bottom - top + 1
    insets = []
    for k in range(1, min(h // 2, 60)):
        y = top + k
        x = left
        while x < right and not ink_of(im, x, y, bg):
            x += 1
        insets.append((k - 0.5, x - left))
    if not insets:
        return None
    best = None
    for r10 in range(0, h * 5 + 1):
        r = r10 / 10
        err = 0.0
        for k, d in insets:
            model = 0.0 if k >= r else r - (r * r - (r - k) ** 2) ** 0.5
            err += (d - model) ** 2
        if best is None or err < best[0]:
            best = (err, r)
    return best[1] / PT


def ink(im, box, bg):
    """Share of a text box whose pixels differ from the background: a weight proxy."""
    x0, y0, x1, y1 = box
    total = (x1 - x0) * (y1 - y0)
    count = sum(1 for y in range(y0, y1) for x in range(x0, x1) if not close(rgb(im, x, y), bg, 90))
    return count / total


def compare(page, scheme, ours_path):
    ref = Image.open(REF / f"{SHOT[page]}.{scheme}.ios.webp").convert("RGB")
    ours = Image.open(ours_path).convert("RGB")
    if ours.size != ref.size:
        ours = ours.resize(ref.size, Image.LANCZOS)
    rows = []
    for name, probe, _, ink_box in ELEMENTS[page][scheme]:
        reference = measure(ref, probe)
        mine = measure(ours, probe, reference["box"] if reference else None)
        ink_pair = None
        if ink_box and reference and mine:
            ink_pair = (ink(ref, ink_box, rgb(ref, 2, probe[1])), ink(ours, ink_box, rgb(ours, 2, probe[1])))
        rows.append((name, reference, mine, ink_pair))
    return ref, ours, rows


def fmt(value, unit=""):
    return "–" if value is None else f"{value:.1f}{unit}"


def table(rows):
    lines = [
        "| element | metric | reference px / pt | ours px / pt | delta | source |",
        "|---|---|---|---|---|---|",
    ]
    for name, ref, mine, ink_pair in rows:
        if ref is None:
            lines.append(f"| {name} | element | not found in reference | – | – | probe |")
            continue
        if mine is None:
            lines.append(f"| {name} | element | {hexc(ref['colour'])} | not found | – | probe |")
            continue
        for key, label in (("h", "height"), ("w", "width"), ("radius", "radius")):
            r, m = ref[key], mine[key]
            delta = None if r is None or m is None else m - r
            lines.append(
                f"| {name} | {label} | {round(r * PT)} px / {fmt(r)} pt | "
                f"{round(m * PT) if m else '–'} px / {fmt(m)} pt | {fmt(delta, ' pt')} | measured |"
            )
        dc = sum(abs(a - b) for a, b in zip(ref["colour"], mine["colour"]))
        lines.append(f"| {name} | colour | {hexc(ref['colour'])} | {hexc(mine['colour'])} | Σ\\|Δ\\| {dc} | probe |")
        if ink_pair:
            lines.append(
                f"| {name} | ink | {ink_pair[0]:.2f} | {ink_pair[1]:.2f} | {ink_pair[1] - ink_pair[0]:+.2f} | label box |"
            )
    return "\n".join(lines)


def annotate(ref, ours, rows):
    diff = Image.new("RGB", ref.size, (255, 255, 255))
    px_a, px_b = ref.load(), ours.load()
    out = diff.load()
    for y in range(ref.height):
        for x in range(ref.width):
            a, b = px_a[x, y], px_b[x, y]
            d = min(255, sum(abs(p - q) for p, q in zip(a, b)) // 2)
            out[x, y] = (255, 255 - d, 255 - d)
    draw = ImageDraw.Draw(diff)
    for name, ref_m, mine_m, _ in rows:
        if ref_m is None:
            continue
        left, top, right, bottom = ref_m["box"]
        draw.rectangle((left, top, right, bottom), outline=(0, 120, 255), width=2)
        if mine_m is not None:
            l, t, r, b = mine_m["box"]
            draw.rectangle((l, t, r, b), outline=(255, 0, 180), width=2)
            dh = (mine_m["h"] - ref_m["h"])
            label = f"{name}  dh {dh:+.1f}"
        else:
            label = f"{name}  missing"
        draw.text((left + 2, max(0, top - 12)), label, fill=(0, 0, 0))
    return diff


def sheet(ref, ours, diff):
    out = Image.new("RGB", (ref.width * 3 + 40, ref.height), (255, 255, 255))
    out.paste(ref, (0, 0))
    out.paste(ours, (ref.width + 20, 0))
    out.paste(diff, (ref.width * 2 + 40, 0))
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("page", choices=sorted(SHOT))
    parser.add_argument("scheme", choices=["light", "dark"])
    parser.add_argument("ours", type=Path, help="our rendered PNG (any size; resized to the reference's)")
    parser.add_argument("out", type=Path, help="where to write the three-column image")
    parser.add_argument("--table", type=Path, help="write the metric table (Markdown) here")
    args = parser.parse_args()
    ref, ours, rows = compare(args.page, args.scheme, args.ours)
    diff = annotate(ref, ours, rows)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet(ref, ours, diff).save(args.out)
    text = table(rows)
    if args.table:
        args.table.parent.mkdir(parents=True, exist_ok=True)
        args.table.write_text(text + "\n")
    print(text)


if __name__ == "__main__":
    main()
