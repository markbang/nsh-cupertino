//! [`Switch`]: iOS's on / off switch, 63 × 28 pt.

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

/// An iOS switch: a 63 × 28 pt capsule, `switch-on` when on and `switch-off`
/// when off (`systemGreen` and `secondaryFill` by default), with a 37 × 24 pt
/// white thumb that slides 22 pt over 200 ms.
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
                    let off = tokens::system("switch-off");
                    let on = tokens::system("switch-on");
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
            s.w(px(metrics::SWITCH_THUMB_WIDTH))
                .h(px(metrics::SWITCH_THUMB))
                .rounded_full()
                .bg(white())
                // `_kSwitchBoxShadows`: a soft one and a tight one.
                .shadow([
                    BoxShadow {
                        offset_x: px(0.0),
                        offset_y: px(3.0),
                        blur: px(8.0),
                        spread: px(0.0),
                        color: rgba(0x2600_0000).into(),
                        inset: false,
                    },
                    BoxShadow {
                        offset_x: px(0.0),
                        offset_y: px(3.0),
                        blur: px(1.0),
                        spread: px(0.0),
                        color: rgba(0x0f00_0000).into(),
                        inset: false,
                    },
                ])
                .transition_transform()
                .duration(motion::THUMB_MS)
                .checked(move |s| {
                    s.translate_x(px(metrics::SWITCH_WIDTH
                        - metrics::SWITCH_THUMB_WIDTH
                        - 4.0))
                })
        })
        .on_change(move |checked: &bool| {
            if !blocked.get_untracked().unwrap_or(false) {
                cx.emit(SwitchEvent::Change(*checked));
            }
        })
}
