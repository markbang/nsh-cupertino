// The machinery the glass tools share: the demo's patched web build, a static
// server, headless Chrome over CDP, the frozen page clock and the fixture
// bar's scene (`tools/glass-shots.mjs`, `tools/tab-bar-film.mjs`).
import { spawn, spawnSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

import { FIXTURE, fetchTabBarFixture } from "./fetch-tab-bar-fixture.mjs";
import { patchRuntimeSource } from "./patch-runtime.mjs";

const root = join(fileURLToPath(import.meta.url), "..", "..");
export const SCALE = 3;
/** The iOS fixture's screen, in points (1206 × 2622 px at 3x). */
export const IPHONE = [402, 874];
/** The demo's storage namespace: `nsh:<app id>:` (nsh-engine). */
export const PREFIX = "nsh:dev.nsh.cupertino.demo:";

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


/** Packages the demo for the web into `dir` (or copies `from`, a build of it), with the runtime's bindings fixed. */
export function packageApp(dir, from) {
  if (from) {
    // A copy: the patch below writes into it.
    cpSync(from, dir, { recursive: true });
  } else {
    const status = spawnSync("nsh", ["package", "App.tsx", "--target", "web", "-o", dir], {
      cwd: join(root, "examples", "demo"),
      stdio: "inherit",
    });
    if (status.status !== 0) throw new Error("nsh package failed");
  }
  const built = join(dir, "Cupertino");
  if (!existsSync(built)) throw new Error(`no Cupertino/ in ${from ?? dir}: is it the output of \`nsh package App.tsx --target web -o <dir>\`?`);
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
export function serve(dir) {
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
    this.console = [];
    listen((data) => {
      // What the page logs: NSH says there when a shader cannot draw or its
      // WebGL context is lost, which a still alone cannot tell.
      if (data.method === "Runtime.consoleAPICalled" && ["warning", "error"].includes(data.params.type)) {
        this.console.push(data.params.args.map((a) => a.value ?? a.description ?? "").join(" "));
      }
      if (data.method === "Runtime.exceptionThrown") this.console.push(data.params.exceptionDetails?.exception?.description ?? "exception");
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
        // Unref'd: an answered call's timer must not hold the process for a minute.
      }, 60000).unref();
    });
  }
}


/** Chrome, headless, with the software renderer WebGL 2 needs on a machine without a GPU. */
export async function launch(chrome) {
  const profile = mkdtempSync(join(tmpdir(), "glass-chrome-"));
  const child = spawn(
    chrome,
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


/** The fixture page's backdrops, served next to the build (same origin, so the shader's backdrop picture may draw them). */
export async function installFixtures(built) {
  const frames = await fetchTabBarFixture();
  mkdirSync(join(built, "fixtures"), { recursive: true });
  for (const name of Object.keys(FIXTURE)) copyFileSync(join(frames, name), join(built, "fixtures", name));
}

// --- Recordings: one minimise, frame by frame ------------------------------
//
// The page's own clock: `requestAnimationFrame` and `performance.now` are the
// browser's until `freeze()`, then time stands still and moves only by
// `step(ms)`, which runs the animation-frame callbacks queued so far at the new
// time. NSH steps its animations (the springs of the animated values, the
// shaders' frames) in animation-frame callbacks at the time they are given
// (`nsh_frame(now)`), so the still taken after the k-th step is the page after
// exactly k frames of 16.667 ms, however long the capture takes: frame-exact
// by construction, with no wall clock in it. A callback queued during a step
// runs at the next one, as a browser runs it in the next frame.
export const CLOCK = `(() => {
  const realRaf = window.requestAnimationFrame.bind(window);
  const realCancel = window.cancelAnimationFrame.bind(window);
  const realNow = performance.now.bind(performance);
  let frozen = null;
  let queue = new Map();
  const waiting = new Map();
  let next = 1e9;
  window.requestAnimationFrame = (callback) => {
    const id = ++next;
    if (frozen !== null) {
      queue.set(id, callback);
      return id;
    }
    waiting.set(id, realRaf((t) => {
      waiting.delete(id);
      if (frozen !== null) queue.set(id, callback);
      else callback(t);
    }));
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    queue.delete(id);
    if (waiting.has(id)) realCancel(waiting.get(id));
    waiting.delete(id);
  };
  performance.now = () => (frozen === null ? realNow() : frozen);
  window.__nshClock = {
    freeze() {
      frozen = realNow();
      return frozen;
    },
    step(ms) {
      frozen += ms;
      const due = [...queue.values()];
      queue = new Map();
      for (const callback of due) {
        try {
          callback(frozen);
        } catch (error) {
          console.error(error);
        }
      }
      return { t: frozen, ran: due.length };
    },
  };
})();`;

/** The frame step of the recordings: 60 frames a second. */
export const STEP_MS = 1000 / 60;

// The minimise progress the page shows: 1 minus the effective opacity of the
// bar's shadow (`tab_bar.rs`, bound to 1 - progress) and the effective opacity
// of the minimised pill's disc (bound to progress), each the product of the
// opacities from the view up to the app's root. Two readings of one value.
export const PROGRESS = `(() => {
  const all = [...document.querySelectorAll("#app *")];
  const effective = (el) => {
    let o = 1;
    for (let n = el; n && n.id !== "app"; n = n.parentElement) o *= Number(getComputedStyle(n).opacity);
    return o;
  };
  const shadow = all.find((el) => getComputedStyle(el).boxShadow.includes("0px 7px 10px"));
  const pill = all.find((el) => getComputedStyle(el).boxShadow.includes("0px 5px 12px"));
  return { fromShadow: shadow ? 1 - effective(shadow) : null, fromPill: pill ? effective(pill) : null };
})()`;

/**
 * Opens the fixture bar's page as a recording sees it: `scene` is `{ name,
 * scheme, scroll, barbody }` (`scroll`: "1" or "exact", `App.tsx`), at the
 * iPhone's viewport, with the backdrop decoded and the page clock installed.
 */
export async function openRecording(page, base, scene) {
  const values = {
    "cupertino.page": "tab-bar-fixture",
    "cupertino.fixture": `${scene.scheme}-a`,
    "cupertino.fixturescroll": scene.scroll,
    "cupertino.barbody": scene.barbody ?? "",
  };
  const seed = JSON.stringify(Object.fromEntries(Object.entries(values).filter(([, value]) => value)));
  const [width, height] = IPHONE;
  await page.call("Emulation.setDeviceMetricsOverride", { width, height, deviceScaleFactor: SCALE, mobile: true });
  await page.call("Emulation.setEmulatedMedia", {
    features: [
      { name: "prefers-color-scheme", value: scene.scheme },
      { name: "prefers-reduced-transparency", value: "no-preference" },
    ],
  });
  await page.call("Runtime.evaluate", {
    expression: `(() => { localStorage.clear(); const prefix = ${JSON.stringify(PREFIX)}; for (const [key, value] of Object.entries(${seed})) localStorage.setItem(prefix + key, value); })()`,
  });
  await page.call("Page.navigate", { url: `${base}?record=${encodeURIComponent(scene.name)}` });
  const until = async (expression, what) => {
    for (let i = 0; i < 100; i++) {
      const ok = await page
        .call("Runtime.evaluate", { expression, returnByValue: true })
        .then((result) => result.result.value === true)
        .catch(() => false);
      if (ok) return;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`${scene.name}: ${what}`);
  };
  await until("document.querySelector('#app')?.childElementCount > 0", "the app did not mount");
  await until("[...document.querySelectorAll('#app img')].some((img) => img.complete && img.naturalWidth === 1206)", "the backdrop did not load");
  await until("typeof window.__nshClock === 'object'", "the page clock is not installed");
  await new Promise((resolve) => setTimeout(resolve, 1500));
}
