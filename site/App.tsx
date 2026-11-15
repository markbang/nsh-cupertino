// The site: a bar of global controls, a sidebar of components on wide
// screens, the home grid, and one page per component. Routes are hash routes
// (`#/sheet`), kept in the browser's history so back and forward work and a
// link can be shared.
import { effect, host, mount, signal, Text, View, UrlScheme, windowSize } from "nsh";
import { ScrollView, Theme } from "cupertino";
import { entryOf, nameOf, type Entry } from "./src/catalog";
import { Breadcrumb, Header, PrevNext, Sidebar } from "./src/chrome";
import { Home } from "./src/home";
import { t, tr } from "./src/i18n";
import { contrast, wide } from "./src/prefs";
import { faint, page } from "./src/ui";

/** The route in a URL's fragment: `#/sheet` is "sheet", `#/` is home. */
function routeOf(url: string | null): string {
  if (!url) return "";
  const hash = url.indexOf("#");
  if (hash < 0) return "";
  return url
    .slice(hash + 1)
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export const route = (() => {
  const known = (id: string) => (id === "" || entryOf(id) ? id : "");
  const initial = known(routeOf(UrlScheme.url()));
  const value = signal(initial);
  UrlScheme.on("change", ({ url }) => value.set(known(routeOf(url))));
  UrlScheme.on("open", ({ url }) => value.set(known(routeOf(url))));
  return value;
})();

export function navigate(id: string): void {
  if (route() === id) return;
  route.set(id);
  try {
    UrlScheme.setUrl(id ? `#/${id}` : "#/", { history: "push" });
  } catch {
    // An address the browser refuses (no page of its own) leaves the route
    // working in memory; the site is still usable.
  }
}

function open(id: string) {
  navigate(id);
}

function ComponentPage(props: { entry: Entry }) {
  const Page = props.entry.Page;
  const side = () => Math.max(32, (windowSize().width - (wide() ? 248 : 0) - 900) / 2);
  return (
    <ScrollView style={{ flex: 1 }}>
      <View style={{ paddingVertical: 32, paddingLeft: side(), paddingRight: side(), gap: 22 }}>
        <Breadcrumb entry={props.entry} onHome={() => open("")} />
        <Page />
        <PrevNext entry={props.entry} onOpen={open} />
      </View>
    </ScrollView>
  );
}

/** One route, remounted when the route changes so its page and state are new. */
function RoutePage(props: { id: string }) {
  return (
    <Each of={[props.id]} key={(id) => id}>
      {(id) => {
        const entry = entryOf(id());
        return entry ? <ComponentPage entry={entry} /> : <NotFound />;
      }}
    </Each>
  );
}

function NotFound() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 10 }}>
      <Text style={{ fontSize: 22, fontWeight: 600 }}>{tr("Nothing here", "这里什么都没有")}</Text>
      <Text style={{ fontSize: 14, color: faint() }}>{t("back")}</Text>
    </View>
  );
}

function Shell() {
  const entry = () => entryOf(route());
  return (
    <View style={{ flex: 1, backgroundColor: page() }}>
      <Header onHome={() => open("")} showFrame={Boolean(entry())} />
      <View style={{ flex: 1, flexDirection: "row" }}>
        <If when={wide() && Boolean(entry())}>
          <Sidebar current={route()} onOpen={open} />
        </If>
        <View style={{ flex: 1 }}>
          <If when={route() === ""} else={<RoutePage id={route()} />}>
            <ScrollView style={{ flex: 1 }}>
              <Home onOpen={open} />
            </ScrollView>
          </If>
        </View>
      </View>
    </View>
  );
}

function App() {
  // The tab says where the reader is, and a shared link shows its title.
  effect(() => {
    const entry = entryOf(route());
    const title = entry ? `${nameOf(entry)} · Cupertino` : "Cupertino · Native Shell";
    void host.call("site.title", { title }).catch(() => {});
  });
  return (
    <Theme contrast={contrast()}>
      <Shell />
    </Theme>
  );
}

mount(App);
