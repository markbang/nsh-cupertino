# Lists: `List`, `Section`, `ListTile`

iOS's inset grouped lists: rows on one 10 pt surface, hairline separators that
start where the text starts, a chevron for a row that opens something and a
checkmark for a chosen one.

| | |
| --- | --- |
| Light | ![Lists, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-light.png) |
| Dark | ![Lists, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-dark.png) |

## List

A whole page of sections: the background, the safe area, the 16 pt margins and
iOS's bouncing.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `children` | `.child(..)` | JSX | — | The sections |
| `inset` | `.inset(..)` | `boolean` | `true` | The 16 pt margin from the window's edges |
| `background` | `.background(..)` | token name | `system-grouped-background` | Behind the sections |
| `scroll` | `.scroll(..)` | `boolean` | `true` | `false` inside `NavPage`, whose scroll already runs the page |

## Section

A group of rows on one surface, with an optional header above and footer below.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `header` | `.header(..)` | `string` | none | 13 pt, secondary label, 16 pt inset |
| `footer` | `.footer(..)` | `string` | none | 13 pt, secondary label, under the group |
| `children` | `.child(..)` | JSX | — | The rows |

## ListTile

A row: 44 pt tall (48 with a subtitle), 20 pt leading inset (14 when there is an
icon), title at 17 pt, subtitle at 13 pt.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The row's title, 17 pt |
| `subtitle` | `.subtitle(..)` | `string` | none | A line under the title, 13 pt secondary label |
| `leading` | `.leading(..)` | icon name | none | A 28 pt box with a 22 pt icon |
| `leadingColor` | `.leading_color(..)` | token name | `system-blue` | The icon's color |
| `accessory` | `.accessory(..)` | `"chevron"` \| `"checkmark"` \| `"none"` | chevron | At the trailing edge |
| `checked` | `.checked(..)` | `boolean` | `false` | Shows a checkmark and sets the row's state |
| `destructive` | `.destructive(..)` | `boolean` | `false` | Red title |
| `separator` | `.separator(..)` | `boolean` | `true` | The hairline under the row |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Dimmed, not pressable |

Events: `onPress`.

Notes

- Rows draw their own hairline; give the last row of a group `separator={false}`.
- The hairline starts where the text starts: 20 pt in, or after the leading icon.
- The pressed highlight is `fill` (the system's translucent gray), not a scale.
- A row with no `accessory` shows a chevron: pass `accessory="none"` for a row
  that opens nothing.

## Accessibility

- Each row is a button named "title. subtitle"; `disabled` and `checked` reach the
  screen reader, and the checkmark row reports itself as selected.
- Sections are groups, the list is a list, headers are headers at level 2.
- Tab reaches every pressable row; Space and Return press it.

## Motion

The pressed highlight is native and immediate. Rows do not animate; the content
that opens from them does (the app's own navigation or sheet).
