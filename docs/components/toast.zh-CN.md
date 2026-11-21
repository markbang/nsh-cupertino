[English](toast.md)

# 提示条（Toast）

浮动卡片上的简短确认或失败提示：前缘的图标或吉祥物、标题、可选的消息和可选的文字操作。对应 Cohub Mobile 的
`Toast` 卡片：20 pt 圆角、柔和阴影、`tertiary-system-background`（浅色为白，深色为 `#2c2c2e`），`danger` 时为红色边框。
标题 17 pt 半粗，消息 13 pt 的次级标签色。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 说明发生了什么的一行 |
| `message` | `.message(..)` | `string` | 无 | 其下的详情 |
| `tone` | `.tone(..)` | `"neutral"` \| `"success"` \| `"danger"` | `neutral` | `danger` 画红色边框 |
| `action` | `.action(..)` | `string` | 无 | 末端的文字操作，用主色 |
| `depth` | `.depth(..)` | `number` | `0` | 在 `ToastLayer` 中的位置：0 为前面的卡片，1 及以上在其后 |
| `duration` | `.duration(..)` | `number`（毫秒） | 按色调与操作，见下 | 从显示起停留的时间 |
| `sticky` | `.sticky(..)` | `boolean` | `false` | 没有计时：直到被滑走或被应用移除 |
| `onAction` | `Action` 事件 | 事件 | — | 操作被按下；由应用移除提示条 |
| `onDismiss` | `Dismiss` 事件 | 事件 | — | 向一侧滑过 56 pt，或以超过 800 pt/s 的速度轻扫 |
| `onExpire` | `Expire` 事件 | 事件 | — | 时间到，已淡出；由应用移除提示条 |
| children | `.child(..)` | JSX | 无 | 前缘的图标或吉祥物，由调用方绘制 |

说明

- 进入时上升 16 pt、从 96% 放大，弹簧约 400 ms 落定，不回弹（Cohub Mobile 的 `enterSpring`）。滑动不足时约 400 ms 弹回。
- 其后的卡片每层高 10 pt、小 4%、淡 35%。它在前卡上方露出的一条让触摸穿过，落到页面上（与 Cohub Mobile 的堆叠一致）。
- 消息会换行。Cohub Mobile 限制为两行，本组件暂未限制。
- 堆叠的后卡在 `PointerEvents::None` 下曾消失一次（#30）。#31 中未能复现（0 个像素不同，渲染路径相同；nsh-core 0.5.1 只把 `none` 映射为命中测试），因此堆叠卡片使用 `None`。
- 阴影与 `SHADOW_FLOAT` 相同：黑色、0 6 20、14%。
- 提示条本身不设位置：请放进 `ToastLayer`。

### 停留时间

提示条因时间、滑动或应用而离开。停留时间依据 Cohub Mobile 的 `toast-queue.ts`，按色调与操作设定，不随文字长度变化（参考实现没有按长度的规则）：

| 色调 | 无操作 | 有操作 |
| --- | --- | --- |
| `neutral`、`success` | 3.2 秒 | 5 秒 |
| `danger` | 5 秒 | 5 秒 |

`duration` 替代上表，`sticky` 关闭计时。计时从提示条显示时开始。时间到时，提示条淡出（240 毫秒）并发出 `Expire`。

- 手指按住前面一张时，层中的全部提示计时暂停，与 Cohub Mobile 的 `ToastClock` 一致；松开后各自从剩余时间继续，且至少 1.5 秒（`RELEASE_GRACE_MS`）。滑动过程中同样暂停。
- 其后的卡片不能被按住：它露出的一条让触摸穿过。

### 离开的原因

| 事件 | 离开的原因 | 由谁移除 |
| --- | --- | --- |
| `Dismiss` | 向一侧滑过 56 pt，或以超过 800 pt/s 轻扫 | 应用在 `Dismiss` 时移除；卡片已离开屏幕 |
| `Expire` | 时间到，已淡出 | 应用在 `Expire` 时移除 |
| `Action` | 操作被按下 | 应用在 `Action` 时移除 |


## ToastLayer

提示条的位置：页面上的一层，距两侧 12 pt，距底部安全区 84 pt，与 Cohub Mobile 的做法一致，位于标签栏之上。
子元素为 `Toast`；前面的一张（`depth` 0）在文档流中，决定堆叠的大小。

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| children | `.child(..)` | JSX | 无 | 提示条，前面的一张 depth 为 0 |

## 无障碍

- 标题与消息按顺序朗读；操作是以其标题命名的按钮。
