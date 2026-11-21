[简体中文](glass-menu.zh-CN.md)

# Glass menu

A glass button that opens a menu out of its own shape, as iOS 26's pull-down
menus do. The menu is anchored to the button on phones and desktops alike.

| TSX | Rust | Type | Default | |
| --- | --- | --- | --- | --- |
| `icon` | `.icon(..)` | `string` | `"ellipsis"` | The button's icon |
| `label` | `.label(..)` | `string` | `"More"` | What screen readers call the button |
| `actions` | `.actions(..)` | `ContextAction[]` | `[]` | The items |
| `align` | `.align(..)` | `"start"` \| `"end"` | `"start"` | Which edge of the button the menu lines up with |
| `open` | `.open(..)` | `boolean` | — | Controlled |

`ContextAction`: `{ id, title, icon?, destructive?, disabled? }`, as `ContextMenu` takes them.

Events: `onOpenChange(open)`, `onAction(id)`.

Notes

- Behaviour is `nsh/base`'s `Popover`: a press outside, Escape and the Android
  back button close it. On phones it stays anchored to the button; it is not a
  bottom sheet, unlike `ContextMenu`'s.
- The menu's top lies on the button's centre line, 22 pt above the button's
  bottom edge, where the iOS menu opens.
- With the glass shader, one glass shape grows from the button's rect to the
  panel's (`GlassSpec`'s single-shape growth; its corners go from a capsule's
  to 28 pt through the shader's `roundness`). Without the shader, the
  material's fill is scaled from the button's box to the panel's: the
  corners scale with it, and there is no round blob mid-way.
- The items are not clipped to the growing shape: they fade in once the
  shape is nearly the panel, and scale and move with its width and centre.

## Accessibility

- The button is a button with the label you give it. It reports that it
  opens a popup, and whether the popup is open (expanded).
- The menu is a `menu` and its items are `menuitem`s. Opening it moves the
  keyboard focus to the first enabled item. On the desktops, closing it puts
  the focus back on the button, as `Popover` does.
- Escape, a press outside and a chosen item close it.

## Motion

Fitted to the iOS clip `research/ios-reference/motion/motion-menu.mp4`
(`tools/fit-glass-menu.py`), in ms from the press:

- **Shape** (width, height, horizontal centre): a spring, damping ratio 0.76,
  stiffness 380, mass 1.
- **Drop**: the panel also moves down and comes back: 380 pt × (a critically
  damped spring of stiffness 540 − one of 270). It peaks at 69 pt at about
  100 ms and is under 1 pt after 500 ms.
- **Corners**: a capsule's until 180 ms, then ease-in-out to 28 pt by 410 ms.
- **Items**: they fade in over 110–250 ms, ease-out.
- **Close**: it holds 70 ms, then shrinks to 0.94 and moves 17 pt down and
  5 pt left within 30 ms (ease-out), and fades within 60 ms (ease-in). It is
  gone at 130 ms, and the button fades back in.
- Reduce Motion: a 150 ms cross-fade in and out, no shape change.

The curves are pinned in Rust by sampling them every 30 ms
(`src/glass_menu.rs` tests).
