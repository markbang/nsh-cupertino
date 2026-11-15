//! [`TabBar`]: iOS's bottom bar of filled icons and 10 pt labels.

use nsh_base::button;
use nsh_core::{AccessibilityRole, Haptic, prelude::*};

use crate::{
    icon::icon,
    tokens::{self, type_default},
};

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
                        .text_size(type_default::CAPTION2.size)
                        .line_height(type_default::CAPTION2.line_height)
                        .letter_spacing(type_default::CAPTION2.tracking)
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
