[English](toast.md)

# 提示条（Toast）

浮动卡片上的简短确认或失败提示：前缘的图标或吉祥物、标题、可选的消息和可选的文字操作。对应 Cohub Mobile 的
`Toast` 卡片：20 pt 圆角、柔和阴影、`tertiary-system-background`（浅色为白，深色为 `#2c2c2e`），`danger` 时为红色边框。
标题 17 pt 半粗，消息 13 pt 的次级标签色。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 说明发生了什么的一行 |
| `message` | `.message(..)` | `string` | 无 | 其下的详情 |
| `tone` | `.tone(..)` | `"neutral"` \| `"success"` \| `"danger"` | `neutral` | `danger` 画红色边框 |
| `action` | `.action(..)` | `string` | 无 | 末端的文字操作，用主色 |
| `onAction` | `Action` 事件 | 事件 | — | 操作被按下 |
| children | `.child(..)` | JSX | 无 | 前缘的图标或吉祥物，由调用方绘制 |

说明

- 提示条不设位置：由页面或图层安排。Cohub Mobile 的提示堆叠在底部安全区上方 84 pt、标签栏之上，并以弹簧滑入；
  本组件只提供卡片本身。
- 消息会换行。Cohub Mobile 限制为两行，本组件暂未限制。
- 阴影与 `SHADOW_FLOAT` 相同：黑色、0 6 20、14%。

## 无障碍

- 标题与消息按顺序朗读；操作是以其标题命名的按钮。
