#!/usr/bin/env node
// Whether the bar has the page's striped band behind it: the driver scrolls the
// Glass page until this holds, then captures the frame
// `tools/android-glass-check.mjs` asserts on. A bar with no content behind it
// shows the page's own fill (white in light, black in dark), so the probe asks
// the bar's row for the stripes' blue and for more than one colour.
//
//   node tools/android-bar.mjs <png>
//   node tools/android-bar.mjs --expanded|--minimised <png>   (exit 0 when the state holds)
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

/**
 * The bar's top rim: the row where the edge is a step at all five columns across
 * the bar's width, strongest, within 0.887–0.895 of the height (rows 2135–2142 of
 * the 2400 px emulator frames in every expanded capture). A card's bottom edge
 * is a step across the same columns, so the band keeps it out. `edge` is the
 * weakest of the five steps at that row.
 */
export function barRim(image) {
  const columns = [0.2, 0.35, 0.5, 0.65, 0.8].map((f) => Math.round(image.width * f));
  let best = { row: 0, edge: 0 };
  const from = Math.round(image.height * 0.887);
  const until = Math.round(image.height * 0.895);
  for (let y = from; y < until; y += 1) {
    let weakest = Infinity;
    for (const x of columns) {
      weakest = Math.min(weakest, Math.abs(image.luminance(x, y - 3) - image.luminance(x, y + 3)));
    }
    if (weakest > best.edge) best = { row: y, edge: weakest };
  }
  let first = 0;
  let last = 0;
  const mid = Math.round(image.width * 0.5);
  const row = best.row;
  const step = (x) => Math.abs(image.luminance(x, row - 3) - image.luminance(x, row + 3));
  for (let x = mid; x >= 0 && step(x) > 0.02; x -= 1) first = x;
  for (let x = mid; x < image.width && step(x) > 0.02; x += 1) last = x;
  return { ...best, first, last, centre: (first + last) / 2 / image.width, width: (last - first) / (image.width / 411) };
}

/** Expanded while the rim is a step across the bar's width; minimised once it is gone. */
export function barIsExpanded(image) {
  return barRim(image).edge >= 0.03;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const state = args[0] === "--expanded" || args[0] === "--minimised";
  const file = state ? args[1] : args[0];
  if (!file) {
    console.error("usage: tools/android-bar.mjs <png> | --expanded <png> | --minimised <png>");
    process.exit(2);
  }
  const image = readPng(file);
  if (state) {
    const expanded = barIsExpanded(image);
    console.log(expanded ? "expanded" : "minimised");
    process.exit(expanded === (args[0] === "--expanded") ? 0 : 1);
  }
  const { striped, measured } = describeBar(image);
  if (!striped) {
    console.error(`the bar is flat (${measured}): no striped band behind it`);
    process.exit(1);
  }
  console.log(`the bar has the band behind it (${measured})`);
}
