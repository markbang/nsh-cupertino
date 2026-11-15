//! [`Picker`]: iOS's wheel, snapping to its items, fading at the edges and
//! ticking with the selection.

use nsh_core::{AccessibilityRole, Haptic, element::SnapAlignment, geometry::point, prelude::*};

use crate::tokens::{self, radius, type_default};

/// One value of a [`Picker`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct PickerItem {
    /// The value the picker reports.
    pub value: SharedString,
    /// What the wheel shows.
    pub title: SharedString,
}

impl PickerItem {
    /// An item of `value`, titled `title`.
    pub fn new(value: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            title: title.into(),
        }
    }
}

/// The props of [`Picker`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct PickerProps {
    /// The items, top to bottom.
    #[prop(default)]
    pub items: Prop<Vec<PickerItem>>,
    /// The chosen item's `value` (controlled), or `null` for the first: the
    /// app owns it and sets it in `onChange`.
    pub value: Prop<Option<SharedString>>,
    /// The item's height in points (32 unless set).
    pub item_height: Prop<Option<f32>>,
    /// The wheel's height (216 unless set).
    pub height: Prop<Option<f32>>,
    /// What screen readers call it.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`Picker`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum PickerEvent {
    /// The wheel settled on another item: its `value` and its index.
    #[args(value, index)]
    Change(String, usize),
}

/// A wheel of values: drag to turn it, release and it snaps to the nearest
/// item, and the items above and below fade and shrink as iOS draws them.
///
/// Pressing an item scrolls it to the center. On a platform with haptics
/// each new selection ticks, and reduced motion turns the scroll into a
/// jump.
#[component]
pub fn Picker(props: PickerProps, cx: Scope<PickerEvent>) -> impl IntoElement {
    let items = props.items;
    let values = items.get_untracked();
    let count = values.len();
    let row = props.item_height.get_untracked().unwrap_or(32.0).max(24.0);
    let height = props.height.get_untracked().unwrap_or(216.0).max(row * 3.0);
    let pad = (height - row) * 0.5;
    let offset = animated_value(0.0);
    let initial = props
        .value
        .get_untracked()
        .and_then(|value| values.iter().position(|item| item.value == value))
        .unwrap_or(0);
    offset.set((initial as f32) * row);
    let scroller = element_ref();
    let last = stored(initial);
    let value_prop = props.value;
    let items_for_effect = items;
    let row_effect = row;
    let scroll_effect = scroller;

    // The app's value scrolls the wheel; a value already there changes
    // nothing.
    effect(move || {
        let Some(value) = value_prop.get() else {
            return;
        };
        let Some(index) = items_for_effect
            .get()
            .iter()
            .position(|item| item.value == value)
        else {
            return;
        };
        if index == last.get() {
            return;
        }
        last.replace(index);
        scroll_effect.scroll_to(point(px(0.0), px(index as f32 * row_effect)), true);
    });

    let mut wheel = view()
        .relative()
        .w_full()
        .h(px(height))
        .overflow_hidden()
        .role(AccessibilityRole::Adjustable)
        .label(
            props
                .label
                .get_untracked()
                .unwrap_or_else(|| "Picker".into()),
        );

    // The selected band, behind the items.
    wheel = wheel.child(
        view()
            .absolute()
            .left(px(12.0))
            .right(px(12.0))
            .top(px(pad))
            .h(px(row))
            .rounded(radius::ROW)
            .bg(tokens::tertiary_fill)
            .pointer_events(PointerEvents::None),
    );

    let tick = cx;
    let mut list = view().w_full().flex_col();
    for (index, item) in values.iter().enumerate() {
        let title = item.title.clone();
        let distance = offset.node().sub((index as f32 * row) / row).div(1.0);
        let scale =
            distance.interpolate(&[-2.0, -1.0, 0.0, 1.0, 2.0], &[0.72, 0.86, 1.0, 0.86, 0.72]);
        let opacity =
            distance.interpolate(&[-2.0, -1.0, 0.0, 1.0, 2.0], &[0.22, 0.45, 1.0, 0.45, 0.22]);
        let scroll_to = scroller;
        list = list.child(
            view()
                .w_full()
                .h(px(row))
                .items_center()
                .justify_center()
                .bind_scale(&scale)
                .bind_opacity(&opacity)
                .on_press(move || {
                    scroll_to.scroll_to(point(px(0.0), px(index as f32 * row)), true);
                })
                .child(
                    text(title)
                        .text_size(type_default::TITLE3.size)
                        .line_height(type_default::TITLE3.line_height)
                        .text_color(tokens::label)
                        .number_of_lines(1)
                        .truncate(),
                ),
        );
    }

    let settle = move |event: &Point<Points>| {
        let index = ((event.y.0.max(0.0) / row).round() as usize).min(count.saturating_sub(1));
        if index == last.get() {
            return;
        }
        last.replace(index);
        nsh_core::element::haptic(Haptic::Selection);
        if let Some(item) = values.get(index) {
            tick.emit(PickerEvent::Change(item.value.to_string(), index));
        }
    };

    let fade_from = tokens::system_background().opacity(0.96);
    let fade_to = tokens::system_background().opacity(0.0);

    wheel
        .child(
            scroll()
                .flex_1()
                .scrollbar(false)
                .snap_interval(px(row))
                .snap_alignment(SnapAlignment::Start)
                .scroll_value(&offset)
                .content_offset(point(px(0.0), px(initial as f32 * row)))
                .element_ref(&scroller)
                .on_scroll_end(settle)
                .child(
                    view()
                        .w_full()
                        .flex_col()
                        .pt(px(pad))
                        .pb(px(pad))
                        .child(list),
                ),
        )
        .child(
            view()
                .absolute()
                .left_0()
                .right_0()
                .top_0()
                .h(px(pad.max(24.0)))
                .bg_linear_to_b()
                .gradient_from(fade_from)
                .gradient_to(fade_to)
                .pointer_events(PointerEvents::None),
        )
        .child(
            view()
                .absolute()
                .left_0()
                .right_0()
                .bottom_0()
                .h(px(pad.max(24.0)))
                .bg_linear_to_t()
                .gradient_from(fade_from)
                .gradient_to(fade_to)
                .pointer_events(PointerEvents::None),
        )
        .child(
            view()
                .absolute()
                .left_0()
                .right_0()
                .top(px(pad))
                .h(tokens::separator_thickness)
                .bg(tokens::separator)
                .pointer_events(PointerEvents::None),
        )
        .child(
            view()
                .absolute()
                .left_0()
                .right_0()
                .top(px(pad + row))
                .h(tokens::separator_thickness)
                .bg(tokens::separator)
                .pointer_events(PointerEvents::None),
        )
}
