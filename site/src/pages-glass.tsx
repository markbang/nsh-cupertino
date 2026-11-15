// Liquid Glass: the material of the floating layer, with the site's own switch
// between the shader and the fallback it stands in for.
import { type JSX, signal, Text, token, View } from "nsh";
import { Button, Glass, GlassButton, GlassGroup, List, ListTile, NavPage, Section, Sheet } from "cupertino";
import { API } from "./api";
import { tr } from "./i18n";
import { liquidGlass } from "./prefs";
import { DemoPage, page, surface } from "./ui";

const api = API.glass ?? [];

/** Solid blocks, not a gradient: a web page's backdrop picture is painted from
    the views themselves, so what refracts has to be drawn. */
function Bands(props: { height: number }) {
  const colors = ["#1d4ed8", "#f5f5f7", "#0f766e", "#f5f5f7", "#b91c1c", "#f5f5f7"];
  return (
    <View style={{ flexDirection: "row", height: props.height }}>
      <Each of={colors} key={(color) => color}>
        {(color) => <View style={{ flex: 1, height: props.height, backgroundColor: color() }} />}
      </Each>
    </View>
  );
}

/** The material, or the fill and blur a platform without a GPU draws. */
function Sheet_(props: { shape?: string; variant?: string; radius?: number; children?: JSX.Element; style?: object }) {
  if (liquidGlass()) {
    return (
      <Glass
        shape={props.shape ?? "rounded"}
        variant={props.variant ?? "regular"}
        radius={props.radius ?? 14}
        style={props.style ?? { padding: 14 }}
      >
        {props.children}
      </Glass>
    );
  }
  return (
    <View class="bg-material-regular backdrop-blur-xl" style={props.style ?? { padding: 14, borderRadius: props.radius ?? 14 }}>
      {props.children}
    </View>
  );
}

function SurfacesPage() {
  return (
    <DemoPage
      title={tr("Liquid Glass", "液态玻璃")}
      blurb={tr(
        "Apple's iOS 26 material: the backdrop is read, bent through the rim of the shape, blurred and tinted, and a specular rim follows the light. The site's settings switch shows the fallback a platform without a GPU draws.",
        "Apple iOS 26 的材质：读取背景，经形状边缘弯折、模糊并着色，高光环跟随光照。站点设置里的开关可切换为无 GPU 时的回退材质。",
      )}
      api={api}
      variants={[
        {
          id: "surfaces",
          title: tr("Surfaces", "表面"),
          code: `import { Glass } from "cupertino";

<Glass variant="regular" radius={14} style={{ padding: 14 }}>
  <Text>regular</Text>
</Glass>`,
          view: () => (
            <View style={{ ...pageStyle(), padding: 16, gap: 14 }}>
              <Bands height={120} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Sheet_>
                    <Text style={{ fontSize: 15, fontWeight: 600, color: token("label") }}>regular</Text>
                  </Sheet_>
                </View>
                <View style={{ flex: 1 }}>
                  <Sheet_ variant="clear">
                    <Text style={{ fontSize: 15, fontWeight: 600, color: token("label") }}>clear</Text>
                  </Sheet_>
                </View>
                <View style={{ flex: 1 }}>
                  <Sheet_ variant="thick">
                    <Text style={{ fontSize: 15, fontWeight: 600, color: token("label") }}>thick</Text>
                  </Sheet_>
                </View>
              </View>
              <NavPage title={tr("Under the bar", "栏之下")} material="regular">
                <List scroll={false}>
                  <Section header={tr("The bar", "栏")} footer={tr("Scroll: the rows go under the glass and the lens follows them.", "滚动：行从玻璃下经过，镜头随之变化。")}>
                    <Bands height={90} />
                    <ListTile title={tr("Row one", "第一行")} subtitle={tr("Under the bar", "栏之下")} accessory="none" separator />
                    <ListTile title={tr("Row two", "第二行")} subtitle={tr("Under the bar", "栏之下")} accessory="none" separator={false} />
                  </Section>
                </List>
              </NavPage>
            </View>
          ),
        },
        {
          id: "button",
          title: tr("Button", "按钮"),
          code: `import { GlassButton } from "cupertino";

<GlassButton icon="square.and.pencil" label="Compose" onPress={compose} />`,
          view: () => (
            <View style={{ ...pageStyle(), padding: 16, gap: 14 }}>
              <Bands height={100} />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <GlassButton icon="square.and.pencil" label={tr("Compose", "撰写")} />
                <GlassButton icon="trash" label={tr("Delete", "删除")} />
                <GlassButton icon="paperplane" title={tr("Send", "发送")} />
              </View>
              <Text style={{ fontSize: 13, color: token("secondary-label") }}>
                {tr(
                  "A press springs the lens, widens the specular rim and squashes the capsule; Reduce Motion keeps the values and drops the springs.",
                  "按压会弹动镜头、扩散高光环并压缩胶囊；降低动态效果时保留数值、去掉弹簧。",
                )}
              </Text>
            </View>
          ),
        },
        {
          id: "group",
          title: tr("Group", "组合"),
          code: `import { GlassGroup } from "cupertino";

<GlassGroup shapes={[a, b]} mergedShapes={one} merged={merged()} spacing={26} />`,
          view: () => {
            const merged = signal(false);
            return (
              <View style={{ ...pageStyle(), padding: 16, gap: 14 }}>
                <Bands height={80} />
                <View style={{ height: 120 }}>
                  <GlassGroup
                    shapes={[
                      { x: 40, y: 28, width: 64, height: 64, radius: -2 },
                      { x: 116, y: 28, width: 64, height: 64, radius: -2 },
                    ]}
                    mergedShapes={[
                      { x: 60, y: 28, width: 100, height: 64, radius: -1 },
                      { x: 60, y: 28, width: 100, height: 64, radius: -1 },
                    ]}
                    merged={merged()}
                    spacing={26}
                  />
                </View>
                <Button title={tr("Merge the two shapes", "合并两个形状")} variant="tinted" onPress={() => merged.set(!merged())} />
                <Text style={{ fontSize: 13, color: token("secondary-label") }}>
                  {tr(
                    "One material over two rects, fused with a smooth neck inside the spacing: the crate's reading of Apple's GlassEffectContainer.",
                    "一个材质覆盖两个矩形，在间距范围内以平滑颈部融合：本库对 Apple GlassEffectContainer 的理解。",
                  )}
                </Text>
              </View>
            );
          },
        },
        {
          id: "sheet",
          title: tr("Sheet", "Sheet"),
          code: `import { Sheet } from "cupertino";

<Sheet open={open()} title="Filters" trailing="Done">…</Sheet>`,
          view: () => {
            const open = signal(true);
            return (
              <View style={pageStyle()}>
                <Bands height={300} />
                <View style={{ padding: 16 }}>
                  <Button title={tr("Open the sheet", "打开 sheet")} variant="tinted" onPress={() => open.set(true)} />
                </View>
                <Sheet open={open()} title={tr("Liquid Glass", "液态玻璃")} trailing="Done" onOpenChange={(event: { open: boolean }) => open.set(event.open)} onTrailing={() => open.set(false)}>
                  <List scroll={false}>
                    <Section header={tr("A sheet of glass", "玻璃 sheet")} footer={tr("The sheet carries text, so it uses the thick variant.", "sheet 承载文字，因此使用 thick 变体。")}>
                      <Bands height={80} />
                      <ListTile title={tr("Thick glass", "厚玻璃")} subtitle={tr("14 pt corners, top only", "仅顶部 14 pt 圆角")} accessory="none" separator={false} />
                    </Section>
                  </List>
                </Sheet>
              </View>
            );
          },
        },
      ]}
    />
  );
}

const pageStyle = () => ({ flex: 1, backgroundColor: page() });

export const glassPages = [{ id: "glass", Page: SurfacesPage }];
