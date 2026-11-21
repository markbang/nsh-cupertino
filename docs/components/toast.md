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
| `duration` | `.duration(..)` | `number` (ms) | by tone and action, see below | How long it stays from when it shows |
| `sticky` | `.sticky(..)` | `boolean` | `false` | No timer: it stays until it is swiped away or the app removes it |
| `onAction` | `Action` event | event | — | The action was pressed; the app removes the toast |
| `onDismiss` | `Dismiss` event | event | — | Swiped away past 56 pt, or flicked faster than 800 pt/s |
| `onExpire` | `Expire` event | event | — | Its time ran out and it has faded; the app removes the toast |
| children | `.child(..)` | JSX | none | The icon or mascot at the leading edge, drawn by the caller |

Notes

- It enters rising 16 pt and growing from 96 %, on a spring that settles in about
  400 ms without bouncing (Cohub Mobile's `enterSpring`). A shorter swipe springs
  back in about 400 ms.
- A card behind the front one sits 10 pt higher, 4 % smaller and 35 % fainter per
  place. Touches pass through it to the page, as Cohub Mobile's stack does.
- The message wraps. Cohub Mobile clamps it at two lines; this does not yet.
- The shadow is `0 6 20` black at 14 %, as `SHADOW_FLOAT`.
- The toast takes no position on its own: put it in a `ToastLayer`.

### Time on screen

A toast leaves by its time, by a swipe, or by the app. Its time follows Cohub
Mobile's `toast-queue.ts`, which sets it by tone and action, not by the length of
the text (the reference has no length rule):

| Tone | No action | With an action |
| --- | --- | --- |
| `neutral`, `success` | 3.2 s | 5 s |
| `danger` | 5 s | 5 s |

`duration` replaces the table; `sticky` turns the timer off. The time starts when
the toast shows. When it runs out, the toast fades (240 ms) and emits `Expire`.

- Pressing and holding the front card pauses every toast in the layer, as Cohub
  Mobile's `ToastClock` does. Releasing resumes each one with the time it had left,
  and at least 1.5 s (`RELEASE_GRACE_MS`). A swipe in progress pauses them too.
- A card behind the front one cannot be held: its sliver lets touches through.

### Dismiss reasons

| Event | Why it leaves | Who removes it |
| --- | --- | --- |
| `Dismiss` | Swiped past 56 pt or flicked faster than 800 pt/s | The app, on `Dismiss`; the card has already left |
| `Expire` | Its time ran out and it faded | The app, on `Expire` |
| `Action` | The action was pressed | The app, on `Action` |


## ToastLayer

The place toasts show: a layer over the page, 12 pt from the sides and 84 pt above
the bottom inset, over the tab bar as Cohub Mobile places them. Its children are
`Toast`s; the front one (`depth` 0) is in flow and sizes the stack.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| children | `.child(..)` | JSX | none | The toasts, the front one at depth 0 |

## Accessibility

- The title and message are read in order; the action is a button named by its title.
