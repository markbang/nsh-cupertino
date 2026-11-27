#!/usr/bin/env node
// Does a pinned-progress still correspond to a real frame of a minimise?
//
//   node tools/tab-bar-frames.mjs [--dir docs/screenshots]
//
// The two-scale pinned stills (`tab-bar-fixture-morph-<theme>-<tag>.png`,
// `GlassTabBar`'s `morph` held at 0.1, 0.25, 0.5, 0.75) against every frame of
// one minimise recorded at 60 fps on the stills' own scene
// (`motion/tab-bar-exact-<theme>-NNN.png`, `App.tsx` `TabBarFixtureExactPage`:
// after the user's 60 pt scroll the fixture image lies where the still page
// has it, and the bar sits in the same container). Frame 0 is taken before the
// scroll, so frames 1-60 are compared.
//
// Per still: the closest frame by the silhouette's right edge and the closest
// by luma rms over the bar box, and for each the pixel-by-pixel |difference|
// of luma (levels) over the box: max, mean, p50, p95, p99 and the share of
// pixels more than 2 levels apart.
//
// Noise, measured: (1) each pinned still against a second capture of it from a
// fresh navigation (`-again`); (2) two frames of the recording after it has
// settled (frames 50 and 60, the same state). A still matches a real frame
// within noise when the closest frame's max and p99 are no larger than the
// noise's (the larger of the two measurements). A sanity line checks that the
// scenes are the same: the pinned still at progress 1 against the settled frame.
//
// Report only: the run fails when an input is missing, not on a verdict.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));
const MOTION = join(DIR, "motion");

const THEMES = ["light", "dark"];
const TAGS = ["010", "025", "050", "075"];
// The recording's still clip begins 770 pt down the page (`glass-shots.mjs`
// MOTION_CLIP); the pinned stills are the whole page. Both are 3x.
const CLIP_Y = 770 * 3;
// The bar's box in page points: its 362 × 64 pt capsule at x 21-381, y 790-854,
// the 6 pt drop and the rim around it.
const BOX = { x0: 19 * 3, x1: 383 * 3, y0: 786 * 3, y1: 866 * 3 };
// The row the right edge is read on, inside the bar and its pill at any
// progress (centre 822 pt + up to 6 pt of drop).
const EDGE_ROW = 825 * 3;

const missing = [];
const need = (file) => {
  if (!existsSync(file)) missing.push(file);
  return file;
};

function lumaOf(image, x, y) {
  const [r, g, b] = image.pixel(x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** The bar box's luma, row by row, from an image whose first row is page row `top`. */
function box(image, top) {
  const out = new Float64Array((BOX.x1 - BOX.x0) * (BOX.y1 - BOX.y0));
  let i = 0;
  for (let y = BOX.y0; y < BOX.y1; y++) for (let x = BOX.x0; x < BOX.x1; x++) out[i++] = lumaOf(image, x, y - top);
  return out;
}

function rowMean(image, top, x0, x1) {
  let sum = 0;
  for (let x = x0; x < x1; x++) sum += lumaOf(image, x, EDGE_ROW - top);
  return sum / (x1 - x0);
}

/** The right edge on the edge row, in points: the first pixel from x 386 pt leftwards past half-way from the page to the body. */
function rightEdge(image, top, page, body) {
  const half = (body - page) / 2;
  for (let x = 386 * 3; x >= 150 * 3; x--) {
    if ((lumaOf(image, x, EDGE_ROW - top) - page) * Math.sign(half) > Math.abs(half)) return (x + 0.5) / 3;
  }
  return null;
}

function stats(a, b) {
  const d = Array.from(a, (v, i) => Math.abs(v - b[i])).sort((x, y) => x - y);
  const at = (q) => d[Math.min(d.length - 1, Math.floor(q * d.length))];
  let sum = 0;
  let sq = 0;
  let over = 0;
  for (const v of d) {
    sum += v;
    sq += v * v;
    if (v > 2) over += 1;
  }
  return { max: d[d.length - 1], mean: sum / d.length, p50: at(0.5), p95: at(0.95), p99: at(0.99), over: over / d.length, rms: Math.sqrt(sq / d.length) };
}

const f = (v, d = 2) => (v === null || v === undefined ? "—" : v.toFixed(d));
const show = (s) => `max ${f(s.max)}, mean ${f(s.mean, 3)}, p50 ${f(s.p50)}, p95 ${f(s.p95)}, p99 ${f(s.p99)}, >2 levels ${(s.over * 100).toFixed(2)} %, rms ${f(s.rms, 3)}`;

for (const theme of THEMES) {
  const metaFile = need(join(MOTION, `tab-bar-exact-${theme}.json`));
  const stillFiles = ["000", ...TAGS, "100"].map((tag) => need(join(DIR, `tab-bar-fixture-morph-${theme}-${tag}.png`)));
  const againFiles = [...TAGS, "100"].map((tag) => need(join(DIR, `tab-bar-fixture-morph-${theme}-${tag}-again.png`)));
  if (missing.length) continue;
  const meta = JSON.parse(readFileSync(metaFile, "utf8"));
  const frames = meta.frames.map((frame) => {
    const image = readPng(need(join(MOTION, `tab-bar-exact-${theme}-${String(frame.k).padStart(3, "0")}.png`)));
    return { k: frame.k, t: frame.t, image };
  });
  if (missing.length) continue;

  const rest = readPng(stillFiles[0]);
  const page = rowMean(rest, 0, 398 * 3, 401 * 3);
  const body = rowMean(rest, 0, 290 * 3, 300 * 3);
  for (const frame of frames) {
    frame.box = box(frame.image, CLIP_Y);
    frame.edge = rightEdge(frame.image, CLIP_Y, page, body);
  }
  const moving = frames.filter((frame) => frame.k >= 1);

  console.log(`\n== ${theme}: ${frames.length} frames of the exact recording (frame 0 before the scroll), bar box x ${BOX.x0 / 3}-${BOX.x1 / 3}, y ${BOX.y0 / 3}-${BOX.y1 / 3} pt, luma levels`);
  console.log(`   right edge per frame (pt): ${frames.map((fr) => `${fr.k}:${f(fr.edge, 1)}`).join(" ")}`);

  // Noise.
  const noises = [];
  [...TAGS, "100"].forEach((tag, i) => {
    const s = stats(box(readPng(stillFiles[i + 1]), 0), box(readPng(againFiles[i]), 0));
    noises.push(s);
    console.log(`   noise, pinned ${tag} against its second capture: ${show(s)}`);
  });
  const settled = stats(frames[50].box, frames[60].box);
  noises.push(settled);
  console.log(`   noise, recording frame 50 against frame 60 (settled): ${show(settled)}`);
  const noise = { max: Math.max(...noises.map((s) => s.max)), p99: Math.max(...noises.map((s) => s.p99)) };
  console.log(`   NOISE (${theme}): max ${f(noise.max)}, p99 ${f(noise.p99)}`);

  // Sanity: the same scene. The pinned still at progress 1 against the settled frame.
  const end = stats(box(readPng(stillFiles[5]), 0), frames[60].box);
  console.log(`   sanity, pinned 100 against frame 60: ${show(end)} -> ${end.max <= noise.max && end.p99 <= noise.p99 ? "same scene within noise" : "NOT within noise: the scenes differ"}`);

  TAGS.forEach((tag, i) => {
    const still = readPng(stillFiles[i + 1]);
    const pinned = box(still, 0);
    const edge = rightEdge(still, 0, page, body);
    const scored = moving.map((frame) => ({ frame, s: stats(pinned, frame.box) }));
    const byRms = scored.reduce((a, b) => (b.s.rms < a.s.rms ? b : a));
    const byEdge = scored.reduce((a, b) => {
      const da = a.frame.edge === null || edge === null ? Infinity : Math.abs(a.frame.edge - edge);
      const db = b.frame.edge === null || edge === null ? Infinity : Math.abs(b.frame.edge - edge);
      return db < da || (db === da && b.s.rms < a.s.rms) ? b : a;
    });
    const p = Number(tag) / 100;
    console.log(`   pinned ${tag} (progress ${p}, the layers' share ${f(1 - p)}; right edge ${f(edge, 1)} pt):`);
    for (const [how, best] of [["by edge", byEdge], ["by rms", byRms]]) {
      const share = Math.max(0, 1 - best.frame.t / 200);
      console.log(`     closest ${how}: frame ${best.frame.k} (t ${f(best.frame.t, 1)} ms, edge ${f(best.frame.edge, 1)} pt, the layers' share ${f(share)}): ${show(best.s)}`);
    }
    const within = byRms.s.max <= noise.max && byRms.s.p99 <= noise.p99;
    console.log(
      `     VERDICT ${theme} ${tag}: ${
        within
          ? `matches a real frame within noise (frame ${byRms.frame.k}, t ${f(byRms.frame.t, 1)} ms)`
          : `no real frame within noise (closest, frame ${byRms.frame.k} at t ${f(byRms.frame.t, 1)} ms, differs by max ${f(byRms.s.max)}, p99 ${f(byRms.s.p99)}, against noise max ${f(noise.max)}, p99 ${f(noise.p99)})`
      }`,
    );
    console.log(`     files: tab-bar-fixture-morph-${theme}-${tag}.png and motion/tab-bar-exact-${theme}-${String(byRms.frame.k).padStart(3, "0")}.png`);
  });
}

if (missing.length) {
  console.error(`missing inputs:\n  ${missing.join("\n  ")}`);
  process.exit(1);
}
