// The overlays and controls of wave B: open, choose, and report what the
// page owns, through the same paths a finger or the keyboard takes.
import { expect, open, test } from "nsh/test";

test("a sheet opens on a detent and closes from its Done", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "sheet" } });
  await app.press("text:Open at medium");
  expect(app.shows("text:Unread")).toBe(true);
  await app.press("text:Done");
  expect(app.texts()).toContain("Closed from Done.");
});

test("a sheet is a card at most 640 pt wide on a wide window", async () => {
  const app = await open("./App.tsx", {
    storage: { "cupertino.page": "sheet" },
    platform: "linux",
    width: 1920,
    height: 1080,
  });
  await app.press("text:Open at large");
  await app.waitFor("text:Unread");
  await app.press("text:Done");
  await app.waitFor("text:Panel width");
  const measured = app.texts().find((text) => /^\d+ pt$/.test(text));
  expect(measured).toBe("640 pt");
});

test("an action sheet reports the action and cancels", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "actionsheet" } });
  await app.press("text:Show action sheet");
  expect(app.shows("text:Forward")).toBe(true);
  await app.press("text:Delete");
  expect(app.texts()).toContain("Action: delete");
  await app.press("text:Show action sheet");
  await app.press("text:Cancel");
  expect(app.texts()).toContain("Cancelled.");
});

test("an alert answers with its button and a typed name", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "alert" } });
  await app.press("text:Delete this message?");
  await app.press("text:Delete");
  expect(app.texts()).toContain("Alert: delete");
  await app.wait(400);
  await app.press("text:Rename the folder");
  await app.clear("label:Folder name");
  await app.type("label:Folder name", "Invoices");
  await app.press("text:Save");
  expect(app.texts()).toContain("save: Invoices");
});

test("a context menu chooses from its items", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "contextmenu" }, platform: "web" });
  await app.rightClick("text:Hold here for the menu");
  expect(app.shows("text:Flag")).toBe(true);
  await app.press("text:Flag");
  expect(app.texts()).toContain("Chose flag.");
});

test("a segment and a tab report their value", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "segmented" } });
  await app.press("text:Month");
  expect(app.texts()).toContain("month");
  await app.press("text:XL");
  expect(app.texts()).toContain("xl");
});

test("the tab bar switches the page", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "tabbar" } });
  await app.press("text:Flagged");
  expect(app.texts()).toContain("flagged");
});

test("a date picker picks a day", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "datepicker" } });
  await app.press("text:20");
  expect(app.texts()).toContain("2026-11-20");
  await app.press("label:Next month");
  expect(app.texts()).toContain("December 2026");
});

test("a slider follows a drag", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "slider" } });
  const before = app.texts().find((text) => text.endsWith(" %"));
  await app.drag("label:Volume slider", { x: -80, y: 0 });
  const after = app.texts().find((text) => text.endsWith(" %"));
  expect(after).not.toBe(before);
});

test("a swipe reveals its actions and a full swipe fires one", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "swipe" } });
  await app.drag("text:Ada Lovelace", { x: -140, y: 0 });
  await app.press("text:Flag");
  expect(app.texts()).toContain("Action flag.");
});
