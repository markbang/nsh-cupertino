# Changelog

All notable changes to `nsh-cupertino`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Wave B, next: `ActionSheet`, `AlertDialog`, `ContextMenu`, `Sheet` with detents,
  `Picker`, `DatePicker`, `SegmentedControl`, `Slider`, `TabBar`, swipe actions
  and pull to refresh.

## [0.1.0] - 2026-11-14

### Added

- Semantic tokens: Apple's 28 color roles with light, dark and high-contrast
  values, the eleven-step type scale, spacing, radii, the 0.33 pt hairline and
  the motion springs; `theme/theme.json` and `theme/tailwind.json` generated from
  them (`cargo run --bin gen-theme`).
- `Theme`: installs the tokens and follows the appearance and a contrast setting.
- `NavPage` and `NavigationBar`: large title collapsing into the bar natively
  from the scroll offset, back button, trailing action, hairline.
- `List`, `Section`, `ListTile`: inset grouped lists, 10 pt corners, hairline
  separators inset to the text, leading icons, chevron and checkmark
  accessories, destructive and disabled rows, iOS pressed highlight.
- `Button`: filled, tinted, plain and destructive; large, medium and small;
  40 % press opacity over 150 ms.
- `TextField` and `SearchField`: rounded grouped field with clear and secure
  buttons, iOS keyboards and return keys; 36 pt search field with Cancel.
- `Switch`: 51 × 31 track, 27 pt thumb, 20 pt of travel over 200 ms.
- `ActivityIndicator`: eight blades fading in turn, native keyframes, a still
  frame with reduced motion.
- `ScrollView`: bouncing scroll with the platform's indicator and drag-to-dismiss
  keyboard.
- 21 icons drawn as SVG in the text color, NSH's stand-in for SF Symbols.
- Demo app (TSX + Rust) with one page per component, the appearance and contrast
  toggles, and storage-seeded deep links for screenshots.
- Headless behavior tests and web screenshot tests for every demo page in light
  and dark.
