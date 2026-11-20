[English](filter-chip.md)

# 筛选芯片

列表用来筛选的胶囊：36 pt 高，标签为 15 pt 半粗，后面可选计数或时间窗（12 pt）；选中时为着色底、白色文字，
否则为白色表面。与 Cohub Mobile 的 `FilterChip` 外观一致，左右内边距 16 pt。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `label` | `.label(..)` | `string` | 无 | 芯片的标签 |
| `suffix` | `.suffix(..)` | `string` | 无 | 计数或时间窗："3"、"24h" |
| `selected` | `.selected(..)` | `boolean` | `false` | 已选中：着色底 |

事件：`onPress`。

说明

- 按压的命中区域为 44 pt，按压时与按钮一样淡出。
- 无障碍标签会读出标签与后面的计数。
- 参考画面中芯片间距约 4 pt，用 `gap` 排成一行。

## 无障碍

- 角色为按钮，名称为标签与计数。
