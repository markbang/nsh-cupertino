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

上表的字距是 SF Pro 在这些字号下的值：只在绘制这款字体的平台上生效（Apple 平台，
见 [`tokens::tracking`]）。其它平台有自己的系统字体，iOS 的字距会让它们变松或变挤，
全角笔画的中文最明显。`Theme` 改为写上各平台的字体列表（`tokens::font_family`）：
Android 是 Roboto 加 Noto Sans CJK SC，Windows 是 Segoe UI 加微软雅黑 UI，
Linux 是 Inter 与 Cantarell，Web 以 `-apple-system` 优先。Apple 平台不指定：
SF Pro 与苹方就是这套设计自己的字体。

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
| Sheet | 弹簧，阻尼 1.0（临界），刚度 280，按 iOS 的 sheet 录屏（`motion-sheet.mp4`）拟合 | `sheet.dart`（`_kDroppedSheetDragAnimationDuration` 300 ms，过渡 500 ms） |
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

## 液态玻璃：哪些是真折射，哪些是近似

`src/glass.rs` 用一段 WGSL shader 绘制浮动层材质。Apple 没有公开实现，因此行为来自它自己的描述，
数值是本项目自己的：

- [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)（WWDC25）：
  光在边缘被弯折、聚集，而不是像模糊那样散射；高光随光照移动；材质会适应背后内容；
  `regular`、`clear` 与着色变体；交互变体；以及在 `GlassEffectContainer` 内形变的形状。
- HIG [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
  与 [Liquid Glass](https://developer.apple.com/design/human-interface-guidelines/liquid-glass)：
  玻璃只属于浮动层，绝不用于内容；不要把文字放在无法保证对比度的玻璃上；增强对比度时材质接近不透明。
- [conorluddy/LiquidGlassReference](https://github.com/conorluddy/LiquidGlassReference)：
  同一组特性的书面规格（折射对比模糊、高光响应、变体、容器）。

shader 做了什么，以及每一部分有多接近：

| 部分 | 本项目做法 | 保真度 |
| --- | --- | --- |
| 折射 | 表面的 SDF 给出高度场（边缘 `BEVEL` 点的斜面，内部平整），其梯度位移背景采样，边缘最强；平整的中部不放大（iOS：1.000 ± 0.002） | 对被采样的画面是**真实折射**；高度曲线是选定的，不是 Apple 的光学 |
| 模糊 | 9 到 17 次背景采样，黄金螺旋分布、逐像素旋转；`quality` 可减少 | 采样画面的模糊，比可分离高斯粗糙 |
| 高光边缘 | 斜面上 `abs(dot(normal, light))`：光轴两端亮度相同，与 iOS 上下边缘高光峰值相等一致；边缘一条细亮线 | 沿轮廓连续；Apple 高光的形状是它自己的 |
| 自适应着色 | 当模糊背景的亮度会与文字冲突时，着色 alpha 升到最多 96 % | 近似"随背景适应"；Apple 的规则未公开 |
| 色散 | 沿法线相距半像素采样红、蓝，仅限边缘带 | ≤ 1 px，与 Apple 的边缘一致 |
| 动态光照 | `light`（角度）与由应用驱动的 `tilt` 角 | NSH 不提供设备姿态，倾斜不会自动发生 |
| `GlassEffectContainer` | `GlassGroup`：一个 shader 覆盖两个矩形，用平滑最小值（`spacing`）融合，并在两套布局之间弹动 | 共享采样区域与融合轮廓，符合 Apple 要求；不迁移形状内容 |
| 交互 | 按压在 UI 线程把镜头弹到 1.92 % 的放大，并压缩 3.5 % | 数值与时长（约 250 ms）是本项目的；降低动态效果保留数值、去掉弹簧 |

这些做法对照了解决同一问题的开源实现；`NOTICE` 逐条列出许可证与取用内容。没有复制代码：
WGSL、SDF 与数值都在本仓库里写就。

### Web 运行时只绑定每个程序的一个 uniform block

为 Web 编译的 shader 里，每个 struct 会按阶段各生成一个 uniform block——naga 把它们命名为
`Nsh_block_0Vertex` 与 `Nsh_block_0Fragment`——而 `nsh` 的 Web 运行时只绑定 fragment 阶段反射给出的名字。
vertex 阶段的 block 一直未绑定，WebGL 以 `GL_INVALID_OPERATION` 拒绝绘制，视图什么都不显示。
`tools/patch-runtime.mjs` 会把所有名字以所请求名字开头的 block 一并绑定，`tools/glass-shots.mjs`
在截图前对构建应用它。正确的修复属于 `nsh`（`crates/nsh-platform-web/web/nsh.js` 的 `shaderProgram`）；
在它落地之前，Web 构建需要这个补丁才能绘制任何 shader。

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

## Liquid Glass 的实测数字

iOS 26/27 的这种材质不是一块磨砂面板：它很薄、会发光，会折射背后的内容、保留背后的结构，并在一侧边缘接住光。下面的数字来自一手资料和经过校准的实现，再用我们自己渲染结果的实测（`tools/glass-pixels.mjs`）核对。

### 资料

Apple：

- [Adopting Liquid Glass](https://developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass)：浮动层、标签栏与工具栏的新形状、滚动边缘效果。
- [Materials](https://developer.apple.com/design/human-interface-guidelines/materials) 与 [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars)：玻璃是浮在内容之上的材质，永远不是内容背景。
- [Tab bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars)：浮动的内缩胶囊，以及 iPhone 上的最小化行为。
- [`UITabBarController.MinimizeBehavior`](https://developer.apple.com/documentation/uikit/uitabbarcontroller/minimizebehavior)：`automatic`、`never`、`onScrollDown`、`onScrollUp`（iOS 26）。
- [`UIScrollEdgeEffect`](https://developer.apple.com/documentation/uikit/uiscrolledgeeffect)：滚动视图边缘的渐进模糊与淡出。
- WWDC25 [Meet Liquid Glass](https://developer.apple.com/videos/play/wwdc2025/219/)（219）、[Get to know the new design system](https://developer.apple.com/videos/play/wwdc2025/356/)（356）、[Build a SwiftUI app with the new design](https://developer.apple.com/videos/play/wwdc2025/323/)（323）：这些场次里的特写就是材质对照的依据（文字上的胶囊、照片上的菜单、图片上的深色工具栏、浅色 iPad 侧边栏）。

经过校准的实现（许可写在 `NOTICE`；Apple 的图片只给链接，不放进仓库）：

- [`sdegenaar/liquid_glass_widgets`](https://github.com/sdegenaar/liquid_glass_widgets)（MIT）：`lib/theme/glass_theme_settings.dart` 的 iOS 27 预设、`docs/assets/ios27_parity_light.png` 与 `ios27_parity_dark.png` 的原生对照图、`lib/widgets/surfaces/glass_tab_bar.dart` 的标签栏、`lib/widgets/surfaces/shared/tab_bar_minimize_controller.dart` 的最小化状态机，以及 `docs/PROGRESSIVE_BLUR.md` 的渐进模糊。
- [`Kyant0/AndroidLiquidGlass`](https://github.com/Kyant0/AndroidLiquidGlass)（Apache-2.0）：浮动胶囊标签的几何与透镜/色散核心。
- [`DnV1eX/LiquidGlassKit`](https://github.com/DnV1eX/LiquidGlassKit)（MIT）：`LiquidLensView.swift`，按下时抬起的静止胶囊。

### 材质

| 数值 | iOS 27 浅色 | iOS 27 深色 | 本库 |
| --- | --- | --- | --- |
| 玻璃色 | `#87F8F8F8`（53 % 白） | `#1FFFFFFF`（12 % 白） | `glass-regular` token，同值 |
| 背景饱和度 | 2.1 | 1.4 | `SATURATION` / `SATURATION_DARK` |
| 模糊 | 很小，结构可见 | 很小 | 8 pt（`BLUR`），3–8 pt 区间的上限 |
| 霜：不透明度 / 钳制 / 权重 | 纯模糊，无加权幽灵（实测 iOS 下拉菜单） | 权重 5 的幽灵，不透明度 0.4（实测，深色） | `FROST` [1, 0, 0] / `FROST_DARK` [0.4, 0, 5] |
| 厚度、折射率 | 32 pt、1.24（近轴） | 同（未测量） | 边缘位移 8 pt（0.24 × 32）；iOS 上未测量 |
| 光角 | +π/2（自下） | −π/2（自上） | `LIGHT` / `LIGHT_DARK` |
| 边缘：暗线 / 高光 | 1 / 1（实测：栏与返回按钮，亮面与对侧峰值相等） | 1 / 1.15（栏的峰值相等，不支持此值；菜单不对称） | `RIM` / `RIM_DARK` |
| 主体压暗 | 0 | 0.28 | `BODY_SHADE` |
| 阴影 | `#0A000000`，模糊 10，y 7 | 无 | 标签栏的阴影层 |

边缘高光由一条细线加光轴两端的瓣组成：边缘内 1 pt 的锐利核心，加伸入主体约 8 pt 的柔和尾部，并按 `(1 − 亮度)^0.3` 缩放；在黑底上约 +50/255，接近白色的主体上约 +27/255（`liquid_glass_widgets` 的 `liquid_glass_render.frag` 中的测量）。本库用一对瓣加一层柔和光泽实现；两个瓣相等，与 iOS 上下边缘高光峰值相等一致。

自适应色调只在背景会和文字打架的地方加厚，上限 70 %：玻璃绝不能变成不透明板。

### 结构

Liquid Glass 是一套设计语言，不只是材质。承载它的部件：

| 部件 | 数字 | 来源 |
| --- | --- | --- |
| 浮动标签栏 | 高 64 pt、圆角 32、两侧内缩 20 pt、home indicator 之上 12 pt；图标 27.5 pt、标签 10 pt、间距 2 pt | `glass_tab_bar.dart`、UIKit 的 `UITabBar` |
| 最小化 | 环绕所选标签的 50 pt 胶囊；整体缩小同时上移 6 pt | `glass_tab_bar.dart`（`minimizedBarHeight` 50） |
| 最小化行为 | 向下累计 20 pt 收起，向上 12 pt 展开；内容不足 40 pt 时永不收起；回到顶部必展开；弹簧阻尼 0.78、刚度 340 | `tab_bar_minimize_controller.dart` |
| 浮动导航控件 | 40 pt 圆形返回键、尾部操作的胶囊、距两侧 16 pt、安全区下 8 pt；标题浮在两者之间 | WWDC25 截图与原生对照图 |
| 滚动边缘 | 渐进模糊：边缘 20 pt，到 110 pt 处变清晰，另有一小段淡入页面背景；顶部静止时为 0，滚动 26 pt 后为 1 | `PROGRESSIVE_BLUR.md`（max sigma 20、falloff 1.2）、`UIScrollEdgeEffect` |
| 同心圆角 | 胶囊圆角是其高度的一半（32）；嵌套形状取外圆角减去间距 | HIG *Layout* |

### 我们的渲染实测

标定页（3×，文字与蓝色硬边之上的胶囊）：

| 检查 | 阈值 | 浅色 | 深色 |
| --- | --- | --- | --- |
| 结构相关性（透过玻璃 vs 无玻璃） | ≥ 0.25 / 0.35 | 0.53 | 0.50 |
| 仅填充的相关性（对照） | 低于着色器 | 0.16 | 0.09 |
| 材质平均亮度 | 深色高于背景，0.06–0.34 | — | 0.26（背景 0.09） |
| 蓝边在边缘处的位移 | ≥ 1.5 pt | 10.0 | 15.7 |
| 上下边缘高光峰值之差（上下背景相同处） | ≤ 0.02（iOS 0.004），且都高于主体 | 0.000 | 0.0157 |

`tools/android-glass-check.mjs` 在模拟器截图上测同样的性质，并加上结构检查：展开时标签栏占屏宽 ≥ 60 %，向下滚动后 ≤ 45 %；胶囊两侧 20 pt 显示的是内容而不是栏体。

上下边缘高光差是 CI 里余量最薄的一项。模拟器上深色边缘读数为 0.0196，阈值 0.02（浅色 0.0157）；网页上浅色 0.0000、深色 0.0157。柔和高光（specular × 0.055 × along²）偏向受光一侧，正是它吃掉了余量。已经没有余地，不要把这个阈值当作有富余。

### 与 Apple 仍存在的差异

- **霜是近似。** iOS 27 单独跑一遍模糊、从隔行像素读取云层；我们在一次采样里取 9–17 个点，所以非常密的纹理损失的结构比 Apple 略多，低采样档（`low`）可能出色带。3–8 pt 的模糊区间让文字像 Apple 一样仍然可辨，但我们偏清晰一些。
- **透镜是近轴的。** Apple 的物理模型按半球斜边折射；我们只取边缘斜率（参考实现同样使用近轴近似），所以大半径处边缘内的放大略平。
- **最小化是两条轮廓的插值**（栏的圆角矩形与所选标签的胶囊）加内容交叉淡入；UIKit 是真实视图与图标的形变。弹簧一致，但中间帧没有把图标带着变形。
- **阴影是 box shadow**，不是原生材质那种带高度的分层阴影；深色不画阴影，与 iOS 27 相同。
- **Web 构建里，玻璃背后的内容由 NSH 自己的绘制器生成**，它不把渐变和旋转画进着色器的背景图。因此演示页在玻璃后使用纯色块与文字；原生构建捕获整个窗口，图片与渐变都会出现。这是平台限制，不是材质的。
- **滚动边缘效果是对整条区域的一次采样循环**，不是可分离的两遍高斯；20 pt 模糊铺在 110 pt 上，在我们的测试内容上很平滑，但对极细的高对比图案可能出现轻微环纹。
- **边缘高光不会因明亮内容而增亮。** 平背景上 iOS 的上下边缘高光峰值相等（比值 0.98–1.02），但明亮背景贴在某一侧边缘旁边或下面时，该侧会变亮：iOS 27 模拟器 stripes 片段里上下峰值比值为 0.76 与 1.46。我们在各处都让两侧相等。没有可用于定值的材料，因此未建模。
- **标签栏有两个模糊尺度：Web 构建两个都画，原生构建只画一个。** iOS 27 的栏材质在栏自己的背景上拟合
  （iOS 27 模拟器的标签栏固定图，第 0 步通过）：一个锐利的 ghost，σ 0.625 pt（k 浅色 0.07、深色 0.14），
  加上一个宽的 frost，σ 18 pt（k 浅色 0.26、深色 0.50），再加偏移 t（浅色 167、深色 37 灰度）。总 k 浅色
  0.33、深色 0.64。模型对设备设置页栏体的预测在 ±1.8 灰度以内。
- **Web 上主体是三层**（`tokens::bar`、`glass::two_scale_layers`）：CSS `backdrop-filter: blur(0.625px)`，
  不透明；其上 `blur(18px)`，不透明度 α2；两层之上是 shader，它的主体是实测的灰色色调，不透明度 β。CSS
  `blur(r)` 是 σ 为 r 的高斯，浏览器在 sRGB 中合成，所以这三层给出 k2 = (1 − β)·α2、k1 = (1 − β)·(1 − α2)、
  t = β·tint：浅色 β 0.668、α2 0.791、tint 250；深色 β 0.356、α2 0.784、tint 103（算式在 `tokens.rs`）。
  滤镜链 `blur(a) blur(b)` 等于一个 √(a² + b²) 的高斯：两个尺度必须是两层叠起来的图层。图层在 shader
  之下，所以不会模糊它的边缘；网页绘制器不把它们画进 shader 的背景图，而边缘折射的正是这张图：它读的是页面
  本身，这正合适。shader 在距边缘 1.5 到 6 pt 之间把主体交给图层；细线、边缘高光的核心与边缘阴影仍由它画。
  色调与 `glass-regular` 一样是无彩色的，所以只匹配明度也保持了色相。
- **CI 中由 `tools/tab-bar-pixels.mjs` 测量**，背景就是固定图自己的背景（iOS 帧在 CI 中下载并按 sha256
  校验，不提交）：它在 m5b 的拟合掩码上把双尺度模型重新拟合到我们的渲染，把渲染与 iOS 帧及模型预测比较，
  并读出可读性下限。它先用已发布的拟合（`shared.json`）与 iOS 的下限检查自己的移植。首次运行（CI
  45965972295），每个主题 a+b，浅色 / 深色：重新拟合得 σ1 0.625 / 0.625 pt、σ2 20 / 18 pt（iOS：0.625 / 0.625、
  20 / 17）；对 iOS 帧的 rms 为 2.08 / 2.63 灰度，而双尺度拟合在 iOS 本身上留下 1.98 / 2.40，单个高斯为
  3.57 / 6.07；对模型预测的 rms 为 0.63 / 1.10；可读性下限 10.4 / 22.6 灰度（iOS 10.1 / 22.2）。以同样方式
  渲染的着色器单圆盘主体（`material="single-blur"`）为 5.11 / 33.8、4.85 / 33.7 与 2.7 / 12.2。
- **最小化时主体交回 shader。** 视图保持自己的盒子，图层无法跟着轮廓变成 50 pt 的胶囊。Web 上，轮廓照旧随收起的弹簧形变，
  主体则按自己的时钟从图层交给 shader 的单圆盘主体：shader 交接的线性 200 ms 交叉淡化（`GlassTabBar` 的 `HANDOVER_MS`）。
  淡化期间图层保持完整，所以混合是精确的；图层仍显示时，凡轮廓已离开它们的盒子之处，shader 从背景图画出页面本身：没有图层露在
  玻璃之外。200 ms 来自测量：两种主体最多相差 17 灰度（深色、静止），分到 12 帧是每帧 1.4 灰度，为 3 灰度预算的一半。
- **先有两种设计失败。** 在轮廓收缩时淡出图层，图层会露在玻璃之外（进度 0.25 与 0.5 时盒子边缘 10 灰度的跳变，CI 运行
  45975856837）。在进度前 20 %、轮廓移动之前交回主体，图层留在里面，但收起晚了一帧（浅色 150 ms 才稳定，单圆盘主体 133 ms，
  +12.5 %），栏在边缘移动前先下移（深色边缘 0.4 pt 的反向），深色主体一帧跳了 3.15 灰度（CI 运行 45991898528）。
- **CI 在固定静帧与时间上检查。** `tools/tab-bar-pixels.mjs` 把进度固定在 0.1、0.25、0.5 与 0.75（`GlassTabBar` 的 `morph`），
  检查轮廓边缘、交接渐变与图层盒子边缘的台阶与亮度跳变，参照两端帧与同一进度下的单圆盘主体。`tools/tab-bar-motion.mjs` 在
  只按要求前进的页面时钟上以 60 fps 录下一次收起，检查交接中明度单调（±1 灰度）、每帧变化不超过 3 灰度，栏在单圆盘主体用时的
  5 % 以内稳定，边缘的反向与停顿不多于单圆盘主体。
- **那圈里的页面是 nsh 画的页面。** 最多 200 ms 内，shader 在收缩的轮廓与图层盒子之间显示 nsh 绘制的背景图，它不含渐变、
  旋转与阴影（见上文）。在这类内容上，那段时间里这圈会与页面不同；固定图的页面是图片与文字，背景图里都有。
  nsh 在页面移动后的下一帧才重画 shader，所以移动的画布会晚一帧显示那张背景图。因此 Web 上双尺度栏保持画布与图层不动：
  栏下移的 6 pt 在 shader 内画出（`GlassSpec::lowered`），阴影、标签与胶囊各自下移。两次尝试测出了原因：移动画布时，在像素的
  一部分偏移处，这圈里的文字最多偏 5 灰度 rms（CI 运行 45997124152）；按整像素下移，仍晚一帧，偏 6.7 灰度（CI 运行
  45999666204）。覆盖在图层盒子外 0.5 pt 内保持不透明，所以图层自己一像素宽的边缘不会露出；shader 的交接也只在图层盒子内。
- **ghost 层的饱和度没有测量。** ghost 带着材质的 `saturate(2.1)`（浅色）/ `saturate(1.4)`（深色）。CSS
  `saturate()` 保持 Rec. 709 明度，而拟合只用了明度（固定图的背景是灰色文字），所以栏下饱和背景的颜色没有与 iOS 对照。
- **我们的栏高 64 pt、圆角 32；iOS 的是 62 pt、圆角 31。** 固定图页面把我们的栏对准 iOS 栏的中心（790–854 对
  791–853，两侧同为 21 与 381 pt），而不改动发布的组件；拟合带在我们顶边内 9.7 pt 开始，在 iOS 顶边内 8.7 pt 开始。
- **原生构建仍只画一个模糊。** 它们的 shader 读一张没有 mip 的背景图（`nsh-engine` `shader.rs:341`，
  `mip_level_count` 为 1），每个 shader 视图只绘制一次，`sample_backdrop` 只读 mip 0（`nsh-core`
  `shader.rs:127-130`）。因此 18 pt 的 frost 只能是稀疏的采样估计：深色需要超过 1000 次采样每像素，残差才能
  降到 2.5 灰度，这无法发布。像 Web 那样在 shader 之下放平台模糊层，原生上没有尝试：原生背景图是否包含它
  （那样边缘会折射模糊后的页面），各平台的模糊是否是该 σ 的高斯，都没有测量，也没有可用来测量的原生固定图。
  真正的修复仍在上游：为 shader 图片提供 mip 链，或提供预模糊的背景输入。
- **原生栏下的文字比 iOS 暗。** 它的对比度为浅色 3.8、深色 12.1 灰度（仿真），iOS 为 10.1 与 22.2。调
  `BAR_BLUR` 或填充都无法弥补这个差距。
- **减弱透明度只在 Web 上读取**，来自浏览器的 `prefers-reduced-transparency`：NSH 的环境没有这个标志。此时栏
  不透明，取它在空白页面上的明度（t + (k1 + k2) × 页面：浅色 252、深色 37）。它在栏构建时读取，所以更改在下次
  挂载时生效。增强对比度沿用 shader 自己的主体：其近乎不透明的 `glass-regular` 不是实测的色调。CI 检查：增强对比度下静帧没有背景模糊图层，栏就是单圆盘的渲染。

### Web 端双尺度最小化：已知限制

PR #43（未合并，其工作在 PR #50 中延续）为 Web 端标签栏实现了 iOS 的双尺度主体：着色器下方放两层 CSS 背景模糊（0.625 pt 与 18 pt），着色器在其上
绘制实测的色调。其最小化动画逐帧与着色器的单盘主体对比，以下是该检查遇到的限制。

- **模糊层保持栏的矩形，着色器在玻璃之外遮盖它们。** 视图无法跟随最小化时的轮廓：轮廓是 mix(栏, 圆盘, morph) 的零等值线，一个尖
  头的透镜形，而不是矩形；nsh 0.5.1 也无法为视图的尺寸或圆角做动画。因此在模糊层仍承担主体期间，着色器在它们的矩形之内、玻璃之外，
  用背景图绘制页面本身。CI 将这层遮盖与同序号的单盘帧比较（run 46036703523）：
  - 距玻璃 2 pt 以外，与页面一致：平均 |差值| 浅色 0.003、深色 0.014 级；
  - 没有丢失阴影：带符号平均 +0.001 / +0.013。
  - 第 2 阶段曾归因于"模糊层矩形边缘"的早期失败，实际来自下面的一帧延迟。
- **一帧延迟。** Web 端着色器绘制最小化比 DOM 晚一帧：第 k 帧的轮廓处于第 k − 1 帧的进度。
  - **为什么两种栏会错开：** 双尺度栏的 6 pt 下沉在着色器中绘制（`lowered`），同样晚一帧；单盘栏随其 DOM 容器下沉。第 1–4 帧
    两块玻璃在垂直方向相差 0.24、0.58、0.74、0.79 pt。
  - **为什么下沉留在着色器里：** 移动画布会让遮盖也晚一帧（CI run 45997124152、45999666204）。
  - **像素证据：** 在可测量边缘的深色帧上，从像素检测到的边缘距 k − 1 模型 0.12–0.39 pt，距第 k 帧进度的模型 6–15 pt
    （run 46039755135、46045745728）。
- **药丸遮挡。** 最小化后的药丸是覆盖在玻璃之上的 CSS 胶囊（50 × 64 pt，页面色，浅色 α 0.92、深色 0.86），其边缘位于玻璃圆盘
  边缘之外约 6.4 pt。从第 10 帧起，平坦背景上的每条扫描线都穿过它，因此无法在那里测量玻璃边缘。
- **颗粒。** 浅色下玻璃边缘每三分之一点只变化 3–4 级，与着色器主体内部的颗粒相当，最陡的一步常落在颗粒上。
- **高光线取整。** 浅色下边缘是一条亮的高光线，而不是一个台阶；两侧坡度只差约 1 级，最陡的一步落在内侧，比边缘靠内 0.6–1.1 pt。
  因此像素检测器无法把浅色边缘定位到 0.5 pt 以内。

- **轮廓折痕（已在 PR #50 中修复）。** 栏是胶囊形（圆角半径等于半高），`sd_one` 在中线上给出 q.y = |y|：SDF 的一个折点。
  最小化向圆盘混合时，这条折痕被带进透镜尖端，斜率变化 k = 1 − morph。在折点上，`sd_gradient` 的中心差分（±0.6 pt）互相抵消，
  法线变成水平，边缘高光（axis³）和亮细线（0.18 + 0.35·axis）在一像素宽的线上消失。双尺度和单盘两种渲染都有这条线；只有轴线
  落在像素中心附近时才以完整深度出现。判据比较同序号的帧，所以第 4 帧只有双尺度渲染失败（深色 117 → 56 → 154，单盘 110 → 90 → 137）。
  - **规则。** `sd_slope` 保留中心差分，除非前向与后向差分符号相反，且三个采样点推出的斜率变化
    k = (s/e)/(2 − r)（s = |f − b|，r = |f + b| / max(|f|, |b|)）不小于 0.45；此时取较陡的单侧差分。其他情况下表达式就是原来的中心差分，逐位相同。
  - **标定**（着色器自身的 SDF，e = 0.6，取记录帧的像素相位）：
    - 第 4–6 帧尖端处的透镜轴线：k 0.484–0.741；
    - 胶囊中线（静止的标签栏、校准胶囊、顶栏）：所有相位下 k = 1.000；
    - 平滑极值（距圆心 1 pt 及以上的圆的中线、圆盘的竖直中线）：k 0.006–0.410。
  - **范围。** 胶囊中线是同一种折点，所以规则也作用于它们。在胶囊的直段，SDF 沿中线不变，法线保持 (0, ±1)，输出最多在零散像素上
    变化 1 级（CI run 46076542940 对 46054638029：校准胶囊 5 px，顶栏 10–14 px，静止的标签栏在增强对比度下 1 px，标准静帧逐字节相同）。
  - **不包括什么。** 规则不覆盖第 7 帧的透镜轴线（k 0.37–0.38），而第 7 帧的红色项目本来就不在轴线上。在距圆心约 0.8 pt 以内
    （SDF 的锥点）k 超过 0.45；40 pt 圆形按钮的竖直中线在那里有少数像素变化最多 1 级。
  - **数字**（CI run 46076542940，对比 46054638029）：
    - 941 项中 24 项变化，全部位于第 4–6 帧以及 0.25 / 0.5 固定静帧的透镜轴线；
    - 浅色第 4 帧台阶与坡道 13.92 → 9.37（阈值 13.70 / 12.83）；
    - 深色第 4 帧台阶 98.15 → 74.45（/ 87.36），坡道 71.05 → 41.52（/ 43.88，单盘参照的线也一并消失）；
    - 没有项目由通过变为失败；两项余量分别缩小 0.05 与 0.07；
    - 时间判据、增强对比度（0.00 级）、iOS 检查与减弱透明度均不变。

**仍为红色的项目。** 按着色器实际绘制的几何判定（run 46076542940：轮廓取第 k − 1 帧的进度，两种栏各自的下沉），阈值不变（双
尺度两端帧与同序号单盘帧中的较大者，加浅色 1.98、深色 2.40）：

| 主题 | 帧 | 判据 | 数值 / 阈值 | 位置 |
|---|---|---|---|---|
| 浅色 | 2 | 矩形边缘跳变 | 8.06 / 7.48 | 模糊层矩形的上边，透镜尖端旁的 62 列 |
| 浅色 | 7 | 台阶、坡道 | 15.53 / 13.70，15.53 / 8.44 | (160.0, 821.8)，边缘内 3 pt、透镜轴线上方 2.3 pt：双尺度主体中 223 → 218 → 233 |
| 浅色 | 11 | 台阶、坡道 | 均为 25.42 / 24.75 | 圆盘边缘 (175.0, 820.3)，轴线上方 7.3 pt，紧邻药丸的边缘 |
| 深色 | 2 | 矩形边缘跳变 | 11.76 / 11.20 | 同浅色第 2 帧 |
| 深色 | 3 | 坡道；矩形边缘台阶 | 45.67 / 34.84；99.07 / 98.01 | (73.0, 807.3)，边缘内 1–1.3 pt：147 → 193（单盘 159 → 185）；矩形上边，218 列 |
| 深色 | 11 | 坡道 | 67.28 / 65.95 | 同浅色第 11 帧：35 → 103 → 143（单盘 34 → 97 → 131） |

- **第 11 帧是另一个缺陷，**不是折痕：修复后第 11 帧没有任何项目变化。
  - **不同之处：** 在 (175, 820.3)，双尺度的边缘比单盘亮约 8 %（峰值 141 对 130）。在三分之一点内的每个采样相位上，它的最大台阶都高
    4–5 级（双尺度 55.7–84.4，单盘 52.0–79.6）。
  - **相同之处：** 该像素上双尺度特有的项不起作用（覆盖环为 1 且覆盖度为 1，交接坡道为 0）。
  - **尚未查明：** 原因在于共用表面在那里读到的输入，目前还没有找到。

四项时间判据、增强对比度（与单盘主体相差 0.00 级）以及与 iOS 对比的双尺度检查均通过。
