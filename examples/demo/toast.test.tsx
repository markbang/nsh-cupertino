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
