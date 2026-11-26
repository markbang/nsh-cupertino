// The calibration capsule's rim light at both ends of the light axis, shared by
// `tools/glass-pixels.mjs` (web) and `tools/android-glass-check.mjs` (emulator).
//
// iOS lights both ends alike: the tab bar's rim peaks are 102 / 101 (dark) and
// 254 / 255 (light) at its top and bottom, a gain of 0.004
// (`research/ios-reference/mapping.md`, section 8). The checks used to require
// the lit edge to be brighter than the opposite one by 0.05 (web) and 0.03
// (emulator): iOS shows no such gain, and the shader's opposite lobe never ran
// (`opposite` was always 0), so that one-sided assertion was wrong. The rim also
// refracts what
// lies just outside it, so a peak is only compared where the page above the
// capsule is the page below it, inside and out (read from the capture without
// glass), and past where the rim draws the blue field in (`THICKNESS`, 8 pt,
// beyond its edge): elsewhere the backdrop, not the light, decides which edge
// is brighter, or the body is the refracted blue rather than the glass.

/** The capsule of the calibration page, in page points. */
export const CAPSULE = { x: 60, y: 120, width: 180, height: 64 };
/** Where the calibration page's blue field ends, in page points. */
export const BLUE_EDGE = 70;
const THICKNESS = 8;

const REACH = 13;
const HALF_WIDTH = 3;
const SAME = 0.02;
/** How far a capture may place the capsule off the page's geometry (the emulator's sits about 0.5 pt higher). */
const SLACK = 4;

/**
 * The columns where the backdrop is the same above and below the capsule, with
 * the shader's top and bottom rim peaks and its body there. `at(x, y)` maps
 * page points to pixels.
 */
export function rimColumns(glass, clear, at) {
  const r = CAPSULE.height / 2;
  const cy = CAPSULE.y + r;
  const lum = (image, x, y) => {
    const [px, py] = at(x, y);
    return image.luminance(px, py);
  };
  const band = (image, x, y0, y1) => {
    let sum = 0;
    let count = 0;
    for (let x1 = x - HALF_WIDTH; x1 <= x + HALF_WIDTH; x1 += 1) {
      for (let y = y0; y < y1; y += 0.5) {
        sum += lum(image, x1, y);
        count += 1;
      }
    }
    return sum / count;
  };
  const peak = (px, from, to) => {
    let best = 0;
    for (let y = from; y < to; y++) best = Math.max(best, glass.luminance(px, y));
    return best;
  };
  // The capsule's edge in this capture: the first (or last) row near the
  // page's geometry where the glass differs from the page without it.
  const edge = (px, y, step) => {
    const [, from] = at(0, y - step * SLACK);
    const [, to] = at(0, y + step * SLACK);
    for (let row = from; row !== to; row += step) {
      if (Math.abs(glass.luminance(px, row) - clear.luminance(px, row)) > SAME) return row;
    }
    return at(0, y)[1];
  };
  const columns = [];
  for (let x = BLUE_EDGE + THICKNESS; x <= CAPSULE.x + CAPSULE.width - 4; x += 2) {
    const dx = Math.max(CAPSULE.x + r - x, x - (CAPSULE.x + CAPSULE.width - r), 0);
    const half = Math.sqrt(Math.max(r * r - dx * dx, 0));
    if (half < r / 2) continue;
    const top = cy - half;
    const bottom = cy + half;
    const outside = Math.abs(band(clear, x, top - REACH, top) - band(clear, x, bottom, bottom + REACH));
    const inside = Math.abs(band(clear, x, top, top + REACH) - band(clear, x, bottom - REACH, bottom));
    if (outside >= SAME || inside >= SAME) continue;
    const [px] = at(x, 0);
    const depth = at(0, 4.5)[1] - at(0, 0)[1];
    const from = edge(px, top, 1);
    const to = edge(px, bottom, -1);
    columns.push({
      x,
      top: peak(px, from, from + depth),
      bottom: peak(px, to - depth + 1, to + 1),
      body: lum(glass, x, cy),
    });
  }
  return columns;
}

/** The verdict on `rimColumns`: equal peaks (|top − bottom| ≤ 0.02), both above the body. */
export function judgeRim(columns) {
  if (!columns.length) {
    return { ok: false, detail: "no column has the same backdrop above and below the capsule: the page changed, so the rim cannot be compared" };
  }
  const worst = columns.reduce((a, b) => (Math.abs(b.top - b.bottom) > Math.abs(a.top - a.bottom) ? b : a));
  const gain = Math.abs(worst.top - worst.bottom);
  const flat = columns.find((c) => !(c.top > c.body && c.bottom > c.body));
  // The emulator's dark gain reads 0.0196 here: a known thin margin, see docs/design-notes.md.
  const ok = gain <= 0.02 && !flat;
  const where = (c) => `x ${c.x} pt: top ${c.top.toFixed(3)}, bottom ${c.bottom.toFixed(3)}, body ${c.body.toFixed(3)}`;
  const detail =
    `|top − bottom| at most ${gain.toFixed(4)} over ${columns.length} column(s) (iOS 0.004, limit 0.02); worst ${where(worst)}` +
    (flat ? `; a rim is no brighter than the body (${where(flat)})` : "");
  return { ok, detail };
}
