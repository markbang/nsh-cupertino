// The site's chrome: the bar on top with the global controls, the sidebar of
// components and the footer. The controls are the library's own.
import { appInfo, type JSX, openUrl, signal, Text, token, View, windowSize } from "nsh";
import { Button as Press, Popover } from "nsh/base";
import { Button, ScrollView, SegmentedControl, Slider, Switch } from "cupertino";
import { CATALOG, entryOf, nameOf, type Entry } from "./catalog";
import { language, strings, t, tr } from "./i18n";
import { appearance, contrast, frame, liquidGlass, resetPreferences, typeScale, wide } from "./prefs";
import { hairline, label, muted, page, surface, tint } from "./ui";

export const version = () => appInfo().version ?? "0.3.1";

const GITHUB = "https://github.com/markbang/nsh-cupertino";

const GROUPS: { title: string; ids: string[] }[] = [
  {
    title: "Foundations",
    ids: ["icon", "theme", "navigation-bar", "nav-page", "list", "section", "list-tile"],
  },
  {
    title: "Controls",
    ids: ["button", "text-field", "search-field", "switch", "activity-indicator", "scroll-view", "segmented-control", "slider", "tab-bar"],
  },
  {
    title: "Floating and gestures",
    ids: ["sheet", "action-sheet", "alert-dialog", "context-menu", "picker", "date-picker", "swipe-row", "refresh"],
  },
];

export function Brand(props: { onHome: () => void }) {
  return (
    <Press
      onPress={props.onHome}
      accessibilityLabel={tr("Cupertino, home", "Cupertino，首页")}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 3 }}
      style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          backgroundColor: tint(),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 15, fontWeight: 700, color: "#ffffff" }}>C</Text>
      </View>
      <Text style={{ fontSize: 16, fontWeight: 600, color: label() }}>Cupertino</Text>
      <View
        style={{
          paddingHorizontal: 7,
          paddingVertical: 2,
          borderRadius: 6,
          backgroundColor: token("fill"),
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: 500, color: muted() }}>{version()}</Text>
      </View>
    </Press>
  );
}

function SettingRow(props: { title: string; hint?: string; children: JSX.Element }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10, paddingVertical: 8 }}>
      <View style={{ width: 104, flexShrink: 0 }}>
        <Text style={{ fontSize: 14, color: label() }}>{props.title}</Text>
        <If when={Boolean(props.hint)}>
          <Text style={{ fontSize: 11.5, color: muted() }}>{props.hint}</Text>
        </If>
      </View>
      {props.children}
    </View>
  );
}

/** The appearance, contrast, text size and frame controls, as a floating panel. */
export function SettingsPanel(props: { showFrame: boolean }) {
  return (
    <View style={{ width: 340, gap: 2 }}>
      <SettingRow title={t("appearance")}>
        <View style={{ width: 208 }}>
        <SegmentedControl
          items={[
            { value: "light", title: t("light") },
            { value: "dark", title: t("dark") },
            { value: "auto", title: t("auto") },
          ]}
          value={appearance()}
          label={t("appearance")}
          onChange={(event: { value: string }) => appearance.set(event.value as "light" | "dark" | "auto")}
        />
        </View>
      </SettingRow>
      <SettingRow title={t("liquidGlass")} hint={t("liquidGlassHint")}>
        <Switch
          checked={liquidGlass()}
          label={t("liquidGlass")}
          onChange={(event: { value: boolean }) => liquidGlass.set(event.value)}
        />
      </SettingRow>
      <SettingRow title={t("contrast")}>
        <Switch
          checked={contrast() === "high"}
          label={t("contrast")}
          onChange={(event: { value: boolean }) => contrast.set(event.value ? "high" : "normal")}
        />
      </SettingRow>
      <View style={{ gap: 6, paddingVertical: 8 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, color: label() }}>{t("typeSize")}</Text>
          <Text style={{ fontSize: 12, color: muted() }}>{`${Math.round(typeScale() * 100)}%`}</Text>
        </View>
        <Slider
          value={typeScale()}
          min={0.85}
          max={1.5}
          step={0.05}
          label={t("typeSize")}
          onChange={(event: { value: number }) => typeScale.set(event.value)}
        />
      </View>
      <If when={props.showFrame}>
        <SettingRow title={t("frame")} hint={tr("Off on narrow screens", "窄屏默认关闭")}>
          <Switch checked={frame()} label={t("frame")} onChange={(event: { value: boolean }) => frame.set(event.value)} />
        </SettingRow>
      </If>
      <View style={{ height: 1, backgroundColor: hairline(), marginVertical: 4 }} />
      <SettingRow title={t("language")}>
        <View style={{ width: 168 }}>
        <SegmentedControl
          items={[
            { value: "en", title: "EN" },
            { value: "zh", title: "中文" },
          ]}
          value={language()}
          label={t("language")}
          onChange={(event: { value: string }) => language.set(event.value as "en" | "zh")}
        />
        </View>
      </SettingRow>
      <Press
        onPress={resetPreferences}
        accessibilityLabel={t("reset")}
        style={{ paddingVertical: 8 }}
        focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
      >
        <Text style={{ fontSize: 13, color: tint() }}>{t("reset")}</Text>
      </Press>
    </View>
  );
}

export function Header(props: { onHome: () => void; showFrame: boolean }) {
  const settings = signal(false);
  const width = () => windowSize().width;
  return (
    <View
      style={{
        height: 60,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        backgroundColor: surface(),
        borderBottomWidth: 1,
        borderColor: hairline(),
        flexShrink: 0,
        zIndex: 2,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
        <Brand onHome={props.onHome} />
        <If when={width() >= 1180}>
          <View style={{ width: 214, flexShrink: 0 }}>
            <SegmentedControl
              items={[
                { value: "light", title: t("light") },
                { value: "dark", title: t("dark") },
                { value: "auto", title: t("auto") },
              ]}
              value={appearance()}
              label={t("appearance")}
              onChange={(event: { value: string }) => appearance.set(event.value as "light" | "dark" | "auto")}
            />
          </View>
        </If>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <If when={width() >= 1180}>
          <View style={{ width: 132, flexShrink: 0 }}>
            <SegmentedControl
              items={[
                { value: "en", title: "EN" },
                { value: "zh", title: "中文" },
              ]}
              value={language()}
              label={t("language")}
              onChange={(event: { value: string }) => language.set(event.value as "en" | "zh")}
            />
          </View>
        </If>
        <Button
          icon="arrow.up.right"
          label="GitHub"
          variant="plain"
          size="small"
          onPress={() => {
            void openUrl(GITHUB).catch(() => {});
          }}
        />
        <Popover
          open={settings()}
          onOpenChange={(event: { open: boolean }) => settings.set(event.open)}
          align="end"
          placement="bottom"
          offset={8}
          margin={12}
          trigger={
            <View
              role="button"
              accessibilityLabel={t("settings")}
              style={{
                width: 34,
                height: 30,
                alignItems: "center",
                justifyContent: "center",
                gap: 3,
                borderRadius: 8,
                backgroundColor: settings() ? token("fill") : "transparent",
              }}
            >
              <Each of={[0, 1, 2]} key={(n) => n}>
                {(n) => (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 2, width: 18 }}>
                    <View style={{ width: 5, height: 2, borderRadius: 1, backgroundColor: muted() }} />
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: tint() }} />
                    <View style={{ flex: 1, height: 2, borderRadius: 1, backgroundColor: muted() }} />
                  </View>
                )}
              </Each>
            </View>
          }
          popupStyle={{
            padding: 14,
            borderRadius: 14,
            backgroundColor: surface(),
            borderWidth: 1,
            borderColor: hairline(),
            boxShadow: "0 18px 50px -20px rgb(0 0 0 / 0.35)",
          }}
        >
          <SettingsPanel showFrame={props.showFrame} />
        </Popover>
      </View>
    </View>
  );
}

export function Sidebar(props: { current: string; onOpen: (id: string) => void }) {
  return (
    <View
      style={{
        width: 248,
        flexShrink: 0,
        borderRightWidth: 1,
        borderColor: hairline(),
        backgroundColor: surface(),
      }}
    >
      <ScrollView style={{ flex: 1 }}><View style={{ paddingVertical: 14, paddingHorizontal: 12, gap: 2 }}>
        <Each of={GROUPS} key={(group) => group.title}>
          {(group) => (
            <View style={{ gap: 2, paddingTop: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: 600, color: muted(), letterSpacing: 0.6, paddingHorizontal: 10, paddingBottom: 4 }}>
                {tr(group().title.toUpperCase(), group().title === "Foundations" ? "基础" : group().title === "Controls" ? "控件" : "浮层与手势")}
              </Text>
              <Each of={group().ids} key={(id) => id}>
                {(id) => {
                  const entry = entryOf(id());
                  if (!entry) return <View />;
                  const chosen = () => props.current === id();
                  return (
                    <Press
                      onPress={() => props.onOpen(id())}
                      accessibilityLabel={nameOf(entry)}
                      selected={chosen()}
                      style={{
                        paddingVertical: 7,
                        paddingHorizontal: 10,
                        borderRadius: 8,
                        backgroundColor: chosen() ? token("fill") : "transparent",
                      }}
                      hoverStyle={{ backgroundColor: token("quaternary-fill") }}
                      focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: -2 }}
                    >
                      <Text style={{ fontSize: 13.5, color: chosen() ? label() : muted(), fontWeight: chosen() ? 600 : 400 }}>
                        {nameOf(entry)}
                      </Text>
                    </Press>
                  );
                }}
              </Each>
            </View>
          )}
        </Each>
      </View></ScrollView>
      <View style={{ padding: 14, borderTopWidth: 1, borderColor: hairline(), gap: 6 }}>
        <Press
          onPress={() => {
            void openUrl(GITHUB).catch(() => {});
          }}
          accessibilityLabel="GitHub"
          focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
        >
          <Text style={{ fontSize: 12.5, color: tint() }}>GitHub · markbang/nsh-cupertino</Text>
        </Press>
        <Text style={{ fontSize: 11.5, color: muted() }}>{t("footer")}</Text>
      </View>
    </View>
  );
}

export function Breadcrumb(props: { entry: Entry; onHome: () => void }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Press
        onPress={props.onHome}
        accessibilityLabel={t("back")}
        style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
        focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
      >
        <Text style={{ fontSize: 13, color: tint() }}>‹ {t("back")}</Text>
      </Press>
      <Text style={{ fontSize: 13, color: muted() }}>/</Text>
      <Text style={{ fontSize: 13, color: muted() }}>{nameOf(props.entry)}</Text>
    </View>
  );
}

export function PrevNext(props: { entry: Entry; onOpen: (id: string) => void }) {
  const index = CATALOG.findIndex((entry) => entry.id === props.entry.id);
  const before = index > 0 ? CATALOG[index - 1] : CATALOG[CATALOG.length - 1];
  const after = index < CATALOG.length - 1 ? CATALOG[index + 1] : CATALOG[0];
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingTop: 8 }}>
      <Press
        onPress={() => props.onOpen(before.id)}
        accessibilityLabel={`${t("previous")}: ${nameOf(before)}`}
        style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: surface(), borderWidth: 1, borderColor: hairline() }}
        focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
      >
        <Text style={{ fontSize: 11, color: muted() }}>‹ {t("previous")}</Text>
        <Text style={{ fontSize: 14, fontWeight: 600, color: label() }}>{nameOf(before)}</Text>
      </Press>
      <Press
        onPress={() => props.onOpen(after.id)}
        accessibilityLabel={`${t("next")}: ${nameOf(after)}`}
        style={{ flex: 1, padding: 12, borderRadius: 10, backgroundColor: surface(), borderWidth: 1, borderColor: hairline(), alignItems: "flex-end" }}
        focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
      >
        <Text style={{ fontSize: 11, color: muted() }}>{t("next")} ›</Text>
        <Text style={{ fontSize: 14, fontWeight: 600, color: label() }}>{nameOf(after)}</Text>
      </Press>
    </View>
  );
}

export function Footer() {
  return (
    <View style={{ paddingTop: 32, paddingBottom: 12, gap: 4 }}>
      <Text style={{ fontSize: 11.5, color: muted() }}>{strings.footer[language() === "zh" ? 1 : 0]}</Text>
    </View>
  );
}

export { wide };
