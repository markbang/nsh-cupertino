"""Compares a rendered catalog page with its iOS reference shot, from pixels.

    python3 tools/compare-ios.py controls light out/controls-light.png
    python3 tools/compare-ios.py rows dark out/rows-dark.png --table out/rows-dark.md

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

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
REF = ROOT / "research" / "ios-reference" / "shots"
SHOT = {"controls": "catalog-controls", "rows": "catalog-rows", "states": "catalog-states"}
PT = 720 / 402
TOL = 20
BG_TOL = 14
GAP = 2  # px of background a run may cross: a label's antialiased edge is not a gap

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
            ("chip selected", (56, 1220), "fill", None),
            ("chip unselected", (285, 1220), "fill", None),
            ("switch on", (45, 1300), "fill", None),
            ("switch off", (265, 1300), "fill", None),
            ("search field", (500, 1395), "fill", None),
            ("status pill neutral", (56, 1475), "fill", None),
            ("status pill running", (185, 1475), "fill", None),
        ],
        "dark": [
            ("button primary", (200, 320), "fill", (270, 300, 450, 350)),
            ("button secondary", (200, 437), "fill", None),
            ("button danger", (200, 666), "fill", None),
            ("button loading", (200, 780), "fill", None),
            ("segmented 3 track", (590, 1034), "fill", None),
            ("segmented 2 track", (600, 1130), "fill", None),
            ("chip selected", (56, 1220), "fill", None),
            ("switch on", (45, 1300), "fill", None),
            ("switch off", (265, 1300), "fill", None),
            ("search field", (500, 1395), "fill", None),
        ],
    },
    "rows": {
        "light": [
            ("switch on", (578, 413), "fill", None),
            ("tile destructive", (62, 700), "fill", None),
        ],
        "dark": [
            ("switch on", (578, 413), "fill", None),
            ("tile destructive", (62, 700), "fill", None),
        ],
    },
    "states": {
        "light": [
            ("skeleton tile", (60, 900), "fill", None),
            ("skeleton bar", (200, 874), "fill", None),
        ],
        "dark": [
            ("skeleton tile", (60, 900), "fill", None),
            ("skeleton bar", (200, 874), "fill", None),
        ],
    },
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


# Where an element sits on a card rather than the page: the background is read
# there, so the card's separators (a hairline, not ink) do not cut the element.
BG_PROBE = {("rows", "switch on"): (500, 413), ("rows", "tile destructive"): (40, 700)}

# Where an element's colour is sampled, as (x, y) fractions of its box: clear of the label and the thumb.
SAMPLE = {"tile destructive": (0.12, 0.5), "switch on": (0.25, 0.5), "switch off": (0.8, 0.5), "status pill neutral": (0.96, 0.5), "status pill running": (0.96, 0.5)}
SAMPLE_DEFAULT = (0.5, 0.2)


def measure(im, probe, ref_box=None, name=None, bg_at=None):
    """The element through `probe`: its box in px, its colour and its radius.

    In the reference the run through the probe is the element. In ours, the run
    down the probe's column that overlaps the reference box most; a rendering
    that moved an element still gets measured where it is.
    """
    x, y = probe
    bg = rgb(im, *bg_at) if bg_at else rgb(im, 2, y)
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
    fx, fy = SAMPLE.get(name, SAMPLE_DEFAULT)
    sample = (round(left + (right - left) * fx), round(top + (bottom - top) * fy))
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
        bg_at = BG_PROBE.get((page, name))
        reference = measure(ref, probe, name=name, bg_at=bg_at)
        mine = measure(ours, probe, reference["box"] if reference else None, name=name, bg_at=bg_at)
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


# Differences the measurements do not carry, seen on the native crops: (box in the
# 720 px frame, covering both renders, label). Listed per scheme; the boxes are
# where the reference and ours disagree, so they sit on the diff column.
SEEN = {
    "controls": {
        "light": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((284, 139, 436, 175), "title 3 px low, 1 px shorter: the face's ascent (Inter's cap is 28 px, the reference's 29)"),
            ((27, 110, 109, 197), "back button: no ring, heavier chevron"),
            ((31, 223, 145, 247), "\"Buttons\" label: 7 px high"),
            ((30, 960, 162, 996), "\"Selection\" label: 17 px high"),
            ((277, 764, 312, 794), "loading glyph: 8 blades, ref is a crescent (19 pt)"),
            ((53, 871, 83, 906), "share icon: 17×20 pt, ref 15×18 pt"),
            ((120, 847, 204, 931), "copy button: ring added, 1 px thinner than ref"),
            ((425, 872, 455, 906), "trash icon: a touch heavier than ref"),
            ((26, 1190, 536, 1254), "chip labels: \"Pinned\" 2 % wider, ink +4 % (Inter SemiBold; SF Pro's semibold is narrower)"),
            ((28, 1348, 692, 1446), "search field 10 px high (ours y 1348, ref 1358)"),
            ((60, 1375, 87, 1411), "magnifier: black and heavier"),
        ],
        "dark": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((284, 139, 436, 175), "title 3 px low, 1 px shorter: the face's ascent (Inter's cap is 28 px, the reference's 29)"),
            ((27, 110, 109, 197), "back button: no ring, heavier chevron"),
            ((31, 223, 145, 247), "\"Buttons\" label: 7 px high"),
            ((30, 960, 162, 996), "\"Selection\" label: 17 px high"),
            ((277, 764, 314, 798), "loading glyph: 8 blades, ref is a crescent (19 pt)"),
            ((53, 871, 83, 906), "share icon: 17×20 pt, ref 15×18 pt"),
            ((120, 847, 204, 931), "copy button: ring added, 1 px thinner than ref"),
            ((425, 872, 455, 906), "trash icon: a touch heavier than ref"),
            ((26, 1190, 536, 1254), "chip labels: \"Pinned\" 2 % wider, ink +4 % (Inter SemiBold; SF Pro's semibold is narrower)"),
            ((28, 1348, 692, 1446), "search field 10 px high (ours y 1348, ref 1358)"),
            ((60, 1375, 87, 1411), "magnifier: heavier"),
        ],
    },
    "states": {
        "light": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((27, 110, 109, 197), "back button: no ring, heavier chevron"),
            ((270, 447, 445, 490), "\"No files yet\" 4.5 % wider at the same ink (Inter SemiBold 164 px, ink 0.602; reference 157 px, 0.594): the face"),
            ((130, 720, 452, 752), "banner title 1.3 % wider, ink +1 %: the face (FreeSans was 3.5 % wider, ink +16 %)"),
            ((120, 500, 612, 540), "description: ink +8 %, same width (Inter Regular against SF Regular): the face"),
            ((0, 1262, 720, 1565), "loader and toast: no iOS reference, from Cohub Mobile's code values"),
        ],
        "dark": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((27, 110, 109, 197), "back button: no ring, heavier chevron"),
            ((270, 447, 445, 490), "\"No files yet\" 4.5 % wider at the same ink (Inter SemiBold 164 px, ink 0.602; reference 157 px, 0.594): the face"),
            ((130, 720, 452, 752), "banner title 1.3 % wider, ink +1 %: the face (FreeSans was 3.5 % wider, ink +16 %)"),
            ((120, 500, 612, 540), "description: ink +8 %, same width (Inter Regular against SF Regular): the face"),
            ((0, 1262, 720, 1565), "loader and toast: no iOS reference, from Cohub Mobile's code values"),
        ],
    },
    "rows": {
        "light": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((130, 388, 300, 421), "Notifications title: 4 px high (cap and baseline), 3 px (1.8 %) narrower: the face's line metrics (FreeSans was 2.4 % narrower)"),
            ((74, 370, 690, 378), "separator: one device pixel by design; the reference's 1 px line, downscaled 3× to 1.79 px/pt, reads lighter"),
            ((262, 395, 530, 445), "Notifications detail: \"Mentions an…\" (175 px) against \"Mentions and…\" (183 px): 5 px short on the left, 3 px on the right; the switch gap is 27 px against 24 px"),
        ],
        "dark": [
            ((0, 0, 720, 104), "no status bar: the reference shows clock and signal, ours is blank"),
            ((130, 388, 300, 421), "Notifications title: 4 px high (cap and baseline), 3 px (1.8 %) narrower: the face's line metrics (FreeSans was 2.4 % narrower)"),
            ((74, 370, 690, 378), "separator: one device pixel by design; the reference's 1 px line, downscaled 3× to 1.79 px/pt, reads lighter"),
            ((262, 395, 530, 445), "Notifications detail: \"Mentions an…\" (175 px) against \"Mentions and…\" (183 px): 5 px short on the left, 3 px on the right; the switch gap is 27 px against 24 px"),
        ],
    },
}


# A measured element is a remaining difference past these: height/width in pt, radius in pt,
# colour as the summed channel error, ink as the share of a text box.
THRESHOLD = {"h": 1.0, "w": 2.0, "radius": 3.0, "colour": 8, "ink": 0.04}
NOTE = {"switch on": " (edge noise: row scans read 60-64 pt on both)"}


def measured_findings(rows):
    out = []
    for name, ref_m, mine_m, ink_pair in rows:
        if ref_m is None or mine_m is None:
            continue
        parts = []
        dh = mine_m["h"] - ref_m["h"]
        dw = mine_m["w"] - ref_m["w"]
        if abs(dh) >= THRESHOLD["h"]:
            parts.append(f"height {dh:+.1f} pt")
        if abs(dw) >= THRESHOLD["w"]:
            parts.append(f"width {dw:+.1f} pt")
        if ref_m["radius"] is not None and mine_m["radius"] is not None:
            dr = mine_m["radius"] - ref_m["radius"]
            if abs(dr) >= THRESHOLD["radius"]:
                parts.append(f"radius {dr:+.1f} pt")
        dc = sum(abs(a - b) for a, b in zip(ref_m["colour"], mine_m["colour"]))
        if dc >= THRESHOLD["colour"]:
            parts.append(f"colour {hexc(ref_m['colour'])} vs {hexc(mine_m['colour'])}")
        if ink_pair and abs(ink_pair[1] - ink_pair[0]) >= THRESHOLD["ink"]:
            parts.append(f"ink {ink_pair[1] - ink_pair[0]:+.2f}")
        if not parts:
            continue
        a, b = ref_m["box"], mine_m["box"]
        box = (min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3]))
        out.append((box, f"{name}: " + ", ".join(parts) + NOTE.get(name, "")))
    return out


def findings(page, scheme, rows):
    items = list(SEEN[page][scheme]) + measured_findings(rows)
    return sorted(items, key=lambda item: (item[0][1], item[0][0]))


def font(size):
    for path in ("/usr/share/fonts/truetype/freefont/FreeSans.ttf", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"):
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default(size=size)


RED = (230, 0, 60)


def annotate(ref, ours, items):
    diff = Image.new("RGB", ref.size, (255, 255, 255))
    px_a, px_b = ref.load(), ours.load()
    out = diff.load()
    for y in range(ref.height):
        for x in range(ref.width):
            a, b = px_a[x, y], px_b[x, y]
            d = min(255, sum(abs(p - q) for p, q in zip(a, b)) // 2)
            out[x, y] = (255, 255 - d, 255 - d)
    draw = ImageDraw.Draw(diff)
    small = font(13)
    for number, (box, label) in enumerate(items, 1):
        left, top, right, bottom = box
        draw.rectangle(box, outline=RED, width=2)
        tag = f"{number}"
        text_w = draw.textlength(f"{number} {label}", font=small)
        x = min(left, ref.width - text_w - 8)
        y = top - 18 if top >= 18 else bottom + 2
        draw.rectangle((x, y, x + text_w + 8, y + 16), fill=RED)
        draw.text((x + 4, y + 1), f"{tag} {label}", fill=(255, 255, 255), font=small)
    return diff


def legend_image(items, width):
    body = font(17)
    line = 24
    img = Image.new("RGB", (width, 24 + line * len(items)), (255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((12, 6), "Remaining differences (numbers match the boxes)", fill=(0, 0, 0), font=font(19))
    for i, (_, label) in enumerate(items, 1):
        draw.text((12, 30 + (i - 1) * line), f"{i}. {label}", fill=(0, 0, 0), font=body)
    return img


def sheet(ref, ours, diff, legend):
    out = Image.new("RGB", (ref.width * 3 + 40, ref.height + legend.height), (255, 255, 255))
    out.paste(ref, (0, 0))
    out.paste(ours, (ref.width + 20, 0))
    out.paste(diff, (ref.width * 2 + 40, 0))
    out.paste(legend, (0, ref.height))
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("page", choices=sorted(SHOT))
    parser.add_argument("scheme", choices=["light", "dark"])
    parser.add_argument("ours", type=Path, help="our rendered PNG (any size; resized to the reference's)")
    parser.add_argument("out", type=Path, help="where to write the three-column image (reference | ours | annotated diff)")
    parser.add_argument("--table", type=Path, help="write the metric table and the remaining differences (Markdown) here")
    args = parser.parse_args()
    ref, ours, rows = compare(args.page, args.scheme, args.ours)
    items = findings(args.page, args.scheme, rows)
    diff = annotate(ref, ours, items)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    sheet(ref, ours, diff, legend_image(items, ref.width * 3 + 40)).save(args.out)
    text = table(rows)
    remaining = "\n".join(f"{i}. {label}" for i, (_, label) in enumerate(items, 1))
    report = text + "\n\n## Remaining differences\n\n" + remaining
    if args.table:
        args.table.parent.mkdir(parents=True, exist_ok=True)
        args.table.write_text(report + "\n")
    print(report)


if __name__ == "__main__":
    main()
