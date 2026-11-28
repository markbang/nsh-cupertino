# Changelog

All notable changes to `nsh-cupertino`. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **`GlassMenu`.** A glass button whose shape grows into the menu it opens, as
  iOS 26's pull-down menus do, anchored to the button on phones too. The motion
  is fitted to the iOS reference clip: the shape on a spring (ζ 0.76, k 380), a
  drop that settles back, corners that stay round until late, items that fade
  in after the blob phase, cut by the growing shape, the menu's measured fill as
  its body from the first frame with glass only at the rim, the clip's shadow,
  and a close that holds, shrinks to 0.94 and fades as one layer within 130 ms. Items take a `detail` line and a `section`
  header (`GlassMenuAction`). The glass shader gains a `roundness` uniform for it.
- **`GlassTabBar` draws iOS 27's two-scale body on the web.** A 0.625 pt ghost
  and an 18 pt frost as two CSS backdrop layers under the shader, which draws
  the measured tint and the rim over them (`tokens::bar`). The native builds
  keep the one-disc body. `material="single-blur"` shows that body for
  comparison, and `prefers-reduced-transparency: reduce` (web) makes the bar
  opaque. `tools/tab-bar-pixels.mjs` checks the body against the iOS frames in CI.
  `morph` pins the minimise progress, for stills of the morph's middle frames.

### Fixed

- **Interactive glass shows its backdrop.** A press bound the lens to 1.0 at
  rest and 2.4 held instead of `LENS` times that, so `GlassButton`, the
  `GlassMenu` button and `Glass interactive` drew the backdrop at their centre
  across the whole body. The lens is now `LENS` at rest and `PRESS_LENS` held.
- **Glass no longer magnifies at rest.** Colour bars scrolled under iOS 27's
  composer keep their joins in place (m = 1.000 ± 0.002), so `LENS` is 0
  instead of 0.8 %. A press still magnifies by 1.92 % (`PRESS_LENS`, now the
  held value itself).
- **Both ends of the light axis catch the light, as on iOS.** The opposite
  rim's lobe never ran (`opposite` was always 0); the rim is now symmetric on
  the light axis, as the iOS tab bar's and back button's equal rim peaks are.
  The never-read `INNER`, `BLOOM`, `EDGE`, `PRESS_BLOOM` and `PRESS_LIFT` are
  gone. The pixel checks compare the top and bottom rim (|Δ| ≤ 0.02, both above
  the body) where the page above and below match, instead of asserting a lit
  side.

## [0.4.2] - 2026-11-17

### Fixed

- **Text no longer reads through the floating bar or the minimised pill.** A
  bar keeps a frosted 24 pt backdrop (and 33 taps, not 17) instead of the
  material's 5 pt, so a page of 14 pt rows under it is a soft haze with no
  legible strokes.
- **Light glass is a surface on a white page.** The light material lifts 5 %
  further toward white and carries a stronger hairline and a soft inner band, so
  the capsule and the minimised pill read as shapes over white rows rather than
  a smudge; the pill is a page-coloured disc at 92 % with a hairline and the
  iOS 27 shadow, visible without its icon.
- **The scroll edge dissolves into the page's colour.** An opaque band in the
  page's own colour covers the controls, a `smoothstep` fade reaches clear with a
  flat tangent below the bar, and the blur stays at 18–40 pt across the ramp, so
  no strokes survive and the band ends without a seam.
- **No chromatic fringe.** The rim's chromatic separation is off: on white it
  read as a blue-violet edge on the selected tab's capsule.

## [0.4.1] - 2026-11-16

### Fixed

- `GlassTabBar`'s minimised pill follows the chosen tab. Its position and the
  glass silhouette's anchor were read once at mount, and its icon was the tab
  chosen then, so a bar built with Inbox chosen showed Inbox's pill at Inbox's
  slot after Settings was chosen. Both now read the live selection, and the pill
  slides to the new slot with a spring.
- The minimised pill no longer takes touches: it is a picture, so tapping the
  chosen tab reaches the tab underneath (and its scroll-to-first-page gesture).

### Added

- `tools/glass-pixels.mjs` and `tools/android-glass-check.mjs` fail when the
  pill's icon is not at the chosen tab's slot or does not move with the
  selection; the demo and the Android driver tap Settings after mount and scroll
  for the frames.

## [0.4.0] - 2026-11-16

### Added

- `GlassTabBar`: the floating capsule tab bar (64 pt, radius 32, 20 pt insets),
  with iPhone's minimise-on-scroll behaviour (`on-scroll-down`, `on-scroll-up`,
  `never`) and a 50 pt minimised pill.
- A floating navigation bar in `NavPage` (a 40 pt back circle, a glass capsule
  for the trailing action, the title between them) and `NavPageEvent::Scroll`.
- `ScrollEdge`: a graduated blur and fade at a page's edge, reveal-driven.
- `tools/glass-pixels.mjs` and `tools/android-glass-check.mjs` assert structure
  visibility, dark luminance, rim displacement and the lit edge.

### Changed

- The material is retuned to iOS 27's calibrated presets: `#F8F8F8` 53 % light,
  `#FFFFFF` 12 % dark, saturation 2.1/1.4, a luminance-weighted frost, a 0.28
  body shade, a 32 pt paraxial lens, a lit rim lobe, 5 pt of blur, a 70 % tint
  cap and the iOS 27 shadow. Visual breaking change for glass users.

### Fixed

- The backdrop sample mapped the view's box to the middle of the texture, so the
  lens refracted the wrong pixels at every rim.

## [0.3.5] - 2026-11-16

### Fixed

- **The navigation bar's glass gets a backdrop on Android (#16).** `NavPage`
  lays the bar as a layer over the scrolling content on every platform: the
  content runs to the top edge, padded by the bar's height plus the safe-area
  inset, and scrolls under the bar. Before, the scroll view's viewport began at
  the bar's lower edge on Android, so a material bar drew as a flat white or
  black slab with a rim. The bar now also draws into the status bar area, with
  its row below the inset, and the pull-to-refresh indicator at its lower edge.
  `material` now chooses the surface only: an opaque bar floats over content too.

### Added

- The Android run captures `android-glass-behind-{light,dark}.png`, scrolled
  until the striped band is behind the bar, and `tools/android-glass-check.mjs`
  fails when the bar's row there is one colour (a flat bar). `tools/android-bar.mjs`
  is the probe the driver scrolls against.

## [0.3.4] - 2026-11-16

### Fixed

- The demo's *Glass controls* panel is the `secondary-fill` token instead of a
  hard-coded `#e5e7eb`: in dark mode it was a light grey block glowing on the
  dark page. The rest of the demo's colours were audited with it — the tinted
  cards, the gradient behind the materials and the stripe picture the lens bends
  are content, and the calibration page keeps its fixed backdrop because the
  pixel checks measure against it.

## [0.3.3] - 2026-11-15

### Added

- **The material on Android, verified.** 0.3.0 said no Android frame had ever
  been drawn where it was written; an emulator run in CI (API 34, SwiftShader)
  now installs the demo, drives it with `adb`, and captures the glass pages in
  light and dark, the page scrolled so its striped band is under the bar, the
  capsule variants and the glass sheet (`.github/workflows/android-ui.yml`).
- `tools/android-glass-check.mjs`: the run fails when a capture is blank (black,
  one colour, or a window that never drew) or a step did nothing, and measures
  the lens on the calibration stills — the blue field behind the capsule must
  reach further inside it than the fill lets it.

## [0.3.2] - 2026-11-15

### Fixed

- `Sheet`'s panel is at most 640 pt wide (`metrics::SHEET_MAX_WIDTH`): on a
  window wider than that it is a centred card with four rounded corners and
  16 pt above the bottom edge, as an iPad's form sheet, instead of stretching
  a settings form across the whole width.

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
