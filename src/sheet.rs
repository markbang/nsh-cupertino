//! [`Sheet`]: a panel from the bottom with iOS's medium and large detents.
//!
//! One large panel is moved by its detent's offset and the finger's
//! translation, both animated values the platform plays: the drags and the
//! springs between detents run on the UI thread.

use std::rc::Rc;

use nsh_base::button;
use nsh_core::{AccessibilityRole, BoxShadow, Haptic, element::Children, prelude::*};

use crate::{
    overlay::{Presence, layer, offscreen, sheet_spring},
    tokens::{self, metrics, motion, radius, space, type_default},
};

/// The props of [`Sheet`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SheetProps {
    /// Open (controlled): the app owns it and follows `onOpenChange`.
    pub open: Prop<Option<bool>>,
    /// Open at first, while `open` is not set.
    #[prop(default)]
    pub default_open: Prop<bool>,
    /// `"medium"` (half the screen) or `"large"` (all but the top inset),
    /// when the app controls it; the user's drags report `onDetentChange`.
    pub detent: Prop<Option<SharedString>>,
    /// The detent at first (`"large"` unless set).
    pub default_detent: Prop<Option<SharedString>>,
    /// A title in the sheet's header, on the grabber's line.
    pub title: Prop<Option<SharedString>>,
    /// A leading action in the header ("Cancel"), reported by `onLeading`.
    pub leading: Prop<Option<SharedString>>,
    /// A trailing action in the header ("Done"), reported by `onTrailing`.
    pub trailing: Prop<Option<SharedString>>,
    /// Scrolls its content (on unless `false`): `false` for content that
    /// scrolls itself, a page of lists or a navigation stack.
    pub scroll: Prop<Option<bool>>,
    /// What the sheet shows.
    pub children: Prop<Children>,
}

/// The events of a [`Sheet`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum SheetEvent {
    /// It asks to open or close: set `open` to follow.
    #[args(open)]
    OpenChange(bool),
    /// A drag ended on the other detent: `"medium"` or `"large"`.
    #[args(detent)]
    DetentChange(String),
    /// The user closed it (the backdrop, Escape, back, or a drag past the
    /// medium detent).
    Cancel,
    /// The header's leading action was pressed.
    Leading,
    /// The header's trailing action was pressed.
    Trailing,
}

const GRABBER_WIDTH: f32 = 36.0;
const GRABBER_HEIGHT: f32 = 5.0;
/// How far below the medium detent a drag must end to close the sheet.
const DISMISS_SLOP: f32 = 80.0;

fn large_top() -> f32 {
    nsh_core::element::safe_area().top.0 + 10.0
}

fn large_height() -> f32 {
    (nsh_core::element::window().height.0 - large_top()).max(120.0)
}

/// Whether the window is wider than a sheet: the panel is then a card.
fn card() -> bool {
    nsh_core::element::window().width.0 > metrics::SHEET_MAX_WIDTH
}

/// The panel's width: the window's, up to the cap, and centred.
fn panel_width() -> f32 {
    nsh_core::element::window()
        .width
        .0
        .min(metrics::SHEET_MAX_WIDTH)
}

fn panel_left() -> f32 {
    ((nsh_core::element::window().width.0 - panel_width()) / 2.0).max(0.0)
}

/// The gap a card keeps below it; none while it is a bottom sheet.
fn card_gap() -> f32 {
    if card() { space::TWO.0 } else { 0.0 }
}

/// The panel's height: the large detent's, less the gap a card leaves below it.
fn panel_height() -> f32 {
    (large_height() - card_gap()).max(120.0)
}

fn medium_height() -> f32 {
    (nsh_core::element::window().height.0 * 0.5).max(160.0)
}

fn detent_offset(detent: &str) -> f32 {
    if detent == "medium" {
        (large_height() - medium_height()).max(0.0)
    } else {
        0.0
    }
}

fn spring_with(velocity: f32) -> Spring {
    Spring {
        velocity: Some(velocity),
        ..sheet_spring()
    }
}

/// A sheet from the bottom with two detents.
///
/// Drag its grabber (or its header) to move between medium and large; a
/// drag that ends past the medium detent closes it. The backdrop dims only
/// at the large detent, as on iOS, and the springs between detents are the
/// design system's sheet spring. Reduce Motion skips the entrance and exit.
#[component]
pub fn Sheet(props: SheetProps, cx: Scope<SheetEvent>) -> impl IntoElement {
    let presence = Presence::new(props.open, props.default_open, 320.0);
    presence.sync();
    let initial = props
        .detent
        .get_untracked()
        .or(props.default_detent.get())
        .unwrap_or_else(|| "large".into());
    let detent = stored(initial.clone());
    let detent_y = animated_value(detent_offset(&initial));
    let drag = animated_value(0.0);

    let controlled_detent = props.detent;
    let animation = detent_y;
    effect(move || {
        if let Some(name) = controlled_detent.get() {
            detent.replace(name.clone());
            animation.spring(detent_offset(&name), sheet_spring());
        }
    });
    // Coming in after being closed: start from the detent it opens on.
    let start_y = detent_y;
    let start_detent = detent;
    let start_drag = drag;
    let opening = presence.clone();
    effect(move || {
        if opening.open() {
            start_y.set(detent_offset(&start_detent.get()));
            start_drag.set(0.0);
        }
    });

    let request_close: Rc<dyn Fn()> = {
        let presence = presence.clone();
        Rc::new(move || presence.request(false))
    };
    when(presence.shown(), move || {
        sheet_panel(
            presence.clone(),
            cx,
            detent,
            detent_y,
            drag,
            request_close.clone(),
            props.title,
            props.leading,
            props.trailing,
            props.scroll.get_untracked().unwrap_or(true),
            props.children,
        )
    })
}

#[allow(clippy::too_many_arguments)]
fn sheet_panel(
    presence: Presence,
    cx: Scope<SheetEvent>,
    detent: Stored<SharedString>,
    detent_y: AnimatedValue,
    drag: AnimatedValue,
    request_close: Rc<dyn Fn()>,
    title: Prop<Option<SharedString>>,
    leading: Prop<Option<SharedString>>,
    trailing: Prop<Option<SharedString>>,
    scrolls: bool,
    children: Prop<Children>,
) -> impl IntoElement {
    let enter = presence
        .progress()
        .interpolate(&[0.0, 1.0], &[offscreen(), 0.0]);
    let translate = detent_y.add(&enter).add(&drag);
    let dim = presence
        .progress()
        .mul(&detent_y.interpolate(&[0.0, detent_offset("medium")], &[0.32, 0.03]));

    let dismiss_backdrop = request_close.clone();
    let backdrop = layer()
        .bg(rgba(0x000000ff))
        .bind_opacity(&dim)
        .on_press(move || {
            dismiss_backdrop();
            cx.emit(SheetEvent::OpenChange(false));
            cx.emit(SheetEvent::Cancel);
        })
        .on_cancel({
            let dismiss = request_close.clone();
            move || {
                dismiss();
                cx.emit(SheetEvent::OpenChange(false));
                cx.emit(SheetEvent::Cancel);
            }
        });

    let dismiss_drag = request_close.clone();
    let on_drag_end: Rc<dyn Fn(&PanEvent)> = Rc::new(move |event: &PanEvent| {
        let base = detent_offset(&detent.get());
        let current = base + event.value_y.unwrap_or(0.0);
        let medium = detent_offset("medium");
        detent_y.set(current);
        drag.set(0.0);
        if current > medium + DISMISS_SLOP {
            dismiss_drag();
            cx.emit(SheetEvent::OpenChange(false));
            cx.emit(SheetEvent::Cancel);
            return;
        }
        let target = if current > medium * 0.5 {
            "medium"
        } else {
            "large"
        };
        let at = detent_offset(target);
        if (at - current).abs() > 0.5 {
            nsh_core::element::haptic(Haptic::Selection);
            detent.replace(SharedString::from(target));
            cx.emit(SheetEvent::DetentChange(target.to_owned()));
        }
        detent_y.spring(at, spring_with(event.velocity_y));
    });
    let drag_end = on_drag_end.clone();
    let trailing_close = request_close.clone();
    let leading_close = request_close.clone();

    let header = view()
        .flex_col()
        .flex_none()
        .pt(px(8.0))
        .child(
            view().w_full().items_center().pb(px(6.0)).child(
                view()
                    .w(px(GRABBER_WIDTH))
                    .h(px(GRABBER_HEIGHT))
                    .rounded_full()
                    .bg(tokens::tertiary_label),
            ),
        )
        .child(
            view()
                .w_full()
                .px(px(16.0))
                .min_h(px(28.0))
                .pb(px(8.0))
                .flex_row()
                .items_center()
                .child(when(
                    move || leading.get().is_some(),
                    move || {
                        let label = leading.get_untracked().unwrap_or_default();
                        button()
                            .min_h(px(44.0))
                            .px(px(4.0))
                            .mr(px(12.0))
                            .rounded(px(8.0))
                            .accessibility_label(label.clone())
                            .role(AccessibilityRole::Button)
                            .active(|s| s.opacity(motion::PRESS_OPACITY))
                            .on_press({
                                let close = leading_close.clone();
                                move || {
                                    close();
                                    cx.emit(SheetEvent::OpenChange(false));
                                    cx.emit(SheetEvent::Leading);
                                }
                            })
                            .child(
                                text(label)
                                    .text_size(type_default::BODY.size)
                                    .text_color(tokens::system_blue),
                            )
                            .into_element()
                    },
                ))
                .child(
                    text(move || title.get().unwrap_or_default())
                        .flex_1()
                        .text_size(type_default::HEADLINE.size)
                        .line_height(type_default::HEADLINE.line_height)
                        .font_weight(FontWeight(type_default::HEADLINE.weight))
                        .text_color(tokens::label)
                        .truncate(),
                )
                .child(when(
                    move || trailing.get().is_some(),
                    move || {
                        let label = trailing.get_untracked().unwrap_or_default();
                        button()
                            .min_h(px(44.0))
                            .px(px(4.0))
                            .rounded(px(8.0))
                            .accessibility_label(label.clone())
                            .role(AccessibilityRole::Button)
                            .active(|s| s.opacity(motion::PRESS_OPACITY))
                            .on_press({
                                let close = trailing_close.clone();
                                move || {
                                    close();
                                    cx.emit(SheetEvent::OpenChange(false));
                                    cx.emit(SheetEvent::Trailing);
                                }
                            })
                            .child(
                                text(label)
                                    .text_size(type_default::BODY.size)
                                    .text_color(tokens::system_blue),
                            )
                            .into_element()
                    },
                )),
        )
        .pan_values(None, Some(&drag))
        .on_pan_end(move |event: &PanEvent| drag_end(event));

    let corners = if card() {
        [radius::SHEET.0; 4]
    } else {
        [radius::SHEET.0, radius::SHEET.0, 0.0, 0.0]
    };
    layer().child(backdrop).child(
        overlay()
            .absolute()
            .left(move || px(panel_left()))
            .bottom(move || px(card_gap()))
            .w(move || px(panel_width()))
            .h(move || px(panel_height()))
            .flex_col()
            .overflow_hidden()
            .rounded_t(radius::SHEET)
            // A window wider than the panel leaves it a card, all four corners round.
            .style_when(card, |s| s.rounded_b(radius::SHEET))
            .child(crate::glass::layer(
                crate::glass::material_spec("thick", corners),
                None,
            ))
            .shadow([BoxShadow {
                offset_y: px(-2.0),
                blur: px(24.0),
                color: rgba(0x00000026).into(),
                ..BoxShadow::default()
            }])
            .bind_translate_y(&translate)
            .on_press(|| {})
            .role(AccessibilityRole::Dialog)
            .child(header)
            .child(if scrolls {
                scroll()
                    .flex_1()
                    .bounces(true)
                    .child(view().w_full().pb_safe_area_plus(px(24.0)).child(children))
                    .into_element()
            } else {
                view()
                    .flex_1()
                    .w_full()
                    .pb_safe_area_plus(px(0.0))
                    .child(children)
                    .into_element()
            }),
    )
}
