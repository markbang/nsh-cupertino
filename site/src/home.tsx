// Home: the tagline, the install snippet, the version and the grid of the 24
// components, each a card with a still of the component.
import { type JSX, openUrl, Text, token, View, windowSize } from "nsh";
import { Button as Press } from "nsh/base";
import { Button } from "cupertino";
import { CATALOG, blurbOf, nameOf, Thumb } from "./catalog";
import { version, Footer } from "./chrome";
import { t, tr } from "./i18n";
import { wide } from "./prefs";
import { CodeBlock, faint, hairline, label, muted, surface, tint } from "./ui";

const columns = () => {
  const width = windowSize().width;
  return width >= 1360 ? 4 : width >= 1040 ? 3 : width >= 680 ? 2 : 1;
};

const cardWidth = () => {
  const width = windowSize().width - (wide() ? 248 : 0) - 64 - (columns() - 1) * 16;
  return Math.max(220, Math.floor(width / columns()));
};

function Install() {
  const code = `# 1. Add the crate (Cargo.toml)
nsh-cupertino = { git = "https://github.com/markbang/nsh-cupertino", tag = "v${version()}" }

# 2. Point nsh.json at the generated theme
"theme": "../nsh-cupertino/theme/theme.json"

# 3. Or start from the template
nsh init my-app`;
  return <CodeBlock code={code} label={t("install").toUpperCase()} />;
}

function Card(props: { id: string; onOpen: (id: string) => void }) {
  const entry = CATALOG.find((item) => item.id === props.id);
  if (!entry) return <View />;
  return (
    <Press
      onPress={() => props.onOpen(entry.id)}
      accessibilityLabel={`${nameOf(entry)}: ${blurbOf(entry)}`}
      style={{
        width: cardWidth(),
        padding: 12,
        gap: 10,
        borderRadius: 16,
        backgroundColor: surface(),
        borderWidth: 1,
        borderColor: hairline(),
      }}
      hoverStyle={{ borderColor: token("system-blue"), boxShadow: "0 10px 30px -18px rgb(0 0 0 / 0.4)" }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: tint(), outlineOffset: 2 }}
    >
      <Thumb id={entry.id} />
      <View style={{ gap: 2, paddingHorizontal: 2, paddingBottom: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: 600, color: label() }}>{nameOf(entry)}</Text>
        <Text style={{ fontSize: 12.5, lineHeight: 17, color: muted(), numberOfLines: 2 }}>
          {blurbOf(entry)}
        </Text>
      </View>
    </Press>
  );
}

export function Home(props: { onOpen: (id: string) => void }) {
  const side = () => Math.max(32, (windowSize().width - (wide() ? 248 : 0) - 1180) / 2);
  return (
    <View style={{ paddingTop: 28, paddingLeft: side(), paddingRight: side() }}>
      <View style={{ gap: 30 }}>
        <View style={{ flexDirection: windowSize().width >= 1160 ? "row" : "column", gap: 36, alignItems: "flex-start" }}>
          <View style={{ flex: 1, gap: 16, minWidth: 360 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: token("fill") }}>
                <Text style={{ fontSize: 11, fontWeight: 600, color: muted(), letterSpacing: 0.4 }}>
                  {"NATIVE SHELL"}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: faint() }}>{`v${version()}`}</Text>
            </View>
            <Text
              allowFontScaling={false}
              style={{ fontSize: 52, lineHeight: 58, fontWeight: 700, color: label(), letterSpacing: -1.4 }}
            >
              {tr("Cupertino, for Native Shell.", "为 Native Shell 打造的 Cupertino。")}
            </Text>
            <Text style={{ fontSize: 19, lineHeight: 27, color: muted() }}>{t("tagline")}</Text>
            <Text style={{ fontSize: 15, lineHeight: 23, color: muted() }}>{t("intro")}</Text>
            <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
              <Button title={t("getStarted")} icon="arrow.up.right" onPress={() => props.onOpen("button")} />
              <Button
                title="GitHub"
                variant="tinted"
                onPress={() => {
                  void openUrl("https://github.com/markbang/nsh-cupertino").catch(() => {});
                }}
              />
            </View>
          </View>
          <View style={{ width: windowSize().width >= 1160 ? 520 : "100%", gap: 8, paddingTop: 4 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
              <Text style={{ fontSize: 15, fontWeight: 600, color: label() }}>{t("install")}</Text>
              <Text style={{ fontSize: 12.5, color: faint() }}>{t("installHint")}</Text>
            </View>
            <Install />
          </View>
        </View>

        <View style={{ gap: 4, paddingTop: 8 }}>
          <Text allowFontScaling={false} style={{ fontSize: 28, fontWeight: 700, color: label(), letterSpacing: -0.4 }}>
            {t("interactive")}
          </Text>
          <Text style={{ fontSize: 13.5, color: faint() }}>{t("gridHint")}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          <Each of={CATALOG} key={(entry) => entry.id}>
            {(entry) => <Card id={entry().id} onOpen={props.onOpen} />}
          </Each>
        </View>

        <Footer />
      </View>
    </View>
  );
}
