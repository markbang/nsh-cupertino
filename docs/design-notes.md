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
