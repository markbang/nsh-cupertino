# Changelog

All notable changes to `nsh-cupertino`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.1] - 2026-11-15

### Added

- The platform's type face: `tokens::font_family()` names the family list each
  platform draws best (Roboto and Noto Sans CJK SC on Android, Segoe UI and
  Microsoft YaHei UI on Windows, Inter and Cantarell on Linux, `-apple-system`
  first on the web) and `Theme` sets it on its root view, where every text
  inside inherits it. Apple platforms name none: SF Pro is the face the type
  scale was drawn for.

### Changed

- iOS's tracking applies only where the face it was measured against is used
  (`tokens::tracking`): the Apple platforms. Elsewhere it is none, as Roboto
  and Noto carry their own spacing, and Chinese, full-width, shows the
  difference most.

## [0.3.0] - 2026-11-15

### Added

- **Liquid Glass**, the material of the floating layer: `Glass`, `GlassButton`
  and `GlassGroup` draw Apple's iOS 26 material with a GPU shader — the backdrop
  is read through `sample_backdrop`, bent by the height field of the surface's
  rounded rect (the rim refracts and magnifies what lies just outside it), blurred,
  tinted and given a specular rim that follows the light. `regular`, `clear`,
  `thick`, `interactive` and `tinted` variants; rounded, capsule and circle
  shapes; `quality` from 17 to 1 blur samples; an app-driven light angle.
- `GlassGroup` merges two shapes into one material with a smooth neck, the
  crate's reading of Apple's `GlassEffectContainer`.
- Every surface of the floating layer draws it: the navigation bar (content
  scrolls under it), the tab bar, sheets, action sheets, alerts, and the search
  field's box (`SearchField`'s `glass`), plus `GlassButton` for floating controls.
- `tokens::glass`: the material's numbers and its three fills, which follow
  `Theme`'s increased-contrast setting (near opaque), and `tokens::glass_fill`.

### Changed

- `tokens::materials` stays the fallback: on a platform without GPU shaders, or
  a machine whose GPU NSH cannot open, a bar, sheet or button draws the fill and
  backdrop blur it drew before, from `tokens::materials`. Sheets and alerts are
  a little more translucent over the lens than they were over a plain blur.

### Notes

- The web runtime of NSH 0.5.x binds only the fragment stage's uniform block, so
  a WebGL 2 shader draws nothing; `tools/patch-runtime.mjs` fixes a built app
  until NSH does (`docs/design-notes.md` says where).

## [0.2.2] - 2026-11-15

### Added

- `Icon`, the component: an icon on its own, with a size, a token tint and an
  optional accessible name, for the parts a row or a bar draws.
- 28 shapes a mail client needs: `tray`, `paperplane`, `archivebox`, `trash`,
  `flag` / `flag.fill`, `paperclip`, `folder`, `square.and.pencil`, `pencil`,
  `clock`, `calendar`, `arrow.clockwise`, `arrowshape.turn.up.left` /
  `arrowshape.turn.up.right`, `link`, `key`, `line.3.horizontal.decrease`,
  `cloud`, `exclamationmark.triangle`, `checkmark.circle`, `doc`, `photo`,
  `envelope.open`, `person.crop.circle`, `ellipsis`, `plus`, `xmark`.
- `Sheet` takes a `leading` action ("Cancel") beside its `trailing` one, and
  reports it as `onLeading`, as iOS's compose sheets have; `scroll={false}`
  leaves the scrolling to content that has its own (a page, a navigation stack).

## [0.2.1] - 2026-11-15

### Added


### Changed

- Sheets, action sheets, alerts and context menus draw with
  `tokens::materials` (`thick` and `regular` fills with their blur radii)
  instead of a solid background with a hard-coded blur.
- Every overlay of the library is drawn in the same top layer
  (`overlay::layer()`): Sheet, ActionSheet, AlertDialog, and ContextMenu with
  its lifted preview.

### Fixed

- A context menu opened from a row inside a scroll view paints its preview and
  menu above the page text on the web, as it does natively. A web regression
  test opens it from the demo's scrolling list and presses the preview, which
  only reaches it when it is above the trigger.

## [0.2.0] - 2026-11-14

### Changed

- The components are now a port of Flutter's official `cupertino_ui` 1.1.6
  (`NOTICE` lists every file and value): 20 pt list margins, a 20 pt bold group
  header, a 12 pt row subtitle, `systemGrey4` press fill and a `systemGrey2`
  chevron; the bar's and large title's heights are minimums so large text is not
  clipped; buttons take `CupertinoButton`'s 44/32/28 pt heights with a 44 pt
  target and its 120/180 ms fades; the text field gains `CupertinoTextField`'s
  `rounded` box as its default variant (`grouped` keeps the form surface); the
  search field takes its insets, 20 pt icons and secondary-label placeholder; the
  switch takes the two-layer thumb shadow; the activity indicator takes the exact
  blade geometry, alpha table and one-second, eight-step turn.
- `ActivityIndicator`'s label is no longer "Loading": name the task, as the
  guidelines ask.

### Added

- `tokens::materials` (and `bg-material-*` classes): `ultra-thin`, `thin`,
  `regular`, `thick` and `chrome` glass fills with 20–30 pt blur for the floating
  layer, with more opaque high-contrast fills; `NavPage` and `NavigationBar` take
  `material` and float the bar over the content.
- `ListTile` takes a trailing control as children (`<ListTile title="Wi-Fi"><Switch/></ListTile>`),
  the shape iOS's settings rows have.
- `system-gray2` … `system-gray6`, `section-header-footer`, `clear-button`,
  `text-field-disabled-background` and `activity-tick` tokens; a 12/16 subtitle
  step in the type scale.
- `NOTICE`: what was taken from `cupertino_ui` (BSD-3-Clause), Lenso UI (MIT) and
  Framework7 (MIT), file by file.

- The rest of the component set, ported the same way: `Sheet` with medium and
  large detents; `ActionSheet`; `AlertDialog` with its text-entry variant;
  `ContextMenu` with a lifted preview; `Picker`; `DatePicker`; `SegmentedControl`;
  `Slider`; `TabBar`; `SwipeRow`; `RefreshView` and the same pull in `NavPage`.
- A material that covers a bar's whole surface, fading in with the compact title,
  with a tint-only fallback where no backdrop blur is drawn.

### Fixed

- Grouped separators are one **device pixel** at every display scale
  (`separator_thickness`); at 0.33 pt a 1x display rounded the hairline away, so
  rows other than the first two lost their line. A layout test covers every row
  type at 1x, 2x and 3x, and a screenshot pixel test covers light and dark.

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
