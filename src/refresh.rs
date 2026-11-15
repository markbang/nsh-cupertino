//! [`RefreshView`]: a scrolling page with iOS's pull to refresh.

use nsh_core::{AccessibilityRole, Haptic, element::Children, prelude::*};

use crate::{
    indicator::activity_indicator,
    overlay::spring,
    tokens::{self, type_default},
};

/// The props of [`RefreshView`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct RefreshViewProps {
    /// The scrolling content.
    pub children: Prop<Children>,
    /// A refresh runs: the indicator stays out, turning.
    #[prop(default)]
    pub refreshing: Prop<bool>,
    /// The content's background (`system-grouped-background` unless set).
    pub background: Prop<Option<SharedString>>,
    /// The token the indicator is drawn in (`tertiary-label` unless set).
    pub tint: Prop<Option<SharedString>>,
}

/// The events of a [`RefreshView`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum RefreshViewEvent {
    /// The user pulled past the threshold and let go.
    Refresh,
}

/// How far the user pulls before releasing asks for a refresh.
const THRESHOLD: f32 = 100.0;
/// The indicator's room above the content.
pub(crate) const INDICATOR_HEIGHT: f32 = 60.0;

/// A vertical scroll view whose pull past its top shows an activity
/// indicator that stretches and drops with the drag; releasing past 100 pt
/// asks for a refresh, and the indicator stays out while `refreshing`.
///
/// Pulling does not block the scroll: the indicator follows a bound animated
/// value, so a busy app cannot make it stutter.
#[component]
pub fn RefreshView(props: RefreshViewProps, cx: Scope<RefreshViewEvent>) -> impl IntoElement {
    let pull = animated_value(0.0);
    let show = animated_value(0.0);
    let refreshing = props.refreshing;
    let shown = show;
    effect(move || {
        let now = refreshing.get();
        if now {
            shown.spring(1.0, spring(0.82, 300.0));
        } else {
            shown.spring(0.0, spring(0.9, 260.0));
        }
    });
    let tint = props.tint;
    let background = props.background;
    let indicator = pull_indicator(&pull, &show, tint.get_untracked());
    let ask = {
        let refreshing = props.refreshing;
        move || {
            if refreshing.get_untracked() {
                return;
            }
            nsh_core::element::haptic(Haptic::Impact(nsh_core::HapticImpact::Light));
            cx.emit(RefreshViewEvent::Refresh);
        }
    };

    view()
        .relative()
        .flex_1()
        .child(
            scroll()
                .flex_1()
                .bounces(true)
                .scroll_value(&pull)
                .on_scroll_end(move |offset: &Point<Points>| {
                    if offset.y.0 <= -THRESHOLD {
                        ask();
                    }
                })
                .child(
                    view()
                        .w_full()
                        .bg(move || match background.get().as_deref() {
                            Some(name) => tokens::system(name),
                            None => tokens::system_grouped_background(),
                        })
                        .child(props.children),
                ),
        )
        .child(indicator)
}

/// The spinner over a pulled scroll view: low and small at rest, at the top
/// and full size once the pull reaches the threshold, and out while a
/// refresh runs.
pub(crate) fn pull_indicator(
    pull: &AnimatedValue,
    show: &AnimatedValue,
    tint: Option<SharedString>,
) -> View {
    let depth = pull.mul(-1.0);
    let hidden = show.mul(-1.0).add(1.0);
    let translate = depth
        .interpolate(&[0.0, THRESHOLD], &[-INDICATOR_HEIGHT, 0.0])
        .mul(&hidden);
    let opacity = depth
        .interpolate(&[0.0, 24.0], &[0.0, 1.0])
        .add(show)
        .diff_clamp(0.0, 1.0);
    let scale = depth
        .interpolate(&[0.0, THRESHOLD], &[0.55, 1.0])
        .add(&show.mul(0.45))
        .diff_clamp(0.5, 1.0);
    view()
        .absolute()
        .top_0()
        .left_0()
        .right_0()
        .h(px(INDICATOR_HEIGHT))
        .items_center()
        .justify_center()
        .bind_translate_y(&translate)
        .bind_opacity(&opacity)
        .pointer_events(PointerEvents::None)
        .role(AccessibilityRole::Progressbar)
        .label(text_label())
        .child(
            activity_indicator()
                .size(24.0)
                .color(tint.unwrap_or_else(|| "tertiary-label".into()))
                .bind_scale(&scale),
        )
}

fn text_label() -> SharedString {
    SharedString::from("Pull to refresh")
}

/// The one line a refreshed page shows under its indicator in the demo.
#[allow(dead_code)]
pub(crate) fn refresh_caption() -> impl IntoElement {
    text("Pull to refresh")
        .text_size(type_default::FOOTNOTE.size)
        .text_color(tokens::secondary_label)
}
