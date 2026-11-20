[English](status-pill.md)

# 状态标签

标示状态的小胶囊：6 pt 圆点，11 pt 半粗文字，底色为该色调的浅色。五种色调：`neutral`（灰）、
`success`、`warning`、`danger` 与 `info`，各有前景色与浅色底。尺寸与颜色来自 Cohub Mobile 的 `StatusPill`。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `label` | `.label(..)` | `string` | 无 | 状态名 |
| `tone` | `.tone(..)` | `string` | `"neutral"` | `neutral`、`success`、`warning`、`danger`、`info` |
| `dot` | `.dot(..)` | `boolean` | `true` | 标签前的圆点 |

说明

- 标签高 21 pt；圆点与文字使用该色调的前景色。
- 状态标签只是标签，不报告按压。

## 无障碍

- 标签作为一段文字朗读。
