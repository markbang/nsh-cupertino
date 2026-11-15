# nsh-cupertino

[English](README.md)

**[文档站点：markbang.github.io/nsh-cupertino](https://markbang.github.io/nsh-cupertino/)**——
每个组件都有可交互演示、绘制它的 TSX 与属性表。

面向 [Native Shell](https://nsh.dev) 应用的 Cupertino（iOS）设计系统：把 Apple 的语义色、
字号表与度量做成 token，并提供 iOS 设置页、详情页常用的组件——导航栏、分组内嵌列表、按钮、
输入框与搜索框、开关、活动指示器。

- **以 token 为唯一来源。** `src/tokens.rs` 生成 `theme/theme.json`，Rust 组件、TSX 类名
  （`bg-system-blue`、`text-secondary-label`）与 `token()` 读到的是同一组值。
- **浅色、深色与高对比度。** 每个色角色都带 Apple 的四组取值，`<Theme>` 在运行时切换到高对比度。
- **是移植，不是模仿。** 尺寸、颜色、动效与交互细节来自 Flutter 官方 `cupertino_ui` 1.1.6，
  逐个组件对照；`NOTICE` 记录从哪里取用了什么。
- **浮动层的材质。** `regular`、`thin`、`ultra-thin`、`thick`、`chrome` 五种玻璃填充与其模糊，
  用于内容在其下滚动的栏。
- **原生行为。** 组件建立在 `nsh/base` 的行为之上（按压、焦点、键盘、角色），自己只负责外观，
  所以 VoiceOver、TalkBack、Tab、空格/回车与 Android 返回手势都照常工作。
- **每个页面都有截图。** 每次 PR 都会用 Web 构建给演示应用的每个页面拍浅色与深色截图，浮层在两种外观下打开；另有像素测试检查列表分隔线。
- **一台设备像素。** 所有细分隔线在任何显示倍率下都不低于一台设备像素。

状态：**wave B**（0.2.0）——包含 token、设置类页面所需的组件，以及 iOS 其余浮层与控件：
带档位的 Sheet、操作表、警告框、上下文菜单、滚轮、日期选择、分段控件、滑块、标签栏、
滑动操作、下拉刷新与栏的材质。

## 安装

Native Shell 应用从 git 引入这个 crate，目前还没有发布到 registry。

```toml
# Cargo.toml
[dependencies]
nsh-cupertino = { git = "https://github.com/markbang/nsh-cupertino", tag = "v0.2.1" }
```

`nsh.json` 在 `"rust"` 里列出这个 crate 的路径，并把 `"theme"` 指向主题文件，这样在第一个组件
挂载之前 TSX 类名与 `token()` 就已经有值：

```json
{
  "rust": ["../nsh-cupertino", "."],
  "theme": "../nsh-cupertino/theme/theme.json",
  "tailwind": {
    "radius": { "row": 10, "sheet": 14, "button": 12, "search": 9 }
  }
}
```

`theme/tailwind.json` 是同一份 `"tailwind"` 片段，供还想要 `text-title2` 这类字号类名与
`rounded-row` 的应用使用；主题文件无法命名 utility，所以这些放在这里。
`theme/theme.json` 是生成文件：改过 `src/tokens.rs` 后在本仓库运行
`cargo run --bin gen-theme`。

## 使用

TSX —— 组件来自 crate 的 `#[native_module("cupertino")]`：

```tsx
import { mount, signal } from "nsh";
import { List, ListTile, NavPage, Section, Switch, Theme } from "cupertino";

function App() {
  const wifi = signal(true);
  return (
    <Theme contrast="normal">
      <NavPage title="设置" largeTitle="设置" trailing="完成">
        <List scroll={false}>
          <Section header="网络" footer="Wi-Fi 会加入信号最强的网络。">
            <ListTile title="Wi-Fi" subtitle={wifi() ? "开" : "关"} accessory="none" separator />
            <ListTile
              title="蓝牙"
              leading="slider.horizontal.3"
              leadingColor="system-blue"
              accessory="chevron"
              separator={false}
            />
          </Section>
          <Section header="开关">
            <Switch checked={wifi()} label="Wi-Fi" onChange={(on: boolean) => wifi.set(on)} />
          </Section>
        </List>
      </NavPage>
    </Theme>
  );
}

mount(App);
```

Rust —— 同样的组件，以 builder 形式使用，每个 prop 都是带类型的 setter：

```rust
use nsh_core::prelude::*;
use nsh_cupertino::{list, list_tile, section, theme, Theme};

#[component]
pub fn Settings() -> impl IntoElement {
    theme().contrast("normal").child(
        list().scroll(false).child(
            section().header("网络").child(
                list_tile().title("Wi-Fi").subtitle("开").accessory("none"),
            ),
        ),
    )
}
```

## 组件

| 组件 | 说明 |
| --- | --- |
| [`NavPage`](docs/components/navigation-bar.zh-CN.md) | 整页：导航栏 + 滚动视图，大标题随滚动收缩到栏里 |
| [`NavigationBar`](docs/components/navigation-bar.zh-CN.md) | 单独使用的导航栏：标题、大标题、返回按钮、右侧操作 |
| [`List`](docs/components/list.zh-CN.md) | 分组列表页，`systemGroupedBackground` 背景 |
| [`Section`](docs/components/list.zh-CN.md) | 一块 10 pt 圆角的行分组，带 header 与 footer |
| [`ListTile`](docs/components/list.zh-CN.md) | 44 pt 行：标题、副标题、前置图标、右箭头或勾选 |
| [`Button`](docs/components/button.zh-CN.md) | 实心、浅色、纯文字与危险样式，三档尺寸，iOS 按压透明度 |
| [`TextField`](docs/components/text-field.zh-CN.md) | 圆角分组输入框：清除、密码、前置图标、键盘类型 |
| [`SearchField`](docs/components/search-field.zh-CN.md) | iOS 搜索框：36 pt、放大镜、清除、取消 |
| [`Switch`](docs/components/switch.zh-CN.md) | 51 × 31，开启为绿色，滑块 200 ms |
| [`ActivityIndicator`](docs/components/activity-indicator.zh-CN.md) | 八片叶片依次淡出，原生绘制 |
| [`ScrollView`](docs/components/scroll-view.zh-CN.md) | 带回弹的滚动视图，平台滚动条与键盘行为 |
| [`Sheet`](docs/components/sheet.zh-CN.md) | 底部面板，中/大两档与把手 |
| [`ActionSheet`](docs/components/action-sheet.zh-CN.md) | 10 pt 圆角分组的操作与取消按钮 |
| [`AlertDialog`](docs/components/alert-dialog.zh-CN.md) | iOS 警告框，支持按钮与输入框 |
| [`ContextMenu`](docs/components/context-menu.zh-CN.md) | 长按/右键菜单，带抬起预览 |
| [`Picker`](docs/components/picker.zh-CN.md) | 吸附滚轮，边缘淡出 |
| [`DatePicker`](docs/components/date-picker.zh-CN.md) | 日历、紧凑触发器与月/日/年滚轮 |
| [`SegmentedControl`](docs/components/segmented-control.zh-CN.md) | 32 pt 轨道、滑动滑块，2–5 段 |
| [`Slider`](docs/components/slider.zh-CN.md) | 28 pt 滑块、着色轨道与刻度 |
| [`TabBar`](docs/components/tab-bar.zh-CN.md) | 49 pt 标签栏，图标、文字与徽标 |
| [`SwipeRow`](docs/components/swipe-actions.zh-CN.md) | 行后的左右滑动操作 |
| [`RefreshView`](docs/components/refresh.zh-CN.md) | 下拉落出活动指示器的滚动视图 |
| [`Theme`](docs/components/theme.zh-CN.md) | 安装 token，并切换到高对比度取值 |
| `Icon` | [`icon`](docs/components/icon.zh-CN.md) / `iconStroke`，NSH 里替代 SF Symbols |

演示应用每个页面的截图（浅色与深色）在 `screenshots` 分支上，并附在每个 release 里。

## 主题

`src/tokens.rs` 包含：

- **颜色** —— Apple 的语义色角色（`system-background`、
  `secondary-system-grouped-background`、`label`、`secondary-label`、`separator`、
  `fill`、`system-blue` … `system-indigo`），每个都有浅色、深色与高对比度取值；另有
  `nsh/base` 与 NSH 自身类名使用的 shadcn 别名（`background`、`foreground`、`primary` 等）。
- **字号** —— `largeTitle` 34/41、`title1` 28/34、`title2` 22/28、`title3` 20/25、
  `headline` 17/22 半粗、`body` 17/22、`callout` 16/21、`subheadline` 15/20、
  `footnote` 13/18、`caption1` 12/16、`caption2` 11/13。
- **布局** —— 4/8/12/16/20/24 间距、44 pt 触控目标、10/14/12/9 pt 圆角、0.33 pt 细线、
  导航栏 44 + 52 pt。
- **动效** —— 页面推入弹簧 0.86 阻尼 / 300 刚度，Sheet 0.8 / 400，按压透明度 0.4，
  按压缩放 0.97，150 / 200 / 300 / 500 ms 时长。

`<Theme contrast="high">` 会复制应用的 token，把每个角色与别名设成当前外观下的高对比度取值，
再用 `set_tokens` 安装；切回 `"normal"` 时还原应用自己的取值。通过 `tokens::`（如
`tokens::label()`）读颜色是响应式的，所以整个界面两个方向都会跟着变。外观本身跟随系统
（`setColorScheme` 与 `appearance` 键），平台自己的控件也会跟随。

应用自定义的主题会被保留：`Theme` 只补齐应用没有设置的 token，并为它定义过的 token 设置
高对比度取值。

## 无障碍

- 每个 `ListTile` 都是一个按钮，名称是标题与副标题；`disabled` 与 `checked` 会传给读屏。
- 按钮与纯图标控件总有名称（`Button` 的 `label`，输入框的清除与显示按钮使用固定文案：
  "Clear text"、"Hide text"）。
- 大标题是 header（层级 1），分组标题是 header（层级 2），分区是 group，列表是 list，
  加载指示器是 progress indicator。
- Tab 能到达每个控件并显示可见焦点环（`focus-visible`），空格/回车按下，Escape 与 Android
  返回手势回退——这些来自 `nsh/base`，不在这里重写。
- 文字跟随用户字号（`fontScale`）；`ActivityIndicator` 尊重"减少动态效果"，显示静止帧；
  组件的过渡都很短，无需单独分支。
- Android 返回手势仍归平台：组件不注册返回处理，页面不会吞掉它。自己维护历史的应用只需在一处
  接入（根视图的 `onBackPress`，或 `NavStack` 页面的 `on_dismiss`）。

## 文档站点

<https://markbang.github.io/nsh-cupertino/> 是这个库给自己写的文档：`site/` 本身就是一个
Native Shell 应用，每个页面都用它所记录的组件绘制，所以页面展示的就是运行中的组件库。

- 首页网格列出全部 24 个组件；每个组件都有可点击、拖动、滑动的演示，绘制它的 TSX（带复制按钮），
  以及由 `tools/site-api.mjs` 从 `docs/components/*.md` 生成的属性表——文档是来源，站点不会与之偏离。
- 顶栏是全局设置：浅色 / 深色 / 跟随系统、高对比度、文字大小、手机边框以及英文 / 中文。
- 每个页面都是 hash 路由（`#/sheet`），可以把它单独分享，浏览器的前进与后退也能在页面间切换。
- 它是 GitHub Pages 上的静态站点，由 `.github/workflows/pages.yml` 从 `main` 部署。

测量方法：在已部署的站点上，用无头 Chrome 155 经 DevTools 协议测量，每次加载前禁用并清空缓存、
只开一个标签页，视口 1440 × 900；首次访问取三个全新浏览器配置文件的首次加载，重载取保持连接的
连续五次。`node tools/site-check.mjs --url https://markbang.github.io/nsh-cupertino/`
可复现这些检查并打印数字。

| 首页，冷缓存 | |
| --- | --- |
| 首次内容绘制（首次访问） | 0.55 s |
| 首次内容绘制（重载） | 0.18 s |
| 首次加载传输 | 2.64 MB / 20 个请求 |

其中大部分是 Web 运行时：`nsh.<digest>.wasm` 未压缩 6.6 MB，gzip 后 2.46 MB。
其余页面是同一个运行时内的路由，不再额外下载。

## 开发

```sh
cargo run --bin gen-theme        # 依据 src/tokens.rs 重新生成 theme/*.json
cargo test                       # 校验提交的主题文件与 token 一致
cd examples/demo
nsh check                        # cargo check + 依据生成的类型检查 TS
nsh test                         # 无头行为测试
nsh run                          # 在本机运行演示应用
cd ../.. && tools/shots.sh       # 用 Web 构建生成 docs/screenshots/*.png

cd site                          # 文档站点
nsh run --target web             # 在 http://127.0.0.1:4173/nsh-cupertino/ 上运行
nsh test                         # 站点自身的行为：路由、控件、演示
node ../tools/site-api.mjs       # 从 docs/components/ 重新生成 site/src/api.ts
cd .. && node tools/site-check.mjs --url http://127.0.0.1:4173/nsh-cupertino/
```

CI（`.github/workflows/ci.yml`）：fmt、clippy `-D warnings`、测试、主题漂移检查、
演示应用的 `nsh check` 与 `nsh test`、Web 打包、把截图发布到 `screenshots` 分支的截图任务，
以及站点自身的检查、测试、Web 打包与无头运行。`pages.yml` 在每次推送到 `main`
和每个 tag 上把站点部署到 GitHub Pages。

## 许可

MIT OR Apache-2.0，任选其一（见 `LICENSE-MIT`、`LICENSE-APACHE`）。
`NOTICE` 记录了取自 Flutter `cupertino_ui`（BSD-3-Clause）、Lenso UI（MIT）与 Framework7
（MIT）的内容，以及哪些只是把 Apple 的指南当作原则来读。
