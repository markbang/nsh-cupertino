[English](empty-state.md)

# 空状态

列表没有内容可列时显示的内容：居中的插图与角标、标题、说明，以及可选的纯文字操作。尺寸来自 Cohub Mobile 的
`EmptyState`：92 pt 插图；角标是 32 pt 的强调色圆盘，位于插图左下角；17 pt 半粗标题；15 pt 说明，最宽 300 pt。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 标题 |
| `description` | `.description(..)` | `string` | 无 | 标题下的说明 |
| `badge` | `.badge(..)` | `string` | 无 | 圆盘上的图标名：`folder`、`magnifyingglass` 等 |
| `action` | `.action(..)` | `string` | 无 | 说明下的纯文字按钮，按其标题 |
| `actionIcon` | `.action_icon(..)` | `string` | 无 | 操作按钮标题前的图标 |
| `onAction` | `Action` 事件 | 事件 | — | 操作被按下 |
| children | `.child(..)` | JSX | 无 | 插图，画在 92 pt 的方框里 |

说明

- 插图属于应用：本库不画吉祥物。把品牌标记作为 children 传入；角标位于其左下角。
- 组件没有外边距，由页面安排位置，页面的间距作用于它与相邻内容之间。
- 角标圆盘使用强调色（`system-blue`），图标使用 `on-tint`。

## 无障碍

- 标题与说明按顺序朗读；操作是按钮。
- 插图是装饰性的，不设标签，文字承载含义。
