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
| `depth` | `.depth(..)` | `number` | `0` | Its place in a `ToastLayer`: 0 is the front card, 1 and up sit behind it |
| `onAction` | `Action` event | event | — | The action was pressed |
| `onDismiss` | `Dismiss` event | event | — | It was swiped away past 56 pt, or flicked faster than 800 pt/s |
| children | `.child(..)` | JSX | none | The icon or mascot at the leading edge, drawn by the caller |

Notes

- It enters rising 16 pt and growing from 96 %, on a spring that settles in about
  400 ms without bouncing (Cohub Mobile's `enterSpring`). A shorter swipe springs
  back in about 400 ms.
- A card behind the front one sits 10 pt higher, 4 % smaller and 35 % fainter per
  place. Its sliver above the front card takes touches.
- The message wraps. Cohub Mobile clamps it at two lines; this does not yet.
- The shadow is `0 6 20` black at 14 %, as `SHADOW_FLOAT`.
- The toast takes no position on its own: put it in a `ToastLayer`.
- Not in this component yet: Cohub Mobile's auto-dismiss timers and the pause while
  a finger rests on the card. The app removes a toast when its timer says so.

## ToastLayer

The place toasts show: a layer over the page, 12 pt from the sides and 84 pt above
the bottom inset, over the tab bar as Cohub Mobile places them. Its children are
`Toast`s; the front one (`depth` 0) is in flow and sizes the stack.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| children | `.child(..)` | JSX | none | The toasts, the front one at depth 0 |

## Accessibility

- The title and message are read in order; the action is a button named by its title.
