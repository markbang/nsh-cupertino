// The context menu is opened from a row inside the page's scroll view: its
// lifted preview must be the view under the finger, above the trigger and the
// page text (NSH's Overlay paints above scroll content). A press on the preview
// reaches it only when it is above the trigger; the page reports it.
import { expect, open, test } from "nsh/test";

for (const scheme of ["light", "dark"] as const) {
  test(`a context menu opened in a scroll view is hit-testable above the page, ${scheme}`, async () => {
    const app = await open("./App.tsx", {
      storage: { "cupertino.page": "contextmenu" },
      colorScheme: scheme,
      platform: "web",
    });
    await app.rightClick("text:Hold here for the menu");
    expect(app.shows("text:Reply")).toBe(true);
    await app.press("id:context-preview");
    expect(app.texts()).toContain("Preview pressed.");
  });
}
