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
const PAGES = ["", "mid-", "scrolled-", "tabmin-", "sheet-"];
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
  for (const [what, least] of [["mid", 0.02], ["scrolled", 0.02], ["tabmin", 0.02], ["sheet", 0.05]]) {
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
  } else if (Math.abs(lens - page) + Math.abs(lens - Math.max(field, 0)) < 8) {
    fail(`calibration-shader-${scheme}.png draws without a lens: the blue field ends at ${lens} px, where the page (${page} px) and the fill (${field} px) leave it`);
  } else {
    report(`calibration ${scheme}: the lens moves the blue edge to ${lens} px (page ${page} px, fill ${field} px)`);
  }
}

// The floating bars: the expanded bar spans the screen (inset by 20 pt), the
// minimized one is a pill around the chosen tab; content shows in the gaps.
function bottomBand(image) {
  return { y0: Math.round(image.height * 0.865), y1: Math.round(image.height * 0.955) };
}

/**
 * The contiguous run of the bar's own fill around the chosen tab's centre, in
 * points. The bar is 20 pt in from each side when expanded and a 50 pt pill
 * around the tab when minimised, so the run at that x is the whole bar or one
 * tab's worth.
 */
function barRun(image) {
  const { y0, y1 } = bottomBand(image);
  const y = Math.round((y0 + y1) / 2);
  const x0 = Math.round(image.width * 0.125);
  const value = image.luminance(x0, y);
  let left = x0;
  let right = x0;
  while (left > 0 && Math.abs(image.luminance(left - 1, y) - value) < 0.035) left--;
  while (right < image.width - 1 && Math.abs(image.luminance(right + 1, y) - value) < 0.035) right++;
  const scale = image.width / 411;
  return (right - left) / scale;
}

for (const scheme of SCHEMES) {
  const expanded = must(`scrolled-${scheme}`);
  const minimized = must(`tabmin-${scheme}`);
  if (!expanded || !minimized) continue;
  const wide = barRun(expanded);
  const small = barRun(minimized);
  if (wide < 240) {
    fail(`scrolled-${scheme}.png's tab bar is ${wide.toFixed(0)} pt wide at the chosen tab: it is not the floating capsule (about 330 pt expected)`);
  } else if (small > wide - 80) {
    fail(`tabmin-${scheme}.png's tab bar is still ${small.toFixed(0)} pt wide (expanded ${wide.toFixed(0)} pt): it did not minimize`);
  } else {
    report(`${scheme}: the tab bar is ${wide.toFixed(0)} pt wide expanded and ${small.toFixed(0)} pt minimised`);
  }
  // Content around the capsule: the far left of the band is not the bar.
  const { y0, y1 } = bottomBand(expanded);
  const y = Math.round((y0 + y1) / 2);
  let edge = 0;
  for (let x = 1; x < 10; x++) edge += expanded.luminance(x, y);
  edge /= 9;
  const inside = expanded.luminance(Math.round(expanded.width / 2), y);
  if (Math.abs(edge - inside) < 0.02) {
    fail(`scrolled-${scheme}.png's tab bar reaches the screen edge (${edge.toFixed(2)} at the edge, ${inside.toFixed(2)} inside): it is not inset`);
  } else {
    report(`${scheme}: content shows in the 20 pt either side of the tab bar (${edge.toFixed(2)} against ${inside.toFixed(2)})`);
  }
}

// The material, on the calibration page: dark glass is lighter than its
// backdrop, and the rim refracts (the existing blue-field check above).
for (const scheme of SCHEMES) {
  const clear = must(`calibration-none-${scheme}`);
  const glass = must(`calibration-shader-${scheme}`);
  if (!clear || !glass) continue;
  const page = blueEdge(clear);
  if (page === null) continue;
  const scale = page / 70;
  const inside = (image) => {
    let sum = 0;
    let count = 0;
    for (let y = Math.round(134 * scale); y < Math.round(172 * scale); y += 2) {
      for (let x = Math.round(84 * scale); x < Math.round(216 * scale); x += 2) {
        sum += image.luminance(x, y);
        count += 1;
      }
    }
    return sum / count;
  };
  const lit = inside(glass);
  const behind = inside(clear);
  if (scheme === "dark") {
    if (!(lit > behind + 0.02)) {
      fail(`calibration-shader-dark.png is not lighter than its backdrop (${lit.toFixed(3)} against ${behind.toFixed(3)}): a dark slab, not glass`);
    } else if (lit > 0.36) {
      fail(`calibration-shader-dark.png reads ${lit.toFixed(3)}: too opaque for the reference band (0.06–0.34)`);
    } else {
      report(`dark glass reads ${lit.toFixed(3)} over a ${behind.toFixed(3)} backdrop`);
    }
  } else if (!(lit >= behind - 0.04)) {
    fail(`calibration-shader-light.png is darker than its backdrop (${lit.toFixed(3)} against ${behind.toFixed(3)})`);
  } else {
    report(`light glass reads ${lit.toFixed(3)} over a ${behind.toFixed(3)} backdrop`);
  }
  // The lit edge: iOS 27 lights the dark material from above, the light one
  // from below.
  const y = Math.round(152 * scale);
  const column = Math.round(150 * scale);
  const top = (() => {
    let best = 0;
    for (let row = Math.round(121 * scale); row < Math.round(126 * scale); row++) best = Math.max(best, glass.luminance(column, row));
    return best;
  })();
  const bottom = (() => {
    let best = 0;
    for (let row = Math.round(178 * scale); row < Math.round(183 * scale); row++) best = Math.max(best, glass.luminance(column, row));
    return best;
  })();
  const gain = scheme === "dark" ? top - bottom : bottom - top;
  if (gain < 0.03) {
    fail(`calibration-shader-${scheme}.png has no specular on its lit edge (${gain.toFixed(3)})`);
  } else {
    report(`${scheme}: the lit rim is ${gain.toFixed(3)} brighter than the opposite one (row ${y})`);
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
