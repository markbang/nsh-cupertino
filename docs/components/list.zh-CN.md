# 列表：`List`、`Section`、`ListTile`

iOS 的分组内嵌列表：行在一整块 10 pt 圆角表面上，页面边距 20 pt，细线从文字开始的位置起，
能打开的行走右箭头，已选中的行显示勾选。

度量来自 `cupertino_ui` 的 `CupertinoListSection.insetGrouped` 与 `CupertinoListTile`
（见 `NOTICE`）：20 pt 边距、20 pt 粗体分组标题、13 pt 的 header/footer 色脚注、44 pt 行
（带副标题 48 pt）、17 pt 标题、12 pt 副标题、20/14 pt 行内缩进与 28 pt 前置图标盒。

| | |
| --- | --- |
| 浅色 | ![列表，浅色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-light.png) |
| 深色 | ![列表，深色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-dark.png) |

## List

一整页的分组：背景、安全区、16 pt 边距以及 iOS 的回弹。

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `children` | `.child(..)` | JSX | — | 各分组 |
| `background` | `.background(..)` | token 名 | `system-grouped-background` | 分组背后的颜色 |
| `scroll` | `.scroll(..)` | `boolean` | `true` | 放在 `NavPage` 内时传 `false`，由页面的滚动承担 |

## Section

一组行放在同一块表面上，可选上方 header 与下方 footer。

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `header` | `.header(..)` | `string` | 无 | 20 pt 粗体，上方 16 pt、下方 6 pt |
| `footer` | `.footer(..)` | `string` | 无 | 13 pt、header/footer 色，下方 10 pt |
| `children` | `.child(..)` | JSX | — | 各行 |

## ListTile

一行：高 44 pt（带副标题 48 pt），前缩进 20 pt（有图标时 14 pt），标题 17 pt，副标题 12 pt。

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 标题，17 pt |
| `subtitle` | `.subtitle(..)` | `string` | 无 | 标题下的一行，12 pt secondary label，间距 3 pt |
| `leading` | `.leading(..)` | 图标名 | 无 | 28 pt 盒子里 22 pt 图标 |
| `leadingColor` | `.leading_color(..)` | token 名 | `system-blue` | 图标颜色 |
| `accessory` | `.accessory(..)` | `"chevron"` \| `"checkmark"` \| `"none"` | chevron | 右侧附件 |
| `checked` | `.checked(..)` | `boolean` | `false` | 显示勾选，并设置行的读屏状态 |
| `destructive` | `.destructive(..)` | `boolean` | `false` | 红色标题 |
| `separator` | `.separator(..)` | `boolean` | `true` | 行下的细线 |
| `disabled` | `.disabled(..)` | `boolean` | `false` | 变灰，不可按下 |
| `children` | `.child(..)` | JSX | 无 | 行尾的控件：`<ListTile title="Wi-Fi"><Switch/></ListTile>` |

事件：`onPress`。

说明

- 行自己绘制细线；分组最后一行传 `separator={false}`。
- 细线从文字开始处起：内缩 20 pt，有前置图标时为图标之后。
- 按压高亮是 `systemGrey4`（与 `CupertinoListTile` 一致），不是缩放。
- 没传 `accessory` 的行会显示右箭头：不打开任何东西的行传 `accessory="none"`。

## 无障碍

- 每行是按钮，名称为"标题。副标题"；`disabled` 与 `checked` 会传给读屏，勾选行会报告为已选中。
- 分组是 group，列表是 list，分组标题是层级 2 的 header。
- Tab 能到达每个可按下行；空格与回车可以按下。

## 动效

按压高亮由平台原生即时绘制。行本身不做动画；从行打开的内容（应用自己的导航或 Sheet）才有动画。
