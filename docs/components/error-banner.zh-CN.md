[English](error-banner.md)

# 错误横幅

软红色底上的行内错误：插图、标题、危险色的消息，以及末端的重试按钮。对应 Cohub Mobile 的 `DataError`：
20 pt 圆角，15 pt 半粗标题，13 pt 消息，44 pt 重试目标、图标 24 pt。高度由文字决定：两行消息时 72 pt。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 标题 |
| `message` | `.message(..)` | `string` | 无 | 出错的说明，危险色 |
| `onRetry` | `Retry` 事件 | 事件 | — | 重试按钮被按下 |
| children | `.child(..)` | JSX | 无 | 前缘的插图，画在 32 pt 的方框里 |

说明

- 横幅没有外边距，由页面安排位置。Cohub Mobile 的横幅与两侧各相距 16 pt。
- 重试目标是 44 pt 的按钮，无障碍标签为 `Retry`。
- 底色为 `danger-soft`，消息为 `system-red`，两者都跟随预设。

## 无障碍

- 重试按钮朗读为 "Retry"。
- 标题与消息按顺序朗读。
