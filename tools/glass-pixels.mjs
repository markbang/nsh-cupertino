#!/usr/bin/env node
// Pixel checks of the Liquid Glass material, on the calibration screenshots
// `tools/glass-shots.mjs` writes: a capsule over 8 pt stripes, drawn with no
// glass at all, with the material a platform without a GPU draws, and with the
// shader.
//
//   node tools/glass-pixels.mjs [--dir docs/screenshots]
//
// It asserts two things a plain blur cannot do: the rim is brighter than the
// middle of the sheet (the specular highlight), and the stripes under the rim
// move (the lens), while the blur-only material leaves them where they are.
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

/** The first place a row crosses its own mean, in pixels (the first stripe edge). */
function transitions(image, y, from, to) {
  let sum = 0;
  let count = 0;
  for (let x = from; x < to; x++) {
    sum += image.luminance(x, y);
    count += 1;
  }
  const mean = sum / count;
  const found = [];
  let last = image.luminance(from, y) > mean;
  for (let x = from + 1; x < to; x++) {
    const light = image.luminance(x, y) > mean;
    if (light !== last) found.push(x);
    last = light;
  }
  return found;
}

const px = (points) => Math.round(points * SCALE);
const failures = [];
const check = (label, ok, detail) => {
  console.log(`${ok ? "ok  " : "FAIL"} ${label}: ${detail}`);
  if (!ok) failures.push(label);
};

const none = readPng(join(DIR, "glass-calibration-none-light.png"));
const material = readPng(join(DIR, "glass-calibration-material-light.png"));
const shader = readPng(join(DIR, "glass-calibration-shader-light.png"));

// The middle column of the capsule: its top rim against its flat middle.
const column = px(CAPSULE.x + CAPSULE.width / 2);
const brightest = (image, from, to) => {
  let best = 0;
  for (let y = from; y < to; y++) best = Math.max(best, image.luminance(column, y));
  return best;
};
const flat = (image) => {
  const values = [];
  for (let y = px(CAPSULE.y + 20); y < px(CAPSULE.y + 44); y++) values.push(image.luminance(column, y));
  values.sort((a, b) => a - b);
  return values[Math.floor(values.length / 2)];
};
const rim = (image) => brightest(image, px(CAPSULE.y + 1), px(CAPSULE.y + 6));
const rimGain = rim(shader) - flat(shader);
const materialGain = rim(material) - flat(material);
check(
  "the rim is brighter than the sheet",
  rimGain >= 0.06,
  `shader +${rimGain.toFixed(3)} (rim ${rim(shader).toFixed(3)}, middle ${flat(shader).toFixed(3)})`,
);
check(
  "the blur-only material has no specular rim",
  rimGain - materialGain >= 0.04,
  `material +${materialGain.toFixed(3)} against the shader's +${rimGain.toFixed(3)}`,
);

// The lens: a hard edge 10 pt inside the left rim is where refraction shows
// and a blur does not move it.
const row = px(CAPSULE.y + CAPSULE.height / 2);
/** The edge under the left rim: where it crosses the row's own middle, and
 * how wide its transition is (25 % to 75 % of the two plateaus, in points). */
const edgeAt = (image) => {
  const from = px(CAPSULE.x + 2);
  const to = px(CAPSULE.x + 44);
  let low = 1;
  let high = 0;
  for (let x = from; x < to; x++) {
    const value = image.luminance(x, row);
    low = Math.min(low, value);
    high = Math.max(high, value);
  }
  if (high - low < 0.05) return null;
  const at = (level) => {
    let previous = image.luminance(from, row);
    for (let x = from + 1; x < to; x++) {
      const now = image.luminance(x, row);
      if ((previous < level) !== (now < level)) {
        return x - 1 + Math.abs(previous - level) / Math.abs(previous - now);
      }
      previous = now;
    }
    return null;
  };
  const middle = at(low + (high - low) / 2);
  const quarter = at(low + (high - low) * 0.75);
  const three = at(low + (high - low) * 0.25);
  if (middle === null || quarter === null || three === null) return null;
  return { middle, width: Math.abs(quarter - three) / SCALE };
};
const page = edgeAt(none);
const bent = edgeAt(shader);
const moved = (a, b) => (a === null || b === null ? null : Math.abs(a.middle - b.middle) / SCALE);
const bend = moved(page, bent);
check(
  "the rim refracts the backdrop",
  bend !== null && bend >= 1.5,
  bend === null
    ? `no edge under the rim (page ${JSON.stringify(page)}, shader ${JSON.stringify(bent)})`
    : `the edge moves ${bend.toFixed(2)} pt (${page.middle.toFixed(1)}px to ${bent.middle.toFixed(1)}px)`,
);
// The light comes from the upper left, so the top rim catches it and the
// bottom one does not.
const bottom = (image) => brightest(image, px(CAPSULE.y + CAPSULE.height - 5), px(CAPSULE.y + CAPSULE.height - 1));
const tilt = (image) => rim(image) - bottom(image);
check(
  "the specular follows the light",
  tilt(shader) >= 0.03,
  `the top rim is ${tilt(shader).toFixed(3)} brighter than the bottom (top ${rim(shader).toFixed(3)}, bottom ${bottom(shader).toFixed(3)})`,
);
check(
  "a blur has no direction",
  Math.abs(tilt(material)) < 0.015,
  `the material's two rims differ by ${tilt(material).toFixed(3)}`,
);

if (failures.length) {
  console.error(`${failures.length} check(s) failed`);
  process.exit(1);
}
console.log("the material refracts and catches the light");
