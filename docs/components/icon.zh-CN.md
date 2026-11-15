[English](icon.md)

# 图标

NSH 没有 SF Symbols；这个 crate 把组件需要的少量形状画成 SVG，使用元素的文字颜色，所以它们会跟随
主题与对比度设置。

| | |
| --- | --- |
| 浅色 | ![颜色，浅色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-light.png) |
| 深色 | ![颜色，深色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/lists-dark.png) |

```rust
icon("chevron.right", 13.0);          // 24 pt 下 2.4 pt 线宽
icon_stroke("checkmark", 18.0, 3.0);  // 更粗的线，像 iOS 的勾
```

TSX 里组件按名字接收图标：`<ListTile leading="bell" />`、`<Button icon="arrow.up.right" />`。

| 名称 | |
| --- | --- |
| `chevron.left`、`chevron.right`、`chevron.up`、`chevron.down` | 导航 |
| `checkmark` | 已选中的行 |
| `magnifyingglass` | 搜索 |
| `xmark.circle.fill` | 清除 |
| `eye`、`eye.slash` | 显示密码 |
| `person`、`bell`、`envelope` | 行 |
| `sun.max`、`moon`、`circle.lefthalf.filled` | 外观与状态 |
| `square.grid.2x2`、`list.bullet`、`slider.horizontal.3` | 分区与设置 |
| `info.circle`、`sparkles`、`arrow.up.right` | 说明、亮点、链接 |

未知名字不画任何东西（并记录日志），所以拼写错误看得见，而不是报错。

## 无障碍

图标没有文字：给包住它的控件一个 `label`，组件本身已经这么做（"Clear text"、"Show text"）。
