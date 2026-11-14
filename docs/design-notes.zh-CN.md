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

## 移植：以 `cupertino_ui` 为准

wave A 的组件清单、尺寸与交互细节是 Flutter 官方 `cupertino_ui` 1.1.6
（`packages/cupertino_ui/lib/src/*.dart`）的移植，逐个组件对照阅读。`NOTICE` 列出每个文件与
取用内容；简表：

| 组件 | 来源 | 这里据此修正 |
| --- | --- | --- |
| 颜色、字号 | `colors.dart`、`text_theme.dart` | 38 个角色（含 `systemGrey2`…`6`）、12 pt 行副标题、`cupertino_ui` 自有的 `section-header-footer`、`clear-button`、禁用输入框填充与活动指示器色 |
| 列表 | `list_section.dart`、`list_tile.dart` | 20 pt 页面边距（原为 16）、20 pt 粗体分组标题、13 pt 脚注色、44/48 pt 行、17/12 pt 标题与副标题、`systemGrey4` 按压填充、`systemGrey2` 且与文字同号的右箭头 |
| 导航 | `nav_bar.dart` | 返回按钮 8/6 pt 间距、20 pt 箭头、50 pt 命中宽度、栏与大标题改用最小高度 |
| 按钮 | `button.dart`、`constants.dart` | 44/32/28 pt 视觉高度 + 44 pt 目标、120/180 ms 淡入淡出、禁用文字用 tertiary label、图标为文字 1.2 倍 |
| 输入框 | `text_field.dart`、`search_field.dart` | `CupertinoTextField` 的 5 pt 盒子、20 % 边框与 7 pt 内边距作为 `rounded` 变体；搜索框 5.5/8 pt 内边距、20 pt 图标与 secondary label placeholder |
| 开关 | `switch.dart` | 双层滑块阴影、`secondarySystemFill` 关闭轨道、50 % 禁用透明度 |
| 活动指示器 | `activity_indicator.dart` | 透明度表、叶片几何、每秒八步一圈、叶片颜色 |

### 与 `cupertino_ui` 不同之处及原因

- **行分隔线。** `CupertinoListSection` 的分隔线从 14 + 42 pt（有前置图标）或 14 + 14 pt 开始，
  相对行自身的 20 pt 内缩，线会落在文字右侧 8 pt。iOS 是让线与文字对齐，HIG 也要求对齐体现层级，
  所以这里从文字开始（20 pt，有图标时 20 + 28 + 16）。
- **分组圆角。** `cupertino_ui` 使用超椭圆并在回退时用 `RoundedSuperellipseBorder`；NSH 的
  `border-radius` 在所有平台上都是圆角，所以这里是 10 pt 圆角。
- **开关拖动。** `CupertinoSwitch` 支持手指拖动滑块并拉伸 7 %；`nsh/base` 的开关是点按控件，
  本版本不含拖动。
- **搜索框的"取消"。** `CupertinoSearchTextField` 没有"取消"；`UISearchBar` 在编辑时显示，
  这个组件跟随搜索栏。

## 材质：来自 Lenso UI

`tokens::materials` 采用 Lenso UI 的结构
（`packages/tokens/themes/default/materials.css`）：每种外观一个半透明填充加一段模糊距离，
朝媒体方向更薄、朝文字方向更厚，另有一个 `chrome` 栏。取值是本项目自己的（20–30 pt 模糊、
70 %–94 % 填充），高对比度下每种填充更不透明。"玻璃只属于浮动层"这条规则来自 Apple
（`materials.md`、`liquid-glass.md`），Lenso UI 的 `DESIGN.md` 也有同样表述。没有复制任何 CSS。

## 对比度：三个低于 WCAG AA 的角色

浅色外观使用 Apple 自己的取值，其中三个在白色背景上的正文对比度低于 4.5:1：`system-blue`
4.02:1、`secondary-label` 3.44:1、`system-red` 3.55:1。深色外观是 5.8–6.4:1，高对比度取值达到
7.6 / 4.25 / 5.4:1。这个决定连同测量方法与应用可以做的覆盖，记录在
[issue #3](https://github.com/markbang/nsh-cupertino/issues/3)：以 4.5:1 为门槛的应用应把用户的
"提高对比度"设置传给 `<Theme contrast="high">`，或在自己的主题里覆盖这三个角色。

## 有意不复制的东西

- **SF Symbols**：那是 Apple 的字体；这个 crate 自带 21 个 SVG 形状，用 `currentColor` 绘制。
- **UIKit 的模糊**：iOS 上导航栏与 Sheet 会模糊下方内容。NSH 支持 `backdrop-filter`，但在滚动页面上
  做模糊导航栏在 Web 上意味着整屏重绘；除非有理由，栏保持不透明。
- **侧滑返回**：iOS 上来自 `nsh/base` 的导航栈；Android 的返回手势交给平台（同样是 `nsh/base`），
  符合任务要求。
- **平台输入框**：`TextField` 使用 NSH 的原生输入；在 iOS 上就是系统输入框与系统键盘，正是设计所需。
