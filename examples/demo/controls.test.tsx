// The catalog's controls page, as Cohub Mobile's `catalog-controls` snapshot
// frames it: 402 × 874 pt, a status bar's 59 pt above the bar, under the
// cohub preset. `tools/controls-shot.sh` runs it at the reference's scale
// (720 × 1565 px) and writes `docs/screenshots/catalog-controls-<scheme>.png`.
import { open, test } from "nsh/test";

const DIR = "../../docs/screenshots";

for (const scheme of ["light", "dark"] as const) {
  test(`catalog controls, ${scheme}`, async () => {
    const app = await open("./App.tsx", {
      storage: { "cupertino.page": "controls", "cupertino.preset": "cohub" },
      colorScheme: scheme,
      width: 402,
      height: 918,

    });
    try {
      await app.wait(300);
      await app.screenshot(`${DIR}/catalog-controls-${scheme}.png`);
    } catch (error) {
      console.warn(`no screenshot of the controls (${scheme}):`, error);
    }
  });
}
