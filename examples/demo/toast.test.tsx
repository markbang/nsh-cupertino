// The toast stack's gestures, through the path a finger takes: a swipe past
// 56 pt takes the front toast away (and the layer with it), a shorter one
// springs it back.
import { expect, open, test } from "nsh/test";

test("a swipe past the threshold dismisses the front toast", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "states" } });
  expect(app.shows("text:Could not send")).toBe(true);
  await app.drag("text:Could not send", { x: -120, y: 0 });
  await app.wait(500);
  expect(app.shows("text:Could not send")).toBe(false);
});

test("a short swipe springs the front toast back", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "states" } });
  await app.drag("text:Could not send", { x: -20, y: 0 });
  await app.wait(500);
  expect(app.shows("text:Could not send")).toBe(true);
});

// The states page's stack on a manual clock: the neutral card leaves at 3.2 s, the danger card (with an action)
// at 5 s; each fades for 240 ms and is taken out of the layer when it expires.
test("the toasts leave when their time runs out", async () => {
  const app = await open("./App.tsx", { storage: { "cupertino.page": "states" }, clock: {} });
  expect(app.shows("text:Saved to Files")).toBe(true);
  await app.wait(3500);
  expect(app.shows("text:Saved to Files")).toBe(false);
  expect(app.shows("text:Could not send")).toBe(true);
  await app.wait(2000);
  expect(app.shows("text:Could not send")).toBe(false);
});
