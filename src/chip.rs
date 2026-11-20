//! [`FilterChip`]: the capsule a list filters by, and [`StatusPill`]: the small
//! capsule a row or a header labels its state with.

use nsh_core::{AccessibilityRole, prelude::*};

use crate::tokens::{self, motion};

/// The props of [`FilterChip`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct FilterChipProps {
    /// The chip's label.
    pub label: Prop<Option<SharedString>>,
    /// A count or window after the label, such as "3" or "24h".
    pub suffix: Prop<Option<SharedString>>,
    /// Chosen: the tint fill, with white text.
    pub selected: Prop<Option<bool>>,
}

/// The events of a [`FilterChip`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum FilterChipEvent {
    /// The chip was pressed.
    Press,
}

/// A 36 pt capsule with a 15 pt semibold label and an optional 12 pt count:
/// the tint when chosen, a white surface otherwise. Its press counts over a
/// 44 pt target, and fades like a button.
#[component]
pub fn FilterChip(props: FilterChipProps, cx: Scope<FilterChipEvent>) -> impl IntoElement {
    let selected = props.selected;
    let label = props.label;
    let suffix = props.suffix;
    let label_text = label;
    let suffix_text = suffix;
    nsh_base::button()
        .h(px(CHIP_HEIGHT))
        .hit_slop(EdgeInsets {
            top: px((44.0 - CHIP_HEIGHT) / 2.0),
            bottom: px((44.0 - CHIP_HEIGHT) / 2.0),
            ..EdgeInsets::all(px(0.0))
        })
        .flex_row()
        .items_center()
        .justify_center()
        .gap(px(6.0))
        .px(px(16.0))
        .rounded_full()
        .bg(move || {
            if selected.get().unwrap_or(false) {
                tokens::system_blue()
            } else {
                tokens::secondary_system_grouped_background()
            }
        })
        .active(|s| s.opacity(motion::PRESS_OPACITY))
        .transition_opacity()
        .duration(motion::PRESS_FADE_IN_MS)
        .role(AccessibilityRole::Button)
        .accessibility_label(move || {
            let label = label.get().unwrap_or_default();
            Some(match suffix.get() {
                Some(suffix) => format!("{label}, {suffix}").into(),
                None => label,
            })
        })
        .on_press(move || cx.emit(FilterChipEvent::Press))
        .child(
            text(move || label_text.get().unwrap_or_default())
                .text_size(px(15.0))
                .line_height(px(20.0))
                .font_weight(FontWeight(600))
                .text_color(move || {
                    if selected.get().unwrap_or(false) {
                        tokens::on_tint()
                    } else {
                        tokens::secondary_label()
                    }
                }),
        )
        .when_some(suffix_text.get_untracked(), |v, _| {
            v.child(
                text(move || suffix_text.get().unwrap_or_default())
                    .text_size(px(12.0))
                    .line_height(px(16.0))
                    .text_color(move || {
                        if selected.get().unwrap_or(false) {
                            tokens::on_tint()
                        } else {
                            tokens::tertiary_label()
                        }
                    }),
            )
        })
}

const CHIP_HEIGHT: f32 = 36.0;

/// The props of [`StatusPill`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct StatusPillProps {
    /// The state's name.
    pub label: Prop<Option<SharedString>>,
    /// `"neutral"` (the default), `"success"`, `"warning"`, `"danger"` or
    /// `"info"`.
    pub tone: Prop<Option<SharedString>>,
    /// A dot before the label (`true` unless set).
    pub dot: Prop<Option<bool>>,
}

/// A 21 pt capsule with an 11 pt semibold label and a 6 pt dot, in its tone's
/// soft fill and ink: grey, green, amber, red or blue.
#[component]
pub fn StatusPill(props: StatusPillProps) -> impl IntoElement {
    let tone = props
        .tone
        .get_untracked()
        .unwrap_or_else(|| "neutral".into());
    let (soft, ink) = match tone.as_str() {
        "success" => ("success-soft", "success"),
        "warning" => ("warning-soft", "warning"),
        "danger" => ("danger-soft", "system-red"),
        "info" => ("info-soft", "info"),
        _ => ("system-gray5", "secondary-label"),
    };
    let dot = props.dot.get_untracked().unwrap_or(true);
    let label = props.label;
    view()
        .flex_row()
        .items_center()
        .gap(px(4.0))
        .px(px(8.0))
        .py(px(4.0))
        .rounded_full()
        .bg(move || tokens::system(soft))
        .label(label.get_untracked().unwrap_or_default())
        .when(dot, |v| {
            v.child(
                view()
                    .size(px(6.0))
                    .rounded_full()
                    .bg(move || tokens::system(ink)),
            )
        })
        .child(
            text(move || label.get().unwrap_or_default())
                .text_size(px(11.0))
                .line_height(px(13.0))
                .font_weight(FontWeight(600))
                .text_color(move || tokens::system(ink)),
        )
}
