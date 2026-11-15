[简体中文](list.zh-CN.md)

# Lists: `List`, `Section`, `ListTile`

iOS's inset grouped lists: rows on one 10 pt surface with 20 pt page margins,
hairline separators that start where the text starts, a chevron for a row that
opens something and a checkmark for a chosen one.

The metrics are `cupertino_ui`'s `CupertinoListSection.insetGrouped` and
`CupertinoListTile` (see `NOTICE`): 20 pt margins, a 20 pt bold group header,
a 13 pt footer in the header/footer color, 44 pt rows (48 with a subtitle), a
17 pt title, a 12 pt subtitle, 20/14 pt row insets and a 28 pt leading box.

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
| `background` | `.background(..)` | token name | `system-grouped-background` | Behind the sections |
| `scroll` | `.scroll(..)` | `boolean` | `true` | `false` inside `NavPage`, whose scroll already runs the page |

## Section

A group of rows on one surface, with an optional header above and footer below.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `header` | `.header(..)` | `string` | none | 20 pt bold, 16 pt above, 6 pt below |
| `footer` | `.footer(..)` | `string` | none | 13 pt in the header/footer color, 10 pt below |
| `children` | `.child(..)` | JSX | — | The rows |

## ListTile

A row: 44 pt tall (48 with a subtitle), 20 pt leading inset (14 when there is an
icon), title at 17 pt, subtitle at 12 pt.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The row's title, 17 pt |
| `subtitle` | `.subtitle(..)` | `string` | none | A line under the title, 12 pt secondary label, 3 pt below it |
| `leading` | `.leading(..)` | icon name | none | A 28 pt box with a 22 pt icon |
| `leadingColor` | `.leading_color(..)` | token name | `system-blue` | The icon's color |
| `accessory` | `.accessory(..)` | `"chevron"` \| `"checkmark"` \| `"none"` | chevron | At the trailing edge |
| `checked` | `.checked(..)` | `boolean` | `false` | Shows a checkmark and sets the row's state |
| `destructive` | `.destructive(..)` | `boolean` | `false` | Red title |
| `separator` | `.separator(..)` | `boolean` | `true` | The hairline under the row |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Dimmed, not pressable |
| `children` | `.child(..)` | JSX | none | A control at the trailing edge: `<ListTile title="Wi-Fi"><Switch/></ListTile>` |

Events: `onPress`.

## Separators

Every row but the last of its group draws a hairline, whatever the row is: a
plain row, a subtitle, a destructive or disabled row, a leading icon, a chevron,
a checkmark selection. The line starts where the text starts (after a leading
icon, at the row's own inset otherwise) and is one **device pixel**:

```text
thickness = round(max(configured * pixelRatio, 1)) / pixelRatio
```

With the configured 0.33 pt that is 0.33 pt at @3x, 0.5 pt at @2x and 1 pt at
1x. Without the floor a 1x display rounds the line away, which is what left rows
without a separator on the web. Set `separator={false}` only on the last row of a
group; an empty group draws none.

Notes

- Rows draw their own hairline; give the last row of a group `separator={false}`.
- The hairline starts where the text starts: 20 pt in, or after the leading icon.
- The pressed highlight is `systemGrey4`, as `CupertinoListTile` fills it, not a
  scale.
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
