// The Cupertino demo: one page per component, a gallery index, and both
// toggles (appearance, contrast). The components come from the crate this
// repository is (`cupertino`), the gallery's rows from the app's own Rust
// half (`cupertino-demo/native`), and the theme from `theme/theme.json`.
//
// Landing on a page (for screenshots): seed Storage with `cupertino.page`,
// `cupertino.contrast` and `cupertino.appearance` — `open(entry, { storage })`
// in a test, or the app's own storage elsewhere.
import {
  Keyboard,
  type JSX,
  mount,
  setColorScheme,
  signal,
  Storage,
  Text,
  View,
  windowSize,
} from "nsh";
import {
  ActionSheet,
  ActivityIndicator,
  AlertDialog,
  Button,
  ContextMenu,
  DatePicker,
  List,
  ListTile,
  NavPage,
  Picker,
  RefreshView,
  ScrollView,
  SearchField,
  Section,
  SegmentedControl,
  Sheet,
  Slider,
  SwipeRow,
  Switch,
  TabBar,
  TextField,
  Theme,
} from "cupertino";
import { Count, DemoTile } from "cupertino-demo/native";

const PAGES: { id: string; title: string; blurb: string; icon: string; tint: string }[] = [
  { id: "navigation", title: "Navigation bar", blurb: "Large title, back, trailing action", icon: "arrow.up.right", tint: "system-blue" },
  { id: "lists", title: "Lists", blurb: "Sections, rows, accessories", icon: "list.bullet", tint: "system-orange" },
  { id: "buttons", title: "Buttons", blurb: "Filled, tinted, plain, destructive", icon: "sparkles", tint: "system-purple" },
  { id: "textfields", title: "Text fields", blurb: "Cupertino box, clear, secure", icon: "square.grid.2x2", tint: "system-teal" },
  { id: "search", title: "Search field", blurb: "Magnifier, clear, cancel", icon: "magnifyingglass", tint: "system-indigo" },
  { id: "switches", title: "Switch", blurb: "51 × 31, green when on", icon: "slider.horizontal.3", tint: "system-green" },
  { id: "indicators", title: "Activity indicator", blurb: "Eight blades, turning natively", icon: "circle.lefthalf.filled", tint: "system-gray" },
  { id: "scroll", title: "Scroll view", blurb: "Bounce, indicators, horizontal", icon: "square.grid.2x2", tint: "system-pink" },
  { id: "materials", title: "Materials", blurb: "Glass on the floating layer", icon: "moon", tint: "system-teal" },
  { id: "colors", title: "Color", blurb: "Semantic roles, light and dark", icon: "sun.max", tint: "system-yellow" },
  { id: "type", title: "Typography", blurb: "The eleven steps of the scale", icon: "info.circle", tint: "system-red" },
  { id: "sheet", title: "Sheets", blurb: "Detents, drag, grabber", icon: "square.grid.2x2", tint: "system-teal" },
  { id: "actionsheet", title: "Action sheet", blurb: "Destructive, cancel, 10 pt", icon: "list.bullet", tint: "system-orange" },
  { id: "alert", title: "Alert dialog", blurb: "Messages and text entry", icon: "info.circle", tint: "system-red" },
  { id: "contextmenu", title: "Context menu", blurb: "Long press, lifted preview", icon: "square.grid.2x2", tint: "system-purple" },
  { id: "picker", title: "Picker", blurb: "Wheel, snapping, haptics", icon: "slider.horizontal.3", tint: "system-indigo" },
  { id: "datepicker", title: "Date picker", blurb: "Calendar, compact, wheel", icon: "sun.max", tint: "system-blue" },
  { id: "segmented", title: "Segmented control", blurb: "Sliding thumb, 2–5 items", icon: "circle.lefthalf.filled", tint: "system-blue" },
  { id: "slider", title: "Slider", blurb: "28 pt thumb, tint, ticks", icon: "slider.horizontal.3", tint: "system-green" },
  { id: "tabbar", title: "Tab bar", blurb: "49 pt, badges, tint", icon: "square.grid.2x2", tint: "system-blue" },
  { id: "swipe", title: "Swipe actions", blurb: "Leading, trailing, undo", icon: "envelope", tint: "system-red" },
  { id: "refresh", title: "Pull to refresh", blurb: "Drag, spinner, release", icon: "arrow.up.right", tint: "system-teal" },
  { id: "bar-materials", title: "Bar materials", blurb: "Blurred bar and tab bar", icon: "sparkles", tint: "system-gray" },
];

const page = signal("gallery");
const history = signal<string[]>([]);
const contrast = signal("normal");
const appearance = signal("system");
const overlaySeed = signal("");
const presses = new Count();
const pressCount = signal(0);

const PAGE_IDS = ["gallery", ...PAGES.map((entry) => entry.id)];

function titleOf(id: string): string {
  return PAGES.find((entry) => entry.id === id)?.title ?? "Cupertino";
}

function open(id: string) {
  pressCount.set(presses.add());
  history.update((stack) => [...stack, page()]);
  page.set(id);
}

function back() {
  const stack = history();
  if (stack.length === 0) return;
  page.set(stack[stack.length - 1]);
  history.set(stack.slice(0, -1));
}

function home() {
  page.set("gallery");
  history.set([]);
}

function cycleAppearance() {
  const next = appearance() === "system" ? "light" : appearance() === "light" ? "dark" : "system";
  appearance.set(next);
  setColorScheme(next as "system" | "light" | "dark");
}

function appearanceLabel(): string {
  const now = appearance();
  return now === "system" ? "System" : now === "light" ? "Light" : "Dark";
}

/** The bar every page but the gallery shows. */
function Page(props: {
  id: string;
  trailing?: string;
  onTrailing?: () => void;
  material?: string;
  children: JSX.Element;
}) {
  const hasHistory = () => history().length > 0;
  return (
    <NavPage
      title={titleOf(props.id)}
      largeTitle={titleOf(props.id)}
      back={hasHistory() ? "Cupertino" : undefined}
      onBack={back}
      trailing={props.trailing}
      onTrailing={props.onTrailing ?? home}
      material={props.material}
    >
      {props.children}
    </NavPage>
  );
}

function Gallery() {
  return (
    <NavPage title="Cupertino" largeTitle="Cupertino">
      <List scroll={false}>
        <Section
          header="Components"
          footer={`${pressCount()} ${pressCount() === 1 ? "press" : "presses"} counted in Rust`}
        >
          <Each of={PAGES} key={(entry) => entry.id}>
            {(entry) => (
              <DemoTile
                page={entry().id}
                title={entry().title}
                blurb={entry().blurb}
                icon={entry().icon}
                tint={entry().tint}
                last={entry().id === PAGES[PAGES.length - 1].id}
                onOpen={(event: { value: string }) => open(event.value)}
              />
            )}
          </Each>
        </Section>
        <Section header="Appearance" footer="Tokens, the platform's controls and Tailwind's dark: variant follow the appearance.">
          <ListTile title="Appearance" subtitle={appearanceLabel()} accessory="none" separator onPress={cycleAppearance} />
          <ListTile
            title="Contrast"
            subtitle={contrast() === "high" ? "Increased (high contrast)" : "Standard"}
            accessory="none"
            separator={false}
            onPress={() => contrast.set(contrast() === "high" ? "normal" : "high")}
          />
        </Section>
        <Section header="About" footer="nsh-cupertino 0.2.0 · Native Shell">
          <ListTile title="Components" subtitle="23 registered: 23 pages, plus Theme" accessory="none" separator={false} />
        </Section>
      </List>
    </NavPage>
  );
}

function NavigationPage() {
  return (
    <Page id="navigation" trailing="Done" onTrailing={home}>
      <List scroll={false}>
        <Section header="Large title" footer="The large title scrolls under the bar; the compact title and the hairline fade in over its last 10 pt.">
          <ListTile title="Scroll down" subtitle="The title in the bar takes over" accessory="none" separator />
          <ListTile title="Press the title" subtitle="It scrolls the page to the top" accessory="none" separator />
          <ListTile title="Press the back button" subtitle="Or swipe from the left edge" accessory="none" separator={false} />
        </Section>
        <Section header="Trailing action">
          <ListTile title="Done" subtitle="Tinted, 44 pt target" accessory="none" separator />
          <ListTile title="Returns to the gallery" accessory="none" separator={false} />
        </Section>
        <Section header="Filler" footer="Rows so the page scrolls.">
          <Each of={[1, 2, 3, 4, 5, 6, 7, 8]} key={(n) => n}>
            {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 8} />}
          </Each>
        </Section>
      </List>
    </Page>
  );
}

function ListsPage() {
  const chosen = signal("b");
  return (
    <Page id="lists">
      <List scroll={false}>
        <Section header="Rows" footer="A row is 44 pt tall, 48 with a subtitle; the title is 17 pt, the subtitle 12 pt, and the hairline starts where the text does.">
          <ListTile title="Plain row" accessory="chevron" separator />
          <ListTile title="Row with a subtitle" subtitle="Secondary label, 13 pt" accessory="chevron" separator />
          <ListTile title="Destructive" destructive accessory="none" separator />
          <ListTile title="Disabled" disabled accessory="none" separator />
          <ListTile title="No accessory" accessory="none" separator={false} />
        </Section>
        <Section header="Leading icons" footer="A 28 pt box, drawn in a system color.">
          <ListTile title="AirDrop" leading="person" leadingColor="system-blue" accessory="chevron" separator />
          <ListTile title="Notifications" leading="bell" leadingColor="system-red" accessory="chevron" separator />
          <ListTile title="Messages" leading="envelope" leadingColor="system-green" accessory="chevron" separator={false} />
        </Section>
        <Section header="Selection" footer="A checkmark on the chosen row, and its state for screen readers.">
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
    </Page>
  );
}

function ButtonsPage() {
  const taps = signal(0);
  return (
    <Page id="buttons">
      <List scroll={false}>
        <Section header="Filled" footer="Blue, white text, 12 pt corners, 44 pt tall.">
          <View style={{ padding: 16, gap: 12, alignItems: "center" }}>
            <Button title="Continue" onPress={() => taps.update((n) => n + 1)} />
            <Button title="With an icon" icon="arrow.up.right" onPress={() => taps.update((n) => n + 1)} />
            <Button title="Disabled" disabled />
          </View>
        </Section>
        <Section header="Tinted" footer="The tint at 18 % light, 26 % dark.">
          <View style={{ padding: 16, gap: 12, alignItems: "center" }}>
            <Button title="Share" variant="tinted" onPress={() => taps.update((n) => n + 1)} />
            <Button title="Edit" variant="tinted" size="medium" onPress={() => taps.update((n) => n + 1)} />
          </View>
        </Section>
        <Section header="Plain and destructive">
          <View style={{ padding: 16, gap: 12, alignItems: "center" }}>
            <Button title="Show details" variant="plain" onPress={() => taps.update((n) => n + 1)} />
            <Button title="Delete" variant="destructive" onPress={() => taps.update((n) => n + 1)} />
            <Button title="Small" variant="plain" size="small" onPress={() => taps.update((n) => n + 1)} />
          </View>
        </Section>
        <Section footer={`${taps()} ${taps() === 1 ? "press" : "presses"}: a press fades to 40 % over 150 ms.`}>
          <ListTile title="Icon only" leading="sparkles" leadingColor="system-purple" accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function TextFieldsPage() {
  const name = signal("Ada Lovelace");
  const password = signal("correct horse");
  const empty = signal("");
  return (
    <Page id="textfields" trailing="Done" onTrailing={() => Keyboard.dismiss()}>
      <List scroll={false}>
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <Text class="text-label" style={{ fontSize: 20, fontWeight: 700 }}>
            Rounded
          </Text>
          <TextField
            value={empty()}
            placeholder="With a leading icon"
            label="With a leading icon"
            leading="person"
            onChange={(event: { value: string }) => empty.set(event.value)}
          />
          <TextField
            value={password()}
            placeholder="Password"
            label="Password"
            secure
            onChange={(event: { value: string }) => password.set(event.value)}
          />
          <TextField value="Not editable" label="Disabled" placeholder="Disabled" disabled />
          <Text class="text-secondary-label" style={{ fontSize: 13 }}>
            CupertinoTextField: white on light, black on dark, 5 pt corners, a 20 % border, 7 pt of padding.
          </Text>
        </View>
        <Section header="Grouped" footer="A form row's surface: the grouped background, 10 pt corners, no border.">
          <View style={{ padding: 16, gap: 12 }}>
            <TextField
              value={name()}
              placeholder="Name"
              label="Name"
              variant="grouped"
              onChange={(event: { value: string }) => name.set(event.value)}
            />
          </View>
        </Section>
        <Section header="What is typed" footer="The value belongs to the app: the field reports it and shows yours.">
          <ListTile title="Name" subtitle={name()} accessory="none" separator />
          <ListTile title="Password" subtitle={"•".repeat(password().length)} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function SearchPage() {
  const query = signal("");
  const fruits = ["Apple", "Apricot", "Banana", "Blueberry", "Cherry", "Grape", "Lemon", "Mango", "Peach", "Pear"];
  return (
    <Page id="search">
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <SearchField
          value={query()}
          placeholder="Search fruit"
          label="Search fruit"
          cancel
          onChange={(event: { value: string }) => query.set(event.value)}
          onCancel={() => query.set("")}
        />
      </View>
      <List scroll={false}>
        <Section
          header="Results"
          footer={query() === "" ? "Type to filter: the field owns nothing, the page does." : `${fruits.filter((fruit) => fruit.toLowerCase().includes(query().toLowerCase())).length} of ${fruits.length}`}
        >
          <Each of={fruits} key={(fruit) => fruit}>
            {(fruit) => (
              <View
                style={{ display: query() === "" || fruit().toLowerCase().includes(query().toLowerCase()) ? "flex" : "none" }}
              >
                <ListTile title={fruit()} accessory="chevron" separator={fruit() !== "Pear"} />
              </View>
            )}
          </Each>
        </Section>
      </List>
    </Page>
  );
}

function SwitchesPage() {
  const wifi = signal(true);
  const bluetooth = signal(false);
  return (
    <Page id="switches">
      <List scroll={false}>
        <Section
          header="Settings"
          footer="A switch belongs in a list row, where the row's text says what it controls: a 51 × 31 pt track, a 27 pt thumb, 200 ms of travel."
        >
          <ListTile title="Wi-Fi" accessory="none" separator>
            <Switch checked={wifi()} label="Wi-Fi" onChange={(event: { value: boolean }) => wifi.set(event.value)} />
          </ListTile>
          <ListTile title="Bluetooth" accessory="none" separator>
            <Switch checked={bluetooth()} label="Bluetooth" onChange={(event: { value: boolean }) => bluetooth.set(event.value)} />
          </ListTile>
          <ListTile title="AirDrop" subtitle="Contacts Only" accessory="none" separator={false}>
            <Switch checked={false} disabled label="AirDrop" />
          </ListTile>
        </Section>
        <Section header="Elsewhere" footer="Outside a list, iOS uses a button that behaves like a toggle rather than a switch.">
          <ListTile title="Keep loading" subtitle={wifi() ? "On" : "Off"} accessory="none">
            <Switch checked={wifi()} label="Keep loading" onChange={(event: { value: boolean }) => wifi.set(event.value)} />
          </ListTile>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 14 }}>
            <ActivityIndicator size={20} label="Checking for mail" />
            <Text class="text-secondary-label" style={{ fontSize: 13 }}>
              {`Wi-Fi is ${wifi() ? "on" : "off"}`}
            </Text>
          </View>
        </Section>
      </List>
    </Page>
  );
}

function IndicatorsPage() {
  const running = signal(true);
  return (
    <Page id="indicators">
      <List scroll={false}>
        <Section header="Sizes" footer="Drawn natively: eight blades at fixed opacities, the set turning 45° eight times a second, one turn per second.">
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", padding: 24 }}>
            <ActivityIndicator size={16} label="Checking mail" />
            <ActivityIndicator size={20} label="Checking mail" />
            <ActivityIndicator size={28} label="Checking mail" />
            <ActivityIndicator size={40} color="system-blue" label="Checking mail" />
          </View>
        </Section>
        <Section header="Animating" footer="Reduce Motion shows a still frame instead of turning.">
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 16 }}>
            <ActivityIndicator size={20} animating={running()} label="Fetching mail" />
            <Text style={{ fontSize: 17, flex: 1 }}>{running() ? "Loading mail…" : "Paused"}</Text>
            <Switch checked={running()} label="Keep loading" onChange={(event: { value: boolean }) => running.set(event.value)} />
          </View>
        </Section>
        <Section footer="Inside a row the indicator stays quiet: the activity tick color, its blades at 18–58 % opacity.">
          <ListTile title="Checking for mail" subtitle="Activity indicator at 20 pt" accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function ScrollPage() {
  const cards = [
    { title: "Cupertino", tint: "bg-system-blue" },
    { title: "Grouped", tint: "bg-system-indigo" },
    { title: "Hairline", tint: "bg-system-teal" },
    { title: "Springs", tint: "bg-system-purple" },
    { title: "Contrast", tint: "bg-system-orange" },
  ];
  return (
    <Page id="scroll">
      <List scroll={false}>
        <Section header="Horizontal" footer="A horizontal ScrollView: swipes sideways, bounces at both ends.">
          <View style={{ paddingVertical: 16 }}>
            <ScrollView horizontal bounces style={{ height: 120 }}>
              <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
                <Each of={cards} key={(card) => card.title}>
                  {(card) => (
                    <View
                      class={card().tint}
                      style={{ width: 132, height: 88, borderRadius: 12, justifyContent: "flex-end", padding: 12 }}
                    >
                      <Text style={{ fontSize: 15, fontWeight: 600, color: "#ffffff" }}>{card().title}</Text>
                    </View>
                  )}
                </Each>
              </View>
            </ScrollView>
          </View>
        </Section>
        <Section header="Vertical" footer="Rows in a vertical ScrollView: the platform's indicator shows while scrolling.">
          <Each of={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]} key={(n) => n}>
            {(n) => <ListTile title={`Row ${n()}`} subtitle="Inside a ScrollView" accessory="none" separator={n() !== 12} />}
          </Each>
        </Section>
      </List>
    </Page>
  );
}

const MATERIALS = [
  { name: "ultra-thin", title: "Ultra thin", blurb: "Media behind it" },
  { name: "thin", title: "Thin", blurb: "More of the content shows" },
  { name: "regular", title: "Regular", blurb: "Bars over scrolling content" },
  { name: "thick", title: "Thick", blurb: "Text-heavy surfaces" },
  { name: "chrome", title: "Chrome", blurb: "The browser-like bar" },
];

function MaterialsPage() {
  return (
    <NavPage
      title="Materials"
      largeTitle="Materials"
      back={history().length > 0 ? "Cupertino" : undefined}
      onBack={back}
      material="regular"
    >
      <List scroll={false}>
        <Section header="Materials over content" footer="Each card is a translucent fill from tokens::materials over a 20–30 pt backdrop blur; the high-contrast set makes the fill more opaque.">
          <View
            style={{
              height: 420,
              paddingHorizontal: 16,
              paddingVertical: 16,
              gap: 10,
              backgroundColor: "#2563eb",
              backgroundImage: "linear-gradient(150deg, #2563eb 0%, #7c3aed 45%, #db2777 75%, #f59e0b 100%)",
            }}
          >
            <Each of={MATERIALS} key={(material) => material.name}>
              {(material) => (
                <View
                  class={`bg-material-${material().name} backdrop-blur-xl`}
                  style={{ flex: 1, borderRadius: 12, justifyContent: "center", paddingHorizontal: 14 }}
                >
                  <Text class="text-label" style={{ fontSize: 17, fontWeight: 600 }}>
                    {material().title}
                  </Text>
                  <Text class="text-secondary-label" style={{ fontSize: 12 }}>
                    {`bg-material-${material().name} · backdrop-blur-xl`}
                  </Text>
                </View>
              )}
            </Each>
          </View>
        </Section>
        <Section header="Notes" footer="A material is one fill in light, dark and their high-contrast variants, plus a blur radius.">
          <ListTile title="regular" subtitle="Bars over scrolling content · 25 pt" accessory="none" separator />
          <ListTile title="thin" subtitle="More of the content shows · 25 pt" accessory="none" separator />
          <ListTile title="ultra-thin" subtitle="For media behind the glass · 20 pt" accessory="none" separator={false} />
        </Section>
      </List>
    </NavPage>
  );
}

function Swatch(props: { token: string; name: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 8 }}>
      <View
        class={`bg-${props.token} border-separator`}
        style={{ width: 28, height: 28, borderRadius: 8, borderWidth: 0.5 }}
      />
      <Text class="text-label truncate" style={{ fontSize: 15, flex: 1 }}>
        {props.name}
      </Text>
      <Text class="text-tertiary-label truncate" style={{ fontSize: 12, maxWidth: 150 }}>
        {props.token}
      </Text>
    </View>
  );
}

function ColorsPage() {
  return (
    <Page id="colors">
      <List scroll={false}>
        <Section header="System colors" footer="Each role carries light, dark and high-contrast values.">
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Each
              of={[
                "system-blue",
                "system-green",
                "system-red",
                "system-orange",
                "system-yellow",
                "system-purple",
                "system-pink",
                "system-teal",
                "system-indigo",
              ]}
              key={(token) => token}
            >
              {(token) => <Swatch token={token()} name={token()} />}
            </Each>
          </View>
        </Section>
        <Section header="Backgrounds">
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Each of={["system-background", "secondary-system-background", "system-grouped-background", "secondary-system-grouped-background"]} key={(token) => token}>
              {(token) => <Swatch token={token()} name={token()} />}
            </Each>
          </View>
        </Section>
        <Section header="Text and separators">
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <Each of={["label", "secondary-label", "tertiary-label", "quaternary-label", "separator", "opaque-separator", "fill"]} key={(token) => token}>
              {(token) => <Swatch token={token()} name={token()} />}
            </Each>
          </View>
        </Section>
      </List>
    </Page>
  );
}

const STEPS: { name: string; size: number; line: number; weight: 400 | 600 | 700 }[] = [
  { name: "Large title", size: 34, line: 41, weight: 700 },
  { name: "Title 1", size: 28, line: 34, weight: 400 },
  { name: "Title 2", size: 22, line: 28, weight: 400 },
  { name: "Title 3", size: 20, line: 25, weight: 400 },
  { name: "Headline", size: 17, line: 22, weight: 600 },
  { name: "Body", size: 17, line: 22, weight: 400 },
  { name: "Callout", size: 16, line: 21, weight: 400 },
  { name: "Subheadline", size: 15, line: 20, weight: 400 },
  { name: "Footnote", size: 13, line: 18, weight: 400 },
  { name: "Caption 1", size: 12, line: 16, weight: 400 },
  { name: "Caption 2", size: 11, line: 13, weight: 400 },
];

function TypePage() {
  return (
    <Page id="type">
      <List scroll={false}>
        <Section header="The scale" footer="Sizes and line heights in points; the tracking follows the size, as SF Pro's.">
          <View style={{ padding: 16, gap: 14 }}>
            <Each of={STEPS} key={(step) => step.name}>
              {(step) => (
                <View style={{ gap: 2 }}>
                  <Text
                    class="text-label"
                    style={{ fontSize: step().size, lineHeight: step().line, fontWeight: step().weight }}
                  >
                    {step().name}
                  </Text>
                  <Text class="text-tertiary-label" style={{ fontSize: 11 }}>
                    {`${step().size} / ${step().line} · ${step().weight}`}
                  </Text>
                </View>
              )}
            </Each>
          </View>
        </Section>
        <Section header="Body copy" footer="Body at 17/22 with secondary text after it.">
          <View style={{ padding: 16, gap: 8 }}>
            <Text class="text-label" style={{ fontSize: 17, lineHeight: 22 }}>
              Native Shell renders every view with the platform's own widgets; a design system is what makes them one app.
            </Text>
            <Text class="text-secondary-label" style={{ fontSize: 15, lineHeight: 20 }}>
              Subheadline, secondary label: an explanation under the thing it explains.
            </Text>
          </View>
        </Section>
      </List>
    </Page>
  );
}

const HOURS = Array.from({ length: 24 }, (_, hour) => ({
  value: `${hour}`.padStart(2, "0"),
  title: `${hour}`.padStart(2, "0"),
}));

function SheetPage() {
  const open = signal(overlaySeed() === "sheet");
  const detent = signal("medium");
  const notice = signal("No sheet open.");
  const width = signal(0);
  return (
    <Page id="sheet">
      <List scroll={false}>
        <Section header="Detents" footer="Drag the grabber between medium and large; a drag past medium closes it. The backdrop dims at large only.">
          <View style={{ padding: 16, gap: 12 }}>
            <Button title="Open at medium" variant="tinted" onPress={() => { detent.set("medium"); open.set(true); }} />
            <Button title="Open at large" variant="tinted" onPress={() => { detent.set("large"); open.set(true); }} />
          </View>
          <ListTile title="Detent" subtitle={detent()} accessory="none" separator />
          <ListTile title="Last event" subtitle={notice()} accessory="none" separator={false} />
          {/* The panel's measured width, so a test can check the cap on a wide window. */}
          <If when={windowSize().width > 700}>
            <ListTile title="Panel width" subtitle={`${Math.round(width())} pt`} accessory="none" separator={false} />
          </If>
        </Section>
      </List>
      <Sheet
        open={open()}
        detent={detent()}
        title="Filters"
        trailing="Done"
        onOpenChange={(event: { open: boolean }) => { open.set(event.open); if (!event.open) notice.set("Closed."); }}
        onDetentChange={(event: { detent: string }) => detent.set(event.detent)}
        onTrailing={() => { open.set(false); notice.set("Closed from Done."); }}
        onCancel={() => notice.set("Cancelled.")}
      >
        <View class="min-h-0 flex-1" onLayout={({ bounds }) => width.set(bounds.size.width)}>
          <List scroll={false}>
            <Section header="Show" footer="Rows inside the sheet, scrolling while it is at large.">
              <ListTile title="Unread" subtitle="Only mail nobody opened" accessory="none" separator />
              <ListTile title="Flagged" subtitle="Red, orange or yellow" accessory="none" separator />
              <ListTile title="Attachments" subtitle="Anything with a file" accessory="none" separator={false} />
            </Section>
            <Section header="Filler">
              <Each of={[1, 2, 3, 4, 5, 6]} key={(n) => n}>
                {(n) => <ListTile title={`Option ${n()}`} accessory="none" separator={n() !== 6} />}
              </Each>
            </Section>
          </List>
        </View>
      </Sheet>
    </Page>
  );
}

function ActionSheetPage() {
  const open = signal(overlaySeed() === "actionsheet");
  const result = signal("Nothing chosen.");
  return (
    <Page id="actionsheet">
      <List scroll={false}>
        <Section header="A choice" footer="One 10 pt group over the safe area, the cancel button apart; a press outside, Escape or back closes it.">
          <View style={{ padding: 16, gap: 12 }}>
            <Button title="Show action sheet" variant="tinted" onPress={() => open.set(true)} />
          </View>
          <ListTile title="Result" subtitle={result()} accessory="none" separator={false} />
        </Section>
      </List>
      <ActionSheet
        open={open()}
        title="Message"
        message="What do you want to do with it?"
        actions={[
          { id: "reply", title: "Reply" },
          { id: "forward", title: "Forward" },
          { id: "flag", title: "Flag" },
          { id: "delete", title: "Delete", destructive: true },
        ]}
        onOpenChange={(event: { open: boolean }) => open.set(event.open)}
        onAction={(event: { id: string }) => result.set(`Action: ${event.id}`)}
        onCancel={() => result.set("Cancelled.")}
      />
    </Page>
  );
}

function AlertPage() {
  const simple = signal(overlaySeed() === "alert");
  const entry = signal(false);
  const result = signal("No answer yet.");
  return (
    <Page id="alert">
      <List scroll={false}>
        <Section header="Alert" footer="A 270 pt card on a dimmed page, entering with a short spring; two buttons sit side by side, three or more stack.">
          <View style={{ padding: 16, gap: 12 }}>
            <Button title="Delete this message?" variant="destructive" onPress={() => simple.set(true)} />
            <Button title="Rename the folder" variant="tinted" onPress={() => entry.set(true)} />
          </View>
          <ListTile title="Result" subtitle={result()} accessory="none" separator={false} />
        </Section>
      </List>
      <AlertDialog
        open={simple()}
        title="Delete Message"
        message="This message will be deleted. This cannot be undone."
        actions={[
          { id: "cancel", title: "Cancel" },
          { id: "delete", title: "Delete", destructive: true, preferred: true },
        ]}
        onOpenChange={(event: { open: boolean }) => simple.set(event.open)}
        onAction={(event: { id: string; text: string }) => result.set(`Alert: ${event.id}`)}
        onCancel={() => result.set("Alert cancelled.")}
      />
      <AlertDialog
        open={entry()}
        title="Rename Folder"
        message="Enter a name for this folder."
        input="Folder name"
        value="Receipts"
        actions={[
          { id: "cancel", title: "Cancel" },
          { id: "save", title: "Save", preferred: true },
        ]}
        onOpenChange={(event: { open: boolean }) => entry.set(event.open)}
        onAction={(event: { id: string; text: string }) => result.set(`${event.id}: ${event.text || "(empty)"}`)}
        onCancel={() => result.set("Rename cancelled.")}
      />
    </Page>
  );
}

function ContextMenuPage() {
  const preview = signal("Long-press the card, or right-click it.");
  const open = signal(false);
  return (
    <Page id="contextmenu">
      <List scroll={false}>
        <Section header="About a message" footer="The page blurs behind the lifted preview; the menu keeps iOS's grouped surface, Escape closes it.">
          <View style={{ padding: 16 }}>
            <ContextMenu
              actions={[
                { id: "reply", title: "Reply", icon: "arrow.up.right" },
                { id: "flag", title: "Flag", icon: "bell" },
                { id: "delete", title: "Delete", icon: "xmark.circle.fill", destructive: true },
              ]}
              trigger={
                <View class="bg-secondary-system-background" style={{ padding: 16, borderRadius: 14, gap: 6 }}>
                  <Text class="text-label" style={{ fontSize: 17, fontWeight: 600 }}>Ada Lovelace</Text>
                  <Text class="text-secondary-label" style={{ fontSize: 15 }}>The Analytical Engine weaves algebraic patterns.</Text>
                  <Text class="text-tertiary-label" style={{ fontSize: 13 }}>Hold here for the menu</Text>
                </View>
              }
              preview={
                <View
                  testID="context-preview"
                  onPress={() => preview.set("Preview pressed.")}
                  style={{ padding: 18, width: 300, gap: 8 }}
                >
                  <Text class="text-label" style={{ fontSize: 20, fontWeight: 700 }}>Ada Lovelace</Text>
                  <Text class="text-secondary-label" style={{ fontSize: 15 }}>The Analytical Engine weaves algebraic patterns just as the Jacquard loom weaves flowers and leaves.</Text>
                </View>
              }
              open={open()}
              onOpenChange={(event: { open: boolean }) => open.set(event.open)}
              onAction={(event: { id: string }) => preview.set(`Chose ${event.id}.`)}
            />
          </View>
          <ListTile title="Result" subtitle={preview()} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function PickerPage() {
  const hour = signal("09");
  return (
    <Page id="picker">
      <List scroll={false}>
        <Section header="A wheel" footer="Drag it: the items fade and shrink with their distance, the wheel snaps to the item and a haptic ticks.">
          <View style={{ paddingVertical: 8 }}>
            <Picker
              items={HOURS}
              value={hour()}
              label="Hour"
              onChange={(event: { value: string; index: number }) => hour.set(event.value)}
            />
          </View>
          <ListTile title="Hour" subtitle={hour()} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function DatePickerPage() {
  const date = signal("2026-11-14");
  return (
    <Page id="datepicker">
      <List scroll={false}>
        <Section header="Inline" footer="Six weeks of days, week start and names from the locale; today is tinted, the chosen day filled.">
          <View style={{ padding: 16 }}>
            <DatePicker value={date()} label="Delivery date" onChange={(event: { value: string }) => date.set(event.value)} />
          </View>
          <ListTile title="Chosen" subtitle={date()} accessory="none" separator={false} />
        </Section>
        <Section header="Compact" footer="A button that opens the same calendar in a popover.">
          <View style={{ padding: 16 }}>
            <DatePicker value={date()} variant="compact" label="Delivery date, compact" onChange={(event: { value: string }) => date.set(event.value)} />
          </View>
        </Section>
      </List>
    </Page>
  );
}

function SegmentedPage() {
  const chosen = signal("week");
  const size = signal("m");
  return (
    <Page id="segmented">
      <List scroll={false}>
        <Section header="Three" footer="A 32 pt track in a 50 pt target; the white thumb slides on a spring, with a haptic.">
          <View style={{ padding: 16 }}>
            <SegmentedControl
              items={[
                { value: "day", title: "Day" },
                { value: "week", title: "Week" },
                { value: "month", title: "Month" },
              ]}
              value={chosen()}
              label="Range"
              onChange={(event: { value: string; index: number }) => chosen.set(event.value)}
            />
          </View>
          <ListTile title="Range" subtitle={chosen()} accessory="none" separator={false} />
        </Section>
        <Section header="Five" footer="Two to five segments; the thumb's width follows the track.">
          <View style={{ padding: 16 }}>
            <SegmentedControl
              items={[
                { value: "xs", title: "XS" },
                { value: "s", title: "S" },
                { value: "m", title: "M" },
                { value: "l", title: "L" },
                { value: "xl", title: "XL" },
              ]}
              value={size()}
              label="Size"
              onChange={(event: { value: string; index: number }) => size.set(event.value)}
            />
          </View>
          <ListTile title="Size" subtitle={size()} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function SliderPage() {
  const volume = signal(0.45);
  const steps = signal(3);
  return (
    <Page id="slider">
      <List scroll={false}>
        <Section header="Continuous" footer="A 4 pt rail in the tint, a 28 pt white thumb, a value snapped to 0.05.">
          <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
            <Slider value={volume()} min={0} max={1} step={0.05} label="Volume slider" onChange={(event: { value: number }) => volume.set(event.value)} />
          </View>
          <ListTile title="Volume" subtitle={`${Math.round(volume() * 100)} %`} accessory="none" separator={false} />
        </Section>
        <Section header="Steps" footer="A tick for each step while there are few enough to draw.">
          <View style={{ paddingHorizontal: 16, paddingVertical: 20 }}>
            <Slider value={steps()} min={0} max={5} step={1} label="Quality steps" onChange={(event: { value: number }) => steps.set(event.value)} />
          </View>
          <ListTile title="Quality" subtitle={`${steps()}`} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function TabBarPage() {
  const tab = signal("inbox");
  return (
    <View style={{ flex: 1 }}>
      <Page id="tabbar">
        <List scroll={false}>
          <Section header="Tabs" footer="A 49 pt bar over the safe area, the chosen tab in the tint, a badge over an icon; the bar's material blurs what scrolls under it.">
            <ListTile title="Chosen" subtitle={tab()} accessory="none" separator />
            <ListTile title="Badges" subtitle="A count, or a dot" accessory="none" separator={false} />
          </Section>
          <Section header="Filler" footer="Rows so the page scrolls under the bar.">
            <Each of={[1, 2, 3, 4, 5]} key={(n) => n}>
              {(n) => <ListTile title={`Row ${n()}`} accessory="none" separator={n() !== 5} />}
            </Each>
          </Section>
        </List>
      </Page>
      <TabBar
        items={[
          { value: "inbox", title: "Inbox", icon: "envelope", badge: "3" },
          { value: "flagged", title: "Flagged", icon: "bell" },
          { value: "search", title: "Search", icon: "magnifyingglass" },
          { value: "profile", title: "Profile", icon: "person", badge: "dot" },
        ]}
        value={tab()}
        label="Mail"
        onChange={(event: { value: string; index: number }) => tab.set(event.value)}
      />
    </View>
  );
}

function SwipePage() {
  const last = signal("Swipe a row: archive or delete behind it.");
  return (
    <Page id="swipe">
      <List scroll={false}>
        <Section header="Trailing actions" footer="Swipe left for Flag and Delete; a full swipe fires Archive and the row springs back.">
          <SwipeRow
            trailing={[
              { id: "flag", title: "Flag", icon: "bell", tint: "system-orange" },
              { id: "delete", title: "Delete", icon: "xmark.circle.fill", destructive: true },
            ]}
            fullSwipe="archive"
            onAction={(event: { id: string; full: boolean }) => last.set(event.full ? "Full swipe: archived (undo available)." : `Action ${event.id}.`)}
          >
            <ListTile title="Ada Lovelace" subtitle="The Analytical Engine" accessory="none" separator />
          </SwipeRow>
          <SwipeRow
            trailing={[{ id: "delete", title: "Delete", icon: "xmark.circle.fill", destructive: true }]}
            onAction={(event: { id: string; full: boolean }) => last.set(`Deleted${event.full ? " by a full swipe" : ""}.`)}
          >
            <ListTile title="Grace Hopper" subtitle="A compiler for English" accessory="none" separator={false} />
          </SwipeRow>
        </Section>
        <Section header="Leading action">
          <SwipeRow
            leading={[{ id: "unread", title: "Unread", icon: "envelope", tint: "system-blue" }]}
            onAction={(event: { id: string; full: boolean }) => last.set(`Action ${event.id}.`)}
          >
            <ListTile title="Katherine Johnson" subtitle="Orbital mechanics" accessory="none" separator={false} />
          </SwipeRow>
        </Section>
        <Section footer={last()}>
          <ListTile title="Result" subtitle={last()} accessory="none" separator={false} />
        </Section>
      </List>
    </Page>
  );
}

function RefreshPage() {
  const refreshing = signal(false);
  const count = signal(12);
  return (
    <Page id="refresh">
      <List scroll={false}>
        <Section header="Pull" footer="Drag the page past its top: the indicator drops and grows with the pull; release past 100 pt to refresh.">
          <ListTile title="Refresh" subtitle={refreshing() ? "Refreshing…" : "Pull the page down"} accessory="none" separator={false} />
        </Section>
      </List>
      <RefreshView
        refreshing={refreshing()}
        onRefresh={() => {
          refreshing.set(true);
          count.update((n) => n + 1);
          setTimeout(() => refreshing.set(false), 1200);
        }}
        style={{ flex: 1 }}
      >
        <View style={{ paddingVertical: 16 }}>
          <Each of={Array.from({ length: 6 }, (_, i) => i + 1)} key={(n) => n}>
            {(n) => <ListTile title={`Message ${n()}`} subtitle="Pulled in at 14:32" accessory="none" separator={n() !== 6} />}
          </Each>
        </View>
      </RefreshView>
    </Page>
  );
}

function BarMaterialsPage() {
  const tab = signal("inbox");
  return (
    <View style={{ flex: 1 }}>
      <Page id="bar-materials" material="regular">
        <List scroll={false}>
          <Section header="The bar" footer="Scroll: the large title goes under the bar and the material blurs it, fading in with the compact title.">
            <Each of={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]} key={(n) => n}>
              {(n) => <ListTile title={`Row ${n()}`} subtitle="Under the bar" accessory="none" separator={n() !== 10} />}
            </Each>
          </Section>
          <Section header="The tab bar" footer="The same material under the tabs; a platform without a backdrop blur keeps the tint.">
            <ListTile title="Tab" subtitle={tab()} accessory="none" separator={false} />
          </Section>
        </List>
      </Page>
      <TabBar
        items={[
          { value: "inbox", title: "Inbox", icon: "envelope" },
          { value: "flagged", title: "Flagged", icon: "bell", badge: "2" },
          { value: "search", title: "Search", icon: "magnifyingglass" },
        ]}
        value={tab()}
        label="Materials"
        onChange={(event: { value: string; index: number }) => tab.set(event.value)}
      />
    </View>
  );
}

function CurrentPage() {
  const id = page();
  if (id === "gallery") return <Gallery />;
  if (id === "navigation") return <NavigationPage />;
  if (id === "lists") return <ListsPage />;
  if (id === "buttons") return <ButtonsPage />;
  if (id === "textfields") return <TextFieldsPage />;
  if (id === "search") return <SearchPage />;
  if (id === "switches") return <SwitchesPage />;
  if (id === "indicators") return <IndicatorsPage />;
  if (id === "scroll") return <ScrollPage />;
  if (id === "materials") return <MaterialsPage />;
  if (id === "sheet") return <SheetPage />;
  if (id === "actionsheet") return <ActionSheetPage />;
  if (id === "alert") return <AlertPage />;
  if (id === "contextmenu") return <ContextMenuPage />;
  if (id === "picker") return <PickerPage />;
  if (id === "datepicker") return <DatePickerPage />;
  if (id === "segmented") return <SegmentedPage />;
  if (id === "slider") return <SliderPage />;
  if (id === "tabbar") return <TabBarPage />;
  if (id === "swipe") return <SwipePage />;
  if (id === "refresh") return <RefreshPage />;
  if (id === "bar-materials") return <BarMaterialsPage />;
  if (id === "colors") return <ColorsPage />;
  return <TypePage />;
}

function App() {
  // Landing on a page: a screenshot or a link seeds Storage before the app
  // starts.
  void (async () => {
    const seedPage = await Storage.getItem("cupertino.page");
    const seedContrast = await Storage.getItem("cupertino.contrast");
    const seedAppearance = await Storage.getItem("cupertino.appearance");
    const seedOverlay = await Storage.getItem("cupertino.overlay");
    if (seedOverlay) overlaySeed.set(seedOverlay);
    if (seedContrast === "high" || seedContrast === "normal") contrast.set(seedContrast);
    if (seedAppearance === "light" || seedAppearance === "dark" || seedAppearance === "system") {
      appearance.set(seedAppearance);
      setColorScheme(seedAppearance);
    }
    if (seedPage && PAGE_IDS.includes(seedPage)) page.set(seedPage);
  })();

  return (
    <Theme contrast={contrast()}>
      <Each of={[page()]} key={(id) => id}>
        {(_id) => <CurrentPage />}
      </Each>
    </Theme>
  );
}

mount(App);
