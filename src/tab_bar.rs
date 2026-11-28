//! [`TabBar`]: iOS's bottom bar of filled icons and 10 pt labels.

use nsh_base::button;
use nsh_core::{AccessibilityRole, Haptic, prelude::*};

use crate::{
    icon::icon,
    tokens::{self, type_default},
};

/// The tab label's size, in points. The reference's "Me" and "Activity" caps are 13.1 px tall at 1.791 px/pt
/// (7.3 pt; 10.4 pt on SF's 0.705 cap ratio): 10 pt gives 12.6 px and 11 pt gives 13.9 px, so 10 is the size.
const TAB_LABEL_SIZE: f32 = 10.0;

/// One tab of a [`TabBar`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct TabItem {
    /// The value the bar reports.
    pub value: SharedString,
    /// The label under the icon.
    pub title: SharedString,
    /// The icon above the label, by name ([`crate::icon::NAMES`]).
    #[prop(skip_none)]
    pub icon: Option<SharedString>,
    /// A badge over the icon: its text ("3", "99+"), or `"dot"` for a dot.
    #[prop(skip_none)]
    pub badge: Option<SharedString>,
}

impl TabItem {
    /// A tab of `value`, titled `title`.
    pub fn new(value: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            title: title.into(),
            icon: None,
            badge: None,
        }
    }

    /// Its icon.
    pub fn icon(mut self, icon: impl Into<SharedString>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    /// A badge over its icon: some text, or `"dot"`.
    pub fn badge(mut self, badge: impl Into<SharedString>) -> Self {
        self.badge = Some(badge.into());
        self
    }
}

/// The props of [`TabBar`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct TabBarProps {
    /// The tabs, in order.
    #[prop(default)]
    pub items: Prop<Vec<TabItem>>,
    /// The chosen tab's `value` (controlled): the app owns it and sets it in
    /// `onChange`.
    pub value: Prop<Option<SharedString>>,
    /// The chosen value at first, while `value` is not set.
    pub default_value: Prop<Option<SharedString>>,
    /// The bar blurs and tints what scrolls under it (on unless `false`);
    /// without a backdrop blur the tint alone carries it.
    pub blur: Prop<Option<bool>>,
    /// What screen readers call the bar.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`TabBar`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum TabBarEvent {
    /// Another tab was chosen: its value and index.
    #[args(value, index)]
    Change(String, usize),
}

/// A 49 pt bar at the bottom of the screen, over the safe area: a 25 pt icon
/// and a 10 pt label per tab, the chosen one in the tint, and a badge.
///
/// The bar is a material: a backdrop blur over a translucent tint, so the
/// page scrolls under it. Linux and GPUI draw no backdrop blur; there the
/// translucent tint alone keeps the bar readable (the same fallback iOS
/// uses when Reduce Transparency is on).
#[component]
pub fn TabBar(props: TabBarProps, cx: Scope<TabBarEvent>) -> impl IntoElement {
    let items = props.items;
    let values = items.get_untracked();
    let initial = props
        .value
        .get_untracked()
        .or(props.default_value.get_untracked())
        .and_then(|value| values.iter().position(|item| item.value == value))
        .unwrap_or(0);
    let selected = signal(initial);
    let value_prop = props.value;
    let items_effect = items;
    let index_effect = selected;
    effect(move || {
        if let Some(value) = value_prop.get()
            && let Some(index) = items_effect
                .get()
                .iter()
                .position(|item| item.value == value)
        {
            index_effect.set(index);
        }
    });
    let blur = props.blur.get_untracked().unwrap_or(true);

    let mut tabs = view().flex_row().flex_1().items_stretch();
    for (index, item) in values.iter().enumerate() {
        let value = item.value.clone();
        let title = item.title.clone();
        let icon_name = item.icon.clone();
        let badge = item.badge.clone();
        let badge_shown = item.badge.clone();
        let label = title.clone();
        tabs = tabs.child(
            button()
                .flex_1()
                .h(px(49.0))
                .flex_col()
                .items_center()
                .justify_center()
                .gap(px(2.0))
                .accessibility_label(label)
                .selected(move || selected.get() == index)
                .role(AccessibilityRole::Button)
                .on_press(move || {
                    if selected.get_untracked() == index {
                        return;
                    }
                    nsh_core::element::haptic(Haptic::Selection);
                    selected.set(index);
                    cx.emit(TabBarEvent::Change(value.to_string(), index));
                })
                .child(
                    view()
                        .relative()
                        .size(px(25.0))
                        .items_center()
                        .justify_center()
                        .child(
                            icon(
                                icon_name.as_deref().unwrap_or("circle.lefthalf.filled"),
                                25.0,
                            )
                            .text_color(move || {
                                if selected.get() == index {
                                    tokens::system_blue()
                                } else {
                                    tokens::system_gray()
                                }
                            }),
                        )
                        .child(when(
                            move || badge_shown.is_some(),
                            move || {
                                let badge = badge.clone().unwrap_or_default();
                                let dot = badge == "dot";
                                view()
                                    .absolute()
                                    .top(px(-3.0))
                                    .right(px(if dot { 2.0 } else { -10.0 }))
                                    .when(dot, |v| {
                                        v.size(px(9.0)).rounded_full().bg(tokens::system_red())
                                    })
                                    .when(!dot, |v| {
                                        v.w(px(20.0))
                                            .h(px(17.0))
                                            .px(px(5.0))
                                            .rounded_full()
                                            .items_center()
                                            .justify_center()
                                            .bg(tokens::system_red())
                                            .child(
                                                text(badge)
                                                    .text_size(px(11.0))
                                                    .line_height(px(13.0))
                                                    .font_weight(FontWeight(600))
                                                    .text_color(rgba(0xffff_ffff)),
                                            )
                                    })
                                    .into_element()
                            },
                        )),
                )
                .child(
                    text(title)
                        .text_size(px(TAB_LABEL_SIZE))
                        .line_height(type_default::CAPTION2.line_height)
                        .letter_spacing(tokens::tracking(type_default::CAPTION2))
                        .font_weight(FontWeight(500))
                        .text_color(move || {
                            if selected.get() == index {
                                tokens::system_blue()
                            } else {
                                tokens::system_gray()
                            }
                        })
                        .number_of_lines(1),
                ),
        );
    }

    let glass = if blur {
        Some(crate::glass::material_spec("regular", [0.0; 4]))
    } else {
        None
    };
    let mut bar = view().relative().w_full().flex_col().flex_none();
    match glass {
        Some(spec) => bar = bar.child(crate::glass::layer(spec, None)),
        None => {
            bar = bar.bg(move || {
                let dark = nsh_core::element::dark();
                tokens::materials::fill("regular", dark, false)
            });
        }
    }
    bar.child(
        view()
            .h(tokens::separator_thickness)
            .w_full()
            .bg(tokens::separator),
    )
    .child(
        view()
            .w_full()
            .h(px(49.0))
            .role(AccessibilityRole::Tablist)
            .label(props.label.get_untracked().unwrap_or_else(|| "Tabs".into()))
            .child(tabs),
    )
    .pb_safe_area()
}

/// The props of [`GlassTabBar`]: iOS 26's floating capsule at the bottom of the
/// screen, which minimizes as the content scrolls.
#[derive(Debug, Clone, PartialEq, Props)]
pub struct GlassTabBarProps {
    /// The tabs, in order.
    #[prop(default)]
    pub items: Prop<Vec<TabItem>>,
    /// The chosen tab's `value` (controlled).
    pub value: Prop<Option<SharedString>>,
    /// The chosen value at first, while `value` is not set.
    pub default_value: Prop<Option<SharedString>>,
    /// `"on-scroll-down"` (the default: minimize on the way down, expand on
    /// the way up), `"on-scroll-up"` (the other way round, for a transcript
    /// that rests at its end) or `"never"`.
    pub behavior: Prop<Option<SharedString>>,
    /// Where the page is scrolled: the bar reads its travel to minimize and
    /// expand (feed it from the page's `onScroll`). No offset, no minimizing.
    pub scroll_offset: Prop<Option<f32>>,
    /// Forces the bar minimized (or expanded) while set.
    pub minimized: Prop<Option<bool>>,
    /// Pins the minimise progress while set: 0 is the bar, 1 the pill, and the
    /// values between hold the morph there, with no spring; on the web the
    /// two-scale body's share follows it (1 − progress). The way to drive the
    /// morph by hand (a gesture the app tracks itself, a still of a middle
    /// frame); it overrides `minimized` and the scroll while set.
    pub morph: Prop<Option<f32>>,
    /// `"glass"` (the shader, the default), `"material"` (the blur-only fill
    /// of a platform without a GPU) or `"single-blur"` (the shader's own
    /// one-disc body, without the web's two-scale layers), for comparing them.
    pub material: Prop<Option<SharedString>>,
    /// What screen readers call the bar.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`GlassTabBar`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum GlassTabBarEvent {
    /// Another tab was chosen: its value and index.
    #[args(value, index)]
    Change(String, usize),
}

/// iOS 26's tab bar: an inset capsule of glass floating over the content, the
/// chosen tab in a capsule of its own, which minimizes to a small pill around
/// the chosen tab as the page scrolls down and expands as it scrolls back up.
///
/// The bar floats: 20 pt from the sides, 12 pt above the home indicator, 64 pt
/// tall, radius 32 — concentric with the screen's corners — so the page keeps
/// scrolling behind and *around* it. `behavior` is UIKit's
/// `UITabBarController.MinimizeBehavior`: the bar minimizes only when the app
/// asks for it, and always comes back at the top of the page.
#[component]
pub fn GlassTabBar(props: GlassTabBarProps, cx: Scope<GlassTabBarEvent>) -> impl IntoElement {
    const HEIGHT: f32 = 64.0;
    const INSET: f32 = 20.0;
    const LIFT: f32 = 12.0;
    // How long the body takes to pass between the two-scale layers and the
    // shader's own, in ms, linearly, as the bar minimises or expands. The two
    // bodies differ by up to 17 levels (dark, the morph stills at rest): over
    // 12 frames of 16.7 ms that is 1.4 levels a frame, half the 3-level budget
    // of a frame, the rest left to the silhouette's own motion (at most 1.35 a
    // frame in the one-disc recording, `tools/tab-bar-motion.mjs`).
    const HANDOVER_MS: f32 = 200.0;
    const TAB_ICON: f32 = 27.5;
    const PILL_ICON: f32 = 24.0;
    // The tab icon's centre above the pill's: the tab's column (icon, 2 pt gap,
    // CAPTION2's 13 pt line) is centred in the bar, the pill's icon alone. The
    // 6 pt lift moves both, so it cancels.
    const GLYPH_DY: f32 = TAB_ICON / 2.0 - (TAB_ICON + 2.0 + 13.0) / 2.0;

    let items = props.items;
    let values = items.get_untracked();
    let count = values.len().max(1);
    let initial = props
        .value
        .get_untracked()
        .or(props.default_value.get_untracked())
        .and_then(|value| values.iter().position(|item| item.value == value))
        .unwrap_or(0);
    let selected = signal(initial);
    let value_prop = props.value;
    let items_effect = items;
    let index_effect = selected;
    effect(move || {
        if let Some(value) = value_prop.get()
            && let Some(index) = items_effect
                .get()
                .iter()
                .position(|item| item.value == value)
        {
            index_effect.set(index);
        }
    });

    // The minimize state machine, ported from `liquid_glass_widgets`'
    // `GlassTabBarMinimizeController` (MIT): travel accumulated since the last
    // direction reversal, 20 pt down to minimize and 12 pt up to expand, and
    // always expanded at the top of the page.
    let minimized = signal(false);
    let progress = animated_value(0.0);
    let behavior = props
        .behavior
        .get_untracked()
        .unwrap_or_else(|| "on-scroll-down".into());
    let down_first = behavior.as_ref() != "on-scroll-up";
    let enabled = behavior.as_ref() != "never";
    let forced = props.minimized;
    let offset = props.scroll_offset;
    let pinned = props.morph;
    // The layers' share of the body: 1 expanded, 0 minimised, on its own clock.
    let carried = animated_value(1.0);
    let fade = carried;
    let accumulator = stored(0.0_f32);
    let baseline = stored(f32::MIN);
    let state = minimized;
    let animator = progress;
    effect(move || {
        if let Some(value) = pinned.get() {
            let value = value.clamp(0.0, 1.0);
            state.set(value >= 0.5);
            animator.set(value);
            fade.set(1.0 - value);
            return;
        }
        let wanted = match forced.get() {
            Some(value) => value,
            None if !enabled => false,
            None => {
                let now = offset.get().unwrap_or(0.0);
                if now <= 0.5 {
                    accumulator.replace(0.0);
                    baseline.replace(now);
                    false
                } else {
                    let previous = baseline.get();
                    baseline.replace(now);
                    if previous == f32::MIN || (now - previous).abs() > 600.0 {
                        accumulator.replace(0.0);
                        state.get()
                    } else {
                        let travel = accumulator.get()
                            + if down_first {
                                now - previous
                            } else {
                                previous - now
                            };
                        accumulator.replace(travel);
                        if travel >= 20.0 {
                            accumulator.replace(0.0);
                            true
                        } else if travel <= -12.0 {
                            accumulator.replace(0.0);
                            false
                        } else {
                            state.get()
                        }
                    }
                }
            }
        };
        if state.get() == wanted {
            return;
        }
        state.set(wanted);
        let target = if wanted { 1.0 } else { 0.0 };
        if reduce_motion() {
            animator.set(target);
            fade.set(1.0 - target);
        } else {
            animator.spring(target, crate::overlay::spring(0.78, 340.0));
            fade.timing(1.0 - target, HANDOVER_MS, Easing::Linear);
        }
    });

    let material = props.material.get_untracked();
    let glass = material.as_deref() != Some("material");
    let two_scale = glass && material.as_deref() != Some("single-blur");
    // Reduce Transparency: an opaque bar, no backdrop at all. Asked once, as
    // the bar is built (`glass::reduce_transparency`).
    let reduced = crate::glass::reduce_transparency();
    let anchor = move || (selected.get() as f32 + 0.5) / count as f32;
    // The pill's place follows the chosen tab: a spring slides it there when the
    // selection changes while the bar is minimised. The glass silhouette and
    // the pill's own box read the same value, so they can never disagree.
    let anchor_value = animated_value(anchor());
    let followed = stored(anchor());
    let slider = anchor_value;
    effect(move || {
        let wanted = anchor();
        if (followed.get() - wanted).abs() < 1e-4 {
            return;
        }
        followed.replace(wanted);
        if reduce_motion() {
            slider.set(wanted);
        } else {
            slider.spring(wanted, crate::overlay::spring(0.82, 460.0));
        }
    });
    let anchor_node = anchor_value.animated_node();
    // The silhouette morphs on the progress itself, as it always did: the body
    // passes to the shader on `carried`'s clock meanwhile, and the shader covers
    // the layers wherever the silhouette has left their box (`glass.rs`).
    let morph = progress.interpolate(&[0.0, 1.0], &[0.0, 1.0]);
    // The bar drops 6 pt as it minimises. On the web, with the two-scale body
    // (and not the opaque bar of Reduce Transparency), the shader draws the
    // drop inside its canvas, and the canvas and the layers stay where they
    // are: nsh redraws a shader a frame after the page moves, so a canvas that
    // moved would show its picture of the page, the cover over the layers
    // outside the glass, a frame late (up to 6.7 levels off on text, CI run
    // 45999666204). The shadow, the tabs and the pill drop themselves.
    let lift = progress.interpolate(&[0.0, 1.0], &[0.0, 6.0]);
    let web = matches!(nsh_core::element::os(), nsh_core::platform::Os::Web);
    let lowered = two_scale && web && !reduced;
    // The layers show, whole, while they carry any of the body.
    let layers_on = carried.interpolate(&[0.0, 0.001], &[0.0, 1.0]);
    let spec = crate::glass::GlassSpec::rounded(32.0)
        // Where the two-scale body does not draw (the native builds, increased
        // contrast, the minimised pill), the shader's own body: a bar over a
        // page of 14 pt rows needs a frosted backdrop, and at the material's
        // 5 pt the strokes stay legible. BAR_BLUR is the menu's blur.
        .blur(crate::tokens::glass::BAR_BLUR)
        .quality(crate::glass::GlassQuality::High)
        .minimized(&morph, anchor())
        .anchor(&anchor_node)
        .material_only(!glass)
        .two_scale(two_scale)
        .two_scale_amount(&carried.animated_node());
    let spec = if lowered { spec.lowered(&lift) } else { spec };

    // As in Cohub Mobile's `FloatingTabBar` (:409, :539-546), on the progress
    // both ways: the capsule goes first, the chosen label next, the other tabs
    // by 0.35; the chosen icon hands over to the pill's travelling glyph.
    let capsule_opacity = progress.interpolate(&[0.0, 0.12], &[1.0, 0.0]);
    let other_opacity = progress.interpolate(&[0.0, 0.35], &[1.0, 0.0]);
    let chosen_label_opacity = progress.interpolate(&[0.0, 0.3], &[1.0, 0.0]);
    let chosen_icon_opacity = progress.interpolate(&[0.0, 0.001], &[1.0, 0.0]);
    let mut tabs = view().flex_row().flex_1().items_center().px(px(4.0));
    for (index, item) in values.iter().enumerate() {
        let value = item.value.clone();
        let title = item.title.clone();
        let icon_name = item.icon.clone();
        let badge = item.badge.clone();
        let badge_shown = item.badge.clone();
        let label = title.clone();
        let shown = move || selected.get() == index;
        let chosen = animated_value(if index == initial { 1.0 } else { 0.0 });
        effect(move || chosen.set(if shown() { 1.0 } else { 0.0 }));
        let chosen = chosen.animated_node();
        let unchosen = chosen.mul(-1.0).add(1.0);
        let icon_opacity = chosen
            .mul(&chosen_icon_opacity)
            .add(&unchosen.mul(&other_opacity));
        let text_opacity = chosen
            .mul(&chosen_label_opacity)
            .add(&unchosen.mul(&other_opacity));
        let tab_icon = icon(
            icon_name.as_deref().unwrap_or("circle.lefthalf.filled"),
            TAB_ICON,
        )
        .text_color(move || {
            if shown() {
                tokens::system_blue()
            } else {
                tokens::secondary_label()
            }
        });
        tabs = tabs.child(
            button()
                .relative()
                .flex_1()
                .h(px(HEIGHT - 8.0))
                .rounded(px(26.0))
                .flex_col()
                .items_center()
                .justify_center()
                .gap(px(2.0))
                .accessibility_label(label)
                .selected(move || selected.get() == index)
                .role(AccessibilityRole::Button)
                .on_press(move || {
                    if selected.get_untracked() == index {
                        return;
                    }
                    nsh_core::element::haptic(Haptic::Selection);
                    selected.set(index);
                    cx.emit(GlassTabBarEvent::Change(value.to_string(), index));
                })
                .child(
                    view()
                        .absolute()
                        .inset_0()
                        .rounded(px(26.0))
                        .bg(move || {
                            if !shown() {
                                return rgba(0x0000_0000);
                            }
                            if nsh_core::element::dark() {
                                rgba(0xffff_ff24)
                            } else {
                                rgba(0xffff_ff99)
                            }
                        })
                        .bind_opacity(&capsule_opacity),
                )
                .child(
                    view()
                        .relative()
                        .size(px(TAB_ICON))
                        .items_center()
                        .justify_center()
                        .child(view().bind_opacity(&icon_opacity).child(tab_icon))
                        .child(when(
                            move || badge_shown.is_some(),
                            move || {
                                let badge = badge.clone().unwrap_or_default();
                                view()
                                    .absolute()
                                    .top(px(-4.0))
                                    .right(px(-8.0))
                                    .min_w(px(18.0))
                                    .h(px(18.0))
                                    .px(px(5.0))
                                    .rounded_full()
                                    .items_center()
                                    .justify_center()
                                    .bg(tokens::system_red())
                                    .child(
                                        text(badge)
                                            .text_size(px(11.0))
                                            .line_height(px(13.0))
                                            .font_weight(FontWeight(600))
                                            .text_color(rgba(0xffff_ffff)),
                                    )
                                    .bind_opacity(&text_opacity)
                            },
                        )),
                )
                .child(
                    text(title)
                        .bind_opacity(&text_opacity)
                        .text_size(px(TAB_LABEL_SIZE))
                        .line_height(type_default::CAPTION2.line_height)
                        .letter_spacing(tokens::tracking(type_default::CAPTION2))
                        .font_weight(FontWeight(500))
                        .text_color(move || {
                            if shown() {
                                tokens::system_blue()
                            } else {
                                tokens::secondary_label()
                            }
                        })
                        .number_of_lines(1),
                ),
        );
    }

    let expanded_opacity = progress.interpolate(&[0.0, 1.0], &[1.0, 0.0]);
    let minimized_opacity = progress.interpolate(&[0.0, 1.0], &[0.0, 1.0]);
    // The chosen tab's one glyph: from the first frame of the morph it is the
    // pill's, laid on the tab's icon (the tab centres sit 4 − 8·anchor pt off
    // anchor·W, inside the row's padding), and travels into the circle by
    // progress 0.45 (`FloatingTabBar` :539-546).
    let staying = progress.interpolate(&[0.0, 0.45], &[1.0, 0.0]);
    let glyph_dx = staying.mul(&anchor_node.mul(-8.0).add(4.0));
    let glyph_dy = staying.mul(GLYPH_DY);
    let glyph_scale = staying.mul(TAB_ICON / PILL_ICON - 1.0).add(1.0);
    let glyph_opacity = progress.interpolate(&[0.0, 0.001], &[0.0, 1.0]);
    // The disc shows only at the end, smoothstep over progress 0.75-1: before,
    // the shape is the glass's own shrinking silhouette. The opaque bar of
    // Reduce Transparency has no silhouette, so its disc fades in all the way.
    let disc_opacity = if reduced {
        minimized_opacity
    } else {
        progress.interpolate_with(
            &[0.75, 1.0],
            AnimationOutput::Numbers(vec![0.0, 1.0]),
            Interpolation {
                easing: Easing::Bezier(1.0 / 3.0, 0.0, 2.0 / 3.0, 1.0),
                ..Interpolation::default()
            },
        )
    };
    // One icon per tab, each shown only while that tab is chosen: the pill is a
    // picture of the live selection, not of the one the bar was built with.
    let mut glyph = view()
        .items_center()
        .justify_center()
        .bind_scale(&glyph_scale);
    for (index, item) in values.iter().enumerate() {
        let icon_name = item.icon.clone();
        glyph = glyph.child(when(
            move || selected.get() == index,
            move || {
                view()
                    .items_center()
                    .justify_center()
                    .child(
                        icon(
                            icon_name.as_deref().unwrap_or("circle.lefthalf.filled"),
                            PILL_ICON,
                        )
                        .text_color(tokens::system_blue()),
                    )
                    .into_element()
            },
        ));
    }
    let pill = view()
        .absolute()
        .inset_0()
        .items_center()
        .justify_center()
        .bind_opacity(&glyph_opacity)
        .bind_translate_x(&glyph_dx)
        .bind_translate_y(&glyph_dy)
        .child(glyph);
    let minimized_view = view()
        .absolute()
        .pointer_events(PointerEvents::None)
        .h(px(HEIGHT))
        .bottom_0()
        .left(move || percentage(anchor()))
        .translate_x(px(-25.0))
        .w(px(50.0))
        .items_center()
        .justify_center()
        .when(lowered, |v| v.bind_translate_y(&lift))
        // The pill is a picture of the chosen tab: a page-coloured disc with a
        // hairline and the iOS 27 shadow, so it reads as a surface on white
        // rows without its icon.
        .child(
            view()
                .absolute()
                .inset_0()
                .rounded_full()
                .border(tokens::hairline())
                .border_color(move || {
                    if nsh_core::element::dark() {
                        rgba(0xffff_ff1a)
                    } else {
                        rgba(0x3c3c_4314)
                    }
                })
                .bg(move || {
                    let page = tokens::system_background();
                    Hsla {
                        a: if reduced {
                            1.0
                        } else if nsh_core::element::dark() {
                            0.86
                        } else {
                            0.92
                        },
                        ..page
                    }
                })
                .shadow(vec![BoxShadow {
                    offset_x: px(0.0),
                    offset_y: px(5.0),
                    blur: px(12.0),
                    spread: px(0.0),
                    color: rgba(0x0000_001f).into(),
                    inset: false,
                }])
                .bind_opacity(&disc_opacity),
        )
        .child(pill);

    let shadow = view()
        .absolute()
        .inset_0()
        .rounded(px(32.0))
        .bg(rgba(0xffff_ff01))
        .shadow(vec![BoxShadow {
            offset_x: px(0.0),
            offset_y: px(7.0),
            blur: px(10.0),
            spread: px(0.0),
            color: rgba(0x0000_000a).into(),
            inset: false,
        }])
        .bind_opacity(&expanded_opacity)
        .when(lowered, |v| v.bind_translate_y(&lift));

    view()
        .absolute()
        .z_index(10)
        .left(px(INSET))
        .right(px(INSET))
        .bottom(px(nsh_core::element::safe_area().bottom.0 + LIFT))
        .h(px(HEIGHT))
        .when(!lowered, |v| v.bind_translate_y(&lift))
        .role(AccessibilityRole::Tablist)
        .label(props.label.get_untracked().unwrap_or_else(|| "Tabs".into()))
        .child(shadow)
        .when(reduced, |bar| {
            // Opaque: the shade the bar has over an empty page
            // (`tokens::bar::reduced_level`), a hairline for its edge.
            bar.child(
                view()
                    .absolute()
                    .inset_0()
                    .rounded(px(32.0))
                    .bg(move || grey(tokens::bar::reduced_level(nsh_core::element::dark())))
                    .border(tokens::hairline())
                    .border_color(move || {
                        if nsh_core::element::dark() {
                            rgba(0xffff_ff1a)
                        } else {
                            rgba(0x3c3c_4314)
                        }
                    })
                    .bind_opacity(&expanded_opacity),
            )
        })
        .when(!reduced, |bar| {
            // The two-scale layers go right under the shader, which draws the
            // tint and the rim over them.
            bar.child(crate::glass::two_scale_layers(two_scale, 32.0, layers_on))
                .child(crate::glass::layer(spec, None))
        })
        .child(
            view()
                .absolute()
                .left_0()
                .right_0()
                .bottom_0()
                .h(px(HEIGHT))
                .flex_row()
                .items_center()
                .child(tabs)
                .when(lowered, |v| v.bind_translate_y(&lift)),
        )
        .child(minimized_view)
}

/// An opaque grey of `level` (0–255, sRGB-encoded).
fn grey(level: f32) -> Hsla {
    let v = level.round().clamp(0.0, 255.0) as u32;
    rgba((v << 24) | (v << 16) | (v << 8) | 0xff).into()
}
