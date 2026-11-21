#!/usr/bin/env python3
"""Glass values measured from the iOS reference shots (research/ios-reference/shots).

    python3 tools/measure-glass-ios.py menu [light|dark]

The menu shot is UIKit's pull-down menu over the catalog's bars (`catalog-menu`,
720 x 1565 px, 1.791 px per pt). Outside the panel the bars and the page are sharp;
inside it, the same rows show through the glass. For each channel the inside colour
is modelled as the backdrop, blurred by a vertical Gaussian of sigma s, mapped
linearly: inside = k * blur(backdrop, s) + t. The sigma that gives the smallest
residual is the blur; k is the share of the backdrop that gets through; if the
glass is a single tint of colour T at alpha a, then k = 1 - a and t = a * T.
A second, independent fit keeps only the bars (not the page): if the two disagree,
the mix depends on the backdrop, and the script says so.
"""
import sys

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d

SHOTS = "research/ios-reference/shots/"
PX_PER_PT = 720 / 402
# Geometry read off the shot (px): the panel's columns and rows, and where the
# inside sample sits, clear of its rim (about 10 pt = 18 px), its text and its bottom.
PANEL_X = (28, 476)
PANEL_Y = (276, 954)
INSIDE_X = (345, 375)
INSIDE_Y = (300, 940)
OUTSIDE_X = (570, 640)


def load(scheme):
    path = f"{SHOTS}catalog-menu.{scheme}.ios.webp"
    return np.asarray(Image.open(path).convert("RGB")).astype(float)


def bands(im):
    """Rows where the outside column differs from the page: the bars, top to bottom."""
    column = im[PANEL_Y[0]:PANEL_Y[1] + 40, OUTSIDE_X[0]:OUTSIDE_X[1]].mean(axis=1)
    page = np.median(column[-40:], axis=0)
    differs = np.abs(column - page).sum(axis=1) > 60
    found, start = [], None
    for index, flag in enumerate(differs):
        if flag and start is None:
            start = index
        if not flag and start is not None:
            if index - start > 20:
                found.append((start + PANEL_Y[0], index + PANEL_Y[0]))
            start = None
    return found, page


def fit_sigma(im, page_rows):
    backdrop = im[:, OUTSIDE_X[0]:OUTSIDE_X[1]].mean(axis=1)
    inside = im[:, INSIDE_X[0]:INSIDE_X[1]].mean(axis=1)
    ys = np.arange(*INSIDE_Y)
    best = None
    for sigma_px in np.arange(0, 40.5, 0.5):
        blurred = gaussian_filter1d(backdrop, sigma_px, axis=0, mode="nearest") if sigma_px else backdrop
        fits = []
        for c in range(3):
            X = np.c_[blurred[ys, c], np.ones(len(ys))]
            (k, t), *_ = np.linalg.lstsq(X, inside[ys, c], rcond=None)
            fits.append((k, t, np.sqrt(np.mean((X @ [k, t] - inside[ys, c]) ** 2))))
        rms = np.mean([f[2] for f in fits])
        if best is None or rms < best[1]:
            best = (sigma_px, rms, fits)
    return best


def mix_samples(im, rows, page):
    pairs = []
    for top, bottom in rows:
        rows_slice = slice(top + 12, bottom - 12)
        pairs.append((im[rows_slice, OUTSIDE_X[0]:OUTSIDE_X[1]].reshape(-1, 3).mean(0),
                      im[rows_slice, INSIDE_X[0]:INSIDE_X[1]].reshape(-1, 3).mean(0)))
    # The page below the last bar, clear of the panel's bottom.
    pairs.append((page, im[INSIDE_Y[1] - 60:INSIDE_Y[1], INSIDE_X[0]:INSIDE_X[1]].reshape(-1, 3).mean(0)))
    return pairs


def per_channel(pairs):
    backdrop = np.array([p[0] for p in pairs])
    inside = np.array([p[1] for p in pairs])
    out = []
    for c in range(3):
        keep = inside[:, c] < 253  # clipped outputs carry no information
        X = np.c_[backdrop[keep, c], np.ones(keep.sum())]
        (k, t), *_ = np.linalg.lstsq(X, inside[keep, c], rcond=None)
        rms = np.sqrt(np.mean((X @ [k, t] - inside[keep, c]) ** 2))
        out.append((k, t, rms, keep.sum()))
    return out


def menu(scheme):
    im = load(scheme)
    rows, page = bands(im)
    sigma, rms, fits = fit_sigma(im, rows)
    print(f"{scheme}: bars {rows}")
    print(f"  blur sigma {sigma} px = {sigma / PX_PER_PT:.2f} pt (residual {rms:.1f} levels)")
    for c, (k, t, _) in enumerate(fits):
        print(f"  ch{c}: k {k:.3f}  t {t:.1f}  white alpha {1 - k:.3f}  implied tint {t / max(1 - k, 1e-6):.0f}")
    pairs = mix_samples(im, rows, page)
    for c, (k, t, r, n) in enumerate(per_channel(pairs)):
        print(f"  mix ch{c} (n={n}): white alpha {1 - k:.3f}, implied tint {t / max(1 - k, 1e-6):.0f}, rms {r:.1f}")


if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] != "menu":
        sys.exit(__doc__)
    for scheme in (sys.argv[2:] or ["light", "dark"]):
        menu(scheme)
