// The site's two languages. English is the default; the choice is kept in
// Storage and every string in the chrome, the demos and the API notes goes
// through `tr`.
import { signal } from "nsh";

export type Lang = "en" | "zh";

export const language = signal<Lang>("en");

/** `en` or `zh` for the current language: the demo pages use it directly. */
export function tr(en: string, zh: string): string {
  return language() === "zh" ? zh : en;
}

export const strings = {
  components: ["Components", "组件"],
  home: ["Home", "首页"],
  tagline: [
    "A Cupertino design system for Native Shell apps",
    "为 Native Shell 应用打造的 Cupertino 设计系统",
  ],
  intro: [
    "Apple's semantic colors, type scale and metrics as tokens, and the components iOS is made of — navigation bars, grouped lists, sheets, pickers and more. Every page here is the real component, not a picture.",
    "把 Apple 的语义颜色、字号与尺寸做成 token，以及构成 iOS 的那些组件：导航栏、分组列表、面板、选择器等等。这里的每个页面都是真实组件，不是截图。",
  ],
  install: ["Install", "安装"],
  installHint: [
    "Add the crate, then let nsh init wire the theme.",
    "添加依赖，然后用 nsh init 接入主题。",
  ],
  version: ["Version", "版本"],
  github: ["GitHub", "GitHub"],
  getStarted: ["Try a component", "试试组件"],
  interactive: ["Interactive demos", "可交互演示"],
  gridHint: [
    "24 components. Open one to drag, type, swipe or toggle it.",
    "24 个组件。打开即可拖动、输入、滑动或切换。",
  ],
  variants: ["Variants", "变体"],
  code: ["Code", "代码"],
  copy: ["Copy", "复制"],
  copied: ["Copied", "已复制"],
  api: ["API", "API"],
  apiHint: [
    "Read from the component docs in this repository.",
    "取自本仓库的组件文档。",
  ],
  previous: ["Previous", "上一个"],
  next: ["Next", "下一个"],
  back: ["All components", "全部组件"],
  appearance: ["Appearance", "外观"],
  light: ["Light", "浅色"],
  dark: ["Dark", "深色"],
  auto: ["Auto", "自动"],
  contrast: ["High contrast", "高对比度"],
  typeSize: ["Text size", "字号"],
  frame: ["Phone frame", "手机外框"],
  language: ["Language", "语言"],
  settings: ["Settings", "设置"],
  settingsHint: [
    "The demos follow these, as the components follow the system.",
    "演示会跟随这些设置，正如组件跟随系统。",
  ],
  docs: ["Docs", "文档"],
  docsHint: ["Component docs, English and 中文", "组件文档，英文与中文"],
  footer: [
    "Built with Native Shell · Tokens generated from src/tokens.rs",
    "使用 Native Shell 构建 · Token 由 src/tokens.rs 生成",
  ],
  reset: ["Reset", "重置"],
  close: ["Close", "关闭"],
} as const;

export type StringKey = keyof typeof strings;

export function t(key: StringKey): string {
  const pair = strings[key];
  return language() === "zh" ? pair[1] : pair[0];
}
