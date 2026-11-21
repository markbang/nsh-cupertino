# 组件映射：Cohub Mobile → nsh-cupertino

事实来源：`markbang/cohub-mobile` 的 e28bcb4（代码值优先于像素值）。库：`markbang/nsh-cupertino` 的 a5f4a96。没有改动任何组件代码。English: [mapping.md](mapping.md)。

状态：**match**（值或行为相同）、**partial**（职责相同，值或功能不同）、**missing**（库里没有对应物）、**unchecked**（列出了但未细比）。

路径：`cohub:` 相对 cohub-mobile 的 `src/`，除非以 `modules/` 开头。`nsh:` 相对 nsh-cupertino 的 `src/`。

## 1. 基础

| cohub-mobile（文件） | nsh-cupertino（文件） | 状态 | 关键值与来源 | 差距 |
|---|---|---|---|---|
| 色板、主色（`design/tokens.ts`） | `tokens.rs` 主色（`tokens.rs:101`） | partial | cohub 主色亮色 `#bf3f00`（`tokens.ts:115`），暗色 `#ff8a3d`（`tokens.ts:173`）。nsh `#007aff` | 品牌橙对系统蓝。参考图像素读到 `#c03f00`，与代码值差在 ±3 内。 |
| 页面底色（`design/tokens.ts`） | `tokens.rs:72` | partial | cohub 亮色 `#f6f3ee`（`tokens.ts:79`），暗色 `#121214`（`tokens.ts:143`）。nsh 亮色 `#f2f2f7`，暗色 `#000000` | cohub 用暖中性色，nsh 用系统灰。 |
| 圆角阶梯（`design/tokens.ts:245`） | `tokens.rs:503-515` | partial | cohub xs 8、sm 14、md 20、lg 28。nsh ROW 10、SHEET 14、BUTTON 12、SEARCH 9、SWITCH 15.5 | nsh 没有 20/28 这一档，卡片和 sheet 无法对齐。 |
| 阴影（`design/tokens.ts:254-256`） | `tokens.rs`（未找到） | unchecked | float `0 6px 20px rgba(0,0,0,.14)`，glass `0 8px 36px rgba(0,0,0,.1)` | 没看到 nsh 阴影 token。 |
| 字体阶梯（`design/tokens.ts:218-226`） | `tokens.rs:345` `type_default` | unchecked | display 34/41、title 22/28、headline 和 body 17/22、micro 11/14 w600 | 没有逐行比较。参考图大标题为 34 pt。 |

## 2. 动效

| cohub-mobile（文件） | nsh-cupertino（文件） | 状态 | 关键值与来源 | 差距 |
|---|---|---|---|---|
| `motion.ts` 按压 | `tokens.rs:535-537` | partial | cohub 按压缩放 `.985`，紧凑型 `.92`（`motion.ts:89-91`）。nsh `PRESS_SCALE .97`、`PRESS_OPACITY .4` | 按压模型不同：cohub 只缩放，nsh 还会淡化。 |
| `motion.ts` sheet | `overlay.rs` `sheet_spring`、`tokens.rs:531-533` | match | cohub sheet 弹簧 mass 3、stiffness 1000、临界阻尼（`motion.ts:38-44`）；出现弹簧 700/65（`motion.ts:47`）。nsh 现为临界阻尼 1.0、stiffness 280，进场和档位共用（原为 `.8` / `400`） | 按 `motion-sheet.mp4` 拟合（ζ 1.0，ω ≈ 16.8 rad/s，行程 284.5 pt）；cohub 的 1000/3 刚度高 7%，30 ms 处偏差约 4 pt。由 `overlay.rs` 的测试固定。 |
| `motion.ts` 淡入与 settle | `tokens.rs:539-551` | partial | cohub fade 150、fadeOut 120、settle 240、glide 280（`motion.ts`）。nsh `QUICK_MS 150`、`BASE_MS 300`、`PRESS_FADE_OUT_MS 180` | 时长部分不同。 |
| `motion.ts` dialog 进入 | 无 | missing | 240 ms，`fromScale 1.125` 加 settle 曲线（`motion.ts:145-147`） | 没有缩放进入的对话框动效。 |
| `motion.ts` continuity | 无 | missing | `imageWait 300`（`motion.ts:21`） | 没有共享元素过渡。 |

## 3. 导航与外壳

| cohub-mobile（文件） | nsh-cupertino（文件） | 状态 | 关键值与来源 | 差距 |
|---|---|---|---|---|
| `ui.tsx` TopBar、`theme.ts` edgeChrome | `navigation.rs` NavigationBar（`navigation.rs:53`）、`tokens.rs:557-565` | partial | cohub 头部最小 44（`theme.ts:9`）。nsh `NAV_HEIGHT 44`、`LARGE_TITLE_HEIGHT 52`、`BACK_TARGET 50` | 栏高一致。大标题高度未对照参考图检查。 |
| `ui.tsx` ScrollEdge 渐隐、`theme.ts` | `scroll_edge.rs:141-193` | partial | cohub 底部渐隐 40、顶部 24（`theme.ts:9`） | nsh 默认高度未检查。 |
| `components/FloatingTabBar.tsx` | `tab_bar.rs` GlassTabBar（`tab_bar.rs:282-285`） | partial | cohub 栏高 62、左右边距 21、padding 4、收起为 48 圆（`FloatingTabBar.tsx:59`）、标签 10/13（`:486`）。nsh HEIGHT 64、INSET 20、LIFT 12；标签 10 pt（`tab_bar.rs` TAB_LABEL_SIZE），原为 11。参考图中 "Me" 与 "Activity" 的大写字母高 13.1 px，按 1.791 px/pt 为 7.3 pt，按 SF 的 0.705 大写比为 10.4 pt（10 pt 为 12.6 px，11 pt 为 13.9 px） | 栏高多 2 pt，边距不同。收起行为两边都有。标签已与像素一致。 |
| `components/TabStack.tsx`、`TabStack.ios.tsx` | `tab_bar.rs` TabBar（`tab_bar.rs:84`） | partial | iOS 分支用 expo-router 原生 `Stack`，根节点不含顶部安全区（`TabStack.ios.tsx:3-9`） | cohub 标题来自原生导航栏，nsh 自己绘制。 |
| `components/TabRail.tsx`（宽屏布局） | 无 | missing | 侧栏宽 72，图标 24，项目 `py-1.5 gap-1`（`TabRail.tsx:9-10`） | 没有竖向侧栏。 |
| `components/SplitStack.tsx` | 无 | missing | 分栏布局 | 没有分栏视图。 |
| `components/AnimatedTabIcon.tsx` | `tab_bar.rs`、`icon.rs` | unchecked | 标签图标动画 | 未细读。 |
| `ui/Glass.tsx` GlassBackground（`ui/Glass.tsx:128-162`） | `glass.rs` Glass、GlassGroup（`glass.rs:908`、`glass.rs:1137`）、`tokens.rs:723-775` | partial | cohub 可用时用系统 Liquid Glass（`Glass.tsx:12`），否则 BlurView intensity 80（`:142`）。磨砂不透明度 `.8`/`.78`、sigma 6（`:94-95`）。nsh GPU 着色器：BEVEL 10、THICKNESS 8、BLUR 5、BAR_BLUR 24、SATURATION 亮色 2.1 / 暗色 1.4（`tokens.rs:726-757`） | 玻璃模型不同。nsh 的模糊和着色没有与参考图对照测量。 |
| `ui.tsx` IconButton（`ui.tsx:117`） | `glass.rs` GlassButton（`glass.rs:1009`） | partial | cohub 点击区 `max(44, size)`，实心图标 18，系统栏图标 26，主色调 | nsh 圆形玻璃按钮尺寸未检查。 |
| `ui.tsx` AppIcon（`ui.tsx:77`）、HarnessIcon（`:91`） | `icon.rs`、`icon_view.rs` | partial | cohub AppIcon 尺寸 20、描边 1.9，HarnessIcon 16 | nsh 用 SF Symbol 名称。描边粗细未对照。 |
| `ui.tsx` PrimaryButton（`ui.tsx:416`） | `button.rs:47`、`tokens.rs:599`、`tokens.rs:511` | partial | cohub `min-h-13`（52）、`px-5`、`rounded-full`。nsh BUTTON_LARGE 44、圆角 12 | 高 44 对 52，圆角 12 对胶囊形。 |
| `ui.tsx` SegmentedControl（`ui.tsx:487-537`） | `segmented.rs:54-56` | partial | cohub 全圆角胶囊，`SEGMENT_INSET 2`。nsh TRACK_HEIGHT 32、TRACK_PADDING 2、CORNER 9、min_h 50 | 圆角 9 对胶囊形。 |
| `ui.tsx` SearchField（`ui.tsx:437`） | `field.rs:231`、`tokens.rs:597`、`tokens.rs:513` | partial | cohub `min-h-11`（44）、`rounded-full`、`bg-control-track`、`px-4`。nsh SEARCH_HEIGHT 36、圆角 9 | 高 36 对 44，圆角 9 对胶囊形。 |
| `ui.tsx` Field、FIELD_INPUT_CLASS（`ui.tsx:538`、`:549`） | `field.rs:60` TextField | partial | cohub `min-h-12`、`rounded-sm`（14）、`px-3 py-3` | nsh 数值未对照。 |
| `ui.tsx` ComposerInput（`ui.tsx:553`） | 无 | missing | 输入区表面圆角 30，`TEXT_PADDING 8`，`CHROME_HEIGHT 130`（`components/timeline/composer-layout.ts`） | 没有聊天输入框。 |
| `ui.tsx` StatusPill（`ui.tsx:382`） | 无 | missing | 圆点加文字，五种色调 | 没有状态胶囊。 |
| `ui.tsx` EmptyState（`ui.tsx:392`） | 无 | missing | 图标、标题、描述、操作 | 没有空状态。 |
| `ui.tsx` ConnectionBanner（`ui.tsx:791`）、DataError（`ui.tsx:806`）、`components/AppUpdateBanner.tsx` | 无 | missing | 横幅 `min-h-14`、`rounded-md`、`shadow-float`（`AppUpdateBanner.tsx:88`） | 没有内嵌横幅。 |
| `components/Toast.tsx` | `state.rs` Toast、ToastLayer | partial | 堆叠偏移 10、底部留白 84、关闭距离 56、速度 800、进入弹簧 400 ms（`Toast.tsx:41-45`） | 卡片、堆叠、进入、滑动、距底 84 pt 的图层、Cohub 的按色调计时（3.2 秒 / 5 秒，有操作时 5 秒）、按住时暂停以及松开后至少 1.5 秒的宽限已有。按住时整层计时暂停，与 Cohub 一致。 |
| `ui/Skeleton.tsx` | 无 | missing | 加载占位 | 没有骨架屏。 |
| `ui.tsx` Avatar（`ui.tsx:99`） | 无 | missing | 默认尺寸 40，`round` 选项 | 没有头像。 |
| `components/ActivityHeatmap.tsx`、`TokenHeatmap.tsx` | 无 | missing | 格子 11、间距 3（`ActivityHeatmap.tsx:14-15`） | 没有热力网格。 |
| `components/SpacePanels.tsx` | 无 | missing | 面板宽度比 0.86、最大 360、弹簧 300 ms damping 1（`SpacePanels.tsx:62-66`） | 没有滑动面板。 |

## 4. 列表、设置与 sheet

| cohub-mobile（文件） | nsh-cupertino（文件） | 状态 | 关键值与来源 | 差距 |
|---|---|---|---|---|
| `components/GroupRow.tsx` | `list.rs:166` ListTile、`tokens.rs:567` | partial | cohub 行高 52（`GroupRow.tsx:6`），图标块 30（`:7`），分隔线缩进 58（`:9`）。nsh ROW_HEIGHT 44，leading 28 + gap 16 + edge 20 = 64 | nsh 行矮 8 pt。分隔线差 6 pt。修法：用 `ROW_TRAILING`，见 `list.rs:186-188`。 |
| `components/SettingsRow.tsx` | `list.rs` ListTile | partial | 分隔线缩进 58（`SettingsRow.tsx:59`） | 同 GroupRow。 |
| `components/SettingsSelectRow.ios.tsx` | `list.rs` ListTile、`picker.rs:59` | partial | 按住 120 ms 打开菜单（`SettingsSelectRow.tsx:16`），当前选项打勾（`:27`） | 没有按住打开的菜单。 |
| `ui/ListRow.tsx` | `list.rs` ListTile | partial | 行高 72，头像 46（`tokens.ts:248`），平铺分隔线缩进 74（`ListRow.tsx:15`） | nsh 分隔线 64，没有头像位。 |
| `ui.tsx` SettingsGroup（`ui.tsx:353`） | `list.rs:75` Section、`tokens.rs:579` | partial | cohub 分组 `mb-6 px-4`，标签 caption `px-4 pb-2`，卡片 `rounded-md`（20）连续曲线（`ui.tsx:355-357`）。nsh SECTION_EDGE 20，卡片 ROW 圆角 10 | 卡片左右边距：cohub 为 16（`ui.tsx:355`，`px-4`）。nsh 组件用 20（`tokens.rs:579`）。nsh 自己的 `theme/theme.json:41` 写 16（由 `theme_file.rs:59` 生成）。圆角 20 对 10。 |
| `ui.tsx` SectionHeader（`ui.tsx:363`） | `list.rs:75`、`tokens.rs:581-605` | partial | cohub `pt-6 pl-4`，headline 17/22 semibold（`ui.tsx:366`）。nsh SECTION_TOP 20、SECTION_HEADER_SIZE 20 | 代码写 17 pt headline，参考图像素读到约 13 pt。代码和像素不一致。字重：半粗体（600），原为粗体；墨迹与参考相差 10 % 以内（粗体为 21 %），见 `docs/components/theme.zh-CN.md`“演示和截图里的字体”一节。 |
| `components/FilterChip.tsx` | 无 | missing | 点击区 `min-h-12 min-w-12`（`FilterChip.tsx:25`），胶囊 | 没有筛选标签。 |
| `ui/AppSwitch.tsx` | `switch.rs:32`、`tokens.rs` SWITCH_WIDTH 51、HEIGHT 31、THUMB 27 | partial | cohub 轨道 63×28，滑块 37×24，弹簧 1000/80，`LENS_MIN_MS 300`（`AppSwitch.tsx:18`） | cohub 自绘开关，nsh 用原生尺寸。参考图与 cohub 尺寸一致。 |
| `ui/Loader.tsx` | `indicator.rs` 月牙（按钮加载）、`indicator.rs:33` ActivityIndicator | 一致（`md` 为代码数值） | `sm` 20，脸颊 900 ms 原地转动（`Loader.tsx:9`），减少动态时脉动 0.35 到 1，1200 ms；`md` 72 `MascotLoader`（`Mascot.tsx:118`） | 按钮的 `sm` 为月牙并带脉动。下拉刷新仍为 8 片叶。`md` 是 demo 里的 `MascotLoader`；没有 iOS 动效片段展示它，所以时序取自 Cohub Mobile 的代码。 |
| `ui/SwipeActions.tsx` | `swipe.rs:86` ACTION_WIDTH 80、`swipe.rs:95` SwipeRow | partial | ACTION_WIDTH 76，ACTIVE_X 16，FAIL_Y 8，释放预测 0.1 s（`SwipeActions.tsx:14-20`） | 操作宽度 80 对 76。 |
| `components/SheetConfirmButton.tsx` | `sheet.rs:127` 底部区 | unchecked | 带 `loading`、`disabled` 的确认按钮 | 未细比。 |
| `components/AdaptiveSheet.ios.tsx` | `sheet.rs:127` Sheet、`sheet.rs:66-67`、`tokens.rs:608` | partial | 紧凑断点 720（`AdaptiveSheet.ios.tsx:17`），头部 `min-h-14 px-2 pt-2`（`:65`），副标题 `px-4 pb-2`（`:70`），底部分隔线 `px-4 pt-3`（`:74`）。nsh 大档顶部 = 安全区顶部 + 10，最大宽 640 | 参考圆角约 37 pt（估），nsh 为 14。弹簧不同（见动效）。 |
| `components/SystemDialogs.ios.tsx` | `alert.rs:97` AlertDialog、`alert.rs:224` 宽 270 | match | iOS 分支用原生 `ActionSheetIOS` 和 `Alert`（`SystemDialogs.ios.tsx:2`）。绘制的 318 宽卡片（`SystemDialogs.tsx:124-125`）是非 iOS 分支 | iOS 上无差距。 |
| `components/AnchoredActionMenu.tsx` | `action_sheet.rs:91` ActionSheet、`action_sheet.rs` 最小行 57 | partial | 菜单宽 250，行高 42，图标位 28，分隔线缩进 24/10（`AnchoredActionMenu.tsx`） | 行高 42 对 57。 |
| `components/ContextMenu.tsx` | `context_menu.rs:104` ContextMenu、`context_menu.rs` min-h 44、px 14、圆角 9、gap 12 | partial | 宽度最小 180 最大 280，预览 320，行高 48（`ContextMenu.tsx:11-14`），行 `min-h-12 px-4 gap-3`（`:72`） | 行高 48 对 44，内边距 16 对 14。 |
| `components/NativeContextMenu.ios.tsx`、`NativeMenu.ios.tsx` | `context_menu.rs`、`action_sheet.rs` | unchecked | 菜单层的 iOS 分支 | 未细读。 |
| `components/ComposerMenu.tsx`、`AttachmentMenu.tsx`、`ModelSelectorMenu.tsx`、`SlashCommandMenu.tsx`、`SpaceMentionMenu.tsx`、`ExecutionHarnessMenu.tsx` | `context_menu.rs` | partial | 菜单家族，基于锚定菜单和上下文菜单 | 与上面各行的差距相同。 |
| `modules/cohub-glass-menu`（变形菜单） | 无 | missing | 菜单圆角 33（`motion.ts:116`），面板圆角 28，预热 800 ms。玻璃配方（`GlassRecipe.kt`）：MenuLight tint `.975`、alpha `.5` | 没有变形玻璃菜单。iOS 片段 `motion-menu.mp4`（30 fps，iOS 侧 442 px = 402 pt）：源玻璃胶囊（第 0–4 帧，mask 218 × 302 px ≈ 198 × 275 pt）在一帧内跳到 294 × 444 px 的面板（第 5 帧），保持到第 8 帧，第 9 帧落定为菜单（mask 296 × 426 px，可见宽 274 px ≈ 249 pt，即 `min_w` 250）。收起：面板在第 59–64 帧淡出并缩小（约 0.13 s）。面板圆角约 28 pt（对 mask 做圆拟合，±3 pt）。边界由 `tools/measure-menu-morph.py` 得出，阴影偏差约 8 px。叠在色条上的白色混合为 0.6–0.7，叠在奶油底上为 0.17：玻璃不是单纯的白色染色。染色、边缘光与按压未测。 |
| 设置页：`SettingsScreen.tsx`、`SettingsHomeScreen.tsx`、`AboutScreen.tsx`、`AppearanceScreen.tsx`、`LanguageScreen.ios.tsx`、`StorageSettingsScreen.ios.tsx` | `list.rs`、`theme.rs` | partial | 外观页用主题预览卡片和主色色块 | 没有预览卡片和色块。其他页只有行和分组。 |

## 5. 聊天时间线（`modules/cohub-chat-timeline` 与 `components/timeline`）

| cohub-mobile（文件） | nsh-cupertino（文件） | 状态 | 关键值与来源 | 差距 |
|---|---|---|---|---|
| `modules/cohub-chat-timeline/ios`（`CHTTimelineView.mm`、`CHTRow.mm`） | 无 | missing | 估计高度 120（`kDefaultEstimate`），插入时保持屏幕锚点，跟随尾部，离屏测量约 775 | 没有聊天时间线。 |
| `modules/cohub-chat-timeline/android` | 无 | missing | `FLIGHT_WAIT_MS 1200`、`ITEM_VIEW_CACHE 8`，锚点默认开启 | 没有聊天时间线。 |
| `components/timeline/NativeChatTimeline.tsx` | 无 | missing | 原生时间线宿主 | 没有聊天时间线。 |
| `components/timeline/message-bubble-layout.ts` | 无 | missing | `BUBBLE_PADDING_X 14`、`REPLY_INSET_X 16`、`BUBBLE_MAX_WIDTH 560`、`CHAT_COLUMN_MAX_WIDTH 768` | 没有气泡。 |
| `components/timeline/nodes.ts` | 无 | missing | `TOOL_DETAILS_MAX_HEIGHT 420`、`COMPACTION_SUMMARY_MAX_HEIGHT 320`、`BOT_EXCHANGE_PREVIEW 280` | 没有时间线节点。 |
| `components/BotBubbles.tsx`、`BubbleText.tsx`、`MessageContent.tsx` | 无 | missing | 气泡 `paddingX 14`，`maxWidth` 来自布局 | 没有气泡。 |
| `components/SendBubbleOverlay.tsx` | 无 | missing | 目标等待 1200 ms（`SendBubbleOverlay.tsx:18`） | 没有发送动画。 |
| `components/QueuedFollowupRow.tsx` | 无 | missing | caption 文字，引导按钮 `min-h-11` | 没有排队消息行。 |
| `components/CodeBlock.tsx`、`CodeEditor.tsx` | 无 | missing | 时间线中的代码块 | 没有代码块。 |
| `components/BotRow.tsx` | 无 | missing | 头像 52，置顶头像 56，置顶宽 72，未读点 `size-3.5`（`BotRow.tsx:18-22`、`:121`） | 没有头像，没有机器人行。 |

## 6. 跳过的部分

- **只有 Android 的分支**（没有 `.ios.tsx` 对应，不作为 iOS 参考）：`AdaptiveSheet.tsx`、`NativeMenu.tsx`、`NativeContextMenu.tsx`、`SettingsSelectRow.tsx`、`SystemDialogs.tsx`（318 宽卡片的值除外，已在上文注明）、`TabStack.tsx`、`LanguageScreen.tsx`、`StorageSettingsScreen.tsx`。
- **业务专属页面和行，不是 UI 外壳：** `BillingHistoryScreen`、`LicensesScreen`、`ReleaseNotes`、`NewChannelScreen`、`ChannelBindingSheet`、`ScheduleForm`、`SessionLabelSheet`、`TurnNavigatorSheet`、`TurnProcess`、`DeviceFolderBrowser`、`BrowserSettings`、`SessionApprovals`、`RelatedSessionLinks`、`LibrarySections`、`LauncherShortcuts`、`AppHostWebView`、`RemoteDisplay`、`MediaViewers`、`GenerationOutput`、`SessionRow`、`SpaceRow`、`DeviceSpaceRow`、`SpaceFileRow`、`SearchResultRow`、`BotTitle`、`RenderErrorBoundary`，以及 `use-*` 系列 hook。
- **`reference/cohub`** 是 `talesofai/cohub` 的子模块，是 web/TypeScript 仓库，没有 iOS 设计值。未使用。

## 7. 来源之间不一致

- **卡片内边距（分组边距）。** cohub `ui.tsx:355` 用 `px-4`，即 16。nsh 自身前后不一致：Rust 组件读 `tokens.rs:579` SECTION_EDGE = 20（`list.rs:85`、`:101`、`:113`），而生成表 `theme_file.rs:59` 把 `section-edge` = 16px 写进 `theme/theme.json:41`。`theme_file.rs` 和 `theme/theme.json` 都是 nsh 自己的文件，不是 cohub 的。修法：让主题值从 `tokens.rs` 推导。
- **分组标题。** cohub 代码是 17 pt headline（`ui.tsx:366`）。参考图像素读到约 13 pt。代码与像素不一致。
- **强调色。** cohub 代码 `#bf3f00`（`tokens.ts:115`）。参考图像素 `#c03f00`。在误差内。
- **玻璃。** Kotlin 模块没有 iOS 校准（见第 8 节）。nsh 的栏模糊与磨砂数值现由实测的 iOS 下拉菜单决定（第 8 节）；磨砂注释与数值一致。

## 8. 玻璃（cohub-glass-menu → glass.rs）

**平台。** `modules/cohub-glass-menu/` 只有 `android/`。`index.ts:78` 在 iOS 上返回 `null`。iOS 上 cohub 用系统 Liquid Glass 绘制玻璃（`src/ui/Glass.tsx:12`），所以这个模块是 Android 上对该效果的重建，不是 iOS 移植。

**校准。** 没有任何文档记录对 iOS 做过校准。`UPSTREAM.md` 写明代码取自 `rit3zh/expo-glass-custom-menu`（基线 `0021efd`，MIT），本地改动只在 `GlassMenuView.kt`。模块里没有任何注释提到 iOS、校准或测量。文档中唯一在 iOS 上测过的玻璃数值是纯色替代色和阴影（`docs/design-system.md:92-93`）。下面所有 Kotlin 数值都来自上游，为 Android 调校。

**app 如何调用。** `src/ui/MorphMenuSurface.tsx:224-240` 只传圆角（菜单 33，面板 28；`motion.ts:116`）、背景色、深色标志和 plate 内边距（8）。没有传任何调参值，所以下面每个默认值都生效。

**单位与弹簧。** Kotlin 的 `dp` 与 nsh 的 `pt` 都是逻辑单位，按 1:1 处理。Kotlin 弹簧 `GlassSpringSpec(ζ, T)` 的 ω = 2π/T（`motion/GlassSpring.kt:10-14`）。表中的 stiffness 是单位质量下的 k = ω²。nsh 弹簧是 stiffness 加阻尼比；nsh-core 不在沙箱里，其质量未经验证，所以 k 值只有在 nsh 质量为 1 时才可比。

下面的 Kotlin 路径都在 `modules/cohub-glass-menu/android/src/main/java/io/github/markbang/cohubmobile/glassmenu/` 下，nsh 路径都在 `src/` 下。

| 参数 | cohub-glass-menu（Kotlin） | nsh-cupertino（glass.rs / tokens.rs） | 状态 | 差距 |
|---|---|---|---|---|
| 颈部平滑，sigma | `GlassMenuView.kt:613` NeckSigma 20 dp，变形时在 `motion/GlassMotion.kt:144, 254` 设为 20 × density，在 `:229` 释放（0.21 s × 颈部保持） | `glass.rs:119-126` smin，`:142-152` k = `spacing`；GlassGroup 合并弹簧 `tokens.rs:802-805` | partial | Kotlin 对距离场做 sigma 20 dp 的高斯模糊。nsh 对两个圆角矩形做平滑并集，k = spacing。算子不同。 |
| 高斯核 | `field/GlassGaussianField.kt:57-63` step = max(4 dp, σ/4, extent/64)；半径 = ceil(4σ/step)，最大 16（`:30`、`:63`）；低于 0.002 的权重舍弃（`:72`）；锁定 step `GlassMenuView.kt:244-247` | 无 | missing | nsh 没有可分离高斯。 |
| 场纹理 | `field/GlassFieldTexture.kt:99-100` 4 个循环缓冲，预分配 128 px；RGBA_F16（`:39-40`）；尺寸按 64 px 取整（`:56`）；双三次查找 `render/GlassShaders.kt:71-100` | 无；SDF 在片元里逐像素求值（`glass.rs:102-116` sd_one，`:164-171` sd_gradient） | missing | 解析 SDF 不需要。 |
| 圆角矩形距离 | `field/RoundedField.kt:27-71`，拟合的角曲线，expansion 1.5287、adjustment 0.5287（`:116-117`） | `glass.rs:87-116` corner_radius、sd_one | partial | Kotlin 的角曲线是拟合的。nsh 用标准圆角矩形。 |
| 位移曲线 | `render/GlassShaders.kt:177-179` amount × (1 − √(u(2−u)))，u = depth / band；沿场梯度方向施加（`:221`、`:225`） | `glass.rs:254-262` shift = normal × THICKNESS × (1 − t)^1.6，t = inside / BEVEL | partial | 圆形曲线 对 幂 1.6。 |
| 静止透镜带宽 | `render/GlassRenderer.kt:171` innerHeight = min(extent/4, 20 dp)；`:175` lensHeight = max(state, innerHeight) | `tokens.rs:726-727` BEVEL 10 pt，所有形状相同 | partial | 44 dp 控件上为 11 dp，nsh 为 10 pt。 |
| 静止透镜位移 | `GlassRenderer.kt:172`、`:177` innerAmount = min(extent/2, 60 dp)；44 dp 控件上为 22 dp（Android） | `tokens.rs:818` THICKNESS 8 pt；`tokens.rs:820` LENS 0.8 % | 未测量 | 保持 8 pt，注释已注明。（此前的“我们是 22 dp”有误：22 dp 是 Kotlin 的数值，nsh 为 8 pt。）iOS 上尝试过：`settings.light`/`settings.dark`（栏 y 1415–1527，x 190–215）：卡片边缘在栏的上方与下方，没有穿过边缘的直边；`motion-scroll-settings` 第 0–6 帧（栏可见）：穿过边缘的水平边缘受移动帧模糊与栏自身上边界（y 866）干扰。 |
| 外环带 | `GlassRenderer.kt:173-174` outerHeight = max(16, extent/5) dp，outerAmount = max(16, extent/4) dp；以 0.6 混合（`GlassShaders.kt:223-226`） | 无 | missing | nsh 只有一个透镜，没有外环。 |
| 变形透镜带 | `motion/GlassMotion.kt:324` 75 dp × lens × min(min(w,h)/250 dp, 1)；位移 = max(带宽, innerAmount)（`GlassRenderer.kt:177`） | 无 | missing | 只在变形期间。 |
| 折射倍率 | `GlassMenuConfigRecord.kt:13` refraction 1；`GlassTriggerConfigRecord.kt:12` 1；乘在两个位移量上（`GlassRenderer.kt:169`、`:177`） | 无，固定 | missing | nsh 没有旋钮，app 也从不设置。 |
| 边缘高光与斜面宽度 | `GlassShaders.kt:250-251` 高光带 1 dp（density），在 9 dp 内；`:127` 主描边 0.533 dp | `tokens.rs:726-727` BEVEL 10 pt；`glass.rs:254-257` | partial | Kotlin 高光是 1 dp 细线。nsh 斜面宽 10 pt。 |
| 静止时菜单模糊 | `GlassMenuConfigRecord.kt:8` blur 16 dp；按 t³ 施加（`GlassRenderer.kt:125-126`） | `tokens.rs:733-734` BLUR 5 pt；`glass.rs:525-528` clear × 0.55，thick × 1.35 | partial | Kotlin 菜单模糊是 nsh 控件模糊的 3.2 倍。iOS 下拉菜单（`catalog-menu`，实测）：浅色 σ 10 pt，深色 σ 12 pt。上下文菜单弹层现在模糊 11 pt（`MENU_BLUR`）。 |
| 触发器与变形模糊 | `GlassTriggerConfigRecord.kt:8` blur 1 dp；`GlassRenderer.kt:242` MorphBlur 1.2 dp；基线 → config.blur（`:124-126`） | 无 | missing | 没有变形。 |
| 栏模糊 | 无（没有栏） | `tokens.rs:824-825` BAR_BLUR 24 pt；注释写 "(24)" | partial | 保持 24 pt，由实测的菜单模糊决定。着色器按半径 R 的圆盘采样，σ = 0.456 R，所以 24 pt 为 σ 10.9 pt；iOS 菜单实测 σ 为浅色 10.0 pt、深色 12.0 pt。动态视频片段已尝试，但不能决定它：(a) `motion-scroll-settings`，第 4 帧（c −55）对第 10 帧（c −189），参考偏移 dy −135 px，在 y 700–860 带上匹配（均方误差 12.8，约 3.6 灰度 RMS）。这里的栏（y 866–930）几乎不透明：填充在页面的水平，约 240；栏的边缘与文字落在窗口内，所以在间隙列 x 100–140 与 200–236 上模糊拟合是平的（残差 16.4，无模糊时 16.7；σ 10 px 的斜率为 0.3）。(b) `motion-scroll-chats`，头栏第 255 帧对第 100 帧：移动帧的滚动偏移残差高达 140 灰度，没有可靠的偏移；最佳相关为 0.16（头栏内容约 1% 可见）。(c) `motion-tabs` 没有滚动（3 个移动对，都是页面切换）；`motion-scroll-spaces` 栏下没有文字。头栏是 iOS 导航栏，nsh 不对它使用 BAR_BLUR。需要新的片段：高对比背景（黑字或条纹）滚动经过标签栏，栏以静止时的不透明度绘制。
| 模糊滤波器 | `render/GlassRenderer.kt:188-190` 对背景做 RenderEffect 模糊 | `glass.rs:203-233` 圆盘采样，33 / 17 / 1 个 tap（`:367-372`），默认 Balanced 17（`:440`） | partial | 高斯 RenderEffect 对 圆盘 tap。 |
| 内容模糊、传送模糊与缩放 | `GlassMotion.kt:336` 行模糊 18 dp × (1 − reveal)；`:338` 传送模糊 6 dp；`:345-348` 缩放 1.65 → 1.2（随高度）；`GlassRenderer.kt:244` PortalReach 28 dp | 无 | missing | 仅变形期间。 |
| 饱和度 | `GlassRecipe.kt:13-16` 深色 1.3 / 浅色 1.2，乘 config（`GlassMenuConfigRecord.kt:12`，默认 1）；亮度权重 `GlassShaders.kt:187` | `tokens.rs:755` SATURATION 2.1 浅色；`:757` 1.4 深色；`glass.rs:194-196`、`:291` | partial | nsh 浅色 2.1 对 Kotlin 1.2。深色 1.4 对 1.3。 |
| 色调映射：黑、白、滚降 | `GlassRecipe.kt:13-16`：深色 黑 .125、白 1.125、滚降 .4（控件）/ .65（菜单）；浅色 黑 .4、白 1.03、滚降 0；面部公式 `GlassShaders.kt:185-195` | `glass.rs:295` light_lift 0.10 向白色提亮（仅浅色）；`tokens.rs:767` BODY_SHADE .32（深色）；`glass.rs:829` | partial | Kotlin 把浅色模式的黑提到 0.4。nsh 提亮 10 %。nsh 没有滚降。 |
| 白色填充 | `GlassRecipe.kt:15-16` fillAlpha 浅色 .2、深色 0；`GlassRenderer.kt:151` | `glass.rs:295`（同一提亮） | partial | nsh 一个提亮，Kotlin 两个参数。 |
| 着色 | `GlassRecipe.kt:14` 菜单深色灰 .042，alpha .7；`:16` 菜单浅色白 .975，alpha .5；控件无（`:13`、`:15`）；按 t × 3 混合（`GlassRenderer.kt:152-167`） | `tokens.rs:866` TINTED_ALPHA .16（未测量）；`glass.rs:288`；填充选择 `glass.rs:592-599`；玻璃填充为 `glass-regular`（`tokens.rs:97`） | 填充相符；着色未测 | 与菜单相同，用已知背景测量填充。栏体深色（`settings.dark`，x 190–215，y 1425–1515）：在 29 的背景（上下方卡片）上均值 59；白色 α 0.13。`glass-regular` 深色为 0x24 = 0.14：预测 60.6，实测 59.0。栏体浅色（`settings.light`）：在 255 的卡片上为 248.6；`#F8F8F8` 0.53 预测 251.3，所以单一背景下 α 与颜色不可分，但该 token 在 3 灰度内。返回按钮（`catalog-controls`，玻璃圆；内部 x 36–50，y 140–160，不含箭头）：浅色 244.5（页面 242.3，预测 245.2）；深色 50.0（页面 19.3，预测 52.3）。与 `glass-regular` 一致。所有图中都没有着色玻璃控件，所以 `TINTED_ALPHA` 保持未测量。 |
| 磨砂（幽灵模糊） | 无 | `tokens.rs:846-849` FROST 浅色 [1.0, 0.0, 0.0]，深色 [0.4, 0.0, 5.0]；`glass.rs:203-233`、`:699-707` | partial | 只有 nsh 有。实测 iOS 菜单：浅色拟合纯模糊（加权幽灵只降低残差 2%，低于噪声），所以浅色磨砂关闭。深色拟合权重 5 偏向亮纹理的幽灵，取幽灵与模糊中较亮者，混合系数 0.4：残差比纯模糊低 10%。数值已设为这些（原为 [.6, .40, 2.5] 与 [.9, −.45, .5]）。 |
| 色差 | 无 | `tokens.rs:747-748` CHROMA 0 | match | 都关闭。 |
| 边缘高光 | `GlassShaders.kt:250-251` 1 dp 带；`GlassRenderer.kt:253-254` rimAlpha 深色 1.0 / 浅色 .55，× rim (1)；`:182` | `tokens.rs:739` SPECULAR .7 与 `glass.rs:319` 0.055 × along²；`tokens.rs:763-765` RIM [1, 1] / 深色 [1, 1.15]；`glass.rs:309` 叶瓣 lit³ + 0.85 × opposite³；`glass.rs:317` rim_light，核心约 1 pt、尾部约 7 pt | partial | 宽度：iOS 栏的边缘高光峰宽 1–2 px（0.6–1.1 pt），两种模式相同，所以核心是对的，尾部比着色器弱。峰值：深色上缘 y 1417 为 102，背景 69–71；下缘 y 1526 为 101，背景 56–59；浅色上缘 y 1417 为 254，背景 249；下缘 y 1526 为 255，背景 251。返回按钮（`catalog-controls`，y 150）：浅色内侧高光在 x 29 / 109 为 250 / 249，填充 246；深色为 54 / 54，填充 50。四处的亮面与对侧峰值比均为 1.0。着色器的叶瓣为 1 : 0.85（`glass.rs:309`），所以亮面比被这两处否定；菜单的实测左右边缘（`catalog-menu`：左有高光、右无）需要不对称，单一常数无法同时拟合三者。叶瓣保持 0.85，`RIM_DARK` 保持 1.15，两者都记为未解决。 |
| 主描边与光晕 | `GlassShaders.kt:133-137` 光环：sigma 5 dp，偏移 4 dp，覆盖 × .06；`:210-212` 光环窗口 22 dp | `tokens.rs:744` EDGE .5 细线；`glass.rs:333-340` | partial | Kotlin 光晕离边缘 8 dp。nsh 边缘是细线。 |
| 高光阈值与方向 | `GlassRenderer.kt:180` 主阈值 深色 .2588、浅色 −.2756；主扩散 80°（`GlassShaders.kt:147`）；主光从顶边来（角度 0，`:252`） | `tokens.rs:751-753` LIGHT 90°，LIGHT_DARK 270°；`glass.rs:788-797` | partial | Kotlin 两种模式都照亮顶边。nsh 注释写浅色模式从下方照亮。匹配前先确认角度约定。 |
| 内阴影 | 无 | `tokens.rs:745-746` INNER .22；`glass.rs:322` | missing | 只有 nsh 有。 |
| 投影 | `GlassRenderer.kt:127-131` 半径 4 + 20t dp，不透明度 .04 + .56t，向下偏移 8 dp，alpha .3；`GlassShaders.kt:288-291` | `glass.rs:243-251` 软带 9 pt，强度来自 `shadow(margin, strength)`（`:559-561`）；深色为 0（`:836`） | partial | Kotlin 投影最大 24 dp 模糊，向下偏移 8 dp。nsh 是 9 pt 软带，深色模式没有。 |
| 按压弹簧 | `GlassJelly.kt:112` JellySpring ζ .5，T .45（k 195），用于按压、释放和拖拽回位；`:115-116` 光晕进出 | `tokens.rs:794-796` PRESS ζ .72，k 420（T .31）；`:798-800` RELEASE ζ .86，k 300（T .36） | partial | Kotlin 按压更软、阻尼更大：k 195 对 420，ζ .5 对 .72。释放 ζ .5 对 .86。 |
| 按压膨胀 | `GlassJelly.kt:79` swell = 1 + press × 4 dp / height（`:110`）：44 pt 时 9 %，80 pt 时 5 % | `tokens.rs:791-792` PRESS_SCALE .965（3.5 %，固定） | partial | Kotlin 的幅度随高度变化。 |
| 按压亮度与光池 | `GlassMenuView.kt:616` 光半径 80 dp；`:617` lift .018；`:618` pool .03；`:620` rim lift .12（`:467-470`） | `tokens.rs:788-790` PRESS_BLOOM .8、PRESS_LIFT .22（均未测量）；`glass.rs:654-666` lens 2.4 | 未测量 | 尝试过：`motion-press.mp4`（614 帧，892 × 960，iOS 侧 x 0–440）：只显示实心的目录按钮，没有玻璃按压。最大的帧间变化（第 250 帧，平均绝对差 0.45 / 255）中，任何玻璃元素都没有可见的按压。`motion-tabs.mp4` 只有标签切换，没有按压帧。保持原值，注释标明未测量。 |
| 拖拽跟随 | `GlassJelly.kt:113` DragFollow ζ .65，T .18（k 1219）；`:114` LightFollow ζ .8，T .16（k 1542） | 无 | missing | nsh 玻璃不跟随手指。 |
| 拖拽倾斜 | `GlassJelly.kt:111` DragLean .05；`:93-94` | 无 | missing | |
| 菜单果冻效果：拉伸、挤压、位移 | `GlassJelly.kt:106-109` 范围 260 dp，拉伸 16，挤压 21，位移 21；`:65-76` | 无 | missing | |
| 收缩与吸收弹簧 | `GlassMotion.kt:363-365` collapse ζ 1，T .21（k 895）；eject ζ .75，T .32（k 386）；absorb 来自调参，默认 ζ .8，T .35（`GlassMorphTuning.kt:12-17`、`:24-25`） | `tokens.rs:531-533` SHEET ζ .8，k 400；`:527-529` PUSH ζ .86，k 300 | missing | nsh 没有变形几何。只有 sheet 和 push 弹簧。 |
| 收缩 | `GlassMorphTuning.kt:11`、`:21-22` 收缩比例 .25，时长 .21 s；eject 时长 .32 s（`:26`） | 无 | missing | |
| 闸门时序 | `GlassMotion.kt:356-362`：修正 .07 s，平滑释放 .21 s × 颈部保持，eject 光学 .084 s，absorb 光学 .07 s，去踢 .07 s 与 .105 s | 无 | missing | |
| 透镜开与关 | `GlassMotion.kt:369-371` 开 ζ 1，T .14（k 2014）；eject 关 T .42（k 224）；absorb 关 T .28（k 504） | 无 | missing | |
| 踢动 | `GlassMotion.kt:165`、`:295-300` ±80 dp × 高度系数 | 无 | missing | |
| 内容与行显现 | `GlassMotion.kt:372-373` 内容吸收 T .15（k 1755）；行显现 T .3（k 439） | 无 | missing | |
| 增长与收拢 | `GlassMotion.kt:352-353` MaxGrowth 1.2，ClosePinch .84 | 无 | missing | |
| 静止容差 | `GlassSpring.kt:16-17` 值 .2、速度 3（默认）；变形通道 .001 与 .01（`GlassMotion.kt:43-52`） | 未记录 | unchecked | |

**本节最大的差距：** 静止时的边缘位移（44 pt 时 22 dp 对 8 pt）、Kotlin 菜单的着色和模糊（16 dp、70 % 着色）、按压亮度（nsh .22 对 Kotlin .018），以及整个变形过程（nsh 没有对应物）。
