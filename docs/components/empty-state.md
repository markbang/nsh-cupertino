[简体中文](empty-state.zh-CN.md)

# Empty state

What a list shows when it has nothing to list: an illustration with a badge, a
headline, a description and an optional plain action, centred. The sizes are Cohub
Mobile's `EmptyState`: a 92 pt illustration, the badge a 32 pt accent disc at its
bottom-left, a 17 pt semibold headline, a 15 pt description at most 300 pt wide.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The headline |
| `description` | `.description(..)` | `string` | none | The line under it |
| `badge` | `.badge(..)` | `string` | none | An icon name on the accent disc: `folder`, `magnifyingglass`, ... |
| `action` | `.action(..)` | `string` | none | A plain button under the description, by its title |
| `actionIcon` | `.action_icon(..)` | `string` | none | The action's icon, before its title |
| `onAction` | `Action` event | event | — | The action was pressed |
| children | `.child(..)` | JSX | none | The illustration, drawn in a 92 pt box |

Notes

- The illustration is the app's: the library draws no mascot. Pass the brand mark
  as the children; the badge sits on its bottom-left corner.
- The component has no margins. The screen places it, and the page's gap applies
  between it and its neighbours.
- The badge's disc is the tint (`system-blue`), with an icon in `on-tint`.

## Accessibility

- The headline and the description are read in order; the action is a button.
- The illustration is decorative: give it no label, the words carry the meaning.
