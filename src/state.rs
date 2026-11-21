//! [`EmptyState`], [`ErrorBanner`], [`Skeleton`] and [`Toast`]: what a screen
//! shows while it has nothing yet, has failed to load, is loading, or has
//! something to say about what just happened.

use std::{cell::RefCell, rc::Rc, time::Duration};

use nsh_core::{
    AccessibilityRole,
    element::{Children, Easing},
    prelude::*,
    time::{Instant, now},
};

use crate::{
    button::button,
    icon::icon_stroke,
    overlay::spring,
    tokens::{self, radius, type_default},
};

/// The illustration's side: Cohub Mobile's `EmptyState` mascot.
const ILLUSTRATION: f32 = 92.0;
/// The badge on the illustration's corner: `size-8`, set at its bottom-left.
const BADGE: f32 = 32.0;
/// The banner's illustration: Cohub Mobile's `DataError` mascot.
const BANNER_ILLUSTRATION: f32 = 32.0;
/// The avatar of a skeleton row (`LIST_AVATAR_SIZE`).
const AVATAR: f32 = 46.0;
/// The retry target: `IconButton`'s 44 pt, and the glyph drawn at 24 pt.
const RETRY_TARGET: f32 = 44.0;
const RETRY_GLYPH: f32 = 24.0;
/// A skeleton row's height at least: `min-h-18`.
const SKELETON_ROW: f32 = 72.0;

/// The props of [`EmptyState`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct EmptyStateProps {
    /// The headline: 17 pt semibold.
    pub title: Prop<Option<SharedString>>,
    /// The line under it: 15 pt in the secondary label color, at most 300 pt wide.
    pub description: Prop<Option<SharedString>>,
    /// An icon on an accent disc at the illustration's bottom-left, which says
    /// what kind of empty this is (`folder`, `magnifyingglass`, ...).
    pub badge: Prop<Option<SharedString>>,
    /// A plain button under the description, by its title (none leaves it out).
    pub action: Prop<Option<SharedString>>,
    /// The action's icon, before its title.
    pub action_icon: Prop<Option<SharedString>>,
    /// The illustration, drawn in a 92 pt box: the brand's mark, or nothing.
    pub children: Prop<Children>,
}

/// The events of an [`EmptyState`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum EmptyStateEvent {
    /// The action button was pressed.
    Action,
}

/// What a list shows when it has nothing to list: an illustration with a
/// badge, a headline, a description and an optional action, centred, with
/// the sizes Cohub Mobile's `EmptyState` uses.
///
/// It has no margins: the screen places it.
#[component]
pub fn EmptyState(props: EmptyStateProps, cx: Scope<EmptyStateEvent>) -> impl IntoElement {
    let title = props.title;
    let description = props.description;
    let badge = props.badge;
    let action = props.action;
    let action_icon = props.action_icon;
    let has_action = props.action.get_untracked().is_some();
    view()
        .w_full()
        .flex_col()
        .items_center()
        .px(px(24.0))
        .child(
            view()
                .size(px(ILLUSTRATION))
                .child(props.children)
                .when_some(badge.get_untracked(), |v, name| {
                    v.child(
                        view()
                            .absolute()
                            .left(px(-4.0))
                            .bottom(px(-2.0))
                            .size(px(BADGE))
                            .items_center()
                            .justify_center()
                            .rounded_full()
                            .bg(tokens::system_blue)
                            .child(icon_stroke(&name, 16.0, 2.1).text_color(tokens::on_tint)),
                    )
                }),
        )
        .child(
            text(move || title.get().unwrap_or_default())
                .mt(px(16.0))
                .text_size(type_default::HEADLINE.size)
                .line_height(type_default::HEADLINE.line_height)
                .font_weight(FontWeight(600))
                .text_color(tokens::label)
                .text_center(),
        )
        .when_some(description.get_untracked(), |v, _| {
            v.child(
                text(move || description.get().unwrap_or_default())
                    .mt(px(8.0))
                    .max_w(px(300.0))
                    .text_size(type_default::SUBHEADLINE.size)
                    .line_height(type_default::SUBHEADLINE.line_height)
                    .text_color(tokens::secondary_label)
                    .text_center(),
            )
        })
        .when(has_action, |v| {
            v.child(
                view().mt(px(12.0)).child(
                    button()
                        .variant("plain")
                        .title(action.get_untracked().unwrap_or_default())
                        .icon(action_icon.get_untracked().unwrap_or_default())
                        .on_press(move || cx.emit(EmptyStateEvent::Action)),
                ),
            )
        })
}

/// The props of [`ErrorBanner`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ErrorBannerProps {
    /// The headline: 15 pt semibold.
    pub title: Prop<Option<SharedString>>,
    /// What went wrong, in the danger color: 13 pt, two lines at most.
    pub message: Prop<Option<SharedString>>,
    /// The illustration at the leading edge, in a 32 pt box (the brand's
    /// worried mark, or nothing).
    pub children: Prop<Children>,
}

/// The events of an [`ErrorBanner`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ErrorBannerEvent {
    /// The retry button was pressed.
    Retry,
}

/// An inline failure on a soft danger fill, 20 pt corners: an illustration, a
/// title and the message, and a retry button at the trailing edge. It is as
/// tall as its text: 56 pt with two message lines, 72 pt in all.
///
/// It has no margins: the screen places it.
#[component]
pub fn ErrorBanner(props: ErrorBannerProps, cx: Scope<ErrorBannerEvent>) -> impl IntoElement {
    let title = props.title;
    let message = props.message;
    view()
        .flex_row()
        .items_center()
        .gap(px(12.0))
        .pl(px(12.0))
        .pr(px(4.0))
        .py(px(8.0))
        .rounded(px(radius::GROUP.0))
        .bg(|| tokens::system("danger-soft"))
        .child(
            view()
                .size(px(BANNER_ILLUSTRATION))
                .items_center()
                .justify_center()
                .child(props.children),
        )
        .child(
            view()
                .flex_1()
                .min_w(px(0.0))
                .flex_col()
                .child(
                    text(move || title.get().unwrap_or_default())
                        .text_size(type_default::SUBHEADLINE.size)
                        .line_height(type_default::SUBHEADLINE.line_height)
                        .font_weight(FontWeight(600))
                        .text_color(tokens::label),
                )
                .when_some(message.get_untracked(), |v, _| {
                    v.child(
                        text(move || message.get().unwrap_or_default())
                            .text_size(type_default::FOOTNOTE.size)
                            .line_height(type_default::FOOTNOTE.line_height)
                            .font_weight(FontWeight(500))
                            .text_color(tokens::danger),
                    )
                }),
        )
        .child(
            nsh_base::button()
                .w(px(RETRY_TARGET))
                .h(px(RETRY_TARGET))
                .items_center()
                .justify_center()
                .role(AccessibilityRole::Button)
                .accessibility_label("Retry")
                .active(|s| s.opacity(0.4))
                .on_press(move || cx.emit(ErrorBannerEvent::Retry))
                .child(icon_stroke("arrow.clockwise", RETRY_GLYPH, 1.6).text_color(tokens::danger)),
        )
}

/// The props of [`Skeleton`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SkeletonProps {
    /// Rows to draw (3 unless set).
    pub rows: Prop<Option<f32>>,
}

/// Grey placeholders for a list of rows that is still loading: each row is a
/// 72 pt slot of an avatar, two text lines and a trailing pill, drawn in the
/// raised surface, so the swap to the real rows does not move the layout.
///
/// Its shapes are the ones Cohub Mobile's `LoadingRows` draws. It is not an
/// animation: a loader that moves is the caller's.
#[component]
pub fn Skeleton(props: SkeletonProps) -> impl IntoElement {
    let count = props.rows.get_untracked().unwrap_or(3.0).max(0.0) as usize;
    view()
        .w_full()
        .flex_col()
        .role(AccessibilityRole::Progressbar)
        .label("Loading")
        .children((0..count).map(skeleton_row))
}

fn skeleton_row(index: usize) -> impl IntoElement {
    const TITLES: [f32; 3] = [0.58, 0.68, 0.78];
    const SUBTITLES: [f32; 2] = [0.38, 0.53];
    view()
        .min_h(px(SKELETON_ROW))
        .flex_row()
        .items_center()
        .gap(px(12.0))
        .px(px(16.0))
        .py(px(12.0))
        .child(bone(AVATAR, AVATAR, AVATAR * 0.3))
        .child(
            view()
                .flex_1()
                .flex_col()
                .gap(px(4.0))
                .child(
                    view()
                        .flex_row()
                        .items_center()
                        .gap(px(8.0))
                        .child(
                            view()
                                .flex_1()
                                .h(px(22.0))
                                .justify_center()
                                .child(bone_relative(TITLES[index % 3], 12.0)),
                        )
                        .child(bone(28.0, 9.0, 4.5)),
                )
                .child(
                    view()
                        .h(px(20.0))
                        .justify_center()
                        .child(bone_relative(SUBTITLES[index % 2], 10.0)),
                ),
        )
}

fn bone(width: f32, height: f32, corner: f32) -> impl IntoElement {
    view()
        .w(px(width))
        .h(px(height))
        .rounded(px(corner))
        .bg(tokens::system_gray5)
}

fn bone_relative(fraction: f32, height: f32) -> impl IntoElement {
    view()
        .w(relative(fraction))
        .h(px(height))
        .rounded(px(height / 2.0))
        .bg(tokens::system_gray5)
}

/// The props of [`Toast`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ToastProps {
    /// The line that says what happened: 17 pt semibold.
    pub title: Prop<Option<SharedString>>,
    /// A detail under it: 13 pt in the secondary label. It wraps; Cohub Mobile
    /// clamps it at two lines, which this does not yet.
    pub message: Prop<Option<SharedString>>,
    /// `neutral` (the default), `success` or `danger`. A danger toast takes a
    /// red border.
    pub tone: Prop<Option<SharedString>>,
    /// A text action at the trailing edge, by its title (none leaves it out).
    pub action: Prop<Option<SharedString>>,
    /// Its place in a [`ToastLayer`]: 0 is the front card (the default); 1 and
    /// up sit behind it, 10 pt higher, 4 % smaller and 35 % fainter per place.
    pub depth: Prop<Option<f32>>,
    /// How long it stays, in milliseconds, from when it shows. By default it
    /// follows its tone and action (see [`default_duration_ms`]).
    pub duration: Prop<Option<f32>>,
    /// Stays until it is swiped away or the app removes it, with no timer.
    pub sticky: Prop<Option<bool>>,
    /// The icon or mascot at the leading edge, drawn by the caller.
    pub children: Prop<Children>,
}

/// The events of a [`Toast`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ToastEvent {
    /// The action was pressed.
    Action,
    /// It was swiped away: the app takes it out of its layer.
    Dismiss,
    /// Its time ran out: it has faded, and the app takes it out of its layer.
    Expire,
}

/// Cohub Mobile's `Toast` motion (`components/Toast.tsx`): the card rises 16 pt
/// and grows from 96 % as it fades in, on a spring that settles in 400 ms
/// without bouncing.
const ENTER_RISE: f32 = 16.0;
const ENTER_SCALE: f32 = 0.96;
const STACK_OFFSET: f32 = 10.0;
const STACK_SHRINK: f32 = 0.04;
const STACK_FADE: f32 = 0.35;
/// A swipe past 56 pt, or a flick faster than 800 pt/s, dismisses the card; a
/// shorter one springs back in 400 ms.
const DISMISS_DISTANCE: f32 = 56.0;
const DISMISS_VELOCITY: f32 = 800.0;
/// The layer's bottom edge: 84 pt above the bottom inset, over the tab bar.
const BOTTOM_CLEARANCE: f32 = 84.0;
/// Cohub Mobile's `toast-queue.ts`: a neutral or success toast stays 3.2 s, a
/// danger one 5 s, and one with an action at least 5 s. A toast released after
/// a hold stays at least 1.5 s more.
const NEUTRAL_MS: f32 = 3200.0;
const DANGER_MS: f32 = 5000.0;
const ACTION_MS: f32 = 5000.0;
const RELEASE_GRACE_MS: f32 = 1500.0;
/// Cohub Mobile's `motion.settle`: the fade before an expired toast leaves.
const SETTLE_MS: f32 = 240.0;

/// How long a toast of this tone stays, with or without an action.
pub fn default_duration_ms(tone: &str, action: bool) -> f32 {
    let by_tone = if tone == "danger" {
        DANGER_MS
    } else {
        NEUTRAL_MS
    };
    if action {
        by_tone.max(ACTION_MS)
    } else {
        by_tone
    }
}

/// A toast's time (Cohub Mobile's `ToastClock`): it runs from when the toast
/// shows, and stops while a finger presses it or swipes it. Release resumes it
/// with the time left, at least [`RELEASE_GRACE_MS`].
struct Clock {
    timed: bool,
    left_ms: f32,
    started: Option<Instant>,
    task: Option<Spawned<()>>,
    pressed: bool,
    panning: bool,
}

impl Clock {
    fn held(&self) -> bool {
        self.pressed || self.panning
    }

    fn pause(&mut self) {
        if let Some(task) = self.task.take() {
            task.cancel();
            if let Some(started) = self.started.take() {
                let ran = (now() - started).as_secs_f32() * 1000.0;
                self.left_ms = (self.left_ms - ran).max(0.0);
            }
        }
    }
}

/// Changes what holds the toast, then pauses or resumes its time. `on_expire`
/// runs when the time is up.
fn hold(clock: &Rc<RefCell<Clock>>, on_expire: &Rc<dyn Fn()>, change: impl FnOnce(&mut Clock)) {
    let mut c = clock.borrow_mut();
    let was_held = c.held();
    change(&mut c);
    if c.held() {
        c.pause();
    } else if was_held {
        c.left_ms = c.left_ms.max(RELEASE_GRACE_MS);
        resume(clock, on_expire, &mut c);
    }
}

fn resume(clock: &Rc<RefCell<Clock>>, on_expire: &Rc<dyn Fn()>, c: &mut Clock) {
    if !c.timed || c.task.is_some() || c.held() || c.left_ms <= 0.0 {
        return;
    }
    c.started = Some(now());
    let (clock, on_expire) = (clock.clone(), on_expire.clone());
    c.task = Some(set_timeout(
        Duration::from_secs_f32(c.left_ms / 1000.0),
        move || {
            clock.borrow_mut().task = None;
            on_expire();
        },
    ));
}

/// The enter spring: unit mass, critically damped, settling in about 400 ms
/// (the exit and the return use their own stiffness inline).
fn enter_spring() -> Spring {
    spring(1.0, 270.0)
}

/// A short confirmation or failure on the floating surface, 20 pt corners and
/// a soft shadow: a leading icon, a title and an optional message and action.
///
/// It enters rising and growing, and it is swiped away to either side: past
/// 56 pt or on a fast flick, it leaves and emits `Dismiss`; short of that it
/// springs back. It takes no position: a [`ToastLayer`] places it.
#[component]
pub fn Toast(props: ToastProps, cx: Scope<ToastEvent>) -> impl IntoElement {
    let title = props.title;
    let message = props.message;
    let tone = props.tone;
    let danger = move || tone.get().as_deref() == Some("danger");
    let depth = props.depth.get_untracked().unwrap_or(0.0).max(0.0);
    let front = depth == 0.0;
    let has_action = props.action.get_untracked().is_some();
    let duration = props.duration.get_untracked().unwrap_or_else(|| {
        default_duration_ms(
            tone.get_untracked().as_deref().unwrap_or("neutral"),
            has_action,
        )
    });
    let timed = !props.sticky.get_untracked().unwrap_or(false);

    let fade = animated_value(0.0);
    let rise = animated_value(ENTER_RISE);
    let grow = animated_value(ENTER_SCALE);
    let swipe = animated_value(0.0);
    if nsh_core::element::reduce_motion() {
        fade.set(1.0);
        rise.set(0.0);
        grow.set(1.0);
    } else {
        fade.spring(1.0, enter_spring());
        rise.spring(0.0, enter_spring());
        grow.spring(1.0, enter_spring());
    }

    let clock = Rc::new(RefCell::new(Clock {
        timed,
        left_ms: duration,
        started: None,
        task: None,
        pressed: false,
        panning: false,
    }));
    let on_expire: Rc<dyn Fn()> = Rc::new(move || {
        if nsh_core::element::reduce_motion() {
            fade.set(0.0);
            cx.emit(ToastEvent::Expire);
        } else {
            fade.timing(0.0, SETTLE_MS, Easing::EaseOut);
            set_timeout(Duration::from_millis(SETTLE_MS as u64), move || {
                cx.emit(ToastEvent::Expire)
            });
        }
    });
    resume(&clock, &on_expire, &mut clock.borrow_mut());
    let on_press_down = {
        let (clock, on_expire) = (clock.clone(), on_expire.clone());
        move || hold(&clock, &on_expire, |c| c.pressed = true)
    };
    let on_press_up = {
        let (clock, on_expire) = (clock.clone(), on_expire.clone());
        move || hold(&clock, &on_expire, |c| c.pressed = false)
    };
    let on_pan_start = {
        let (clock, on_expire) = (clock.clone(), on_expire.clone());
        move |_: &PanEvent| hold(&clock, &on_expire, |c| c.panning = true)
    };
    let pan_end_clock = {
        let (clock, on_expire) = (clock.clone(), on_expire.clone());
        move || hold(&clock, &on_expire, |c| c.panning = false)
    };

    let release = move |event: &PanEvent| {
        pan_end_clock();
        let moved = event.value_x.unwrap_or(0.0);
        let flung = event.velocity_x.abs() > DISMISS_VELOCITY;
        if !flung && moved.abs() <= DISMISS_DISTANCE {
            swipe.spring(0.0, spring(0.8, 200.0));
            return;
        }
        let away = if moved < 0.0 || (moved == 0.0 && event.velocity_x < 0.0) {
            -1.0
        } else {
            1.0
        };
        swipe.spring(
            away * nsh_core::element::window().width.0,
            spring(1.0, 480.0),
        );
        set_timeout(std::time::Duration::from_millis(300), move || {
            cx.emit(ToastEvent::Dismiss)
        });
    };

    let card = view()
        .flex_row()
        .items_center()
        .gap(px(12.0))
        .px(px(16.0))
        .py(px(12.0))
        .rounded(px(radius::GROUP.0))
        .bg(|| tokens::system("tertiary-system-background"))
        .shadow([nsh_core::BoxShadow {
            offset_y: px(6.0),
            blur: px(20.0),
            color: rgba(0x0000_0024).into(),
            ..nsh_core::BoxShadow::default()
        }])
        .when(danger(), |v| v.border(px(1.0)).border_color(tokens::danger))
        .bind_opacity(&fade)
        .bind_translate_y(&rise)
        .bind_scale(&grow)
        .bind_translate_x(&swipe)
        .on_press_down(on_press_down)
        .on_press_up(on_press_up)
        .when(front, |v| {
            v.pan_values(Some(&swipe), None)
                .on_pan_start(on_pan_start)
                .on_pan_end(release)
        })
        .child(props.children)
        .child(
            view()
                .flex_1()
                .min_w(px(0.0))
                .flex_col()
                .gap(px(1.0))
                .child(
                    text(move || title.get().unwrap_or_default())
                        .text_size(type_default::HEADLINE.size)
                        .line_height(type_default::HEADLINE.line_height)
                        .font_weight(FontWeight(600))
                        .text_color(tokens::label)
                        .truncate(),
                )
                .when_some(message.get_untracked(), |v, _| {
                    v.child(
                        text(move || message.get().unwrap_or_default())
                            .text_size(type_default::FOOTNOTE.size)
                            .line_height(type_default::FOOTNOTE.line_height)
                            .text_color(tokens::secondary_label),
                    )
                }),
        )
        .when_some(props.action.get_untracked(), move |v, label| {
            v.child(
                nsh_base::button()
                    .min_h(px(44.0))
                    .px(px(8.0))
                    .items_center()
                    .justify_center()
                    .role(AccessibilityRole::Button)
                    .accessibility_label(label.clone())
                    .active(|s| s.opacity(0.4))
                    .on_press(move || cx.emit(ToastEvent::Action))
                    .child(
                        text(label)
                            .text_size(type_default::HEADLINE.size)
                            .line_height(type_default::HEADLINE.line_height)
                            .font_weight(FontWeight(600))
                            .text_color(tokens::system_blue),
                    ),
            )
        });

    // Behind the front card, a card sits over its edge; the sliver it shows above takes touches.
    let lift = animated_value(0.0);
    let shrink = animated_value(1.0);
    lift.set(-STACK_OFFSET * depth);
    shrink.set(1.0 - STACK_SHRINK * depth);
    view()
        .w_full()
        .z_index((10.0 - depth) as i32)
        .when(!front, |v| v.absolute().left_0().right_0().bottom_0())
        .opacity(1.0 - STACK_FADE * depth)
        .bind_translate_y(&lift)
        .bind_scale(&shrink)
        .child(card)
}

/// The props of [`ToastLayer`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ToastLayerProps {
    /// The toasts, the front one at depth 0.
    pub children: Prop<Children>,
}

/// Where toasts show: a layer over the page, 12 pt from the sides and 84 pt
/// above the bottom inset, over the tab bar as Cohub Mobile places them. The
/// front toast is in flow and sizes the stack; the others stack behind it.
/// The layer takes no touches except on its toasts.
#[component]
pub fn ToastLayer(props: ToastLayerProps) -> impl IntoElement {
    crate::overlay::layer()
        .pointer_events(PointerEvents::BoxNone)
        .flex_col()
        .justify_end()
        .px(px(12.0))
        .pb_safe_area_plus(px(BOTTOM_CLEARANCE))
        .child(view().relative().w_full().child(props.children))
}
