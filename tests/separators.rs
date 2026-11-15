//! Every row but the last of a group draws a hairline at least one device
//! pixel tall, whatever the row shows (a plain row, a subtitle, a leading
//! icon, an accessory, a selection, a destructive action, a disabled row),
//! at 1x and 2x displays. At 0.33 pt a 1x display rounds the line away,
//! which is what left rows without one.

use nsh_core::{Size, element::Root, geometry::px, prelude::*};
use nsh_cupertino::{list, list_tile, section, theme};
use nsh_engine::EngineConfig;
use nsh_testing::Headless;

#[component]
fn Rows() -> impl IntoElement {
    theme().child(
        list()
            .scroll(false)
            .child(
                section()
                    .header("Every row type")
                    .child(list_tile().title("Plain").accessory("none").separator(true))
                    .child(
                        list_tile()
                            .title("Subtitle")
                            .subtitle("A second line")
                            .accessory("none")
                            .separator(true),
                    )
                    .child(
                        list_tile()
                            .title("Destructive")
                            .destructive(true)
                            .accessory("none")
                            .separator(true),
                    )
                    .child(
                        list_tile()
                            .title("Disabled")
                            .disabled(true)
                            .accessory("none")
                            .separator(true),
                    )
                    .child(
                        list_tile()
                            .title("Leading icon")
                            .leading("bell")
                            .accessory("none")
                            .separator(true),
                    )
                    .child(
                        list_tile()
                            .title("Chevron")
                            .accessory("chevron")
                            .separator(true),
                    )
                    .child(
                        list_tile()
                            .title("Checkmark")
                            .accessory("checkmark")
                            .checked(true)
                            .separator(true),
                    )
                    .child(list_tile().title("Last").accessory("none").separator(false)),
            )
            .child(
                section().header("A group of one").child(
                    list_tile()
                        .title("Alone")
                        .accessory("none")
                        .separator(false),
                ),
            ),
    )
}

fn separators(dpr: f32) -> Vec<nsh_testing::LayoutNode> {
    let mut config = EngineConfig::new(Root::of::<Rows>());
    config.viewport = Size::new(px(390.0), px(844.0));
    config.environment.pixel_ratio = dpr;
    let mut app = Headless::start(config).expect("the page starts");
    app.wait_for("text:Plain").expect("the page shows its rows");
    app.screen()
        .layout_nodes()
        .into_iter()
        .filter(|node| node.test_id.as_deref() == Some("separator"))
        .collect()
}

#[test]
fn every_non_last_row_has_a_separator_at_1x_and_2x() {
    for dpr in [1.0, 2.0, 3.0] {
        let found = separators(dpr);
        assert_eq!(found.len(), 7, "at {dpr}x: {}", found.len());
        for node in &found {
            assert!(!node.hidden, "at {dpr}x: a hidden separator");
            assert!(
                node.bounds.size.height.0 >= 1.0 / dpr - 1e-4,
                "at {dpr}x: {} pt thin is under a device pixel",
                node.bounds.size.height.0
            );
            assert!(
                node.bounds.size.width.0 > 100.0,
                "at {dpr}x: the separator spans {} pt",
                node.bounds.size.width.0
            );
        }
        let mut insets: Vec<f32> = found.iter().map(|node| node.bounds.origin.x.0).collect();
        insets.sort_by(f32::total_cmp);
        insets.dedup();
        assert!(
            insets.len() >= 2,
            "at {dpr}x: every separator starts at the same x ({insets:?}); a leading icon must inset it"
        );
    }
}
