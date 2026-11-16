#!/usr/bin/env node
// Screenshots of the Liquid Glass pages, from a real web build: the material
// reads the backdrop through WebGL 2, which `nsh test --target web` cannot
// show — the CLI regenerates its runtime on every run, so the shader fix
// `tools/patch-runtime.mjs` applies never survives into a test's page.
//
//   node tools/glass-shots.mjs [--out docs/screenshots] [--chrome <path>]
//
// It packages `examples/demo` for the web, patches the runtime, serves the
// build and drives headless Chrome: `glass-{light,dark}`, the increased
// contrast pair, and the calibration page three ways (no glass, the material
// without a GPU, the shader) that `tools/glass-pixels.mjs` asserts on.
import { spawn, spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { patchRuntimeSource } from "./patch-runtime.mjs";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const root = join(fileURLToPath(import.meta.url), "..", "..");
const OUT = arg("out", join(root, "docs", "screenshots"));
const CHROME = arg("chrome", process.env.CHROME ?? "google-chrome");
const WIDTH = 390;
const HEIGHT = 844;
const SCALE = 3;
/** The demo's storage namespace: `nsh:<app id>:` (nsh-engine). */
const PREFIX = "nsh:dev.nsh.cupertino.demo:";

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
  { name: "glass-material-light", page: "glass", scheme: "light", scroll: 640, up: 70, material: "material" },
  { name: "glass-material-dark", page: "glass", scheme: "dark", scroll: 640, up: 70, material: "material" },
  { name: "glass-sheet-light", page: "glass", scheme: "light", overlay: "glass" },
  { name: "glass-sheet-dark", page: "glass", scheme: "dark", overlay: "glass" },
  ...["none", "material", "shader"].flatMap((mode) =>
    ["light", "dark"].map((scheme) => ({
      name: `glass-calibration-${mode}-${scheme}`,
      page: "glass-calibration",
      scheme,
      glass: mode,
    })),
  ),
];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".webmanifest": "application/manifest+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".css": "text/css; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** Packages the demo for the web into `dir`, with the runtime's bindings fixed. */
function packageApp(dir) {
  const status = spawnSync("nsh", ["package", "App.tsx", "--target", "web", "-o", dir], {
    cwd: join(root, "examples", "demo"),
    stdio: "inherit",
  });
  if (status.status !== 0) throw new Error("nsh package failed");
  const built = join(dir, "Cupertino");
  let patched = 0;
  for (const name of readdirSync(built)) {
    if (!/^nsh\.[0-9a-f]+\.js$/.test(name)) continue;
    const path = join(built, name);
    const next = patchRuntimeSource(readFileSync(path, "utf8"));
    if (!next) continue;
    writeFileSync(path, next);
    patched += 1;
  }
  if (!patched) throw new Error(`no shader code to patch in ${built}`);
  return built;
}

/** Serves `dir` on a free port. */
function serve(dir) {
  const server = createServer((request, response) => {
    const asked = decodeURIComponent((request.url ?? "/").split("?")[0]);
    const path = join(dir, normalize(asked).replace(/^(\.\.[/\\])+/, ""));
    try {
      const file = statSync(path).isDirectory() ? join(path, "index.html") : path;
      const body = readFileSync(file);
      response.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      response.end(body);
    } catch {
      response.writeHead(404).end("not found");
    }
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve({ server, port: server.address().port }));
  });
}

class Cdp {
  constructor(send, listen) {
    this.id = 0;
    this.pending = new Map();
    this.send = send;
    listen((data) => {
      if (!data.id || !this.pending.has(data.id)) return;
      const { resolve, reject } = this.pending.get(data.id);
      this.pending.delete(data.id);
      data.error ? reject(new Error(data.error.message)) : resolve(data.result);
    });
  }

  call(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send({ id, method, params });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 60000);
    });
  }
}

/** Chrome, headless, with the software renderer WebGL 2 needs on a machine without a GPU. */
async function launch() {
  const profile = mkdtempSync(join(tmpdir(), "glass-chrome-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-sandbox",
      "--enable-unsafe-swiftshader",
      "--use-angle=swiftshader",
      "--hide-scrollbars",
      `--force-device-scale-factor=${SCALE}`,
      "--remote-debugging-port=0",
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: ["ignore", "ignore", "ignore"] },
  );
  let wsUrl;
  for (let i = 0; i < 600 && !wsUrl && child.exitCode === null; i++) {
    let port = 0;
    try {
      port = Number(readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0]);
    } catch {
      // Not written yet.
    }
    if (port) {
      try {
        wsUrl = (await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()).webSocketDebuggerUrl;
      } catch {
        // Not listening yet.
      }
    }
    if (!wsUrl) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!wsUrl) throw new Error("Chrome did not start");
  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve);
    ws.addEventListener("error", reject);
  });
  const listeners = [];
  ws.addEventListener("message", (message) => {
    const data = JSON.parse(message.data);
    for (const listener of listeners) listener(data);
  });
  const browser = new Cdp(
    (message) => ws.send(JSON.stringify(message)),
    (listener) => listeners.push((data) => { if (!data.sessionId) listener(data); }),
  );
  const { targetId } = await browser.call("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.call("Target.attachToTarget", { targetId, flatten: true });
  const page = new Cdp(
    (message) => ws.send(JSON.stringify({ ...message, sessionId })),
    (listener) => listeners.push((data) => { if (data.sessionId === sessionId) listener(data); }),
  );
  return { child, profile, page };
}

async function shoot(page, base, shot) {
  const values = {
    "cupertino.page": shot.page,
    "cupertino.glass": shot.glass ?? "",
    "cupertino.contrast": shot.contrast ?? "normal",
    "cupertino.material": shot.material ?? "",
    "cupertino.overlay": shot.overlay ?? "",
  };
  const seed = JSON.stringify(Object.fromEntries(Object.entries(values).filter(([, value]) => value)));
  await page.call("Emulation.setEmulatedMedia", {
    features: [{ name: "prefers-color-scheme", value: shot.scheme }],
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
  await new Promise((resolve) => setTimeout(resolve, 1200));
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
  const { data } = await page.call("Page.captureScreenshot", { format: "png" });
  const file = join(OUT, `${shot.name}.png`);
  writeFileSync(file, Buffer.from(data, "base64"));
  return file;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const work = mkdtempSync(join(tmpdir(), "glass-build-"));
  const built = packageApp(work);
  const { server, port } = await serve(built);
  const { child, profile, page } = await launch();
  try {
    await page.call("Page.enable");
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
    for (const shot of SHOTS) console.log(await shoot(page, `http://127.0.0.1:${port}/`, shot));
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
