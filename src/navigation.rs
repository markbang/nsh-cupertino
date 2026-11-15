//! [`NavigationBar`] and [`NavPage`]: the bar at the top of a page, with a
//! back button, a title that can be large or compact, and trailing actions.

use std::rc::Rc;

use nsh_base::button;
use nsh_core::{
    AccessibilityRole, Haptic, HapticImpact, element::Children, geometry::point, prelude::*,
};

use crate::{
    icon::icon_stroke,
    refresh::pull_indicator,
    tokens::{self, metrics, motion, type_default},
};

/// The props of [`NavigationBar`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct NavigationBarProps {
    /// The title in the bar. With a `large_title`, it is the compact title
    /// that takes over as the large one scrolls away.
    pub title: Prop<Option<SharedString>>,
    /// A large title below the bar, 34 pt bold.
    pub large_title: Prop<Option<SharedString>>,
    /// The back button's label ("Back"). Leave it out for no back button.
    pub back: Prop<Option<SharedString>>,
    /// Actions at the trailing edge: buttons, an icon.
    pub trailing: Prop<Children>,
    /// 0 at the top of the page, 1 once content has scrolled under the bar:
    /// fades the compact title and the hairline in (`NavPage` drives this from
    /// its scroll position).
    #[prop(default)]
    pub collapsed: Prop<f32>,
    /// `"opaque"` (the default) or a material (`"regular"`, `"thin"`,
    /// `"ultra-thin"`, `"thick"`, `"chrome"`): a translucent bar that blurs what
    /// scrolls under it, as the floating layer does.
    pub material: Prop<Option<SharedString>>,
}

/// The events of a [`NavigationBar`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum NavigationBarEvent {
    /// The back button was pressed.
    Back,
}

/// The bar of a page: a back button, a title, trailing actions and, when
/// asked for, a large title below it.
///
/// Use it above content you lay out yourself. For a scrolling page, [`NavPage`]
/// ties the large title's collapse to the scroll offset.
#[component]
pub fn NavigationBar(props: NavigationBarProps, cx: Scope<NavigationBarEvent>) -> impl IntoElement {
    let collapsed = props.collapsed;
    let large = props.large_title;
    let material = props.material.get_untracked();
    let bar = bar(
        props.title,
        props.back,
        props.trailing,
        Fade::Reactive(Some(Rc::new(move || collapsed.get().clamp(0.0, 1.0)))),
        move || cx.emit(NavigationBarEvent::Back),
        None,
        material.clone(),
    );
    bar.child(view().when(large.get_untracked().is_some(), |v| {
        v.px(px(metrics::NAV_EDGE))
            .pb(px(8.0))
            .min_h(px(metrics::LARGE_TITLE_HEIGHT))
            .justify_end()
            .child(large_title_text(&large))
    }))
}

/// The props of [`NavPage`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct NavPageProps {
    /// The title in the bar.
    pub title: Prop<Option<SharedString>>,
    /// The large title that scrolls away below the bar: the page's heading.
    pub large_title: Prop<Option<SharedString>>,
    /// The back button's label; leave it out for no back button.
    pub back: Prop<Option<SharedString>>,
    /// A trailing action's text in the tint color ("Done", "Edit"), reported
    /// by `onTrailing`.
    pub trailing: Prop<Option<SharedString>>,
    /// The page's rows, inside the scrolling view.
    pub children: Prop<Children>,
    /// The background behind the content (`system-grouped-background` unless
    /// set).
    pub background: Prop<Option<SharedString>>,
    /// `"opaque"` (the default) or a material (`"regular"`, `"thin"`,
    /// `"ultra-thin"`, `"thick"`, `"chrome"`). A material makes the bar float
    /// over the content, which scrolls under it and shows through the blur.
    pub material: Prop<Option<SharedString>>,
    /// A pull to refresh runs: the indicator below the bar stays out, turning.
    pub refreshing: Prop<Option<bool>>,
}

/// The events of a [`NavPage`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum NavPageEvent {
    /// The back button was pressed.
    Back,
    /// The trailing action was pressed.
    Trailing,
    /// The user pulled the page past its top and let go.
    Refresh,
}

/// A whole page: a navigation bar over a scrolling view whose large title
/// scrolls away, the compact title and a hairline fading in as it goes.
///
/// The collapse runs on the scroll offset natively: no frame of the scroll
/// reaches Rust. Pressing the title scrolls back to the top, as iOS does.
#[component]
pub fn NavPage(props: NavPageProps, cx: Scope<NavPageEvent>) -> impl IntoElement {
    let offset = animated_value(0.0);
    let floating_bar = props
        .material
        .get_untracked()
        .as_deref()
        .is_some_and(|name| name != "opaque");
    // The large title's block, and the last 10 pt of it over which the compact
    // title and the hairline take over. A floating bar sits over the content,
    // so its title is under the bar 44 pt earlier.
    let over = metrics::LARGE_TITLE_HEIGHT;
    let (start, end) = if floating_bar {
        (metrics::NAV_HEIGHT, metrics::NAV_HEIGHT + 10.0)
    } else {
        (over - 10.0, over)
    };
    let fade = offset.interpolate(&[start, end], &[0.0, 1.0]);
    let background = props.background;
    let scroll_ref = element_ref();
    let to_top = scroll_ref;
    let trailing = props.trailing;
    let floating = floating_bar;
    let large = props.large_title;
    let bar_view = bar(
        props.title,
        props.back,
        trailing_button(trailing, move || cx.emit(NavPageEvent::Trailing)),
        Fade::Animated(fade),
        move || cx.emit(NavPageEvent::Back),
        Some(Rc::new(move || {
            to_top.scroll_to(point(px(0.0), px(0.0)), true)
        })),
        props.material.get_untracked(),
    );
    let show = animated_value(0.0);
    let refreshing = props.refreshing;
    let shown = show;
    effect(move || {
        if refreshing.get().unwrap_or(false) {
            shown.spring(1.0, crate::overlay::spring(0.82, 300.0));
        } else {
            shown.spring(0.0, crate::overlay::spring(0.9, 260.0));
        }
    });
    let indicator = pull_indicator(&offset, &show, None).top(px(if floating {
        metrics::NAV_HEIGHT
    } else {
        0.0
    }));
    let page = view()
        .relative()
        .flex_1()
        .child(
            scroll()
                .flex_1()
                .bounces(true)
                .scroll_value(&offset)
                .element_ref(&scroll_ref)
                .on_scroll_end(move |at: &Point<Points>| {
                    if at.y.0 <= -100.0 && !refreshing.get_untracked().unwrap_or(false) {
                        nsh_core::element::haptic(Haptic::Impact(HapticImpact::Light));
                        cx.emit(NavPageEvent::Refresh);
                    }
                })
                .child(
                    view()
                        .w_full()
                        // A floating bar sits over the content: the page starts below it.
                        .when(floating, |v| v.pt(px(metrics::NAV_HEIGHT)))
                        .gap(px(metrics::SECTION_TOP))
                        .pb_safe_area_plus(px(24.0))
                        .child(view().when(large.get_untracked().is_some(), |v| {
                            v.px(px(metrics::NAV_EDGE))
                                .h(px(over))
                                .justify_end()
                                .child(large_title_text(&large))
                        }))
                        .child(props.children),
                ),
        )
        .child(indicator);
    view()
        .flex_1()
        .pt_safe_area()
        .bg(move || match background.get().as_deref() {
            Some(name) => tokens::system(name),
            None => tokens::system_grouped_background(),
        })
        .when(!floating, |v| v.child(bar_view.clone()))
        .child(page)
        .when(floating, |v| {
            v.child(view().absolute().left_0().right_0().top_0().child(bar_view))
        })
}

/// How a bar's compact title and hairline come in.
#[derive(Clone)]
enum Fade {
    /// From a value the app passes (`NavigationBar`'s `collapsed`).
    Reactive(Option<Rc<dyn Fn() -> f32>>),
    /// From the scroll offset (`NavPage`).
    Animated(AnimatedNode),
}

fn apply<E: Element>(fade: Fade, element: E) -> E {
    match fade {
        Fade::Reactive(Some(opacity)) => element.opacity(move || opacity()),
        Fade::Reactive(None) => element.opacity(1.0),
        Fade::Animated(node) => element.bind_opacity(&node),
    }
}

fn bar(
    title: Prop<Option<SharedString>>,
    back: Prop<Option<SharedString>>,
    trailing: impl IntoElement,
    fade: Fade,
    on_back: impl Fn() + 'static,
    on_title: Option<Rc<dyn Fn()>>,
    material: Option<SharedString>,
) -> View {
    let label = back.get_untracked();
    // A material is a translucent fill over a blur: glass on the floating layer
    // only (HIG, materials.md).
    let glass = material
        .as_deref()
        .is_some_and(|name| name != "opaque")
        .then(|| material.clone().unwrap_or_default());
    let mut node = view()
        .relative()
        .min_h(px(metrics::NAV_HEIGHT))
        .flex_row()
        .items_center()
        .gap(px(8.0))
        .px(px(metrics::NAV_EDGE))
        .when_some(glass.clone(), |v, name| {
            let name_for_bg = name.clone();
            v.bg(move || {
                let dark = nsh_core::element::dark();
                tokens::materials::fill(&name_for_bg, dark, false)
            })
            .backdrop_blur(tokens::materials::blur(&name))
        });

    if let Some(label) = label {
        let pressing_label = label.clone();
        node = node.child(
            button()
                .min_h(px(44.0))
                .flex_row()
                .items_center()
                .gap(px(6.0))
                .pr(px(6.0))
                .ml(px(-8.0))
                .pl(px(8.0))
                .rounded(px(8.0))
                .active(|s| s.opacity(motion::PRESS_OPACITY))
                .transition_opacity()
                .duration(motion::QUICK_MS)
                .accessibility_label(pressing_label)
                .role(AccessibilityRole::Button)
                .on_press(on_back)
                .child(icon_stroke("chevron.left", 20.0, 2.6).text_color(tokens::system_blue))
                .child(
                    text(label)
                        .text_size(type_default::BODY.size)
                        .line_height(type_default::BODY.line_height)
                        .letter_spacing(type_default::BODY.tracking)
                        .text_color(tokens::system_blue)
                        .max_w(px(120.0))
                        .truncate(),
                ),
        );
    }

    let compact = title;
    let compact_text = text(move || compact.get().unwrap_or_default())
        .text_size(type_default::HEADLINE.size)
        .line_height(type_default::HEADLINE.line_height)
        .letter_spacing(type_default::HEADLINE.tracking)
        .font_weight(FontWeight(type_default::HEADLINE.weight))
        .text_color(tokens::label)
        .truncate();
    let center = view()
        .flex_1()
        .items_center()
        .justify_center()
        .child(apply(fade.clone(), compact_text));
    node = node.child(match on_title {
        Some(press) => center.on_press(move || press()).into_element(),
        None => center.into_element(),
    });

    node.child(
        view()
            .flex_row()
            .items_center()
            .gap(px(16.0))
            .child(trailing),
    )
    .child(apply(
        fade,
        view()
            .absolute()
            .left_0()
            .right_0()
            .bottom_0()
            .h(tokens::separator_thickness)
            .bg(tokens::separator),
    ))
}

fn trailing_button(
    trailing: Prop<Option<SharedString>>,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    let label = trailing.get_untracked();
    let on_press = Rc::new(on_press);
    view().child(when(
        move || trailing.get().is_some(),
        move || {
            let text_label = label.clone().unwrap_or_default();
            let press = on_press.clone();
            button()
                .min_h(px(44.0))
                .px(px(8.0))
                .ml(px(8.0))
                .items_center()
                .justify_center()
                .rounded(px(8.0))
                .accessibility_label(text_label.clone())
                .role(AccessibilityRole::Button)
                .active(|s| s.opacity(motion::PRESS_OPACITY))
                .on_press(move || press())
                .child(
                    text(text_label)
                        .text_size(type_default::BODY.size)
                        .line_height(type_default::BODY.line_height)
                        .text_color(tokens::system_blue),
                )
        },
    ))
}

fn large_title_text(title: &Prop<Option<SharedString>>) -> impl IntoElement {
    let title = *title;
    text(move || title.get().unwrap_or_default())
        .text_size(type_default::LARGE_TITLE.size)
        .line_height(type_default::LARGE_TITLE.line_height)
        .letter_spacing(type_default::LARGE_TITLE.tracking)
        .font_weight(FontWeight(type_default::LARGE_TITLE.weight))
        .text_color(tokens::label)
        .role(AccessibilityRole::Header)
        .accessibility_level(1)
        .number_of_lines(2)
}
