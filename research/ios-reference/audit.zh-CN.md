# 保真度审计：nsh-cupertino 与 Cohub Mobile iOS 参考

参考：本目录下的 `shots/`（Cohub Mobile UI 快照的 iOS 一侧）。库：`main` a5f4a96（0.4.2）。本次没有改代码。英文版：[audit.md](audit.md)。

## 方法

- **比例。** 截图是 402 pt 宽画面的 720 px，所以 1 pt = 720 / 402 = 1.791 px。用字体校验过：“Chats” 大标题的大写字母高 24.0 pt，按 0.705 的大写高度比例对应 34 pt 字号；“UI Catalog”（17 pt 标题）得到 12.3 pt，吻合。
- **测量。** `tools/measure-ios-reference.py` 读取 webp 像素（Pillow）。边缘取两侧颜色之间的中点亮度。颜色采自有损 webp，每个 hex 误差约 ±3。圆角是对描出的边缘做最小二乘圆拟合：属于估计值。
- **库的数值**直接从源码读取：`src/tokens.rs`、`theme/theme.json`、`src/theme_file.rs` 以及所引用的组件文件。
- **“est.”** 标记凭肉眼从图中读取的值，或误差超过约 1 pt 的测量。
- 未编译、未运行。没有做与我们自己渲染结果的像素对比。

## 1. 缺失的组件

| 参考中的元素 | 最接近的现有模块 | 缺口 | 对应画面 |
|---|---|---|---|
| 带计数的筛选条（“Recent 3”、“Pinned”、“Archived”）及选中的实心态 | 无（`segmented` 是轨道，tinted 的 `button` 不是筛选条） | 缺失 | catalog-controls、catalog-list、chats-filter |
| 带彩色圆点的状态标签（Neutral、Running、Paused、Failed、Queued） | 无 | 缺失 | catalog-controls |
| 空状态：吉祥物、标题、副标题、橙色文字操作 | 无 | 缺失 | catalog-states |
| 带图标、两行文字和重试按钮的行内错误横幅 | 无 | 缺失 | catalog-states |
| 骨架行（灰色占位块） | 无（`indicator` 只是转圈） | 缺失 | catalog-states |
| 主题预览卡（迷你手机、选中描边）和强调色色块网格 | 无 | 缺失 | appearance |
| 按内容高度的 sheet（fit，不是 detent） | `sheet` 只有 `medium` 和 `large` | 部分 | catalog-sheet |
| 手机宽度下带 8 pt 侧边距的浮动玻璃 sheet | 窗口宽度低于 640 pt 时 `sheet` 全宽（`sheet.rs:339-342`） | 部分 | catalog-sheet、catalog-page |
| 玻璃圆形图标按钮（返回、筛选、新建）45 pt | `glass` + `navigation`（没有圆形图标按钮的预设） | 部分 | chats、spaces、catalog-* |
| 带缩写或计数的图标块（“11”、“SH”） | `icon_view` / `icon`（没有图标块） | 部分 | chats、spaces |
| 行尾带图标计数（“20+”、“1”）的两行标题行 | `list` 的 `ListTile`（只有副标题，没有行尾计数） | 部分 | spaces |
| 活动热力图（13 周 × 7 天） | 无 | 缺失 | activity |
| 聊天气泡、Markdown 表格、代码块、带附件和模型胶囊的输入框 | 无（属于应用层，不在库里） | 缺失 | chat-conversation、chat-tools、composer-attach |
| 余额卡和大号数字 | 无（应用层） | 缺失 | activity |
| sheet 下方的半透明遮罩 | `sheet` 只在 large detent 时变暗（`sheet.rs:123`） | 一致 | catalog-sheet |

## 2. 指标差异

参考值是在 402 pt 画面中测得。“我们的”是源码中的值。差值 = 我们的 − 参考。

| # | 指标 | 参考 | 我们的（文件:行） | 差值 |
|---|---|---|---|---|
| 1 | 单行设置行高 | 52 pt（行距 51.9–52.5 px→pt） | `ROW_HEIGHT` 44（`tokens.rs:567`） | −8 pt |
| 2 | 两行行高（Group rows） | 55 pt（est.，由 99 px 行距估算） | `ROW_HEIGHT_SUBTITLE` 48（`tokens.rs:569`） | −7 pt（est.） |
| 3 | 分组卡片圆角 | 20.7 pt（拟合） | `radius::ROW` 10（`tokens.rs:507`，`list.rs:103`） | −11 pt |
| 4 | 卡片距屏幕边缘的内边距 | 左 16.2 pt，右 15.6 pt | `SECTION_EDGE` 20（`tokens.rs:579`，`list.rs:101`） | +4 pt。nsh 内部不一致：`theme_file.rs:59` 把 16 px 写进 `theme/theme.json:41`，生成的主题与 Rust 组件不一致 |
| 5 | 带前置图标时图标块距卡片边缘 | 17.3 pt | 有前置图标时 `pl` = `ROW_TRAILING` 14（`list.rs:229-231`） | −3 pt |
| 6 | 前置图标块尺寸 | 26.8 pt（est. 27–28） | `LEADING_SIZE` 28（`tokens.rs:575`） | ≈ +1 pt（est.） |
| 7 | 文字起点距卡片边缘 | 57.5 pt | 14 + 28 + 16 = 58（`list.rs:229-235`） | +0.5 pt |
| 8 | 分隔线起点距卡片边缘 | 57.5 pt，与文字相同 | `leading_inset` = 20 + 28 + 16 = 64（`list.rs:186-188`，用于 `list.rs:296`） | +6.5 pt。分隔线比文字右移 6 pt：应与行内边距一样用 `ROW_TRAILING` |
| 9 | 分隔线颜色 | 白底上峰值 #f3f3f3（此比例下约 1 px） | 浅色 `separator` `#3c3c4349`：白底满覆盖约 #c7c7c7（`theme.json:81`） | 我们的更深（est.） |
| 10 | 分组标题字号 | 约 13 pt 半粗（est.，由大写高度估算） | `SECTION_HEADER_SIZE` 20，粗体（`tokens.rs:605`，`list.rs:89`） | +7 pt（est.） |
| 11 | 字号：大标题 | 34 pt，粗体（大写高 24.0 pt） | `LARGE_TITLE` 34 / 700（`tokens.rs:349`） | 0 |
| 12 | 字号：标题 | 约 23 pt（est.，大写高 16.2 pt） | `TITLE2` 22 / 400（`tokens.rs:353`） | −1 pt（est.） |
| 13 | 字号：标题行 / 正文 | 16.6–17.4 pt → 17 | `HEADLINE` 17 / 600，`BODY` 17 / 400（`tokens.rs:357-359`） | 0 |
| 14 | 字号：副标题、脚注 | 15.0 pt、13.5 pt → 13 | `SUBHEADLINE` 15，`FOOTNOTE` 13（`tokens.rs:363-365`） | 0 |
| 15 | 字号：caption2 | 约 12 pt（est.，大写高 8.4 pt） | `CAPTION2` 11（`tokens.rs:369`） | −1 pt（est.） |
| 16 | 强调色 | #c03f00（主按钮填色、开关开启态、选中筛选条） | `system-blue` #007aff（`tokens.rs:101`，`theme.json:121`） | 色相：橙 vs 蓝 |
| 17 | 浅色页面背景 | #f7f3ed（暖色） | `system-grouped-background` #f2f2f7（`tokens.rs:72`） | 色相与明度不同 |
| 18 | 浅色卡片填色 | #ffffff | `secondary-system-grouped-background` #ffffff | 0 |
| 19 | 深色页面背景 | #131215（聊天与行列表，深色） | `system-grouped-background` 深色 #000000（`tokens.rs:72`） | 每通道 +19 / +18 / +21（R / G / B） |
| 20 | 深色卡片填色 | #1c1c1e | `secondary-system-grouped-background` 深色 #1c1c1e | 0 |
| 21 | 主按钮与次按钮高度 | 50.2、51.9 pt（est. ±0.5） | `BUTTON_LARGE` 44（`tokens.rs:599`，`button.rs:58`） | −6 到 −8 pt |
| 22 | 按钮圆角 | 胶囊形（半径 = 半高，约 25 pt） | `radius::BUTTON` 12（`tokens.rs:511`，`button.rs:64`） | −13 pt |
| 23 | 分段控件轨道高度 | 31.8 pt | `TRACK_HEIGHT` 32（`segmented.rs:54`） | 0 |
| 24 | 分段控件轨道圆角 | 胶囊形（约 16 pt） | `CORNER` 9（`segmented.rs:56`） | −7 pt |
| 25 | 开关轨道 | 约 62 × 27 pt（est.） | 51 × 31，滑块 27（`tokens.rs:591-595`，`switch.rs:45-46`） | 宽 −11 pt，高 +4 pt（est.） |
| 26 | 搜索框高度 | 43.5 pt，胶囊形 | `SEARCH_HEIGHT` 36（`tokens.rs:597`，`field.rs:251`） | −7.5 pt |
| 27 | 搜索框圆角 | 胶囊形（约 22 pt） | `radius::SEARCH` 9（`tokens.rs:513`，`field.rs:296`） | −13 pt |
| 28 | 筛选条高度 | 约 36 pt（est.） | 库中没有 | 缺失（见第 1 节） |
| 29 | sheet 顶部圆角 | 约 37 pt（拟合；肉眼约 35） | `radius::SHEET` 14（`tokens.rs:509`，`sheet.rs:339-342`） | −23 pt |
| 30 | sheet 侧边距（fit sheet） | 8.9 pt（浮动卡片，四角都圆） | 窗口宽度低于 640 pt 时全宽（`sheet.rs:76-78`，`sheet.rs:339`） | −8.9 pt |
| 31 | sheet 高度（fit） | 284 pt（约占 874 pt 的 32%） | 只有 `medium` / `large` detent | 没有 fit detent |
| 32 | 菜单宽度 | 约 250 pt | `min_w` 250（`context_menu.rs:189`） | 0 |
| 33 | 菜单圆角 | 约 30 pt（est.，肉眼） | `radius::SHEET` 14（`context_menu.rs:190`） | −16 pt（est.） |
| 34 | 菜单行高 | 约 42 pt（est.，589 px 预览中 61 px 行距） | `min_h` 44（`context_menu.rs:133`） | +2 pt（est.） |
| 35 | 弹窗宽度 | 约 319 pt（572 px） | `w(270)`（`alert.rs:224`） | −49 pt |
| 36 | 弹窗圆角 | 约 27 pt（est.，肉眼） | `rounded(14)`（`alert.rs:227`） | −13 pt（est.） |
| 37 | 弹窗按钮高度 | 约 47 pt（est.） | `min_h` 44（`alert.rs:182`） | −3 pt（est.） |
| 38 | 标签栏高度（浮动玻璃胶囊） | 约 61 pt（est.） | `HEIGHT` 64（`tab_bar.rs:283`） | +3 pt（est.） |
| 39 | 玻璃的模糊、描边、色调 | 无法从静态图测量 | `BAR_BLUR` 24，`BLUR` 5（`tokens.rs:737`，`tokens.rs:734`） | 待定：需要玻璃边缘的截图 |

## 3. 差距最大的三个画面

1. **catalog-controls**：所有控件都不对。按钮 50–52 pt 胶囊形 vs 44 pt 圆角 12。搜索框 43.5 pt vs 36。分段控件圆角。开关形状。筛选条和状态标签完全缺失。
2. **catalog-rows**（以及基于它的设置、关于、外观、活动页）：行高 52 vs 44，卡片圆角 21 vs 10，卡片内边距 16 vs 20，分隔线比文字偏右 6 pt，分组标题 13 vs 20 pt，强调色与页面底色。
3. **catalog-states**：库里没有空状态、错误状态或骨架组件。这是缺组件的问题，不是指标问题。

紧随其后：catalog-sheet 与 catalog-menu（sheet 圆角 37 vs 14，浮动边距，没有 fit detent，菜单圆角 30 vs 14），以及 catalog-confirm（弹窗 319 vs 270 pt 宽）。

## 缺口

- 玻璃（模糊半径、边缘描边、色调强度）：没有在已知内容上截取玻璃边缘的静态图来测量。动效文件也没有逐帧分析。
- 402 pt 的比例由画面宽度推出，并用字号阶梯校验。比例误差 1% 会让每个 pt 数值相差约 0.5 pt。
- 估计值（标记为 est.）：sheet 与菜单圆角（肉眼）、弹窗高宽、开关尺寸（只量了轨道，没量滑块）、两行行高、标签栏高度、caption2 与分组标题字号。
- 深色模式只采了页面与卡片背景。没有检查深色的强调色与文字色。
- 不包括 Android。
