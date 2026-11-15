// The catalogue: the 24 components, their names in both languages, the pages
// that demo them and the stills on the home grid.
import { type JSX, Text, token, View, type ViewStyle } from "nsh";
import { language, tr } from "./i18n";
import { basics } from "./pages-basics";
import { overlays } from "./pages-overlays";
import { faint, hairline, label, muted, surface } from "./ui";

export interface Entry {
  id: string;
  name: [string, string];
  blurb: [string, string];
  icon: string;
  tint: string;
  doc: string;
  Page: () => JSX.Element;
}

const META: Record<string, { name: [string, string]; blurb: [string, string]; icon: string; tint: string; doc?: string }> = {
  icon: {
    name: ["Icon", "图标"],
    blurb: ["SF Symbols' stand-in, drawn in the text color", "SF Symbols 的替代品，用文本颜色绘制"],
    icon: "sparkles",
    tint: "system-pink",
  },
  theme: {
    name: ["Theme", "主题"],
    blurb: ["Semantic tokens, light, dark and high contrast", "语义 token，浅色、深色与高对比度"],
    icon: "circle.lefthalf.filled",
    tint: "system-indigo",
  },
  "navigation-bar": {
    name: ["Navigation bar", "导航栏"],
    blurb: ["Title, large title, back and trailing actions", "标题、大标题、返回与尾部操作"],
    icon: "chevron.left",
    tint: "system-blue",
  },
  "nav-page": {
    name: ["Nav page", "导航页"],
    blurb: ["A bar over a scroll view, the large title folding in", "栏覆盖滚动视图，大标题随之收起"],
    icon: "list.bullet",
    tint: "system-teal",
  },
  list: {
    name: ["List", "列表"],
    blurb: ["Grouped sections on the grouped background", "分组背景上的分组列表"],
    icon: "list.bullet",
    tint: "system-orange",
    doc: "list",
  },
  section: {
    name: ["Section", "分组"],
    blurb: ["A group of rows with a header and footer", "带页眉与页脚的一组行"],
    icon: "square.grid.2x2",
    tint: "system-yellow",
    doc: "list",
  },
  "list-tile": {
    name: ["List tile", "列表行"],
    blurb: ["A 44 pt row: title, subtitle, leading, accessory", "44 pt 的行：标题、副标题、前置图标与配件"],
    icon: "list.bullet",
    tint: "system-gray",
    doc: "list",
  },
  button: {
    name: ["Button", "按钮"],
    blurb: ["Filled, tinted, plain and destructive", "填充、着色、朴素与破坏性"],
    icon: "sparkles",
    tint: "system-blue",
  },
  "text-field": {
    name: ["Text field", "文本输入框"],
    blurb: ["The rounded field and the grouped form row", "圆角输入框与分组表单行"],
    icon: "person",
    tint: "system-green",
  },
  "search-field": {
    name: ["Search field", "搜索框"],
    blurb: ["Magnifier, clear and Cancel", "放大镜、清除与取消"],
    icon: "magnifyingglass",
    tint: "system-indigo",
  },
  switch: {
    name: ["Switch", "开关"],
    blurb: ["51 × 31, green when on, 200 ms travel", "51 × 31，开启为绿色，200 ms 行程"],
    icon: "slider.horizontal.3",
    tint: "system-green",
  },
  "activity-indicator": {
    name: ["Activity indicator", "活动指示器"],
    blurb: ["Eight blades turning natively", "八个叶片原生旋转"],
    icon: "circle.lefthalf.filled",
    tint: "system-gray",
  },
  "scroll-view": {
    name: ["Scroll view", "滚动视图"],
    blurb: ["Bounce, indicators and sideways lists", "回弹、指示器与横向列表"],
    icon: "arrow.up.right",
    tint: "system-purple",
  },
  sheet: {
    name: ["Sheet", "面板"],
    blurb: ["Medium and large detents, dragged between", "中号与大号停靠点，可拖动切换"],
    icon: "chevron.up",
    tint: "system-blue",
  },
  "action-sheet": {
    name: ["Action sheet", "操作表"],
    blurb: ["A choice of actions over the safe area", "安全区上方的一组操作选择"],
    icon: "chevron.up",
    tint: "system-teal",
  },
  "alert-dialog": {
    name: ["Alert dialog", "警告对话框"],
    blurb: ["A 270 pt card with buttons, or a text field", "带按钮或输入框的 270 pt 卡片"],
    icon: "info.circle",
    tint: "system-red",
  },
  "context-menu": {
    name: ["Context menu", "上下文菜单"],
    blurb: ["A menu and a lifted preview about one thing", "关于某一内容的菜单与抬起预览"],
    icon: "square.grid.2x2",
    tint: "system-purple",
  },
  picker: {
    name: ["Picker", "选择器"],
    blurb: ["The wheel that snaps and fades", "吸附并淡出的滚轮"],
    icon: "chevron.down",
    tint: "system-orange",
  },
  "date-picker": {
    name: ["Date picker", "日期选择器"],
    blurb: ["Inline calendar, compact button, wheel", "内联日历、紧凑按钮与滚轮"],
    icon: "sun.max",
    tint: "system-red",
  },
  "segmented-control": {
    name: ["Segmented control", "分段控件"],
    blurb: ["Two to five segments, a sliding thumb", "两到五个分段，滑块滑动"],
    icon: "slider.horizontal.3",
    tint: "system-blue",
  },
  slider: {
    name: ["Slider", "滑块"],
    blurb: ["A rail, a 28 pt thumb, ticks for steps", "轨道、28 pt 滑块、步长刻度"],
    icon: "slider.horizontal.3",
    tint: "system-green",
  },
  "tab-bar": {
    name: ["Tab bar", "标签栏"],
    blurb: ["A 49 pt material bar with badges", "带角标的 49 pt 材质标签栏"],
    icon: "square.grid.2x2",
    tint: "system-teal",
  },
  "swipe-row": {
    name: ["Swipe actions", "滑动操作"],
    blurb: ["Leading and trailing actions, a full swipe", "前置与尾部操作，全滑触发"],
    icon: "envelope",
    tint: "system-orange",
    doc: "swipe-actions",
  },
  refresh: {
    name: ["Pull to refresh", "下拉刷新"],
    blurb: ["The indicator that follows the drag", "跟随拖动出现的指示器"],
    icon: "arrow.up.right",
    tint: "system-blue",
  },
};

const PAGES = [...basics, ...overlays];

export const CATALOG: Entry[] = PAGES.map(({ id, Page }) => {
  const meta = META[id];
  return {
    id,
    name: meta.name,
    blurb: meta.blurb,
    icon: meta.icon,
    tint: meta.tint,
    doc: meta.doc ?? id,
    Page,
  };
});

export const entryOf = (id: string): Entry | undefined => CATALOG.find((entry) => entry.id === id);

export const nameOf = (entry: Entry): string => tr(entry.name[0], entry.name[1]);
export const blurbOf = (entry: Entry): string => tr(entry.blurb[0], entry.blurb[1]);

/** The GitHub docs page for a component, in the site's language. */
export function docsUrl(entry: Entry): string {
  const suffix = language() === "zh" ? ".zh-CN.md" : ".md";
  return `https://github.com/markbang/nsh-cupertino/blob/main/docs/components/${entry.doc}${suffix}`;
}

// Thumbnails ---------------------------------------------------------------
//
// Stills of each component on the home grid. They are drawn from views and
// text rather than the components themselves, because a card is one button:
// its thumbnail must not add twenty more stops to the keyboard.

const tkn = (name: string) => (token as unknown as (name: string) => string)(name);

const mini = (): ViewStyle => ({ borderRadius: 8, backgroundColor: surface(), overflow: "hidden" });
const rowLine = () => ({ height: 1, backgroundColor: hairline(), marginLeft: 12 });

function MiniRow(props: { title: string; trailing?: string; leading?: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, height: 30 }}>
      <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: token("system-blue"), opacity: 0.7 }} />
      <Text style={{ flex: 1, fontSize: 11, color: label(), numberOfLines: 1 }}>
        {props.title}
      </Text>
      <Text style={{ fontSize: 11, color: faint() }}>{props.trailing ?? "›"}</Text>
    </View>
  );
}

function ThumbShell(props: { children: JSX.Element; background?: string }) {
  return (
    <View
      style={{
        height: 104,
        borderRadius: 12,
        backgroundColor: props.background ?? token("tertiary-system-grouped-background"),
        overflow: "hidden",
        justifyContent: "center",
      }}
    >
      {props.children}
    </View>
  );
}

export function Thumb(props: { id: string }) {
  switch (props.id) {
    case "switch":
      return (
        <ThumbShell>
          <View style={{ alignItems: "center", gap: 10 }}>
            <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: token("system-green"), justifyContent: "center", alignItems: "flex-end", paddingHorizontal: 2 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff" }} />
            </View>
            <View style={{ width: 44, height: 26, borderRadius: 13, backgroundColor: token("system-gray3"), justifyContent: "center", alignItems: "flex-start", paddingHorizontal: 2 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: "#ffffff" }} />
            </View>
          </View>
        </ThumbShell>
      );
    case "slider":
      return (
        <ThumbShell>
          <View style={{ paddingHorizontal: 22, gap: 14 }}>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: token("system-gray4") }}>
              <View style={{ height: 4, width: "62%", borderRadius: 2, backgroundColor: token("system-green") }} />
            </View>
            <View style={{ height: 4, borderRadius: 2, backgroundColor: token("system-gray4"), justifyContent: "center" }}>
              <View style={{ position: "relative", marginLeft: "35%", width: 20, height: 20, borderRadius: 10, backgroundColor: "#ffffff", boxShadow: "0 2px 6px rgb(0 0 0 / 0.25)" }} />
            </View>
          </View>
        </ThumbShell>
      );
    case "segmented-control":
      return (
        <ThumbShell>
          <View style={{ marginHorizontal: 18, height: 30, borderRadius: 8, backgroundColor: token("secondary-fill"), flexDirection: "row", alignItems: "center", padding: 3 }}>
            <View style={{ flex: 1, height: 24, borderRadius: 6, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 10, fontWeight: 600, color: label() }}>{tr("Day", "日")}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: muted() }}>{tr("Week", "周")}</Text>
            </View>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontSize: 10, color: muted() }}>{tr("Month", "月")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "tab-bar":
      return (
        <ThumbShell>
          <View style={{ height: 49, backgroundColor: token("secondary-system-background"), borderTopWidth: 1, borderColor: hairline(), flexDirection: "row", alignItems: "center", justifyContent: "space-around" }}>
            <Each of={[0, 1, 2, 3]} key={(n) => n}>
              {(n) => (
                <View style={{ alignItems: "center", gap: 3 }}>
                  <View style={{ width: 16, height: 16, borderRadius: 4, backgroundColor: n() === 0 ? token("system-blue") : token("system-gray2") }} />
                  <View style={{ width: 16, height: 3, borderRadius: 1.5, backgroundColor: n() === 0 ? token("system-blue") : token("system-gray3") }} />
                </View>
              )}
            </Each>
          </View>
        </ThumbShell>
      );
    case "list":
    case "section":
    case "list-tile":
    case "nav-page":
      return (
        <ThumbShell>
          <View style={{ paddingHorizontal: 14, paddingTop: 6, gap: 4 }}>
            <View style={{ ...mini() }}>
              <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 6 }}>
                <Text style={{ fontSize: 9, fontWeight: 700, color: faint(), letterSpacing: 0.4 }}>
                  {props.id === "nav-page" ? tr("WI-FI", "无线局域网") : tr("NETWORK", "网络")}
                </Text>
              </View>
              <MiniRow title={tr("Wi-Fi", "无线局域网")} trailing={props.id === "list-tile" ? "✓" : "›"} />
              <View style={rowLine()} />
              <MiniRow title={tr("Bluetooth", "蓝牙")} />
            </View>
          </View>
        </ThumbShell>
      );
    case "navigation-bar":
      return (
        <ThumbShell>
          <View style={{ backgroundColor: token("secondary-system-background"), borderBottomWidth: 1, borderColor: hairline() }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, height: 30 }}>
              <Text style={{ fontSize: 11, color: token("system-blue") }}>‹ {tr("Back", "返回")}</Text>
              <Text style={{ fontSize: 11, fontWeight: 600, color: label() }}>{tr("Details", "详情")}</Text>
              <Text style={{ fontSize: 11, color: token("system-blue") }}>{tr("Edit", "编辑")}</Text>
            </View>
            <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
              <Text style={{ fontSize: 20, fontWeight: 700, color: label() }}>{tr("Details", "详情")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "button":
      return (
        <ThumbShell>
          <View style={{ paddingHorizontal: 18, gap: 8 }}>
            <View style={{ height: 28, borderRadius: 8, backgroundColor: token("system-blue"), alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: "#ffffff" }}>{tr("Continue", "继续")}</Text>
            </View>
            <View style={{ height: 28, borderRadius: 8, backgroundColor: token("system-blue"), opacity: 0.18, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: token("system-blue") }}>{tr("Share", "分享")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "text-field":
      return (
        <ThumbShell>
          <View style={{ paddingHorizontal: 18, gap: 8 }}>
            <View style={{ height: 30, borderRadius: 6, backgroundColor: token("secondary-system-background"), borderWidth: 1, borderColor: hairline(), justifyContent: "center", paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 11, color: label() }}>{tr("Ada Lovelace", "Ada Lovelace")}</Text>
            </View>
            <View style={{ height: 30, borderRadius: 6, backgroundColor: token("secondary-system-background"), justifyContent: "center", paddingHorizontal: 10 }}>
              <Text style={{ fontSize: 11, color: faint() }}>{tr("Password", "密码")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "search-field":
      return (
        <ThumbShell>
          <View style={{ marginHorizontal: 16, height: 30, borderRadius: 9, backgroundColor: token("fill"), flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: muted() }} />
            <Text style={{ fontSize: 11, color: muted() }}>{tr("Search", "搜索")}</Text>
          </View>
        </ThumbShell>
      );
    case "activity-indicator":
      return (
        <ThumbShell>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 18 }}>
            <Each of={[0, 1, 2]} key={(n) => n}>
              {(n) => (
                <View style={{ width: 20 + n() * 10, height: 20 + n() * 10, borderRadius: 20, borderWidth: 2.5, borderColor: token("activity-tick"), borderTopColor: "transparent", opacity: 1 - n() * 0.25 }} />
              )}
            </Each>
          </View>
        </ThumbShell>
      );
    case "icon":
      return (
        <ThumbShell>
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, paddingHorizontal: 22 }}>
            <Each of={["●", "▲", "✦", "◆", "☰", "✚"]} key={(glyph) => glyph}>
              {(glyph) => <Text style={{ fontSize: 18, color: token("system-blue") }}>{glyph()}</Text>}
            </Each>
          </View>
        </ThumbShell>
      );
    case "theme":
      return (
        <ThumbShell>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 8 }}>
            <Each of={["system-blue", "system-green", "system-orange", "system-pink", "system-purple"]} key={(name) => name}>
              {(name) => <View style={{ width: 24, height: 40, borderRadius: 6, backgroundColor: tkn(name()) }} />}
            </Each>
          </View>
        </ThumbShell>
      );
    case "scroll-view":
      return (
        <ThumbShell>
          <View style={{ flexDirection: "row", gap: 8, paddingLeft: 16 }}>
            <Each of={[0, 1, 2, 3]} key={(n) => n}>
              {(n) => (
                <View style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: token("system-blue"), opacity: 0.9 - n() * 0.2 }} />
              )}
            </Each>
          </View>
        </ThumbShell>
      );
    case "sheet":
      return (
        <ThumbShell background={token("secondary-system-grouped-background")}>
          <View style={{ flex: 1, justifyContent: "flex-end" }}>
            <View style={{ height: 62, borderTopLeftRadius: 12, borderTopRightRadius: 12, backgroundColor: token("material-thick"), paddingTop: 6, alignItems: "center", gap: 6, borderWidth: 1, borderColor: hairline() }}>
              <View style={{ width: 26, height: 3, borderRadius: 2, backgroundColor: token("system-gray3") }} />
              <View style={{ ...mini(), width: 150, height: 22 }} />
            </View>
          </View>
        </ThumbShell>
      );
    case "action-sheet":
      return (
        <ThumbShell background={token("secondary-system-grouped-background")}>
          <View style={{ marginHorizontal: 22, gap: 5 }}>
            <View style={{ ...mini(), paddingVertical: 4 }}>
              <Text style={{ fontSize: 10, color: label(), textAlign: "center", paddingVertical: 4 }}>{tr("Copy", "拷贝")}</Text>
              <View style={rowLine()} />
              <Text style={{ fontSize: 10, color: token("system-red"), textAlign: "center", paddingVertical: 4 }}>{tr("Delete", "删除")}</Text>
            </View>
            <View style={{ ...mini(), paddingVertical: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: 600, color: label(), textAlign: "center" }}>{tr("Cancel", "取消")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "alert-dialog":
      return (
        <ThumbShell background={token("tertiary-fill")}>
          <View style={{ alignSelf: "center", width: 148, borderRadius: 10, backgroundColor: token("material-thick"), overflow: "hidden", borderWidth: 1, borderColor: hairline() }}>
            <View style={{ padding: 8, gap: 2 }}>
              <Text style={{ fontSize: 9.5, fontWeight: 600, color: label(), textAlign: "center" }}>{tr("Delete message?", "删除邮件？")}</Text>
              <Text style={{ fontSize: 8.5, color: muted(), textAlign: "center" }}>{tr("It moves to Trash.", "它会移到废纸篓。")}</Text>
            </View>
            <View style={{ height: 1, backgroundColor: hairline() }} />
            <View style={{ flexDirection: "row" }}>
              <Text style={{ flex: 1, fontSize: 9, color: token("system-blue"), textAlign: "center", paddingVertical: 5 }}>{tr("Cancel", "取消")}</Text>
              <View style={{ width: 1, backgroundColor: hairline() }} />
              <Text style={{ flex: 1, fontSize: 9, fontWeight: 600, color: token("system-red"), textAlign: "center", paddingVertical: 5 }}>{tr("Delete", "删除")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "context-menu":
      return (
        <ThumbShell>
          <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 16 }}>
            <View style={{ ...mini(), padding: 10 }}>
              <Text style={{ fontSize: 10, fontWeight: 600, color: label() }}>{tr("Report", "报告")}</Text>
            </View>
            <View style={{ alignSelf: "flex-end", marginTop: -6, width: 96, borderRadius: 8, backgroundColor: token("material-thick"), borderWidth: 1, borderColor: hairline(), overflow: "hidden" }}>
              <Text style={{ fontSize: 9, color: label(), paddingHorizontal: 8, paddingVertical: 4 }}>{tr("Open", "打开")}</Text>
              <View style={rowLine()} />
              <Text style={{ fontSize: 9, color: token("system-red"), paddingHorizontal: 8, paddingVertical: 4 }}>{tr("Delete", "删除")}</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "picker":
      return (
        <ThumbShell>
          <View style={{ flexDirection: "row", justifyContent: "center", gap: 18 }}>
            <View style={{ gap: 2, alignItems: "center" }}>
              <Text style={{ fontSize: 9, color: faint() }}>{tr("Feb", "2月")}</Text>
              <View style={{ backgroundColor: token("tertiary-fill"), borderRadius: 4, paddingHorizontal: 10, paddingVertical: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: label() }}>{tr("Mar", "3月")}</Text>
              </View>
              <Text style={{ fontSize: 9, color: faint() }}>{tr("Apr", "4月")}</Text>
            </View>
            <View style={{ gap: 2, alignItems: "center" }}>
              <Text style={{ fontSize: 9, color: faint() }}>13</Text>
              <View style={{ backgroundColor: token("tertiary-fill"), borderRadius: 4, paddingHorizontal: 10, paddingVertical: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: 600, color: label() }}>14</Text>
              </View>
              <Text style={{ fontSize: 9, color: faint() }}>15</Text>
            </View>
          </View>
        </ThumbShell>
      );
    case "date-picker":
      return (
        <ThumbShell>
          <View style={{ paddingHorizontal: 26, gap: 5 }}>
            <Text style={{ fontSize: 9, fontWeight: 600, color: label() }}>{tr("November 2026", "2026 年 11 月")}</Text>
            <Each of={[0, 1, 2, 3]} key={(week) => week}>
              {(week) => (
                <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                  <Each of={[0, 1, 2, 3, 4, 5, 6]} key={(day) => day}>
                    {(day) => (
                      <View
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 6,
                          backgroundColor: week() === 2 && day() === 3 ? token("system-red") : "transparent",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text style={{ fontSize: 7, color: week() === 2 && day() === 3 ? "#ffffff" : muted() }}>
                          {`${week() * 7 + day() + 1}`}
                        </Text>
                      </View>
                    )}
                  </Each>
                </View>
              )}
            </Each>
          </View>
        </ThumbShell>
      );
    case "swipe-row":
      return (
        <ThumbShell>
          <View style={{ marginHorizontal: 14 }}>
            <View style={{ flexDirection: "row", height: 30, borderRadius: 8, overflow: "hidden" }}>
              <View style={{ flex: 1, backgroundColor: token("secondary-system-background"), justifyContent: "center", paddingHorizontal: 10 }}>
                <Text style={{ fontSize: 10.5, color: label() }}>{tr("Studio", "Studio")}</Text>
              </View>
              <View style={{ width: 34, backgroundColor: token("system-orange"), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 8.5, color: "#ffffff" }}>{tr("Arch", "归档")}</Text>
              </View>
              <View style={{ width: 30, backgroundColor: token("system-red"), alignItems: "center", justifyContent: "center" }}>
                <Text style={{ fontSize: 8.5, color: "#ffffff" }}>{tr("Del", "删除")}</Text>
              </View>
            </View>
          </View>
        </ThumbShell>
      );
    case "refresh":
      return (
        <ThumbShell>
          <View style={{ alignItems: "center", gap: 8 }}>
            <View style={{ width: 18, height: 18, borderRadius: 9, borderWidth: 2.5, borderColor: token("tertiary-label"), borderTopColor: "transparent" }} />
            <View style={{ width: 130, gap: 4 }}>
              <Each of={[0, 1, 2]} key={(n) => n}>
                {(n) => <View style={{ ...mini(), height: 12 }} />}
              </Each>
            </View>
          </View>
        </ThumbShell>
      );
    default:
      return <ThumbShell>{null}</ThumbShell>;
  }
}
