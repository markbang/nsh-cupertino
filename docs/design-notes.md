# Design notes: where the numbers come from

This crate copies iOS's look rather than inventing one. Every color, size and
duration below was read from a primary source, not from memory.

## Colors

`src/tokens.rs` carries Apple's semantic colors in four appearances (light, dark,
light high contrast, dark high contrast). The values are the ones
`cupertino_ui/lib/src/colors.dart` in
[`flutter/packages`](https://github.com/flutter/packages/tree/main/packages/cupertino_ui)
uses, which are UIKit's `UIColor.systemBackground`, `UIColor.label`,
`UIColor.systemBlue` and friends — e.g. systemBlue `#007aff` light / `#0a84ff`
dark / `#0040dd` light high contrast / `#409cff` dark high contrast.

The published sources for those roles:

- [Color](https://developer.apple.com/design/human-interface-guidelines/color) —
  semantic colors over fixed palettes.
- [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode) —
  a dark variant per semantic color, not an inverted one.
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility) —
  increased contrast variants.
- [UIColor](https://developer.apple.com/documentation/uikit/uicolor) — the
  documented roles (`systemGroupedBackground`, `secondarySystemGroupedBackground`,
  `separator`, `opaqueSeparator`, `systemFill` …).

Apple publishes no hex values; the file above is the transcription the Flutter
team checked against the iOS UI kits, which is the closest primary reference
outside Apple's own (Figma) design resources.

## Type

`text_theme.dart` (`_kDefaultTextStyle` and the themed styles) plus iOS 17's
typography:

| Style | Size / line height | Weight | Tracking |
| --- | --- | --- | --- |
| Large title | 34 / 41 | 700 | +0.38 |
| Title 1 | 28 / 34 | 400 | +0.36 |
| Title 2 | 22 / 28 | 400 | +0.35 |
| Title 3 | 20 / 25 | 400 | +0.38 |
| Headline | 17 / 22 | 600 | −0.41 |
| Body | 17 / 22 | 400 | −0.41 |
| Callout | 16 / 21 | 400 | −0.32 |
| Subheadline | 15 / 20 | 400 | −0.24 |
| Footnote | 13 / 18 | 400 | −0.08 |
| Caption 1 | 12 / 16 | 400 | 0 |
| Caption 2 | 11 / 13 | 400 | +0.07 |

Total line heights (not multipliers) are what iOS uses, and NSH's `lineHeight` is
in points too, so the table transfers unchanged. See
[Typography](https://developer.apple.com/design/human-interface-guidelines/typography).

## Metrics

| What | Value | Source |
| --- | --- | --- |
| Minimum touch target | 44 × 44 pt | `kMinInteractiveDimensionCupertino`; HIG [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| Navigation bar height | 44 pt, 16 pt side padding, 8 pt bottom padding | `nav_bar.dart` (`_kNavBarPersistentHeight`, `_kNavBarEdgePadding`, `_kNavBarBottomPadding`) |
| Large title block | +52 pt | `_kNavBarLargeTitleHeightExtension` |
| Compact title take-over | over the last 10 pt | `_kNavBarShowLargeTitleThreshold` / `_kNavBarScrollUnderAnimationExtent` |
| Back button hit width | 50 pt | `_kNavBarBackButtonTapWidth` |
| Grouped row radius | 10 pt (continuous) | `list_section.dart` (`_kDefaultInsetGroupedBorderRadius`) |
| Section top margin | 22 pt | `_kMarginTop` |
| Row insets | 20 pt leading, 14 pt trailing | `list_tile.dart` (`_kPadding`) |
| Row minimum height | 44 pt (48 with a subtitle) | `_kMinHeight`, `_kMinHeightWithSubtitle` |
| Leading icon box | 28 pt, 16 pt to the title | `_kLeadingSize`, `_kLeadingToTitle` |
| Separator inset | 20 pt, or 20 + 28 + 16 with an icon | `_kInsetDividerMargin` + leading |
| Hairline | 0.33 pt (1 device pixel at @3x) | HIG [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| Switch | 51 × 31 pt track, 27 pt thumb, 20 pt travel | `switch.dart` (`_kTrackWidth`, `_kTrackHeight`, `_kThumbRadius`) |
| Search field | 36 pt tall, 9 pt radius | `search_field.dart` (`_kSearchFieldHeight` via `nav_bar.dart`, `_kDefaultBorderRadius`) |
| Button paddings | large 16 × 20, medium 10 × 15, small 6 × 12 | `constants.dart` (`kCupertinoButtonPadding`) |
| Button radii | 12 pt large, 40 pt (pill) medium and small | `kCupertinoButtonSizeBorderRadius` |
| Button pressed opacity | 0.4 | `CupertinoButton.pressedOpacity` |
| Tinted button alpha | 18 % light, 26 % dark | `kCupertinoButtonTintedOpacity*` |

## Motion

| What | Value | Source |
| --- | --- | --- |
| Page push | spring, damping 0.86, stiffness 300 | NSH's navigation stack spring, matched to iOS's `kTransitionDuration` 500 ms feel (`route.dart`, `CupertinoPageRoute.kTransitionDuration`) |
| Sheet | spring, damping 0.8, stiffness 400 | `sheet.dart` (`_kDroppedSheetDragAnimationDuration` 300 ms, 500 ms transition) |
| Press | opacity 0.4 over 150 ms | `button.dart`, `constants.dart` |
| Switch thumb | 200 ms | `switch.dart` (position controller duration) |
| Card press | scale 0.97 | this crate's convention, for tiles that are not rows |

Reduced motion: the spinner stops (a still frame), and the components' own
transitions are short enough that iOS's own reduce-motion behavior (fewer, shorter
animations) needs no separate code path.

## The port: `cupertino_ui` first

Wave A's component inventory, sizes and interaction details are a port of
Flutter's official `cupertino_ui` 1.1.6 (`packages/cupertino_ui/lib/src/*.dart`),
read component by component. `NOTICE` lists each file and what was taken from
it; the short version:

| Component | Source | What it fixed here |
| --- | --- | --- |
| Colors, type | `colors.dart`, `text_theme.dart` | 38 roles (including `systemGrey2`…`6`), the 12 pt row subtitle, `cupertino_ui`'s own `section-header-footer`, `clear-button`, disabled field fill and activity tick |
| Lists | `list_section.dart`, `list_tile.dart` | 20 pt page margins (not 16), a 20 pt bold group header, the 13 pt footer color, 44/48 pt rows, 17/12 pt title and subtitle, `systemGrey4` press fill, `systemGrey2` chevron at the text size |
| Navigation | `nav_bar.dart` | 8/6 pt back-button spacing, a 20 pt chevron, 50 pt target, the bar and large title as minimum heights |
| Buttons | `button.dart`, `constants.dart` | 44/32/28 pt visual heights with a 44 pt target, 120/180 ms fades, the tertiary-label disabled foreground, icons at 1.2 × the text size |
| Text fields | `text_field.dart`, `search_field.dart` | `CupertinoTextField`'s 5 pt box, 20 % border and 7 pt padding as the `rounded` variant; the search field's 5.5/8 pt insets, 20 pt icons and secondary-label placeholder |
| Switch | `switch.dart` | The two-layer thumb shadow, `secondarySystemFill` off-track, 50 % disabled opacity |
| Activity indicator | `activity_indicator.dart` | The alpha table, the blade geometry, one turn per second in eight steps, the tick color |

### Where this port departs from `cupertino_ui`, and why

- **The row separators.** `CupertinoListSection` starts an inset-grouped
  separator at 14 pt + 42 pt with a leading icon, or 14 + 14 without. Against
  the tile's own 20 pt leading inset that puts the line 8 pt past the text.
  iOS aligns it with the text, and the HIG asks for alignment that shows the
  hierarchy, so the separator starts at the text (20 pt, or 20 + 28 + 16 with an
  icon).
- **Section corners.** `cupertino_ui` asks for a superellipse and falls back to
  `RoundedSuperellipseBorder`; NSH's `border-radius` is a circular corner on
  every platform, so the 10 pt corner is circular here.
- **The switch's drag.** `CupertinoSwitch` lets a finger drag the thumb and
  stretches it by 7 %. `nsh/base`'s switch is a tap control; dragging is not in
  this release.
- **The search field's Cancel.** `CupertinoSearchTextField` has no Cancel;
  `UISearchBar` shows one while editing, and this component follows the bar.

## Materials, from Lenso UI

`tokens::materials` takes Lenso UI's structure (`packages/tokens/themes/default/materials.css`):
one translucent fill per appearance and a blur distance, thinning toward media
and thickening toward text, with a `chrome` bar. The values are this project's
own (20–30 pt of blur, fills from 70 % to 94 %), and the high-contrast set makes
each fill more opaque. The rule that glass belongs only to the floating layer is
Apple's (`materials.md`, `liquid-glass.md`); Lenso UI's `DESIGN.md` states it the
same way. No CSS was copied.

## Liquid Glass: what is refraction and what is an approximation

`src/glass.rs` draws the material of the floating layer as a WGSL shader. Apple
publishes no implementation, so the behaviour comes from its own description and
the numbers are this crate's:

- [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
  (WWDC25): light bends and concentrates at the rim rather than scattering as a
  blur does; the specular highlight moves with the light; the material adapts to
  what is behind it; `regular`, `clear` and tinted variants; interactive
  variants; and shapes that morph inside a `GlassEffectContainer`.
- HIG [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  and [Liquid Glass](https://developer.apple.com/design/human-interface-guidelines/liquid-glass):
  glass belongs to the floating layer, never to content; keep text off glass that
  cannot hold its contrast; increased contrast makes the material nearly opaque.
- [conorluddy/LiquidGlassReference](https://github.com/conorluddy/LiquidGlassReference),
  a written specification of the same feature set (lensing against blur,
  specular response, variants, containers).

What the shader does, and how close each part is:

| Part | What this crate does | Fidelity |
| --- | --- | --- |
| Lensing | The surface's SDF gives a height field (a bevel of `BEVEL` points at the rim, flat inside); its gradient displaces the backdrop sample, strongest at the rim, and magnifies the whole picture by 2 % | **Refraction** of a sampled picture: the displacement is real, the height profile is a chosen curve, not Apple's optic |
| Blur | 9 to 17 backdrop taps on a golden spiral, rotated per pixel; `quality` drops them | A blur of the sampled picture, coarser than a separable Gaussian |
| Specular rim | `facing = dot(normal, light)` on the bevel, a hairline at the very edge, and an inner shadow on the unlit side | Directional and continuous around the silhouette; the *shape* of Apple's highlight is its own |
| Adaptive tint | The tint's alpha rises where the blurred backdrop's luminance would fight the label (up to 96 %) | Approximates "adapts to the background"; Apple's own rule is unpublished |
| Chromatic separation | Red and blue sampled half a pixel apart along the normal, only in the rim band | ≤ 1 px, as Apple's edge shows |
| Dynamic light | `light` (degrees) and an app-driven `tilt` angle | NSH reports no device motion, so the tilt is not automatic |
| `GlassEffectContainer` | `GlassGroup`: one shader over two rects, fused with a smooth minimum (`spacing`) and sprung between two layouts | One sampling region and a fused silhouette, as Apple asks; no morphing of a shape's content |
| Interactive | A press springs the lens, the specular bloom and a 3,5 % squash on the UI thread | Values and timing (~250 ms) are this crate's; Reduce Motion keeps the values and drops the springs |

The approaches were checked against the open-source implementations that solved
the same problems; `NOTICE` lists each, its licence and what was taken from it.
No code was copied: the WGSL, the SDFs and the numbers are written here.

### The web runtime binds one uniform block per program

A shader compiled for the web gets *two* uniform blocks per struct, one per
stage — naga names them `Nsh_block_0Vertex` and `Nsh_block_0Fragment` — while
`nsh`'s web runtime binds only the names the fragment stage's reflection gives
it. The vertex stage's block stays unbound, WebGL rejects the draw with
`GL_INVALID_OPERATION` and the view shows nothing. `tools/patch-runtime.mjs`
binds every block whose name starts with the one asked for, and
`tools/glass-shots.mjs` applies it to the build it screenshots. The fix belongs
in `nsh` (`crates/nsh-platform-web/web/nsh.js`, `shaderProgram`); until it
lands, a web build needs the patch to draw any shader at all.

## Contrast: the three roles below WCAG AA

The light appearance ships Apple's own values, and three of them are under 4.5:1
for regular text on white: `system-blue` 4.02:1, `secondary-label` 3.44:1,
`system-red` 3.55:1. The dark appearance is 5.8–6.4:1, and the increased-contrast
set reaches 7.6 / 4.25 / 5.4:1. This is recorded, with the measurements and the
override an app can make, in [issue #3](https://github.com/markbang/nsh-cupertino/issues/3):
an app that gates contrast at 4.5:1 passes the user's Increase Contrast setting to
`<Theme contrast="high">`, or overrides those three roles in its own theme.

## What is deliberately not copied

- **SF Symbols.** They are Apple's font; the crate ships 21 SVG shapes instead and
  draws them in `currentColor`.
- **UIKit's blur.** Navigation bars and sheets on iOS blur what is under them. NSH
  exposes `backdrop-filter` styles, but a blurred bar over a scrolling page costs a
  full-surface redraw on the web; the bar is opaque until there is a reason.
- **Swipe-to-go-back.** On iOS it comes from `nsh/base`'s navigation stack; the
  Android back gesture is left to the platform (`nsh/base` again), as the task
  requires.
- **Platform text fields.** `TextField` uses NSH's native input; on iOS that is the
  system text field and the system keyboard, which is what the design expects.
