[简体中文](filter-chip.zh-CN.md)

# Filter chip

A capsule a list filters by: a 36 pt label in 15 pt semibold, an optional count
or window after it (13 pt), the accent fill with white text when chosen, a white
surface otherwise. Cohub Mobile's `FilterChip` gives the same look, and the same
16 pt sides.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `label` | `.label(..)` | `string` | none | The chip's label |
| `suffix` | `.suffix(..)` | `string` | none | A count or window: "3", "24h" |
| `selected` | `.selected(..)` | `boolean` | `false` | Chosen: the tint fill |

Events: `onPress`.

Notes

- The press counts over a 44 pt target and fades like a button.
- The accessibility label reads the suffix after the label.
- The reference spaces chips 4 pt apart; lay them out in a row with `gap`.

## Accessibility

- Role button, named by the label and the suffix.
