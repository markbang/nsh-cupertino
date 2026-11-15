// The site's own layer: the frame around the demos, the code block, the API
// table and the page header. The controls inside are the library's own.
import { Clipboard, type JSX, signal, Text, token, View } from "nsh";
import { Button as Press } from "nsh/base";
import { Button, SegmentedControl } from "cupertino";
import { type ApiGroup, type ApiName, type ApiRow } from "./api";
import { language, t, tr } from "./i18n";
import { frame, typeScale } from "./prefs";

export const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

export const hairline = () => token("separator");
export const surface = () => token("secondary-system-background");
export const page = () => token("system-background");
export const grouped = () => token("system-grouped-background");
export const label = () => token("label");
export const muted = () => token("secondary-label");
export const faint = () => token("tertiary-label");
export const tint = () => token("system-blue");

export function Line(props: { style?: Record<string, unknown> }) {
  return <View style={{ height: 1, backgroundColor: hairline(), flexShrink: 0, ...props.style }} />;
}

/** A code block with a copy button; the code is the demo's own TSX. */
export function CodeBlock(props: { code: string; label?: string }) {
  const copied = signal(false);
  const copy = () => {
    void Clipboard.writeText(props.code)
      .then(() => {
        copied.set(true);
        setTimeout(() => copied.set(false), 1600);
      })
      .catch(() => copied.set(false));
  };
  return (
    <View
      style={{
        borderRadius: 12,
        backgroundColor: "#1c1c1e",
        borderWidth: 1,
        borderColor: "#3a3a3c",
        overflow: "hidden",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingVertical: 8,
          backgroundColor: "#2c2c2e",
        }}
      >
        <Text style={{ fontFamily: mono, fontSize: 11, color: "#aeaeb2", letterSpacing: 0.6 }}>
          {props.label ?? "TSX"}
        </Text>
        <Press
          onPress={copy}
          accessibilityLabel={t("copy")}
          focusVisibleStyle={{ outlineWidth: 2, outlineColor: "#0a84ff", outlineOffset: 2 }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 6,
            backgroundColor: copied() ? "#0a84ff" : "#3a3a3c",
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: 600, color: "#ffffff" }}>
            {copied() ? t("copied") : t("copy")}
          </Text>
        </Press>
      </View>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <Text
          allowFontScaling={false}
          style={{ fontFamily: mono, fontSize: 12.5, lineHeight: 20, color: "#f2f2f7" }}
        >
          {props.code}
        </Text>
      </View>
    </View>
  );
}

const plain = (text: string | undefined) => (text ?? "").replace(/`/g, "");

/** The docs' prop tables, one block per component of a doc page. */
export function ApiTable(props: { groups: ApiGroup[]; showTitles?: boolean }) {
  return (
    <View style={{ gap: 28 }}>
      <Each of={props.groups} key={(group) => group.title}>
        {(group) => (
          <View style={{ gap: 10 }}>
            <If when={props.showTitles || props.groups.length > 1}>
              <Text style={{ fontSize: 17, fontWeight: 600, color: label() }}>{group().title}</Text>
            </If>
            <View
              style={{
                borderRadius: 12,
                backgroundColor: surface(),
                borderWidth: 1,
                borderColor: hairline(),
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: surface(),
                }}
              >
                <Text style={{ width: 168, fontSize: 11, fontWeight: 600, color: faint(), letterSpacing: 0.5 }}>
                  {tr("PROP", "属性")}
                </Text>
                <Text style={{ width: 150, fontSize: 11, fontWeight: 600, color: faint(), letterSpacing: 0.5 }}>
                  {tr("TYPE", "类型")}
                </Text>
                <Text style={{ width: 96, fontSize: 11, fontWeight: 600, color: faint(), letterSpacing: 0.5 }}>
                  {tr("DEFAULT", "默认")}
                </Text>
                <Text style={{ flex: 1, fontSize: 11, fontWeight: 600, color: faint(), letterSpacing: 0.5 }} />
              </View>
              <Each of={group().rows} key={(row) => ("tsx" in row ? row.tsx : row.name)}>
                {(row) => (
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 12,
                      alignItems: "flex-start",
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      borderTopWidth: 1,
                      borderColor: hairline(),
                    }}
                  >
                    <If when={group().kind === "props"}>
                      <View style={{ width: 168 }}>
                        <Text style={{ fontFamily: mono, fontSize: 12.5, color: tint() }}>
                          {plain((row() as ApiRow).tsx)}
                        </Text>
                        <Text style={{ fontFamily: mono, fontSize: 11, color: faint(), marginTop: 2 }}>
                          {plain((row() as ApiRow).rust)}
                        </Text>
                      </View>
                      <View style={{ width: 150 }}>
                        <Text style={{ fontFamily: mono, fontSize: 12, color: label() }}>
                          {plain((row() as ApiRow).type)}
                        </Text>
                        <Text style={{ fontSize: 12.5, color: muted(), marginTop: 2 }}>
                          {plain((row() as ApiRow).note)}
                        </Text>
                      </View>
                      <Text style={{ width: 96, fontFamily: mono, fontSize: 12, color: muted() }}>
                        {plain((row() as ApiRow).default)}
                      </Text>
                    </If>
                    <If when={group().kind === "names"}>
                      <View style={{ flex: 1, flexDirection: "row", gap: 12 }}>
                        <Text style={{ fontFamily: mono, fontSize: 12.5, color: tint(), flexBasis: 240 }}>
                          {plain((row() as ApiName).name)}
                        </Text>
                        <Text style={{ flex: 1, fontSize: 12.5, color: muted() }}>
                          {plain((row() as ApiName).note)}
                        </Text>
                      </View>
                    </If>
                  </View>
                )}
              </Each>
            </View>
            <If when={Boolean(group().events)}>
              <Text style={{ fontSize: 12.5, color: muted() }}>
                {`${tr("Events", "事件")}: ${plain(group().events)}`}
              </Text>
            </If>
          </View>
        )}
      </Each>
    </View>
  );
}

export interface Variant {
  id: string;
  title: string;
  code: string;
  view: () => JSX.Element;
}

/** The stage the demos run in: a phone when the frame is on, else a panel. */
export function Stage(props: { children: JSX.Element; height?: number }) {
  return (
    <If
      when={frame()}
      else={
        <View
          style={{
            height: props.height ?? 560,
            borderRadius: 18,
            borderWidth: 1,
            borderColor: hairline(),
            backgroundColor: grouped(),
            overflow: "hidden",
          }}
        >
          {props.children}
        </View>
      }
    >
      <View style={{ alignItems: "center", paddingVertical: 8 }}>
        <View
          style={{
            width: 402,
            borderRadius: 58,
            backgroundColor: "#0b0b0d",
            padding: 6,
            boxShadow: "0 30px 80px -30px rgb(0 0 0 / 0.55)",
          }}
        >
          <View
            style={{
              height: 780,
              borderRadius: 52,
              overflow: "hidden",
              backgroundColor: page(),
            }}
          >
            <StatusBar />
            <View style={{ flex: 1, overflow: "hidden" }}>{props.children}</View>
            <View style={{ alignItems: "center", paddingVertical: 6 }}>
              <View style={{ width: 128, height: 5, borderRadius: 3, backgroundColor: token("label").slice(0, 7) + "40" }} />
            </View>
          </View>
        </View>
      </View>
    </If>
  );
}

function StatusBar() {
  const color = () => (token("label").slice(0, 7));
  return (
    <View
      style={{
        height: 50,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 28,
        flexShrink: 0,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: 600, color: color() }}>9:41</Text>
      <View
        style={{ width: 118, height: 30, borderRadius: 16, backgroundColor: "#0b0b0d" }}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
          <Each of={[4, 6, 8, 10]} key={(n) => n}>
            {(n) => (
              <View style={{ width: 3, height: n(), borderRadius: 1, backgroundColor: color() }} />
            )}
          </Each>
        </View>
        <Text style={{ fontSize: 11, fontWeight: 600, color: color() }}>5G</Text>
        <View
          style={{
            width: 24,
            height: 12,
            borderRadius: 3.5,
            borderWidth: 1,
            borderColor: color(),
            padding: 1.5,
          }}
        >
          <View style={{ height: "100%", width: "72%", borderRadius: 1.5, backgroundColor: color() }} />
        </View>
      </View>
    </View>
  );
}

/** A page's title, blurb, variant tabs, stage, code and API. */
export function DemoPage(props: {
  title: string;
  blurb: string;
  variants: Variant[];
  api?: ApiGroup[];
  apiTitle?: string;
  hint?: string;
  stageHeight?: number;
}) {
  const chosen = signal(props.variants[0].id);
  const current = () => props.variants.find((variant) => variant.id === chosen()) ?? props.variants[0];
  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 8 }}>
        <Text
          allowFontScaling={false}
          style={{ fontSize: 34, lineHeight: 41, fontWeight: 700, color: label(), letterSpacing: -0.4 }}
        >
          {props.title}
        </Text>
        <Text style={{ fontSize: 17, lineHeight: 24, color: muted(), maxWidth: 720 }}>
          {props.blurb}
        </Text>
      </View>

      <If when={props.variants.length > 1}>
        <View style={{ alignItems: "flex-start", width: Math.min(560, props.variants.length * 132) }}>
          <SegmentedControl
            items={props.variants.map((variant) => ({ value: variant.id, title: variant.title }))}
            value={chosen()}
            onChange={(event: { value: string }) => chosen.set(event.value)}
            label={t("variants")}
          />
        </View>
      </If>

      <View style={{ gap: 8 }}>
        <Stage height={props.stageHeight}>{current().view()}</Stage>
        <If when={Boolean(props.hint)}>
          <Text style={{ fontSize: 12.5, color: faint(), textAlign: "center" }}>{props.hint}</Text>
        </If>
      </View>

      <View style={{ gap: 10 }}>
        <Text allowFontScaling={false} style={{ fontSize: 13, fontWeight: 600, color: faint(), letterSpacing: 0.6 }}>
          {t("code").toUpperCase()}
        </Text>
        <CodeBlock code={current().code} />
      </View>

      <If when={Boolean(props.api && props.api.length)}>
        <View style={{ gap: 14 }}>
          <View style={{ gap: 2 }}>
            <Text allowFontScaling={false} style={{ fontSize: 22, fontWeight: 700, color: label() }}>
              {t("api")}
            </Text>
            <Text style={{ fontSize: 13, color: faint() }}>{t("apiHint")}</Text>
          </View>
          <ApiTable groups={props.api ?? []} showTitles={props.apiTitle !== "single"} />
        </View>
      </If>
    </View>
  );
}

/** A demo's own short label, in the site's language. */
export const demo = {
  section: (header: string, footer?: string) => ({ header, footer }),
};

export { Button, language, textSize };

function textSize(): number {
  return typeScale();
}
