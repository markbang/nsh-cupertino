// The site's behavior: every route opens, the global controls apply, and the
// demos really respond - the sheet opens and closes, a switch toggles, a row
// swipes away, a refresh runs, a code sample copies.
import { expect, open, test } from "nsh/test";

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
] as const;

test("the home grid lists all 24 components", async () => {
  const app = await open("./App.tsx");
  expect(app.shows("text:Interactive demos")).toBe(true);
  for (const [name] of PAGES) expect(app.shows(`text:${name}`)).toBe(true);
  expect(app.shows("text:Cupertino, for Native Shell.")).toBe(true);
});

test("every component page opens and shows its API", async () => {
  const app = await open("./App.tsx");
  for (const [name, id] of PAGES) {
    await app.press(`text:${name}`);
    expect(app.shows(`text:${name}`)).toBe(true);
    expect(app.shows("text:API")).toBe(true);
    await app.press("text:‹ All components");
  }
});

test("the sheet opens with a detent and closes from Done", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Sheet");
  await app.press("text:Open the sheet");
  expect(app.shows("text:Filters")).toBe(true);
  await app.press("label:Done");
  await app.waitFor("text:Filters", { state: "gone" });
});

test("an alert reports its action", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Alert dialog");
  await app.press("text:Delete message");
  expect(app.shows("text:Delete this message?")).toBe(true);
  await app.press("text:Delete");
  expect(app.shows("text:Result: delete")).toBe(true);
});

test("a switch in a demo toggles", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Switch");
  expect(app.shows("text:Wi-Fi on · Bluetooth off")).toBe(true);
  await app.press("role:switch[Wi-Fi]");
  expect(app.shows("text:Wi-Fi off · Bluetooth off")).toBe(true);
});

test("the segmented control and the tab bar report their choice", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Segmented control");
  await app.press("text:Week");
  expect(app.shows("text:week")).toBe(true);
  await app.press("text:‹ All components");
  await app.press("text:Tab bar");
  await app.press("text:Saved");
  expect(app.shows("text:saved")).toBe(true);
});

test("swiping a row reveals its actions and archives it", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Swipe actions");
  expect(app.shows("text:Studio")).toBe(true);
  await app.drag("text:Studio", { x: -180, y: 0 });
  await app.press("text:Archive >> nth=1");
  await app.waitFor("text:Studio", { state: "gone" });
});

test("refresh runs and the page reports it", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Pull to refresh");
  await app.press("text:Refresh now");
  await app.waitFor("text:Refreshed 1 times", { timeout: 4000 });
});

test("the code sample copies as it is", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Button");
  await app.press("label:Copy");
  expect(app.clipboard()?.startsWith("import { Button } from \"cupertino\";")).toBe(true);
});

test("previous and next open the neighbour page", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "en" }) } });
  await app.press("text:Button");
  await app.press("text:Next ›");
  expect(app.shows("text:Text field")).toBe(true);
  await app.press("text:‹ Previous");
  expect(app.shows("text:Button")).toBe(true);
});

test("the language switch translates the site", async () => {
  const app = await open("./App.tsx", { storage: { "site.prefs": JSON.stringify({ language: "zh" }) } });
  expect(app.shows("text:可交互演示")).toBe(true);
  await app.press("text:面板");
  expect(app.shows("text:API")).toBe(true);
  expect(app.shows("text:属性")).toBe(true);
});

test("the contrast and frame controls are kept", async () => {
  const app = await open("./App.tsx");
  await app.press("label:Settings");
  await app.press("role:switch[High contrast]");
  const prefs = () => JSON.parse(app.storage()["site.prefs"] ?? "{}");
  expect(prefs().contrast).toBe("high");
  await app.press("label:Settings");
  await app.press("text:Button");
  await app.press("label:Settings");
  await app.press("role:switch[Phone frame]");
  expect(prefs().frame).toBe(true);
});
