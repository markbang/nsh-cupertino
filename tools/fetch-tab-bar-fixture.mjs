#!/usr/bin/env node
// The iOS 27 tab-bar fixture: Mobile's simulator frames of the bar over a page
// of text (`tab-bar-{theme}-{a,b}.png`) and the same frames without the bar
// (`tab-bar-ref-…`), 1206 × 2622 at 3 px/pt, lossless sRGB. They are not in the
// repository: this downloads them, checks each against its sha256 and fails on
// any mismatch. A file already there with the right hash is kept.
//
//   node tools/fetch-tab-bar-fixture.mjs [--out target/tab-bar-fixture]
//
// `tools/glass-shots.mjs` serves the references under the web build (the
// fixture page's backdrop) and `tools/tab-bar-pixels.mjs` reads all eight.
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const BASE = "https://public.cohub.live/p/c430e3de-0791-4b2c-a3f4-ae5a7a4701f2/tab-bar-measured/";

export const FIXTURE = {
  "tab-bar-dark-a.png": "3ee7e79b398dd82f00f10b1e67e22126d9a3d9a44a6004f77479ea4533a492b7",
  "tab-bar-dark-b.png": "745ba55d100773c84ee895ffa285b4b61d614b281ac7832ecbf2163d91be49bd",
  "tab-bar-light-a.png": "3e402f3a1f916794f6884bfcb2ec92546307fc981b3a0109631eafc58046263a",
  "tab-bar-light-b.png": "289a59f2fba929de470fce914be631884ba1246cd8cd720f5caf47a61801bcdf",
  "tab-bar-ref-dark-a.png": "915661b29e62208b6931e621d539cd56aa5c5161495a19049463b7c210e36f21",
  "tab-bar-ref-dark-b.png": "200cc5a3f92621387d5ca12c11a295dc2e62fb83f393f640cbe3e583a762e74f",
  "tab-bar-ref-light-a.png": "78875f49047f682f2a24ba7685f10a0e3d09a5c9f57e6ec19ee7cd256064f1c3",
  "tab-bar-ref-light-b.png": "1a8a10ed372f48a9624390d4e4acd4eb0cd12bd4b3b87f4e81713a69e6965224",
};

export const DEFAULT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "target", "tab-bar-fixture");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

/** Puts the eight frames in `dir`, each checked against its hash; returns `dir`. */
export async function fetchTabBarFixture(dir = DEFAULT_DIR) {
  mkdirSync(dir, { recursive: true });
  for (const [name, want] of Object.entries(FIXTURE)) {
    const file = join(dir, name);
    if (existsSync(file) && sha256(readFileSync(file)) === want) continue;
    const url = `${BASE}${name}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status} ${url}: the fixture frame is not published`);
    const bytes = Buffer.from(await response.arrayBuffer());
    const got = sha256(bytes);
    if (got !== want) throw new Error(`${url}: sha256 ${got}, expected ${want}; the published frame changed`);
    writeFileSync(file, bytes);
  }
  return dir;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const index = args.indexOf("--out");
  const dir = index >= 0 ? resolve(args[index + 1]) : DEFAULT_DIR;
  fetchTabBarFixture(dir).then(
    () => console.log(`ok: ${Object.keys(FIXTURE).length} frames in ${dir}`),
    (error) => {
      console.error(error.message ?? error);
      process.exit(1);
    },
  );
}
