[English](glass-menu.md)

# 玻璃菜单 Glass menu

一个玻璃按钮，菜单从按钮自己的形状里长出来，和 iOS 26 的下拉菜单一样。菜单在手机和桌面上都锚定在按钮旁。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `icon` | `.icon(..)` | `string` | `"ellipsis"` | 按钮图标 |
| `label` | `.label(..)` | `string` | `"More"` | 读屏念出的按钮名称 |
| `actions` | `.actions(..)` | `GlassMenuAction[]` | `[]` | 菜单项 |
| `align` | `.align(..)` | `"start"` \| `"end"` | `"start"` | 菜单与按钮的哪条边对齐 |
| `open` | `.open(..)` | `boolean` | — | 受控 |

`GlassMenuAction`：`{ id, title, icon?, detail?, section?, destructive?, disabled? }`。`detail` 是标题下方较小的第二行。`section` 在该项上方开始新的一组，并以它作为组标题（`""`：没有标题的一组）。

事件：`onOpenChange(open)`、`onAction(id)`。

说明

- 行为来自 `nsh/base` 的 `Popover`：点击外部、Escape、Android 返回键都会关闭。手机上它也锚定在按钮旁，不是底部面板（与 `ContextMenu` 不同）。
- 菜单顶边落在按钮的中线上，即按钮下边缘往上 22 pt，与 iOS 菜单打开的位置一致。
- 有玻璃着色器时，一个玻璃形状从按钮的矩形长成面板的矩形（`GlassSpec` 的单形状生长；圆角通过着色器的 `roundness` 从胶囊形过渡到 28 pt）。成为面板后，玻璃过渡为菜单的填充：浅色为 60% 白，深色为约 80 的灰、44%，叠加 11 pt 模糊（`ContextMenu` 的实测填充）。阴影为 11.5% 黑、下移 9 pt、模糊 36 pt，按 iOS 录屏拟合。
- 菜单项通过第二个着色器按正在生长的形状裁剪，圆形顶部之外的部分被隐藏。形状还是团块时（170 ms 前）不显示菜单项。
- 没有着色器时只有填充，从按钮的框缩放到面板的框：圆角随之缩放，中途没有圆形团块，菜单项也不裁剪。

## 无障碍

- 按钮是带你所给标签的按钮，声明会打开弹层，并报告弹层是否打开（expanded）。
- 菜单是 `menu`，菜单项是 `menuitem`。打开时键盘焦点移到第一个可用项；在桌面上，关闭后焦点回到按钮，和 `Popover` 一致。
- Escape、点击外部、选中某项都会关闭。

## 动效

按 iOS 录屏 `research/ios-reference/motion/motion-menu.mp4` 拟合（`tools/fit-glass-menu.py`），时间从按下算起，单位 ms：

- **形状**（宽、高、水平中心）：弹簧，阻尼比 0.76，刚度 380，质量 1。
- **下坠**：面板同时向下移动再回来：380 pt ×（刚度 540 的临界阻尼弹簧 − 刚度 270 的）。约 100 ms 时最大 69 pt，500 ms 后小于 1 pt。
- **圆角**：180 ms 前是胶囊形，之后 ease-in-out，到 410 ms 变为 28 pt。
- **菜单项**：170 ms 前不显示，之后 ease-out 淡入，260 ms 时完全显示。
- **过渡为填充**：从 290 ms 起填充先覆盖在玻璃上，然后玻璃在其下淡出，390 ms 完成（ease-in-out）。
- **关闭**：先停 70 ms，然后在 30 ms 内（ease-out）缩到 0.94、下移 17 pt、左移 5 pt，在 60 ms 内（ease-in）淡出。130 ms 时消失，按钮淡入复现。
- 减弱动态效果：进出都是 150 ms 交叉淡化，不变形。

这些曲线在 Rust 中每 30 ms 采样一次加以固定（`src/glass_menu.rs` 的测试）。
