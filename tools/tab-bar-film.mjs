#!/usr/bin/env node
// A film of the tab bar's minimise and restore, for review: the pinned stills'
// scene (`tab-bar-fixture`, `{theme}-a`, the exact scroll scene), the
// two-scale body, frame by frame on the frozen page clock at 60 fps.
//
//   node tools/tab-bar-film.mjs --from <dir> --out <dir> [--scheme light|dark]
//     [--scene bare|tabs] [--chrome <path>]
//
// `--from` is what `nsh package App.tsx --target web -o <dir>` wrote for
// `examples/demo`. The path, per theme: rest 0.5 s; a press held 0.2 s on the
// bar's body (the fixture bar has no tabs; `--scene tabs` presses its tabs);
// one wheel notch down (60 pt), until the spring rests, plus 0.5 s; minimised
// 0.5 s; one notch back up, until it rests, plus 0.5 s. Writes, in `--out`:
//
//   frames/{theme}/NNNN.png       the bar band (402 × 174 pt from y 700) at 3x
//   frames/{theme}/progress.json  each frame's progress (`PROGRESS`), the beats
//   tab-bar-morph-{theme}.mp4, tab-bar-morph-{theme}-quarter.mp4
//   tab-bar-morph-{theme}-4up.png, tab-bar-morph-4up.png (light above dark)
//
// `--scene tabs` films the same scene with a bar of four tabs, Me selected
// (`exact-tabs`, `App.tsx`): frames under `frames/tabs-{theme}/`, outputs named
// `tab-bar-morph-tabs-*`, and a contact strip per theme,
// `tab-bar-morph-tabs-strip-{theme}.png`: the minimise's frames nearest to
// `STRIP` progress, cropped to the bar, each labelled with its k and progress.
// Its press beat presses each of `TABS` twice, which chooses it and then
// presses it while chosen: held `PRESS` frames, released, until the frame
// stays the same `PRESS_REST` frames, then `PRESS_AFTER` more. Each press in
// progress.json's `presses` says how many held frames differ from the frame
// before the press and whether the settled frame is that frame, pixel for
// pixel. Then the minimise and restore with Me chosen.
// `tab-bar-morph-tabs-press-{theme}.png` is Me's first press, at the
// `PRESS_STRIP` frames.
//
// Needs ffmpeg (with libx264 and drawtext) and the DejaVu Sans font.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { CLOCK, IPHONE, PROGRESS, SCALE, STEP_MS, installFixtures, launch, openRecording, packageApp, serve } from "./glass-browser.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};
const FROM = arg("from", null);
const OUT = arg("out", null);
const CHROME = arg("chrome", process.env.CHROME ?? "google-chrome");
const SCHEMES = arg("scheme", null) ? [arg("scheme")] : ["light", "dark"];
const SCENE = arg("scene", "bare");
const SCENES = {
  bare: { scroll: "exact", name: "tab-bar-film", frames: "", prefix: "tab-bar-morph" },
  tabs: { scroll: "exact-tabs", name: "tab-bar-film-tabs", frames: "tabs-", prefix: "tab-bar-morph-tabs" },
};

const FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf";
/** The bar band with some page above it, in points. */
const CLIP = { x: 0, y: 700, width: IPHONE[0], height: 174, scale: 1 };
/** The wheel of the exact recording (`glass-shots.mjs`): over the scroll view, below the bar's container. */
const WHEEL = [201, 870];
const HOLD = 30;
const PRESS = 12;
/** The tabs scene's tabs, pressed in this order, by their accessibility labels. */
const TABS = ["Chats", "Spaces", "Activity", "Me"];
/** A press has settled once the frame has not changed for this many frames. */
const PRESS_REST = 10;
/** Frames filmed after a press has settled. */
const PRESS_AFTER = 15;
/** Me's first press in its strip: frames after the press (0 is the last frame before it), after the release, and settled. */
const PRESS_STRIP = [["press", 0], ["press", 2], ["press", 4], ["press", 8], ["press", 12], ["release", 4], ["release", 8], ["settled"]];
/** A spring that has not rested after this many frames ends its beat anyway, and the json says so. */
const CAP = 300;
const WIDTH = 1080;
/** The contact strip's progress values, and its crop of a frame (pt, in the clip): the bar's 790-854 with 20 pt above and 16 below. */
const STRIP = [0.05, 0.1, 0.2, 0.3, 0.5, 0.7, 0.9, 1.0];
const BAND = { y: 70, height: 100 };

function ffmpeg(...params) {
  const run = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", ...params], { stdio: "inherit" });
  if (run.error) throw new Error(`ffmpeg did not start (${run.error.message}): install it (apt-get install ffmpeg)`);
  if (run.status !== 0) throw new Error(`ffmpeg ${params.join(" ")} exited with ${run.status}`);
}

const evaluate = (page, expression) =>
  page.call("Runtime.evaluate", { expression, returnByValue: true }).then((result) => result.result.value);

/** The point to press: the centre of the bar's selected tab, else of the bar's body (its shadow's box). */
const PRESS_TARGET = `(() => {
  const centre = (el) => { const r = el.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; };
  const all = [...document.querySelectorAll("#app *")];
  const bar = all.find((el) => getComputedStyle(el).boxShadow.includes("0px 7px 10px"));
  const tab = document.querySelector('#app [role="button"][aria-selected="true"]');
  if (tab) return { at: centre(tab), label: tab.getAttribute("aria-label"), target: "selected tab " + JSON.stringify(tab.getAttribute("aria-label")) };
  if (bar) return { at: centre(bar), target: "bar body (the bar has no tab buttons)" };
  return null;
})()`;

/** The centre of the tab labelled `label`, and the label of the chosen tab. */
const TAB_TARGET = (label) => `(() => {
  const tab = document.querySelector(${JSON.stringify(`#app [role="button"][aria-label="${label}"]`)});
  const chosen = document.querySelector('#app [role="button"][aria-selected="true"]');
  if (!tab) return null;
  const r = tab.getBoundingClientRect();
  return { at: [r.left + r.width / 2, r.top + r.height / 2], chosen: chosen ? chosen.getAttribute("aria-label") : null };
})()`;

async function film(page, base, scheme) {
  const scene = SCENES[SCENE];
  const name = `${scene.name}-${scheme}`;
  const dir = join(OUT, "frames", `${scene.frames}${scheme}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  await openRecording(page, base, { name, scheme, scroll: scene.scroll });

  const frames = [];
  const beats = [];
  let previous = null;
  const frozen = await evaluate(page, "window.__nshClock.freeze()");
  const capture = async (beat, step) => {
    const k = frames.length;
    const { t, ran } = step ? await evaluate(page, `window.__nshClock.step(${STEP_MS})`) : { t: frozen, ran: 0 };
    const progress = await evaluate(page, PROGRESS);
    const { data } = await page.call("Page.captureScreenshot", { format: "png", clip: CLIP });
    writeFileSync(join(dir, `${String(k).padStart(4, "0")}.png`), Buffer.from(data, "base64"));
    const same = data === previous;
    previous = data;
    frames.push({ k, t: t - frozen, ran, beat, progress });
    return { k, data, same, progress };
  };
  const hold = async (beat, count) => {
    const from = frames.length;
    for (let i = 0; i < count; i++) await capture(beat, frames.length > 0);
    beats.push({ beat, from, to: frames.length - 1 });
  };
  const readings = (progress) => [progress?.fromShadow, progress?.fromLift].filter((value) => typeof value === "number");
  // Until the progress sits at `target` and the frame is the one before it,
  // pixel for pixel; then half a second more.
  const untilRest = async (beat, target) => {
    const from = frames.length;
    let restAt = null;
    while (restAt === null && frames.length - from < CAP) {
      const { k, same, progress } = await capture(beat, true);
      const values = readings(progress);
      if (same && values.length && values.every((value) => Math.abs(value - target) < 1e-3)) restAt = k;
    }
    for (let i = 0; i < HOLD; i++) await capture(beat, true);
    beats.push({ beat, from, to: frames.length - 1, restAt: restAt ?? frames.length - 1 - HOLD, restBy: restAt === null ? `cap of ${CAP} frames` : "progress at target, frame unchanged" });
  };
  const wheel = async (deltaY) => {
    // Real time passes for the scroll to land and reach the app; the app's frames do not.
    await page.call("Input.dispatchMouseEvent", { type: "mouseWheel", x: WHEEL[0], y: WHEEL[1], deltaX: 0, deltaY });
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  // The bare bar's one press, on its body, compared with rest.
  const pressBody = async () => {
    const target = await evaluate(page, PRESS_TARGET);
    if (!target) throw new Error(`${name}: no tab and no bar to press`);
    const [x, y] = target.at;
    await page.call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    const pressFrom = frames.length;
    let differing = 0;
    for (let i = 0; i < PRESS; i++) if ((await capture("press", true)).data !== restFrame) differing += 1;
    await page.call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    beats.push({ beat: "press", from: pressFrom, to: frames.length - 1 });
    // 0 is a valid count: the held frames are compared with rest, pixel for pixel, and reported, not judged.
    const press = { at: [x, y], target: target.target, label: target.label ?? null, heldFrames: PRESS, framesDifferingFromRest: differing };
    console.log(`  ${name}: press on the ${target.target} at (${x.toFixed(1)}, ${y.toFixed(1)}): ${differing} of ${PRESS} held frames differ from rest`);
    return press;
  };
  // A press on the tab labelled `tab`, held, released and settled.
  const pressTab = async (tab, pass) => {
    const target = await evaluate(page, TAB_TARGET(tab));
    if (!target) throw new Error(`${name}: no tab labelled ${JSON.stringify(tab)} to press`);
    const before = previous;
    const beforeK = frames.length - 1;
    const beat = `press ${tab} ${pass}`;
    const [x, y] = target.at;
    await page.call("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    const from = frames.length;
    let differing = 0;
    for (let i = 0; i < PRESS; i++) if ((await capture(beat, true)).data !== before) differing += 1;
    await page.call("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    const releasedFrom = frames.length;
    let unchanged = 0;
    while (unchanged < PRESS_REST && frames.length - releasedFrom < CAP) unchanged = (await capture(beat, true)).same ? unchanged + 1 : 0;
    const restAt = frames.length - 1 - unchanged;
    const restBy = unchanged >= PRESS_REST ? `${PRESS_REST} frames unchanged` : `cap of ${CAP} frames`;
    const settled = previous;
    for (let i = 0; i < PRESS_AFTER; i++) await capture(beat, true);
    beats.push({ beat, from, to: frames.length - 1, restAt, restBy });
    const after = await evaluate(page, TAB_TARGET(tab));
    const entry = {
      tab,
      pass,
      at: [x, y],
      chosenBefore: target.chosen,
      chosenAfter: after?.chosen ?? null,
      beforeK,
      held: [from, releasedFrom - 1],
      releasedFrom,
      restAt,
      restBy,
      heldFrames: PRESS,
      framesDifferingFromBefore: differing,
      settledIdenticalToBefore: settled === before,
    };
    console.log(`  ${name}: ${beat} (${target.chosen} chosen, ${entry.chosenAfter} after): ${differing} of ${PRESS} held frames differ from frame ${beforeK}; settled at ${restAt}, ${entry.settledIdenticalToBefore ? "identical to" : "differs from"} frame ${beforeK}`);
    return entry;
  };
  const pressTabs = async () => {
    const list = [];
    for (const tab of TABS) for (const pass of [1, 2]) list.push(await pressTab(tab, pass));
    return list;
  };

  await hold("rest", HOLD);
  const restFrame = previous;

  const press = SCENE === "tabs" ? null : await pressBody();
  const presses = SCENE === "tabs" ? await pressTabs() : null;

  await wheel(60);
  await untilRest("minimise", 1);
  await hold("minimised", HOLD);
  await wheel(-60);
  await untilRest("restore", 0);

  for (const line of page.console.splice(0)) console.log(`  ${name}: page says: ${line.slice(0, 300)}`);
  const beat = (which) => beats.find((b) => b.beat === which);
  const value = (frame) => {
    const values = readings(frame.progress);
    return values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
  };
  const drop = beat("minimise");
  const read = frames.slice(drop.from, drop.restAt + 1).filter((frame) => value(frame) !== null);
  if (!read.length) throw new Error(`${name}: no frame of the minimise has a progress (PROGRESS found no bar shadow)`);
  const dropping = read.reduce((best, frame) => (Math.abs(value(frame) - 0.3) < Math.abs(value(best) - 0.3) ? frame : best));
  const stills = { rest: beat("rest").to, dropping: dropping.k, minimised: drop.restAt, restored: beat("restore").restAt };
  const nearest = (p) => read.reduce((best, frame) => (Math.abs(value(frame) - p) < Math.abs(value(best) - p) ? frame : best));
  const strip = STRIP.map((p) => ({ target: p, k: nearest(p).k, progress: value(nearest(p)) }));
  writeFileSync(
    join(dir, "progress.json"),
    JSON.stringify({ name, scheme, scene: SCENE, stepMs: STEP_MS, clip: CLIP, deviceScale: SCALE, wheel: WHEEL, ...(presses ? { presses } : { press }), beats, stills, strip, frames }, null, 1),
  );
  for (const b of beats) console.log(`  ${name}: ${b.beat} frames ${b.from}-${b.to}${b.restAt === undefined ? "" : `, at rest from ${b.restAt} (${b.restBy})`}`);
  for (const s of strip) console.log(`  ${name}: strip ${s.target} -> frame ${s.k}, progress ${s.progress.toFixed(4)}`);
  const me = presses?.find((p) => p.tab === "Me" && p.pass === 1);
  const pressStrip = me
    ? PRESS_STRIP.map(([when, n]) => {
        if (when === "settled") return { label: "settled", k: me.restAt };
        const k = when === "press" ? (n === 0 ? me.beforeK : me.held[0] + n - 1) : me.releasedFrom + n - 1;
        return { label: `${when} +${n}`, k };
      })
    : null;
  return { dir, stills, strip, pressStrip, progress: { dropping: value(dropping) } };
}

const SCALED = `scale=${WIDTH}:-2:flags=lanczos`;

function encode(scheme, { dir, stills, strip, pressStrip, progress }) {
  const { prefix } = SCENES[SCENE];
  const input = join(dir, "%04d.png");
  const video = [`${SCALED}:out_color_matrix=bt709,format=yuv420p`];
  const x264 = ["-c:v", "libx264", "-preset", "slow", "-crf", "16", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-r", "60", "-movflags", "+faststart"];
  ffmpeg("-framerate", "60", "-start_number", "0", "-i", input, "-vf", video.join(","), ...x264, join(OUT, `${prefix}-${scheme}.mp4`));
  // The same frames at 15 a second, shown 4 times each at 60.
  ffmpeg("-framerate", "15", "-start_number", "0", "-i", input, "-vf", video.join(","), ...x264, join(OUT, `${prefix}-${scheme}-quarter.mp4`));

  const [bg, fg] = scheme === "dark" ? ["black", "white"] : ["white", "black"];
  const panels = [
    ["rest", stills.rest],
    [`dropping ${progress.dropping.toFixed(2)}`, stills.dropping],
    ["minimised", stills.minimised],
    ["restored", stills.restored],
  ];
  const inputs = panels.flatMap(([, k]) => ["-i", join(dir, `${String(k).padStart(4, "0")}.png`)]);
  const labelled = panels
    .map(([label], i) => `[${i}:v]${SCALED},pad=iw:ih+80:0:80:color=${bg},drawtext=fontfile=${FONT}:text='${scheme} · ${label}':x=32:y=22:fontsize=40:fontcolor=${fg}[p${i}]`)
    .join(";");
  ffmpeg(...inputs, "-filter_complex", `${labelled};[p0][p1][p2][p3]xstack=inputs=4:layout=0_0|w0_0|0_h0|w0_h0`, "-frames:v", "1", join(OUT, `${prefix}-${scheme}-4up.png`));

  if (SCENE !== "tabs") return;
  const crop = `crop=iw:${BAND.height * SCALE}:0:${BAND.y * SCALE}`;
  const stripInputs = strip.flatMap(({ k }) => ["-i", join(dir, `${String(k).padStart(4, "0")}.png`)]);
  const stripPanels = strip
    .map(({ k, progress: p }, i) => `[${i}:v]${crop},${SCALED},pad=iw:ih+64:0:64:color=${bg},drawtext=fontfile=${FONT}:text='${scheme} · k ${k} · progress ${p.toFixed(3)}':x=32:y=14:fontsize=36:fontcolor=${fg}[s${i}]`)
    .join(";");
  const stacked = strip.map((_, i) => `[s${i}]`).join("");
  ffmpeg(...stripInputs, "-filter_complex", `${stripPanels};${stacked}vstack=inputs=${strip.length}`, "-frames:v", "1", join(OUT, `${prefix}-strip-${scheme}.png`));

  const pressInputs = pressStrip.flatMap(({ k }) => ["-i", join(dir, `${String(k).padStart(4, "0")}.png`)]);
  const pressPanels = pressStrip
    .map(({ k, label }, i) => `[${i}:v]${crop},${SCALED},pad=iw:ih+64:0:64:color=${bg},drawtext=fontfile=${FONT}:text='${scheme} · Me · ${label} · k ${k}':x=32:y=14:fontsize=36:fontcolor=${fg}[q${i}]`)
    .join(";");
  const pressed = pressStrip.map((_, i) => `[q${i}]`).join("");
  ffmpeg(...pressInputs, "-filter_complex", `${pressPanels};${pressed}vstack=inputs=${pressStrip.length}`, "-frames:v", "1", join(OUT, `${prefix}-press-${scheme}.png`));
}

async function main() {
  if (!FROM || !OUT) throw new Error("usage: node tools/tab-bar-film.mjs --from <web build> --out <dir> [--scheme light|dark] [--scene bare|tabs]");
  if (!SCENES[SCENE]) throw new Error(`--scene must be bare or tabs, not ${SCENE}`);
  for (const scheme of SCHEMES) if (!["light", "dark"].includes(scheme)) throw new Error(`--scheme must be light or dark, not ${scheme}`);
  if (!existsSync(FONT)) throw new Error(`no ${FONT}: install it (apt-get install fonts-dejavu-core)`);
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "film-build-"));
  const built = packageApp(work, FROM);
  await installFixtures(built);
  const { server, port } = await serve(built);
  const { child, profile, page } = await launch(CHROME);
  const base = `http://127.0.0.1:${port}/`;
  const filmed = {};
  try {
    await page.call("Page.enable");
    await page.call("Runtime.enable");
    await page.call("Network.enable");
    await page.call("Network.setCacheDisabled", { cacheDisabled: true });
    await page.call("Emulation.setDeviceMetricsOverride", { width: IPHONE[0], height: IPHONE[1], deviceScaleFactor: SCALE, mobile: true });
    await page.call("Page.navigate", { url: base });
    await new Promise((resolve) => setTimeout(resolve, 2500));
    await page.call("Page.addScriptToEvaluateOnNewDocument", { source: CLOCK });
    for (const scheme of SCHEMES) filmed[scheme] = await film(page, base, scheme);
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
  for (const [scheme, result] of Object.entries(filmed)) encode(scheme, result);
  const { prefix, frames: framesPrefix } = SCENES[SCENE];
  if (filmed.light && filmed.dark) {
    ffmpeg("-i", join(OUT, `${prefix}-light-4up.png`), "-i", join(OUT, `${prefix}-dark-4up.png`), "-filter_complex", "vstack=inputs=2", "-frames:v", "1", join(OUT, `${prefix}-4up.png`));
  }
  for (const scheme of Object.keys(filmed)) {
    const { frames } = JSON.parse(readFileSync(join(OUT, "frames", `${framesPrefix}${scheme}`, "progress.json"), "utf8"));
    console.log(`${scheme}: ${frames.length} frames, ${(frames.length / 60).toFixed(2)} s at 60 fps`);
  }
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
