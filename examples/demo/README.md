# Cupertino demo

One page per component of [`nsh-cupertino`](../..), plus a gallery index. The
app is TSX (`App.tsx`) over the crate; the gallery's rows and the press counter
are the app's own Rust half (`src/lib.rs`), so it shows both sides of the
boundary.

```sh
nsh check                                  # cargo check + tsc against the generated types
nsh test                                   # headless behavior tests (App.test.tsx, waveb.test.tsx)
../../tools/shots.sh                       # docs/screenshots, light and dark (from the repository root)
nsh run                                    # on this machine; --target ios, android, web, ...
```

The demo's face is Inter, the stand-in for the iOS reference's SF Pro (not shipped).
`fonts/` holds four weights of Inter 4.001 (SIL Open Font License, `fonts/OFL.txt`),
subset to Latin and punctuation with `pyftsubset --unicodes=U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2190-2193,U+2212,U+2215,U+FEFF,U+FFFD --layout-features='*' --name-IDs='*'`
from Cohub Mobile's `assets/fonts/Inter-*.ttf`. `nsh.json` maps `font-sans` to Inter.
When subsetting a font, keep name IDs 16 and 17 (the typographic family and subfamily, as `--name-IDs='*'` does): without them, medium and semibold silently render as regular and bold.
The command above reproduces the four files byte for byte from Cohub Mobile's assets (fontTools 4.68.0).

Deep links: seed the app's storage with `cupertino.page` (`gallery`,
`navigation`, `lists`, `buttons`, `textfields`, `search`, `switches`,
`indicators`, `scroll`, `materials`, `colors`, `type`, `sheet`, `actionsheet`,
`alert`, `contextmenu`, `picker`, `datepicker`, `segmented`, `slider`, `tabbar`,
`swipe`, `refresh`, `bar-materials`, `controls`, `rows`), `cupertino.overlay` (`sheet`,
`actionsheet`, `alert`) to open an overlay on landing, `cupertino.contrast`
(`normal`, `high`) and `cupertino.appearance` (`light`, `dark`, `system`).
