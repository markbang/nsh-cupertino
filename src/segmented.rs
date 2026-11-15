//! [`SegmentedControl`]: iOS's sliding choice between a few values.

use nsh_base::button;
use nsh_core::{AccessibilityRole, Haptic, prelude::*};

use crate::{
    overlay::spring,
    tokens::{self, type_default},
};

/// One segment of a [`SegmentedControl`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct SegmentItem {
    /// The value the control reports.
    pub value: SharedString,
    /// What the segment says.
    pub title: SharedString,
}

impl SegmentItem {
    /// A segment of `value`, titled `title`.
    pub fn new(value: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            value: value.into(),
            title: title.into(),
        }
    }
}

/// The props of [`SegmentedControl`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SegmentedControlProps {
    /// The segments, two to five, in order.
    #[prop(default)]
    pub items: Prop<Vec<SegmentItem>>,
    /// The chosen segment's `value` (controlled): the app owns it and sets
    /// it in `onChange`.
    pub value: Prop<Option<SharedString>>,
    /// The chosen value at first, while `value` is not set.
    pub default_value: Prop<Option<SharedString>>,
    /// What screen readers call the group.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`SegmentedControl`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SegmentedControlEvent {
    /// A segment was chosen, or the focus moved to one with the arrow keys:
    /// its value and index.
    #[args(value, index)]
    Change(String, usize),
}

const TRACK_HEIGHT: f32 = 32.0;
const TRACK_PADDING: f32 = 2.0;
const CORNER: f32 = 9.0;

/// A 32 pt track (a 50 pt target) whose white thumb slides to the chosen
/// segment over the design system's spring, with a haptic tick.
///
/// The segments are buttons: Tab reaches them, Return activates one. With
/// reduced motion the thumb jumps.
#[component]
pub fn SegmentedControl(
    props: SegmentedControlProps,
    cx: Scope<SegmentedControlEvent>,
) -> impl IntoElement {
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
    let width = signal(0.0_f32);
    let segment = (width.get() - TRACK_PADDING * 2.0) / count as f32;
    let x = animated_value(initial as f32 * segment);
    let value_prop = props.value;
    let items_effect = items;
    let index_effect = selected;
    let selected_for_slide = selected;
    let x_effect = x;
    let width_effect = width;
    let count_effect = count;
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
    effect(move || {
        let segment = (width_effect.get() - TRACK_PADDING * 2.0) / count_effect as f32;
        x_effect.spring(
            selected_for_slide.get() as f32 * segment,
            spring(0.9, 340.0),
        );
    });

    let mut segments = view()
        .flex_row()
        .flex_1()
        .h(px(TRACK_HEIGHT - TRACK_PADDING * 2.0));
    for (index, item) in values.iter().enumerate() {
        let title = item.title.clone();
        let value = item.value.clone();
        let press_index = index;
        segments = segments.child(
            button()
                .flex_1()
                .h_full()
                .items_center()
                .justify_center()
                .rounded(px(CORNER - 2.0))
                .accessibility_label(title.clone())
                .selected(move || selected.get() == press_index)
                .role(AccessibilityRole::Button)
                .on_press(move || {
                    if selected.get_untracked() == press_index {
                        return;
                    }
                    nsh_core::element::haptic(Haptic::Selection);
                    selected.set(press_index);
                    cx.emit(SegmentedControlEvent::Change(
                        value.to_string(),
                        press_index,
                    ));
                })
                .child(
                    text(title)
                        .text_size(type_default::SUBHEADLINE.size)
                        .line_height(type_default::SUBHEADLINE.line_height)
                        .font_weight(FontWeight(400))
                        .style_when(
                            move || selected.get() == index,
                            |s| s.font_weight(FontWeight(600)),
                        )
                        .text_color(move || {
                            if selected.get() == index {
                                tokens::label()
                            } else {
                                tokens::secondary_label()
                            }
                        })
                        .number_of_lines(1)
                        .truncate(),
                ),
        );
    }

    view()
        .min_h(px(50.0))
        .w_full()
        .justify_center()
        .role(AccessibilityRole::Tablist)
        .label(
            props
                .label
                .get_untracked()
                .unwrap_or_else(|| "Segments".into()),
        )
        .child(
            view()
                .relative()
                .w_full()
                .h(px(TRACK_HEIGHT))
                .p(px(TRACK_PADDING))
                .rounded(px(CORNER))
                .bg(tokens::tertiary_fill)
                .on_layout(move |bounds: &Bounds<Points>| {
                    width.set(bounds.size.width.0);
                    let segment = (bounds.size.width.0 - TRACK_PADDING * 2.0) / count as f32;
                    x.set(selected.get_untracked() as f32 * segment);
                })
                .child(
                    view()
                        .absolute()
                        .left(px(TRACK_PADDING))
                        .top(px(TRACK_PADDING))
                        .bottom(px(TRACK_PADDING))
                        .w(
                            move || {
                                px(((width.get() - TRACK_PADDING * 2.0) / count as f32).max(0.0))
                            },
                        )
                        .rounded(px(CORNER - 2.0))
                        .bg(tokens::secondary_system_background)
                        .shadow([nsh_core::BoxShadow {
                            offset_y: px(1.0),
                            blur: px(4.0),
                            color: rgba(0x0000001f).into(),
                            ..nsh_core::BoxShadow::default()
                        }])
                        .bind_translate_x(&x)
                        .pointer_events(PointerEvents::None),
                )
                .child(segments),
        )
}
