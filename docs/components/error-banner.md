[简体中文](error-banner.zh-CN.md)

# Error banner

An inline failure on a soft danger fill: an illustration, a title, the message in
the danger colour, and a retry button at the trailing edge. Cohub Mobile's
`DataError`: 20 pt corners, 15 pt semibold title, 13 pt message, a 44 pt retry
target with the glyph at 24 pt. Its height is its text: 72 pt with a two-line message.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The headline |
| `message` | `.message(..)` | `string` | none | What went wrong, in the danger colour |
| `onRetry` | `Retry` event | event | — | The retry button was pressed |
| children | `.child(..)` | JSX | none | The illustration at the leading edge, in a 32 pt box |

Notes

- The banner has no margins: the screen places it. Cohub Mobile's is 16 pt in from
  each edge.
- The retry target is a 44 pt button with the `Retry` label for screen readers.
- The fill is `danger-soft` and the message `system-red`: both follow the preset.

## Accessibility

- The retry button is read as "Retry".
- Its title and message are read in order.
