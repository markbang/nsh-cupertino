#!/usr/bin/env node
// Screenshots of the Liquid Glass pages, from a real web build: the material
// reads the backdrop through WebGL 2, which `nsh test --target web` cannot
// show — the CLI regenerates its runtime on every run, so the shader fix
// `tools/patch-runtime.mjs` applies never survives into a test's page.
//
//   node tools/glass-shots.mjs [--out docs/screenshots] [--chrome <path>]
//     [--from <dir>] [--scheme light|dark] [--pages glass,contextmenu] [--shard 1/2]
//
// `--from` takes a directory `nsh package App.tsx --target web -o <dir>` wrote
// (CI builds the demo once and passes it on) instead of packaging it here; the
// copy is patched, the directory is not. `--scheme`, `--pages` (a shot's page)
// and `--shard i/n` (every n-th of the shots left) pick the shots to take.
//
// It packages `examples/demo` for the web, patches the runtime, serves the
// build and drives headless Chrome: `glass-{light,dark}`, the increased
// contrast pair, and the calibration page three ways (no glass, the material
// without a GPU, the shader) that `tools/glass-pixels.mjs` asserts on.
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  CLOCK,
  IPHONE,
  PREFIX,
  PROGRESS,
  SCALE,
  STEP_MS,
  installFixtures,
  launch,
  openRecording,
  packageApp,
  serve,
} from "./glass-browser.mjs";
import { readPng } from "./png.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = arg("out", join(root, "docs", "screenshots"));
const CHROME = arg("chrome", process.env.CHROME ?? "google-chrome");
const ONLY = arg("only", null)?.split(",");
const FROM = arg("from", null);
const SCHEME = arg("scheme", null);
const PAGES = arg("pages", null)?.split(",").filter(Boolean);
const SHARD = arg("shard", "1/1").split("/").map(Number);
if (!(SHARD[0] >= 1 && SHARD[0] <= SHARD[1])) throw new Error(`--shard must be i/n with 1 <= i <= n, not ${arg("shard")}`);
const WIDTH = 390;
const HEIGHT = 844;
/** The minimise progress of the morph stills. */
const MORPHS = [0, 0.1, 0.25, 0.5, 0.75, 1];

/** The shots: a page, an appearance, a contrast setting and a glass mode. */
const SHOTS = [
  { name: "glass-top-light", page: "glass", scheme: "light" },
  { name: "glass-top-dark", page: "glass", scheme: "dark" },
  { name: "glass-mid-light", page: "glass", scheme: "light", scroll: 140, up: 30 },
  { name: "glass-mid-dark", page: "glass", scheme: "dark", scroll: 140, up: 30 },
  { name: "glass-scrolled-light", page: "glass", scheme: "light", scroll: 640, up: 70 },
  { name: "glass-scrolled-dark", page: "glass", scheme: "dark", scroll: 640, up: 70 },
  { name: "glass-tabmin-light", page: "glass", scheme: "light", scroll: 900, steps: 9 },
  { name: "glass-tabmin-dark", page: "glass", scheme: "dark", scroll: 900, steps: 9 },
  // The chosen tab changes after mount, then the page scrolls: the minimised
  // pill has to be Settings' at Settings' slot, not the Inbox one it was built
  // with (0.4.1).
  { name: "glass-tabmin-settings-light", page: "glass", scheme: "light", tap: { at: [326, 786], tab: "Settings" }, scroll: 900, steps: 9 },
  { name: "glass-tabmin-settings-dark", page: "glass", scheme: "dark", tap: { at: [326, 786], tab: "Settings" }, scroll: 900, steps: 9 },
  // A white page of 14 pt rows: the surface the bars actually float over.
  { name: "glass-rows-top-light", page: "glass-rows", scheme: "light" },
  { name: "glass-rows-top-dark", page: "glass-rows", scheme: "dark" },
  { name: "glass-rows-edge-light", page: "glass-rows", scheme: "light", scroll: 60 },
  { name: "glass-rows-edge-dark", page: "glass-rows", scheme: "dark", scroll: 60 },
  { name: "glass-rows-scrolled-light", page: "glass-rows", scheme: "light", scroll: 420, up: 60 },
  { name: "glass-rows-scrolled-dark", page: "glass-rows", scheme: "dark", scroll: 420, up: 60 },
  { name: "glass-rows-tabmin-light", page: "glass-rows", scheme: "light", scroll: 900, steps: 9 },
  { name: "glass-rows-tabmin-dark", page: "glass-rows", scheme: "dark", scroll: 900, steps: 9 },
  { name: "glass-material-light", page: "glass", scheme: "light", scroll: 640, up: 70, material: "material" },
  { name: "glass-material-dark", page: "glass", scheme: "dark", scroll: 640, up: 70, material: "material" },
  { name: "glass-sheet-light", page: "glass", scheme: "light", overlay: "glass" },
  { name: "glass-sheet-dark", page: "glass", scheme: "dark", overlay: "glass" },
  // The context menu, opened by the secondary button on the first card (the
  // trigger); `context` is its point in CSS pixels.
  { name: "contextmenu-open-light", page: "contextmenu", scheme: "light", context: [195, 232] },
  { name: "contextmenu-open-dark", page: "contextmenu", scheme: "dark", context: [195, 232] },
  // The glass menu held at the iOS clip's timestamps (`tools/compare-glass-menu.py`
  // lays them beside the clip): ms after the press, then ms into the close.
  // Taken only when `--only` names them or with `--menu-frames`.
  ...[0, 107, 140, 174, 207, 240, 274, 307, 340, 374, 407, 507].flatMap((ms) =>
    ["light", "dark"].map((scheme) => ({
      name: `glassmenu-open-${ms}-${scheme}`,
      page: "glassmenu",
      scheme,
      overlay: "glassmenu",
      menuframe: ms,
      frames: true,
    })),
  ),
  ...[0, 33, 67, 100, 133].flatMap((ms) =>
    ["light", "dark"].map((scheme) => ({
      name: `glassmenu-close-${ms}-${scheme}`,
      page: "glassmenu",
      scheme,
      overlay: "glassmenu",
      menuclose: ms,
      frames: true,
    })),
  ),
  // The bar over the iOS 27 tab-bar fixture's own backdrop, at the iPhone's 402 × 874 pt
  // so the still lines up with the iOS frames pixel for pixel
  // (`tools/tab-bar-pixels.mjs`): the two-scale body, the shader's one-disc
  // body it replaces, and the opaque bar of Reduce Transparency.
  ...["light", "dark"].flatMap((scheme) =>
    ["a", "b"].flatMap((frame) => [
      { name: `tab-bar-fixture-${scheme}-${frame}`, page: "tab-bar-fixture", scheme, fixture: `${scheme}-${frame}`, viewport: IPHONE },
      { name: `tab-bar-fixture-single-${scheme}-${frame}`, page: "tab-bar-fixture", scheme, fixture: `${scheme}-${frame}`, barbody: "single-blur", viewport: IPHONE },
    ]),
  ),
  // The minimise morph pinned at its ends and three middle frames (`morph`),
  // with the two-scale body and with the one-disc body (no layers), and the
  // bar under increased contrast, both ways: it must take the one-disc path.
  ...["light", "dark"].flatMap((scheme) =>
    MORPHS.flatMap((morph) =>
      [["", undefined], ["single-", "single-blur"]].map(([tag, barbody]) => ({
        name: `tab-bar-fixture-morph-${tag}${scheme}-${String(Math.round(morph * 100)).padStart(3, "0")}`,
        page: "tab-bar-fixture",
        scheme,
        fixture: `${scheme}-a`,
        barbody,
        morph,
        viewport: IPHONE,
      })),
    ),
  ),
  // The two-scale morph stills a second time, from a fresh navigation: two
  // independent captures of one state, the noise floor of comparing stills
  // (`tools/tab-bar-frames.mjs`).
  ...["light", "dark"].flatMap((scheme) =>
    MORPHS.map((morph) => ({
      name: `tab-bar-fixture-morph-${scheme}-${String(Math.round(morph * 100)).padStart(3, "0")}-again`,
      page: "tab-bar-fixture",
      scheme,
      fixture: `${scheme}-a`,
      morph,
      viewport: IPHONE,
    })),
  ),
  ...["light", "dark"].flatMap((scheme) =>
    [["", undefined], ["single-", "single-blur"]].map(([tag, barbody]) => ({
      name: `tab-bar-fixture-contrast-${tag}${scheme}`,
      page: "tab-bar-fixture",
      scheme,
      fixture: `${scheme}-a`,
      barbody,
      contrast: "high",
      viewport: IPHONE,
    })),
  ),
  ...["light", "dark"].map((scheme) => ({
    name: `tab-bar-fixture-reduced-${scheme}-a`,
    page: "tab-bar-fixture",
    scheme,
    fixture: `${scheme}-a`,
    reduced: true,
    viewport: IPHONE,
  })),
  ...["none", "material", "shader"].flatMap((mode) =>
    ["light", "dark"].map((scheme) => ({
      name: `glass-calibration-${mode}-${scheme}`,
      page: "glass-calibration",
      scheme,
      glass: mode,
    })),
  ),
];

/** How long a tap waits for its tab to be hit-testable, then chosen. */
const TAP_TIMEOUT = 10000;

/** Polls `expression` in the page until it returns `{ ok: true }`; the last `seen` goes into the error. */
async function waitFor(page, expression, timeout, message) {
  const deadline = Date.now() + timeout;
  let seen = "nothing";
  while (Date.now() < deadline) {
    const value = await page
      .call("Runtime.evaluate", { expression, returnByValue: true })
      .then((result) => result.result.value)
      .catch((error) => ({ ok: false, seen: error.message }));
    if (value?.ok) return;
    seen = value?.seen ?? seen;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${message} within ${timeout} ms (saw ${seen})`);
}

/** A tab's button, described for an error: its tag, role, label and ARIA state. */
const DESCRIBE = `(element) => element
  ? \`<\${element.tagName.toLowerCase()} \${[...element.attributes].filter((a) => a.name === "role" || a.name.startsWith("aria-")).map((a) => \`\${a.name}="\${a.value}"\`).join(" ")}>\`
  : "no element"`;

/** Taps the tab named `tab` at `at`, once it is the button there, and waits until it is chosen. */
async function tapTab(page, shot) {
  const [x, y] = shot.tap.at;
  const tab = JSON.stringify(shot.tap.tab);
  await waitFor(
    page,
    `(() => {
      const describe = ${DESCRIBE};
      const hit = document.elementFromPoint(${x}, ${y});
      const button = hit?.closest('[role="button"]');
      return { ok: button?.getAttribute("aria-label") === ${tab}, seen: describe(button ?? hit) };
    })()`,
    TAP_TIMEOUT,
    `${shot.name}: the ${tab} tab is not the button at (${x}, ${y})`,
  );
  await page.call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
  await page.call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
  await waitFor(
    page,
    `(() => {
      const describe = ${DESCRIBE};
      const buttons = [...document.querySelectorAll('[role="button"][aria-label=' + JSON.stringify(${tab}) + ']')];
      return { ok: buttons.some((button) => button.getAttribute("aria-selected") === "true"), seen: buttons.map(describe).join(", ") || "no element" };
    })()`,
    TAP_TIMEOUT,
    `${shot.name}: the tap at (${x}, ${y}) did not choose the ${tab} tab`,
  );
}

async function shoot(page, base, shot) {
  const values = {
    "cupertino.page": shot.page,
    "cupertino.glass": shot.glass ?? "",
    "cupertino.contrast": shot.contrast ?? "normal",
    "cupertino.material": shot.material ?? "",
    "cupertino.overlay": shot.overlay ?? "",
    "cupertino.menuframe": shot.menuframe === undefined ? "" : String(shot.menuframe),
    "cupertino.menuclose": shot.menuclose === undefined ? "" : String(shot.menuclose),
    "cupertino.fixture": shot.fixture ?? "",
    "cupertino.barbody": shot.barbody ?? "",
    "cupertino.morph": shot.morph === undefined ? "" : String(shot.morph),
  };
  const seed = JSON.stringify(Object.fromEntries(Object.entries(values).filter(([, value]) => value)));
  const [width, height] = shot.viewport ?? [WIDTH, HEIGHT];
  await page.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: SCALE, mobile: true });
  await page.call("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: shot.scheme },
      { name: "prefers-reduced-transparency", value: shot.reduced ? "reduce" : "no-preference" },
    ],
  });
  await page.call("Runtime.evaluate", {
    expression: `(() => { localStorage.clear(); const prefix = ${JSON.stringify(PREFIX)}; for (const [key, value] of Object.entries(${seed})) localStorage.setItem(prefix + key, value); })()`,
  });
  await page.call("Page.navigate", { url: `${base}?shot=${encodeURIComponent(shot.name)}` });
  // The app mounts and lays out, then the shader draws its first frame. A
  // reload that has not mounted yet is a white page: wait for the tree.
  for (let i = 0; i < 100; i++) {
    const mounted = await page
      .call("Runtime.evaluate", { expression: "document.querySelector('#app')?.childElementCount > 0", returnByValue: true })
      .then((result) => result.result.value === true)
      .catch(() => false);
    if (mounted) break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (shot.fixture) {
    // The backdrop is a 1206 × 2622 PNG: the still waits until it has decoded.
    let loaded = false;
    for (let i = 0; i < 100 && !loaded; i++) {
      loaded = await page
        .call("Runtime.evaluate", {
          expression: "[...document.querySelectorAll('#app img')].some((img) => img.complete && img.naturalWidth === 1206)",
          returnByValue: true,
        })
        .then((result) => result.result.value === true)
        .catch(() => false);
      if (!loaded) await new Promise((resolve) => setTimeout(resolve, 100));
    }
    if (!loaded) throw new Error(`${shot.name}: the fixture backdrop did not load`);
  }
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (shot.tap) {
    // A finger on the tab bar: the chosen tab changes before the scroll.
    await tapTab(page, shot);
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  if (shot.context) {
    // The secondary button over the trigger: the context menu opens.
    const [x, y] = shot.context;
    await page.call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "right", clickCount: 1 });
    await page.call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "right", clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  if (shot.scroll) {
    // A wheel over the page: the rows go under the bar and the material redraws.
    // Several small steps, so the minimize state machine sees a scroll rather
    // than a teleport.
    const steps = shot.steps ?? 4;
    for (let i = 0; i < steps; i++) {
      await page.call("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: WIDTH / 2,
        y: HEIGHT * 0.65,
        deltaX: 0,
        deltaY: shot.scroll / steps,
      });
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  if (shot.up) {
    // Back up a little: the tab bar expands again, so the still shows the full
    // bar over the content it has scrolled to.
    for (let i = 0; i < 3; i++) {
      await page.call("Input.dispatchMouseEvent", {
        type: "mouseWheel",
        x: WIDTH / 2,
        y: HEIGHT * 0.5,
        deltaX: 0,
        deltaY: -shot.up / 3,
      });
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    await new Promise((resolve) => setTimeout(resolve, 900));
  }
  {
    // What drew the glass: the shaders' canvases, and the backdrop-filtered views.
    const drawn = await page
      .call("Runtime.evaluate", {
        expression: `JSON.stringify({ shader: [...document.querySelectorAll("canvas.nsh-fx-out")].map((c) => c.width + "x" + c.height), filtered: [...document.querySelectorAll("#app *")].map((el) => getComputedStyle(el).backdropFilter).filter((f) => f && f !== "none") })`,
        returnByValue: true,
      })
      .then((result) => result.result.value)
      .catch((error) => error.message);
    console.log(`  ${shot.name}: ${drawn}`);
    // `tools/tab-bar-pixels.mjs` asserts on the layers a fixture still had.
    if (shot.fixture) writeFileSync(join(OUT, `${shot.name}.json`), typeof drawn === "string" ? drawn : "{}");
  }
  for (const line of page.console.splice(0)) console.log(`  ${shot.name}: page says: ${line.slice(0, 300)}`);
  // A first paint can be the empty page (a white or black frame with no
  // content): take the still again until it holds more than a handful of
  // colours.
  const file = join(OUT, `${shot.name}.png`);
  for (let attempt = 0; attempt < 8; attempt++) {
    const { data } = await page.call("Page.captureScreenshot", { format: "png" });
    writeFileSync(file, Buffer.from(data, "base64"));
    try {
      const image = readPng(file);
      const seen = new Set();
      for (let y = 0; y < image.height; y += 12) {
        for (let x = 0; x < image.width; x += 12) {
          const [r, g, b] = image.pixel(x, y);
          seen.add(((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4));
        }
      }
      if (seen.size > 30) break;
    } catch {
      // An incomplete PNG: take it again.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return file;
}

// --- Recordings: one minimise, frame by frame, on the page clock (`CLOCK`,
// `tools/glass-browser.mjs`) ---------------------------------------------

/** How many frames a recording holds: one second, past the spring's rest. */
const FRAMES = 60;
/** The bar's band of the screen, in points: the stills are this clip at 3x. */
const MOTION_CLIP = { x: 0, y: 770, width: 402, height: 104, scale: 1 };

/** One minimise of the fixture bar per appearance and body: the two-scale body and the one-disc body before it. */
const RECORDINGS = ["light", "dark"].flatMap((scheme) => [
  ...[["", undefined], ["single-", "single-blur"]].map(([tag, barbody]) => ({
    name: `tab-bar-motion-${tag}${scheme}`,
    scheme,
    barbody,
    scroll: "1",
    wheel: [201, 400],
  })),
  // The same minimise on the pinned stills' own scene (`App.tsx`
  // `TabBarFixtureExactPage`): its frames are compared with the stills.
  { name: `tab-bar-exact-${scheme}`, scheme, barbody: undefined, scroll: "exact", wheel: [201, 870] },
  // The one-disc body on the same scene and clock: the per-frame reference of
  // `tools/tab-bar-pixels.mjs`.
  { name: `tab-bar-exact-single-${scheme}`, scheme, barbody: "single-blur", scroll: "exact", wheel: [201, 870] },
]);

async function record(page, base, rec) {
  await openRecording(page, base, rec);
  const dir = join(OUT, "motion");
  mkdirSync(dir, { recursive: true });
  const capture = async (k) => {
    const { data } = await page.call("Page.captureScreenshot", { format: "png", clip: MOTION_CLIP });
    writeFileSync(join(dir, `${rec.name}-${String(k).padStart(3, "0")}.png`), Buffer.from(data, "base64"));
  };
  const frozen = await page
    .call("Runtime.evaluate", { expression: "window.__nshClock.freeze()", returnByValue: true })
    .then((result) => result.result.value);
  const progressNow = () =>
    page.call("Runtime.evaluate", { expression: PROGRESS, returnByValue: true }).then((result) => result.result.value);
  const frames = [{ k: 0, t: 0, ran: 0, progress: await progressNow() }];
  await capture(0);
  // A user's scroll: one wheel notch over the page, 60 pt down. The bar
  // minimises after 20 pt of travel. Real time passes for the scroll to land
  // and its events to reach the app; the app's frames do not.
  await page.call("Input.dispatchMouseEvent", { type: "mouseWheel", x: rec.wheel[0], y: rec.wheel[1], deltaX: 0, deltaY: 60 });
  await new Promise((resolve) => setTimeout(resolve, 500));
  for (let k = 1; k <= FRAMES; k++) {
    const { t, ran } = await page
      .call("Runtime.evaluate", { expression: `window.__nshClock.step(${STEP_MS})`, returnByValue: true })
      .then((result) => result.result.value);
    frames.push({ k, t: t - frozen, ran, progress: await progressNow() });
    await capture(k);
  }
  for (const line of page.console.splice(0)) console.log(`  ${rec.name}: page says: ${line.slice(0, 300)}`);
  writeFileSync(join(dir, `${rec.name}.json`), JSON.stringify({ name: rec.name, stepMs: STEP_MS, clip: MOTION_CLIP, frames }, null, 1));
  return `${dir}/${rec.name}-*.png (${frames.length} frames)`;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "glass-build-"));
  const built = packageApp(work, FROM);
  const picked = SHOTS.filter((shot) =>
    (ONLY ? ONLY.includes(shot.name) : !shot.frames || args.includes("--menu-frames")) &&
    (!SCHEME || shot.scheme === SCHEME) &&
    (!PAGES || PAGES.includes(shot.page)),
  );
  // The recordings of a minimise: the fixture's page, spread over the shards
  // on their own.
  const recordings = RECORDINGS.filter((rec) =>
    (ONLY ? ONLY.includes(rec.name) : true) &&
    (!SCHEME || rec.scheme === SCHEME) &&
    (!PAGES || PAGES.includes("tab-bar-fixture")),
  ).filter((_, index) => index % SHARD[1] === SHARD[0] - 1);
  if (!picked.length && !recordings.length) throw new Error("no shot matches --only, --scheme and --pages");
  // The fixture's stills last: their 402 × 874 pt viewport and 1206 × 2622
  // backdrop must not change what the other stills see.
  const ordered = [...picked.filter((shot) => !shot.fixture), ...picked.filter((shot) => shot.fixture)];
  const chosen = ordered.filter((_, index) => index % SHARD[1] === SHARD[0] - 1);
  if (!chosen.length) console.log(`shard ${SHARD.join("/")} has none of the ${picked.length} shots`);
  if (chosen.some((shot) => shot.fixture) || recordings.length) {
    await installFixtures(built);
  }
  const { server, port } = await serve(built);
  const { child, profile, page } = await launch(CHROME);
  try {
    await page.call("Page.enable");
    await page.call("Runtime.enable");
    await page.call("Network.enable");
    await page.call("Network.setCacheDisabled", { cacheDisabled: true });
    await page.call("Emulation.setDeviceMetricsOverride", {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: SCALE,
      mobile: true,
    });
    await page.call("Page.navigate", { url: `http://127.0.0.1:${port}/` });
    await new Promise((resolve) => setTimeout(resolve, 2500));
    for (const shot of chosen) {
      console.log(await shoot(page, `http://127.0.0.1:${port}/`, shot));
    }
    if (recordings.length) {
      // The page clock goes in every page from here on (it is inert until frozen).
      await page.call("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
      for (const rec of recordings) console.log(await record(page, `http://127.0.0.1:${port}/`, rec));
    }
  } finally {
    child.kill();
    server.close();
    for (const dir of [profile, work]) {
      try {
        rmSync(dir, { recursive: true, force: true });
      } catch {
        // A browser still closing its profile: the temp directory goes anyway.
      }
    }
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
