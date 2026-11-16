[简体中文](scroll-edge.zh-CN.md)

# Scroll edge

The graduated blur and fade at the edge of a page, as iOS 26's
`UIScrollEdgeEffect`: content leaving under a floating bar is blurred hardest at
the edge, sharpens over about 110 pt, and fades into the page's background, so it
leaves through a ramp rather than a cut. The effect appears as the content
scrolls under (`reveal` runs 0 → 1 over the first 26 pt, which `NavPage` wires to
its own scroll offset) and is absent at rest at the top.

```tsx
<View style={{ flex: 1 }}>
  <Scroll onScroll={(e) => offset.set(e.offset)}>{content}</Scroll>
  <ScrollEdge edge="top" height={110} reveal={Math.min(1, offset() / 26)} />
</View>
```

| Prop | Type | Default | |
| --- | --- | --- | --- |
| `edge` | `"top" \| "bottom"` | `"top"` | Which edge the ramp hangs from. |
| `height` | number | 80 | How far it reaches, in points. |
| `reveal` | number | 1 | 0 hides it, 1 shows it fully. |
| `blur` | number | 20 | The blur at the strong edge, in points. |

It draws with a shader (`ShaderEffect` + `sample_backdrop`); on a machine without
one it draws a frosted strip whose opacity follows `reveal`. Place it in the
page's top (or bottom) layer, under the bars.
