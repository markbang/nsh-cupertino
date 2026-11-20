# Cohub Mobile iOS 参考

[English](README.md)

Cohub Mobile UI 快照的 iOS 一侧，由 Maestro 在 iOS 模拟器上截取。这些是**我们自己产品**（Cohub Mobile）的快照，不是 Apple 的界面，也不是 Android 版本。它们是衡量 `nsh-cupertino` 与 iOS 外观接近程度的参考。[audit.zh-CN.md](audit.zh-CN.md) 把它们与库做了对比。

## 内容

| 路径 | 说明 |
|---|---|
| `reports.json` | 报告索引，原样复制（20 份报告，34 个画面，20 段动效）。 |
| `shots/<screen>.<theme>.ios.webp` | 67 张 iOS 截图，有深色版本的同时保留。原始 webp 字节。 |
| `motion/<motion>.mp4` | 20 段动效录屏，原始 mp4。每段是 iOS 与 Android 并排：iOS 在左半边（892 × 960 px，30 fps）。 |
| `manifest.json` | 每个文件的来源 URL、报告 id、sha256、字节数；另有选取规则，以及没有 iOS 参考的画面/主题组合。 |
| `audit.md`、`audit.zh-CN.md` | 保真度审计：缺失组件、指标差异、差距最大的画面。 |
| `mapping.md`、`mapping.zh-CN.md` | Cohub Mobile 源码组件 → nsh-cupertino 组件，含状态及两侧 file:line。以源码值为准，优先于像素。 |

合计 87 个文件，8,270,638 字节（约 7.9 MiB）。

截图是 720 × 1565 px，即 402 × 874 pt 画面，约 1.79 px/pt。不是 1170 × 2532。

## 每个文件来自哪份报告

- 按画面与主题：列出该画面该主题的最新报告（按日期）。
- 按动效：列出它的最新报告。20 段全部来自 `20261111-091743-4ac97ff`（PR #234，功能分支）。
- `catalog-list` 在任何报告中都没有深色版本。

因此同一画面的浅色与深色文件可能来自不同报告。`manifest.json` 记录了每个文件的报告。

## 重新获取

```sh
curl -o research/ios-reference/reports.json \
  https://public.cohub.live/p/c649d081-fa43-411e-b2d0-bf1d746f3ae6/ui-compare/reports.json   # 可选：刷新索引
node tools/fetch-ios-reference.mjs          # 重建 shots/、motion/、manifest.json
node tools/fetch-ios-reference.mjs --check  # 重新下载，若结果与 manifest.json 不同则失败
```

脚本读取本目录的 `reports.json`，所以同一份索引得到同样的选取结果与同样的 manifest。需要 Node 18 或更新版本，不依赖任何包。

重新测量截图：

```sh
pip install pillow
python3 tools/measure-ios-reference.py
```
