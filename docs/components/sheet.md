[简体中文](sheet.zh-CN.md)

# Sheet

A panel from the bottom with iOS's two detents: **medium** at half the screen and
**large** just below the status bar. Drag the grabber (or the header) between
them; a drag past medium closes it.

| | |
| --- | --- |
| Light | ![Sheet, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/sheet-open-light.png) |
| Dark | ![Sheet, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/sheet-open-dark.png) |

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `open` | `.open(..)` | `boolean` | — | Controlled; follow `onOpenChange` |
| `defaultOpen` | `.default_open(..)` | `boolean` | `false` | Open at first, uncontrolled |
| `detent` | `.detent(..)` | `"medium" \| "large"` | none | Controlled detent |
| `defaultDetent` | `.default_detent(..)` | `"medium" \| "large"` | `"large"` | Detent at first |
| `title` | `.title(..)` | `string` | none | 17 pt semibold in the header |
| `leading` | `.leading(..)` | `string` | none | "Cancel", in the tint |
| `trailing` | `.trailing(..)` | `string` | none | "Done", in the tint |
| `scroll` | `.scroll(..)` | `boolean` | `true` | `false` for content that scrolls itself (a page, a stack) |
| `children` | `.child(..)` | JSX | — | The content |

Events: `onOpenChange(open)`, `onDetentChange(detent)`, `onCancel()`, `onLeading()`,
`onTrailing()`.

Notes

- The panel is the `thick` material (`tokens::materials`): its fill over a
  30 pt blur, so the page shows through faintly as it does on iOS.
- One large panel is moved by an animated offset, so the drag, the finger's
  release velocity and the springs between detents run on the UI thread.
- The backdrop dims only at large (0.32) and hardly at medium (0.03), as iOS.
- Escape, the Android back button, a press on the backdrop and a drag past
  medium close it; `Done` reports the trailing action and asks to close, and
  `Cancel` reports the leading one the same way.
- Give the app's `detent` and follow `onDetentChange` when the app owns it; a
  drag that changes detents also reports it.
- The panel is at most 640 pt wide (`metrics::SHEET_MAX_WIDTH`). On a window
  wider than that it sits centred as a card with all four corners rounded and
  16 pt above the bottom edge, as an iPad's form sheet does; on a phone it is
  the full width of the screen.

## Accessibility

- The panel is a dialog; the grabber's header is a group. The title is read once.
- Escape and back close it; Return presses the trailing action.

## Motion

The entrance is the design system's sheet spring (critical damping, 1.0; stiffness
280), fitted to iOS's sheet recording; between detents the release velocity feeds
the same spring. Reduce Motion removes the
entrance and exit.

On iOS, Cohub Mobile presents the native SwiftUI sheet (`AdaptiveSheet.ios.tsx:2`), so
its Reanimated sheet springs (`motion.ts:36-47`) run only on the non-iOS branch. Do not
align this spring to Cohub's values: it is fitted to the iOS recording.
