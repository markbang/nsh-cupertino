//! [`Slider`]: iOS's 28 pt thumb on a tinted track, with tick marks.

use nsh_base::{SliderValue, slider as base_slider};
use nsh_core::prelude::*;

use crate::tokens;

/// The props of a [`Slider`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SliderProps {
    /// The value (controlled): the app owns it and sets it in `onChange`.
    pub value: Prop<Option<f32>>,
    /// The value at first, while `value` is not set.
    pub default_value: Prop<Option<f32>>,
    /// The smallest value (0 unless set).
    pub min: Prop<Option<f32>>,
    /// The largest value (1 unless set).
    pub max: Prop<Option<f32>>,
    /// The step the value snaps to (0.05 unless set); `0` for any value.
    pub step: Prop<Option<f32>>,
    /// Dimmed and not draggable.
    #[prop(default)]
    pub disabled: Prop<bool>,
    /// What screen readers call it.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`Slider`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SliderEvent {
    /// The value changed: the new one.
    #[args(value)]
    Change(f32),
    /// The drag or key press ended.
    #[args(value)]
    ChangeEnd(f32),
}

/// iOS's slider: a 4 pt rail in the tint, a white 28 pt thumb with a soft
/// shadow, and a tick for each step when the steps are few enough to draw.
///
/// The value snaps to `step`; the arrow keys, Home and End move it from the
/// keyboard; a screen reader can set it as an adjustable.
#[component]
pub fn Slider(props: SliderProps, cx: Scope<SliderEvent>) -> impl IntoElement {
    let min = props.min.get_untracked().unwrap_or(0.0);
    let max = props.max.get_untracked().unwrap_or(1.0);
    let step = props.step.get_untracked().unwrap_or(0.05);
    let value = props.value;
    let default = props.default_value.get_untracked().unwrap_or(min);
    let disabled = props.disabled;
    let label = props.label;
    let steps = if step > 0.0 {
        ((max - min) / step).round() as usize
    } else {
        0
    };
    // A continuous slider (many small steps) keeps its rail clean.
    let ticks = if (2..=12).contains(&steps) { steps } else { 0 };

    let mut marks = view()
        .absolute()
        .left(px(8.0))
        .right(px(8.0))
        .top_0()
        .bottom_0()
        .flex_row()
        .items_center()
        .justify_between()
        .pointer_events(PointerEvents::None);
    if ticks > 1 {
        for _ in 0..ticks {
            marks = marks.child(
                view()
                    .w(px(2.0))
                    .h(px(6.0))
                    .rounded_full()
                    .bg(tokens::tertiary_label),
            );
        }
    }

    view()
        .relative()
        .w_full()
        .h(px(28.0))
        .justify_center()
        .child(marks)
        .child(
            base_slider()
                .value(move || Some(SliderValue::Single(value.get().unwrap_or(default) as f64)))
                .default_value(SliderValue::Single(default as f64))
                .min(f64::from(min))
                .max(f64::from(max))
                .step(f64::from(step))
                .disabled(disabled)
                .accessibility_label(label.get_untracked().unwrap_or_else(|| "Slider".into()))
                .track_class("h-7 justify-center")
                .indicator_class("h-1 rounded-full bg-tertiary-fill")
                .range_class("h-1 rounded-full bg-system-blue")
                .thumb_class("size-7 rounded-full bg-white shadow-md")
                .on_change(move |value: &SliderValue| {
                    if let SliderValue::Single(value) = value {
                        cx.emit(SliderEvent::Change(*value as f32));
                    }
                })
                .on_change_end(move |value: &SliderValue| {
                    if let SliderValue::Single(value) = value {
                        cx.emit(SliderEvent::ChangeEnd(*value as f32));
                    }
                }),
        )
}
