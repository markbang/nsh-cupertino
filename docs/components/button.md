# Button

iOS's four button looks, with the pressed state iOS draws: the whole button fades
to 40 % over 150 ms.

| | |
| --- | --- |
| Light | ![Buttons, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/buttons-light.png) |
| Dark | ![Buttons, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/buttons-dark.png) |

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | none | The text; leave it out for an icon-only button |
| `variant` | `.variant(..)` | `"filled"` \| `"tinted"` \| `"plain"` \| `"destructive"` | `filled` | The look |
| `size` | `.size(..)` | `"large"` \| `"medium"` \| `"small"` | `large` | Padding and text size |
| `icon` | `.icon(..)` | icon name | none | An icon before the title |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Dimmed, reports nothing |
| `label` | `.label(..)` | `string` | none | What screen readers say, for an icon-only button |

Events: `onPress`.

Looks

- **filled**: `systemBlue` background, white text, 12 pt corners, 44 pt tall.
- **tinted**: the tint at 18 % in light and 26 % in dark, blue text.
- **plain**: blue text only.
- **destructive**: red text (iOS's destructive style), same shape as plain.

Sizes

| Size | Text | Padding | Corners | Target |
| --- | --- | --- | --- | --- |
| large | 17 semibold | 20 × 16 | 12 pt | 44 pt |
| medium | 15 semibold | 15 × 10 | pill (40 pt) | 44 pt |
| small | 15 semibold | 12 × 6 | pill (40 pt) | 44 pt |

Notes

- The press target is 44 pt at every size, as the human interface guidelines ask.
- A disabled button reports no presses and is announced as dimmed; it keeps its
  shape at 40 % of the tint.

## Accessibility

- Role button, named by `label`, else its title.
- Keyboard focus draws a ring (`focus-visible`); Space and Return press.

## Motion

`active:` fades the button to 40 % over 150 ms and back; there is no scale, as on
iOS.
