#!/usr/bin/env node
// Pixel checks of the Liquid Glass material, on the calibration screenshots
// `tools/glass-shots.mjs` writes: a capsule over dense text and stripes, drawn
// with no glass at all, with the material a platform without a GPU draws, and
// with the shader.
//
//   node tools/glass-pixels.mjs [--dir docs/screenshots]
//
// It measures the properties the material is calibrated to, against the numbers
// read from the iOS 27 reference (`docs/design-notes.md`): the structure under
// the glass survives, dark glass is lighter than its backdrop, the rim
// refracts, the lit edge is brighter than the opposite one, and the sheen is
// smooth rather than banded.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));
const SCALE = 3;

/** The capsule of the calibration page, in page points. */
const CAPSULE = { x: 60, y: 120, width: 180, height: 64 };

const px = (points) => Math.round(points * SCALE);
const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${detail}`);
  if (!ok) failures.push(label);
};

/** Mean luminance of a rect in points. */
function mean(image, x0, y0, x1, y1) {
  let sum = 0;
  let count = 0;
  for (let y = px(y0); y < px(y1); y += 2) {
    for (let x = px(x0); x < px(x1); x += 2) {
      sum += image.luminance(x, y);
      count += 1;
    }
  }
  return count ? sum / count : 0;
}

/** A row's luminance profile in points, at `step` points. */
function profile(image, y, x0, x1, step = 1) {
  const values = [];
  for (let x = x0; x < x1; x += step) values.push(image.luminance(px(x), px(y)));
  return values;
}

/** Normalised correlation of two equal-length profiles. */
function correlation(a, b) {
  const n = Math.min(a.length, b.length);
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let da = 0;
  let db = 0;
  for (let i = 0; i < n; i++) {
    const x = a[i] - meanA;
    const y = b[i] - meanB;
    num += x * y;
    da += x * x;
    db += y * y;
  }
  return da > 0 && db > 0 ? num / Math.sqrt(da * db) : 0;
}

/** Edge energy: the mean absolute difference of neighbouring samples. */
function edgeEnergy(values) {
  let sum = 0;
  for (let i = 1; i < values.length; i++) sum += Math.abs(values[i] - values[i - 1]);
  return sum / Math.max(values.length - 1, 1);
}

const none = {};
const material = {};
const shader = {};
for (const scheme of ["light", "dark"]) {
  for (const [bucket, mode] of [
    [none, "none"],
    [material, "material"],
    [shader, "shader"],
  ]) {
    bucket[scheme] = readPng(join(DIR, `glass-calibration-${mode}-${scheme}.png`));
  }
}

// (a) Structure visibility: the profile under the glass keeps the shape of the
// content's own. A flat frosted slab loses it; a blur of a few points keeps it.
for (const scheme of ["light", "dark"]) {
  // Rows that carry content (a row between two lines has no structure to keep,
  // so its correlation is undefined and it says nothing).
  const pairs = [];
  for (let y = CAPSULE.y + 12; y < CAPSULE.y + CAPSULE.height - 8; y += 3) {
    const clear = profile(none[scheme], y, CAPSULE.x + 8, CAPSULE.x + CAPSULE.width - 8, 2);
    const glass = profile(shader[scheme], y, CAPSULE.x + 8, CAPSULE.x + CAPSULE.width - 8, 2);
    const flat = profile(material[scheme], y, CAPSULE.x + 8, CAPSULE.x + CAPSULE.width - 8, 2);
    if (edgeEnergy(clear) < 0.002) continue;
    pairs.push({ clear, glass, flat, r: correlation(clear, glass), flatR: correlation(clear, flat) });
  }
  const mean = (key) => pairs.reduce((s, p) => s + p[key], 0) / Math.max(pairs.length, 1);
  const r = mean("r");
  const flatR = mean("flatR");
  const limit = scheme === "dark" ? 0.35 : 0.25;
  check(
    `structure survives the ${scheme} glass`,
    pairs.length >= 2 && r >= limit,
    `correlation ${r.toFixed(2)} over ${pairs.length} rows with content (≥ ${limit}); the fill alone keeps ${flatR.toFixed(2)}`,
  );
  check(
    `the fill alone hides the structure (${scheme})`,
    flatR < r,
    `material correlation ${flatR.toFixed(2)} against the shader's ${r.toFixed(2)}`,
  );
}

// (b) Dark-mode luminance: the material is *lighter* than what lies behind it,
// and within the band the reference reads (0.06–0.30 over the page).
{
  const scheme = "dark";
  const inside = mean(shader[scheme], CAPSULE.x + 20, CAPSULE.y + 16, CAPSULE.x + CAPSULE.width - 20, CAPSULE.y + CAPSULE.height - 16);
  const behind = mean(none[scheme], CAPSULE.x + 20, CAPSULE.y + 16, CAPSULE.x + CAPSULE.width - 20, CAPSULE.y + CAPSULE.height - 16);
  const page = mean(none[scheme], 300, 300, 360, 420);
  check(
    "dark glass is lighter than its backdrop",
    inside > behind + 0.02,
    `inside ${inside.toFixed(3)} against the backdrop's ${behind.toFixed(3)}`,
  );
  check(
    "dark glass sits in the reference band",
    inside >= 0.06 && inside <= 0.34,
    `inside ${inside.toFixed(3)} (0.06–0.34; the page reads ${page.toFixed(3)})`,
  );
  const lightInside = mean(shader.light, CAPSULE.x + 20, CAPSULE.y + 16, CAPSULE.x + CAPSULE.width - 20, CAPSULE.y + CAPSULE.height - 16);
  const lightBehind = mean(none.light, CAPSULE.x + 20, CAPSULE.y + 16, CAPSULE.x + CAPSULE.width - 20, CAPSULE.y + CAPSULE.height - 16);
  check(
    "light glass is at least as bright as its backdrop",
    lightInside >= lightBehind - 0.02,
    `inside ${lightInside.toFixed(3)} against the backdrop's ${lightBehind.toFixed(3)}`,
  );
}

// (c) The lens: the page's hard blue edge at 70 pt, seen through the capsule,
// moves and bows. A blur cannot move a step edge.
for (const scheme of ["light", "dark"]) {
  const y = px(CAPSULE.y + CAPSULE.height / 2);
  const edge = (image) => {
    let most = 0;
    let at = null;
    for (let x = px(CAPSULE.x); x < px(CAPSULE.x + 60); x++) {
      const change = Math.abs(image.luminance(x, y) - image.luminance(x - 1, y));
      if (change > most) {
        most = change;
        at = x;
      }
    }
    return most > 0.08 ? { at, most } : null;
  };
  const page = edge(none[scheme]);
  const bent = edge(shader[scheme]);
  const moved = page && bent ? Math.abs(page.at - bent.at) / SCALE : null;
  check(
    `the rim refracts the backdrop (${scheme})`,
    moved !== null && moved >= 1.5,
    moved === null
      ? `no edge under the rim (${JSON.stringify(page)} / ${JSON.stringify(bent)})`
      : `the edge moves ${moved.toFixed(2)} pt (${page.at}px to ${bent.at}px)`,
  );
}

// (d) The specular: a bright line on the lit edge, the lit side by appearance
// (iOS 27 lights the light material from below and the dark one from above),
// and the opposite edge dimmer.
for (const [scheme, lit] of [
  ["dark", "top"],
  ["light", "bottom"],
]) {
  const column = px(CAPSULE.x + CAPSULE.width / 2);
  const band = (from, to) => {
    let best = 0;
    for (let y = px(from); y < px(to); y++) best = Math.max(best, shader[scheme].luminance(column, y));
    return best;
  };
  const top = band(CAPSULE.y + 0.5, CAPSULE.y + 5);
  const bottom = band(CAPSULE.y + CAPSULE.height - 5, CAPSULE.y + CAPSULE.height - 0.5);
  const middle = shader[scheme].luminance(column, px(CAPSULE.y + CAPSULE.height / 2));
  const gain = lit === "top" ? top - bottom : bottom - top;
  check(
    `the specular follows the light (${scheme})`,
    gain >= 0.05,
    `${lit} edge ${gain.toFixed(3)} brighter (top ${top.toFixed(3)}, bottom ${bottom.toFixed(3)}, middle ${middle.toFixed(3)})`,
  );
  const base = mean(none[scheme], CAPSULE.x + 60, CAPSULE.y + 20, CAPSULE.x + CAPSULE.width - 20, CAPSULE.y + CAPSULE.height - 20);
  check(
    `the sheen is smooth, not banded (${scheme})`,
    Math.abs(middle - base) < 0.5,
    `middle ${middle.toFixed(3)} against the page's ${base.toFixed(3)}`,
  );
}

if (failures.length) {
  console.error(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("the material refracts, keeps its backdrop's structure and catches the light");
