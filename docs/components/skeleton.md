[简体中文](skeleton.zh-CN.md)

# Skeleton

Grey placeholders for a list that is still loading: each row is a 72 pt slot of a
46 pt avatar, two text lines and a trailing pill, drawn in the raised surface, so
the swap to the real rows does not move anything. The shapes are Cohub Mobile's
`LoadingRows`.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `rows` | `.rows(..)` | `number` | `3` | How many rows to draw |

Notes

- The bones are `system-gray5`, the surface of a raised control in both appearances.
- It does not animate. A loader that pulses is the caller's to add.
- The title line is 58, 68 or 78 % of the text column, the subtitle 38 or 53 %,
  cycling by row, as Cohub Mobile does.

## Accessibility

- It is a progress bar labelled "Loading". Replace it with the content when the
  content arrives.
