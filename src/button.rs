//! [`Button`]: iOS's filled, tinted and plain buttons.

use nsh_core::{AccessibilityRole, prelude::*};

use crate::{
    icon::icon,
    indicator::crescent,
    tokens::{self, metrics, motion, radius, type_default},
};

/// The props of [`Button`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ButtonProps {
    /// The button's text. Leave it out for an icon-only button (give it a
    /// `label`).
    pub title: Prop<Option<SharedString>>,
    /// `"filled"` (the tint, the default), `"tinted"` (the tint at 18 %),
    /// `"plain"` (tint text), `"destructive"` (red text), `"secondary"` (a grey
    /// fill, label text) or `"danger"` (a red fill).
    pub variant: Prop<Option<SharedString>>,
    /// `"large"` (52 pt, the default), `"medium"` (32 pt) or `"small"`
    /// (28 pt). The press target is 44 pt at every size.
    pub size: Prop<Option<SharedString>>,
    /// An icon before the title, by name ([`crate::icon::NAMES`]), drawn at
    /// 1.2 × the text size as `CupertinoButton` draws it.
    pub icon: Prop<Option<SharedString>>,
    /// Dimmed and not pressable.
    pub disabled: Prop<Option<bool>>,
    /// A request in progress: a spinner in place of the icon, the button at
    /// 55 % and not pressable (`disabled` keeps its own look).
    pub loading: Prop<Option<bool>>,
    /// What screen readers say, for a button whose title is an icon or short.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`Button`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ButtonEvent {
    /// The button was pressed.
    Press,
}

/// A button in one of iOS's looks, with the pressed state as iOS draws it: the
/// whole button fades to 40 % over 120 ms (`kFadeOutDuration`), and back over
/// 180 ms.
///
/// The large button is a 52 pt capsule, the height of Cohub Mobile's primary
/// button; the medium and small ones are `CupertinoButton`'s (32 and 28 pt).
/// Presses count over a 44 pt target at every size, as the guidelines ask. A
/// disabled button keeps its shape and reports nothing, and its text takes the
/// tertiary label color as `CupertinoButton` does.
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
    let secondary = variant == "secondary";
    let danger = variant == "danger";
    let solid = filled || secondary || danger;
    let (visual_height, padding_x, padding_y, step, corner) = match size.as_str() {
        "small" => (28.0, 12.0, 6.0, type_default::SUBHEADLINE, 40.0),
        "medium" => (32.0, 15.0, 10.0, type_default::SUBHEADLINE, 40.0),
        _ => (
            metrics::BUTTON_LARGE,
            20.0,
            8.0,
            type_default::HEADLINE,
            radius::BUTTON.0,
        ),
    };
    // The touch target stays 44 pt: a small button grows its hit area, not its
    // look.
    let slop = (44.0 - visual_height).max(0.0) / 2.0;
    let disabled_prop = props.disabled;
    let disabled = move || disabled_prop.get().unwrap_or(false);
    let loading = props.loading.get_untracked().unwrap_or(false);
    let blocked = move || disabled() || loading;
    let title = props.title;
    let icon_name = props.icon;
    let has_icon = props.icon.get_untracked().is_some();
    let label = props.label;
    let title_label = props.title;

    nsh_base::button()
        .min_h(px(visual_height))
        .hit_slop(EdgeInsets::all(px(slop)))
        .flex_row()
        .items_center()
        .justify_center()
        .gap(px(6.0))
        .px(px(padding_x))
        .py(px(padding_y))
        .rounded(px(corner))
        .when(loading, |v| v.opacity(LOADING_OPACITY))
        .bg(move || {
            if solid {
                let fill = if secondary {
                    tokens::system_gray5()
                } else if danger {
                    tokens::system_red()
                } else {
                    tokens::system_blue()
                };
                if disabled() { fill.opacity(0.4) } else { fill }
            } else if tinted {
                let alpha = if nsh_core::element::dark() {
                    0.26
                } else {
                    0.18
                };
                if disabled() {
                    tokens::system_blue().opacity(alpha * 0.5)
                } else {
                    tokens::system_blue().opacity(alpha)
                }
            } else {
                nsh_core::color::transparent_black()
            }
        })
        .active(|s| s.opacity(motion::PRESS_OPACITY))
        .transition_opacity()
        .duration(motion::PRESS_FADE_IN_MS)
        .disabled(blocked())
        .role(AccessibilityRole::Button)
        .accessibility_label(move || {
            Some(
                label
                    .get()
                    .or_else(|| title_label.get())
                    .unwrap_or_default(),
            )
        })
        .on_press(move || {
            if !blocked() {
                cx.emit(ButtonEvent::Press);
            }
        })
        .when(loading, |v| v.child(crescent(step.size.0 * 1.2)))
        .when(has_icon && !loading, |v| {
            v.child(
                icon(
                    &icon_name.get_untracked().unwrap_or_default(),
                    step.size.0 * 1.2,
                )
                .text_color(move || button_text(solid, secondary, destructive, disabled())),
            )
        })
        .child(when(
            move || title.get().is_some(),
            move || {
                text(move || title.get().unwrap_or_default())
                    .text_size(step.size)
                    .line_height(step.line_height)
                    .letter_spacing(tokens::tracking(step))
                    .font_weight(FontWeight(step.weight))
                    .text_color(move || button_text(solid, secondary, destructive, disabled()))
            },
        ))
}

/// The opacity of a loading button: `disabled:opacity-55` in Cohub Mobile's
/// `PrimaryButton` (`ui.tsx`).
const LOADING_OPACITY: f32 = 0.55;

fn button_text(solid: bool, secondary: bool, destructive: bool, disabled: bool) -> Hsla {
    if disabled {
        // `CupertinoButton`'s disabled foreground: the tertiary label, whatever
        // the variant.
        tokens::tertiary_label()
    } else if secondary {
        tokens::label()
    } else if solid {
        tokens::on_tint()
    } else if destructive {
        tokens::system_red()
    } else {
        tokens::system_blue()
    }
}
