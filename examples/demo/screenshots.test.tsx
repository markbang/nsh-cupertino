// Screenshots of every demo page, light and dark, for the docs and the release.
//
// They need a platform that draws: run this file with `--target web`
// (`nsh test screenshots.test.tsx --target web`). Headless, a screenshot has no
// picture to take, so these tests pass without writing — CI asserts the files
// after the web run (`tools/check-screenshots.sh`).
import { open, test } from "nsh/test";

const PAGES = [
  "gallery",
  "navigation",
  "lists",
  "buttons",
  "textfields",
  "search",
  "switches",
  "indicators",
  "scroll",
  "colors",
  "type",
  "sheet",
  "actionsheet",
  "alert",
  "contextmenu",
  "picker",
  "datepicker",
  "segmented",
  "slider",
  "tabbar",
  "swipe",
  "refresh",
  "materials",
  "glass",
  "bar-materials",
];

const SCHEMES = ["light", "dark"] as const;

const DIR = "../../docs/screenshots";

async function shoot(page: string, scheme: "light" | "dark", contrast: string) {
  const app = await open("./App.tsx", {
    storage: { "cupertino.page": page, "cupertino.contrast": contrast },
    colorScheme: scheme,
    width: 390,
    height: 844,
  });
  try {
    await app.screenshot(`${DIR}/${page}-${scheme}${contrast === "high" ? "-contrast" : ""}.png`);
  } catch (error) {
    // Headless draws nothing, so the run passes without writing; the web run
    // writes, and `tools/check-screenshots.sh` fails when a file is missing.
    console.warn(`no screenshot of ${page} (${scheme}):`, error);
  }
}

for (const page of PAGES) {
  for (const scheme of SCHEMES) {
    test(`${page}, ${scheme}`, async () => {
      await shoot(page, scheme, "normal");
    });
  }
}

for (const scheme of SCHEMES) {
  test(`gallery, ${scheme}, increased contrast`, async () => {
    await shoot("gallery", scheme, "high");
  });
  test(`glass, ${scheme}, increased contrast`, async () => {
    await shoot("glass", scheme, "high");
  });
}

const OVERLAYS = ["sheet", "actionsheet", "alert", "contextmenu"];

async function shootOverlay(page: string, scheme: "light" | "dark") {
  const app = await open("./App.tsx", {
    storage: { "cupertino.page": page, "cupertino.overlay": page },
    colorScheme: scheme,
    width: 390,
    height: 844,
  });
  try {
    // A context menu is opened where the finger is, as it is in use.
    if (page === "contextmenu") {
      await app.rightClick("text:Hold here for the menu");
    }
    // The entrance spring settles before the capture.
    await app.wait(700);
    await app.screenshot(`${DIR}/${page}-open-${scheme}.png`);
  } catch (error) {
    console.warn(`no screenshot of ${page} open (${scheme}):`, error);
  }
}

for (const page of OVERLAYS) {
  for (const scheme of SCHEMES) {
    test(`${page}, open, ${scheme}`, async () => {
      await shootOverlay(page, scheme);
    });
  }
}
