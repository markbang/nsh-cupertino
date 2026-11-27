#!/usr/bin/env node
// Comparison images of the tab bar's covered region, for review.
//
//   node tools/tab-bar-compare.mjs --dir docs/screenshots --out docs/screenshots/compare [--before <dir> --before-label <text>]
//
// `tab-bar-cover-frames.png`: the recorded frames that failed in Stage 2
// (light 2 and 11, dark 1, 2 and 3), in order of time. `tab-bar-cover-pinned.png`:
// the pinned stills at progress 0.1, 0.25 and 0.5 in both appearances. Each item
// is cropped to the bar (x 15-387, y 782-866 pt, 3x) and labelled with its
// appearance, frame and time (or pinned progress), in rows: the two-scale
// render, the one-disc render of the same frame, and their |difference| of luma
// ×4 in red over the covered region (inside the layers' box, outside the
// silhouette; elsewhere the two-scale render dimmed). With `--before`, a
// directory laid out as `--dir` from an earlier run, its two-scale render
// comes first.
//
// It writes PNGs only; it judges nothing.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

import { readPng } from "./png.mjs";
import { luma, sdGlass, sdLayers } from "./tab-bar-geometry.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const DIR = arg("dir", "docs/screenshots");
const OUT = arg("out", join(DIR, "compare"));
const BEFORE = arg("before", null);
const BEFORE_LABEL = arg("before-label", "before");
const SCALE = 3;
const CROP = { x0: 15 * SCALE, x1: 387 * SCALE, y0: 782 * SCALE, y1: 866 * SCALE };
const W = CROP.x1 - CROP.x0;
const H = CROP.y1 - CROP.y0;
const STRIP = 30;

const FAILED = [
  ["light", 2],
  ["light", 11],
  ["dark", 1],
  ["dark", 2],
  ["dark", 3],
];
const PINNED = ["010", "025", "050"];

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
  v: [".....", ".....", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  w: [".....", ".....", "#...#", "#...#", "#.#.#", "#.#.#", ".#.#."],
  x: [".....", ".....", "#...#", ".#.#.", "..#..", ".#.#.", "#...#"],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", "..#..", ".#..."],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", ".#...", ".#...", ".#..."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
};

/** An RGB canvas. */
function canvas(width, height, fill = [24, 24, 24]) {
  const data = Buffer.alloc(width * height * 3);
  for (let i = 0; i < width * height; i++) data.set(fill, i * 3);
  return { width, height, data, set: (x, y, rgb) => data.set(rgb.map((v) => Math.max(0, Math.min(255, Math.round(v)))), (y * width + x) * 3) };
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

/** One item: labelled rows of crops. `top` is the page row of each source's first row. */
function item(title, sources, progress) {
  const rows = [...sources.map(([label, image, top]) => ({ label, image, top })), { label: "|two-scale - one-disc| x4 over the covered region", diff: true }];
  const height = STRIP + rows.length * (STRIP + H) + 12;
  const out = canvas(W, height);
  text(out, 6, 6, title);
  const two = rows.find((row) => row.label.startsWith("two-scale"));
  const one = rows.find((row) => row.label.startsWith("one-disc"));
  rows.forEach((row, r) => {
    const y0 = STRIP + r * (STRIP + H);
    text(out, 6, y0 + 6, row.label);
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const px = CROP.x0 + x;
        const py = CROP.y0 + y;
        if (!row.diff) {
          out.set(x, y0 + STRIP + y, row.image.pixel(px, py - row.top).slice(0, 3));
          continue;
        }
        const a = luma(two.image, px, py - two.top);
        const xp = (px + 0.5) / SCALE;
        const yp = (py + 0.5) / SCALE;
        if (sdLayers(xp, yp) <= 0 && sdGlass(xp, yp, progress) >= 0.5) {
          const d = Math.abs(a - luma(one.image, px, py - one.top));
          out.set(x, y0 + STRIP + y, [50 + 4 * d, 0, 0]);
        } else {
          out.set(x, y0 + STRIP + y, [a / 3, a / 3, a / 3]);
        }
      }
    }
  });
  return out;
}

function stack(items) {
  const width = Math.max(...items.map((i) => i.width));
  const out = canvas(width, items.reduce((s, i) => s + i.height, 0));
  let y = 0;
  for (const i of items) {
    i.data.copy(out.data, y * width * 3);
    y += i.height;
  }
  return out;
}

const missing = [];
const need = (file) => {
  if (!existsSync(file)) missing.push(file);
  return file;
};
const frameFile = (dir, name, k) => join(dir, "motion", `${name}-${String(k).padStart(3, "0")}.png`);
const meta = (dir, name) => JSON.parse(readFileSync(need(join(dir, "motion", `${name}.json`)), "utf8"));

const failed = [];
for (const [theme, k] of FAILED) {
  const all = meta(DIR, `tab-bar-exact-${theme}`).frames;
  const frame = all.find((fr) => fr.k === k);
  // The shader draws a frame behind the page: the mask is the previous frame's silhouette.
  const drawn = all.find((fr) => fr.k === k - 1).progress.fromShadow;
  const sources = [];
  if (BEFORE) sources.push([`${BEFORE_LABEL} two-scale`, readPng(need(frameFile(BEFORE, `tab-bar-exact-${theme}`, k))), 770 * SCALE]);
  sources.push(["two-scale", readPng(need(frameFile(DIR, `tab-bar-exact-${theme}`, k))), 770 * SCALE]);
  sources.push(["one-disc, the same frame", readPng(need(frameFile(DIR, `tab-bar-exact-single-${theme}`, k))), 770 * SCALE]);
  failed.push({ t: frame.t, image: item(`${theme} frame ${k}, t ${frame.t.toFixed(1)} ms, progress ${frame.progress.fromShadow.toFixed(4)}`, sources, drawn) });
}
failed.sort((a, b) => a.t - b.t);

const pinned = [];
for (const theme of ["light", "dark"]) {
  for (const tag of PINNED) {
    const still = (dir, body) => readPng(need(join(dir, `tab-bar-fixture-morph-${body}${theme}-${tag}.png`)));
    const sources = [];
    if (BEFORE) sources.push([`${BEFORE_LABEL} two-scale`, still(BEFORE, ""), 0]);
    sources.push(["two-scale", still(DIR, ""), 0]);
    sources.push(["one-disc, the same progress", still(DIR, "single-"), 0]);
    const progress = Number(tag) / 100;
    pinned.push(item(`${theme} pinned progress ${progress.toFixed(2)}`, sources, progress));
  }
}

mkdirSync(OUT, { recursive: true });
writePng(join(OUT, "tab-bar-cover-frames.png"), stack(failed.map((i) => i.image)));
writePng(join(OUT, "tab-bar-cover-pinned.png"), stack(pinned));
console.log(`wrote ${join(OUT, "tab-bar-cover-frames.png")} and ${join(OUT, "tab-bar-cover-pinned.png")}`);
