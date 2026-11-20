"""Measures the iOS reference shots in research/ios-reference/shots/ from pixels.

Needs Pillow. Prints the numbers that research/ios-reference/audit.md quotes.
Scale: the shots are the 402 pt wide frame at 720 px, so 1 pt = 720 / 402 px.
Edges are found at the midpoint luminance between the two colours either side.
Corner radii are least-squares fits of a circle to the traced edge (estimates).
"""
from pathlib import Path
from PIL import Image

SHOTS = Path(__file__).resolve().parent.parent / "research" / "ios-reference" / "shots"
PT = 720 / 402


def load(name):
    return Image.open(SHOTS / f"{name}.ios.webp").convert("RGB")


def hexc(p):
    return "#%02x%02x%02x" % p[:3]


def lum(p):
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]


def same(p, q, tol):
    return sum(abs(a - b) for a, b in zip(p, q)) <= tol


def run_h(im, x, y, col, tol):
    a, b = x, x
    while a > 0 and same(im.getpixel((a - 1, y)), col, tol):
        a -= 1
    while b < im.width - 1 and same(im.getpixel((b + 1, y)), col, tol):
        b += 1
    return a, b


def run_v(im, x, y, col, tol):
    a, b = y, y
    while a > 0 and same(im.getpixel((x, a - 1)), col, tol):
        a -= 1
    while b < im.height - 1 and same(im.getpixel((x, b + 1)), col, tol):
        b += 1
    return a, b


def size_pt(im, x, y, tol=24):
    """width and height in pt of the same-colour run through (x, y)."""
    col = im.getpixel((x, y))
    a, b = run_h(im, x, y, col, tol)
    c, d = run_v(im, (a + b) // 2, y, col, tol)
    return round((b - a + 1) / PT, 1), round((d - c + 1) / PT, 1)


def first_light(im, x, y0, y1, mid):
    for y in range(y0, y1):
        if lum(im.getpixel((x, y))) >= mid:
            return y
    return None


def first_light_x(im, y, x0, x1, mid):
    for x in range(x0, x1):
        if lum(im.getpixel((x, y))) >= mid:
            return x
    return None


def first_dark_x(im, y, x0, x1, limit):
    for x in range(x0, x1):
        if lum(im.getpixel((x, y))) < limit:
            return x
    return None


def corner_radius(im, top, left, mid, span=90):
    """Circle fit to the left edge of a rounded top-left corner, in pt."""
    pts = []
    for dy in range(span):
        x = first_light_x(im, top + dy, left - 4, left + span, mid)
        if x is not None:
            pts.append((dy, x - left))
    best = None
    for r in range(6, span):
        err, n = 0.0, 0
        for dy, dx in pts:
            if dy >= r:
                continue
            ideal = r - (r * r - (r - dy - 0.5) ** 2) ** 0.5
            err += (ideal - dx) ** 2
            n += 1
        if n > r * 0.5 and (best is None or err / n < best[1]):
            best = (r, err / n)
    return round(best[0] / PT, 1) if best else None


def main():
    print(f"scale: {PT:.3f} px/pt (720 px for 402 pt)")

    rows = load("catalog-rows.light")
    print("catalog-rows light")
    print("  page bg", hexc(rows.getpixel((5, 500))), " card", hexc(rows.getpixel((300, 300))))
    mid = (lum((247, 243, 237)) + lum((255, 255, 255))) / 2
    top = first_light(rows, 300, 240, 300, mid)
    left = first_light_x(rows, 500, 10, 60, mid)
    right = max(x for x in range(rows.width) if lum(rows.getpixel((x, 500))) >= mid)
    print(f"  card top y {top} px, left inset {(left) / PT:.1f} pt, right inset {(rows.width - 1 - right) / PT:.1f} pt")
    print(f"  card corner radius {corner_radius(rows, top, left, mid)} pt (fit)")
    seps = [y for y in range(300, 1000) if lum(rows.getpixel((670, y))) < 250 and lum(rows.getpixel((670, y - 1))) >= 250]
    print("  row separators at x=670 (px):", seps[:6], "pitch pt:", [round((b - a) / PT, 1) for a, b in zip(seps, seps[1:4])])
    sep_x = first_dark_x(rows, 374, left + 4, 690, 250)
    print(f"  separator starts at x {sep_x} px -> {(sep_x - left) / PT:.1f} pt from card edge")
    tile_x = first_dark_x(rows, 300, left + 4, 200, 246)
    tile_end = first_light_x(rows, 300, tile_x, 200, 246)
    print(f"  leading tile starts {(tile_x - left) / PT:.1f} pt in, width {(tile_end - tile_x) / PT:.1f} pt")

    ctl = load("catalog-controls.light")
    print("catalog-controls light (sample points in 589 px viewer space scaled to 720)")
    k = 720 / 589
    for name, (vx, vy) in {
        "primary button": (60, 262),
        "secondary button": (60, 357),
        "danger button": (60, 545),
        "segmented track": (520, 870),
        "search field": (500, 1120),
    }.items():
        x, y = int(vx * k), int(vy * k)
        print(f"  {name:17s} fill {hexc(ctl.getpixel((x, y)))} size w x h {size_pt(ctl, x, y, 20)} pt")

    sheet = load("catalog-sheet.light")
    mid = (lum(sheet.getpixel((300, 600))) + lum((255, 255, 255))) / 2
    top = first_light(sheet, 300, 1000, 1100, mid)
    left = first_light_x(sheet, top + 60, 0, 80, mid)
    print(f"catalog-sheet light: top y {top} px -> sheet height {round((sheet.height - top) / PT)} pt, "
          f"side inset {left / PT:.1f} pt, corner radius {corner_radius(sheet, top, left, mid, 90)} pt (fit)")

    chats = load("chats.light")
    title_rows = [y for y in range(200, 300) if any(lum(chats.getpixel((x, y))) < 120 for x in range(20, 200))]
    print(f"chats light: title ink rows {title_rows[0]}..{title_rows[-1]} px, "
          f"cap height ~{(title_rows[-1] - title_rows[0]) / PT:.1f} pt (title 34 pt => ~24 pt cap)")
    print(f"chats dark page bg {hexc(load('chats.dark').getpixel((10, 300)))}")


if __name__ == "__main__":
    main()
