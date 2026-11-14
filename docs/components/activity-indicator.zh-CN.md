# 活动指示器

iOS 的加载指示器：圆周上八片圆角叶片各带固定透明度，整体每 1/8 秒跳 45°，每秒一圈——
即 `CupertinoActivityIndicator` 的几何与透明度表，原生绘制。

| | |
| --- | --- |
| 浅色 | ![活动指示器，浅色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/indicators-light.png) |
| 深色 | ![活动指示器，深色](https://raw.githubusercontent.com/markbang/nsh-cupertino/screenshots/main/indicators-dark.png) |

| TSX | Rust | 类型 | 默认值 | |
| --- | --- | --- | --- | --- |
| `size` | `.size(..)` | `number` | `20` | 盒子的点数；叶片随之缩放 |
| `color` | `.color(..)` | token 名 | `activity-tick` | 叶片颜色（浅色 `#3C3C44`、深色 `#EBEBF5`） |
| `label` | `.label(..)` | `string` | 无 | 读屏名称：说任务，不说等待 |
| `animating` | `.animating(..)` | `boolean` | `true` | `false` 时静止在一帧 |

说明

- 叶片透明度使用 `CupertinoActivityIndicator` 自己的表
  （`47, 47, 47, 47, 72, 97, 122, 147`，满分 255），形状是它的 `tickFundamentalShape`：
  直径的 1/10 宽、半径的 2/3 长、1/20 的圆角。
- 旋转是作用在整组上的一个原生关键帧动画，每秒跳八次：没有任何一帧进入 Rust 或 JS。
- 开启"减少动态效果"（`reduceMotion()`）时叶片静止在一帧，不为这类用户提供运动。
- 在 `label` 里说清任务（"Checking mail"），而不是"加载中"，符合指南。

## 无障碍

- 角色为 progress indicator，名称为 `label`。

## 动效

每圈 1000 ms，分八步，无限循环。静止帧保留同样的透明度梯度，所以形状可读性一致。
