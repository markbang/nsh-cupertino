[English](navigation-bar.md)

# 导航栏

页面的栏，以及整页本身：返回按钮、可大可小的标题、右侧操作，以及内容滚动到栏下方时出现的细线。

| | |
| --- | --- |
| 浅色 | ![导航栏，浅色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/navigation-light.png) |
| 深色 | ![导航栏，深色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/navigation-dark.png) |

## NavPage

`NavPage` 就是整页：栏是覆盖在滚动视图上的一层。内容一直排到屏幕顶边，顶部内边距是栏高加安全区，
所以内容会滚到栏下面，而不是停在栏的边缘：设置 `material` 时玻璃就在那里取到下面的行。大标题是
滚动内容的第一项，所以它会滚到栏下面；紧凑标题与细线在大标题最后 10 pt 内淡入。淡入由滚动偏移在
原生侧驱动（`scrollValue` + 插值），滚动的每一帧都不会回到你的代码里。

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 栏里的标题；有 `largeTitle` 时是紧凑标题 |
| `largeTitle` | `.large_title(..)` | `string` | 无 | 随滚动离开的 34 pt 粗体大标题 |
| `back` | `.back(..)` | `string` | 无 | 返回按钮的文案；不传就没有返回按钮 |
| `trailing` | `.trailing(..)` | `string` | 无 | 右侧着色操作（"完成"、"编辑"） |
| `background` | `.background(..)` | token 名 | `system-grouped-background` | 页面背景 |
| `material` | `.material(..)` | `"opaque"` \| `"regular"` \| `"thin"` \| `"ultra-thin"` \| `"thick"` \| `"chrome"` | `opaque` | 栏的表面：不透明，或用材质折射并模糊下面滚过的内容 |
| `refreshing` | `.refreshing(..)` | `boolean` | `false` | 下拉刷新进行中，指示器停在栏下 |
| `children` | `.child(..)` | JSX | — | 页面内容 |

事件：`onBack`、`onTrailing`、`onRefresh`。

说明

- 栏高 44 pt，左右内边距 16 pt；大标题额外占 52 pt。两者都是最小值：大字号会让它们变高，
  而不是被裁切。
- 返回按钮是 20 pt 的箭头，与文字之间 6 pt，命中宽度 50 pt，与 `CupertinoNavigationBarBackButton`
  一致。
- 从顶部下拉会请求刷新（`onRefresh`），`refreshing` 把活动指示器固定在栏下。
- 分隔线在任何倍率下都是一台设备像素，规则同 [列表](list.zh-CN.md#分隔线)。
- 栏在所有平台上都浮在内容之上，有没有 `material` 都一样：内容顶部内边距是栏高加安全区，从第一帧
  起就从栏下滚过。紧凑标题在滚动 44 pt 后接管。
- 按下标题会把页面滚回顶部，与 iOS 一致。
- 安全区：栏画到状态栏之后，栏内的一行按 inset 下移；内容按栏高加 inset 留出顶部内边距，并结束在
  home indicator 之上。

## NavigationBar

单独的栏，用于你自己控制滚动的页面：紧凑标题、可选的大标题、返回按钮，以及右侧插槽。

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `title` | `.title(..)` | `string` | 无 | 紧凑标题 |
| `largeTitle` | `.large_title(..)` | `string` | 无 | 栏下方的大标题 |
| `back` | `.back(..)` | `string` | 无 | 返回按钮文案 |
| `trailing` | `.trailing(..)` | JSX | 无 | 右侧任意内容 |
| `collapsed` | `.collapsed(..)` | `number` 0–1 | `0` | 让紧凑标题与细线淡入 |
| `material` | `.material(..)` | 材质名 | `opaque` | 半透明栏 + 模糊，用于内容在其下滚动 |

事件：`onBack`。

## 无障碍

- 大标题是层级 1 的 header，读屏用户可以跳到它。
- 返回按钮是按钮，名称就是它的文案（如 "Cupertino"），高度 44 pt。
- `NavPage` 里的标题可按下（回顶部），并以页面名作为无障碍名称，所以标题不会只存在于视觉上。

## 返回手势

`NavPage` 只画返回按钮，不注册返回处理：Android 上返回手势仍归平台，桌面上的 Escape 也由应用
决定。把两者接到自己的历史上，只写一处——根视图的 `onBackPress`（`nsh`）或 `NavStack` 页面的
`on_dismiss`——`NavPage` 只负责外观。

## 动效

紧凑标题与细线在大标题 52 pt 的最后 10 pt 内淡入；没有其它自动播放的动画。页面推入使用 iOS 的
`kTransitionDuration`（500 ms）弹簧，由 NSH 的导航栈在应用使用时播放。
