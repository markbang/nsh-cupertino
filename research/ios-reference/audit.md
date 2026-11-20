# Fidelity audit: nsh-cupertino vs the Cohub Mobile iOS reference

Reference: `shots/` in this folder (the iOS side of Cohub Mobile's UI snapshots). Library: `main` at a5f4a96 (0.4.2). No code was changed. Chinese: [audit.zh-CN.md](audit.zh-CN.md).

## Method

- **Scale.** The shots are the 402 pt wide frame at 720 px, so 1 pt = 720 / 402 = 1.791 px. Checked against the type: the "Chats" large title has a 24.0 pt cap height, which is a 34 pt font at the usual 0.705 cap ratio; "UI Catalog" (17 pt headline) gives a 12.3 pt cap, which fits.
- **Measurement.** `tools/measure-ios-reference.py` reads the webp pixels (Pillow). Edges are the midpoint luminance between the two colours on each side. Colours are sampled from the lossy webp, so each hex is ±3. Corner radii are least-squares circle fits to the traced edge: estimates.
- **Library values** are read from source: `src/tokens.rs`, `theme/theme.json`, `src/theme_file.rs`, and the component files cited.
- **"est."** marks a value read from the image by eye, or a measurement with a known error of more than about 1 pt.
- Not built or run. Pixel comparison against our own rendering was out of scope.

## 1. Missing components

| Element in the reference | Closest existing module | Gap | Screens |
|---|---|---|---|
| Filter chips with count ("Recent 3", "Pinned", "Archived") and a selected filled state | none (`segmented` is a track, `button` tinted is not a chip) | missing | catalog-controls, catalog-list, chats-filter |
| Status pills with a coloured dot (Neutral, Running, Paused, Failed, Queued) | none | missing | catalog-controls |
| Empty state: mascot, title, subtitle, orange text action | none | missing | catalog-states |
| Inline error banner with an icon, two lines of text and a retry button | none | missing | catalog-states |
| Skeleton rows (grey placeholder blocks) | none (`indicator` is a spinner) | missing | catalog-states |
| Theme preview cards (mini phones, selected ring) and accent swatch grid | none | missing | appearance |
| Fit-height sheet (content height, not a detent) | `sheet` has `medium` and `large` only | partial | catalog-sheet |
| Floating glass sheet with 8 pt side inset on a phone-width window | `sheet` is full width below 640 pt (`sheet.rs:339-342`) | partial | catalog-sheet, catalog-page |
| Glass circular icon buttons (back, filter, compose) 45 pt | `glass` + `navigation` (no circular icon button preset) | partial | chats, spaces, catalog-* |
| Icon tile with initials or count ("11", "SH") | `icon_view` / `icon` (no tile) | partial | chats, spaces |
| Row with trailing count-with-icon ("20+", "1") and two-line title | `list` `ListTile` (subtitle only, no trailing count) | partial | spaces |
| Activity heat grid (13 weeks × 7 days) | none | missing | activity |
| Chat bubble, Markdown table, code block, composer with attach and model pill | none (app-level, not in the library) | missing | chat-conversation, chat-tools, composer-attach |
| Balance card and big figure | none (app-level) | missing | activity |
| Dimmed backdrop under a sheet | `sheet` dims at the large detent only (`sheet.rs:123`) | matches | catalog-sheet |

## 2. Metric mismatches

Reference values are measured in the 402 pt frame. "Ours" is the value in source. Delta = ours − reference.

| # | Metric | Reference | Ours (file:line) | Delta |
|---|---|---|---|---|
| 1 | Single-line settings row height | 52 pt (row pitch 51.9–52.5 px→pt) | `ROW_HEIGHT` 44 (`tokens.rs:567`) | −8 pt |
| 2 | Two-line row height (Group rows) | 55 pt (est., from a 99 px pitch) | `ROW_HEIGHT_SUBTITLE` 48 (`tokens.rs:569`) | −7 pt (est.) |
| 3 | Grouped card corner radius | 20.7 pt (fit) | `radius::ROW` 10 (`tokens.rs:507`, `list.rs:103`) | −11 pt |
| 4 | Card inset from screen edge | 16.2 pt left, 15.6 pt right | `SECTION_EDGE` 20 (`tokens.rs:579`, `list.rs:101`) | +4 pt. Inside nsh: `theme_file.rs:59` writes 16 px into `theme/theme.json:41`, so the generated theme and the Rust components disagree |
| 5 | Leading icon tile inset from card edge | 17.3 pt | `pl` = `ROW_TRAILING` 14 when there is a leading icon (`list.rs:229-231`) | −3 pt |
| 6 | Leading tile size | 26.8 pt (est. 27–28) | `LEADING_SIZE` 28 (`tokens.rs:575`) | ≈ +1 pt (est.) |
| 7 | Text start from card edge | 57.5 pt | 14 + 28 + 16 = 58 (`list.rs:229-235`) | +0.5 pt |
| 8 | Separator start from card edge | 57.5 pt, same as text | `leading_inset` = 20 + 28 + 16 = 64 (`list.rs:186-188`, used at `list.rs:296`) | +6.5 pt. The separator starts 6 pt right of the text: it should use `ROW_TRAILING`, as the row padding does |
| 9 | Separator colour | peak #f3f3f3 on white (≈1 px at this scale) | `separator` `#3c3c4349` light: ≈#c7c7c7 at full coverage on white (`theme.json:81`) | ours is darker (est.) |
| 10 | Section header size | ≈13 pt semibold (est., from the cap height) | `SECTION_HEADER_SIZE` 20, bold (`tokens.rs:605`, `list.rs:89`) | +7 pt (est.) |
| 11 | Type: large title | 34 pt, bold (cap 24.0 pt) | `LARGE_TITLE` 34 / 700 (`tokens.rs:349`) | 0 |
| 12 | Type: title | ≈23 pt (est., cap 16.2 pt) | `TITLE2` 22 / 400 (`tokens.rs:353`) | −1 pt (est.) |
| 13 | Type: headline / body | 16.6–17.4 pt → 17 | `HEADLINE` 17 / 600, `BODY` 17 / 400 (`tokens.rs:357-359`) | 0 |
| 14 | Type: subhead, footnote | 15.0 pt, 13.5 pt → 13 | `SUBHEADLINE` 15, `FOOTNOTE` 13 (`tokens.rs:363-365`) | 0 |
| 15 | Type: caption2 | ≈12 pt (est., cap 8.4 pt) | `CAPTION2` 11 (`tokens.rs:369`) | −1 pt (est.) |
| 16 | Accent colour | #c03f00 (primary fill, switch on, selected chip) | `system-blue` #007aff (`tokens.rs:101`, `theme.json:121`) | hue: orange vs blue |
| 17 | Light page background | #f7f3ed (warm) | `system-grouped-background` #f2f2f7 (`tokens.rs:72`) | different hue and lightness |
| 18 | Light card fill | #ffffff | `secondary-system-grouped-background` #ffffff | 0 |
| 19 | Dark page background | #131215 (chats and rows, dark) | `system-grouped-background` dark #000000 (`tokens.rs:72`) | +19 / +18 / +21 per channel (R / G / B) |
| 20 | Dark card fill | #1c1c1e | `secondary-system-grouped-background` dark #1c1c1e | 0 |
| 21 | Primary and secondary button height | 50.2, 51.9 pt (est. ±0.5) | `BUTTON_LARGE` 44 (`tokens.rs:599`, `button.rs:58`) | −6 to −8 pt |
| 22 | Button corner | pill (radius = half height, ≈25 pt) | `radius::BUTTON` 12 (`tokens.rs:511`, `button.rs:64`) | −13 pt |
| 23 | Segmented track height | 31.8 pt | `TRACK_HEIGHT` 32 (`segmented.rs:54`) | 0 |
| 24 | Segmented track corner | pill (≈16 pt) | `CORNER` 9 (`segmented.rs:56`) | −7 pt |
| 25 | Switch track | ≈62 × 27 pt (est.) | 51 × 31, thumb 27 (`tokens.rs:591-595`, `switch.rs:45-46`) | width −11 pt, height +4 pt (est.) |
| 26 | Search field height | 43.5 pt, pill | `SEARCH_HEIGHT` 36 (`tokens.rs:597`, `field.rs:251`) | −7.5 pt |
| 27 | Search field corner | pill (≈22 pt) | `radius::SEARCH` 9 (`tokens.rs:513`, `field.rs:296`) | −13 pt |
| 28 | Filter chip height | ≈36 pt (est.) | none in the library | missing (see §1) |
| 29 | Sheet corner radius (top) | ≈37 pt (fit; ≈35 by eye) | `radius::SHEET` 14 (`tokens.rs:509`, `sheet.rs:339-342`) | −23 pt |
| 30 | Sheet side inset (fit sheet) | 8.9 pt (floating card, all corners rounded) | full width below 640 pt (`sheet.rs:76-78`, `sheet.rs:339`) | −8.9 pt |
| 31 | Sheet height, fit | 284 pt (≈ 32 % of 874 pt) | detents `medium` / `large` only | no fit detent |
| 32 | Menu width | ≈250 pt | `min_w` 250 (`context_menu.rs:189`) | 0 |
| 33 | Menu corner radius | ≈30 pt (est. by eye) | `radius::SHEET` 14 (`context_menu.rs:190`) | −16 pt (est.) |
| 34 | Menu row height | ≈42 pt (est., 61 px pitch in the 589 px preview) | `min_h` 44 (`context_menu.rs:133`) | +2 pt (est.) |
| 35 | Alert width | ≈319 pt (572 px) | `w(270)` (`alert.rs:224`) | −49 pt |
| 36 | Alert corner radius | ≈27 pt (est. by eye) | `rounded(14)` (`alert.rs:227`) | −13 pt (est.) |
| 37 | Alert button height | ≈47 pt (est.) | `min_h` 44 (`alert.rs:182`) | −3 pt (est.) |
| 38 | Tab bar height (floating glass pill) | ≈61 pt (est.) | `HEIGHT` 64 (`tab_bar.rs:283`) | +3 pt (est.) |
| 39 | Glass blur, stroke, tint | not measurable from stills | `BAR_BLUR` 24, `BLUR` 5 (`tokens.rs:737`, `tokens.rs:734`) | open: needs a glass-edge capture |

## 3. Top three screens by gap

1. **catalog-controls**: every control is off. Buttons 50–52 pt pill vs 44 pt rounded 12. Search 43.5 pt vs 36. Segmented corners. Switch shape. Chips and status pills are missing entirely.
2. **catalog-rows** (and the screens built on it: settings, about, appearance, activity): row height 52 vs 44, card radius 21 vs 10, card inset 16 vs 20, the separator starts 6 pt off the text, section header 13 vs 20 pt, accent and page colour.
3. **catalog-states**: no empty, error, or skeleton component exists in the library. This is a missing-component gap, not a metric one.

Close behind: catalog-sheet and catalog-menu (sheet radius 37 vs 14; floating inset; no fit detent; menu radius 30 vs 14) and catalog-confirm (alert 319 vs 270 pt wide).

## Gaps

- Glass (blur radius, edge stroke, tint strength): no still frame of a glass edge against known content was measured. The motion files were not analysed frame by frame either.
- The 402 pt scale is inferred from the frame width and checked against the type ramp. A 1 % error in scale moves each pt value by about 0.5 pt.
- Estimates (marked est.): sheet and menu radii by eye, alert height and width, switch size (track only; thumb not measured), two-line row height, tab bar height, caption2 and section header sizes.
- Dark mode was sampled only for page and card backgrounds. Dark accent and text colours were not checked.
- Android is out of scope.
