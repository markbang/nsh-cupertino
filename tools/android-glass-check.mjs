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
import { describeBar } from "./android-bar.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));

const SCHEMES = ["light", "dark"];
/** The demonstration pages: rich enough that a blank frame is unmistakable. */
const PAGES = ["", "scrolled-", "capsules-", "sheet-", "behind-"];
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

/** The page's hard blue edge, in pixels: 70 pt, which gives the device's scale. */
function blueEdge(none) {
  const y = none.height >> 1;
  let most = 0;
  let at = null;
  for (let x = 1; x < none.width; x++) {
    const change = Math.abs(none.luminance(x, y) - none.luminance(x - 1, y));
    if (change > most) {
      most = change;
      at = x;
    }
  }
  return most > 0.2 ? at : null;
}

/**
 * How far the blue field reaches along a row, in pixels: the last x whose pixel
 * is clearly blue. On the calibration page the field ends at 70 pt; a material
 * that magnifies the backdrop (the lens) carries it further inside the capsule.
 */
function blueReach(image, y, until) {
  let last = -1;
  for (let x = 0; x < until; x++) {
    const [r, , b] = image.pixel(x, y);
    if (b - r > 60) last = x;
  }
  return last;
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

/** How many stripes a row of the page crosses: strong blue to the page's light. */
function stripeTransitions(image, y) {
  const from = Math.round(image.width * 0.05);
  const until = Math.round(image.width * 0.95);
  let count = 0;
  let previous = null;
  for (let x = from; x < until; x += 2) {
    const [r, , b] = image.pixel(x, y);
    const blue = b - r > 100;
    if (previous !== null && blue !== previous) count += 1;
    previous = blue;
  }
  return count;
}

/** The share of a row that is the stripes' blue. */
function stripeBlue(image, y) {
  const from = Math.round(image.width * 0.05);
  const until = Math.round(image.width * 0.95);
  let blue = 0;
  let count = 0;
  for (let x = from; x < until; x += 2) {
    const [r, , b] = image.pixel(x, y);
    if (b - r > 100) blue += 1;
    count += 1;
  }
  return blue / count;
}

/** The row of the page's striped band that crosses the most stripes, or null. */
function stripeRow(image) {
  let best = null;
  let most = 0;
  for (let y = 0; y < image.height; y += 4) {
    const stripes = stripeTransitions(image, y);
    if (stripes > most) {
      most = stripes;
      best = y;
    }
  }
  return most >= 10 ? best : null;
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
    // A page of the demo holds text, rows and a picture: a window that never
    // drew (a stuck splash, a white dialog) is a handful of shades.
    else if (shades < 100) fail(`${name}.png holds ${shades} shades: a window drew nothing, not the page`);
    else report(`${name}.png: ${image.width}×${image.height}, mean ${brightness.toFixed(2)}, ${shades} shades`);
  }
}

// The frames that must differ from the top of the page: a run where the finger
// never moved (or the sheet never opened) writes the same still twice.
const tops = Object.fromEntries(SCHEMES.map((scheme) => [scheme, must(scheme) ?? null]));
for (const scheme of SCHEMES) {
  const top = tops[scheme];
  if (!top) continue;
  for (const [what, least] of [["scrolled", 0.02], ["capsules", 0.02], ["sheet", 0.05], ["behind", 0.02]]) {
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

// The bar's backdrop (#16): scrolled until the striped band is behind it, the
// bar's own row must hold the stripes' blue and more than one colour. A bar the
// content stops at is the page's fill — one colour, no blue — and fails, which
// is what `tools/android-glass.sh` scrolls against.
for (const scheme of SCHEMES) {
  const top = tops[scheme];
  const behind = must(`behind-${scheme}`);
  if (!top || !behind) continue;
  const { striped, measured } = describeBar(behind);
  report(`behind-${scheme}.png: the bar's ${measured}`);
  if (!striped) {
    fail(`behind-${scheme}.png: the bar is flat (${measured}) — the page does not scroll under it`);
  }
  // The reference the row is read against: the page's own striped band, in the
  // same still frame at the top, so a run where the band never drew is named.
  const band = stripeRow(top);
  if (band === null) {
    fail(`${scheme}.png holds no striped band to compare the bar against`);
  } else {
    report(`behind-${scheme}.png: the page's band at row ${band} is ${stripeTransitions(top, band)} stripes wide, ${(stripeBlue(top, band) * 100).toFixed(0)}% of it blue`);
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
  const none = shots.none;
  const material = shots.material;
  const shader = shots.shader;
  if (!none || !material || !shader) continue;
  const page = blueEdge(none);
  if (page === null) {
    fail(`calibration-none-${scheme}.png has no blue edge to calibrate on`);
    continue;
  }
  // `GlassCalibrationPage`: the capsule runs from 60 pt to 240 pt, and its
  // vertical middle is 152 pt below the top.
  const scale = page / 70;
  const y = Math.round(152 * scale);
  const until = Math.round(240 * scale);
  const field = blueReach(material, y, until);
  const lens = blueReach(shader, y, until);
  const apart = changedRows(material, shader).most;
  report(
    `calibration ${scheme}: the blue field ends at ${page} px on the page, reaches ${field} px through the fill and ${lens} px through the shader at row ${y} (${scale.toFixed(2)} px a point)`,
  );
  if (apart < 0.02) {
    fail(`calibration-shader-${scheme}.png is calibration-material-${scheme}.png: the GPU shader drew nothing of its own`);
  } else if (lens - Math.max(field, page) < 40) {
    fail(`calibration-shader-${scheme}.png draws without the lens: the blue field reaches ${lens} px, as far as the fill (${field} px), not past the page's edge (${page} px)`);
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
