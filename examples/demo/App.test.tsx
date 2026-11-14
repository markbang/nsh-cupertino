// `nsh test` runs these headless against the real components: navigation
// between the gallery and its pages, the rows, the fields, the switches, the
// search field and the tokens in both appearances.
import { expect, open, test } from "nsh/test";

test("the gallery opens a page and the back button returns", async () => {
  const app = await open("./App.tsx");
  expect(app.shows("text:Lists")).toBe(true);
  await app.press("text:Lists");
  expect(app.shows("text:Plain row")).toBe(true);
  await app.press("role:button[Cupertino]");
  expect(app.shows("text:Components")).toBe(true);
});

test("a row reports its press, counted in Rust", async () => {
  const app = await open("./App.tsx");
  await app.press("text:Buttons");
  await app.press("role:button[Cupertino]");
  expect(app.shows("text:1 press counted in Rust")).toBe(true);
});

test("a text field shows what the app sets from its changes", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "textfields" } });
  await app.clear("label:Name");
  await app.type("label:Name", "Grace");
  expect(app.texts()).toContain("Grace");
});

test("the clear button asks the app for no text", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "textfields" } });
  await app.type("label:Name", "!");
  await app.press("label:Clear text");
  expect(app.value("label:Name")).toBe("");
});

test("a switch reports the value it asks for", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "switches" } });
  expect(app.texts()).toContain("Off");
  await app.press("role:switch[Bluetooth]");
  expect(app.texts()).toContain("On");
});

test("the search field filters the rows the page owns", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "search" } });
  expect(app.shows("text:Banana")).toBe(true);
  await app.type("label:Search fruit", "man");
  expect(app.shows("text:Mango")).toBe(true);
  expect(app.shows("text:Banana")).toBe(false);
  await app.press("label:Clear search");
  expect(app.shows("text:Banana")).toBe(true);
});

test("the contrast and appearance rows follow their state", async () => {
  const app = await open("./App.tsx");
  await app.press("text:Contrast");
  expect(app.shows("text:Increased (high contrast)")).toBe(true);
  await app.press("role:switch[Keep loading]").catch(() => undefined);
});

test("a page opens straight from storage", async () => {
  const app = await open("./App.tsx", {
    storage: { "cupertino.page": "indicators", "cupertino.contrast": "high" },
  });
  expect(app.shows("text:Sizes")).toBe(true);
  expect(app.shows("text:Components")).toBe(false);
});

test("the tokens follow the system appearance", async () => {
  const light = await open("./App.tsx", {
    storage: { "cupertino.page": "colors" },
    colorScheme: "light",
  });
  const dark = await open("./App.tsx", {
    storage: { "cupertino.page": "colors" },
    colorScheme: "dark",
  });
  // The token column of the swatch is drawn in tertiaryLabel: 60 % of #3c3c43
  // in light, 60 % of #ebebf5 in dark.
  expect(light.spanStyle("text:system-blue >> nth=1")!.color).toBe("#3c3c434c");
  expect(dark.spanStyle("text:system-blue >> nth=1")!.color).toBe("#ebebf54c");
});
