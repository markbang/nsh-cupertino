#!/usr/bin/env node
// Checks the emulator captures `tools/android-glass.sh` takes: no page is
// blank, the scroll and the sheet really changed the frame, dark is dark, and
// the shader refracts instead of falling back to a plain fill.
//
//   node tools/android-glass-check.mjs [--dir docs/screenshots]
//
// The refraction check reads the calibration page, which draws one capsule over
// a hard vertical edge three ways (no glass, the material without a GPU, the
// shader): the edge sits 10 pt inside the capsule's rim, and a blur cannot move
// a step edge while the lens does. A GPU that never opened the shader makes the
// third still a fill, and the edge then sits where the material leaves it.
import { readdirSync } from "node:fs";
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

const SCHEMES = ["light", "dark"];
/** The demonstration pages: rich enough that a blank frame is unmistakable. */
const PAGES = ["", "scrolled-", "capsules-", "sheet-"];
const MODES = ["none", "material", "shader"];

const failures = [];
const fail = (message) => failures.push(message);
const file = (name) => join(DIR, `android-glass-${name}.png`);
const report = (line) => console.log(line);

const read = new Map();
function must(name) {
  if (read.has(name)) return read.get(name);
  let image = null;
  try {
    image = readPng(file(name));
  } catch (error) {
    fail(`${name}.png: ${error.message}`);
  }
  read.set(name, image);
  return image;
}

/** Mean luminance over a grid, 0..1. */
function mean(image) {
  let sum = 0;
  let count = 0;
  for (let y = 0; y < image.height; y += 3) {
    for (let x = 0; x < image.width; x += 3) {
      sum += image.luminance(x, y);
      count += 1;
    }
  }
  return sum / count;
}

/** How many distinct colours (5 bits a channel) the frame holds. */
function colours(image) {
  const seen = new Set();
  for (let y = 0; y < image.height; y += 2) {
    for (let x = 0; x < image.width; x += 2) {
      const [r, g, b] = image.pixel(x, y);
      seen.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
    }
  }
  return seen.size;
}

/** The mean absolute luminance difference of two frames, 0..1. */
function difference(a, b) {
  if (a.width !== b.width || a.height !== b.height) return 1;
  let sum = 0;
  let count = 0;
  for (let y = 0; y < a.height; y += 3) {
    for (let x = 0; x < a.width; x += 3) {
      sum += Math.abs(a.luminance(x, y) - b.luminance(x, y));
      count += 1;
    }
  }
  return sum / count;
}

/**
 * Where a row of the calibration page turns from the blue band to the light
 * page, in pixels: half-way between the row's darkest and lightest points, so
 * the material's tint and blur move the value without moving the edge.
 */
function edge(image, y) {
  let least = 1;
  let most = 0;
  for (let x = 0; x < image.width; x++) {
    const value = image.luminance(x, y);
    least = Math.min(least, value);
    most = Math.max(most, value);
  }
  if (most - least < 0.1) return null;
  const level = (least + most) / 2;
  for (let x = 1; x < image.width; x++) {
    if (image.luminance(x - 1, y) < level && image.luminance(x, y) >= level) return x;
  }
  return null;
}

/** The rows where two frames differ, and the biggest change in them: the capsule. */
function changedRows(a, b) {
  const rows = [];
  let most = 0;
  for (let y = 0; y < a.height; y += 2) {
    let row = 0;
    for (let x = 0; x < a.width; x += 4) {
      row = Math.max(row, Math.abs(a.luminance(x, y) - b.luminance(x, y)));
    }
    if (row > 0.05) rows.push(y);
    most = Math.max(most, row);
  }
  return { rows, most };
}

for (const scheme of SCHEMES) {
  for (const page of PAGES) {
    const name = `${page}${scheme}`;
    const image = must(name);
    if (!image) continue;
    const brightness = mean(image);
    const shades = colours(image);
    if (brightness <= 0.02) fail(`${name}.png is black (mean luminance ${brightness.toFixed(3)})`);
    else if (shades <= 3) fail(`${name}.png is one colour (${shades} shades): nothing drew`);
    else report(`${name}.png: ${image.width}×${image.height}, mean ${brightness.toFixed(2)}, ${shades} shades`);
  }
}

// The frames that must differ from the top of the page: a run where the finger
// never moved (or the sheet never opened) writes the same still twice.
const tops = Object.fromEntries(SCHEMES.map((scheme) => [scheme, must(scheme) ?? null]));
for (const scheme of SCHEMES) {
  const top = tops[scheme];
  if (!top) continue;
  for (const [what, least] of [["scrolled", 0.02], ["capsules", 0.02], ["sheet", 0.05]]) {
    const other = must(`${what}-${scheme}`);
    if (!other) continue;
    const moved = difference(top, other);
    if (moved < least) {
      fail(`${what}-${scheme}.png is the top of the page (difference ${moved.toFixed(3)}): the ${what} step did nothing`);
    } else {
      report(`${what}-${scheme}.png differs from the top by ${moved.toFixed(3)}`);
    }
  }
}

const light = tops.light;
const dark = tops.dark;
if (light && dark) {
  const gap = mean(light) - mean(dark);
  if (gap < 0.2) {
    fail(`dark and light look alike (${mean(light).toFixed(2)} vs ${mean(dark).toFixed(2)}): \`cmd uimode night\` did not reach the app`);
  } else {
    report(`dark is dark: ${mean(light).toFixed(2)} → ${mean(dark).toFixed(2)}`);
  }
}

// The calibration page: a blue band on the left, the capsule at 10 pt from its
// edge. `none` has no material, `material` the fill and blur, `shader` the lens.
for (const scheme of SCHEMES) {
  const shots = {};
  for (const mode of MODES) {
    const image = must(`calibration-${mode}-${scheme}`);
    if (!image) continue;
    shots[mode] = image;
    const [r, g, b] = image.pixel(6, image.height >> 1);
    if (!(b > r + 60 && b > g + 60)) {
      fail(`calibration-${mode}-${scheme}.png has no blue band at its left edge (rgb ${r},${g},${b}): the calibration page did not land`);
    }
    if (mean(image) <= 0.02) fail(`calibration-${mode}-${scheme}.png is black`);
  }
  const material = shots.material;
  const shader = shots.shader;
  if (!material || !shader) continue;
  const drawn = changedRows(shots.none ?? material, shader);
  if (drawn.rows.length < 8) {
    fail(`calibration-shader-${scheme}.png draws nothing over calibration-none-${scheme}.png: the shader produced no surface`);
    continue;
  }
  const y = drawn.rows[drawn.rows.length >> 1];
  const before = edge(material, y);
  const after = edge(shader, y);
  if (before === null || after === null) {
    fail(`calibration: no edge to measure on row ${y} (material ${before}, shader ${after})`);
    continue;
  }
  const moved = Math.abs(after - before);
  const apart = changedRows(material, shader).most;
  report(`calibration ${scheme}: the surface covers ${drawn.rows.length} rows, the shader differs from the material by ${apart.toFixed(2)}, the edge at row ${y} moves ${moved} px (${before} → ${after})`);
  if (apart < 0.02) {
    fail(`calibration-shader-${scheme}.png is calibration-material-${scheme}.png: the GPU shader drew nothing of its own`);
  } else if (moved < 2) {
    fail(`calibration-shader-${scheme}.png draws without the lens: the edge under the rim stays at ${before} px (a flat fill, not refraction)`);
  }
}

const written = readdirSync(DIR).filter((name) => name.startsWith("android-glass-"));
if (!written.length) fail(`${DIR} holds no android-glass-*.png`);

if (failures.length) {
  console.error(`\n${failures.length} problem(s):`);
  for (const message of failures) console.error(`- ${message}`);
  process.exit(1);
}
report(`\n${written.length} captures, none blank; the shader refracts on this GPU`);
