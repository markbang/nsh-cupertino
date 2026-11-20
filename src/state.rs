//! [`EmptyState`], [`ErrorBanner`] and [`Skeleton`]: what a screen shows while
//! it has nothing yet, has failed to load, or is loading.

use nsh_core::{AccessibilityRole, element::Children, prelude::*};

use crate::{
    button::button,
    icon::icon_stroke,
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
                            .text_color(tokens::system_red),
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
                .child(
                    icon_stroke("arrow.clockwise", RETRY_GLYPH, 1.6).text_color(tokens::system_red),
                ),
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
