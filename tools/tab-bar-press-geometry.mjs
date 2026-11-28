// The press's geometry, frame by frame, for `tools/tab-bar-film.mjs --scene tabs`:
// where the glass's edge is, from the pixels, against where the swollen
// content and the lifted pane are, from the page, in the same frame.
//
// `GEOMETRY` reads, in the page, the bar's box (the parent of its shadow, which
// no press moves), the content's swell (a tab's drawn width over its laid-out
// width), the pane's rect (the union of its pieces, the leaves of its layer,
// `tab_bar.rs`) and opacity, and
// each tab glyph's rect. `measurePress` then reads the frame's pixels along two
// rays: the bar's right end at its vertical centre (x) and the bar's top at its
// horizontal centre (y). On each it takes the rim's profile in the frame
// before the press (luma, its derivative, averaged over ±2 pt across the ray)
// and finds the shift that best lays it on the frame's own, to a tenth of a
// pixel: that shift is the glass's swell on that side, in points. Then:
//
//   glass − content  the glass's swell less the content's in the same frame
//                    (the content's is (s − 1) · the bar's half size);
//   lag              whether the glass sits nearer the content of the frame
//                    before than of its own frame, by more than TOLERANCE;
//   clearance        the glass's inner edge (its silhouette inset by RIM_BAND)
//                    to the pane: the least of its two rounded ends (the pane's
//                    end circle inside the bar's end circle) and its top and
//                    bottom, in points, on frames where the pane shows.
//
// A frame is flagged when its clearance is below 0 or |glass − content| is
// above TOLERANCE.
import { readPng } from "./png.mjs";

/** The glass's rim band, in points (`tab_bar.rs` `press::RIM_BAND`). */
export const RIM_BAND = 2.5;
/** The bar's corner radius, in points. */
const RADIUS = 32;
/** Swell differences above this, in points, are flagged. */
export const TOLERANCE = 0.25;
/** The profile window, in points: this far into the glass and out of it. */
const WINDOW_IN = 2;
const WINDOW_OUT = 1;
/** The largest swell searched for, in points, and how far inward. */
const SEARCH_OUT = 11;
const SEARCH_IN = 2;
/** Rows (or columns) averaged across a ray, in points either side. */
const ACROSS = 2;

export const GEOMETRY = `(() => {
  const all = [...document.querySelectorAll("#app *")];
  const box = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  const effective = (el) => {
    let o = 1;
    for (let n = el; n && n.id !== "app"; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const shadow = all.find((el) => getComputedStyle(el).boxShadow.includes("0px 7px 10px"));
  const paneShadow = all.find((el) => getComputedStyle(el).boxShadow.includes("0px 6px 20px"));
  const tabs = [...document.querySelectorAll('#app [role="button"][aria-label]')];
  if (!shadow || !tabs.length) return null;
  const bar = box(shadow.parentElement.getBoundingClientRect());
  const first = tabs[0];
  const swell = first.offsetWidth > 0 ? first.getBoundingClientRect().width / first.offsetWidth : 1;
  let pane = null;
  if (paneShadow) {
    const rects = [...paneShadow.parentElement.querySelectorAll("*")].filter((el) => el.children.length === 0).map((el) => el.getBoundingClientRect()).filter((r) => r.width > 0 && r.height > 0);
    pane = {
      left: Math.min(...rects.map((r) => r.left)),
      right: Math.max(...rects.map((r) => r.right)),
      top: Math.min(...rects.map((r) => r.top)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
      opacity: effective(paneShadow),
    };
  }
  const glyphs = tabs.map((tab) => {
    const glyph = tab.querySelector("svg, img") ?? tab.firstElementChild?.firstElementChild ?? tab;
    return { tab: tab.getAttribute("aria-label"), ...box(glyph.getBoundingClientRect()) };
  });
  return { bar, swell, pane, glyphs };
})()`;

const round = (value, places = 3) => (value === null || value === undefined || Number.isNaN(value) ? null : Number(value.toFixed(places)));

/**
 * Luma (levels) along a ray, averaged across it: `along` is the ray's axis
 * ("x" or "y"), `at` its fixed coordinate in points, from `from` to `to`
 * points along it.
 */
function profile(png, scale, origin, along, at, from, to) {
  const values = [];
  const across = Math.round(at * scale);
  const half = Math.round(ACROSS * scale);
  for (let i = Math.round(from * scale); i <= Math.round(to * scale); i++) {
    let sum = 0;
    let n = 0;
    for (let j = across - half; j <= across + half; j++) {
      const [x, y] = along === "x" ? [i - origin.x * scale, j - origin.y * scale] : [j - origin.x * scale, i - origin.y * scale];
      if (x < 0 || y < 0 || x >= png.width || y >= png.height) continue;
      sum += png.luminance(x, y) * 255;
      n += 1;
    }
    values.push(n ? sum / n : 0);
  }
  return values;
}

const derivative = (values) => values.slice(1).map((v, i) => v - values[i]);

/**
 * The shift, in points outward (`sign` 1: rightward/downward is outward, -1:
 * leftward/upward), that best lays the reference rim on the frame's, to a
 * tenth of a pixel, and the residual.
 */
function rimShift(reference, frame, scale, origin, along, at, edge, sign) {
  const lo = edge - sign * WINDOW_IN;
  const hi = edge + sign * WINDOW_OUT;
  const [a, b] = [Math.min(lo, hi), Math.max(lo, hi)];
  const pad = SEARCH_OUT + SEARCH_IN + 1;
  const ref = derivative(profile(reference, scale, origin, along, at, a - pad, b + pad));
  const now = derivative(profile(frame, scale, origin, along, at, a - pad, b + pad));
  const start = Math.round(pad * scale);
  const length = Math.round((b - a) * scale);
  const sample = (values, x) => {
    const i = Math.floor(x);
    const t = x - i;
    if (i < 0 || i + 1 >= values.length) return values[Math.max(0, Math.min(values.length - 1, i))];
    return values[i] * (1 - t) + values[i + 1] * t;
  };
  let best = { shift: 0, error: Infinity };
  for (let s = -SEARCH_IN * scale; s <= SEARCH_OUT * scale; s += 0.1) {
    let error = 0;
    for (let i = 0; i < length; i++) {
      const d = sample(now, start + i + sign * s) - ref[start + i];
      error += d * d;
    }
    if (error < best.error) best = { shift: s / scale, error };
  }
  return { shift: best.shift, residual: Math.sqrt(best.error / Math.max(length, 1)) };
}

/** The pane's clearance inside the glass, `bar` swollen by `sx` across and `sy` up and down, in points. */
function clearance(bar, sx, sy, pane) {
  const cx = (bar.left + bar.right) / 2;
  const cy = (bar.top + bar.bottom) / 2;
  const halfW = ((bar.right - bar.left) / 2) * sx;
  const halfH = ((bar.bottom - bar.top) / 2) * sy;
  const radius = Math.min(RADIUS * sy, halfH);
  const inner = radius - RIM_BAND;
  const r = (pane.bottom - pane.top) / 2;
  const py = (pane.top + pane.bottom) / 2;
  const ends = [
    [pane.left + r, cx - halfW + radius],
    [pane.right - r, cx + halfW - radius],
  ].map(([cap, end], i) => {
    // Only past the end circle's centre does the curve bind; inside it the
    // straight top and bottom do.
    const dx = i === 0 ? Math.max(0, end - cap) : Math.max(0, cap - end);
    return inner - (Math.hypot(dx, py - cy) + r);
  });
  const vertical = halfH - RIM_BAND - (r + Math.abs(py - cy));
  return { left: ends[0], right: ends[1], vertical, least: Math.min(...ends, vertical) };
}

/**
 * Every frame of one press, from the frame before it (`press.beforeK`) to the
 * last of its beat: `frames` are the film's, each with its `geometry`, `file`
 * the path of frame k's PNG, `clip` the film's clip, `scale` its device scale.
 */
export function measurePress(frames, file, clip, scale, press, beat) {
  const origin = { x: clip.x, y: clip.y };
  const before = frames[press.beforeK];
  const reference = readPng(file(press.beforeK));
  const bar = before.geometry?.bar;
  if (!bar) throw new Error(`press ${press.tab} ${press.pass}: no bar in frame ${press.beforeK} (GEOMETRY found no shadow)`);
  const cx = (bar.left + bar.right) / 2;
  const cy = (bar.top + bar.bottom) / 2;
  const halfW = (bar.right - bar.left) / 2;
  const halfH = (bar.bottom - bar.top) / 2;
  const rows = [];
  let previous = before.geometry;
  for (let k = press.beforeK; k <= beat.to; k++) {
    const g = frames[k].geometry;
    if (!g) continue;
    const png = k === press.beforeK ? reference : readPng(file(k));
    const right = rimShift(reference, png, scale, origin, "x", cy, bar.right, 1);
    const top = rimShift(reference, png, scale, origin, "y", cx, bar.top, -1);
    const content = { x: halfW * (g.swell - 1), y: halfH * (g.swell - 1) };
    const contentBefore = { x: halfW * (previous.swell - 1), y: halfH * (previous.swell - 1) };
    const sx = 1 + right.shift / halfW;
    const sy = 1 + top.shift / halfH;
    const shows = g.pane && g.pane.opacity > 1e-3;
    const room = shows ? clearance(bar, sx, sy, g.pane) : null;
    const outermost = g.glyphs.reduce((best, glyph) => (glyph.right > best.right ? glyph : best));
    const diff = { x: right.shift - content.x, y: top.shift - content.y };
    const lagged = (axis) =>
      Math.abs(diff[axis]) > TOLERANCE && Math.abs((axis === "x" ? right.shift : top.shift) - contentBefore[axis]) < Math.abs(diff[axis]);
    const row = {
      k,
      glassRight: round(bar.right + right.shift),
      glassTop: round(bar.top - top.shift),
      glassSwell: { x: round(right.shift), y: round(top.shift) },
      contentSwell: { x: round(content.x), y: round(content.y) },
      glassMinusContent: { x: round(diff.x), y: round(diff.y) },
      glassMinusContentBefore: { x: round(right.shift - contentBefore.x), y: round(top.shift - contentBefore.y) },
      lag: lagged("x") || lagged("y"),
      residual: { x: round(right.residual, 2), y: round(top.residual, 2) },
      paneRight: shows ? round(g.pane.right) : null,
      paneHeight: shows ? round(g.pane.bottom - g.pane.top) : null,
      paneOpacity: g.pane ? round(g.pane.opacity) : null,
      glyphRight: round(outermost.right),
      glyphClearance: round(bar.right + right.shift - RIM_BAND - outermost.right),
      clearance: room ? round(room.least) : null,
      clearanceBy: room ? { left: round(room.left), right: round(room.right), vertical: round(room.vertical) } : null,
    };
    row.flagged = (row.clearance !== null && row.clearance < 0) || Math.abs(diff.x) > TOLERANCE || Math.abs(diff.y) > TOLERANCE;
    rows.push(row);
    previous = g;
  }
  const max = (values) => (values.length ? Math.max(...values) : null);
  const min = (values) => (values.length ? Math.min(...values) : null);
  const clear = rows.filter((r) => r.clearance !== null);
  const summary = {
    framesChecked: rows.length,
    framesWithPane: clear.length,
    maxGlassMinusContent: round(max(rows.map((r) => Math.max(Math.abs(r.glassMinusContent.x), Math.abs(r.glassMinusContent.y))))),
    maxGlassSwell: round(max(rows.map((r) => Math.max(Math.abs(r.glassSwell.x), Math.abs(r.glassSwell.y))))),
    maxContentSwell: round(max(rows.map((r) => r.contentSwell.x))),
    lagFrames: rows.filter((r) => r.lag).map((r) => r.k),
    minClearance: round(min(clear.map((r) => r.clearance))),
    maxPaneHeight: round(max(clear.map((r) => r.paneHeight))),
    maxPaneRight: round(max(clear.map((r) => r.paneRight))),
    flagged: rows.filter((r) => r.flagged).map((r) => r.k),
  };
  return { rows, summary };
}
