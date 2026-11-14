# Activity indicator

iOS's spinner: eight rounded blades around a circle, each fading in turn, one turn
per 800 ms, drawn natively.

| | |
| --- | --- |
| Light | ![Activity indicator, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/indicators-light.png) |
| Dark | ![Activity indicator, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/indicators-dark.png) |

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `size` | `.size(..)` | `number` | `20` | The box in points; the blades scale with it |
| `color` | `.color(..)` | token name | `tertiary-label` | The blades' color |
| `label` | `.label(..)` | `string` | `"Loading"` | What screen readers say |
| `animating` | `.animating(..)` | `boolean` | `true` | `false` freezes a still frame |

Notes

- Each blade's opacity is a keyframe animation on the UI thread, phased a step
  apart: no frame of the spin reaches Rust or JS, and it costs one animated value
  per blade.
- With reduced motion (`reduceMotion()`) the blades show a still frame instead of
  turning, so nothing moves for users who asked for that.
- `tertiaryLabel` is the color iOS uses inside a row; pass `"system-blue"` for a
  prominent spinner.

## Accessibility

- Role progress indicator, named by `label`.

## Motion

800 ms per turn, linear, forever. The still frame keeps the same gradient of
opacity, so the shape reads the same.
