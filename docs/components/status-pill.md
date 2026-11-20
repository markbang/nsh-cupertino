[简体中文](status-pill.zh-CN.md)

# Status pill

A small capsule that labels a state: a 6 pt dot and an 11 pt semibold label on a
soft fill of the tone. Five tones: `neutral` (grey), `success`, `warning`,
`danger` and `info`, each with its ink and its soft fill. The sizes and colors
are Cohub Mobile's `StatusPill`.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `label` | `.label(..)` | `string` | none | The state's name |
| `tone` | `.tone(..)` | `string` | `"neutral"` | `neutral`, `success`, `warning`, `danger`, `info` |
| `dot` | `.dot(..)` | `boolean` | `true` | A dot before the label |

Notes

- A pill is 21 pt tall; its dot and label take the tone's ink.
- Pills are labels, not buttons: they report no presses.

## Accessibility

- The label is read as a single text.
