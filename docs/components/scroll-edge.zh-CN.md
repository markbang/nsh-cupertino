[English](scroll-edge.md)

# 滚动边缘

页面边缘的渐进模糊与淡出，对应 iOS 26 的 `UIScrollEdgeEffect`：从浮动栏下面离开的内容在边缘处
模糊最强，约 110 pt 内逐渐变清晰，并淡入页面背景，所以它是顺着一段渐变离开，而不是被一刀切断。
效果随内容滚入而出现（`reveal` 在最开始 26 pt 滚动中从 0 到 1，`NavPage` 把它接到自己的滚动偏移），
顶部静止时不显示。

```tsx
<View style={{ flex: 1 }}>
  <Scroll onScroll={(e) => offset.set(e.offset)}>{content}</Scroll>
  <ScrollEdge edge="top" height={110} reveal={Math.min(1, offset() / 26)} />
</View>
```

| 属性 | 类型 | 默认 | |
| --- | --- | --- | --- |
| `edge` | `"top" \| "bottom"` | `"top"` | 渐变从哪条边开始。 |
| `height` | number | 80 | 影响范围，单位 pt。 |
| `reveal` | number | 1 | 0 隐藏，1 完全显示。 |
| `blur` | number | 20 | 最强处的模糊，单位 pt。 |

它用着色器绘制（`ShaderEffect` + `sample_backdrop`）；没有 GPU 着色器时画一条磨砂条，
不透明度跟随 `reveal`。放在页面顶部（或底部）那一层、栏的下方。
