# Icons

NSH has no SF Symbols; this crate draws the handful of shapes the components need
as SVG in the element's text color, so they follow the theme and the contrast
setting.

| | |
| --- | --- |
| Light | ![Color, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-light.png) |
| Dark | ![Color, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-dark.png) |

```rust
icon("chevron.right", 13.0);          // 2.4 pt line, at 24 pt
icon_stroke("checkmark", 18.0, 3.0);  // a heavier line, as iOS draws a tick
```

In TSX, components take an icon by name: `<ListTile leading="bell" />`,
`<Button icon="arrow.up.right" />`.

| Name | |
| --- | --- |
| `chevron.left`, `chevron.right`, `chevron.up`, `chevron.down` | Navigation |
| `checkmark` | A chosen row |
| `magnifyingglass` | Search |
| `xmark.circle.fill` | Clear |
| `eye`, `eye.slash` | Reveal a password |
| `person`, `bell`, `envelope` | Rows |
| `sun.max`, `moon`, `circle.lefthalf.filled` | Appearance and state |
| `square.grid.2x2`, `list.bullet`, `slider.horizontal.3` | Sections and settings |
| `info.circle`, `sparkles`, `arrow.up.right` | Notes, highlights, links |

Unknown names draw nothing (and log), so a typo is visible rather than loud.

## Accessibility

An icon has no text: give the control around it a `label`, which the components
do ("Clear text", "Show text").
