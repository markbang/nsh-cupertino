#!/usr/bin/env node
// End-to-end checks of the published site in headless Chrome, at a desktop and
// a phone viewport: every hash route loads on its own (deep links), the demos
// respond to pointer input, the appearance, language and phone frame controls
// work, and the first load's first-contentful-paint and transferred bytes are
// measured on a cold cache.
//
//   node tools/site-check.mjs --url http://127.0.0.1:4173/nsh-cupertino/
//
// Prints a JSON summary; screenshots go to --out.
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 ? args[index + 1] : fallback;
};

const BASE = arg("url", "http://127.0.0.1:4173/nsh-cupertino/");
const OUT = arg("out", "/workspace/out/screens/cupertino-site");
const CHROME = arg("chrome", "/workspace/tools/bin/chrome-nosandbox");
const PORT = Number(arg("port", "9222"));
const WITH_SCREENSHOTS = !args.includes("--no-screenshots");
const ONLY = arg("only", "");
const SKIP_LINKS = args.includes("--no-links");

const PAGES = [
  ["Icon", "icon"],
  ["Theme", "theme"],
  ["Navigation bar", "navigation-bar"],
  ["Nav page", "nav-page"],
  ["List", "list"],
  ["Section", "section"],
  ["List tile", "list-tile"],
  ["Button", "button"],
  ["Text field", "text-field"],
  ["Search field", "search-field"],
  ["Switch", "switch"],
  ["Activity indicator", "activity-indicator"],
  ["Scroll view", "scroll-view"],
  ["Sheet", "sheet"],
  ["Action sheet", "action-sheet"],
  ["Alert dialog", "alert-dialog"],
  ["Context menu", "context-menu"],
  ["Picker", "picker"],
  ["Date picker", "date-picker"],
  ["Segmented control", "segmented-control"],
  ["Slider", "slider"],
  ["Tab bar", "tab-bar"],
  ["Swipe actions", "swipe-row"],
  ["Pull to refresh", "refresh"],
];

class Cdp {
  constructor(send, listen) {
    this.id = 0;
    this.pending = new Map();
    this.events = [];
    this.rawSend = send;
    listen((data) => {
      if (data.id && this.pending.has(data.id)) {
        const { resolve, reject } = this.pending.get(data.id);
        this.pending.delete(data.id);
        data.error ? reject(new Error(data.error.message)) : resolve(data.result);
      } else if (data.method) {
        this.events.push(data);
      }
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.rawSend({ id, method, params });
      setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        reject(new Error(`${method} timed out`));
      }, 30000);
    });
  }

  on(method) {
    return this.events.filter((event) => event.method === method);
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (result.exceptionDetails) {
      throw new Error(`evaluate: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
    }
    return result.result.value;
  }

  async waitFor(expression, timeout = 20000, label = expression) {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        if (await this.evaluate(expression)) return true;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    const text = await this.evaluate("document.body.innerText.slice(0, 400)").catch(() => "");
    throw new Error(`timed out waiting for ${label}; screen: ${JSON.stringify(text)}`);
  }

  async click(x, y) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x, y, button: "left", clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  async drag(x, y, dx, dy, steps = 14) {
    await this.send("Input.dispatchMouseEvent", { type: "mouseMoved", x, y });
    await this.send("Input.dispatchMouseEvent", { type: "mousePressed", x, y, button: "left", clickCount: 1 });
    for (let step = 1; step <= steps; step++) {
      await this.send("Input.dispatchMouseEvent", {
        type: "mouseMoved",
        x: x + (dx * step) / steps,
        y: y + (dy * step) / steps,
        button: "left",
        buttons: 1,
      });
      await new Promise((resolve) => setTimeout(resolve, 16));
    }
    await this.send("Input.dispatchMouseEvent", { type: "mouseReleased", x: x + dx, y: y + dy, button: "left", clickCount: 1 });
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  center(selector) {
    return this.evaluate(`(() => {
      const element = document.querySelector(${JSON.stringify(selector)});
      if (!element) return null;
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return null;
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
    })()`);
  }

  screenshot(name, width = 1440, height = 900) {
    return this.send("Page.captureScreenshot", {
      format: "png",
      captureBeyondViewport: true,
      clip: { x: 0, y: 0, width, height, scale: 1 },
    }).then(({ data }) => writeFileSync(join(OUT, `${name}.png`), Buffer.from(data, "base64")));
  }
}

async function launch() {
  const profile = mkdtempSync(join(tmpdir(), "cupertino-chrome-"));
  const child = spawn(
    CHROME,
    [
      "--headless=new",
      "--no-sandbox",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${profile}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );
  let wsUrl;
  for (let i = 0; i < 120 && !wsUrl; i++) {
    try {
      wsUrl = (await (await fetch(`http://127.0.0.1:${PORT}/json/version`)).json()).webSocketDebuggerUrl;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
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
  const { targetId } = await browser.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await browser.send("Target.attachToTarget", { targetId, flatten: true });
  const page = new Cdp(
    (message) => ws.send(JSON.stringify({ ...message, sessionId })),
    (listener) => listeners.push((data) => { if (data.sessionId === sessionId) listener(data); }),
  );
  return { child, profile, browser, page };
}

const results = {
  viewports: {},
  deepLinks: {},
  interactions: {},
  consoleErrors: [],
};

const label = (text) => `[aria-label="${text}"]`;

async function textPoint(page, text) {
  return page.evaluate(`(() => {
    const wanted = ${JSON.stringify(text)};
    const nodes = [...document.querySelectorAll("div,span")];
    const matches = nodes.filter((element) => (element.textContent?.trim() ?? "").includes(wanted));
    // The deepest match: a view whose children hold none of the text.
    const found = matches.find(
      (element) => ![...element.querySelectorAll("div,span")].some((child) => (child.textContent?.trim() ?? "").includes(wanted)),
    );
    if (!found) return null;
    const rect = found.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  })()`);
}

/** The element's centre, scrolling NSH's own scroll views with the wheel. */
async function findText(page, text, count = 30) {
  const size = await page.evaluate("({ width: innerWidth, height: innerHeight })");
  for (let attempt = 0; attempt < count; attempt++) {
    // Any match in the visible band: the header keeps its own copy of some
    // labels, and a popover's is the one that matters.
    const points = await page.evaluate(`(() => {
      const wanted = ${JSON.stringify(text)};
      const nodes = [...document.querySelectorAll("div,span")].filter(
        (element) => ![...element.querySelectorAll("div,span")].some((child) => (child.textContent?.trim() ?? "").includes(wanted)) &&
          (element.textContent?.trim() ?? "").includes(wanted),
      );
      return nodes.map((element) => {
        const rect = element.getBoundingClientRect();
        return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
      });
    })()`);
    const point = points.find((candidate) => candidate.y > 72 && candidate.y < size.height - 16);
    if (point) return point;
    const anywhere = points[0];
    if (!anywhere) break;
    // NSH scrolls its views itself: a wheel over the view is the input it takes.
    if (!anywhere) break;
    await page.send("Input.dispatchMouseEvent", {
      type: "mouseWheel",
      x: anywhere.x < 250 ? 120 : Math.round(size.width / 2),
      y: Math.round(size.height / 2),
      deltaX: 0,
      deltaY: 420,
    });
    await new Promise((resolve) => setTimeout(resolve, 220));
  }
  const state = await page
    .evaluate(`({ scroll: window.scrollY, text: document.body.innerText.slice(0, 200), cards: document.querySelectorAll("[aria-label]").length })`)
    .catch(() => null);
  throw new Error(`no "${text}" on screen; ${JSON.stringify(state)}`);
}

async function clickText(page, text) {
  const point = await findText(page, text);
  await page.click(point.x, point.y);
}

async function clickLabel(page, name) {
  // A freshly loaded page has its text in the DOM before it is laid out, so a
  // control is at 0 × 0 for a frame or two.
  let point = null;
  for (let attempt = 0; attempt < 30 && !point; attempt++) {
    point = await page.center(label(name));
    if (!point) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!point) throw new Error(`no control labelled ${name}`);
  await page.click(point.x, point.y);
}

/** Opens the settings popover, retrying while a closing overlay swallows the press. */
// The settings trigger is named in the page's language: "Settings" or "设置".
const SETTINGS = '[role="button"][aria-label="Settings"],[role="button"][aria-label="设置"]';

async function clickSettings(page) {
  let point = null;
  for (let attempt = 0; attempt < 30 && !point; attempt++) {
    point = await page.center(SETTINGS);
    if (!point) await new Promise((resolve) => setTimeout(resolve, 100));
  }
  if (!point) throw new Error("no settings trigger");
  await page.click(point.x, point.y);
}

async function openSettings(page) {
  for (let attempt = 0; attempt < 4; attempt++) {
    await clickSettings(page);
    await new Promise((resolve) => setTimeout(resolve, 400));
    if (await page.evaluate(`document.body.innerText.includes("Appearance") || document.body.innerText.includes("外观")`)) return;
  }
  throw new Error("the settings panel did not open");
}

async function shows(page, text) {
  return page.evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`);
}

const HOME = `${BASE}?home#/`;

async function load(page, url, wait, labelText) {
  await page.send("Page.navigate", { url });
  await page.waitFor(wait, 30000, labelText ?? url);
}

// The hero's eyebrow is the same in both languages.
async function openHome(page) {
  await load(page, HOME, `document.body.innerText.includes("NATIVE SHELL")`, "home");
}

async function openPage(page, id, name) {
  // A query as well as the fragment: every navigation is a full document load,
  // which is what a shared link is.
  const url = `${BASE}?r=${id}#/${id}`;
  await load(page, url, `document.body.innerText.includes("API") && document.body.innerText.includes(${JSON.stringify(name)})`, `${name} page`);
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  const { child, profile, browser, page } = await launch();
  try {
    await page.send("Page.enable");
    await page.send("Runtime.enable");
    await page.send("Network.enable");
    await page.send("Performance.enable");
    await page.send("DOM.enable");
    // The first-contentful-paint and the largest contentful paint of each load,
    // from the page itself.
    await page.send("Page.addScriptToEvaluateOnNewDocument", {
      source: `window.__fcp = null; window.__lcp = null;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) if (entry.name === "first-contentful-paint") window.__fcp = entry.startTime;
      }).observe({ type: "paint", buffered: true });
      new PerformanceObserver((list) => {
        const entries = list.getEntries(); if (entries.length) window.__lcp = entries[entries.length - 1].startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });`,
    });
    page.events.length = 0;

    for (const viewport of [
      { name: "desktop", width: 1440, height: 900, mobile: false },
      { name: "phone", width: 390, height: 844, mobile: true },
    ]) {
      await page.send("Emulation.setDeviceMetricsOverride", {
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
        mobile: viewport.mobile,
      });
      await page.send("Emulation.setTouchEmulationEnabled", { enabled: viewport.mobile });
      console.error(`viewport ${viewport.name}`);
      await page.send("Network.setCacheDisabled", { cacheDisabled: true });
      await page.send("Network.clearBrowserCache");
      // A first visit: no preferences from the viewport before.
      await page.send("Storage.clearDataForOrigin", { origin: new URL(BASE).origin, storageTypes: "local_storage" });

      // The first load, cold: its FCP and the bytes it transferred.
      page.events.length = 0;
      const started = Date.now();
      await load(page, `${BASE}?cold=${viewport.name}#/`, `document.body.innerText.includes("NATIVE SHELL")`, "cold home");
      const visible = Date.now() - started;
      // The paint entries land a frame or two after the text is in the DOM, so
      // the wait above is not enough on its own.
      await page.waitFor("(window.__fcp ?? 0) > 0", 3000, "first contentful paint").catch(() => {});
      const fcp = await page.evaluate("window.__fcp");
      const lcp = await page.evaluate("window.__lcp");
      const bytes = page
        .on("Network.loadingFinished")
        .reduce((total, event) => total + (event.params.encodedDataLength ?? 0), 0);
      results.viewports[viewport.name] = {
        firstLoad: {
          fcpMs: fcp ? Math.round(fcp) : null,
          lcpMs: lcp ? Math.round(lcp) : null,
          visibleMs: visible,
          kilobytes: Math.round(bytes / 100) / 10,
          requests: page.on("Network.requestWillBeSent").length,
        },
      };

      // Deep links: each route loads on its own, with the component's title.
      results.deepLinks[viewport.name] = {};
      for (const [name, id] of SKIP_LINKS ? [] : PAGES) {
        const url = `${BASE}?link=${id}#/${id}`;
        try {
          await page.send("Page.navigate", { url });
          await page.waitFor(
            `document.body.innerText.includes("API") && document.body.innerText.includes(${JSON.stringify(name)})`,
            20000,
            `${id} deep link`,
          );
          results.deepLinks[viewport.name][id] = true;
        } catch (error) {
          results.deepLinks[viewport.name][id] = error.message;
        }
      }

      // The demos respond, through the UI a reader uses.
      const interactions = {
        switch: async () => {
          await openPage(page, "switch", "Switch");
          await page.waitFor(`document.body.innerText.includes("Wi-Fi on")`, 8000, "switch state");
          const box = await page.center('[role="switch"]');
          if (!box) throw new Error("no switch");
          await page.click(box.x, box.y);
          await page.waitFor(`document.body.innerText.includes("Wi-Fi off")`, 6000, "switch off");
        },
        sheet: async () => {
          await openPage(page, "sheet", "Sheet");
          await clickText(page, "Open the sheet");
          await page.waitFor(`document.querySelectorAll('[role="dialog"]').length > 0`, 8000, "sheet");
          await clickText(page, "Unread only");
          if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-sheet`, viewport.width, viewport.height);
        },
        segmented: async () => {
          await openPage(page, "segmented-control", "Segmented control");
          await clickText(page, "Week");
          await page.waitFor(`document.body.innerText.includes("week")`, 6000, "week chosen");
        },
        slider: async () => {
          await openPage(page, "slider", "Slider");
          const box = await page.evaluate(`(() => {
            const element = document.querySelector('[role="slider"]');
            if (!element) return null;
            const rect = element.getBoundingClientRect();
            return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, width: rect.width };
          })()`);
          if (!box) throw new Error("no slider");
          const before = await page.evaluate(`document.body.innerText.match(/\\d+%/)?.[0]`);
          await page.drag(box.x, box.y, box.width / 3, 0);
          await page.waitFor(`document.body.innerText.match(/\\d+%/)?.[0] !== ${JSON.stringify(before)}`, 5000, "slider moved");
        },
        tabBar: async () => {
          await openPage(page, "tab-bar", "Tab bar");
          await clickText(page, "Saved");
          await page.waitFor(`document.body.innerText.includes("saved")`, 6000, "tab chosen");
        },
        // A shared link's history: a card pushes, the browser's back returns to
        // the grid and forward returns to the page.
        history: async () => {
          await openHome(page);
          await clickText(page, "Sheet");
          await page.waitFor(`location.hash === "#/sheet" && document.body.innerText.includes("API")`, 8000, "sheet route pushed");
          await page.evaluate("history.back()");
          await page.waitFor(`location.hash === "#/" && document.body.innerText.includes("Interactive demos")`, 8000, "back to the grid");
          await page.evaluate("history.forward()");
          await page.waitFor(`location.hash === "#/sheet" && document.body.innerText.includes("API")`, 8000, "forward to the page");
        },
        language: async () => {
          await openHome(page);
          await openSettings(page);
          await clickText(page, "中文");
          await page.waitFor(`document.body.innerText.includes("可交互演示")`, 8000, "Chinese home");
          // The panel is a tool; the screenshot is of the page.
          await clickSettings(page);
          await new Promise((resolve) => setTimeout(resolve, 300));
          if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-zh`, viewport.width, viewport.height);
          await openSettings(page);
          await clickText(page, "EN");
          await page.waitFor(`document.body.innerText.includes("Interactive demos")`, 8000, "English home");
          await clickSettings(page);
        },
        dark: async () => {
          await openPage(page, "sheet", "Sheet");
          await openSettings(page);
          await clickText(page, "Dark");
          await clickSettings(page);
          await page.waitFor(
            `(() => { const el = [...document.querySelectorAll("div,span")].find((d) => d.textContent?.trim() === "Sheet" && getComputedStyle(d).fontSize === "34px"); if (!el) return false; const [r, g, b] = getComputedStyle(el).color.match(/\\d+/g).map(Number); return r > 200 && g > 200 && b > 200; })()`,
            6000,
            "dark appearance",
          );
          await clickText(page, "Open the sheet");
          await page.waitFor(`document.querySelectorAll('[role="dialog"]').length > 0`, 8000, "sheet");
          if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-dark`, viewport.width, viewport.height);
          // Back to the light appearance through the control itself.
          await page.click(24, 200);
          await page.waitFor(`document.querySelectorAll('[role="dialog"]').length === 0`, 6000, "sheet closed by the backdrop");
          await new Promise((resolve) => setTimeout(resolve, 400));
          await openSettings(page);
          await clickText(page, "Light");
          await clickSettings(page);
          await page.waitFor(
            `(() => { const el = [...document.querySelectorAll("div,span")].find((d) => d.textContent?.trim() === "Sheet" && getComputedStyle(d).fontSize === "34px"); if (!el) return false; const [r, g, b] = getComputedStyle(el).color.match(/\\d+/g).map(Number); return r < 80 && g < 80 && b < 80; })()`,
            6000,
            "light appearance again",
          );
        },
        frame: async () => {
          if (viewport.mobile) return;
          await openPage(page, "list", "List");
          await openSettings(page);
          await page.waitFor(`document.body.innerText.includes("Phone frame")`, 6000, "phone frame setting");
          const framed = () =>
            page.evaluate(`[...document.querySelectorAll("div")].some((d) => getComputedStyle(d).borderTopLeftRadius === "58px")`);
          if (!(await framed())) await clickText(page, "Phone frame");
          await page.waitFor(`[...document.querySelectorAll("div")].some((d) => getComputedStyle(d).borderTopLeftRadius === "58px")`, 6000, "phone frame");
          await clickSettings(page);
          if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-frame`, viewport.width, viewport.height);
        },
      };
      for (const [name, run] of Object.entries(interactions)) {
        if (ONLY && name !== ONLY) continue;
        console.error(`  ${name}`);
        try {
          await run();
          results.interactions[`${viewport.name}:${name}`] = true;
        } catch (error) {
          results.interactions[`${viewport.name}:${name}`] = error.message.replace(/\s+/g, " ").slice(0, 300);
        }
      }

      // Reference screenshots: home and a component page, at both widths, with
      // the preferences a first visit has (the controls above left some set).
      console.error("  screenshots");
      await page.evaluate("localStorage.clear()").catch(() => {});
      await openHome(page);
      if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-home`, viewport.width, viewport.height);
      await openPage(page, "sheet", "Sheet");
      if (WITH_SCREENSHOTS) await page.screenshot(`${viewport.name}-sheet-page`, viewport.width, viewport.height);
    }

    results.consoleErrors = [
      ...page.on("Runtime.exceptionThrown").map((event) => event.params.exceptionDetails.text),
      ...page
        .on("Runtime.consoleAPICalled")
        .filter((event) => event.params.type === "error")
        .map((event) => event.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" ")),
    ];
    // Every asset the site asked for answered 2xx: a 404 is a broken path under
    // the base, which the checks above may not notice.
    results.failedResponses = page
      .on("Network.responseReceived")
      .map((event) => event.params.response)
      // A browser's own /favicon.ico probe is not one of the site's assets.
      .filter((response) => response.status >= 400 && !response.url.endsWith("/favicon.ico"))
      .map((response) => `${response.status} ${response.url}`);
  } finally {
    try {
      await browser.send("Browser.close");
    } catch {}
    child.kill();
    await new Promise((resolve) => setTimeout(resolve, 300));
    try {
      rmSync(profile, { recursive: true, force: true });
    } catch {}
  }

  console.log(JSON.stringify(results, null, 2));
  const failedLinks = Object.values(results.deepLinks).some((links) => Object.values(links).some((ok) => ok !== true));
  const failedInteractions = Object.values(results.interactions).some((ok) => ok !== true);
  if (failedLinks || failedInteractions || results.consoleErrors.length || results.failedResponses.length) process.exit(1);
}

main().catch((error) => {
  console.error(error.stack ?? String(error));
  process.exit(1);
});
