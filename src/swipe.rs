//! [`SwipeRow`]: leading and trailing actions behind a list row, as Mail's.

use nsh_core::{AccessibilityRole, Haptic, HapticImpact, element::Children, prelude::*};

use crate::{
    icon::icon,
    overlay::spring,
    tokens::{self, type_default},
};

/// One action behind a swiped row.
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct SwipeAction {
    /// Reported with `onAction`.
    pub id: SharedString,
    /// What the action says under its icon.
    pub title: SharedString,
    /// Its icon, by name ([`crate::icon::NAMES`]).
    #[prop(skip_none)]
    pub icon: Option<SharedString>,
    /// The token of its surface (`"system-red"` unless set); a destructive
    /// action is red.
    #[prop(skip_none)]
    pub tint: Option<SharedString>,
    /// Red: it deletes something.
    #[prop(default)]
    pub destructive: bool,
}

impl SwipeAction {
    /// An action of `id`, titled `title`.
    pub fn new(id: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            icon: None,
            tint: None,
            destructive: false,
        }
    }

    /// Its icon.
    pub fn icon(mut self, icon: impl Into<SharedString>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    /// Red: it deletes something.
    pub fn destructive(mut self, destructive: bool) -> Self {
        self.destructive = destructive;
        self
    }

    /// The token of its surface.
    pub fn tint(mut self, tint: impl Into<SharedString>) -> Self {
        self.tint = Some(tint.into());
        self
    }
}

/// The props of a [`SwipeRow`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SwipeRowProps {
    /// The row: a [`ListTile`](crate::ListTile) or any content.
    pub children: Prop<Children>,
    /// Actions revealed by swiping right (opening from the leading edge).
    #[prop(default)]
    pub leading: Prop<Vec<SwipeAction>>,
    /// Actions revealed by swiping left (opening from the trailing edge).
    #[prop(default)]
    pub trailing: Prop<Vec<SwipeAction>>,
    /// The action a full swipe fires, by id: past two thirds of the row,
    /// the row springs back while the action runs.
    pub full_swipe: Prop<Option<SharedString>>,
}

/// The events of a [`SwipeRow`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SwipeRowEvent {
    /// An action was pressed, or a full swipe fired: its id, and whether a
    /// full swipe fired it.
    #[args(id, full)]
    Action(String, bool),
}

const ACTION_WIDTH: f32 = 80.0;

/// A row whose swipe reveals its actions: at most one side stays open,
/// releasing past half its actions' width snaps it open, and a full swipe
/// fires the row's action with a spring back.
///
/// The drag runs on the UI thread through an animated value; the row scrolls
/// vertically as usual because only the horizontal axis is bound.
#[component]
pub fn SwipeRow(props: SwipeRowProps, cx: Scope<SwipeRowEvent>) -> impl IntoElement {
    let x = animated_value(0.0);
    let width = stored(0.0_f32);
    let open = stored(false);
    let leading = props.leading.get_untracked();
    let trailing = props.trailing.get_untracked();
    let full_swipe = props.full_swipe.get_untracked();
    let leading_width = leading.len() as f32 * ACTION_WIDTH;
    let trailing_width = trailing.len() as f32 * ACTION_WIDTH;

    let mut layers = view().absolute().inset_0().flex_row();
    layers = layers.child(
        view()
            .absolute()
            .left_0()
            .top_0()
            .bottom_0()
            .flex_row()
            .children(
                leading
                    .clone()
                    .into_iter()
                    .map(|action| action_view(action, cx)),
            ),
    );
    layers = layers.child(
        view()
            .absolute()
            .right_0()
            .top_0()
            .bottom_0()
            .flex_row()
            .children(
                trailing
                    .clone()
                    .into_iter()
                    .map(|action| action_view(action, cx)),
            ),
    );

    let content = view()
        .relative()
        .w_full()
        .bg(tokens::secondary_system_grouped_background)
        .bind_translate_x(&x)
        .pan_values(Some(&x), None)
        .on_pan_end(move |event: &PanEvent| {
            let moved = event.value_x.unwrap_or(0.0);
            let row = width.get().max(1.0);
            let full = full_swipe.clone();
            if let Some(id) = full
                && moved.abs() > row * 0.66
                && ((moved < 0.0 && !trailing.is_empty()) || (moved > 0.0 && !leading.is_empty()))
            {
                cx.emit(SwipeRowEvent::Action(id.to_string(), true));
                x.spring(if moved < 0.0 { -row } else { row }, spring(0.72, 260.0));
                let back = x;
                set_timeout(std::time::Duration::from_millis(220), move || {
                    back.spring(0.0, spring(0.86, 300.0));
                });
                open.replace(false);
                return;
            }
            let limit = if moved < 0.0 {
                trailing_width
            } else {
                leading_width
            };
            let target = if moved.abs() > limit * 0.5 && limit > 0.0 {
                if moved < 0.0 { -limit } else { limit }
            } else {
                0.0
            };
            if target != 0.0 && !open.get() {
                nsh_core::element::haptic(Haptic::Impact(HapticImpact::Light));
            }
            open.replace(target != 0.0);
            x.spring(target, spring(0.85, 320.0));
        })
        .child(props.children);

    view()
        .relative()
        .w_full()
        .overflow_hidden()
        .on_layout(move |bounds: &Bounds<Points>| {
            width.replace(bounds.size.width.0);
        })
        .child(layers)
        .child(content)
}

fn action_view(action: SwipeAction, cx: Scope<SwipeRowEvent>) -> AnyElement {
    let id = action.id.clone();
    let label = action.title.clone();
    let icon_name = action.icon.clone();
    let tint = action.tint.clone();
    let destructive = action.destructive;
    view()
        .w(px(ACTION_WIDTH))
        .h_full()
        .items_center()
        .justify_center()
        .gap(px(4.0))
        .bg(move || match &tint {
            Some(name) => tokens::system(name),
            None if destructive => tokens::system_red(),
            None => tokens::system_gray(),
        })
        .on_press(move || {
            nsh_core::element::haptic(Haptic::Impact(HapticImpact::Light));
            cx.emit(SwipeRowEvent::Action(id.to_string(), false));
        })
        .role(AccessibilityRole::Button)
        .label(label.clone())
        .child(
            view()
                .size(px(22.0))
                .items_center()
                .justify_center()
                .child(match icon_name {
                    Some(name) => icon(&name, 22.0)
                        .text_color(rgba(0xffff_ffff))
                        .into_element(),
                    None => view().into_element(),
                }),
        )
        .child(
            text(label)
                .text_size(type_default::CAPTION1.size)
                .line_height(type_default::CAPTION1.line_height)
                .font_weight(FontWeight(600))
                .text_color(rgba(0xffff_ffff))
                .number_of_lines(1),
        )
        .into_element()
}
