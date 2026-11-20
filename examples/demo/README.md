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

Deep links: seed the app's storage with `cupertino.page` (`gallery`,
`navigation`, `lists`, `buttons`, `textfields`, `search`, `switches`,
`indicators`, `scroll`, `materials`, `colors`, `type`, `sheet`, `actionsheet`,
`alert`, `contextmenu`, `picker`, `datepicker`, `segmented`, `slider`, `tabbar`,
`swipe`, `refresh`, `bar-materials`, `controls`, `rows`), `cupertino.overlay` (`sheet`,
`actionsheet`, `alert`) to open an overlay on landing, `cupertino.contrast`
(`normal`, `high`) and `cupertino.appearance` (`light`, `dark`, `system`).
