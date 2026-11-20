//! [`TextField`] and [`SearchField`]: iOS's grouped text field and search
//! field.

use nsh_base::{button, input};
use nsh_core::{AccessibilityRole, element::Children, prelude::*};

use crate::{
    icon::{icon, icon_stroke},
    tokens::{self, metrics, radius, type_default},
};

/// The props of [`TextField`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct TextFieldProps {
    /// The text. The app owns it: set it from `onChange`.
    #[prop(default)]
    pub value: Prop<SharedString>,
    /// Shown while the field is empty.
    pub placeholder: Prop<Option<SharedString>>,
    /// The text is hidden, and a button shows it.
    pub secure: Prop<Option<bool>>,
    /// A button that empties the field while it has text (on unless `false`).
    pub clear: Prop<Option<bool>>,
    /// An icon before the text, by name ([`crate::icon::NAMES`]).
    pub leading: Prop<Option<SharedString>>,
    /// What screen readers call the field, when the placeholder is not its
    /// name.
    pub label: Prop<Option<SharedString>>,
    /// `"default"`, `"email"`, `"number"`, `"phone"`, `"url"` or `"search"`.
    pub keyboard: Prop<Option<SharedString>>,
    /// The return key's label: `"done"`, `"go"`, `"next"`, `"search"`,
    /// `"send"`.
    pub return_key: Prop<Option<SharedString>>,
    /// Dimmed and not editable.
    pub disabled: Prop<Option<bool>>,
    /// `"rounded"` (the default: `CupertinoTextField`'s white box, 5 pt
    /// corners, a hairline border) or `"grouped"` (a form row's surface: the
    /// grouped background, 10 pt corners, no border).
    pub variant: Prop<Option<SharedString>>,
}

/// The events of a [`TextField`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum TextFieldEvent {
    /// The text changed.
    Change(String),
    /// The return key was pressed.
    Submit(String),
}

/// A text field in one of two of iOS's looks: `CupertinoTextField`'s rounded
/// box (white on light, black on dark, 5 pt corners, a 0.5 pt border at 20 %
/// of the text color and 7 pt of padding), or a form row's grouped surface
/// (10 pt corners, no border). 44 pt tall at least, a caret and selection in
/// the tint color, and iOS's clear and reveal buttons.
///
/// The value is the app's: the field reports every change and shows what it
/// is given, so the clear button empties the field by reporting `""`.
#[component]
pub fn TextField(props: TextFieldProps, cx: Scope<TextFieldEvent>) -> impl IntoElement {
    let focused = signal(false);
    let revealed = signal(false);
    let value = props.value;
    let clear = props.clear;
    let input_ref = element_ref();
    let focus_ref = input_ref;
    let value_for_button = value;
    let secure = props.secure.get_untracked().unwrap_or(false);
    let grouped = props.variant.get_untracked().as_deref() == Some("grouped");
    let clearable = props.clear.get_untracked().unwrap_or(true);
    let disabled = {
        let disabled = props.disabled;
        move || disabled.get().unwrap_or(false)
    };
    let placeholder = props.placeholder;
    let keyboard = props.keyboard;
    let return_key = props.return_key;
    let label = props.label;
    let leading = props.leading;
    let has_leading = props.leading.get_untracked().is_some();

    view()
        .w_full()
        .min_h(px(metrics::ROW_HEIGHT))
        .flex_row()
        .items_center()
        .gap(px(8.0))
        .px(px(if grouped { 16.0 } else { 7.0 }))
        .rounded(px(if grouped { radius::ROW.0 } else { 5.0 }))
        .bg(move || {
            if disabled() {
                tokens::text_field_disabled_background()
            } else if grouped {
                tokens::secondary_system_grouped_background()
            } else {
                tokens::system_background()
            }
        })
        .when(!grouped, |v| {
            // `_kDefaultRoundedBorder`: 0.5 pt at 20 % of the text color.
            v.border(px(0.5))
                .border_color(move || tokens::label().opacity(0.2))
        })
        .when(has_leading, |v| {
            v.child(
                icon(&leading.get_untracked().unwrap_or_default(), 20.0)
                    .text_color(tokens::secondary_label),
            )
        })
        .child(
            input()
                .element_ref(&input_ref)
                .flex_1()
                .min_h(px(metrics::ROW_HEIGHT))
                .py(px(11.0))
                .value(move || value.get().to_string())
                .placeholder(placeholder.get_untracked().unwrap_or_default().to_string())
                .placeholder_color(tokens::placeholder_text)
                .caret_color(tokens::system_blue)
                .selection_color(move || tokens::system_blue().opacity(0.25))
                .text_size(type_default::BODY.size)
                .text_color(tokens::label)
                .masked(move || secure && !revealed.get())
                .readonly(disabled())
                .keyboard_type(match keyboard.get_untracked().as_deref() {
                    Some("email") => KeyboardType::Email,
                    Some("number") => KeyboardType::Number,
                    Some("phone") => KeyboardType::Phone,
                    Some("url") => KeyboardType::Url,
                    _ => KeyboardType::Default,
                })
                .return_key_type(match return_key.get_untracked().as_deref() {
                    Some("done") => ReturnKeyType::Done,
                    Some("go") => ReturnKeyType::Go,
                    Some("next") => ReturnKeyType::Next,
                    Some("search") => ReturnKeyType::Search,
                    Some("send") => ReturnKeyType::Send,
                    _ => ReturnKeyType::Default,
                })
                .on_focus(move || focused.set(true))
                .on_blur(move || focused.set(false))
                .on_change(move |text: &str| cx.emit(TextFieldEvent::Change(text.to_owned())))
                .on_submit(move |text: &str| cx.emit(TextFieldEvent::Submit(text.to_owned())))
                .when_some(label.get_untracked(), |v, label| v.optional_label(label)),
        )
        .child(
            view()
                .flex_row()
                .items_center()
                .gap(px(8.0))
                .child(when(
                    move || secure && revealed.get(),
                    move || icon_button("eye.slash", "Hide text", move || revealed.set(false)),
                ))
                .child(when(
                    move || secure && !revealed.get(),
                    move || icon_button("eye", "Show text", move || revealed.set(true)),
                ))
                .child(when(
                    move || {
                        clearable
                            && !disabled()
                            && focused.get()
                            && !value_for_button.get().is_empty()
                    },
                    move || {
                        icon_button("xmark.circle.fill", "Clear text", {
                            let focus = focus_ref;
                            move || {
                                focus.focus();
                                cx.emit(TextFieldEvent::Change(String::new()));
                            }
                        })
                    },
                )),
        )
}

fn icon_button(
    name: &'static str,
    label: &'static str,
    on_press: impl Fn() + 'static,
) -> impl IntoElement {
    button()
        .size(px(28.0))
        .items_center()
        .justify_center()
        .rounded(px(14.0))
        .accessibility_label(label)
        .role(AccessibilityRole::Button)
        .active(|s| s.opacity(0.4))
        .on_press(on_press)
        .child(icon(name, 17.0).text_color(tokens::tertiary_label))
}

/// The props of [`SearchField`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SearchFieldProps {
    /// The text. The app owns it.
    #[prop(default)]
    pub value: Prop<SharedString>,
    /// Shown while empty ("Search" unless set).
    pub placeholder: Prop<Option<SharedString>>,
    /// What screen readers call the field.
    pub label: Prop<Option<SharedString>>,
    /// A "Cancel" button after the field, which reports `Cancel` while the
    /// field is focused.
    pub cancel: Prop<Option<bool>>,
    /// Draw the field as glass, for a search bar over content that scrolls
    /// under it (the floating layer; the field keeps its 9 pt corners).
    pub glass: Prop<Option<bool>>,
    /// A row of scopes under the field (segmented control is wave B).
    pub children: Prop<Children>,
}

/// The events of a [`SearchField`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SearchFieldEvent {
    /// The text changed.
    Change(String),
    /// The return key was pressed.
    Submit(String),
    /// "Cancel" was pressed.
    Cancel,
}

/// iOS's search field: 44 pt tall, a capsule, a magnifier before the text and a
/// clear button, on the `fill` color as a search bar has it — or, with `glass`,
/// on Liquid Glass for a bar that floats over the page.
#[component]
pub fn SearchField(props: SearchFieldProps, cx: Scope<SearchFieldEvent>) -> impl IntoElement {
    let focused = signal(false);
    let value = props.value;
    let focus_ref = element_ref();
    let ref_for_clear = focus_ref;
    let value_for_button = value;
    let placeholder = props.placeholder;
    let label = props.label;
    let cancel = props.cancel.get_untracked().unwrap_or(false);
    let focused_for_cancel = focused;
    let glass = props.glass.get_untracked().unwrap_or(false);

    let box_view = {
        let focused_in = focused;
        let focused_out = focused;
        let field = view()
            .flex_1()
            .flex_row()
            .items_center()
            .gap(px(8.0))
            .h(px(metrics::SEARCH_HEIGHT))
            .px(px(16.0))
            .child(icon_stroke("magnifyingglass", 18.0, 2.2).text_color(tokens::label))
            .child(
                input()
                    .element_ref(&focus_ref)
                    .flex_1()
                    .h_full()
                    .value(move || value.get().to_string())
                    .placeholder(
                        placeholder
                            .get_untracked()
                            .unwrap_or_else(|| "Search".into())
                            .to_string(),
                    )
                    .placeholder_color(tokens::secondary_label)
                    .caret_color(tokens::system_blue)
                    .selection_color(move || tokens::system_blue().opacity(0.25))
                    .text_size(type_default::BODY.size)
                    .text_color(tokens::label)
                    .keyboard_type(KeyboardType::Default)
                    .return_key_type(ReturnKeyType::Search)
                    .role(AccessibilityRole::Search)
                    .on_focus(move || focused_in.set(true))
                    .on_blur(move || focused_out.set(false))
                    .on_change(move |text: &str| cx.emit(SearchFieldEvent::Change(text.to_owned())))
                    .on_submit(move |text: &str| cx.emit(SearchFieldEvent::Submit(text.to_owned())))
                    .when_some(label.get_untracked(), |v, label| v.optional_label(label)),
            )
            .child(when(
                move || !value_for_button.get().is_empty(),
                move || {
                    icon_button("xmark.circle.fill", "Clear search", {
                        let focus = ref_for_clear;
                        move || {
                            focus.focus();
                            cx.emit(SearchFieldEvent::Change(String::new()));
                        }
                    })
                },
            ));
        if glass {
            view()
                .flex_1()
                .relative()
                .rounded(px(radius::SEARCH.0))
                .child(crate::glass::layer(
                    crate::glass::GlassSpec::rounded(radius::SEARCH.0)
                        .variant(crate::glass::GlassVariant::Regular),
                    None,
                ))
                .child(field)
        } else {
            view()
                .flex_1()
                .rounded(px(radius::SEARCH.0))
                .bg(tokens::tertiary_fill)
                .child(field)
        }
    };

    view()
        .w_full()
        .flex_col()
        .gap(px(8.0))
        .child(
            view()
                .w_full()
                .flex_row()
                .items_center()
                .gap(px(8.0))
                .child(box_view)
                .child(when(
                    move || cancel && focused_for_cancel.get(),
                    move || {
                        button()
                            .min_h(px(36.0))
                            .items_center()
                            .justify_center()
                            .px(px(4.0))
                            .accessibility_label("Cancel")
                            .role(AccessibilityRole::Button)
                            .active(|s| s.opacity(0.4))
                            .on_press(move || cx.emit(SearchFieldEvent::Cancel))
                            .child(
                                text("Cancel")
                                    .text_size(type_default::BODY.size)
                                    .text_color(tokens::system_blue),
                            )
                    },
                )),
        )
        .child(props.children)
}
