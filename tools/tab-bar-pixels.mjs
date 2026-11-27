#!/usr/bin/env node
// The tab bar's body against iOS 27's, on the iOS tab-bar fixture: our bar over
// the fixture's own backdrop (`tab-bar-fixture-*`, `tools/glass-shots.mjs`)
// against the iOS frames of the same backdrop (`tools/fetch-tab-bar-fixture.mjs`).
//
//   node tools/tab-bar-pixels.mjs [--dir docs/screenshots] [--fixture target/tab-bar-fixture]
//
// Per theme and frame, on the fit mask of the m5b scripts (`common.py`):
//  (a) the two-scale model refitted to our render, σ grid of `fit2.py`:
//      σ1, σ2, k1, k2, t and the fit's rms;
//  (b) rms(our render − the iOS frame) and rms(our render − the iOS two-scale
//      prediction, `shared.json`);
//  (c) the readability floor of `readability.py`: glyph-against-gap contrast of
//      the backdrop's text seen through the bar, the minimum over lines.
// The same for the shader's one-disc body (`tab-bar-fixture-single-*`, what the
// bar drew before) and for the iOS frames themselves, which must give back the
// published fit and floor: a check of this port. Then the Reduce Transparency
// stills: an opaque bar, uniform inside.
//
// The m5b scripts and their outputs (`shared.json`, `readability.json`) are
// published with the measurement: https://public.cohub.live/p/ead34bb8-3796-4c07-8f80-2ecc7b8e9411/nsh-cupertino/tab-bar-measured/m5b-scripts/
// Each function below names the Python lines it mirrors. Left out: the 12 px
// tile bootstrap (`fit2.py:54-61`), which gives confidence intervals, not fits.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { DEFAULT_DIR } from "./fetch-tab-bar-fixture.mjs";
import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));
const FIXTURE_DIR = arg("fixture", DEFAULT_DIR);

// --- Pass thresholds ------------------------------------------------------
//
// The iOS measurement (`ios-m5b-results.md`, a+b per theme): the two-scale fit
// leaves 1.98 light / 2.40 dark levels rms against the iOS frames; the best
// single Gaussian 3.57 / 6.07. Our render must sit at the two-scale level: its
// rms against the iOS frames below the midpoint of the two, nearer the
// two-scale level than any one blur can get.
const RMS_FRAME = { light: (1.98 + 3.57) / 2, dark: (2.40 + 6.07) / 2 };
// And it must reproduce the model at least as closely as iOS does: its rms
// against the model's prediction below the model's own residual on iOS.
const RMS_MODEL = { light: 1.98, dark: 2.40 };
// Readability (`readability.py`): iOS's floor is 10.1 light / 22.2 dark levels,
// nsh's single blur (BAR_BLUR 24) 3.8 / 12.1. Ours must be clearly above the
// single blur: past the midpoint between it and iOS.
const READABLE = { light: (3.8 + 10.1) / 2, dark: (12.1 + 22.2) / 2 };
// Reduce Transparency: opaque and uniform. Over the fit band the bar's luma may
// spread by at most 1 level (8-bit rounding), and it reads the opaque fill,
// `tokens::bar::reduced_level` (251.80 light, 36.58 dark), within 1.5.
const REDUCED = { light: 251.8, dark: 36.58, spread: 1, off: 1.5 };
// The port itself: the iOS frames must give back `shared.json` (σ1 0.625 pt,
// σ2 18 pt, rms 2.2014 over the four frames) and `readability.json`'s floors.
const SHARED = {
  s1: 0.625,
  s2: 18,
  rms: 2.2014035380600223,
  k1: [0.06869879502431603, 0.070007855739029, 0.14343632757725394, 0.13534840388601957],
  k2: [0.26822071293700983, 0.2570790792443373, 0.506840625332302, 0.5027078099517962],
  t: [166.02349296635714, 168.2618618945227, 36.391442773650326, 36.778453704647404],
};
const IOS_FLOOR = { light: 10.096293715402766, dark: 22.245177518941787 };

// --- Geometry (`common.py:7-12`, `load.py:9-10`) ---------------------------
const W = 1206;
const H = 2622;
const BAND = [2250, 2622];
const ROWS = [2399, 2501];
const GAPS = { G1: [382, 414], G2: [537, 665] };
const L = [0.2126, 0.7152, 0.0722];
const BH = BAND[1] - BAND[0];
const THEMES = ["light", "dark"];
const FRAMES = ["a", "b"];

const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${detail}`);
  if (!ok) failures.push(label);
};

/** Luma in levels over the band, `(shot(...) @ L)[BAND[0]:BAND[1]]` (`common.py:15-16`). */
function luma(file) {
  const image = readPng(file);
  if (image.width !== W || image.height !== H) {
    throw new Error(`${file}: ${image.width} × ${image.height}, the fixture is ${W} × ${H} (3x of 402 × 874 pt)`);
  }
  const out = new Float64Array(BH * W);
  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < W; x++) {
      const [r, g, b] = image.pixel(x, y + BAND[0]);
      out[y * W + x] = r * L[0] + g * L[1] + b * L[2];
    }
  }
  return out;
}

/** Icons and labels on the bar, dilated by 3 pt with `np.roll` (it wraps) (`common.py:23-31`). */
function foreground(g, theme) {
  const fg = new Uint8Array(BH * W);
  for (let i = 0; i < fg.length; i++) fg[i] = theme === "light" ? g[i] < 200 : g[i] > 130;
  const out = new Uint8Array(BH * W);
  const d = 9;
  for (let y = 0; y < BH; y++) {
    for (let x = 0; x < W; x++) {
      if (!fg[y * W + x]) continue;
      for (let dy = -d; dy <= d; dy++) {
        const yy = (((y + dy) % BH) + BH) % BH;
        for (let dx = -d; dx <= d; dx++) out[yy * W + ((((x + dx) % W) + W) % W)] = 1;
      }
    }
  }
  return out;
}

/** The fit mask: the usable rows over the two gaps, minus the iOS frame's foreground (`common.py:34-40`). */
function mask(iosGlass, theme) {
  const fg = foreground(iosGlass, theme);
  const m = new Uint8Array(BH * W);
  for (const [x0, x1] of Object.values(GAPS)) {
    for (let y = ROWS[0] - BAND[0]; y < ROWS[1] - BAND[0]; y++) {
      for (let x = x0; x < x1; x++) m[y * W + x] = fg[y * W + x] ? 0 : 1;
    }
  }
  return m;
}

/**
 * The 1-D kernel `blur.py:12-17` applies along an axis of padded length `n`:
 * the inverse DFT of exp(−2(πσ)²f²) on `fftfreq(n)`, so a circular kernel of
 * length `n`. The 2-D filter is the product of the two axes', so applying both
 * in turn is the same filter. Frequencies whose gain underflows are skipped.
 */
const kernels = new Map();
function kernel(n, sigma) {
  const key = `${n} ${sigma}`;
  if (kernels.has(key)) return kernels.get(key);
  const cos = new Float64Array(n);
  for (let q = 0; q < n; q++) cos[q] = Math.cos((2 * Math.PI * q) / n);
  const live = [];
  for (let j = 0; j < n; j++) {
    const f = Math.min(j, n - j) / n;
    const g = Math.exp(-2 * (Math.PI * sigma) ** 2 * f * f);
    if (g > 1e-18) live.push([j, g]);
  }
  const k = new Float64Array(n);
  for (let m = 0; m <= n >> 1; m++) {
    let sum = 0;
    for (const [j, g] of live) sum += g * cos[(j * m) % n];
    k[m] = sum / n;
    k[(n - m) % n] = k[m];
  }
  kernels.set(key, k);
  return k;
}

/**
 * Weights on the original samples for output `i` of an axis of `size`, padded
 * by `r` with its edge values and filtered circularly with `k` (`blur.py:9-18`:
 * `np.pad(mode="edge")`, the FFT product, the crop), as the samples they fall
 * on and their weights; weights below 1e-15 are dropped.
 */
const weightsCache = new Map();
function axisWeights(size, r, k, i, key) {
  const id = `${key} ${size} ${i}`;
  if (weightsCache.has(id)) return weightsCache.get(id);
  const n = size + 2 * r;
  const w = new Float64Array(size);
  const at = i + r;
  for (let m = 0; m < n; m++) {
    const source = Math.min(Math.max(m - r, 0), size - 1);
    w[source] += k[(((at - m) % n) + n) % n];
  }
  const index = [];
  const weight = [];
  for (let s = 0; s < size; s++) {
    if (Math.abs(w[s]) < 1e-15) continue;
    index.push(s);
    weight.push(w[s]);
  }
  const sparse = { index: Int32Array.from(index), weight: Float64Array.from(weight) };
  weightsCache.set(id, sparse);
  return sparse;
}

/**
 * `blur2(a, sigma)` (`blur.py:5-18`) of the band luma, read at the mask's
 * pixels only: the rows first, then the columns.
 */
function blurAt(a, sigma, rows, cols, pixels) {
  if (sigma <= 0) return pixels.map(([y, x]) => a[y * W + x]);
  const r = Math.ceil(4 * sigma) + 1;
  const ky = kernel(BH + 2 * r, sigma);
  const kx = kernel(W + 2 * r, sigma);
  const rowBlur = new Map();
  for (const y of rows) {
    const { index, weight } = axisWeights(BH, r, ky, y, sigma);
    const out = new Float64Array(W);
    for (let p = 0; p < index.length; p++) {
      const wgt = weight[p];
      const base = index[p] * W;
      for (let x = 0; x < W; x++) out[x] += wgt * a[base + x];
    }
    rowBlur.set(y, out);
  }
  const colWeights = new Map(cols.map((x) => [x, axisWeights(W, r, kx, x, sigma)]));
  return pixels.map(([y, x]) => {
    const line = rowBlur.get(y);
    const { index, weight } = colWeights.get(x);
    let sum = 0;
    for (let p = 0; p < index.length; p++) sum += weight[p] * line[index[p]];
    return sum;
  });
}

// --- The σ grid and the fits (`gram.py:12-41`, `fit2.py:16-51`) -------------
const SIG = [];
for (let s = 0; s <= 4.001; s += 0.125) SIG.push(Number((s * 3).toFixed(6)));
for (let s = 5; s < 41; s += 1) SIG.push(s * 3);
const ONE = SIG.length;
const Y = ONE + 1;
const I1 = SIG.map((s, i) => [s, i]).filter(([s]) => s <= 12.0001).map(([, i]) => i);
const I2 = SIG.map((s, i) => [s, i]).filter(([s]) => s > 12.0001).map(([, i]) => i);

/** The Gram matrix of [G(s)∗ref for s in SIG] + [1, y] over the mask (`gram.py:22-29`, without the tiles). */
function gram(columns, y) {
  const cols = [...columns, y.map(() => 1), y];
  const n = cols.length;
  const G = Array.from({ length: n }, () => new Float64Array(n));
  for (let i = 0; i < n; i++) {
    for (let j = i; j < n; j++) {
      let sum = 0;
      const a = cols[i];
      const b = cols[j];
      for (let p = 0; p < a.length; p++) sum += a[p] * b[p];
      G[i][j] = sum;
      G[j][i] = sum;
    }
  }
  return G;
}

/** Solves the small system `A x = b` by Gaussian elimination with partial pivoting. */
function linsolve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}

/** Least squares of y on columns idx and the constant from a Gram: coef, sse, n (`gram.py:34-41`). */
function solve(G, idx) {
  const c = [...idx, ONE];
  const A = c.map((i) => c.map((j) => G[i][j]));
  const b = c.map((i) => G[i][Y]);
  const coef = linsolve(A, b);
  let quad = 0;
  for (let i = 0; i < c.length; i++) for (let j = 0; j < c.length; j++) quad += coef[i] * A[i][j] * coef[j];
  const cb = coef.reduce((s, v, i) => s + v * b[i], 0);
  return { coef, sse: Math.max(G[Y][Y] - 2 * cb + quad, 0), n: G[ONE][ONE] };
}

/** The best σ pair, shared by the Grams, each with its own k1, k2, t (`fit2.py:20-35`). */
function bestTwo(Gs) {
  let best = null;
  for (const i of I1) {
    for (const j of I2) {
      let sse = 0;
      let n = 0;
      const ks = [];
      for (const G of Gs) {
        const fit = solve(G, [i, j]);
        sse += fit.sse;
        n += fit.n;
        ks.push(fit.coef);
      }
      if (!best || sse < best.sse) best = { sse, i, j, ks, n };
    }
  }
  return {
    s1: SIG[best.i] / 3,
    s2: SIG[best.j] / 3,
    k1: best.ks.map((k) => k[0]),
    k2: best.ks.map((k) => k[1]),
    t: best.ks.map((k) => k[2]),
    rms: Math.sqrt(best.sse / best.n),
  };
}

/** The best single σ (`fit2.py:38-51`). */
function bestOne(Gs) {
  let best = null;
  for (let i = 0; i < SIG.length; i++) {
    let sse = 0;
    let n = 0;
    for (const G of Gs) {
      const fit = solve(G, [i]);
      sse += fit.sse;
      n += fit.n;
    }
    if (!best || sse < best.sse) best = { sse, i, n };
  }
  return { s: SIG[best.i] / 3, rms: Math.sqrt(best.sse / best.n) };
}

// --- Readability (`readability.py:21`, `:46-79`) ---------------------------
const LINES = { a: [[2411, 2447], [2472, 2508]], b: [[2381, 2417], [2442, 2478]] };

function srgbToY(v) {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Per line: C levels and the WCAG ratio of the glass at the glyphs against the gaps (`readability.py:51-79`). */
function contrast(glass, ref, m, theme, frame) {
  const ink = (i) => (theme === "light" ? ref[i] < 128 : ref[i] > 128);
  const cols = [];
  for (let x = 0; x < W; x++) {
    for (let y = 0; y < BH; y++) {
      if (m[y * W + x]) {
        cols.push(x);
        break;
      }
    }
  }
  const free = new Uint8Array(BH);
  for (let y = 0; y < BH; y++) free[y] = cols.every((x) => !ink(y * W + x)) ? 1 : 0;
  const out = [];
  for (const [y0, y1] of LINES[frame]) {
    const r0 = Math.max(y0, ROWS[0]) - BAND[0];
    const r1 = Math.min(y1, ROWS[1]) - BAND[0];
    if (r1 - r0 < 6) continue;
    let si = 0;
    let ni = 0;
    for (let y = r0; y < r1; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (m[i] && ink(i)) {
          si += glass[i];
          ni += 1;
        }
      }
    }
    let sg = 0;
    let ng = 0;
    for (let y = Math.max(y0 - 36, ROWS[0]) - BAND[0]; y < Math.min(y1 + 36, ROWS[1]) - BAND[0]; y++) {
      if (!free[y]) continue;
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        if (m[i]) {
          sg += glass[i];
          ng += 1;
        }
      }
    }
    if (ni < 50 || ng < 50) continue;
    const gi = si / ni;
    const gg = sg / ng;
    const [yi, yg] = [srgbToY(gi), srgbToY(gg)];
    out.push({ line: [y0, y1], C: Math.abs(gg - gi), ratio: (Math.max(yi, yg) + 0.05) / (Math.min(yi, yg) + 0.05) });
  }
  return out;
}

// --- The run ---------------------------------------------------------------
const f = (v, d = 3) => v.toFixed(d);
const rmsOf = (a, b) => Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length);

const frames = {};
for (const theme of THEMES) {
  for (const frame of FRAMES) {
    const key = `${theme}-${frame}`;
    const ref = luma(join(FIXTURE_DIR, `tab-bar-ref-${key}.png`));
    const ios = luma(join(FIXTURE_DIR, `tab-bar-${key}.png`));
    const web = luma(join(DIR, `tab-bar-fixture-${key}.png`));
    const single = luma(join(DIR, `tab-bar-fixture-single-${key}.png`));
    const m = mask(ios, theme);
    const pixels = [];
    for (let y = 0; y < BH; y++) for (let x = 0; x < W; x++) if (m[y * W + x]) pixels.push([y, x]);
    const rows = [...new Set(pixels.map(([y]) => y))];
    const cols = [...new Set(pixels.map(([, x]) => x))];
    const started = Date.now();
    const columns = SIG.map((s) => blurAt(ref, s, rows, cols, pixels));
    const at = (image) => pixels.map(([y, x]) => image[y * W + x]);
    const values = { ios: at(ios), web: at(web), single: at(single) };
    frames[key] = {
      theme,
      frame,
      m,
      ref,
      ios,
      web,
      single,
      columns,
      values,
      grams: Object.fromEntries(Object.entries(values).map(([name, y]) => [name, gram(columns, y)])),
    };
    console.log(`${key}: ${pixels.length} mask pixels (the m5b mask has 16 320 per frame), ${SIG.length} blurs in ${((Date.now() - started) / 1000).toFixed(1)} s`);
  }
}

// The port: iOS's four frames give back `shared.json`.
{
  const order = ["light-a", "light-b", "dark-a", "dark-b"];
  const shared = bestTwo(order.map((key) => frames[key].grams.ios));
  const kOff = Math.max(
    ...order.flatMap((_, i) => [
      Math.abs(shared.k1[i] - SHARED.k1[i]),
      Math.abs(shared.k2[i] - SHARED.k2[i]),
      Math.abs(shared.t[i] - SHARED.t[i]) / 255,
    ]),
  );
  check(
    "the port gives back the iOS shared fit (shared.json)",
    shared.s1 === SHARED.s1 && shared.s2 === SHARED.s2 && Math.abs(shared.rms - SHARED.rms) < 0.005 && kOff < 0.002,
    `σ1 ${shared.s1} pt, σ2 ${shared.s2} pt, rms ${f(shared.rms, 4)} (published ${SHARED.s1}, ${SHARED.s2}, ${f(SHARED.rms, 4)}); largest k difference ${kOff.toExponential(2)}`,
  );
}

const table = [];
for (const theme of THEMES) {
  const keys = FRAMES.map((frame) => `${theme}-${frame}`);
  const sets = [...keys.map((key) => [key, [key]]), [`${theme}-a+b`, keys]];
  for (const [label, members] of sets) {
    const row = { label };
    for (const body of ["web", "single", "ios"]) {
      const two = bestTwo(members.map((key) => frames[key].grams[body]));
      const one = bestOne(members.map((key) => frames[key].grams[body]));
      row[body] = { two, one };
    }
    // (b) against the iOS frame and against the iOS model's prediction
    // (`shared.json`'s σ and its per-frame k1, k2, t).
    const s1 = SIG.indexOf(SHARED.s1 * 3);
    const s2 = SIG.indexOf(SHARED.s2 * 3);
    const residual = (body, target) => {
      let sse = 0;
      let n = 0;
      for (const key of members) {
        const fr = frames[key];
        const index = ["light-a", "light-b", "dark-a", "dark-b"].indexOf(key);
        const prediction = fr.columns[s1].map(
          (v, p) => SHARED.k1[index] * v + SHARED.k2[index] * fr.columns[s2][p] + SHARED.t[index],
        );
        const y = fr.values[body];
        const other = target === "frame" ? fr.values.ios : prediction;
        sse += y.reduce((s, v, p) => s + (v - other[p]) ** 2, 0);
        n += y.length;
      }
      return Math.sqrt(sse / n);
    };
    for (const body of ["web", "single", "ios"]) {
      row[body].frame = residual(body, "frame");
      row[body].model = residual(body, "model");
    }
    // (c) the readability floor.
    for (const body of ["web", "single", "ios"]) {
      const lines = members.flatMap((key) => {
        const fr = frames[key];
        return contrast(fr[body], fr.ref, fr.m, fr.theme, fr.frame);
      });
      row[body].lines = lines;
      row[body].floor = lines.length ? Math.min(...lines.map((line) => line.C)) : NaN;
    }
    table.push(row);
    for (const body of ["web", "single", "ios"]) {
      const r = row[body];
      const k = (list) => list.map((v) => f(v, 4)).join("/");
      console.log(
        `${label.padEnd(12)} ${body.padEnd(6)} refit σ1 ${f(r.two.s1, 3)} pt σ2 ${f(r.two.s2, 1)} pt k1 ${k(r.two.k1)} k2 ${k(r.two.k2)} t ${r.two.t.map((v) => f(v, 2)).join("/")} rms ${f(r.two.rms)}` +
          ` | one σ ${f(r.one.s, 3)} pt rms ${f(r.one.rms)}` +
          ` | rms vs iOS frame ${f(r.frame)} vs iOS model ${f(r.model)}` +
          ` | readability ${r.lines.map((line) => f(line.C, 1)).join(" ")} min ${f(r.floor, 2)}`,
      );
    }
  }
}

for (const theme of THEMES) {
  const row = table.find((r) => r.label === `${theme}-a+b`);
  check(
    `the port gives back iOS's readability floor (${theme})`,
    Math.abs(row.ios.floor - IOS_FLOOR[theme]) < 0.05,
    `${f(row.ios.floor, 3)} levels (readability.json: ${f(IOS_FLOOR[theme], 3)})`,
  );
  check(
    `the ${theme} bar sits at the two-scale level against iOS`,
    row.web.frame < RMS_FRAME[theme],
    `rms ${f(row.web.frame)} levels against the iOS frames (< ${f(RMS_FRAME[theme], 3)}; two-scale fit ${RMS_MODEL[theme]}, one Gaussian ${theme === "light" ? 3.57 : 6.07}); the one-disc body ${f(row.single.frame)}`,
  );
  check(
    `the ${theme} bar reproduces the iOS two-scale model`,
    row.web.model < RMS_MODEL[theme],
    `rms ${f(row.web.model)} levels against the model's prediction (< ${RMS_MODEL[theme]}, iOS's own residual to it); the one-disc body ${f(row.single.model)}`,
  );
  check(
    `text under the ${theme} bar is as readable as the measurement asks`,
    row.web.floor > READABLE[theme],
    `floor ${f(row.web.floor, 2)} levels (> ${f(READABLE[theme], 2)}; iOS ${f(row.ios.floor, 2)}, the one-disc body ${f(row.single.floor, 2)})`,
  );
}

// Reduce Transparency: the bar is opaque, one shade over the whole fit band,
// whatever the backdrop under it.
for (const theme of THEMES) {
  const key = `${theme}-a`;
  const shot = luma(join(DIR, `tab-bar-fixture-reduced-${key}.png`));
  const m = frames[key].m;
  let lo = Infinity;
  let hi = -Infinity;
  let sum = 0;
  let n = 0;
  for (let i = 0; i < m.length; i++) {
    if (!m[i]) continue;
    lo = Math.min(lo, shot[i]);
    hi = Math.max(hi, shot[i]);
    sum += shot[i];
    n += 1;
  }
  const mean = sum / n;
  check(
    `Reduce Transparency draws an opaque ${theme} bar`,
    hi - lo <= REDUCED.spread && Math.abs(mean - REDUCED[theme]) <= REDUCED.off,
    `the fit band reads ${f(lo, 1)}–${f(hi, 1)} (spread ≤ ${REDUCED.spread}), mean ${f(mean, 2)} (fill ${REDUCED[theme]} ± ${REDUCED.off}); the backdrop under it spans ${f(Math.min(...frames[key].values.ios), 0)}–${f(Math.max(...frames[key].values.ios), 0)} through iOS's bar`,
  );
}

// --- The minimise morph's middle frames ------------------------------------
//
// The fixture bar pinned at morph 0, 0.25, 0.5, 0.75 and 1 (`GlassTabBar`'s
// `morph`), with the two-scale body and with the one-disc body (no layers).
// Where the shader's silhouette shrinks inside the layers' box, two seams
// could show: the shader's hand-over ramp (smoothstep(1.5, 6, inside), scaled
// by 1 − morph) between its own body and the tint over the layers, and the
// layers' box edge, where the fading layers end outside the glass. Luma is
// read along the silhouette's normals (inside −12 pt to outside +6 pt, one
// pixel a step) where the backdrop under the profile is flat (the iOS
// reference spans ≤ 3 levels there), so a step is the material's, not a
// glyph's; and across the box edge (−4 to +4 pt) wherever it lies outside the
// glass.
//
// A middle frame passes when each measure is no larger than the largest of its
// references, the end frames (morph 0 and 1) and the one-disc body at the same
// morph, plus the two-scale model's own residual on iOS (1.98 light, 2.40 dark
// levels): a difference below that is below what the measurement resolves.
const BAR = { cx: 201, cy: 822, hx: 180, hy: 32, radius: 32, lift: 6, pill: 25 };
const MORPHS = [0, 0.25, 0.5, 0.75, 1];
const MARGIN = { light: 1.98, dark: 2.4 };
const FLAT = 3;

function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

/** The bar's rounded rect (`glass.rs` `sd_one`, radii ≥ 0, its smooth max of 2.5). */
function sdBar(x, y) {
  const r = Math.min(BAR.radius, BAR.hx, BAR.hy);
  const qx = Math.abs(x) - (BAR.hx - r);
  const qy = Math.abs(y) - (BAR.hy - r);
  const inner = -smin(-qx, -qy, 2.5);
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(inner, 0) - r;
}

/** `sd_silhouette` with no tabs (anchor 0.5): the bar mixed toward a circle of `MIN_RADIUS` at its centre. */
function sdSilhouette(x, y, m) {
  const d = sdBar(x, y);
  if (m <= 0) return d;
  return d + (Math.hypot(x, y) - BAR.pill - d) * Math.min(m, 1);
}

/** Bilinear luma of a band image at a point of the page, in points. */
function sampleAt(image, x, y) {
  const px = x * 3 - 0.5;
  const py = y * 3 - 0.5 - BAND[0];
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const fx = px - x0;
  const fy = py - y0;
  const v = (xx, yy) => image[Math.min(Math.max(yy, 0), BH - 1) * W + Math.min(Math.max(xx, 0), W - 1)];
  return (v(x0, y0) * (1 - fx) + v(x0 + 1, y0) * fx) * (1 - fy) + (v(x0, y0 + 1) * (1 - fx) + v(x0 + 1, y0 + 1) * fx) * fy;
}

const steps = (from, to) => Array.from({ length: Math.round((to - from) * 3) + 1 }, (_, i) => from + i / 3);
const ALONG = steps(-12, 6);
const ACROSS_BOX = steps(-4, 4);

/** The silhouette's top boundary at each column, with its outward normal, in page points. */
function silhouetteEdges(m) {
  const cy = BAR.cy + BAR.lift * m;
  const edges = [];
  for (let dx = -175; dx <= 175; dx += 1) {
    if (sdSilhouette(dx, 0, m) >= 0) continue;
    let inside = 0;
    let outside = -40;
    for (let i = 0; i < 50; i++) {
      const mid = (inside + outside) / 2;
      if (sdSilhouette(dx, mid, m) < 0) inside = mid;
      else outside = mid;
    }
    const dy = (inside + outside) / 2;
    const e = 0.01;
    const gx = sdSilhouette(dx + e, dy, m) - sdSilhouette(dx - e, dy, m);
    const gy = sdSilhouette(dx, dy + e, m) - sdSilhouette(dx, dy - e, m);
    const g = Math.hypot(gx, gy);
    edges.push({ x: BAR.cx + dx, y: cy + dy, nx: gx / g, ny: gy / g });
  }
  return edges;
}

/** The layers' box's top edge where it lies more than 4 pt outside the glass. */
function boxEdges(m) {
  const cy = BAR.cy + BAR.lift * m;
  const edges = [];
  for (let dx = -145; dx <= 145; dx += 1) {
    if (sdSilhouette(dx, -BAR.hy, m) > 4) edges.push({ x: BAR.cx + dx, y: cy - BAR.hy, nx: 0, ny: -1 });
  }
  return edges;
}

const mean = (list) => list.reduce((s, v) => s + v, 0) / Math.max(list.length, 1);

/** Luma along each edge's normal at the offsets `along`, kept where the backdrop is flat if `flat`. */
function profilesAt(image, ref, edges, along, flat) {
  const out = [];
  for (const edge of edges) {
    if (flat) {
      let lo = Infinity;
      let hi = -Infinity;
      for (const t of [-1, 0, 1]) {
        for (const s of along) {
          const v = sampleAt(ref, edge.x + s * edge.nx - t * edge.ny, edge.y + s * edge.ny + t * edge.nx);
          lo = Math.min(lo, v);
          hi = Math.max(hi, v);
        }
      }
      if (hi - lo > FLAT) continue;
    }
    out.push(along.map((s) => sampleAt(image, edge.x + s * edge.nx, edge.y + s * edge.ny)));
  }
  return out;
}

/** The largest step between adjacent samples with offsets in [from, to]. */
function largestStep(profiles, along, from, to) {
  let most = 0;
  for (const profile of profiles) {
    for (let i = 1; i < along.length; i++) {
      if (along[i - 1] < from || along[i] > to) continue;
      most = Math.max(most, Math.abs(profile[i] - profile[i - 1]));
    }
  }
  return most;
}

/** Mean luma at offsets in [inFrom, inTo] minus [outFrom, outTo], over the profiles. */
function jump(profiles, along, [inFrom, inTo], [outFrom, outTo]) {
  const band = (profile, from, to) => mean(profile.filter((_, i) => along[i] >= from && along[i] <= to));
  return {
    inside: mean(profiles.map((p) => band(p, inFrom, inTo))),
    outside: mean(profiles.map((p) => band(p, outFrom, outTo))),
  };
}

const morphRows = [];
for (const theme of THEMES) {
  const ref = luma(join(FIXTURE_DIR, `tab-bar-ref-${theme}-a.png`));
  const measure = {};
  for (const m of MORPHS) {
    const tag = String(Math.round(m * 100)).padStart(3, "0");
    for (const body of ["two", "single"]) {
      const image = luma(join(DIR, `tab-bar-fixture-morph-${body === "single" ? "single-" : ""}${theme}-${tag}.png`));
      const edges = silhouetteEdges(m);
      const profiles = profilesAt(image, ref, edges, ALONG, true);
      const { inside, outside } = jump(profiles, ALONG, [-9, -3], [2, 5]);
      const row = {
        theme,
        m,
        body,
        n: profiles.length,
        step: largestStep(profiles, ALONG, -12, 6),
        ramp: largestStep(profiles, ALONG, -7.5, -1),
        inside,
        outside,
        jump: inside - outside,
      };
      const box = boxEdges(m);
      if (box.length) {
        const across = profilesAt(image, ref, box, ACROSS_BOX, false);
        const j = jump(across, ACROSS_BOX, [-4, -1], [1, 4]);
        row.box = { n: across.length, step: largestStep(across, ACROSS_BOX, -4, 4), jump: j.inside - j.outside, profiles: across };
      }
      measure[`${body}-${m}`] = row;
      morphRows.push(row);
    }
  }
  for (const m of MORPHS) {
    for (const body of ["two", "single"]) {
      const r = measure[`${body}-${m}`];
      console.log(
        `morph ${theme} ${f(m, 2)} ${body.padEnd(6)} silhouette: ${r.n} flat profiles, largest step ${f(r.step, 2)}, in the hand-over ramp ${f(r.ramp, 2)}, inside ${f(r.inside, 2)} outside ${f(r.outside, 2)} (jump ${f(r.jump, 2)})` +
          (r.box ? ` | layers' box edge: ${r.box.n} profiles, largest step ${f(r.box.step, 2)}, jump ${f(r.box.jump, 2)}` : ""),
      );
    }
  }
  for (const m of MORPHS.filter((v) => v > 0 && v < 1)) {
    const r = measure[`two-${m}`];
    const refs = [measure["two-0"], measure["two-1"], measure[`single-${m}`]];
    const limit = (key) => Math.max(...refs.map((x) => Math.abs(x[key]))) + MARGIN[theme];
    check(
      `the ${theme} bar at morph ${m} has flat backdrop to measure on`,
      r.n >= 5,
      `${r.n} silhouette profiles over a flat backdrop (≥ 5)`,
    );
    for (const [key, label] of [
      ["step", "largest step across the silhouette edge"],
      ["ramp", "largest step in the hand-over ramp"],
      ["jump", "brightness jump inside against outside"],
    ]) {
      check(
        `${label}, ${theme}, morph ${m}`,
        Math.abs(r[key]) <= limit(key),
        `${f(Math.abs(r[key]), 2)} levels (≤ ${f(limit(key), 2)}: the largest of morph 0 ${f(Math.abs(refs[0][key]), 2)}, morph 1 ${f(Math.abs(refs[1][key]), 2)}, the one-disc body ${f(Math.abs(refs[2][key]), 2)}, plus ${MARGIN[theme]})`,
      );
    }
    // The layers' box edge outside the glass: its step and jump against the
    // one-disc body at the same morph, which has no layers there.
    const single = measure[`single-${m}`];
    const diff = mean(r.box.profiles.map((p, i) => Math.sqrt(mean(p.map((v, k) => (v - single.box.profiles[i][k]) ** 2)))));
    for (const key of ["step", "jump"]) {
      const lim = Math.abs(single.box[key]) + MARGIN[theme];
      check(
        `the fading layers' box edge, ${key}, ${theme}, morph ${m}`,
        Math.abs(r.box[key]) <= lim,
        `${f(Math.abs(r.box[key]), 2)} levels over ${r.box.n} profiles (≤ ${f(lim, 2)}: the one-disc body ${f(Math.abs(single.box[key]), 2)} plus ${MARGIN[theme]}); the layers differ from the one-disc frame there by ${f(diff, 2)} levels rms`,
      );
    }
  }
}

// --- Increased contrast ------------------------------------------------------
//
// With `contrast="high"` the theme swaps in the near-opaque `glass-regular`, so
// `two_scale_active()` is false and the bar takes the one-disc path: the
// still has the shader and no backdrop-filtered layers (the DOM, as
// `glass-shots` recorded it), and its bar is the one-disc render of the same
// frame (`material="single-blur"`), pixel for pixel up to 8-bit rounding.
// The two-scale still of the same frame in standard contrast is the positive
// control: it has the two layers.
const CONTRAST_SAME = 1;
const contrastRows = [];
for (const theme of THEMES) {
  const dom = (name) => JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8"));
  const high = dom(`tab-bar-fixture-contrast-${theme}`);
  const control = dom(`tab-bar-fixture-${theme}-a`);
  check(
    `the two-scale ${theme} bar has its two layers (control)`,
    control.filtered.length === 2 && control.shader.length === 1,
    `standard contrast: ${control.shader.length} shader canvas, backdrop filters ${JSON.stringify(control.filtered)}`,
  );
  check(
    `increased contrast draws no layers (${theme})`,
    high.filtered.length === 0 && high.shader.length === 1,
    `increased contrast: ${high.shader.length} shader canvas, backdrop filters ${JSON.stringify(high.filtered)}`,
  );
  const two = luma(join(DIR, `tab-bar-fixture-contrast-${theme}.png`));
  const single = luma(join(DIR, `tab-bar-fixture-contrast-single-${theme}.png`));
  const standard = luma(join(DIR, `tab-bar-fixture-${theme}-a.png`));
  let most = 0;
  let sum = 0;
  let away = 0;
  let n = 0;
  for (let y = 790; y < 854; y += 1 / 3) {
    for (let x = 21; x < 381; x += 1 / 3) {
      if (sdBar(x + 1 / 6 - BAR.cx, y + 1 / 6 - BAR.cy) > -2) continue;
      const i = Math.round((y * 3) - BAND[0]) * W + Math.round(x * 3);
      const d = Math.abs(two[i] - single[i]);
      most = Math.max(most, d);
      sum += d;
      away += Math.abs(two[i] - standard[i]);
      n += 1;
    }
  }
  contrastRows.push({ theme, layers: high.filtered.length, most, mean: sum / n, away: away / n });
  check(
    `increased contrast takes the one-disc path (${theme})`,
    most <= CONTRAST_SAME,
    `inside the bar (${n} px) it differs from the one-disc render by at most ${f(most, 2)} levels, mean ${f(sum / n, 3)} (≤ ${CONTRAST_SAME}, 8-bit rounding); from the standard-contrast two-scale still by ${f(away / n, 2)} on average`,
  );
}

if (failures.length) {
  console.error(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("the tab bar's body is iOS's two-scale material, and opaque under Reduce Transparency");
