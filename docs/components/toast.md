[简体中文](toast.zh-CN.md)

# Toast

A short confirmation or failure on a floating card: a leading icon or mascot, a
title, an optional message and an optional text action. Cohub Mobile's `Toast`
card: 20 pt corners, a soft shadow, `tertiary-system-background` (white on light,
`#2c2c2e` on dark), and a red border for `danger`. Its title is 17 pt semibold and
its message 13 pt in the secondary label.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The line that says what happened |
| `message` | `.message(..)` | `string` | none | A detail under it |
| `tone` | `.tone(..)` | `"neutral"` \| `"success"` \| `"danger"` | `neutral` | `danger` draws a red border |
| `action` | `.action(..)` | `string` | none | A text action at the trailing edge, in the tint |
| `onAction` | `Action` event | event | — | The action was pressed |
| children | `.child(..)` | JSX | none | The icon or mascot at the leading edge, drawn by the caller |

Notes

- The toast takes no position: a screen or a layer places it. Cohub Mobile's
  stack sits 84 pt above the bottom inset, over the tab bar, and slides in on a
  spring; this component is the card only.
- The message wraps. Cohub Mobile clamps it at two lines; this does not yet.
- The shadow is `0 6 20` black at 14 %, as `SHADOW_FLOAT`.

## Accessibility

- The title and message are read in order; the action is a button named by its title.
