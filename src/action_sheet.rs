//! [`ActionSheet`]: iOS's choice of a few actions, in 10 pt groups at the
//! bottom of the screen.

use std::rc::Rc;

use nsh_base::button;
use nsh_core::{AccessibilityRole, Haptic, HapticImpact, prelude::*};

use crate::{
    overlay::{Presence, backdrop, layer},
    tokens::{self, radius, type_default},
};

/// One row of an [`ActionSheet`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct SheetAction {
    /// Reported with `onAction` when it is pressed.
    pub id: SharedString,
    /// What the row says.
    pub title: SharedString,
    /// Red text: it deletes or otherwise cannot be undone.
    #[prop(default)]
    pub destructive: bool,
    /// Dimmed and not pressable.
    #[prop(default)]
    pub disabled: bool,
}

impl SheetAction {
    /// An action of `id`, titled `title`.
    pub fn new(id: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            destructive: false,
            disabled: false,
        }
    }

    /// Red: it destroys something.
    pub fn destructive(mut self, destructive: bool) -> Self {
        self.destructive = destructive;
        self
    }

    /// Dimmed and not pressable.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }
}

/// The props of [`ActionSheet`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ActionSheetProps {
    /// Open (controlled): the app owns it and follows `onOpenChange`.
    pub open: Prop<Option<bool>>,
    /// Open at first, while `open` is not set.
    #[prop(default)]
    pub default_open: Prop<bool>,
    /// A bold line above the actions.
    pub title: Prop<Option<SharedString>>,
    /// An explanation under the title, 13 pt.
    pub message: Prop<Option<SharedString>>,
    /// The actions, in one group.
    #[prop(default)]
    pub actions: Prop<Vec<SheetAction>>,
    /// The cancel button's title ("Cancel" unless set); `""` hides it.
    pub cancel: Prop<Option<SharedString>>,
}

/// The events of an [`ActionSheet`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ActionSheetEvent {
    /// It asks to open or close: set `open` to follow.
    #[args(open)]
    OpenChange(bool),
    /// The action with this `id` was pressed.
    #[args(id)]
    Action(String),
    /// The cancel button, the backdrop, Escape or back closed it.
    Cancel,
}

/// A choice between a few actions, and a cancel button apart from them.
///
/// The actions sit in one 10 pt group over the safe area, the cancel button
/// in another; the backdrop dims the page, a press on it or Escape closes
/// the sheet, and a destructive action is red.
#[component]
pub fn ActionSheet(props: ActionSheetProps, cx: Scope<ActionSheetEvent>) -> impl IntoElement {
    let presence = Presence::new(props.open, props.default_open, 260.0);
    presence.sync();
    let actions = props.actions;
    let title = props.title;
    let message = props.message;
    let cancel = props.cancel;

    let dismiss = {
        let presence = presence.clone();
        Rc::new(move || {
            presence.request(false);
            cx.emit(ActionSheetEvent::OpenChange(false));
            cx.emit(ActionSheetEvent::Cancel);
        })
    };

    when(presence.shown(), move || {
        action_sheet_panel(
            presence.clone(),
            cx,
            props.actions,
            props.title,
            props.message,
            props.cancel,
            dismiss.clone(),
        )
    })
}

fn action_sheet_panel(
    presence: Presence,
    cx: Scope<ActionSheetEvent>,
    actions: Prop<Vec<SheetAction>>,
    title: Prop<Option<SharedString>>,
    message: Prop<Option<SharedString>>,
    cancel: Prop<Option<SharedString>>,
    dismiss: Rc<dyn Fn()>,
) -> impl IntoElement {
    let backdrop_close = dismiss.clone();
    let escape_close = dismiss.clone();
    let cancel_close = dismiss.clone();

    let enter = presence.progress().interpolate(&[0.0, 1.0], &[60.0, 0.0]);
    let opacity = presence.progress();

    let mut groups = view().flex_col().w_full().gap(px(8.0));

    if title.get_untracked().is_some() || message.get_untracked().is_some() {
        groups = groups.child(
            view()
                .flex_col()
                .w_full()
                .rounded(radius::ROW)
                .overflow_hidden()
                .bg(tokens::secondary_system_background)
                .backdrop_blur(px(20.0))
                .px(px(16.0))
                .py(px(14.0))
                .gap(px(4.0))
                .items_center()
                .child(
                    text(move || title.get().unwrap_or_default())
                        .text_size(type_default::FOOTNOTE.size)
                        .line_height(type_default::FOOTNOTE.line_height)
                        .font_weight(FontWeight(600))
                        .text_color(tokens::secondary_label),
                )
                .child(
                    text(move || message.get().unwrap_or_default())
                        .text_size(type_default::FOOTNOTE.size)
                        .line_height(type_default::FOOTNOTE.line_height)
                        .text_color(tokens::secondary_label),
                ),
        );
    }

    let items = actions.get_untracked();
    let count = items.len();
    let mut list = view()
        .relative()
        .flex_col()
        .w_full()
        .rounded(radius::ROW)
        .overflow_hidden()
        .bg(tokens::secondary_system_background)
        .backdrop_blur(px(20.0));
    for (index, action) in items.into_iter().enumerate() {
        let label = action.title.clone();
        let id = action.id.clone();
        let destructive = action.destructive;
        let disabled = action.disabled;
        let last = index + 1 == count;
        let mut row = view()
            .relative()
            .w_full()
            .min_h(px(57.0))
            .items_center()
            .justify_center()
            .px(px(16.0))
            .py(px(8.0))
            .bg(tokens::secondary_system_background)
            .child(
                text(label.clone())
                    .text_size(type_default::TITLE3.size)
                    .line_height(type_default::TITLE3.line_height)
                    .text_color(if destructive {
                        tokens::system_red()
                    } else {
                        tokens::system_blue()
                    })
                    .number_of_lines(2),
            );
        if !last {
            row = row.child(
                view()
                    .absolute()
                    .left_0()
                    .right_0()
                    .bottom_0()
                    .h(tokens::separator_thickness)
                    .bg(tokens::separator),
            );
        }
        let press_presence = presence.clone();
        list = list.child(
            button()
                .w_full()
                .disabled(disabled)
                .active(|s| s.bg(tokens::fill))
                .accessibility_label(if destructive {
                    format!("{label}, destructive").into()
                } else {
                    label
                })
                .role(AccessibilityRole::Button)
                .on_press(move || {
                    if disabled {
                        return;
                    }
                    nsh_core::element::haptic(Haptic::Impact(HapticImpact::Light));
                    press_presence.request(false);
                    cx.emit(ActionSheetEvent::Action(id.to_string()));
                    cx.emit(ActionSheetEvent::OpenChange(false));
                })
                .child(row),
        );
    }
    groups = groups.child(list);

    let cancel_label = cancel
        .get_untracked()
        .unwrap_or_else(|| SharedString::from("Cancel"));
    if !cancel_label.is_empty() {
        let close = cancel_close.clone();
        groups = groups.child(
            button()
                .w_full()
                .min_h(px(57.0))
                .items_center()
                .justify_center()
                .rounded(radius::ROW)
                .overflow_hidden()
                .bg(tokens::secondary_system_background)
                .backdrop_blur(px(20.0))
                .active(|s| s.bg(tokens::fill))
                .accessibility_label(cancel_label.clone())
                .role(AccessibilityRole::Button)
                .on_press(move || close())
                .child(
                    text(cancel_label)
                        .text_size(type_default::TITLE3.size)
                        .line_height(type_default::TITLE3.line_height)
                        .font_weight(FontWeight(600))
                        .text_color(tokens::system_blue),
                ),
        );
    }

    let groups = groups.pb_safe_area_plus(px(8.0));
    let backdrop = backdrop(&presence.progress().mul(0.4), move || {
        backdrop_close();
    })
    .on_cancel(move || escape_close());

    layer().child(backdrop).child(
        layer()
            .flex_col()
            .justify_end()
            .px(px(8.0))
            .pb(px(8.0))
            .bind_translate_y(&enter)
            .bind_opacity(&opacity)
            .pointer_events(PointerEvents::BoxNone)
            .child(
                view()
                    .w_full()
                    .on_press(|| {})
                    .role(AccessibilityRole::Dialog)
                    .child(groups),
            ),
    )
}
