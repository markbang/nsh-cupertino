//! [`AlertDialog`]: iOS's alert, with up to a few actions and an optional
//! text field.

use std::rc::Rc;

use nsh_base::{button, input};
use nsh_core::{AccessibilityRole, prelude::*};

use crate::{
    overlay::{Presence, layer},
    tokens::{self, type_default},
};

/// One button of an [`AlertDialog`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct DialogAction {
    /// Reported with `onAction` when it is pressed.
    pub id: SharedString,
    /// What the button says.
    pub title: SharedString,
    /// Red text: it destroys something.
    #[prop(default)]
    pub destructive: bool,
    /// Drawn in semibold, as iOS draws the default button.
    #[prop(default)]
    pub preferred: bool,
}

impl DialogAction {
    /// A button of `id`, titled `title`.
    pub fn new(id: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            destructive: false,
            preferred: false,
        }
    }

    /// Red: it destroys something.
    pub fn destructive(mut self, destructive: bool) -> Self {
        self.destructive = destructive;
        self
    }

    /// Semibold: the default button.
    pub fn preferred(mut self, preferred: bool) -> Self {
        self.preferred = preferred;
        self
    }
}

/// The props of [`AlertDialog`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct AlertDialogProps {
    /// Open (controlled): the app owns it and follows `onOpenChange`.
    pub open: Prop<Option<bool>>,
    /// Open at first, while `open` is not set.
    #[prop(default)]
    pub default_open: Prop<bool>,
    /// The title, 17 pt semibold.
    pub title: Prop<Option<SharedString>>,
    /// The message, 13 pt.
    pub message: Prop<Option<SharedString>>,
    /// The buttons: two sit side by side, three or more stack.
    #[prop(default)]
    pub actions: Prop<Vec<DialogAction>>,
    /// A text field between the message and the buttons: its placeholder.
    /// The text reaches `onAction` with the action's id.
    pub input: Prop<Option<SharedString>>,
    /// The field's text at first.
    pub value: Prop<Option<SharedString>>,
}

/// The events of an [`AlertDialog`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum AlertDialogEvent {
    /// It asks to open or close: set `open` to follow.
    #[args(open)]
    OpenChange(bool),
    /// A button was pressed: its id, and the field's text (empty without
    /// a field).
    #[args(id, text)]
    Action(String, String),
    /// The backdrop, Escape or back closed it.
    Cancel,
}

/// An alert in the middle of the screen: a title, a message, an optional
/// text field and a row of buttons.
///
/// It is a small card on a dimmed page, entering with a short spring; a
/// press outside, Escape, the Android back button and the cancel button
/// close it. On a platform without a backdrop blur the card is a
/// translucent surface instead (as iOS's material falls back).
#[component]
pub fn AlertDialog(props: AlertDialogProps, cx: Scope<AlertDialogEvent>) -> impl IntoElement {
    let presence = Presence::new(props.open, props.default_open, 180.0);
    presence.sync();
    let field = props.input.get_untracked().is_some();
    let seed = props
        .value
        .get_untracked()
        .map(|value| value.to_string())
        .unwrap_or_default();
    let draft = signal(seed);
    let seed_open = props.value;
    let reset = draft;
    let opening = presence.clone();
    effect(move || {
        if opening.open() {
            reset.set(
                seed_open
                    .get()
                    .map(|value| value.to_string())
                    .unwrap_or_default(),
            );
        }
    });
    // The text as the buttons report it.
    let typed = draft;

    let close = {
        let presence = presence.clone();
        Rc::new(move || {
            presence.request(false);
            cx.emit(AlertDialogEvent::OpenChange(false));
            cx.emit(AlertDialogEvent::Cancel);
        })
    };
    when(presence.shown(), move || {
        alert_panel(
            presence.clone(),
            cx,
            props.title,
            props.message,
            props.input,
            props.actions,
            field,
            draft,
            close.clone(),
        )
    })
}

#[allow(clippy::too_many_arguments)]
fn alert_panel(
    presence: Presence,
    cx: Scope<AlertDialogEvent>,
    title: Prop<Option<SharedString>>,
    message: Prop<Option<SharedString>>,
    placeholder: Prop<Option<SharedString>>,
    actions: Prop<Vec<DialogAction>>,
    field: bool,
    typed: Signal<String>,
    close: Rc<dyn Fn()>,
) -> impl IntoElement {
    let backdrop_close = close.clone();
    let escape_close = close.clone();

    let scale = presence.progress().interpolate(&[0.0, 1.0], &[1.16, 1.0]);
    let opacity = presence.progress();
    let actions = actions.get_untracked();
    let count = actions.len();
    let horizontal = count == 2;
    let mut buttons = view().w_full();
    buttons = if horizontal {
        buttons.flex_row()
    } else {
        buttons.flex_col()
    };
    for (index, action) in actions.into_iter().enumerate() {
        let id = action.id.clone();
        let label = action.title.clone();
        let destructive = action.destructive;
        let preferred = action.preferred || (count == 1);
        let press = close.clone();
        let press_text = typed;
        buttons = buttons.child(
            button()
                .flex_1()
                .min_h(px(44.0))
                .items_center()
                .justify_center()
                .px(px(8.0))
                .active(|s| s.bg(tokens::fill))
                .accessibility_label(label.clone())
                .role(AccessibilityRole::Button)
                .on_press(move || {
                    press();
                    cx.emit(AlertDialogEvent::Action(
                        id.to_string(),
                        press_text.get_untracked(),
                    ));
                    cx.emit(AlertDialogEvent::OpenChange(false));
                })
                .child(
                    text(label)
                        .text_size(type_default::BODY.size)
                        .line_height(type_default::BODY.line_height)
                        .font_weight(if preferred {
                            FontWeight(600)
                        } else {
                            FontWeight(400)
                        })
                        .text_color(if destructive {
                            tokens::system_red()
                        } else {
                            tokens::system_blue()
                        }),
                )
                .when(index + 1 < count && horizontal, |b| {
                    b.border_r(tokens::separator_thickness())
                        .border_color(tokens::separator)
                })
                .when(index + 1 < count && !horizontal, |b| {
                    b.border_b(tokens::separator_thickness())
                        .border_color(tokens::separator)
                }),
        );
    }

    let card = view()
        .w(px(270.0))
        .max_w(relative(0.92))
        .flex_col()
        .rounded(px(14.0))
        .overflow_hidden()
        .child(crate::glass::layer(
            crate::glass::material_spec("thick", [14.0; 4]),
            None,
        ))
        .shadow([nsh_core::BoxShadow {
            offset_y: px(8.0),
            blur: px(32.0),
            color: rgba(0x00000033).into(),
            ..nsh_core::BoxShadow::default()
        }])
        .bind_scale(&scale)
        .bind_opacity(&opacity)
        .on_press(|| {})
        .role(AccessibilityRole::AlertDialog)
        .child(
            view()
                .flex_col()
                .gap(px(4.0))
                .px(px(16.0))
                .pt(px(19.0))
                .pb(px(if field { 12.0 } else { 19.0 }))
                .child(
                    text(move || title.get().unwrap_or_default())
                        .text_size(type_default::HEADLINE.size)
                        .line_height(type_default::HEADLINE.line_height)
                        .font_weight(FontWeight(600))
                        .text_color(tokens::label)
                        .text_center(),
                )
                .child(
                    text(move || message.get().unwrap_or_default())
                        .text_size(type_default::FOOTNOTE.size)
                        .line_height(type_default::FOOTNOTE.line_height)
                        .text_color(tokens::label)
                        .text_center(),
                ),
        )
        .when(field, |card| {
            card.child(
                input()
                    .when_some(placeholder.get_untracked(), |field, label| {
                        field.optional_label(label)
                    })
                    .value(move || typed.get())
                    .on_change(move |value: &str| typed.set(value.to_owned()))
                    .placeholder(move || {
                        placeholder.get().map(|p| p.to_string()).unwrap_or_default()
                    })
                    .placeholder_color(tokens::placeholder_text)
                    .caret_color(tokens::system_blue)
                    .text_size(type_default::BODY.size)
                    .h(px(32.0))
                    .mx(px(16.0))
                    .mb(px(16.0))
                    .px(px(6.0))
                    .rounded(px(6.0))
                    .bg(tokens::tertiary_system_background)
                    .border(tokens::separator_thickness())
                    .border_color(tokens::separator),
            )
        })
        .child(
            view()
                .w_full()
                .h(tokens::separator_thickness)
                .bg(tokens::separator),
        )
        .child(buttons);

    let backdrop = layer()
        .bg(rgba(0x000000ff))
        .bind_opacity(&presence.progress().mul(0.4))
        .on_press(move || backdrop_close())
        .on_cancel(move || escape_close());
    layer().child(backdrop).child(
        layer()
            .items_center()
            .justify_center()
            .px(px(20.0))
            .child(card),
    )
}
