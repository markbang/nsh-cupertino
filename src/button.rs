//! [`Button`]: iOS's filled, tinted and plain buttons.

use nsh_core::{AccessibilityRole, prelude::*};

use crate::{
    icon::icon,
    tokens::{self, motion, radius, type_default},
};

/// The props of [`Button`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ButtonProps {
    /// The button's text. Leave it out for an icon-only button (give it a
    /// `label`).
    pub title: Prop<Option<SharedString>>,
    /// `"filled"` (blue, the default), `"tinted"` (blue at 18 %), `"plain"`
    /// (blue text) or `"destructive"` (red text).
    pub variant: Prop<Option<SharedString>>,
    /// `"large"` (44 pt, the default), `"medium"` (32 pt) or `"small"`
    /// (28 pt). The press target is 44 pt at every size.
    pub size: Prop<Option<SharedString>>,
    /// An icon before the title, by name ([`crate::icon::NAMES`]).
    pub icon: Prop<Option<SharedString>>,
    /// Dimmed and not pressable.
    pub disabled: Prop<Option<bool>>,
    /// What screen readers say, for a button whose title is an icon or short.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`Button`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ButtonEvent {
    /// The button was pressed.
    Press,
}

/// A button in one of iOS's four looks, with the pressed state as iOS draws
/// it: the whole button fades to 40 %, over 150 ms.
///
/// Pressed and disabled are the app's to control (`disabled`); the press is
/// reported once, and a disabled button reports nothing.
#[component]
pub fn Button(props: ButtonProps, cx: Scope<ButtonEvent>) -> impl IntoElement {
    let variant = props
        .variant
        .get_untracked()
        .unwrap_or_else(|| "filled".into());
    let size = props.size.get_untracked().unwrap_or_else(|| "large".into());
    let destructive = variant == "destructive";
    let filled = variant == "filled";
    let tinted = variant == "tinted";
    let (padding_x, padding_y, step, corner) = match size.as_str() {
        "small" => (12.0, 6.0, type_default::SUBHEADLINE, 40.0),
        "medium" => (15.0, 10.0, type_default::SUBHEADLINE, 40.0),
        _ => (20.0, 16.0, type_default::HEADLINE, radius::BUTTON.0),
    };
    let disabled = {
        let disabled = props.disabled;
        move || disabled.get().unwrap_or(false)
    };
    let title = props.title;
    let icon_name = props.icon;
    let has_icon = props.icon.get_untracked().is_some();
    let label = props.label;
    let title_label = props.title;

    nsh_base::button()
        .min_h(px(44.0))
        .flex_row()
        .items_center()
        .justify_center()
        .gap(px(6.0))
        .px(px(padding_x))
        .py(px(padding_y))
        .rounded(px(corner))
        .bg(move || {
            if disabled() {
                if filled {
                    tokens::system_blue().opacity(0.4)
                } else {
                    nsh_core::color::transparent_black()
                }
            } else if filled {
                tokens::system_blue()
            } else if tinted {
                tokens::system_blue().opacity(if nsh_core::element::dark() {
                    0.26
                } else {
                    0.18
                })
            } else {
                nsh_core::color::transparent_black()
            }
        })
        .active(|s| s.opacity(motion::PRESS_OPACITY))
        .transition_opacity()
        .duration(motion::QUICK_MS)
        .disabled(disabled())
        .role(AccessibilityRole::Button)
        .accessibility_label(move || {
            Some(
                label
                    .get()
                    .clone()
                    .or_else(|| title_label.get().clone())
                    .unwrap_or_default(),
            )
        })
        .on_press(move || {
            if !disabled() {
                cx.emit(ButtonEvent::Press);
            }
        })
        .when(has_icon, |v| {
            v.child(
                icon(&icon_name.get_untracked().unwrap_or_default(), 20.0)
                    .text_color(move || button_text(filled, destructive)),
            )
        })
        .child(when(
            move || title.get().is_some(),
            move || {
                text(move || title.get().unwrap_or_default())
                    .text_size(step.size)
                    .line_height(step.line_height)
                    .letter_spacing(step.tracking)
                    .font_weight(FontWeight(step.weight))
                    .text_color(move || button_text(filled, destructive))
            },
        ))
}

fn button_text(filled: bool, destructive: bool) -> Hsla {
    if filled {
        tokens::on_tint()
    } else if destructive {
        tokens::system_red()
    } else {
        tokens::system_blue()
    }
}
