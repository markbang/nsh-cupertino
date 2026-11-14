# 设计说明：这些数字从哪里来

这个 crate 复制 iOS 的外观，而不是发明一套。下面每个颜色、尺寸与时长都来自一手资料，而不是凭记忆。

## 颜色

`src/tokens.rs` 用四种外观（浅色、深色、浅色高对比、深色高对比）保存 Apple 的语义色。取值与
[`flutter/packages`](https://github.com/flutter/packages/tree/main/packages/cupertino_ui) 中
`cupertino_ui/lib/src/colors.dart` 使用的相同，也就是 UIKit 的 `UIColor.systemBackground`、
`UIColor.label`、`UIColor.systemBlue` 等——例如 systemBlue 浅色 `#007aff`、深色 `#0a84ff`、
浅色高对比 `#0040dd`、深色高对比 `#409cff`。

这些角色的公开资料：

- [Color](https://developer.apple.com/design/human-interface-guidelines/color)：语义色优先于固定色板。
- [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)：每个语义色都有深色变体，而不是简单反色。
- [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)：高对比度变体。
- [UIColor](https://developer.apple.com/documentation/uikit/uicolor)：文档化的角色（`systemGroupedBackground`、`secondarySystemGroupedBackground`、`separator`、`opaqueSeparator`、`systemFill` 等）。

Apple 不发布十六进制值；上面的文件是 Flutter 团队对照 iOS UI kit 校验过的记录，是 Apple 自己的
（Figma）设计资源之外最接近一手资料的参考。

## 字号

`text_theme.dart`（`_kDefaultTextStyle` 与各主题样式）加上 iOS 17 的排版：

| 样式 | 字号 / 行高 | 字重 | 字距 |
| --- | --- | --- | --- |
| Large title | 34 / 41 | 700 | +0.38 |
| Title 1 | 28 / 34 | 400 | +0.36 |
| Title 2 | 22 / 28 | 400 | +0.35 |
| Title 3 | 20 / 25 | 400 | +0.38 |
| Headline | 17 / 22 | 600 | −0.41 |
| Body | 17 / 22 | 400 | −0.41 |
| Callout | 16 / 21 | 400 | −0.32 |
| Subheadline | 15 / 20 | 400 | −0.24 |
| Footnote | 13 / 18 | 400 | −0.08 |
| Caption 1 | 12 / 16 | 400 | 0 |
| Caption 2 | 11 / 13 | 400 | +0.07 |

iOS 用的是绝对行高（不是倍数），NSH 的 `lineHeight` 也是点数，所以这张表可以直接搬。
见 [Typography](https://developer.apple.com/design/human-interface-guidelines/typography)。

## 度量

| 项目 | 取值 | 来源 |
| --- | --- | --- |
| 最小触控目标 | 44 × 44 pt | `kMinInteractiveDimensionCupertino`；HIG [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| 导航栏高 | 44 pt，左右 16 pt，底部 8 pt | `nav_bar.dart`（`_kNavBarPersistentHeight`、`_kNavBarEdgePadding`、`_kNavBarBottomPadding`） |
| 大标题区块 | 额外 52 pt | `_kNavBarLargeTitleHeightExtension` |
| 紧凑标题接管 | 最后 10 pt | `_kNavBarShowLargeTitleThreshold` / `_kNavBarScrollUnderAnimationExtent` |
| 返回按钮命中宽度 | 50 pt | `_kNavBarBackButtonTapWidth` |
| 分组行圆角 | 10 pt（连续圆角） | `list_section.dart`（`_kDefaultInsetGroupedBorderRadius`） |
| 分组上边距 | 22 pt | `_kMarginTop` |
| 行内缩进 | 前 20 pt、后 14 pt | `list_tile.dart`（`_kPadding`） |
| 行最小高度 | 44 pt（带副标题 48） | `_kMinHeight`、`_kMinHeightWithSubtitle` |
| 前置图标盒 | 28 pt，到标题 16 pt | `_kLeadingSize`、`_kLeadingToTitle` |
| 分隔线缩进 | 20 pt，有图标时 20 + 28 + 16 | `_kInsetDividerMargin` + 前置 |
| 细线 | 0.33 pt（@3x 下 1 物理像素） | HIG [Layout](https://developer.apple.com/design/human-interface-guidelines/layout) |
| 开关 | 51 × 31 pt 轨道，27 pt 滑块，20 pt 行程 | `switch.dart`（`_kTrackWidth`、`_kTrackHeight`、`_kThumbRadius`） |
| 搜索框 | 36 pt 高，9 pt 圆角 | `search_field.dart`（`nav_bar.dart` 的 `_kSearchFieldHeight`、`_kDefaultBorderRadius`） |
| 按钮内边距 | large 16 × 20、medium 10 × 15、small 6 × 12 | `constants.dart`（`kCupertinoButtonPadding`） |
| 按钮圆角 | large 12 pt，medium/small 胶囊 40 pt | `kCupertinoButtonSizeBorderRadius` |
| 按钮按压透明度 | 0.4 | `CupertinoButton.pressedOpacity` |
| 着色按钮透明度 | 浅色 18 %、深色 26 % | `kCupertinoButtonTintedOpacity*` |

## 动效

| 项目 | 取值 | 来源 |
| --- | --- | --- |
| 页面推入 | 弹簧，阻尼 0.86，刚度 300 | NSH 导航栈的弹簧，对齐 iOS `kTransitionDuration` 500 ms 的手感（`route.dart`、`CupertinoPageRoute.kTransitionDuration`） |
| Sheet | 弹簧，阻尼 0.8，刚度 400 | `sheet.dart`（`_kDroppedSheetDragAnimationDuration` 300 ms，过渡 500 ms） |
| 按压 | 透明度 0.4，150 ms | `button.dart`、`constants.dart` |
| 开关滑块 | 200 ms | `switch.dart`（位置控制器的时长） |
| 卡片按压 | 缩放 0.97 | 本 crate 的约定，用于不是行的卡片 |

减少动态效果：加载指示器停止（静止帧），组件自己的过渡都很短，iOS 减少动态效果本身的行为
（更少、更短的动画）不需要单独分支。

## 有意不复制的东西

- **SF Symbols**：那是 Apple 的字体；这个 crate 自带 24 个 SVG 形状，用 `currentColor` 绘制。
- **UIKit 的模糊**：iOS 上导航栏与 Sheet 会模糊下方内容。NSH 支持 `backdrop-filter`，但在滚动页面上
  做模糊导航栏在 Web 上意味着整屏重绘；除非有理由，栏保持不透明。
- **侧滑返回**：iOS 上来自 `nsh/base` 的导航栈；Android 的返回手势交给平台（同样是 `nsh/base`），
  符合任务要求。
- **平台输入框**：`TextField` 使用 NSH 的原生输入；在 iOS 上就是系统输入框与系统键盘，正是设计所需。
