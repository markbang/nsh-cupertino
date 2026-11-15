// The foundational components: icons, tokens, navigation, lists, buttons and
// the fields. Each page is a real screen in the stage, not a picture.
import { type JSX, signal, Text, token, View } from "nsh";
import {
  ActivityIndicator,
  Button,
  List,
  ListTile,
  NavPage,
  NavigationBar,
  ScrollView,
  SearchField,
  Section,
  Switch,
  TextField,
} from "cupertino";
import { API } from "./api";
import { tr } from "./i18n";
import { contrast } from "./prefs";
import { DemoPage, faint, grouped, hairline, label, mono, muted, page, surface, tint } from "./ui";

const api = (doc: string, ...titles: string[]) => {
  const groups = API[doc] ?? [];
  return titles.length ? groups.filter((group) => titles.includes(group.title)) : groups;
};

const pageStyle = () => ({ flex: 1, backgroundColor: page() });

// crate::icon::NAMES: NSH's stand-in for SF Symbols.
const ICON_NAMES = [
  "chevron.left",
  "chevron.right",
  "chevron.up",
  "chevron.down",
  "checkmark",
  "magnifyingglass",
  "xmark.circle.fill",
  "eye",
  "eye.slash",
  "person",
  "bell",
  "envelope",
  "sun.max",
  "moon",
  "circle.lefthalf.filled",
  "square.grid.2x2",
  "list.bullet",
  "slider.horizontal.3",
  "info.circle",
  "sparkles",
  "arrow.up.right",
];

/** A demo screen: a scroll view of grouped sections. */
function Screen(props: { children: JSX.Element }) {
  return <View style={pageStyle()}>{props.children}</View>;
}

function IconPage() {
  const chosen = signal("info.circle");
  return (
    <DemoPage
      title={tr("Icon", "图标")}
      blurb={tr(
        "NSH has no SF Symbols; the crate draws these shapes in the text color, so they follow the appearance and the contrast setting.",
        "NSH 没有 SF Symbols；这个库用文本颜色绘制这些形状，因此会跟随外观和高对比度设置。",
      )}
      hint={tr("Press an icon to see its name.", "点按图标查看名称。")}
      variants={[
        {
          id: "names",
          title: tr("Icons", "图标"),
          code: `import { ListTile, Button } from "cupertino";

<ListTile title="AirDrop" leading="person" leadingColor="system-blue" accessory="chevron" />
<Button title="Share" icon="arrow.up.right" variant="tinted" />
<Button icon="bell" label="Notifications" variant="plain" />`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <View style={{ padding: 16, gap: 14 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    padding: 12,
                    borderRadius: 12,
                    backgroundColor: surface(),
                  }}
                >
                  <Button icon={chosen()} label={chosen()} variant="plain" />
                  <Text style={{ fontFamily: mono, fontSize: 13, color: muted() }}>{chosen()}</Text>
                </View>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                  <Each of={ICON_NAMES} key={(name) => name}>
                    {(name) => (
                      <Button
                        icon={name()}
                        label={name()}
                        variant={chosen() === name() ? "tinted" : "plain"}
                        onPress={() => chosen.set(name())}
                      />
                    )}
                  </Each>
                </View>
              </View>
            </ScrollView>
          ),
        },
        {
          id: "inline",
          title: tr("In a row", "在行内"),
          code: `import { List, Section, ListTile } from "cupertino";

<List>
  <Section header="Settings">
    <ListTile title="AirDrop" leading="person" leadingColor="system-blue" accessory="chevron" />
    <ListTile title="Notifications" leading="bell" leadingColor="system-red" accessory="chevron" />
    <ListTile title="Messages" leading="envelope" leadingColor="system-green" accessory="none" />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Leading icons", "前置图标")} footer={tr("A 28 pt box, drawn in a system color.", "28 pt 的方框，用系统颜色绘制。")}>
                  <ListTile title="AirDrop" leading="person" leadingColor="system-blue" accessory="chevron" separator />
                  <ListTile title="Notifications" leading="bell" leadingColor="system-red" accessory="chevron" separator />
                  <ListTile title="Messages" leading="envelope" leadingColor="system-green" accessory="none" separator={false} />
                </Section>
                <Section header={tr("Buttons", "按钮")}>
                  <View style={{ padding: 16, flexDirection: "row", gap: 10, flexWrap: "wrap" }}>
                    <Button title="Share" icon="arrow.up.right" variant="tinted" />
                    <Button title="Search" icon="magnifyingglass" variant="plain" />
                    <Button title="More" icon="sparkles" variant="filled" />
                  </View>
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("icon")}
      apiTitle="single"
    />
  );
}

const ROLES = [
  "system-blue",
  "system-green",
  "system-red",
  "system-orange",
  "system-yellow",
  "system-purple",
  "system-pink",
  "system-teal",
  "system-indigo",
  "system-gray",
  "label",
  "secondary-label",
  "separator",
  "fill",
  "system-grouped-background",
  "secondary-system-grouped-background",
];

const TYPE_SCALE = [
  ["largeTitle", 34, 700],
  ["title1", 28, 700],
  ["title2", 22, 700],
  ["title3", 20, 600],
  ["headline", 17, 600],
  ["body", 17, 400],
  ["callout", 16, 400],
  ["subheadline", 15, 400],
  ["footnote", 13, 400],
  ["caption1", 12, 400],
  ["caption2", 11, 400],
] as const;

const MATERIALS = ["ultra-thin", "thin", "regular", "thick", "chrome"];

function ThemePage() {
  const color = (name: string) => (token as unknown as (name: string) => string)(name);
  return (
    <DemoPage
      title={tr("Theme", "主题")}
      blurb={tr(
        "One source of truth: semantic roles with light, dark and high-contrast values, the type scale, spacing and motion. Theme swaps the high-contrast set at run time.",
        "唯一数据源：带浅色、深色和高对比度取值的语义颜色、字号、间距与动效。Theme 会在运行时切换高对比度取值。",
      )}
      hint={tr(
        "This switch is the site's own high-contrast control.",
        "这个开关就是站点自己的高对比度控制。",
      )}
      variants={[
        {
          id: "colors",
          title: tr("Colors", "颜色"),
          code: `import { Theme } from "cupertino";

<Theme contrast="normal">
  <App />
</Theme>

// TSX: class="bg-system-blue text-secondary-label"
// Rust: tokens::system_blue(), tokens::secondary_label()`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <List scroll={false}>
                <Section
                  header={tr("Semantic roles", "语义颜色")}
                  footer={tr("Light, dark and high contrast; the aliases follow.", "浅色、深色和高对比度；别名会跟随。")}
                >
                  <View style={{ padding: 16, gap: 10 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                      <Text style={{ fontSize: 15, color: label() }}>{tr("Increased contrast", "高对比度")}</Text>
                      <Switch
                        checked={contrast() === "high"}
                        label={tr("Increased contrast", "高对比度")}
                        onChange={(event: { value: boolean }) => contrast.set(event.value ? "high" : "normal")}
                      />
                    </View>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      <Each of={ROLES} key={(name) => name}>
                        {(name) => (
                          <View style={{ width: 74, gap: 4 }}>
                            <View
                              style={{
                                height: 40,
                                borderRadius: 8,
                                backgroundColor: color(name()),
                                borderWidth: 1,
                                borderColor: hairline(),
                              }}
                            />
                            <Text style={{ fontSize: 9.5, color: faint(), numberOfLines: 1 }}>
                              {name().replace("system-", "").replace("secondary-", "2nd ")}
                            </Text>
                          </View>
                        )}
                      </Each>
                    </View>
                  </View>
                </Section>
              </List>
            </ScrollView>
          ),
        },
        {
          id: "type",
          title: tr("Type", "字号"),
          code: `// Theme tokens: text-large-title, text-title1, text-body, ...
// Rust: tokens::type_default(TextStyle::Body)

<Text style={{ fontSize: 17, fontWeight: 400 }}>Body</Text>`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <List scroll={false}>
                <Section header={tr("Type scale", "字号阶梯")} footer={tr("The site's Text size control scales this step by step.", "站点的“字号”控件会逐级缩放这里。")}>
                  <View style={{ padding: 16, gap: 12 }}>
                    <Each of={TYPE_SCALE} key={(step) => step[0]}>
                      {(step) => (
                        <View style={{ flexDirection: "row", alignItems: "baseline", gap: 12 }}>
                          <Text style={{ width: 92, fontFamily: mono, fontSize: 10, color: faint() }}>
                            {`${step()[0]} ${step()[1]}`}
                          </Text>
                          <Text style={{ flex: 1, fontSize: step()[1], fontWeight: step()[2], color: label(), numberOfLines: 1 }}>
                            Cupertino
                          </Text>
                        </View>
                      )}
                    </Each>
                  </View>
                </Section>
              </List>
            </ScrollView>
          ),
        },
        {
          id: "materials",
          title: tr("Materials", "材质"),
          code: `// The floating layer's glass, as tokens:
// tokens::materials().regular, .thick, .chrome
// Each is a fill per appearance and a 20-30 pt blur.`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <List scroll={false}>
                <Section header={tr("Materials", "材质")} footer={tr("For the floating layer only: bars and overlays content scrolls under.", "仅用于浮层：内容在其下滚动的栏与浮层。")}>
                  <View style={{ padding: 16, gap: 10 }}>
                    <Each of={MATERIALS} key={(name) => name}>
                      {(name) => (
                        <View
                          style={{
                            height: 52,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: hairline(),
                            backgroundColor:
                              name() === "thick" ? "rgba(242,242,247,0.72)" : name() === "regular" ? "rgba(242,242,247,0.56)" : "rgba(242,242,247,0.4)",
                            backdropFilter: "blur(24px)",
                            justifyContent: "center",
                            paddingHorizontal: 14,
                          }}
                        >
                          <Text style={{ fontFamily: mono, fontSize: 13, color: label() }}>{name()}</Text>
                        </View>
                      )}
                    </Each>
                  </View>
                </Section>
              </List>
            </ScrollView>
          ),
        },
      ]}
      api={api("theme")}
      apiTitle="single"
    />
  );
}

function NavigationBarPage() {
  const presses = signal(0);
  return (
    <DemoPage
      title={tr("Navigation bar", "导航栏")}
      blurb={tr(
        "The bar on its own: a compact title, a large title that scrolls away, a back button and trailing actions.",
        "单独的导航栏：紧凑标题、会随滚动收起的大标题、返回按钮和尾部操作。",
      )}
      variants={[
        {
          id: "large",
          title: tr("Large title", "大标题"),
          code: `import { NavigationBar, List, Section, ListTile } from "cupertino";

<NavigationBar title="Settings" largeTitle="Settings" trailing="Edit" onTrailing={edit}>
  <List scroll={false}>
    <Section><ListTile title="Wi-Fi" accessory="chevron" /></Section>
  </List>
</NavigationBar>`,
          view: () => (
            <Screen>
              <NavigationBar
                title="Settings"
                largeTitle="Settings"
              >
                <Button title="Edit" variant="plain" size="small" onPress={() => presses.update((n) => n + 1)} />
                <List scroll={false}>
                  <Section footer={tr(`${presses()} trailing presses`, `尾部按钮按下 ${presses()} 次`)}>
                    <ListTile title={tr("Wi-Fi", "无线局域网")} subtitle="Home" accessory="chevron" separator />
                    <ListTile title={tr("Bluetooth", "蓝牙")} accessory="chevron" separator />
                    <ListTile title={tr("Cellular", "蜂窝网络")} accessory="chevron" separator={false} />
                  </Section>
                  <Section header={tr("Filler", "填充")}>
                    <Each of={[1, 2, 3, 4, 5, 6]} key={(n) => n}>
                      {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 6} />}
                    </Each>
                  </Section>
                </List>
              </NavigationBar>
            </Screen>
          ),
        },
        {
          id: "back",
          title: tr("Back", "返回"),
          code: `import { NavigationBar, List, Section, ListTile } from "cupertino";

<NavigationBar title="Details" back="Settings" onBack={back}>
  <List scroll={false}>
    <Section><ListTile title="Storage" subtitle="128 GB" accessory="none" /></Section>
  </List>
</NavigationBar>`,
          view: () => (
            <Screen>
              <NavigationBar title="Details" back="Settings" onBack={() => presses.update((n) => n + 1)}>
                <Button title="Done" variant="plain" size="small" onPress={() => presses.update((n) => n + 1)} />
                <List scroll={false}>
                  <Section footer={tr(`${presses()} back presses`, `返回按下 ${presses()} 次`)}>
                    <ListTile title={tr("Storage", "存储")} subtitle="128 GB" accessory="none" separator />
                    <ListTile title={tr("Battery", "电池")} subtitle="92%" accessory="none" separator={false} />
                  </Section>
                  <Section header={tr("About", "关于")}>
                    <Each of={[1, 2, 3, 4]} key={(n) => n}>
                      {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 4} />}
                    </Each>
                  </Section>
                </List>
              </NavigationBar>
            </Screen>
          ),
        },
        {
          id: "material",
          title: tr("Material", "材质"),
          code: `import { NavigationBar } from "cupertino";

<NavigationBar title="Photos" material="regular" largeTitle="Photos">
  <ScrollView>{photos}</ScrollView>
</NavigationBar>`,
          view: () => (
            <Screen>
              <NavigationBar title="Photos" largeTitle="Photos" material="regular">
                <ScrollView>
                  <View style={{ padding: 16, gap: 16 }}>
                    <Each of={Array.from({ length: 8 }, (_, i) => i)} key={(n) => n}>
                      {(n) => (
                        <View style={{ height: 150, borderRadius: 14, backgroundColor: tint(), opacity: 0.12 + n() * 0.06 }} />
                      )}
                    </Each>
                  </View>
                </ScrollView>
              </NavigationBar>
            </Screen>
          ),
        },
      ]}
      api={api("navigation-bar", "NavigationBar")}
      apiTitle="single"
    />
  );
}

function NavPagePage() {
  const scrolls = signal(0);
  return (
    <DemoPage
      title={tr("Nav page", "导航页")}
      blurb={tr(
        "A whole page: the bar over a scroll view whose large title collapses into the bar as you scroll. Try scrolling, then pressing the title.",
        "完整页面：导航栏覆盖滚动视图，滚动时大标题收进栏内。试试滚动，然后点按标题。",
      )}
      variants={[
        {
          id: "settings",
          title: tr("Large title", "大标题"),
          code: `import { NavPage, List, Section, ListTile } from "cupertino";

<NavPage title="Wi-Fi" largeTitle="Wi-Fi" back="Settings" onBack={back}>
  <List scroll={false}>
    <Section><ListTile title="Home" subtitle="Connected" accessory="checkmark" checked /></Section>
  </List>
</NavPage>`,
          view: () => (
            <Screen>
              <NavPage title="Wi-Fi" largeTitle="Wi-Fi" back="Settings" onBack={() => scrolls.update((n) => n + 1)}>
                <List scroll={false}>
                  <Section header={tr("Networks", "网络")} footer={tr("Scroll: the large title folds into the bar's 44 pt.", "滚动时，大标题收进 44 pt 的栏内。")}>
                    <ListTile title="Home" subtitle={tr("Connected", "已连接")} accessory="checkmark" checked separator />
                    <ListTile title="Studio" subtitle={tr("Secure", "安全")} accessory="chevron" separator />
                    <ListTile title="Guest" accessory="chevron" separator={false} />
                  </Section>
                  <Section header={tr("Filler", "填充")}>
                    <Each of={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} key={(n) => n}>
                      {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 10} />}
                    </Each>
                  </Section>
                </List>
              </NavPage>
            </Screen>
          ),
        },
      ]}
      api={api("navigation-bar", "NavPage")}
      apiTitle="single"
    />
  );
}

function ListPage() {
  return (
    <DemoPage
      title={tr("List", "列表")}
      blurb={tr(
        "A scrolling page of grouped sections on systemGroupedBackground — the settings surface on every iOS screen.",
        "在 systemGroupedBackground 上滚动的分组列表——每个 iOS 设置页面的基础。",
      )}
      variants={[
        {
          id: "grouped",
          title: tr("Grouped", "分组"),
          code: `import { List, Section, ListTile } from "cupertino";

<List>
  <Section header="Account" footer="Rows sit on one 10 pt surface.">
    <ListTile title="Name" subtitle="Ada Lovelace" accessory="chevron" />
    <ListTile title="Passwords" accessory="chevron" separator={false} />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List>
                <Section header={tr("Account", "账户")} footer={tr("Rows sit on one 10 pt surface; the hairline starts where the text does.", "所有行位于同一块 10 pt 圆角表面上；分隔线从文字处开始。")}>
                  <ListTile title={tr("Name", "姓名")} subtitle="Ada Lovelace" accessory="chevron" separator />
                  <ListTile title={tr("Passwords", "密码")} accessory="chevron" separator />
                  <ListTile title={tr("Devices", "设备")} subtitle="4" accessory="chevron" separator={false} />
                </Section>
                <Section header={tr("Media", "媒体")}>
                  <ListTile title={tr("Music", "音乐")} leading="sparkles" leadingColor="system-pink" accessory="chevron" separator />
                  <ListTile title={tr("Photos", "照片")} leading="square.grid.2x2" leadingColor="system-orange" accessory="chevron" separator={false} />
                </Section>
                <Section footer={tr("Scroll for more rows.", "滚动查看更多。")}>
                  <Each of={[1, 2, 3, 4, 5]} key={(n) => n}>
                    {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 5} />}
                  </Each>
                </Section>
              </List>
            </Screen>
          ),
        },
        {
          id: "plain",
          title: tr("Plain", "朴素"),
          code: `import { List, Section, ListTile } from "cupertino";

<List background="system-background">
  <Section header="All">
    <ListTile title="Plain row" accessory="none" />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List background="system-background">
                <Section header={tr("Inbox", "收件箱")}>
                  <ListTile title="Apple" subtitle={tr("Your receipt", "你的收据")} accessory="chevron" separator />
                  <ListTile title="Studio" subtitle={tr("Draft review", "稿件审阅")} accessory="chevron" separator />
                  <ListTile title="News" subtitle={tr("Weekly digest", "每周摘要")} accessory="chevron" separator={false} />
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("list", "List")}
      apiTitle="single"
    />
  );
}

function SectionPage() {
  const header = signal(true);
  return (
    <DemoPage
      title={tr("Section", "分组")}
      blurb={tr(
        "A group of rows on one surface, with an optional header and footer. Sections stack, 32 pt apart.",
        "一组位于同一表面上的行，可带页眉与页脚。多个分组相距 32 pt 堆叠。",
      )}
      variants={[
        {
          id: "header",
          title: tr("Header and footer", "页眉与页脚"),
          code: `import { List, Section, ListTile } from "cupertino";

<List>
  <Section header="Network" footer="Wi-Fi joins the strongest network.">
    <ListTile title="Wi-Fi" accessory="chevron" />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List>
                <View style={{ paddingHorizontal: 16, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ fontSize: 15, color: label() }}>{tr("Header", "页眉")}</Text>
                  <Switch checked={header()} label={tr("Header", "页眉")} onChange={(event: { value: boolean }) => header.set(event.value)} />
                </View>
                <Section
                  header={header() ? tr("Network", "网络") : undefined}
                  footer={tr("Wi-Fi joins the strongest network, automatically.", "无线局域网会自动加入信号最强的网络。")}
                >
                  <ListTile title={tr("Wi-Fi", "无线局域网")} accessory="chevron" separator />
                  <ListTile title={tr("Cellular", "蜂窝网络")} accessory="chevron" separator={false} />
                </Section>
                <Section header={tr("Second group", "第二个分组")} footer={tr("Footers explain the group in 13 pt.", "页脚用 13 pt 解释该分组。")}>
                  <ListTile title={tr("Bluetooth", "蓝牙")} accessory="chevron" separator={false} />
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("list", "Section")}
      apiTitle="single"
    />
  );
}

function ListTilePage() {
  const chosen = signal("b");
  return (
    <DemoPage
      title={tr("List tile", "列表行")}
      blurb={tr(
        "A 44 pt row: title, subtitle, leading icon, chevron or checkmark, a trailing control. It is a button to screen readers.",
        "44 pt 的行：标题、副标题、前置图标、箭头或对勾、尾部控件。对屏幕阅读器来说它就是一个按钮。",
      )}
      variants={[
        {
          id: "accessories",
          title: tr("Rows", "行"),
          code: `import { List, Section, ListTile } from "cupertino";

<List>
  <Section header="Rows">
    <ListTile title="Plain row" accessory="chevron" />
    <ListTile title="Subtitle" subtitle="Secondary label, 13 pt" accessory="none" />
    <ListTile title="Destructive" destructive accessory="none" />
    <ListTile title="Disabled" disabled accessory="none" />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Rows", "行")} footer={tr("The hairline starts where the text does.", "分隔线从文字处开始。")}>
                  <ListTile title={tr("Plain row", "普通行")} accessory="chevron" separator />
                  <ListTile title={tr("Row with a subtitle", "带副标题的行")} subtitle={tr("Secondary label, 13 pt", "次要标签，13 pt")} accessory="none" separator />
                  <ListTile title={tr("Destructive", "破坏性")} destructive accessory="none" separator />
                  <ListTile title={tr("Disabled", "已禁用")} disabled accessory="none" separator={false} />
                </Section>
                <Section header={tr("Selection", "选择")} footer={tr("Press a row: the checkmark and the screen reader's selected state follow.", "点按行：对勾和屏幕阅读器的选中状态会跟随。")}>
                  <Each of={["a", "b", "c"]} key={(id) => id}>
                    {(id) => (
                      <ListTile
                        title={`Option ${id().toUpperCase()}`}
                        accessory="checkmark"
                        checked={chosen() === id()}
                        separator={id() !== "c"}
                        onPress={() => chosen.set(id())}
                      />
                    )}
                  </Each>
                </Section>
              </List>
            </Screen>
          ),
        },
        {
          id: "trailing",
          title: tr("Trailing control", "尾部控件"),
          code: `import { List, Section, ListTile, Switch } from "cupertino";

<List>
  <Section header="Settings">
    <ListTile title="Wi-Fi" accessory="none">
      <Switch checked={on()} label="Wi-Fi" onChange={(event) => setOn(event.value)} />
    </ListTile>
  </Section>
</List>`,
          view: () => <TrailingDemo />,
        },
      ]}
      api={api("list", "ListTile")}
      apiTitle="single"
    />
  );
}

function TrailingDemo() {
  const on = signal(true);
  return (
    <Screen>
      <List scroll={false}>
        <Section header={tr("Settings", "设置")} footer={tr("A control at the trailing edge: a row says what it controls.", "尾部控件：行文本说明它控制什么。")}>
          <ListTile title={tr("Wi-Fi", "无线局域网")} accessory="none" separator>
            <Switch checked={on()} label={tr("Wi-Fi", "无线局域网")} onChange={(event: { value: boolean }) => on.set(event.value)} />
          </ListTile>
          <ListTile title={tr("Bluetooth", "蓝牙")} accessory="none" separator={false}>
            <Switch checked={false} label={tr("Bluetooth", "蓝牙")} onChange={() => {}} />
          </ListTile>
        </Section>
        <Section header={tr("Leading", "前置图标")}>
          <ListTile title={tr("Notifications", "通知")} leading="bell" leadingColor="system-red" accessory="chevron" separator />
          <ListTile title={tr("Messages", "信息")} leading="envelope" leadingColor="system-green" accessory="none" separator={false} />
        </Section>
      </List>
    </Screen>
  );
}

function ButtonPage() {
  const taps = signal(0);
  return (
    <DemoPage
      title={tr("Button", "按钮")}
      blurb={tr(
        "Filled, tinted, plain and destructive, in three sizes, with iOS's press opacity. Every button has a name for screen readers.",
        "填充、着色、朴素和破坏性四种样式，三种尺寸，带有 iOS 的按压透明度。每个按钮都有供屏幕阅读器使用的名称。",
      )}
      variants={[
        {
          id: "styles",
          title: tr("Styles", "样式"),
          code: `import { Button } from "cupertino";

<Button title="Continue" onPress={next} />
<Button title="Share" variant="tinted" onPress={share} />
<Button title="Show details" variant="plain" onPress={details} />
<Button title="Delete" variant="destructive" onPress={remove} />
<Button title="Disabled" disabled />`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <View style={{ padding: 20, gap: 14 }}>
                <Button title={tr("Continue", "继续")} onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("With an icon", "带图标")} icon="arrow.up.right" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Share", "分享")} variant="tinted" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Show details", "查看详情")} variant="plain" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Delete", "删除")} variant="destructive" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Disabled", "已禁用")} disabled />
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", paddingTop: 6 }}>
                  <ActivityIndicator size={16} label={tr("Counting presses", "正在统计按压")} animating={taps() > 2} />
                  <Text style={{ fontSize: 13, color: faint() }}>
                    {tr(`${taps()} presses`, `按压 ${taps()} 次`)}
                  </Text>
                </View>
              </View>
            </ScrollView>
          ),
        },
        {
          id: "sizes",
          title: tr("Sizes", "尺寸"),
          code: `import { Button } from "cupertino";

<Button title="Large" size="large" />
<Button title="Medium" size="medium" variant="tinted" />
<Button title="Small" size="small" variant="plain" />`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <View style={{ padding: 20, gap: 14, alignItems: "flex-start" }}>
                <Button title={tr("Large", "大")} size="large" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Medium", "中")} size="medium" variant="tinted" onPress={() => taps.update((n) => n + 1)} />
                <Button title={tr("Small", "小")} size="small" variant="plain" onPress={() => taps.update((n) => n + 1)} />
                <Button icon="sparkles" label={tr("Favourites", "收藏")} variant="tinted" onPress={() => taps.update((n) => n + 1)} />
              </View>
            </ScrollView>
          ),
        },
      ]}
      api={api("button")}
      apiTitle="single"
    />
  );
}

function TextFieldPage() {
  const name = signal("Ada Lovelace");
  const password = signal("correct horse");
  return (
    <DemoPage
      title={tr("Text field", "文本输入框")}
      blurb={tr(
        "The rounded Cupertino field and the grouped form row: clear, secure, a leading icon, keyboards and a disabled state.",
        "圆角 Cupertino 输入框和分组表单行：清除、密码、前置图标、键盘类型与禁用状态。",
      )}
      variants={[
        {
          id: "rounded",
          title: tr("Rounded", "圆角"),
          code: `import { TextField } from "cupertino";

<TextField value={name()} placeholder="Name" label="Name"
           leading="person" onChange={(event) => setName(event.value)} />
<TextField value={password()} placeholder="Password" label="Password"
           secure onChange={(event) => setPassword(event.value)} />`,
          view: () => (
            <ScrollView style={pageStyle()}>
              <View style={{ padding: 20, gap: 12 }}>
                <TextField
                  value={name()}
                  placeholder={tr("Name", "姓名")}
                  label={tr("Name", "姓名")}
                  leading="person"
                  onChange={(event: { value: string }) => name.set(event.value)}
                />
                <TextField
                  value={password()}
                  placeholder={tr("Password", "密码")}
                  label={tr("Password", "密码")}
                  secure
                  onChange={(event: { value: string }) => password.set(event.value)}
                />
                <TextField value="Ada" label={tr("Disabled", "已禁用")} placeholder={tr("Disabled", "已禁用")} disabled />
                <Text style={{ fontSize: 13, color: faint() }}>
                  {tr(`${name().length} characters in the name field`, `姓名输入框有 ${name().length} 个字符`)}
                </Text>
              </View>
            </ScrollView>
          ),
        },
        {
          id: "grouped",
          title: tr("Grouped", "分组"),
          code: `import { TextField, List, Section } from "cupertino";

<List>
  <Section header="Profile" footer="A form row's surface: the grouped background.">
    <TextField value={name()} variant="grouped" placeholder="Name" label="Name"
               onChange={(event) => setName(event.value)} />
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Profile", "个人资料")} footer={tr("A form row's surface: the grouped background, 10 pt corners.", "表单行的表面：分组背景，10 pt 圆角。")}>
                  <View style={{ padding: 16, gap: 12 }}>
                    <TextField
                      value={name()}
                      variant="grouped"
                      placeholder={tr("Name", "姓名")}
                      label={tr("Name", "姓名")}
                      onChange={(event: { value: string }) => name.set(event.value)}
                    />
                  </View>
                </Section>
                <Section header={tr("What is typed", "输入内容")}>
                  <ListTile title={tr("Name", "姓名")} subtitle={name()} accessory="none" separator={false} />
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("text-field")}
      apiTitle="single"
    />
  );
}

function SearchFieldPage() {
  const query = signal("");
  const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Lemon", "Mango", "Peach", "Pear"];
  const shown = () => fruits.filter((fruit) => fruit.toLowerCase().includes(query().toLowerCase()));
  return (
    <DemoPage
      title={tr("Search field", "搜索框")}
      blurb={tr(
        "iOS's search field: 36 pt, a magnifier, a clear button and Cancel. The page owns the filtering.",
        "iOS 的搜索框：36 pt、放大镜、清除按钮和取消。筛选逻辑由页面负责。",
      )}
      variants={[
        {
          id: "filter",
          title: tr("Filter", "筛选"),
          code: `import { SearchField } from "cupertino";

<SearchField value={query()} placeholder="Search fruit" label="Search"
             cancel onChange={(event) => setQuery(event.value)}
             onCancel={() => setQuery("")} />`,
          view: () => (
            <Screen>
              <View style={{ paddingHorizontal: 16, paddingTop: 10 }}>
                <SearchField
                  value={query()}
                  placeholder={tr("Search fruit", "搜索水果")}
                  label={tr("Search fruit", "搜索水果")}
                  cancel
                  onChange={(event: { value: string }) => query.set(event.value)}
                  onCancel={() => query.set("")}
                />
              </View>
              <List>
                <Section
                  header={tr("Results", "结果")}
                  footer={tr(`${shown().length} of ${fruits.length}`, `${shown().length} / ${fruits.length}`)}
                >
                  <Each of={fruits} key={(fruit) => fruit}>
                    {(fruit) => (
                      <View style={{ display: shown().includes(fruit()) ? "flex" : "none" }}>
                        <ListTile title={fruit()} accessory="chevron" separator={fruit() !== "Pear"} />
                      </View>
                    )}
                  </Each>
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("search-field")}
      apiTitle="single"
    />
  );
}

function SwitchPage() {
  const wifi = signal(true);
  const bluetooth = signal(false);
  return (
    <DemoPage
      title={tr("Switch", "开关")}
      blurb={tr(
        "51 × 31, green when on, a 27 pt thumb over 200 ms. Put it in a row whose text says what it controls.",
        "51 × 31，开启时为绿色，27 pt 滑块，200 ms 动画。放在行内，由行文本说明它控制什么。",
      )}
      variants={[
        {
          id: "settings",
          title: tr("Settings", "设置"),
          code: `import { List, ListTile, Section, Switch } from "cupertino";

<List>
  <Section header="Settings">
    <ListTile title="Wi-Fi" accessory="none">
      <Switch checked={wifi()} label="Wi-Fi" onChange={(event) => setWifi(event.value)} />
    </ListTile>
  </Section>
</List>`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Settings", "设置")} footer={tr("A switch belongs in a row; the row's text is its name.", "开关属于行内；行文本就是它的名称。")}>
                  <ListTile title={tr("Wi-Fi", "无线局域网")} subtitle={wifi() ? tr("On", "开") : tr("Off", "关")} accessory="none" separator>
                    <Switch checked={wifi()} label={tr("Wi-Fi", "无线局域网")} onChange={(event: { value: boolean }) => wifi.set(event.value)} />
                  </ListTile>
                  <ListTile title={tr("Bluetooth", "蓝牙")} accessory="none" separator>
                    <Switch checked={bluetooth()} label={tr("Bluetooth", "蓝牙")} onChange={(event: { value: boolean }) => bluetooth.set(event.value)} />
                  </ListTile>
                  <ListTile title={tr("AirDrop", "隔空投送")} subtitle={tr("Contacts Only", "仅限联系人")} accessory="none" separator={false}>
                    <Switch checked={false} disabled label={tr("AirDrop", "隔空投送")} />
                  </ListTile>
                </Section>
                <Section footer={tr("Try the keyboard: Tab to a switch, then Space.", "试试键盘：Tab 到开关，然后空格。")}>
                  <ListTile title={tr("State", "状态")} subtitle={`${wifi() ? "Wi-Fi on" : "Wi-Fi off"} · ${bluetooth() ? "Bluetooth on" : "Bluetooth off"}`} accessory="none" separator={false} />
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("switch")}
      apiTitle="single"
    />
  );
}

function ActivityIndicatorPage() {
  const running = signal(true);
  return (
    <DemoPage
      title={tr("Activity indicator", "活动指示器")}
      blurb={tr(
        "Eight blades at fixed opacities, turning 45° eight times a second — one turn per second, drawn natively.",
        "八个固定透明度的叶片，每秒转八次 45°——每秒一圈，原生绘制。",
      )}
      variants={[
        {
          id: "sizes",
          title: tr("Sizes", "尺寸"),
          code: `import { ActivityIndicator } from "cupertino";

<ActivityIndicator size={20} label="Checking mail" />
<ActivityIndicator size={40} color="system-blue" label="Checking mail" />`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Sizes", "尺寸")} footer={tr("The blades scale with the box.", "叶片随尺寸缩放。")}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 24 }}>
                    <ActivityIndicator size={16} label={tr("Checking mail", "正在检查邮件")} />
                    <ActivityIndicator size={20} label={tr("Checking mail", "正在检查邮件")} />
                    <ActivityIndicator size={28} label={tr("Checking mail", "正在检查邮件")} />
                    <ActivityIndicator size={40} color="system-blue" label={tr("Checking mail", "正在检查邮件")} />
                  </View>
                </Section>
                <Section header={tr("Running", "运行")} footer={tr("Stopped, it shows a still frame; Reduce Motion does the same.", "停止时显示静止帧；减弱动态效果时也一样。")}>
                  <ListTile title={tr("Keep loading", "保持加载")} subtitle={running() ? tr("Loading mail…", "正在加载邮件…") : tr("Paused", "已暂停")} accessory="none" separator={false}>
                    <Switch checked={running()} label={tr("Keep loading", "保持加载")} onChange={(event: { value: boolean }) => running.set(event.value)} />
                  </ListTile>
                </Section>
              </List>
            </Screen>
          ),
        },
      ]}
      api={api("activity-indicator")}
      apiTitle="single"
    />
  );
}

function ScrollViewPage() {
  return (
    <DemoPage
      title={tr("Scroll view", "滚动视图")}
      blurb={tr(
        "The platform's scrolling with its bouncing, indicators and keyboard behavior, including sideways lists.",
        "平台原生滚动，带回弹、指示器和键盘行为，也支持横向列表。",
      )}
      variants={[
        {
          id: "horizontal",
          title: tr("Horizontal", "横向"),
          code: `import { ScrollView } from "cupertino";

<ScrollView horizontal>
  {cards.map((card) => <Card key={card.id} {...card} />)}
</ScrollView>`,
          view: () => (
            <Screen>
              <List scroll={false}>
                <Section header={tr("Sideways", "横向")} footer={tr("Wheel or trackpad scrolls it; drag on a touch screen.", "滚轮或触控板可滚动；触屏上拖动。")}>
                  <ScrollView horizontal>
                    <View style={{ flexDirection: "row", gap: 12, padding: 16 }}>
                      <Each of={["Cupertino", "Grouped", "Hairline", "Springs", "Contrast", "Materials"]} key={(name) => name}>
                        {(name) => (
                          <View style={{ width: 132, height: 96, borderRadius: 14, backgroundColor: tint(), opacity: 0.16, justifyContent: "flex-end", padding: 10 }}>
                            <Text style={{ fontSize: 13, fontWeight: 600, color: label() }}>{name()}</Text>
                          </View>
                        )}
                      </Each>
                    </View>
                  </ScrollView>
                </Section>
                <Section header={tr("Rows", "行")}>
                  <Each of={[1, 2, 3, 4, 5, 6]} key={(n) => n}>
                    {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 6} />}
                  </Each>
                </Section>
              </List>
            </Screen>
          ),
        },
        {
          id: "bounce",
          title: tr("Bounce", "回弹"),
          code: `import { ScrollView } from "cupertino";

<ScrollView bounces indicator>{rows}</ScrollView>
<ScrollView bounces={false} indicator={false}>{rows}</ScrollView>`,
          view: () => (
            <Screen>
              <ScrollView bounces>
                <View style={{ padding: 16, gap: 12 }}>
                  <Text style={{ fontSize: 13, color: faint() }}>{tr("Pull past the top or bottom and release: it springs back.", "越界拖过顶部或底部再松开：它会弹回。")}</Text>
                  <Each of={[1, 2, 3, 4, 5, 6, 7, 8]} key={(n) => n}>
                    {(n) => (
                      <View style={{ height: 64, borderRadius: 12, backgroundColor: surface(), justifyContent: "center", paddingHorizontal: 16 }}>
                        <Text style={{ fontSize: 15, color: label() }}>{tr(`Card ${n()}`, `卡片 ${n()}`)}</Text>
                      </View>
                    )}
                  </Each>
                </View>
              </ScrollView>
            </Screen>
          ),
        },
      ]}
      api={api("scroll-view")}
      apiTitle="single"
    />
  );
}

export const basics = [
  { id: "icon", Page: IconPage },
  { id: "theme", Page: ThemePage },
  { id: "navigation-bar", Page: NavigationBarPage },
  { id: "nav-page", Page: NavPagePage },
  { id: "list", Page: ListPage },
  { id: "section", Page: SectionPage },
  { id: "list-tile", Page: ListTilePage },
  { id: "button", Page: ButtonPage },
  { id: "text-field", Page: TextFieldPage },
  { id: "search-field", Page: SearchFieldPage },
  { id: "switch", Page: SwitchPage },
  { id: "activity-indicator", Page: ActivityIndicatorPage },
  { id: "scroll-view", Page: ScrollViewPage },
];
