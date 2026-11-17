[English](tab-bar.md)

# 标签栏 Tab bar

安全区上方的 49 pt 栏，每个目标一个标签：25 pt 图标、10 pt 文字，选中项使用 tint 色，图标右上角可有徽标。

| | |
| --- | --- |
| 浅色 | ![标签栏，浅色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/tabbar-light.png) |
| 深色 | ![标签栏，深色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/tabbar-dark.png) |

| TSX | Rust | 类型 | 默认 | |
| --- | --- | --- | --- | --- |
| `items` | `.items(..)` | `TabItem[]` | `[]` | 标签，按顺序 |
| `value` | `.value(..)` | `string` | 第一项 | 受控选中值 |
| `defaultValue` | `.default_value(..)` | `string` | 第一项 | 初始值 |
| `blur` | `.blur(..)` | `boolean` | `true` | 背后的材质 |
| `label` | `.label(..)` | `string` | `"Tabs"` | 栏名称 |

`TabItem`：`{ value, title, icon?, badge? }`；`badge` 为文字（"3"、"99+"）或 `"dot"`。

事件：`onChange(value, index)`。

说明

- 栏是材质：`regular` 材质：半透明填充覆盖在 25 pt 背景模糊上，顶部一条一设备像素分隔线。页面内容可以从它下面滚过。
- Linux 与 GPUI 没有背景模糊，材质的半透明填充仍能保证可读——这与 iOS 开启"降低透明度"时的回退一致。
- 未选中为 `systemGray`，选中为 `systemBlue`。徽标是红色 17 pt 胶囊，圆点为 9 pt。

## 无障碍

- 栏是 tab list，每个标签是按钮，选中时带 selected 状态并以文字为名称；Tab 可达，Return/Space 激活。
- 徽标数字属于标签名称的一部分。

## 动效

选中颜色在 150 ms 内过渡，无布局移动。减弱动态效果无需单独处理。

## Glass bar

`GlassTabBar` 是 iOS 26 的标签栏：浮在内容之上的内缩玻璃胶囊，而不是整宽的栏。

```tsx
<GlassTabBar
  items={tabs}
  value={tab()}
  scrollOffset={offset()}
  behavior="on-scroll-down"
  onChange={(event) => tab.set(event.value)}
/>
```

| 属性 | 类型 | 默认 | |
| --- | --- | --- | --- |
| `items` | `TabItem[]` | | 每个标签的值、标题、图标与徽标。 |
| `value` / `defaultValue` | string | | 所选标签（受控）或初始值。 |
| `behavior` | `"on-scroll-down" \| "on-scroll-up" \| "never"` | `"on-scroll-down"` | UIKit 的 `MinimizeBehavior`：向下收起、向上展开。 |
| `scrollOffset` | number | | 页面偏移，由页面的 `onScroll` 提供；不传则永不收起。 |
| `minimized` | boolean | | 强制状态。 |
| `material` | `"glass" \| "material"` | `"glass"` | 着色器，或只用模糊的填充（用于对照）。 |
| `onChange` | `{ value, index }` | | 选择了另一个标签。 |

形状与动效：高 64 pt、圆角 32、两侧内缩 20 pt、home indicator 之上 12 pt，图标 27.5 pt、标签 10 pt。
所选标签有自己的胶囊。向下滚动 20 pt 收成环绕该标签的 50 pt 胶囊，向上 12 pt 展开，回到顶部必定展开，
内容不足 40 pt 永不收起，弹簧阻尼 0.78、刚度 340。放在页面根视图里（它自己定位），并在内容底部留出空间。

上面的整宽 `TabBar` 保留给需要贴着屏幕底部的页面。

最小化胶囊是所选标签的画面：图标与位置都跟随实时选择（最小化时改选标签，它会用弹簧滑到新槽位），
并且不接收触摸，所以点按当前标签仍然能到它下面的那个标签。
