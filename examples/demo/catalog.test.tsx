// The catalog's pages, as Cohub Mobile's `catalog-controls` and `catalog-rows`
// snapshots frame them: 402 × 874 pt, a status bar's 59 pt above the bar, under
// the cohub preset. `tools/catalog-shot.sh` runs it at the reference's scale
// (720 × 1565 px) and writes `docs/screenshots/catalog-<page>-<scheme>.png`.
import { open, test } from "nsh/test";

const DIR = "../../docs/screenshots";

for (const page of ["controls", "rows"] as const) {
  for (const scheme of ["light", "dark"] as const) {
    test(`catalog ${page}, ${scheme}`, async () => {
      const app = await open("./App.tsx", {
        storage: { "cupertino.page": page, "cupertino.preset": "cohub" },
        colorScheme: scheme,
        width: 402,
        height: 918,
      });
      try {
        await app.wait(300);
        await app.screenshot(`${DIR}/catalog-${page}-${scheme}.png`);
      } catch (error) {
        console.warn(`no screenshot of the ${page} catalog (${scheme}):`, error);
      }
    });
  }
}
