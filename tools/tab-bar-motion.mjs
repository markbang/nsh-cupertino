#!/usr/bin/env node
// The tab bar's minimise in time, on the web: the recordings `tools/glass-shots.mjs`
// makes (`motion/tab-bar-motion-*`, one still per 16.667 ms frame of the page's
// own clock, the bar's band of the screen at 3x), with the two-scale body and
// with the one-disc body before it (`material="single-blur"`), light and dark.
//
//   node tools/tab-bar-motion.mjs [--dir docs/screenshots/motion]
//
// Per frame: t, the mean luma of a patch of the bar's body over a flat backdrop,
// and the silhouette's right edge on the bar's middle row. The criteria are
// Cohub's and are not to be loosened:
//  1. over the hand-over (the frames while the patch is still glass), the patch's
//     luma is monotonic within ±1 level, and no two adjacent frames differ by more
//     than 3 levels;
//  2. the bar takes at most 5 % longer to settle into the pill than the one-disc
//     body does;
//  3. the silhouette's motion has no reversal or stall the one-disc body's has not.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots", "motion"));

// The criteria (Cohub, PR #43).
const JITTER = 1;
const MOST_PER_FRAME = 3;
const SLOWER = 1.05;
// Below a pixel (1/3 pt) an edge has not moved: the motion's resolution.
const MOVED = 1 / 3;

// Geometry, in page points, of the recording page (`App.tsx`
// `TabBarFixtureScrollPage`: a 402 × 874 screen, `GlassTabBar`'s own place,
// 20 pt in and 12 pt up, 64 pt tall): the bar spans x 20–382 and y 798–862 at
// rest, its pill sits at the middle (no tabs: anchor 0.5, x 201).
const CLIP_Y = 770;
const PILL_X = 201;
// The patch: the bar's body right of the pill and its shadow, over the
// backdrop's flat page (its text ends at x 210), 6 pt either side of the middle
// row. The lift moves the bar at most 6 pt down, which keeps the patch in the
// body. A patch over text, left of the pill, is reported for comparison.
const PATCH = { x0: 250, x1: 266, y0: 824, y1: 836 };
const TEXT_PATCH = { x0: 120, x1: 136, y0: 824, y1: 836 };
// The hand-over is judged while the silhouette's right edge is far enough right
// of the patch for no rim term to reach it: the shader's rim-light tail,
// 0.05 × 1.15 (dark) × 255 × exp(−(d − 0.7) / 7) levels at d pt inside the edge,
// is under one level from d = 20 pt. Past that the edge crossing the patch, not
// the hand-over, moves its luma (the one-disc body shows the same).
const GLASS_UNTIL = PATCH.x1 + 20;
// The middle row, where the right edge is read: from x 386 leftwards, the first
// pixel past half-way from the page (x 398–401 on frame 0) to the body at rest
// (x 290–300 on frame 0), on the body's side: a 50 % edge. The light rim's
// hairline cancels its own bright edge on the capsule's end, and the bar's
// shadow lies on the page's side, so neither moves it. The left edge mirrors it
// about the pill (x 201).
const EDGE_ROW = 833;

const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${detail}`);
  if (!ok) failures.push(label);
};
const f = (v, d = 2) => (v === null || v === undefined ? "—" : v.toFixed(d));

function lumaOf(image, x, y) {
  const [r, g, b] = image.pixel(x, y);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function patchMean(image, box) {
  let sum = 0;
  let n = 0;
  for (let y = Math.round((box.y0 - CLIP_Y) * 3); y < Math.round((box.y1 - CLIP_Y) * 3); y++) {
    for (let x = Math.round(box.x0 * 3); x < Math.round(box.x1 * 3); x++) {
      sum += lumaOf(image, x, y);
      n += 1;
    }
  }
  return sum / n;
}

function rowMean(image, x0, x1) {
  const y = Math.round((EDGE_ROW - CLIP_Y) * 3);
  let sum = 0;
  for (let x = x0 * 3; x < x1 * 3; x++) sum += lumaOf(image, x, y);
  return sum / ((x1 - x0) * 3);
}

function rightEdge(image, page, body) {
  const y = Math.round((EDGE_ROW - CLIP_Y) * 3);
  const half = (body - page) / 2;
  for (let x = Math.round(386 * 3); x >= Math.round(150 * 3); x--) {
    if ((lumaOf(image, x, y) - page) * Math.sign(half) > Math.abs(half)) return (x + 0.5) / 3;
  }
  return null;
}

function analyse(name) {
  const meta = JSON.parse(readFileSync(join(DIR, `${name}.json`), "utf8"));
  const rows = [];
  let page = null;
  let body = null;
  for (const frame of meta.frames) {
    const image = readPng(join(DIR, `${name}-${String(frame.k).padStart(3, "0")}.png`));
    if (page === null) {
      page = rowMean(image, 398, 401);
      body = rowMean(image, 290, 300);
    }
    const right = rightEdge(image, page, body);
    rows.push({
      k: frame.k,
      t: frame.t,
      luma: patchMean(image, PATCH),
      text: patchMean(image, TEXT_PATCH),
      right,
      left: right === null ? null : 2 * PILL_X - right,
    });
  }
  // Frame-exact: each step is one 60 fps frame of the page's clock.
  const steps = rows.slice(1).map((row, i) => row.t - rows[i].t);
  const exact = steps.every((s) => Math.abs(s - 1000 / 60) < 1e-6);
  // The hand-over: from rest while the patch is glass.
  const glass = [];
  for (const row of rows) {
    if (row.right === null || row.right < GLASS_UNTIL) break;
    glass.push(row);
  }
  const lumas = glass.map((row) => row.luma);
  const rising = lumas[lumas.length - 1] >= lumas[0];
  let against = 0;
  let most = 0;
  let extreme = lumas[0];
  for (let i = 1; i < lumas.length; i++) {
    most = Math.max(most, Math.abs(lumas[i] - lumas[i - 1]));
    against = Math.max(against, rising ? extreme - lumas[i] : lumas[i] - extreme);
    extreme = rising ? Math.max(extreme, lumas[i]) : Math.min(extreme, lumas[i]);
  }
  // The motion: settled from the first frame whose edge stays within a pixel
  // of the last frame's.
  const final = rows[rows.length - 1].right;
  let settle = rows.length - 1;
  while (settle > 0 && rows[settle - 1].right !== null && Math.abs(rows[settle - 1].right - final) <= MOVED) settle -= 1;
  const v = rows.map((row, i) => (i === 0 || row.right === null || rows[i - 1].right === null ? 0 : row.right - rows[i - 1].right));
  const first = v.findIndex((x) => Math.abs(x) >= MOVED);
  let reversals = 0;
  let stalls = 0;
  for (let i = first + 1; i <= settle; i++) {
    const before = v.slice(first, i).some((x) => Math.abs(x) >= MOVED);
    const after = v.slice(i + 1, settle + 1).some((x) => Math.abs(x) >= MOVED);
    if (Math.abs(v[i]) >= MOVED && Math.abs(v[i - 1]) >= MOVED && Math.sign(v[i]) !== Math.sign(v[i - 1])) reversals += 1;
    if (Math.abs(v[i]) < MOVED && before && after) stalls += 1;
  }
  return { name, rows, exact, glass: glass.length, against, most, rising, settleMs: rows[settle].t, settle, first, reversals, stalls };
}

const runs = {};
for (const scheme of ["light", "dark"]) {
  for (const [body, tag] of [["two", ""], ["single", "single-"]]) {
    runs[`${body}-${scheme}`] = analyse(`tab-bar-motion-${tag}${scheme}`);
  }
}

for (const [key, run] of Object.entries(runs)) {
  console.log(`\n${run.name}: t(ms), patch luma (x ${PATCH.x0}–${PATCH.x1}, y ${PATCH.y0}–${PATCH.y1} pt), text patch luma (x ${TEXT_PATCH.x0}–${TEXT_PATCH.x1}), left / right edge (pt)`);
  for (const row of run.rows) {
    console.log(`  ${f(row.t, 1).padStart(7)}  ${f(row.luma).padStart(7)}  ${f(row.text).padStart(7)}  ${f(row.left, 1).padStart(6)} / ${f(row.right, 1)}`);
  }
  console.log(
    `  ${key}: ${run.glass} frames with the patch in the glass, largest step ${f(run.most)} levels, ${f(run.against)} against the trend (${run.rising ? "rising" : "falling"}); moves from frame ${run.first}, settled at ${f(run.settleMs, 1)} ms (frame ${run.settle}); ${run.reversals} reversals, ${run.stalls} stalls`,
  );
}

for (const scheme of ["light", "dark"]) {
  const two = runs[`two-${scheme}`];
  const single = runs[`single-${scheme}`];
  check(
    `the ${scheme} recordings are frame-exact`,
    two.exact && single.exact && two.rows.length === single.rows.length,
    `${two.rows.length} and ${single.rows.length} frames, every step 16.667 ms of the page clock`,
  );
  check(
    `the ${scheme} bar minimises in the recordings`,
    [two, single].every((run) => run.first >= 0 && run.rows[run.rows.length - 1].right !== null && run.rows[run.rows.length - 1].right < 240),
    `the right edge moves from frame ${two.first} / ${single.first} and ends at ${f(two.rows[two.rows.length - 1].right, 1)} / ${f(single.rows[single.rows.length - 1].right, 1)} pt (the pill ends at 226)`,
  );
  check(
    `the ${scheme} hand-over has frames to judge`,
    two.glass >= 3,
    `${two.glass} frames with the patch still glass (≥ 3)`,
  );
  check(
    `the ${scheme} hand-over is monotonic`,
    two.against <= JITTER,
    `${f(two.against)} levels against the trend over ${two.glass} frames (≤ ${JITTER}); the one-disc body ${f(single.against)}`,
  );
  check(
    `the ${scheme} hand-over changes at most ${MOST_PER_FRAME} levels a frame`,
    two.most <= MOST_PER_FRAME,
    `largest step ${f(two.most)} levels (≤ ${MOST_PER_FRAME}); the one-disc body ${f(single.most)}`,
  );
  check(
    `the ${scheme} bar minimises within 5 % of the one-disc body's time`,
    two.settleMs <= single.settleMs * SLOWER,
    `settled at ${f(two.settleMs, 1)} ms against ${f(single.settleMs, 1)} ms (≤ ${f(single.settleMs * SLOWER, 1)})`,
  );
  check(
    `the ${scheme} silhouette moves as smoothly as the one-disc body's`,
    two.reversals <= single.reversals && two.stalls <= single.stalls,
    `${two.reversals} reversals and ${two.stalls} stalls, against ${single.reversals} and ${single.stalls} (a reversal: the edge's velocity changes sign between two frames that each move ≥ 1 px; a stall: a frame moving < 1 px between moving frames, before it settles)`,
  );
}

if (failures.length) {
  console.error(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("the bar hands its body over smoothly in time and minimises on the one-disc body's schedule");
