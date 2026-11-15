// The site's own controls: appearance, contrast, Dynamic Type, the phone
// frame and the language. They are kept in Storage, applied to the app (the
// theme, the color scheme, the runtime's text scale) and read by the chrome
// and the demo pages.
import { effect, host, setColorScheme, signal, Storage, windowSize } from "nsh";
import { language, type Lang } from "./i18n";

export type Appearance = "light" | "dark" | "auto";
export type Contrast = "normal" | "high";

const KEY = "site.prefs";
const loaded = signal(false);

export const appearance = signal<Appearance>("auto");
export const contrast = signal<Contrast>("normal");
export const typeScale = signal(1);
export const frame = signal(false);
export const frameTouched = signal(false);

interface Stored {
  appearance?: Appearance;
  contrast?: Contrast;
  typeScale?: number;
  frame?: boolean;
  frameTouched?: boolean;
  language?: Lang;
}

void Storage.getItem(KEY)
  .then((raw) => {
    if (raw) {
      try {
        const prefs = JSON.parse(raw) as Stored;
        if (prefs.appearance) appearance.set(prefs.appearance);
        if (prefs.contrast) contrast.set(prefs.contrast);
        if (typeof prefs.typeScale === "number") typeScale.set(prefs.typeScale);
        if (typeof prefs.frame === "boolean") frame.set(prefs.frame);
        if (typeof prefs.frameTouched === "boolean") frameTouched.set(prefs.frameTouched);
        if (prefs.language) language.set(prefs.language);
      } catch {
        // A damaged value starts the site at its defaults.
      }
    }
    loaded.set(true);
  })
  .catch(() => loaded.set(true));

export function resetPreferences() {
  appearance.set("auto");
  contrast.set("normal");
  typeScale.set(1);
  frameTouched.set(false);
  frame.set(defaultFrame());
  language.set("en");
}

/** Wide enough, and tall enough, for a phone-sized frame beside the content. */
export function wide(): boolean {
  return windowSize().width >= 1000;
}

function defaultFrame(): boolean {
  const size = windowSize();
  return size.width >= 1000 && size.height >= 780;
}

// Without a stored choice the frame follows the window: on when it fits, off
// on a phone. The user's toggle wins from then on.
effect(() => {
  if (loaded() || frameTouched()) return;
  frame.set(defaultFrame());
});

effect(() => {
  if (!loaded()) return;
  const prefs: Stored = {
    appearance: appearance(),
    contrast: contrast(),
    typeScale: typeScale(),
    frame: frame(),
    frameTouched: frameTouched(),
    language: language(),
  };
  void Storage.setItem(KEY, JSON.stringify(prefs)).catch(() => {});
});

effect(() => {
  const now = appearance();
  setColorScheme(now === "auto" ? "system" : now === "light" ? "light" : "dark");
});

effect(() => {
  void host.call("site.fontScale", { scale: typeScale() }).catch(() => {});
});

effect(() => {
  void host.call("site.locale", { language: language() }).catch(() => {});
});
