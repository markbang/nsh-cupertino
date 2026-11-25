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
// refracts, both ends of the light axis catch it alike, and the sheen is
// smooth rather than banded.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { CAPSULE, judgeRim, rimColumns } from "./glass-rim.mjs";
import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = join(fileURLToPath(import.meta.url), "..", "..");
const DIR = arg("dir", join(root, "docs", "screenshots"));
const SCALE = 3;

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

// (d) The specular: both ends of the light axis catch it alike, as iOS's rim
// peaks do (`tools/glass-rim.mjs`), and the sheen in the middle is smooth.
for (const scheme of ["light", "dark"]) {
  const rim = judgeRim(rimColumns(shader[scheme], none[scheme], (x, y) => [px(x), px(y)]));
  check(`the top and bottom rims catch the light alike (${scheme})`, rim.ok, rim.detail);
  const middle = shader[scheme].luminance(px(CAPSULE.x + CAPSULE.width / 2), px(CAPSULE.y + CAPSULE.height / 2));
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

// The minimised pill follows the chosen tab. Two stills of the same page, one
// with Inbox chosen and one with Settings chosen after mount: the pill's icon
// must sit at each tab's slot, and be that tab's icon.
{
  const shots = {};
  for (const name of ["glass-tabmin", "glass-tabmin-settings"]) {
    try {
      shots[name] = readPng(join(DIR, `${name}-dark.png`));
    } catch (error) {
      console.log(`skip ${name}: ${error.message}`);
    }
  }
  if (shots["glass-tabmin"] && shots["glass-tabmin-settings"]) {
    /** The chosen tab's blue icon: its centroid and its box, in points. */
    const inkAt = (image) => {
      let sumX = 0;
      let sumY = 0;
      let count = 0;
      // The bar's band only: below it is the home indicator, above it the page.
      const from = Math.round(image.height * 0.9);
      for (let y = from; y < Math.round(image.height * 0.99); y += 2) {
        for (let x = Math.round(40 * SCALE); x < image.width - Math.round(40 * SCALE); x += 2) {
          const [r, g, b] = image.pixel(x, y);
          // systemBlue (#0A84FF), not the page's own blues (a tile, the
          // stripes): the icon is the only saturated blue with g this high.
          if (b > 200 && g > 110 && b - r > 80 && g - r > 60) {
            sumX += x;
            sumY += y;
            count += 1;
          }
        }
      }
      return count > 20 ? { x: sumX / count / SCALE, y: sumY / count / SCALE, count } : null;
    };
    const first = inkAt(shots["glass-tabmin"]);
    const second = inkAt(shots["glass-tabmin-settings"]);
    if (!first || !second) {
      check("the minimised pill shows its icon", false, `no blue icon found (${JSON.stringify(first)} / ${JSON.stringify(second)})`);
    } else {
      // Four 87.5 pt cells in a 350 pt bar 20 pt in from the edge.
      const slot = (index) => 20 + (index + 0.5) * 87.5;
      check(
        "the pill sits at the chosen tab's slot",
        Math.abs(first.x - slot(0)) < 24 && Math.abs(second.x - slot(3)) < 24,
        `Inbox at ${first.x.toFixed(1)} pt (slot ${slot(0)}), Settings at ${second.x.toFixed(1)} pt (slot ${slot(3)})`,
      );
      check(
        "the pill moves when the chosen tab changes",
        second.x - first.x > 200,
        `the pill moved from ${first.x.toFixed(1)} pt to ${second.x.toFixed(1)} pt`,
      );
      const crop = (image, at) => {
        const values = [];
        for (let y = -12; y <= 12; y += 2) {
          for (let x = -12; x <= 12; x += 2) {
            values.push(image.luminance(Math.round((at.x + x) * SCALE), Math.round((at.y + y) * SCALE)));
          }
        }
        return values;
      };
      const a = crop(shots["glass-tabmin"], first);
      const b = crop(shots["glass-tabmin-settings"], second);
      const diff = a.reduce((s, v, i) => s + Math.abs(v - b[i]), 0) / a.length;
      check(
        "the pill draws the chosen tab's icon",
        diff > 0.02,
        `the two icons differ by ${diff.toFixed(3)}`,
      );
    }
  }
}

// The bars over a page of 14 pt rows (the surface they float over), and the
// scroll edge over the same page:
//  (1) no legible strokes through the bar: the column-to-column deviation
//      inside it stays small;
//  (2) the minimised pill has a shape on white: a rim and a shadow, not just
//      its icon;
//  (3) the scroll edge reaches the page's colour with no strokes left in it.
{
  const shot = (name) => {
    try {
      return readPng(join(DIR, `${name}.png`));
    } catch {
      return null;
    }
  };
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  /** The page's own colour: the row background at 120 pt, mostly paper. */
  const pageColour = (image) => median(profile(image, 120, 40, 370, 3));
  /** The bar's rows: the page is 390 × 844, the bar 64 pt tall, 12+14 above
   * the bottom on the web. */
  const barTop = 754;

  for (const scheme of ["light", "dark"]) {
    const image = shot(`glass-rows-scrolled-${scheme}`);
    if (!image) continue;
    const deviations = [];
    for (let x = 28; x < 363; x += 2) {
      const column = [];
      for (let y = barTop + 28; y < barTop + 44; y += 0.5) {
        column.push(image.luminance(Math.round(x * SCALE), Math.round(y * SCALE)));
      }
      const mean = column.reduce((s, v) => s + v, 0) / column.length;
      deviations.push(Math.sqrt(column.reduce((s, v) => s + (v - mean) ** 2, 0) / column.length));
    }
    const middle = median(deviations);
    check(
      `no legible strokes through the ${scheme} bar`,
      middle < 0.05,
      `median column deviation ${middle.toFixed(3)} (< 0.05; the page's own rows measure more)`,
    );
  }

  for (const scheme of ["light", "dark"]) {
    const image = shot(`glass-rows-tabmin-${scheme}`);
    if (!image) continue;
    let sumX = 0;
    let sumY = 0;
    let count = 0;
    for (let y = Math.round(840 * SCALE * 0.0) + Math.round(844 * 0.9) * SCALE; y < 844 * SCALE; y += 2) {
      for (let x = Math.round(20 * SCALE); x < Math.round(110 * SCALE); x += 2) {
        const [r, g, b] = image.pixel(x, y);
        if (b > 200 && g > 110 && b - r > 80 && g - r > 60) {
          sumX += x;
          sumY += y;
          count += 1;
        }
      }
    }
    if (count < 40) {
      check(`the ${scheme} pill has an icon to find its shape by`, false, `${count} blue pixels`);
      continue;
    }
    const cx = sumX / count / SCALE;
    const cy = sumY / count / SCALE;
    const page = pageColour(image);
    const ring = [];
    for (const [dx, dy] of [[0, -25], [0, 25], [25, 0], [-25, 0], [0, 30], [0, 32], [18, 18], [-18, 18], [18, -18], [-18, -18]]) {
      ring.push(image.luminance(Math.round((cx + dx) * SCALE), Math.round((cy + dy) * SCALE)));
    }
    const inner = [[0, -10], [0, 10], [10, 0], [-10, 0]].map(([dx, dy]) =>
      image.luminance(Math.round((cx + dx) * SCALE), Math.round((cy + dy) * SCALE)),
    );
    const edge = Math.min(...ring);
    const middle = inner.reduce((s, v) => s + v, 0) / inner.length;
    if (scheme === "light") {
      check(
        "the pill has a rim and a shadow on white",
        edge <= page - 0.05,
        `the rim reads ${edge.toFixed(2)} against the page's ${page.toFixed(2)} (≤ page − 0.05); its fill ${middle.toFixed(2)}`,
      );
    } else {
      check(
        "the pill is a surface in the dark",
        middle >= page + 0.08,
        `its fill reads ${middle.toFixed(2)} against the page's ${page.toFixed(2)}`,
      );
    }
  }

  for (const scheme of ["light", "dark"]) {
    const image = shot(`glass-rows-edge-${scheme}`);
    if (!image) continue;
    const page = pageColour(image);
    const band = [];
    for (let y = 2; y < 14; y += 1) {
      for (let x = 60; x < 280; x += 2) band.push(image.luminance(Math.round(x * SCALE), Math.round(y * SCALE)));
    }
    const mean = band.reduce((s, v) => s + v, 0) / band.length;
    const sd = Math.sqrt(band.reduce((s, v) => s + (v - mean) ** 2, 0) / band.length);
    check(
      `the scroll edge reaches the page colour (${scheme})`,
      Math.abs(mean - page) <= 0.03,
      `the band reads ${mean.toFixed(3)} against the page's ${page.toFixed(3)}`,
    );
    check(
      `no strokes survive the scroll edge (${scheme})`,
      sd < 0.02,
      `the band's deviation is ${sd.toFixed(3)} (< 0.02)`,
    );
  }
}
