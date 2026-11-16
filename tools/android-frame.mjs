#!/usr/bin/env node
// Whether a capture holds anything: the driver takes a frame again when it does
// not, because a window shows white (or black) until its first surface draws —
// a sheet's dialog takes seconds on a software GPU.
//
//   node tools/android-frame.mjs <png> [--min-shades N]
//
// Exit 1 when the frame is blank: black, one colour, or fewer than `--min-shades`
// distinct colours (the status bar alone is a handful). `--min-shades 0`, the
// default, is the blank rule `tools/android-glass-check.mjs` fails a run on.
import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const file = args[0];
const at = args.indexOf("--min-shades");
const least = at >= 0 ? Number(args[at + 1]) : 0;
if (!file) {
  console.error("usage: tools/android-frame.mjs <png> [--min-shades N]");
  process.exit(2);
}

const image = readPng(file);
let sum = 0;
let count = 0;
for (let y = 0; y < image.height; y += 3) {
  for (let x = 0; x < image.width; x += 3) {
    sum += image.luminance(x, y);
    count += 1;
  }
}
let shades = new Set();
for (let y = 0; y < image.height; y += 2) {
  for (let x = 0; x < image.width; x += 2) {
    const [r, g, b] = image.pixel(x, y);
    shades.add(((r >> 3) << 10) | ((g >> 3) << 5) | (b >> 3));
  }
}
const brightness = sum / count;
if (brightness <= 0.02 || shades.size <= 3 || shades.size < least) {
  console.error(`${file}: blank (mean ${brightness.toFixed(3)}, ${shades.size} shades)`);
  process.exit(1);
}
console.log(`${file}: ${shades.size} shades, mean ${brightness.toFixed(2)}`);
