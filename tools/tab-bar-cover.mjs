#!/usr/bin/env node
// What the shader's cover draws over the two-scale layers, against what the
// one-disc body leaves there.
//
//   node tools/tab-bar-cover.mjs [--dir docs/screenshots]
//
// On the web the two-scale layers keep the bar's box while the silhouette
// shrinks inside it, and the shader draws the page from its backdrop picture
// over them there (`src/glass.rs` `shade`, `ring`). The one-disc body has no
// layers: its canvas is clear outside the glass, so the live page, the bar's
// CSS shadow (`src/tab_bar.rs` `shadow`) and anything the picture leaves out
// show there. For frames 1-60 of the exact recordings (`glass-shots.mjs`
// `tab-bar-exact-<theme>` and `tab-bar-exact-single-<theme>`, the same scene
// and page clock) this compares the two over the covered region: inside the
// layers' box at rest and at least half a point outside the silhouette as the
// shader draws it, a frame behind the page (at the previous frame's
// `progress.fromShadow`). Per frame and pooled: the |difference| of luma
// (max, mean, p50, p95, p99, the share over 2 levels) and the signed mean
// (two-scale minus one-disc), also split into the band within 1.5 pt of the
// box edge, the deeper part, and the cover's ramp 0-1.5 pt outside the box.
//
// The bar's CSS shadow there is modelled as a reference (its box lowered with
// the bar, offset 7 pt, blur 10 pt as a Gaussian of σ 5, black at 10/255,
// fading as the bar minimises; drawn only outside its box, its fill white at
// 1/255 inside): the largest darkening it can cause, in levels. The page
// above the bar (y 771-786 pt) tells whether the page moved since the frame
// before.
//
// Report only: it fails only on a missing input.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readPng } from "./png.mjs";
import { luma, sdGlass, sdLayers } from "./tab-bar-geometry.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));
const MOTION = join(DIR, "motion");
const SCALE = 3;
const CLIP_TOP = 770;
const BOX = { x0: 21, x1: 381, y0: 790, y1: 854 };
const PAGE_BAND = { y0: 771, y1: 786 };
const SHADOW = { offset: 7, sigma: 5, alpha: 10 / 255, fill: 1 / 255 };

const missing = [];
const need = (file) => {
  if (!existsSync(file)) missing.push(file);
  return file;
};

/** The covered region at the drawn `progress`, as frame pixels and page points: the layers' box and the cover's ramp 1.5 pt past it, outside the glass. */
function covered(progress) {
  const out = [];
  for (let py = (BOX.y0 - 2) * SCALE; py < (BOX.y1 + 2) * SCALE; py++) {
    for (let px = (BOX.x0 - 2) * SCALE; px < (BOX.x1 + 2) * SCALE; px++) {
      const x = (px + 0.5) / SCALE;
      const y = (py + 0.5) / SCALE;
      if (sdLayers(x, y) <= 1.5 && sdGlass(x, y, progress) >= 0.5) out.push([px, py - CLIP_TOP * SCALE, x, y]);
    }
  }
  return out;
}

/** The modelled darkening by the bar's CSS shadow at a page point, as a fraction of the page's luma. */
function shadowAt(x, y, progress) {
  const drop = 6 * progress;
  const own = sdLayers(x, y - drop);
  const shown = 1 - progress;
  if (own <= 0) return SHADOW.fill * shown;
  const d = sdLayers(x, y - drop - SHADOW.offset);
  return (SHADOW.alpha * shown) / (1 + Math.exp((1.702 * d) / SHADOW.sigma));
}

function stats(values) {
  const sorted = Float64Array.from(values, Math.abs).sort();
  const at = (q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
  let sum = 0;
  let signed = 0;
  let over = 0;
  for (const v of values) {
    sum += Math.abs(v);
    signed += v;
    if (Math.abs(v) > 2) over += 1;
  }
  const n = Math.max(values.length, 1);
  return { n: values.length, max: at(1), mean: sum / n, p50: at(0.5), p95: at(0.95), p99: at(0.99), over: over / n, signed: signed / n };
}

const f = (v, d = 2) => v.toFixed(d);
const show = (s) => `n ${s.n}, max ${f(s.max)}, mean ${f(s.mean, 3)}, p50 ${f(s.p50)}, p95 ${f(s.p95)}, p99 ${f(s.p99)}, >2 levels ${f(s.over * 100)} %, signed mean ${f(s.signed, 3)}`;

function frames(name) {
  const meta = JSON.parse(readFileSync(need(join(MOTION, `${name}.json`)), "utf8"));
  return meta.frames.map((frame) => ({ ...frame, file: need(join(MOTION, `${name}-${String(frame.k).padStart(3, "0")}.png`)) }));
}

for (const theme of ["light", "dark"]) {
  if (!existsSync(join(MOTION, `tab-bar-exact-${theme}.json`)) || !existsSync(join(MOTION, `tab-bar-exact-single-${theme}.json`))) {
    need(join(MOTION, `tab-bar-exact-${theme}.json`));
    need(join(MOTION, `tab-bar-exact-single-${theme}.json`));
    continue;
  }
  const two = frames(`tab-bar-exact-${theme}`);
  const one = frames(`tab-bar-exact-single-${theme}`);
  if (missing.length) continue;
  console.log(`\n== cover ${theme}: two-scale against one-disc over the covered region (inside the layers' box, ≥ 0.5 pt outside the drawn silhouette), luma levels`);
  const pooled = { all: [], edge: [], inner: [], ramp: [], deep: [] };
  let previous = readPng(one[0].file);
  for (let i = 1; i < two.length && i < one.length; i++) {
    const a = readPng(two[i].file);
    const b = readPng(one[i].file);
    // The shader draws a frame behind the page (Stage 1's edges per frame:
    // dark frame 3 at 359.8 pt is the silhouette at frame 2's progress): its
    // silhouette and drop in frame k are at the progress of frame k − 1. The
    // CSS shadow is the page's, at frame k's.
    const progress = two[i - 1].progress.fromShadow;
    const page = two[i].progress.fromShadow;
    const moved = [];
    for (let py = (PAGE_BAND.y0 - CLIP_TOP) * SCALE; py < (PAGE_BAND.y1 - CLIP_TOP) * SCALE; py++) {
      for (let px = 0; px < b.width; px++) moved.push(luma(b, px, py) - luma(previous, px, py));
    }
    const motion = stats(moved);
    previous = b;
    const tag = `frame ${two[i].k} (t ${f(two[i].t, 1)} ms, page progress ${f(page, 4)}, drawn at ${f(progress, 4)}; page moved since the frame before: mean ${f(motion.mean, 3)})`;
    const region = covered(progress);
    if (!region.length) {
      console.log(`  ${tag}: no covered region`);
      continue;
    }
    const parts = { all: [], edge: [], inner: [], ramp: [], deep: [] };
    let shadow = 0;
    for (const [px, py, x, y] of region) {
      const d = luma(a, px, py) - luma(b, px, py);
      const box = sdLayers(x, y);
      parts[box > 0 ? "ramp" : "all"].push(d);
      if (box <= 0) parts[box > -1.5 ? "edge" : "inner"].push(d);
      if (box <= 0 && sdGlass(x, y, progress) >= 2) parts.deep.push(d);
      if (box <= 0) shadow = Math.max(shadow, shadowAt(x, y, page) * luma(b, px, py));
    }
    for (const key of Object.keys(parts)) for (const v of parts[key]) pooled[key].push(v);
    console.log(`  ${tag}: ${show(stats(parts.all))} | CSS shadow there at most ${f(shadow)} levels`);
    console.log(`      within 1.5 pt of the box edge: ${show(stats(parts.edge))}; the ramp 0-1.5 pt outside the box: ${show(stats(parts.ramp))}`);
  }
  console.log(`  COVER ${theme}, frames 1-60 pooled: ${show(stats(pooled.all))}`);
  console.log(`  COVER ${theme}, pooled, ≥ 2 pt outside the silhouette: ${show(stats(pooled.deep))}`);
  console.log(`  COVER ${theme}, pooled, within 1.5 pt inside the box edge: ${show(stats(pooled.edge))}`);
  console.log(`  COVER ${theme}, pooled, deeper than 1.5 pt inside the box: ${show(stats(pooled.inner))}`);
  console.log(`  COVER ${theme}, pooled, the ramp 0-1.5 pt outside the box: ${show(stats(pooled.ramp))}`);
}

if (missing.length) {
  console.error(`missing inputs:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
