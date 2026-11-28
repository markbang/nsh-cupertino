#!/usr/bin/env node
// Crops of the minimise's lens tip and of capsule centre lines, for review.
//
//   node tools/tab-bar-tip-crops.mjs --dir docs/screenshots --out docs/screenshots/compare
//
// `tab-bar-tip-crops.png`: 24 × 24 pt around the cap tip of recorded frames 3
// and 4 (x 301-325, y 810-834 pt) and frame 11 (x 163-187, y 808-832 pt), light
// and dark, upscaled ×6 nearest neighbour, from this run's `motion` recordings:
// each row is one appearance and frame, the two-scale render, then the one-disc
// render. `glass-crease-crops.png`: 24 × 24 pt of three capsule centre lines,
// ×6, from this run's shots: the calibration capsule (x 218-242, y 140-164 pt),
// the top bar (x 353-377, y 10-34) and the tab bar at rest (x 18-42,
// y 810-834), light and dark. A before/after comparison puts the same sheet of
// two runs side by side; the repository keeps no image.
//
// It writes PNGs only; it judges nothing.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const DIR = arg("dir", "docs/screenshots");
const OUT = arg("out", join(DIR, "compare"));
const SCALE = 3;
const CROP = 24 * SCALE;
const ZOOM = 6;
const TILE = CROP * ZOOM;
const STRIP = 30;
const GAP = 12;
const TOP = 770 * SCALE;
const TIPS = [
  [3, 301, 810],
  [4, 301, 810],
  [11, 163, 808],
];

// A 5 × 7 font of the characters the labels use.
const GLYPHS = {
  a: [".....", ".....", ".###.", "....#", ".####", "#...#", ".####"],
  b: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "####."],
  c: [".....", ".....", ".####", "#....", "#....", "#....", ".####"],
  d: ["....#", "....#", ".####", "#...#", "#...#", "#...#", ".####"],
  e: [".....", ".....", ".###.", "#...#", "#####", "#....", ".###."],
  f: ["..##.", ".#...", "####.", ".#...", ".#...", ".#...", ".#..."],
  g: [".....", ".####", "#...#", "#...#", ".####", "....#", ".###."],
  h: ["#....", "#....", "####.", "#...#", "#...#", "#...#", "#...#"],
  i: ["..#..", ".....", ".##..", "..#..", "..#..", "..#..", ".###."],
  k: ["#....", "#....", "#..#.", "#.#..", "##...", "#.#..", "#..#."],
  l: [".##..", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  m: [".....", ".....", "##.#.", "#.#.#", "#.#.#", "#.#.#", "#.#.#"],
  n: [".....", ".....", "####.", "#...#", "#...#", "#...#", "#...#"],
  o: [".....", ".....", ".###.", "#...#", "#...#", "#...#", ".###."],
  p: [".....", "####.", "#...#", "#...#", "####.", "#....", "#...."],
  r: [".....", ".....", "#.##.", "##..#", "#....", "#....", "#...."],
  s: [".....", ".....", ".####", "#....", ".###.", "....#", "####."],
  t: [".#...", ".#...", "####.", ".#...", ".#...", ".#..#", "..##."],
  u: [".....", ".....", "#...#", "#...#", "#...#", "#..##", ".##.#"],
  w: [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
};

function canvas(width, height, fill = [24, 24, 24]) {
  const data = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) data.set(fill, i * 3);
  return { width, height, data, set: (x, y, rgb) => data.set(rgb, (y * width + x) * 3) };
}

function text(target, x, y, label, size = 3) {
  let at = x;
  for (const ch of label.toLowerCase()) {
    const glyph = GLYPHS[ch];
    if (glyph) {
      glyph.forEach((row, gy) => {
        for (let gx = 0; gx < 5; gx++) {
          if (row[gx] !== "#") continue;
          for (let dy = 0; dy < size; dy++) for (let dx = 0; dx < size; dx++) target.set(at + gx * size + dx, y + gy * size + dy, [240, 240, 240]);
        }
      });
    }
    at += 6 * size;
  }
}

function crc32(bytes) {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function writePng(file, image) {
  const chunk = (type, data) => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(data.length, 0);
    head.write(type, 4, "ascii");
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
    return Buffer.concat([head, data, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(image.width, 0);
  ihdr.writeUInt32BE(image.height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const stride = image.width * 3;
  const raw = Buffer.alloc((stride + 1) * image.height);
  for (let y = 0; y < image.height; y++) image.data.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  writeFileSync(file, Buffer.concat([signature, chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
}

/** `CROP` × `CROP` pixels of `file` from (x, y) in its own pixels, as a pixel reader. */
function crop(file, x, y) {
  if (!existsSync(file)) throw new Error(`${file}: missing (tools/tab-bar-tip-crops.mjs)`);
  const image = readPng(file);
  if (x + CROP > image.width || y + CROP > image.height) throw new Error(`${file}: ${image.width} × ${image.height} does not hold the crop at (${x}, ${y})`);
  return (cx, cy) => image.pixel(x + cx, y + cy).slice(0, 3);
}

const columns = ["two-scale", "one-disc"];
const rows = [];
for (const theme of ["light", "dark"]) {
  for (const [k, xPt, yPt] of TIPS) {
    const name = (body) => `tab-bar-exact-${body}${theme}-${String(k).padStart(3, "0")}.png`;
    rows.push({
      label: `${theme} frame ${k}`,
      tiles: [
        crop(join(DIR, "motion", name("")), xPt * SCALE, yPt * SCALE - TOP),
        crop(join(DIR, "motion", name("single-")), xPt * SCALE, yPt * SCALE - TOP),
      ],
    });
  }
}

const crease = [];
for (const [title, file, xPt, yPt] of [
  ["calibration capsule", "glass-calibration-shader", 218, 140],
  ["top bar", "glass-top", 353, 10],
  ["rest tab bar", "tab-bar-fixture", 18, 810],
]) {
  for (const theme of ["light", "dark"]) {
    const name = `${file}-${theme}${file === "tab-bar-fixture" ? "-a" : ""}.png`;
    crease.push({
      label: `${title} ${theme}`,
      tiles: [crop(join(DIR, name), xPt * SCALE, yPt * SCALE)],
    });
  }
}

function sheet(file, columns, rows) {
  const label = Math.max(...rows.map((row) => row.label.length), ...columns.map((c) => c.length)) * 18;
  const width = Math.max(columns.length * (TILE + GAP), label + GAP) + GAP;
  const height = rows.length * (TILE + 2 * STRIP + GAP) + GAP;
  const out = canvas(width, height);
  rows.forEach((row, r) => {
    const y0 = GAP + r * (TILE + 2 * STRIP + GAP);
    text(out, GAP, y0 + 4, row.label);
    row.tiles.forEach((pixel, c) => {
      const x0 = GAP + c * (TILE + GAP);
      text(out, x0, y0 + STRIP + 4, columns[c]);
      for (let y = 0; y < TILE; y++) {
        for (let x = 0; x < TILE; x++) out.set(x0 + x, y0 + 2 * STRIP + y, pixel(Math.floor(x / ZOOM), Math.floor(y / ZOOM)));
      }
    });
  });
  mkdirSync(OUT, { recursive: true });
  writePng(join(OUT, file), out);
  console.log(`wrote ${join(OUT, file)} (${width} × ${height})`);
}

sheet("tab-bar-tip-crops.png", columns, rows);
sheet("glass-crease-crops.png", ["centre line"], crease);
