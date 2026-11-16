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
