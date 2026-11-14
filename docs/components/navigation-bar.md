# Navigation bar

A page's bar, and the whole page with it: a back button, a title that is compact
or large, trailing actions, and a hairline that appears once content scrolls
under it.

| | |
| --- | --- |
| Light | ![Navigation bar, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/navigation-light.png) |
| Dark | ![Navigation bar, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/navigation-dark.png) |

## NavPage

`NavPage` is the page: the bar over a scrolling view. Its large title is the first
thing in the scroll content, so it scrolls away under the bar; the compact title
and the hairline fade in over its last 10 pt. The fade is driven by the scroll
offset natively (`scrollValue` + an interpolation), so no frame of the scroll
reaches your code.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The bar's title; the compact one when there is a `largeTitle` |
| `largeTitle` | `.large_title(..)` | `string` | none | 34 pt bold heading that scrolls away |
| `back` | `.back(..)` | `string` | none | The back button's label; without it there is no back button |
| `trailing` | `.trailing(..)` | `string` | none | A tinted trailing action ("Done", "Edit") |
| `background` | `.background(..)` | token name | `system-grouped-background` | The page's background |
| `children` | `.child(..)` | JSX | — | The page's content |

Events: `onBack`, `onTrailing`.

Notes

- The bar is 44 pt tall, padded 16 pt at the sides; the large title adds 52 pt.
- Pressing the title scrolls the page back to the top, as iOS does.
- Safe area: the page pads its own top inset; the content ends above the home
  indicator.

## NavigationBar

The bar alone, for content you scroll yourself: a compact title, an optional large
title below it, a back button and a slot for trailing actions.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The compact title |
| `largeTitle` | `.large_title(..)` | `string` | none | A large title below the bar |
| `back` | `.back(..)` | `string` | none | Back button label |
| `trailing` | `.trailing(..)` | JSX | none | Anything at the trailing edge |
| `collapsed` | `.collapsed(..)` | `number` 0–1 | `0` | Fades the compact title and the hairline in |

Events: `onBack`.

## Accessibility

- The large title is a header at level 1; screen reader users can jump to it.
- The back button is a button named by its label ("Cupertino"), 44 pt tall.
- The title in `NavPage` is pressable (scroll to top) and carries the page's name
  as its label, so the heading is never only visual.

## Motion

The compact title and hairline fade over the last 10 pt of the large title's
52 pt; nothing animates on its own. Pushing a page uses iOS's
`kTransitionDuration` (500 ms) spring, which NSH's navigation stack plays when the
app uses one.
