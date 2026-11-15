//! [`ContextMenu`]: iOS's menu about a pressed item, with a lifted preview.

use nsh_base::{context_menu as base_context_menu, menu_item, menu_separator};
use nsh_core::{
    AccessibilityRole,
    element::{MotionPreset, Slot},
    prelude::*,
};

use crate::{
    icon::icon,
    overlay::layer,
    tokens::{self, radius, type_default},
};

/// One item of a [`ContextMenu`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct ContextAction {
    /// Reported with `onAction` when it is chosen.
    pub id: SharedString,
    /// What the row says.
    pub title: SharedString,
    /// An icon before the title, by name ([`crate::icon::NAMES`]).
    #[prop(skip_none)]
    pub icon: Option<SharedString>,
    /// Red text: it destroys something.
    #[prop(default)]
    pub destructive: bool,
    /// Dimmed and not choosable.
    #[prop(default)]
    pub disabled: bool,
}

impl ContextAction {
    /// An item of `id`, titled `title`.
    pub fn new(id: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            icon: None,
            destructive: false,
            disabled: false,
        }
    }

    /// An icon before its title.
    pub fn icon(mut self, icon: impl Into<SharedString>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    /// Red: it destroys something.
    pub fn destructive(mut self, destructive: bool) -> Self {
        self.destructive = destructive;
        self
    }

    /// Dimmed and not choosable.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }
}

/// The props of [`ContextMenu`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ContextMenuProps {
    /// What the menu is about: a held finger or the secondary button opens
    /// it on this content.
    pub trigger: Prop<Option<Slot>>,
    /// What is lifted over the page while the menu is open (iOS's preview);
    /// the trigger stays where it is.
    pub preview: Prop<Option<Slot>>,
    /// Its items, in one group.
    #[prop(default)]
    pub actions: Prop<Vec<ContextAction>>,
    /// No menu: a held finger and the secondary button do nothing.
    #[prop(default)]
    pub disabled: Prop<bool>,
    /// Open (controlled): the app owns it and follows `onOpenChange`.
    pub open: Prop<Option<bool>>,
}

/// The events of a [`ContextMenu`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ContextMenuEvent {
    /// It asks to open or close: set `open` to follow.
    #[args(open)]
    OpenChange(bool),
    /// The item with this `id` was chosen.
    #[args(id)]
    Action(String),
}

/// A menu about the content it wraps: a long press on touch screens, the
/// secondary button on desktops, and Shift+F10 or the Menu key when the
/// trigger has the keyboard focus.
///
/// The backdrop blurs the page behind it and the preview rises out of the
/// trigger; the menu itself is iOS's grouped surface with 17 pt rows and
/// hairline separators. Escape, a press outside and the Android back button
/// close it without choosing.
#[component]
pub fn ContextMenu(props: ContextMenuProps, cx: Scope<ContextMenuEvent>) -> impl IntoElement {
    let shown = signal(props.open.get_untracked().unwrap_or(false));
    let actions = props.actions;
    let preview = props.preview;
    let disabled = props.disabled;
    // The preview comes in when the menu opens; it is made with the menu.
    let motion = motion().entering(MotionPreset::ZoomIn);
    let still = nsh_core::element::reduce_motion();
    let opening = shown;
    effect(move || {
        if opening.get() && !still {
            motion.play(MotionPreset::ZoomIn);
        }
    });

    let mut items: Vec<AnyElement> = Vec::new();
    for action in actions.get_untracked() {
        let id = action.id.clone();
        let destructive = action.destructive;
        let icon_name = action.icon.clone();
        let label = action.title.clone();
        items.push(
            menu_item()
                .disabled(action.disabled)
                .accessibility_label(label.clone())
                .on_select(move || cx.emit(ContextMenuEvent::Action(id.to_string())))
                .flex_row()
                .items_center()
                .gap(px(12.0))
                .min_h(px(44.0))
                .px(px(14.0))
                .rounded(px(9.0))
                .active(|s| s.bg(tokens::fill))
                .child(
                    view().w(px(22.0)).items_center().child(match icon_name {
                        Some(name) => icon(&name, 20.0)
                            .text_color(if destructive {
                                tokens::system_red()
                            } else {
                                tokens::label()
                            })
                            .into_element(),
                        None => view().into_element(),
                    }),
                )
                .child(
                    text(label)
                        .flex_1()
                        .text_size(type_default::BODY.size)
                        .line_height(type_default::BODY.line_height)
                        .text_color(if destructive {
                            tokens::system_red()
                        } else {
                            tokens::label()
                        }),
                )
                .into_element(),
        );
    }
    let divider = || {
        menu_separator()
            .h(tokens::separator_thickness)
            .my(px(4.0))
            .mx(px(14.0))
            .bg(tokens::separator)
            .into_element()
    };
    let split = items.len().saturating_sub(1);
    let mut list: Vec<AnyElement> = Vec::new();
    for (index, item) in items.into_iter().enumerate() {
        list.push(item);
        if index < split {
            list.push(divider());
        }
    }

    let trigger = props.trigger.place(|slot| slot);
    let open = shown;
    let menu = base_context_menu()
        .disabled(disabled)
        .offset(px(8.0))
        .margin(px(12.0))
        .open(move || Some(open.get()))
        .popup_style(|s| {
            s.p(px(6.0))
                .min_w(px(250.0))
                .rounded(px(radius::SHEET.0))
                .bg(tokens::secondary_system_background().opacity(0.97))
                .backdrop_blur(px(24.0))
                .shadow([nsh_core::BoxShadow {
                    offset_y: px(10.0),
                    blur: px(40.0),
                    color: rgba(0x00000040).into(),
                    ..nsh_core::BoxShadow::default()
                }])
        })
        .backdrop_class("bg-black/20 backdrop-blur-sm")
        .on_open_change({
            let open = shown;
            move |event: &nsh_base::MenuEvent| {
                if let nsh_base::MenuEvent::OpenChange(next, _reason) = event {
                    open.set(*next);
                    cx.emit(ContextMenuEvent::OpenChange(*next));
                }
            }
        })
        .trigger(view().w_full().child(trigger))
        .children(list);

    // The lifted preview, under the menu's own overlay.
    let lifted = when(
        move || preview.get().is_some() && shown.get(),
        move || {
            let content = preview.place(|slot| {
                slot.flex_none()
                    .rounded(px(16.0))
                    .overflow_hidden()
                    .bg(tokens::secondary_system_background)
                    .shadow([nsh_core::BoxShadow {
                        offset_y: px(18.0),
                        blur: px(48.0),
                        color: rgba(0x00000059).into(),
                        ..nsh_core::BoxShadow::default()
                    }])
            });
            overlay()
                .absolute()
                .inset_0()
                .focusable(false)
                .pointer_events(PointerEvents::None)
                .child(
                    overlay()
                        .absolute()
                        .inset_0()
                        .focusable(false)
                        .bg(rgba(0x000000ff))
                        .opacity(0.18),
                )
                .child(
                    layer()
                        .items_center()
                        .justify_start()
                        .pt(px(140.0))
                        .px(px(24.0))
                        .pointer_events(PointerEvents::None)
                        .child(
                            view()
                                .bind_motion(&motion)
                                .pointer_events(PointerEvents::None)
                                .role(AccessibilityRole::Group)
                                .child(content),
                        ),
                )
        },
    );

    view().child(lifted).child(menu)
}
