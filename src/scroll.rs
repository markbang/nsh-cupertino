//! [`ScrollView`]: the scrolling wrapper the components live in, with iOS's
//! bouncing, indicators and keyboard behavior.

use nsh_core::{element::Children, prelude::*};

use crate::tokens;

/// The props of [`ScrollView`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ScrollViewProps {
    /// The content.
    pub children: Prop<Children>,
    /// Scrolls sideways.
    #[prop(default)]
    pub horizontal: Prop<bool>,
    /// Overscrolls past the edges and springs back (on unless `false`; iOS
    /// keeps it on).
    pub bounces: Prop<Option<bool>>,
    /// The platform's scroll indicator shows (on unless `false`).
    pub indicator: Prop<Option<bool>>,
    /// `"none"`, `"on-drag"` or `"interactive"`: whether dragging dismisses
    /// the software keyboard (`"interactive"` unless set, as a form scrolls
    /// with the keyboard).
    pub keyboard_dismiss: Prop<Option<SharedString>>,
}

/// A native scroll view with iOS's behavior: content that bounces at its
/// ends, the platform's indicator, and the keyboard following the drag.
///
/// A vertical one fills the page (`flex_1`); a horizontal one takes the height
/// its caller gives it: `style={{ height: 120 }}`.
#[component]
pub fn ScrollView(props: ScrollViewProps) -> impl IntoElement {
    let horizontal = props.horizontal.get_untracked();
    let bounces = props.bounces.get_untracked().unwrap_or(true);
    let indicator = props.indicator.get_untracked().unwrap_or(true);
    let dismiss = props.keyboard_dismiss.get_untracked();
    scroll()
        // A vertical scroll fills the page; a horizontal one takes the height
        // its caller gives it (`style={{ height: 120 }}`).
        .when(!horizontal, |v| v.flex_1())
        .when(horizontal, |v| v.horizontal())
        .bounces(bounces)
        .scrollbar(indicator)
        .keyboard_dismiss_mode(match dismiss.as_deref() {
            Some("none") => KeyboardDismissMode::None,
            Some("on-drag") => KeyboardDismissMode::OnDrag,
            _ => KeyboardDismissMode::Interactive,
        })
        .keyboard_taps(KeyboardTaps::Handled)
        .child(
            view()
                .w_full()
                .when(horizontal, |v| v.h_full())
                .bg(tokens::system_background)
                .child(props.children),
        )
}
