# nsh-cupertino

[简体中文](README.zh-CN.md)

**[Documentation site: markbang.github.io/nsh-cupertino](https://markbang.github.io/nsh-cupertino/)** —
every component with a live demo, the TSX that draws it and the props it takes.

A Cupertino (iOS) design system for [Native Shell](https://nsh.dev) apps: Apple's
semantic colors, type scale and metrics as tokens, and the components iOS draws
settings and detail screens with — navigation bars, inset grouped lists, buttons,
text and search fields, switches and the activity indicator.

- **Tokens first.** One source of truth (`src/tokens.rs`) generates
  `theme/theme.json`, so Rust components, TSX classes (`bg-system-blue`,
  `text-secondary-label`) and `token()` read the same values.
- **Light, dark and high contrast.** Every role carries Apple's four values;
  `<Theme>` swaps in the high-contrast set at run time.
- **A port, not an impression.** Sizes, colors, motion and interaction details
  come from Flutter's official `cupertino_ui` 1.1.6, component by component;
  `NOTICE` lists what was taken from where.
- **Liquid Glass on the floating layer.** `Glass`, `GlassButton` and
  `GlassGroup` draw Apple's iOS 26 material with a shader — the backdrop is
  refracted through the rim, blurred, tinted and given a specular rim — on bars,
  sheets, alerts and floating controls, with the material's fill and blur where
  there is no GPU ([`docs/components/glass.md`](docs/components/glass.md)).
- **Materials for the floating layer.** `regular`, `thin`, `ultra-thin`, `thick`
  and `chrome` glass fills with their blur, for bars that content scrolls under.
- **Native behavior.** The components are built on `nsh/base`'s behavior (presses,
  focus, keyboard, roles) and draw only the look, so VoiceOver, TalkBack, Tab,
  Space/Return and the Android back gesture keep working.
- **Checked by screenshots.** Every demo page is captured in light and dark from
  the web build on each pull request, the overlays open in both, and a pixel test
  looks for the separators in the rendered lists.
- **Verified on Android.** The material draws on a real Android device too: a CI
  emulator (API 34, SwiftShader) captures the glass pages in light and dark, the
  capsules and the sheet, and measures the lens on the calibration page
  ([the frames](https://github.com/markbang/nsh-cupertino/tree/screenshots/main)).
  The bar's glass has the page behind it: `NavPage` lays the bar over the
  scrolling content on every platform, so what the material samples is the page
  itself ([#16](https://github.com/markbang/nsh-cupertino/issues/16)).
- **One device pixel.** Every hairline is at least one device pixel at every
  display scale, so rows keep their separators at 1x as well as @3x.

Status: **0.4.2** — the tokens, the components settings screens need, the
overlays and controls of the rest of iOS, and Liquid Glass as a design
language: `Glass`, `GlassButton` and `GlassGroup` draw the material, `GlassTabBar`
is the floating capsule that minimises as you scroll, `NavPage` floats its
controls over a `ScrollEdge` gradient, and the material is tuned to iOS 27's
calibrated numbers and measured on Android as well as on the web.

## Install

Native Shell apps take the crate from git; there is no registry release yet.

```toml
# Cargo.toml
[dependencies]
nsh-cupertino = { git = "https://github.com/markbang/nsh-cupertino", tag = "v0.2.1" }
```

`nsh.json` lists the crate at its path and points `"theme"` at the theme file, so
TSX classes and `token()` have the tokens before the first component mounts:

```json
{
  "rust": ["../nsh-cupertino", "."],
  "theme": "../nsh-cupertino/theme/theme.json",
  "tailwind": {
    "radius": { "row": 10, "sheet": 14, "button": 12, "search": 9 }
  }
}
```

`theme/tailwind.json` is the same `"tailwind"` fragment for an app that also wants
`text-title2`-style size classes and `rounded-row`; a theme file cannot name
utilities, so those live there. `theme/theme.json` is generated: run
`cargo run --bin gen-theme` in this repository after changing `src/tokens.rs`.

## Use

TSX — the components come from the crate's `#[native_module("cupertino")]`:

```tsx
import { mount, signal } from "nsh";
import { List, ListTile, NavPage, Section, Switch, Theme } from "cupertino";

function App() {
  const wifi = signal(true);
  return (
    <Theme contrast="normal">
      <NavPage title="Settings" largeTitle="Settings" trailing="Done">
        <List scroll={false}>
          <Section header="Network" footer="Wi-fi joins the strongest network.">
            <ListTile title="Wi-Fi" subtitle={wifi() ? "On" : "Off"} accessory="none" separator />
            <ListTile
              title="Bluetooth"
              leading="slider.horizontal.3"
              leadingColor="system-blue"
              accessory="chevron"
              separator={false}
            />
          </Section>
          <Section header="Switches">
            <Switch checked={wifi()} label="Wi-Fi" onChange={(on: boolean) => wifi.set(on)} />
          </Section>
        </List>
      </NavPage>
    </Theme>
  );
}

mount(App);
```

Rust — the same components as builders, every prop a typed setter:

```rust
use nsh_core::prelude::*;
use nsh_cupertino::{list, list_tile, section, theme, Theme};

#[component]
pub fn Settings() -> impl IntoElement {
    theme().contrast("normal").child(
        list().scroll(false).child(
            section().header("Network").child(
                list_tile().title("Wi-Fi").subtitle("On").accessory("none"),
            ),
        ),
    )
}
```

## Components

| Component | What it is |
| --- | --- |
| [`NavPage`](docs/components/navigation-bar.md) | A page: bar over a scroll view whose large title collapses into the bar |
| [`NavigationBar`](docs/components/navigation-bar.md) | The bar on its own: title, large title, back button, trailing actions |
| [`List`](docs/components/list.md) | A scrolling page of grouped sections, `systemGroupedBackground` |
| [`Section`](docs/components/list.md) | A group of rows on one 10 pt surface, with header and footer |
| [`ListTile`](docs/components/list.md) | A 44 pt row: title, subtitle, leading icon, chevron or checkmark |
| [`Button`](docs/components/button.md) | Filled, secondary, danger, tinted, plain and destructive; a loading state; three sizes |
| [`TextField`](docs/components/text-field.md) | A rounded grouped field: clear, secure, leading icon, keyboards |
| [`SearchField`](docs/components/search-field.md) | iOS's search field: a 44 pt capsule, magnifier, clear, Cancel |
| [`Switch`](docs/components/switch.md) | 63 × 28, green when on, a 37 × 24 thumb, 200 ms |
| [`FilterChip`](docs/components/filter-chip.md) | A capsule a list filters by: a label, a count, the tint when chosen |
| [`StatusPill`](docs/components/status-pill.md) | A dot and a label on a soft tone: neutral, success, warning, danger, info |
| [`EmptyState`](docs/components/empty-state.md) | An illustration, a badge, a headline, a description and a plain action |
| [`ErrorBanner`](docs/components/error-banner.md) | An inline failure on a soft danger fill, with a retry button |
| [`Skeleton`](docs/components/skeleton.md) | Grey rows that hold a list's place while it loads |
| [`Toast`](docs/components/toast.md) | A short confirmation or failure on a floating card, with an optional action, swiped away and stacked in a `ToastLayer` |
| [`ActivityIndicator`](docs/components/activity-indicator.md) | Eight blades fading in turn, drawn natively |
| [`ScrollView`](docs/components/scroll-view.md) | Bouncing scroll with the platform's indicator and keyboard behavior |
| [`Sheet`](docs/components/sheet.md) | A bottom panel with medium and large detents and a grabber |
| [`ActionSheet`](docs/components/action-sheet.md) | Actions and a cancel button in 10 pt groups |
| [`AlertDialog`](docs/components/alert-dialog.md) | iOS's alert, with buttons and a text field |
| [`ContextMenu`](docs/components/context-menu.md) | A long-press / right-click menu with a lifted preview |
| [`GlassMenu`](docs/components/glass-menu.md) | A glass button whose shape grows into its menu, anchored on phones too |
| [`Picker`](docs/components/picker.md) | A snapping wheel that fades its edges |
| [`DatePicker`](docs/components/date-picker.md) | A calendar, a compact trigger and a month/day/year wheel |
| [`SegmentedControl`](docs/components/segmented-control.md) | A 32 pt capsule track with a sliding thumb, 2–5 segments |
| [`Slider`](docs/components/slider.md) | A 28 pt thumb on a tinted rail, with tick marks |
| [`TabBar`](docs/components/tab-bar.md) | A 49 pt bar of icons, labels and badges |
| [`SwipeRow`](docs/components/swipe-actions.md) | Leading and trailing actions behind a row |
| [`RefreshView`](docs/components/refresh.md) | A scroll view whose pull drops an activity indicator |
| [`Theme`](docs/components/theme.md) | Installs the tokens; switches to the high-contrast values |
| [`Glass`](docs/components/glass.md), `GlassButton`, `GlassGroup` | Liquid Glass: the shader material of the floating layer, its variants, its grouping and its fallback |
| `Icon` | [`icon`](docs/components/icon.md) / `iconStroke`, NSH's stand-in for SF Symbols |

Screenshots of every demo page, light and dark, live on the `screenshots` branch
and are attached to each release.

## Theming

`src/tokens.rs` holds:

- **Colors** — Apple's semantic roles (`system-background`,
  `secondary-system-grouped-background`, `label`, `secondary-label`, `separator`,
  `fill`, `system-blue` … `system-indigo`), each with light, dark and
  high-contrast values, plus the shadcn aliases (`background`, `foreground`,
  `primary`, …) that `nsh/base` and NSH's own classes read.
- **Type** — `largeTitle` 34/41, `title1` 28/34, `title2` 22/28, `title3` 20/25,
  `headline` 17/22 semibold, `body` 17/22, `callout` 16/21, `subheadline` 15/20,
  `footnote` 13/18, `caption1` 12/16, `caption2` 11/13.
- **Layout** — 4/8/12/16/20/24 spacing, 44 pt touch target, 10/14/12/9 pt radii,
  a 0.33 pt hairline, the navigation bar's 44 + 52 pt.
- **Motion** — page push spring 0.86 damping / 300 stiffness, sheet 1.0 / 280 (critical),
  pressed opacity 0.4, pressed scale 0.97, 120 / 180 / 200 / 300 / 500 ms
  durations, and the spinner's one turn per second in eight steps.
- **Materials** — `ultra-thin`, `thin`, `regular`, `thick` and `chrome`: a fill
  per appearance (more opaque in high contrast) and a 20–30 pt blur, for the
  floating layer only.

`<Theme contrast="high">` clones the app's tokens, sets every role and alias to its
increased-contrast value for the current appearance, and installs them with
`set_tokens`; `"normal"` puts the app's own back. Reading a color through the
`tokens::` functions (`tokens::label()`) is reactive, so the whole UI follows in
both directions. Appearance itself follows the system (`setColorScheme` / the
`appearance` key), and the platform's own controls follow with it.

Apps that set their own theme keep it: `Theme` only fills in the tokens the app
leaves out, and sets the contrast variants of the ones it defines.

## Accessibility

- Every `ListTile` is a button whose name is its title and subtitle; `disabled`
  and `checked` reach the screen reader.
- Buttons and icon-only controls always have a name (`Button`'s `label`, the
  fields' clear and reveal buttons' fixed labels: "Clear text", "Hide text").
- Headings are headers (`large title` level 1, section headers level 2), sections
  are groups, lists are lists, the spinner is a progress indicator.
- Tab reaches every control with a visible ring (`focus-visible`), Space/Return
  presses, Escape and the Android back gesture go back — provided by `nsh/base`,
  not reimplemented here.
- Text follows the user's text size (`fontScale`); `ActivityIndicator` honours
  reduced motion with a still frame, and the components' transitions are
  short enough not to need a separate path.
- The Android back gesture stays the platform's: the components register no back
  handler, so a page never swallows it. An app that keeps its own history wires
  the gesture to it in one place (`onBackPress` on its root, or a `NavStack`
  page's `on_dismiss`).

## The site

<https://markbang.github.io/nsh-cupertino/> is this crate documenting itself:
`site/` is a Native Shell app that draws every screen with the components it
documents, so what the page shows is the library running.

- The home grid lists all 25 components; each has a page with a demo you can
  press, drag and swipe, the TSX that draws it (with a copy button), and the
  prop table generated from `docs/components/*.md` by `tools/site-api.mjs` — the
docs are the source, so the site cannot drift from them.
- The bar carries the global controls: light / dark / system, Liquid Glass on or
  off, high contrast, the text size, a phone frame, and English / 中文.
- Every page is a hash route (`#/sheet`), so a link to one can be shared, and
  the browser's back and forward move between pages.
- It is a static site under GitHub Pages, deployed from `main` by
  `.github/workflows/pages.yml`.

Measured on the deployed site in headless Chrome 155 over the DevTools
protocol: cache disabled and cleared before every load, one tab, 1440 × 900, a
fresh browser profile for the first-visit figure (three of them) and five
reloads on an open connection. `node tools/site-check.mjs --url
https://markbang.github.io/nsh-cupertino/` repeats the checks and prints the
numbers.

| Home, cold cache | |
| --- | --- |
| First contentful paint, first visit | 0.55 s |
| First contentful paint, reload | 0.18 s |
| First-load transfer | 2.64 MB in 20 requests |

Most of that is the web runtime: `nsh.<digest>.wasm` is 6.6 MB uncompressed,
2.46 MB of it gzipped. The other pages are routes inside the same runtime and
cost nothing extra.

## Development

```sh
cargo run --bin gen-theme        # rewrite theme/*.json from src/tokens.rs
cargo test                       # the committed theme files match the tokens
cd examples/demo
nsh check                        # cargo check + tsc against the generated types
nsh test                         # headless behavior tests
nsh run                          # the demo on this machine
cd ../.. && tools/shots.sh       # captures docs/screenshots/*.png from the web build

cd site                          # the documentation site
nsh run --target web             # it on http://127.0.0.1:4173/nsh-cupertino/
nsh test                         # its behavior: routes, controls, demos
node ../tools/site-api.mjs       # regenerate site/src/api.ts from docs/components/
cd .. && node tools/site-check.mjs --url http://127.0.0.1:4173/nsh-cupertino/
```

CI (`.github/workflows/ci.yml`): fmt, clippy `-D warnings`, tests, the theme
drift check, `nsh check` + `nsh test` of the demo, the web package, a screenshot
job that publishes the captures to the `screenshots` branch, and the site's own
check, tests, web build and headless run. `pages.yml` deploys the site to GitHub
Pages on every push to `main` and on every tag.

## License

MIT OR Apache-2.0, at your option (see `LICENSE-MIT`, `LICENSE-APACHE`).
`NOTICE` records what was taken from Flutter's `cupertino_ui` (BSD-3-Clause),
Lenso UI (MIT) and Framework7 (MIT), and what is Apple's guidance read as a
principle.
