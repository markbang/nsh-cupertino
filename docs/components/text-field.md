[简体中文](text-field.zh-CN.md)

# Text field

Two of iOS's text fields: `CupertinoTextField`'s rounded box (white on light,
black on dark, 5 pt corners, a 0.5 pt border at 20 % of the text color, 7 pt of
padding) and a form row's grouped surface (10 pt corners, no border). 44 pt tall
at least, a caret and selection in the tint color, iOS's clear and reveal
buttons.

| | |
| --- | --- |
| Light | ![Text fields, light](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/textfields-light.png) |
| Dark | ![Text fields, dark](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/textfields-dark.png) |

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `value` | `.value(..)` | `string` | `""` | The text; the app owns it |
| `placeholder` | `.placeholder(..)` | `string` | none | Shown while empty |
| `secure` | `.secure(..)` | `boolean` | `false` | Hides the text, with an eye button |
| `clear` | `.clear(..)` | `boolean` | `true` | A clear button while focused and non-empty |
| `leading` | `.leading(..)` | icon name | none | An icon before the text |
| `label` | `.label(..)` | `string` | none | What screen readers call the field |
| `keyboard` | `.keyboard(..)` | `"default"` \| `"email"` \| `"number"` \| `"phone"` \| `"url"` | `default` | The software keyboard |
| `returnKey` | `.return_key(..)` | `"done"` \| `"go"` \| `"next"` \| `"search"` \| `"send"` | `default` | The return key's label |
| `disabled` | `.disabled(..)` | `boolean` | `false` | Read-only, on the disabled fill, with a grey placeholder |
| `variant` | `.variant(..)` | `"rounded"` \| `"grouped"` | `rounded` | `CupertinoTextField`'s box or a form row's surface |

Events: `onChange(text)`, `onSubmit(text)`.

Notes

- The value is the app's: the field reports every change and shows what it is
  given. The clear button therefore clears by reporting `""` — set the value from
  `onChange`, or nothing happens.
- Clearing keeps the focus (and the keyboard) where it was.
- iOS draws no focus ring on a text field: the caret is the focus, and it stays
  visible on every input method.

## Accessibility

- The field is a text field with its placeholder or `label` as its name.
- The clear button is named "Clear text", the reveal button "Show text" / "Hide
  text"; both are 28 pt targets in the row's trailing edge, drawn in the clear
  button color (20 % of the text color) as iOS draws them.

## Motion

Nothing animates but the caret and the selection; the reveal and clear buttons
fade to 40 % while pressed.
