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

The tracking above is SF Pro's, measured at those sizes: it applies where that
face is drawn, on the Apple platforms ([`tokens::tracking`]). The other
platforms have their own system faces, and iOS's tracking loosens or crowds
them — most visibly in Chinese, where every glyph is full-width. `Theme` names
each platform's family list instead (`tokens::font_family`): Roboto with Noto
Sans CJK SC on Android, Segoe UI with Microsoft YaHei UI on Windows, Inter and
Cantarell on Linux, and `-apple-system` first on the web. Apple platforms name
none: SF Pro and PingFang are the design's own faces.

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
| Sheet | spring, damping 1.0 (critical), stiffness 280, fitted to iOS's sheet recording (`motion-sheet.mp4`) | `sheet.dart` (`_kDroppedSheetDragAnimationDuration` 300 ms, 500 ms transition) |
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
| Lensing | The surface's SDF gives a height field (a bevel of `BEVEL` points at the rim, flat inside); its gradient displaces the backdrop sample, strongest at the rim; the flat middle does not magnify (iOS: 1.000 ± 0.002) | **Refraction** of a sampled picture: the displacement is real, the height profile is a chosen curve, not Apple's optic |
| Blur | 9 to 17 backdrop taps on a golden spiral, rotated per pixel; `quality` drops them | A blur of the sampled picture, coarser than a separable Gaussian |
| Specular rim | `abs(dot(normal, light))` on the bevel: both ends of the light axis lit alike, as iOS's equal top and bottom rim peaks show, and a hairline at the very edge | Continuous around the silhouette; the *shape* of Apple's highlight is its own |
| Adaptive tint | The tint's alpha rises where the blurred backdrop's luminance would fight the label (up to 96 %) | Approximates "adapts to the background"; Apple's own rule is unpublished |
| Chromatic separation | Red and blue sampled half a pixel apart along the normal, only in the rim band | ≤ 1 px, as Apple's edge shows |
| Dynamic light | `light` (degrees) and an app-driven `tilt` angle | NSH reports no device motion, so the tilt is not automatic |
| `GlassEffectContainer` | `GlassGroup`: one shader over two rects, fused with a smooth minimum (`spacing`) and sprung between two layouts | One sampling region and a fused silhouette, as Apple asks; no morphing of a shape's content |
| Interactive | A press springs the lens to a 1.92 % magnification and a 3,5 % squash on the UI thread | Values and timing (~250 ms) are this crate's; Reduce Motion keeps the values and drops the springs |

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

## Liquid Glass, measured

The iOS 26/27 material is not a frosted panel: it is a thin, luminous layer
that refracts its backdrop, keeps its structure, and catches the light on one
edge. The numbers below were read from primary sources and from calibrated
implementations, then checked against measurements of our own renders
(`tools/glass-pixels.mjs`).

### References

Apple:

- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)
  — the floating layer, the tab bar's and toolbar's new shapes, the scroll edge
  effect.
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  and [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)
  — glass as a material over content, never a content background.
- [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)
  — the floating, inset capsule and its minimise behaviour on iPhone.
- [`UITabBarController.MinimizeBehavior`](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior)
  — `automatic`, `never`, `onScrollDown`, `onScrollUp` (iOS 26).
- [`UIScrollEdgeEffect`](https://developer.apple.com/documentation/uikit/uiscrolledgeeffect)
  — the progressive blur/fade at a scroll view's edge.
- WWDC25 [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)
  (session 219), [Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)
  (356) and [Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/)
  (323): the session frames are the close-ups the material was compared with
  (a capsule over text, a menu over a photograph, the dark toolbar over an
  image, the light iPad sidebar).

Calibrated implementations (licences in `NOTICE`; the images are linked, not
vendored, since Apple's are Apple's):

- [`sdegenaar/liquid_glass_widgets`](https://github.com/sdegenaar/liquid_glass_widgets)
  (MIT) — the iOS 27 presets in `lib/theme/glass_theme_settings.dart`, the
  native-vs-implementation stills `docs/assets/ios27_parity_light.png` and
  `ios27_parity_dark.png`, the tab bar in `lib/widgets/surfaces/glass_tab_bar.dart`,
  the minimise state machine in `lib/widgets/surfaces/shared/tab_bar_minimize_controller.dart`
  and the graduated blur in `docs/PROGRESSIVE_BLUR.md`.
- [`Kyant0/AndroidLiquidGlass`](https://github.com/Kyant0/AndroidLiquidGlass)
  (Apache-2.0) — the floating capsule tabs' geometry and the lens/dispersion
  core.
- [`DnV1eX/LiquidGlassKit`](https://github.com/DnV1eX/LiquidGlassKit) (MIT) —
  `LiquidLensView.swift`, the resting pill that lifts under a press.

### The material

| Number | iOS 27 light | iOS 27 dark | Ours |
| --- | --- | --- | --- |
| Glass colour | `#87F8F8F8` (53 % white) | `#1FFFFFFF` (12 % white) | the `glass-regular` token, same values |
| Backdrop saturation | 2.1 | 1.4 | `SATURATION` / `SATURATION_DARK` |
| Blur | small; detail survives | small | 8 pt (`BLUR`), the top of the 3–8 pt band |
| Frost: opacity / clamp / weight | plain blur: no weighted ghost (measured on the iOS pull-down menu) | ghost weight 5, opacity 0.4 (measured, dark) | `FROST` [1, 0, 0] / `FROST_DARK` [0.4, 0, 5] |
| Thickness, refractive index | 32 pt, 1.24 (paraxial) | same (not measured) | 8 pt of rim shift (0.24 × 32); unmeasured on iOS |
| Light angle | +π/2 (from below) | −π/2 (from above) | `LIGHT` / `LIGHT_DARK` |
| Rim: shade / light | 1 / 1 (measured: tab bar and back button, lit and opposite peaks equal) | 1 / 1.15 (not supported by the tab bar's equal peaks; menu asymmetric) | `RIM` / `RIM_DARK` |
| Body shade | 0 | 0.28 | `BODY_SHADE` |
| Shadow | `#0A000000`, blur 10, y 7 | none | the bar's shadow layer |

The rim light is a hairline plus two lobes on the light axis: a sharp core one
point inside the edge and a soft tail about 8 pt into the body, scaled by
`(1 − luminance)^0.3`; on black it adds about +50/255, easing to +27/255 over a
near-white body (the measurement in `liquid_glass_widgets`'
`liquid_glass_render.frag`). Ours follows that shape with one lobe pair and a
soft sheen; the two lobes are equal, as iOS's top and bottom rim peaks are.

The adaptive tint thickens only where the backdrop fights a label, and stops at
70 %: it must never turn the glass into an opaque slab.

### The structure

Liquid Glass is a design language, not only a material. The pieces that carry it:

| Piece | Number | Source |
| --- | --- | --- |
| Floating tab bar | 64 pt tall, radius 32, 20 pt side insets, 12 pt above the home indicator; 27.5 pt icons and 10 pt labels, 2 pt apart | `glass_tab_bar.dart`, UIKit's `UITabBar` |
| Minimised bar | a 50 pt pill around the chosen tab; the whole bar lifts 6 pt as it shrinks | `glass_tab_bar.dart` (`minimizedBarHeight` 50) |
| Minimise behaviour | 20 pt of downward travel minimises, 12 pt upward expands, content shorter than 40 pt never minimises, the top always expands; springs at damping 0.78, stiffness 340 | `tab_bar_minimize_controller.dart` |
| Floating navigation controls | 40 pt circular back button, a capsule for the trailing action, 16 pt from the sides and 8 pt below the safe area; the title floats between them | the WWDC25 stills and the parity images |
| Scroll edge | a graduated blur, 20 pt at the edge and sharp 110 pt in, with a short fade into the page's background; 0 at rest at the top, 1 after 26 pt of scroll | `PROGRESSIVE_BLUR.md` (max sigma 20, falloff 1.2), `UIScrollEdgeEffect` |
| Concentric radii | the capsule's radius is half its height (32); nested shapes take the outer radius minus the gap | HIG *Layout* |

### What our renders measure

On the calibration page (a capsule over dense text and a blue edge, 3×):

| Check | Threshold | Light | Dark |
| --- | --- | --- | --- |
| Structure correlation (through glass vs clear) | ≥ 0.25 / 0.35 | 0.53 | 0.50 |
| Fill-only correlation, for contrast | below the shader's | 0.16 | 0.09 |
| Material mean luminance | dark above the backdrop, 0.06–0.34 | — | 0.26 over 0.09 |
| Rim displacement of the blue edge | ≥ 1.5 pt | 10.0 | 15.7 |
| Top − bottom rim peak, where the page above and below match | ≤ 0.02 (iOS 0.004), both above the body | 0.000 | 0.0157 |

`tools/android-glass-check.mjs` measures the same properties on the emulator's
frames, and adds the structure checks: the bar spans ≥ 60 % of the screen when
expanded and ≤ 45 % after a downward scroll, and the 20 pt either side of the
capsule show content rather than the bar.

The top − bottom rim check is the thinnest margin in CI. On the emulator the
dark rim reads 0.0196 against the 0.02 limit (light 0.0157); on the web it reads
0.0000 (light) and 0.0157 (dark). The soft sheen (specular × 0.055 × along²)
leans to the lit side, which is what eats the margin. There is no room left:
do not treat the limit as slack.

### What still differs from Apple

- **The frost is an approximation.** iOS 27 runs a separate blur pass and reads
  its cloud from interleaved rows; ours samples a disc of 9–17 taps in one pass,
  so a very dense texture under the glass loses a little more structure than
  Apple's and a very low-tap GPU (`low` quality) can band. The 3–8 pt blur band
  keeps text recognisable, as Apple's does, but at the low end ours is a little
  crisper.
- **The lens is paraxial.** Apple's physical model refracts through a
  hemispherical bevel; ours takes the bevel's slope at the rim (the paraxial
  approximation the reference implementation uses too), so the magnification
  inside the rim is slightly flatter at large radii.
- **The minimise morph interpolates two silhouettes** (the bar's rounded rect
  and the chosen tab's pill) and cross-fades the content, where UIKit morphs the
  real views and their icons. The spring matches; the intermediate frames do
  not carry the icons through the morph.
- **The shadow is a box shadow**, not the layered, elevation-aware shadow of the
  native material; dark mode draws none, as iOS 27 does.
- **Content behind a web build is painted by NSH's own painter**, which leaves
  gradients and rotations out of a shader's backdrop picture. Our demo therefore
  uses solid blocks and text behind the glass; native builds capture the whole
  window and show pictures and gradients too. This is a platform limitation, not
  the material's.
- **The scroll edge effect is one loop of taps over the strip**, not a separable
  two-pass Gaussian; at 20 pt over 110 pt it is smooth on our test content but
  can show a faint ring on an extremely high-contrast, fine pattern.
- **The rim does not brighten next to bright content.** Over a flat backdrop
  iOS's top and bottom rim peaks are equal (ratio 0.98–1.02), but where a bright
  backdrop sits next to or under one rim, that rim brightens: the top/bottom
  peak ratio reads 0.76 and 1.46 in the iOS 27 simulator stripes clips. Ours
  keeps the two rims equal everywhere. There is no material to set a value
  from, so this is not modelled.
