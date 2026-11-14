//! [`Switch`]: iOS's on / off switch, 51 × 31 pt.

use nsh_core::{element::BoxShadow, prelude::*};

use crate::tokens::{self, metrics, motion, radius};

/// The props of [`Switch`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SwitchProps {
    /// On or off. The app owns it: set it from `onChange`.
    #[prop(default)]
    pub checked: Prop<bool>,
    /// Dimmed and not pressable.
    pub disabled: Prop<Option<bool>>,
    /// A label after the switch, which screen readers read.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`Switch`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SwitchEvent {
    /// The switch was pressed: the value it asks for.
    Change(bool),
}

/// An iOS switch: a 51 × 31 pt pill, `systemGreen` when on and
/// `secondaryFill` when off, with a 27 pt white thumb that slides 20 pt over
/// 200 ms.
///
/// Its role is a switch, its state is read, and Space or Return presses it.
#[component]
pub fn Switch(props: SwitchProps, cx: Scope<SwitchEvent>) -> impl IntoElement {
    let checked = props.checked;
    let checked_track = props.checked;
    let disabled = props.disabled;
    let dimmed = disabled;
    let blocked = disabled;
    let label = props.label;
    nsh_base::switch()
        .checked(checked)
        .disabled(disabled.get_untracked().unwrap_or(false))
        .hit_slop(EdgeInsets::all(px(8.0)))
        .accessibility_label(label.get_untracked().unwrap_or_default())
        .track_style(move |s| {
            s.w(px(metrics::SWITCH_WIDTH))
                .h(px(metrics::SWITCH_HEIGHT))
                .rounded(px(radius::SWITCH.0))
                .items_start()
                .p(px(2.0))
                .transition_colors()
                .duration(motion::THUMB_MS)
                .bg(move || {
                    let off = tokens::secondary_fill();
                    let on = tokens::system_green();
                    if dimmed.get().unwrap_or(false) {
                        return if checked_track.get() {
                            on.opacity(0.5)
                        } else {
                            off
                        };
                    }
                    if checked_track.get() { on } else { off }
                })
        })
        .thumb_style(move |s| {
            s.size(px(metrics::SWITCH_THUMB))
                .rounded_full()
                .bg(white())
                .shadow([BoxShadow {
                    offset_x: px(0.0),
                    offset_y: px(1.0),
                    blur: px(2.0),
                    spread: px(0.0),
                    color: rgba(0x0000_0033).into(),
                    inset: false,
                }])
                .transition_transform()
                .duration(motion::THUMB_MS)
                .checked(move |s| {
                    s.translate_x(px(metrics::SWITCH_WIDTH - metrics::SWITCH_THUMB - 4.0))
                })
        })
        .on_change(move |checked: &bool| {
            if !blocked.get_untracked().unwrap_or(false) {
                cx.emit(SwitchEvent::Change(*checked));
            }
        })}
