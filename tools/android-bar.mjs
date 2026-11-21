#!/usr/bin/env node
// Whether the bar has the page's striped band behind it: the driver scrolls the
// Glass page until this holds, then captures the frame
// `tools/android-glass-check.mjs` asserts on. A bar with no content behind it
// shows the page's own fill (white in light, black in dark), so the probe asks
// the bar's row for the stripes' blue and for more than one colour.
//
//   node tools/android-bar.mjs <png>
//
// Exits 1 while the band is not behind the bar: the bar's row is flat.
import { pathToFileURL } from "node:url";

import { readPng } from "./png.mjs";

/**
 * The bar's own rows — below the status bar's icons, above its lower edge (44 pt
 * is more than 0.04 of a phone frame's height) — and how much of the row is the
 * stripes' blue and how many colours it holds.
 */
export function barRow(image) {
  const y = Math.round(image.height * 0.04);
  const from = Math.round(image.width * 0.1);
  const until = Math.round(image.width * 0.9);
  const seen = new Set();
  let blue = 0;
  let count = 0;
  for (let x = from; x < until; x += 2) {
    const [r, g, b] = image.pixel(x, y);
    seen.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
    if (b - r > 8) blue += 1;
    count += 1;
  }
  return { row: y, colours: seen.size, blue: blue / count };
}

/** The probe's line, and whether the row is striped rather than flat. */
export function describeBar(image) {
  const { row, colours, blue } = barRow(image);
  const measured = `row ${row}: ${colours} colours, ${(blue * 100).toFixed(0)}% of it the stripes' blue`;
  return { striped: blue >= 0.2 && colours >= 6, measured };
}

/** The columns across the bar: a step at all of them is the rim, a text or card edge is not. */
const COLUMNS = [0.2, 0.35, 0.5, 0.65, 0.8];
/** The window the bar's top is searched in, as shares of the height: rows 2120–2150 of a 2400 px frame. */
const RIM_WINDOW = [0.8833, 0.8958];

const stepAt = (image, x, y) => Math.abs(image.luminance(x, y - 3) - image.luminance(x, y + 3));

/** The weakest step across the bar's columns at `row`. */
export function rimStep(image, row) {
  return Math.min(...COLUMNS.map((f) => stepAt(image, Math.round(image.width * f), row)));
}

/**
 * The row of the bar's top rim, found in the expanded captures of every scheme
 * at once. Each row scores the sum, over the captures, of its weakest step
 * across the bar's columns. The dark capture carries the rim strongly; the light
 * one is white on white and weak, so it only breaks ties that a dark capture's
 * text edges would otherwise win. On the 1080 × 2400 emulator captures this
 * lands on rows 2135–2137 in all eight runs checked.
 */
export function barRimRow(images) {
  const from = Math.round(images[0].height * RIM_WINDOW[0]);
  const until = Math.round(images[0].height * RIM_WINDOW[1]);
  let best = { row: 0, score: -1, steps: [] };
  for (let row = from; row <= until; row += 1) {
    const steps = images.map((image) => rimStep(image, row));
    const score = steps.reduce((sum, step) => sum + step, 0);
    if (score > best.score) best = { row, score, steps };
  }
  return best;
}

/**
 * The rim's extent along `row`, over the bar's own run (8 % to 92 % of the
 * width, about 345 pt): the share of samples that step, in points, and where the
 * steps sit (centre, 0.5 when centred). A contiguous run breaks on texture; the
 * share does not.
 */
export function barRimSpan(image, row) {
  const from = Math.round(image.width * 0.08);
  const until = Math.round(image.width * 0.92);
  let samples = 0;
  let covered = 0;
  let position = 0;
  for (let x = from; x <= until; x += 4) {
    samples += 1;
    if (stepAt(image, x, row) > 0.02) {
      covered += 1;
      position += x;
    }
  }
  const scale = image.width / 411;
  return {
    width: (covered / samples) * ((until - from) / scale),
    centre: covered ? position / covered / image.width : 0,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: tools/android-bar.mjs <png>");
    process.exit(2);
  }
  const { striped, measured } = describeBar(readPng(file));
  if (!striped) {
    console.error(`the bar is flat (${measured}): no striped band behind it`);
    process.exit(1);
  }
  console.log(`the bar has the band behind it (${measured})`);
}
