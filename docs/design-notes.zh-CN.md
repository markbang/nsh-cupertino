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
| 折射 | 表面的 SDF 给出高度场（边缘 `BEVEL` 点的斜面，内部平整），其梯度位移背景采样，边缘最强；整幅画面再放大 2 % | 对被采样的画面是**真实折射**；高度曲线是选定的，不是 Apple 的光学 |
| 模糊 | 9 到 17 次背景采样，黄金螺旋分布、逐像素旋转；`quality` 可减少 | 采样画面的模糊，比可分离高斯粗糙 |
| 高光边缘 | 斜面上 `facing = dot(normal, light)`，边缘一条细亮线，背光侧内阴影 | 沿轮廓连续且有方向；Apple 高光的形状是它自己的 |
| 自适应着色 | 当模糊背景的亮度会与文字冲突时，着色 alpha 升到最多 96 % | 近似"随背景适应"；Apple 的规则未公开 |
| 色散 | 沿法线相距半像素采样红、蓝，仅限边缘带 | ≤ 1 px，与 Apple 的边缘一致 |
| 动态光照 | `light`（角度）与由应用驱动的 `tilt` 角 | NSH 不提供设备姿态，倾斜不会自动发生 |
| `GlassEffectContainer` | `GlassGroup`：一个 shader 覆盖两个矩形，用平滑最小值（`spacing`）融合，并在两套布局之间弹动 | 共享采样区域与融合轮廓，符合 Apple 要求；不迁移形状内容 |
| 交互 | 按压在 UI 线程弹动镜头、高光扩散与 3.5 % 压缩 | 数值与时长（约 250 ms）是本项目的；降低动态效果保留数值、去掉弹簧 |

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
| 霜：不透明度 / 钳制 / 权重 | 0.73 / +0.40 / 2.0 | 0.85 / −0.45 / 0.5 | `FROST` / `FROST_DARK` |
| 厚度、折射率 | 32 pt、1.24（近轴） | 同 | 边缘位移 8 pt（0.24 × 32） |
| 光角 | +π/2（自下） | −π/2（自上） | `LIGHT` / `LIGHT_DARK` |
| 边缘：暗线 / 高光 | 1 / 1 | 1 / 1.15 | `RIM` / `RIM_DARK` |
| 主体压暗 | 0 | 0.28 | `BODY_SHADE` |
| 阴影 | `#0A000000`，模糊 10，y 7 | 无 | 标签栏的阴影层 |

边缘高光由一条细线加光轴两端的瓣组成：边缘内 1 pt 的锐利核心，加伸入主体约 8 pt 的柔和尾部，并按 `(1 − 亮度)^0.3` 缩放；在黑底上约 +50/255，接近白色的主体上约 +27/255（`liquid_glass_widgets` 的 `liquid_glass_render.frag` 中的测量）。本库用一对瓣加一层柔和光泽实现，在标定胶囊的受光边缘实测 +0.32 亮度。

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
| 受光边 − 对边 | ≥ 0.05 | +0.06（下） | +0.29（上） |

`tools/android-glass-check.mjs` 在模拟器截图上测同样的性质，并加上结构检查：展开时标签栏占屏宽 ≥ 60 %，向下滚动后 ≤ 45 %；胶囊两侧 20 pt 显示的是内容而不是栏体。

### 与 Apple 仍存在的差异

- **霜是近似。** iOS 27 单独跑一遍模糊、从隔行像素读取云层；我们在一次采样里取 9–17 个点，所以非常密的纹理损失的结构比 Apple 略多，低采样档（`low`）可能出色带。3–8 pt 的模糊区间让文字像 Apple 一样仍然可辨，但我们偏清晰一些。
- **透镜是近轴的。** Apple 的物理模型按半球斜边折射；我们只取边缘斜率（参考实现同样使用近轴近似），所以大半径处边缘内的放大略平。
- **最小化是两条轮廓的插值**（栏的圆角矩形与所选标签的胶囊）加内容交叉淡入；UIKit 是真实视图与图标的形变。弹簧一致，但中间帧没有把图标带着变形。
- **阴影是 box shadow**，不是原生材质那种带高度的分层阴影；深色不画阴影，与 iOS 27 相同。
- **Web 构建里，玻璃背后的内容由 NSH 自己的绘制器生成**，它不把渐变和旋转画进着色器的背景图。因此演示页在玻璃后使用纯色块与文字；原生构建捕获整个窗口，图片与渐变都会出现。这是平台限制，不是材质的。
- **滚动边缘效果是对整条区域的一次采样循环**，不是可分离的两遍高斯；20 pt 模糊铺在 110 pt 上，在我们的测试内容上很平滑，但对极细的高对比图案可能出现轻微环纹。
