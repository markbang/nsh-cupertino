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
];

const SCHEMES = ["light", "dark"] as const;

async function shoot(page: string, scheme: "light" | "dark", contrast: string) {
  const app = await open("./App.tsx", {
    storage: { "cupertino.page": page, "cupertino.contrast": contrast },
    colorScheme: scheme,
    width: 390,
    height: 844,
  });
  try {
    await app.screenshot(`../../docs/screenshots/${page}-${scheme}${contrast === "high" ? "-contrast" : ""}.png`);
  } catch {
    // Headless draws nothing: the web run writes the files.
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
}
