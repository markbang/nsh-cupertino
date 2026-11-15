// The floating layer and the controls of wave B: sheets, sheets of actions,
// alerts, menus, wheels, segments, sliders, bars, swipe actions, refresh.
import { type JSX, signal, Text, View } from "nsh";
import {
  ActionSheet,
  AlertDialog,
  Button,
  ContextMenu,
  DatePicker,
  List,
  ListTile,
  Picker,
  RefreshView,
  ScrollView,
  Section,
  SegmentedControl,
  Sheet,
  Slider,
  SwipeRow,
  TabBar,
} from "cupertino";
import { API } from "./api";
import { tr } from "./i18n";
import { DemoPage, faint, hairline, label, muted, page, surface } from "./ui";

const api = (doc: string, ...titles: string[]) => {
  const groups = API[doc] ?? [];
  return titles.length ? groups.filter((group) => titles.includes(group.title)) : groups;
};

const screen = () => ({ flex: 1, backgroundColor: page() });
const card = () => ({
  borderRadius: 14,
  backgroundColor: surface(),
  borderWidth: 1,
  borderColor: hairline(),
});

function Rows(props: { title: string; rows: string[] }) {
  return (
    <Section header={props.title}>
      <Each of={props.rows} key={(row) => row}>
        {(row) => <ListTile title={row()} accessory="none" separator={row() !== props.rows[props.rows.length - 1]} />}
      </Each>
    </Section>
  );
}

// Sheet ---------------------------------------------------------------------

function SheetDemo() {
  const open = signal(false);
  const detent = signal("medium");
  const last = signal("");
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("Detents", "停靠点")} footer={tr("Medium is half the screen, large just below the status bar. Drag the grabber between them.", "中号占半屏，大号停靠在状态栏下方。拖动把手在两者间移动。")}>
          <View style={{ padding: 16, gap: 12 }}>
            <Button title={tr("Open the sheet", "打开面板")} onPress={() => open.set(true)} />
            <Text style={{ fontSize: 13, color: faint() }}>
              {tr(`Last reported: ${last() || "nothing yet"}`, `最近报告：${last() || "还没有"}`)}
            </Text>
          </View>
        </Section>
        <Rows title={tr("Under the sheet", "面板下方")} rows={["Row 1", "Row 2", "Row 3", "Row 4"]} />
      </List>
      <Sheet
        open={open()}
        detent={detent()}
        title={tr("Filters", "筛选")}
        trailing={tr("Done", "完成")}
        onOpenChange={(event: { open: boolean }) => open.set(event.open)}
        onDetentChange={(event: { detent: string }) => {
          detent.set(event.detent);
          last.set(event.detent);
        }}
        onTrailing={() => open.set(false)}
        onCancel={() => {
          open.set(false);
          last.set("cancelled");
        }}
      >
        <List scroll={false}>
          <Section header={tr("Show", "显示")} footer={tr("Drag the grabber: medium or large, and past medium to close.", "拖动把手：中号或大号，越过后关闭。")}>
            <ListTile title={tr("Unread only", "仅未读")} accessory="none" separator />
            <ListTile title={tr("Attachments", "附件")} accessory="none" separator />
            <ListTile title={tr("Flagged", "已标记")} accessory="none" separator={false} />
          </Section>
          <Rows title={tr("Sort by", "排序")} rows={[tr("Date", "日期"), tr("Sender", "发件人"), tr("Subject", "主题")]} />
        </List>
      </Sheet>
    </View>
  );
}

// Action sheet --------------------------------------------------------------

function ActionSheetDemo() {
  const open = signal(false);
  const last = signal("");
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("A choice", "选择")} footer={tr("Actions in one 10 pt group over the safe area, Cancel in another, 8 pt apart.", "操作放在安全区上方的一个 10 pt 分组，取消在另一个分组，相距 8 pt。")}>
          <View style={{ padding: 16, gap: 12 }}>
            <Button title={tr("Show actions", "显示操作")} onPress={() => open.set(true)} />
            <Text style={{ fontSize: 13, color: faint() }}>
              {tr(`Chosen: ${last() || "nothing yet"}`, `已选择：${last() || "还没有"}`)}
            </Text>
          </View>
        </Section>
      </List>
      <ActionSheet
        open={open()}
        title={tr("Photo", "照片")}
        message={tr("What do you want to do with it?", "你想怎么处理这张照片？")}
        actions={[
          { id: "copy", title: tr("Copy", "拷贝") },
          { id: "favourite", title: tr("Favourite", "收藏") },
          { id: "delete", title: tr("Delete", "删除"), destructive: true },
          { id: "share", title: tr("Share", "分享"), disabled: true },
        ]}
        cancel={tr("Cancel", "取消")}
        onOpenChange={(event: { open: boolean }) => open.set(event.open)}
        onAction={(event: { id: string }) => last.set(event.id)}
        onCancel={() => {
          open.set(false);
          last.set(tr("cancelled", "已取消"));
        }}
      />
    </View>
  );
}

// Alert ---------------------------------------------------------------------

function AlertDemo() {
  const open = signal(false);
  const last = signal("");
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("Two buttons", "两个按钮")} footer={tr("270 pt card, title and message, two buttons side by side. Delete is destructive.", "270 pt 卡片，标题与信息，两个按钮并排。删除是破坏性的。")}>
          <View style={{ padding: 16, gap: 12 }}>
            <Button title={tr("Delete message", "删除邮件")} variant="destructive" onPress={() => open.set(true)} />
            <Text style={{ fontSize: 13, color: faint() }}>
              {tr(`Result: ${last() || "nothing yet"}`, `结果：${last() || "还没有"}`)}
            </Text>
          </View>
        </Section>
      </List>
      <AlertDialog
        open={open()}
        title={tr("Delete this message?", "删除这封邮件？")}
        message={tr("It moves to Trash and stays there for 30 days.", "它会移到废纸篓，并在那里保留 30 天。")}
        actions={[
          { id: "cancel", title: tr("Cancel", "取消") },
          { id: "delete", title: tr("Delete", "删除"), destructive: true, preferred: true },
        ]}
        onOpenChange={(event: { open: boolean }) => open.set(event.open)}
        onAction={(event: { id: string }) => last.set(event.id)}
        onCancel={() => {
          open.set(false);
          last.set(tr("cancelled", "已取消"));
        }}
      />
    </View>
  );
}

function AlertInputDemo() {
  const open = signal(false);
  const last = signal("");
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("Text entry", "文本输入")} footer={tr("The field's text travels with the action: the app needs no draft of its own.", "输入框的文本随操作一起返回：应用不需要自己保存草稿。")}>
          <View style={{ padding: 16, gap: 12 }}>
            <Button title={tr("Rename folder", "重命名文件夹")} onPress={() => open.set(true)} />
            <Text style={{ fontSize: 13, color: faint() }}>
              {tr(`Result: ${last() || "nothing yet"}`, `结果：${last() || "还没有"}`)}
            </Text>
          </View>
        </Section>
      </List>
      <AlertDialog
        open={open()}
        title={tr("Folder name", "文件夹名称")}
        message={tr("Choose a name you will recognise.", "取一个你能认出的名称。")}
        input={tr("Name", "名称")}
        value="Archive"
        actions={[
          { id: "cancel", title: tr("Cancel", "取消") },
          { id: "save", title: tr("Save", "存储"), preferred: true },
        ]}
        onOpenChange={(event: { open: boolean }) => open.set(event.open)}
        onAction={(event: { id: string; text: string }) => last.set(`${event.id}: ${event.text}`)}
        onCancel={() => {
          open.set(false);
          last.set(tr("cancelled", "已取消"));
        }}
      />
    </View>
  );
}

// Context menu --------------------------------------------------------------

function ContextMenuDemo() {
  const open = signal(false);
  const last = signal("");
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("The menu", "菜单")} footer={tr("A held finger on touch screens, the secondary button here, Shift+F10 from the keyboard.", "触屏长按，桌面右键，键盘 Shift+F10。")}>
          <View style={{ padding: 16, gap: 12 }}>
            <Button title={tr("Open the menu", "打开菜单")} onPress={() => open.set(true)} />
            <Text style={{ fontSize: 13, color: faint() }}>
              {tr(`Chosen: ${last() || "nothing yet"}`, `已选择：${last() || "还没有"}`)}
            </Text>
          </View>
        </Section>
        <Section header={tr("The content", "内容")}>
          <ContextMenu
            open={open()}
            onOpenChange={(event: { open: boolean }) => open.set(event.open)}
            onAction={(event: { id: string }) => last.set(event.id)}
            preview={
              <View style={{ padding: 16 }}>
                <View style={{ ...card(), padding: 16, gap: 4 }}>
                  <Text style={{ fontSize: 17, fontWeight: 600, color: label() }}>{tr("Quarterly report", "季度报告")}</Text>
                  <Text style={{ fontSize: 13, color: muted() }}>{tr("Edited 2 hours ago", "2 小时前编辑")}</Text>
                </View>
              </View>
            }
            actions={[
              { id: "open", title: tr("Open", "打开"), icon: "arrow.up.right" },
              { id: "star", title: tr("Favourite", "收藏"), icon: "sparkles" },
              { id: "info", title: tr("Get info", "显示简介"), icon: "info.circle" },
              { id: "delete", title: tr("Delete", "删除"), icon: "xmark.circle.fill", destructive: true },
            ]}
            trigger={
              <View style={{ ...card(), margin: 16, padding: 16, gap: 4 }}>
                <Text style={{ fontSize: 17, fontWeight: 600, color: label() }}>{tr("Quarterly report", "季度报告")}</Text>
                <Text style={{ fontSize: 13, color: muted() }}>{tr("Long press, or right-click", "长按，或右键点击")}</Text>
              </View>
            }
          />
        </Section>
      </List>
    </View>
  );
}

// Picker and date picker ----------------------------------------------------

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function PickerDemo() {
  const month = signal("Mar");
  const day = signal("14");
  return (
    <View style={screen()}>
      <List scroll={false}>
        <Section header={tr("Two wheels", "两个滚轮")} footer={tr("Snap to an item, press one to centre it; the items above and below fade and shrink.", "吸附到一项，点按可将它居中；上下项目会淡出并缩小。")}>
          <View style={{ flexDirection: "row", paddingHorizontal: 8 }}>
            <View style={{ flex: 1 }}>
              <Picker
                items={MONTHS.map((name) => ({ value: name, title: name }))}
                value={month()}
                label={tr("Month", "月")}
                onChange={(event: { value: string }) => month.set(event.value)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Picker
                items={Array.from({ length: 31 }, (_, i) => String(i + 1)).map((value) => ({ value, title: value }))}
                value={day()}
                label={tr("Day", "日")}
                onChange={(event: { value: string }) => day.set(event.value)}
              />
            </View>
          </View>
        </Section>
        <Section footer={tr("The chosen date follows both wheels.", "所选日期跟随两个滚轮。")}>
          <ListTile title={tr("Chosen", "已选")} subtitle={`${month()} ${day()}`} accessory="none" separator={false} />
        </Section>
      </List>
    </View>
  );
}

function DatePickerDemo(props: { variant: string }) {
  const value = signal("2026-11-15");
  return (
    <View style={screen()}>
      <List scroll={false}>
        <Section
          header={props.variant === "compact" ? tr("Compact", "紧凑") : props.variant === "wheel" ? tr("Wheel", "滚轮") : tr("Inline", "内联")}
          footer={tr("The user's language and week start; month arrows swap the grid.", "跟随用户语言和周起始日；月份箭头切换网格。")}
        >
          <View style={{ padding: 12, alignItems: props.variant === "compact" ? "flex-start" : "center" }}>
            <DatePicker
              value={value()}
              variant={props.variant}
              label={tr("Date", "日期")}
              onChange={(event: { value: string }) => value.set(event.value)}
            />
          </View>
        </Section>
        <Section>
          <ListTile title={tr("Chosen", "已选")} subtitle={value()} accessory="none" separator={false} />
        </Section>
      </List>
    </View>
  );
}

// Segmented control and slider ---------------------------------------------

function SegmentedDemo() {
  const chosen = signal("day");
  return (
    <View style={screen()}>
      <List scroll={false}>
        <Section header={tr("Three segments", "三个分段")} footer={tr("A 32 pt track in a 50 pt target; the thumb slides on a spring.", "32 pt 轨道位于 50 pt 触控区内；滑块以弹簧动画滑动。")}>
          <View style={{ padding: 16 }}>
            <SegmentedControl
              items={[
                { value: "day", title: tr("Day", "日") },
                { value: "week", title: tr("Week", "周") },
                { value: "month", title: tr("Month", "月") },
              ]}
              value={chosen()}
              label={tr("Range", "范围")}
              onChange={(event: { value: string }) => chosen.set(event.value)}
            />
          </View>
        </Section>
        <Section header={tr("Two and five", "两个与五个")}>
          <View style={{ padding: 16, gap: 12 }}>
            <SegmentedControl
              items={[
                { value: "on", title: tr("On", "开") },
                { value: "off", title: tr("Off", "关") },
              ]}
              defaultValue="on"
              label={tr("Power", "电源")}
            />
            <SegmentedControl
              items={["a", "b", "c", "d", "e"].map((value) => ({ value, title: value.toUpperCase() }))}
              defaultValue="c"
              label={tr("Letters", "字母")}
            />
          </View>
        </Section>
        <Section>
          <ListTile title={tr("Chosen", "已选")} subtitle={chosen()} accessory="none" separator={false} />
        </Section>
      </List>
    </View>
  );
}

function SliderDemo() {
  const value = signal(0.4);
  const stepped = signal(30);
  return (
    <View style={screen()}>
      <List scroll={false}>
        <Section header={tr("Continuous", "连续")} footer={tr("A 4 pt rail in the tint and a 28 pt thumb; the keys move it a step.", "4 pt 着色轨道和 28 pt 滑块；按键按步长移动。")}>
          <View style={{ padding: 20, gap: 10 }}>
            <Slider value={value()} label={tr("Volume", "音量")} onChange={(event: { value: number }) => value.set(event.value)} />
            <Text style={{ fontSize: 13, color: muted() }}>{`${Math.round(value() * 100)}%`}</Text>
          </View>
        </Section>
        <Section header={tr("Stepped", "按步长")} footer={tr("Steps are drawn as ticks when there are few enough.", "步长较少时会绘制刻度。")}>
          <View style={{ padding: 20, gap: 10 }}>
            <Slider
              value={stepped()}
              min={0}
              max={60}
              step={5}
              label={tr("Minutes", "分钟")}
              onChange={(event: { value: number }) => stepped.set(event.value)}
            />
            <Text style={{ fontSize: 13, color: muted() }}>{`${stepped()} min`}</Text>
          </View>
        </Section>
        <Section header={tr("Disabled", "已禁用")}>
          <View style={{ padding: 20 }}>
            <Slider value={0.6} label={tr("Disabled", "已禁用")} disabled />
          </View>
        </Section>
      </List>
    </View>
  );
}

// Tab bar -------------------------------------------------------------------

const TAB_TITLES: Record<string, [string, string]> = {
  inbox: ["Inbox", "收件箱"],
  search: ["Search", "搜索"],
  saved: ["Saved", "收藏"],
  settings: ["Settings", "设置"],
};

function tabTitle(value: string): string {
  const pair = TAB_TITLES[value];
  return pair ? tr(pair[0], pair[1]) : value;
}

const TABS = [
  { value: "inbox", icon: "envelope" },
  { value: "search", icon: "magnifyingglass" },
  { value: "saved", icon: "sparkles", badge: "3" },
  { value: "settings", icon: "slider.horizontal.3" },
];

function TabBarDemo() {
  const chosen = signal("inbox");
  const title = () => {
    const tab = TABS.find((item) => item.value === chosen());
    return tab?.value ?? "inbox";
  };
  return (
    <View style={screen()}>
      <View style={{ flex: 1 }}>
        <List>
          <Section header={title()} footer={tr("The bar is a material: the page scrolls under its blur.", "标签栏是一种材质：页面的内容在其模糊下滚动。")}>
            <ListTile title={tr("Tab", "标签")} subtitle={title()} accessory="none" separator />
            <Each of={[1, 2, 3, 4, 5, 6]} key={(n) => n}>
              {(n) => <ListTile title={`Row ${n()}`} accessory="chevron" separator={n() !== 6} />}
            </Each>
          </Section>
        </List>
      </View>
      <TabBar
        items={TABS.map((tab) => ({
          value: tab.value,
          title: tabTitle(tab.value),
          icon: tab.icon,
          badge: tab.badge,
        }))}
        value={chosen()}
        label={tr("Tabs", "标签")}
        onChange={(event: { value: string }) => chosen.set(event.value)}
      />
    </View>
  );
}

// Swipe actions -------------------------------------------------------------

interface MailRow {
  id: string;
  sender: string;
  subject: string;
  read: boolean;
}

function SwipeDemo() {
  const rows = signal<MailRow[]>([
    { id: "a", sender: "Apple", subject: tr("Your receipt", "你的收据"), read: false },
    { id: "b", sender: "Studio", subject: tr("Draft review", "稿件审阅"), read: false },
    { id: "c", sender: "News", subject: tr("Weekly digest", "每周摘要"), read: true },
  ]);
  const last = signal("");
  const act = (id: string, full: boolean) => {
    last.set(`${id}${full ? " (full swipe)" : ""}`);
    if (id === "archive" || id === "delete") {
      rows.update((list) => list.filter((row) => row.id !== lastRowId));
    } else if (id === "read" || id === "unread") {
      rows.update((list) => list.map((row) => (row.id === lastRowId ? { ...row, read: id === "read" } : row)));
    }
  };
  let lastRowId = "";
  return (
    <View style={screen()}>
      <List>
        <Section header={tr("Mail", "邮件")} footer={tr("Swipe left for archive and delete, right to mark read; a full swipe archives.", "向左滑动显示归档与删除，向右标记已读；全滑归档。")}>
          <Each of={rows()} key={(row) => row.id}>
            {(row) => (
              <SwipeRow
                leading={[{ id: row().read ? "unread" : "read", title: row().read ? tr("Unread", "未读") : tr("Read", "已读"), icon: "envelope", tint: "system-blue" }]}
                trailing={[
                  { id: "archive", title: tr("Archive", "归档"), icon: "checkmark", tint: "system-orange" },
                  { id: "delete", title: tr("Delete", "删除"), icon: "xmark.circle.fill", destructive: true },
                ]}
                fullSwipe="archive"
                onAction={(event: { id: string; full: boolean }) => {
                  lastRowId = row().id;
                  act(event.id, event.full);
                }}
              >
                <ListTile
                  title={row().sender}
                  subtitle={row().subject}
                  leading={row().read ? "envelope" : "bell"}
                  leadingColor={row().read ? "system-gray" : "system-blue"}
                  accessory="none"
                  separator
                />
              </SwipeRow>
            )}
          </Each>
        </Section>
        <Section>
          <ListTile title={tr("Last action", "最近操作")} subtitle={last() || tr("none yet", "还没有")} accessory="none" separator={false} />
        </Section>
      </List>
    </View>
  );
}

// Pull to refresh -----------------------------------------------------------

function RefreshDemo() {
  const refreshing = signal(false);
  const count = signal(0);
  const refresh = () => {
    if (refreshing()) return;
    refreshing.set(true);
    setTimeout(() => {
      refreshing.set(false);
      count.update((n) => n + 1);
    }, 1200);
  };
  return (
    <View style={screen()}>
      <RefreshView refreshing={refreshing()} onRefresh={refresh}>
        <List scroll={false}>
          <Section header={tr("Inbox", "收件箱")} footer={tr("With a mouse, use Refresh now: a wheel cannot overscroll. On a touch screen, pull down.", "使用鼠标时请点“立即刷新”：滚轮无法越界。触屏上请下拉。")}>
            <View style={{ padding: 16 }}>
              <Button title={tr("Refresh now", "立即刷新")} variant="tinted" onPress={refresh} />
            </View>
            <ListTile title={tr("Refresh", "刷新")} subtitle={count() === 0 ? tr("Not yet", "还没有") : tr(`Refreshed ${count()} times`, `已刷新 ${count()} 次`)} accessory="none" separator={false} />
          </Section>
          <Rows title={tr("Messages", "邮件")} rows={["Apple", "Studio", "News", "Team", "Bank"]} />
        </List>
      </RefreshView>
    </View>
  );
}

// Pages ---------------------------------------------------------------------

function SheetPage() {
  return (
    <DemoPage
      title={tr("Sheet", "面板")}
      blurb={tr(
        "A panel from the bottom with iOS's two detents: medium at half the screen and large just below the status bar. Drag the grabber, or drag past medium to close.",
        "从底部升起、带 iOS 两个停靠点的面板：中号占半屏，大号在状态栏下方。拖动把手，或越过中号关闭。",
      )}
      hint={tr("The sheet is a top layer: it covers the whole page, as on a device.", "面板是顶层：和设备上一样，它会覆盖整个页面。")}
      variants={[
        {
          id: "detents",
          title: tr("Detents", "停靠点"),
          code: `import { signal } from "nsh";
import { Sheet, List, Section, ListTile } from "cupertino";

const open = signal(false);
const detent = signal("medium");

<Sheet open={open()} detent={detent()} title="Filters" trailing="Done"
       onOpenChange={(event) => open.set(event.open)}
       onDetentChange={(event) => detent.set(event.detent)}
       onTrailing={() => open.set(false)}>
  <List><Section header="Show"><ListTile title="Unread only" /></Section></List>
</Sheet>`,
          view: () => <SheetDemo />,
        },
      ]}
      api={api("sheet")}
      apiTitle="single"
    />
  );
}

function ActionSheetPage() {
  return (
    <DemoPage
      title={tr("Action sheet", "操作表")}
      blurb={tr(
        "A choice between a few actions in 10 pt groups over the safe area, with Cancel apart from them and destructive actions in red.",
        "在安全区上方以 10 pt 分组提供若干操作，取消单独一组，破坏性操作为红色。",
      )}
      hint={tr("Opens over the whole page.", "会在整个页面上打开。")}
      variants={[
        {
          id: "actions",
          title: tr("Actions", "操作"),
          code: `import { ActionSheet } from "cupertino";

<ActionSheet open={open()} title="Photo" message="What do you want to do with it?"
             actions={[
               { id: "copy", title: "Copy" },
               { id: "delete", title: "Delete", destructive: true },
               { id: "share", title: "Share", disabled: true },
             ]}
             cancel="Cancel"
             onOpenChange={(event) => open.set(event.open)}
             onAction={(event) => choose(event.id)} />`,
          view: () => <ActionSheetDemo />,
        },
      ]}
      api={api("action-sheet")}
      apiTitle="single"
    />
  );
}

function AlertPage() {
  return (
    <DemoPage
      title={tr("Alert dialog", "警告对话框")}
      blurb={tr(
        "iOS's alert: a 270 pt card on a dimmed page, with a title, a message, an optional text field and a row of buttons.",
        "iOS 的警告框：在变暗页面上的一张 270 pt 卡片，带标题、信息、可选输入框和一行按钮。",
      )}
      hint={tr("Opens over the whole page.", "会在整个页面上打开。")}
      variants={[
        {
          id: "confirm",
          title: tr("Confirm", "确认"),
          code: `import { AlertDialog } from "cupertino";

<AlertDialog open={open()} title="Delete this message?"
             message="It moves to Trash and stays there for 30 days."
             actions={[
               { id: "cancel", title: "Cancel" },
               { id: "delete", title: "Delete", destructive: true, preferred: true },
             ]}
             onOpenChange={(event) => open.set(event.open)}
             onAction={(event) => act(event.id)} />`,
          view: () => <AlertDemo />,
        },
        {
          id: "input",
          title: tr("Text entry", "文本输入"),
          code: `import { AlertDialog } from "cupertino";

<AlertDialog open={open()} title="Folder name" input="Name" value="Archive"
             actions={[
               { id: "cancel", title: "Cancel" },
               { id: "save", title: "Save", preferred: true },
             ]}
             onOpenChange={(event) => open.set(event.open)}
             onAction={(event) => save(event.id, event.text)} />`,
          view: () => <AlertInputDemo />,
        },
      ]}
      api={api("alert-dialog")}
      apiTitle="single"
    />
  );
}

function ContextMenuPage() {
  return (
    <DemoPage
      title={tr("Context menu", "上下文菜单")}
      blurb={tr(
        "A menu about the content it wraps: a held finger on touch screens, the secondary button on desktops, Shift+F10 from the keyboard. The preview is a separate card.",
        "关于其所包裹内容的菜单：触屏长按、桌面右键、键盘 Shift+F10。预览是一张单独的卡片。",
      )}
      variants={[
        {
          id: "menu",
          title: tr("Menu", "菜单"),
          code: `import { ContextMenu } from "cupertino";

<ContextMenu
  open={open()}
  onOpenChange={(event) => open.set(event.open)}
  onAction={(event) => act(event.id)}
  preview={() => <Card />}
  trigger={() => <Card />}
  actions={[
    { id: "open", title: "Open", icon: "arrow.up.right" },
    { id: "delete", title: "Delete", icon: "xmark.circle.fill", destructive: true },
  ]}
/>`,
          view: () => <ContextMenuDemo />,
        },
      ]}
      api={api("context-menu")}
      apiTitle="single"
    />
  );
}

function PickerPage() {
  return (
    <DemoPage
      title={tr("Picker", "选择器")}
      blurb={tr(
        "iOS's wheel: a vertical list that snaps to an item, the items above and below fading and shrinking, a selection band behind the centre row.",
        "iOS 的滚轮：垂直列表吸附到某一项，上下项目淡出并缩小，选中行背后有选中带。",
      )}
      variants={[
        {
          id: "wheels",
          title: tr("Wheels", "滚轮"),
          code: `import { Picker } from "cupertino";

<Picker items={months} value={month()} label="Month"
        onChange={(event) => setMonth(event.value)} />
<Picker items={days} value={day()} label="Day"
        onChange={(event) => setDay(event.value)} />`,
          view: () => <PickerDemo />,
        },
      ]}
      api={api("picker")}
      apiTitle="single"
    />
  );
}

function DatePickerPage() {
  return (
    <DemoPage
      title={tr("Date picker", "日期选择器")}
      blurb={tr(
        "A calendar of the month around the chosen day, in the user's language and week start, plus a compact button and a wheel.",
        "围绕所选日期的月历，跟随用户语言与周起始日，另有紧凑按钮和滚轮样式。",
      )}
      variants={[
        {
          id: "inline",
          title: tr("Inline", "内联"),
          code: `import { DatePicker } from "cupertino";

<DatePicker value={date()} label="Date"
            onChange={(event) => setDate(event.value)} />`,
          view: () => <DatePickerDemo variant="inline" />,
        },
        {
          id: "compact",
          title: tr("Compact", "紧凑"),
          code: `import { DatePicker } from "cupertino";

<DatePicker variant="compact" value={date()} label="Date"
            onChange={(event) => setDate(event.value)} />`,
          view: () => <DatePickerDemo variant="compact" />,
        },
        {
          id: "wheel",
          title: tr("Wheel", "滚轮"),
          code: `import { DatePicker } from "cupertino";

<DatePicker variant="wheel" value={date()} label="Date"
            onChange={(event) => setDate(event.value)} />`,
          view: () => <DatePickerDemo variant="wheel" />,
        },
      ]}
      api={api("date-picker")}
      apiTitle="single"
    />
  );
}

function SegmentedPage() {
  return (
    <DemoPage
      title={tr("Segmented control", "分段控件")}
      blurb={tr(
        "A track of two to five segments with a white thumb that slides to the chosen one over the design system's spring.",
        "两到五个分段组成的轨道，白色滑块以设计系统的弹簧动画滑向选中项。",
      )}
      variants={[
        {
          id: "segments",
          title: tr("Segments", "分段"),
          code: `import { signal } from "nsh";
import { SegmentedControl } from "cupertino";

const chosen = signal("day");

<SegmentedControl
  items={[
    { value: "day", title: "Day" },
    { value: "week", title: "Week" },
    { value: "month", title: "Month" },
  ]}
  value={chosen()}
  label="Range"
  onChange={(event) => chosen.set(event.value)}
/>`,
          view: () => <SegmentedDemo />,
        },
      ]}
      api={api("segmented-control")}
      apiTitle="single"
    />
  );
}

function SliderPage() {
  return (
    <DemoPage
      title={tr("Slider", "滑块")}
      blurb={tr(
        "A 4 pt rail in the tint, a white 28 pt thumb with a soft shadow, and a tick for each step while there are few enough.",
        "4 pt 着色轨道、带柔和阴影的 28 pt 白色滑块，步长较少时每一步绘制一个刻度。",
      )}
      variants={[
        {
          id: "values",
          title: tr("Values", "取值"),
          code: `import { Slider } from "cupertino";

<Slider value={volume()} label="Volume"
        onChange={(event) => setVolume(event.value)} />
<Slider value={minutes()} min={0} max={60} step={5} label="Minutes"
        onChange={(event) => setMinutes(event.value)} />`,
          view: () => <SliderDemo />,
        },
      ]}
      api={api("slider")}
      apiTitle="single"
    />
  );
}

function TabBarPage() {
  return (
    <DemoPage
      title={tr("Tab bar", "标签栏")}
      blurb={tr(
        "A 49 pt material bar at the bottom: a 25 pt icon, a 10 pt label, a badge over the chosen tab and the page scrolling under its blur.",
        "底部的 49 pt 材质栏：25 pt 图标、10 pt 标签、选中标签上的角标，页面内容在模糊下滚动。",
      )}
      variants={[
        {
          id: "tabs",
          title: tr("Tabs", "标签"),
          code: `import { signal } from "nsh";
import { TabBar } from "cupertino";

const chosen = signal("inbox");

<TabBar
  items={[
    { value: "inbox", title: "Inbox", icon: "envelope" },
    { value: "saved", title: "Saved", icon: "sparkles", badge: "3" },
    { value: "settings", title: "Settings", icon: "slider.horizontal.3" },
  ]}
  value={chosen()}
  label="Tabs"
  onChange={(event) => chosen.set(event.value)}
/>`,
          view: () => <TabBarDemo />,
        },
      ]}
      api={api("tab-bar")}
      apiTitle="single"
    />
  );
}

function SwipePage() {
  return (
    <DemoPage
      title={tr("Swipe actions", "滑动操作")}
      blurb={tr(
        "Actions behind a list row: swipe right for leading actions, left for trailing ones, and a full swipe fires the row's main action.",
        "列表行背后的操作：右滑显示前置操作，左滑显示尾部操作，全滑会触发该行的主要操作。",
      )}
      hint={tr("Drag a row sideways with the mouse or a finger.", "用鼠标或手指横向拖动一行。")}
      variants={[
        {
          id: "mail",
          title: tr("Mail", "邮件"),
          code: `import { SwipeRow } from "cupertino";

<SwipeRow
  leading={[{ id: "read", title: "Read", icon: "envelope", tint: "system-blue" }]}
  trailing={[
    { id: "archive", title: "Archive", icon: "checkmark", tint: "system-orange" },
    { id: "delete", title: "Delete", icon: "xmark.circle.fill", destructive: true },
  ]}
  fullSwipe="archive"
  onAction={(event) => act(event.id, event.full)}
>
  <ListTile title="Studio" subtitle="Draft review" />
</SwipeRow>`,
          view: () => <SwipeDemo />,
        },
      ]}
      api={api("swipe-actions")}
      apiTitle="single"
    />
  );
}

function RefreshPage() {
  return (
    <DemoPage
      title={tr("Pull to refresh", "下拉刷新")}
      blurb={tr(
        "A scrolling page whose pull past the top drops an activity indicator with the drag; releasing past 100 pt asks for a refresh.",
        "一个滚动页面：下拉时指示器随拖动出现，超过 100 pt 释放即请求刷新。",
      )}
      variants={[
        {
          id: "inbox",
          title: tr("Inbox", "收件箱"),
          code: `import { signal } from "nsh";
import { RefreshView, List } from "cupertino";

const refreshing = signal(false);

<RefreshView refreshing={refreshing()} onRefresh={refresh}>
  <List>{rows}</List>
</RefreshView>`,
          view: () => <RefreshDemo />,
        },
      ]}
      api={api("refresh")}
      apiTitle="single"
    />
  );
}

export const overlays = [
  { id: "sheet", Page: SheetPage },
  { id: "action-sheet", Page: ActionSheetPage },
  { id: "alert-dialog", Page: AlertPage },
  { id: "context-menu", Page: ContextMenuPage },
  { id: "picker", Page: PickerPage },
  { id: "date-picker", Page: DatePickerPage },
  { id: "segmented-control", Page: SegmentedPage },
  { id: "slider", Page: SliderPage },
  { id: "tab-bar", Page: TabBarPage },
  { id: "swipe-row", Page: SwipePage },
  { id: "refresh", Page: RefreshPage },
];
