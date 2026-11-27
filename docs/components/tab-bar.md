[简体中文](tab-bar.zh-CN.md)

# Tab bar

A 49 pt bar over the safe area, one tab per destination: a 25 pt icon, a 10 pt
label, the chosen one in the tint, and an optional badge over its icon.

| | |
| --- | --- |
| Light | ![Tab bar, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/tabbar-light.png) |
| Dark | ![Tab bar, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/tabbar-dark.png) |

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `items` | `.items(..)` | `TabItem[]` | `[]` | The tabs, in order |
| `value` | `.value(..)` | `string` | first | Chosen value, controlled |
| `defaultValue` | `.default_value(..)` | `string` | first | At first |
| `blur` | `.blur(..)` | `boolean` | `true` | The material behind it |
| `label` | `.label(..)` | `string` | `"Tabs"` | The bar's name |

`TabItem`: `{ value, title, icon?, badge? }`; `badge` is text ("3", "99+") or
`"dot"`.

Events: `onChange(value, index)`.

Notes

- The bar is a material: the `regular` material: its translucent fill over a 25 pt backdrop blur,
  with a one-device-pixel hairline on top. The page can scroll under it.
- Linux and GPUI draw no backdrop blur; there the material's translucent fill alone keeps
  the bar readable — the same fallback iOS uses with Reduce Transparency.
- Unchosen tabs are `systemGray`; the chosen one is `systemBlue`. Badges are
  red, 17 pt tall pills, and a dot is 9 pt.

## Accessibility

- The bar is a tab list and each tab a button, selected when chosen, named by
  its label; Tab reaches them, Return or Space activates one.
- A badge's count is part of the tab's name.

## Motion

The selection color changes over 150 ms; no layout moves. Reduce Motion needs
no separate path.

## Glass bar

`GlassTabBar` is iOS 26's tab bar: an inset capsule of glass floating over the
content, not an edge-to-edge band.

```tsx
<GlassTabBar
  items={tabs}
  value={tab()}
  scrollOffset={offset()}
  behavior="on-scroll-down"
  onChange={(event) => tab.set(event.value)}
/>
```

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `items` | `TabItem[]` | | Value, title, icon and badge per tab. |
| `value` / `defaultValue` | string | | The chosen tab (controlled) or its first value. |
| `behavior` | `"on-scroll-down" \| "on-scroll-up" \| "never"` | `"on-scroll-down"` | UIKit's `MinimizeBehavior`: minimise on the way down and expand on the way up. |
| `scrollOffset` | number | | The page's offset, fed from its `onScroll`; without it the bar never minimises. |
| `minimized` | boolean | | Forces the state while set. |
| `morph` | number | | Pins the minimise progress (0 bar, 1 pill) while set, for stills of the morph. |
| `material` | `"glass" \| "material" \| "single-blur"` | `"glass"` | The shader, the blur-only fill, or the shader's one-disc body without the web's two-scale layers (for comparing them). |
| `onChange` | `{ value, index }` | | Another tab was chosen. |

Shape and motion: 64 pt tall, radius 32, 20 pt from the sides and 12 pt above the
home indicator, 27.5 pt icons and 10 pt labels. iOS 27's bar measures 62 pt, radius 31,
21 pt from the sides; ours stays 2 pt taller. The chosen tab has a capsule of
its own. A downward scroll of 20 pt minimises the bar into a 50 pt pill around
that tab, an upward scroll of 12 pt expands it, the top of the page always
expands it, content shorter than 40 pt never minimises, and the spring is
damping 0.78 / stiffness 340. Place it in the page's root view (it positions
itself) and leave room at the bottom of the content.

The edge-to-edge `TabBar` above stays for pages that want a bar flush with the
screen's bottom.

The minimised pill is a picture of the chosen tab: its icon and its position
follow the live selection (it springs to the new slot when the tab changes while
minimised), and it takes no touches, so tapping the chosen tab still reaches the
tab underneath.

The body is iOS 27's measured two-scale material on the web: a 0.625 pt ghost and
an 18 pt frost as two CSS backdrop layers under the shader, which draws the tint
and the rim over them (`tokens::bar`; `tools/tab-bar-pixels.mjs` checks it against
the iOS frames in CI). As the bar minimises the layers fade out and the shader
body takes over. The native builds draw the shader's one-disc body. With
`prefers-reduced-transparency: reduce` (web) the bar is opaque: the shade it has
over an empty page, read when the bar is built.
Increased contrast keeps the shader's own body: the near-opaque `glass-regular` is
not the measured tint, and CI checks that no layers draw then.
