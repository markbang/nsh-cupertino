//! The parts the overlays share: open state with an entrance and an exit,
//! the dimmed backdrop, and the layer they fill.

use std::time::Duration;

use nsh_core::{
    element::{AnimatedNode, Easing, Overlay},
    prelude::*,
};

/// A spring that settles without bouncing, as iOS moves sheets.
pub(crate) fn spring(damping: f32, stiffness: f32) -> Spring {
    Spring {
        stiffness,
        ..Spring::default()
    }
    .damping_ratio(damping)
}

/// Open state with a mount that outlives `open` by its exit animation.
///
/// `progress` is 0 while it is away and 1 while it is there, animated
/// natively: the overlays bind their translation, scale and backdrop to it,
/// so no frame of the animation waits for Rust.
#[derive(Clone)]
pub(crate) struct Presence {
    open: Prop<Option<bool>>,
    own: Signal<bool>,
    shown: Signal<bool>,
    progress: AnimatedValue,
    duration: f32,
    enter: Spring,
}

impl Presence {
    pub(crate) fn new(open: Prop<Option<bool>>, default_open: Prop<bool>, duration: f32) -> Self {
        let away = !open.get_untracked().unwrap_or(default_open.get_untracked());
        Self {
            open,
            own: signal(default_open.get_untracked()),
            shown: signal(!away),
            progress: animated_value(if away { 0.0 } else { 1.0 }),
            duration,
            enter: spring(0.88, 380.0),
        }
    }

    /// The spring the entrance runs on (the default one is the alerts' and
    /// action sheets').
    pub(crate) fn entering(mut self, enter: Spring) -> Self {
        self.enter = enter;
        self
    }

    /// Follows `open` (called once, in the component's body).
    pub(crate) fn sync(&self) {
        let Presence {
            open,
            own,
            shown,
            progress,
            duration,
            enter,
        } = self.clone();
        effect(move || {
            let wanted = open.get().unwrap_or_else(|| own.get());
            if wanted == shown.get() {
                // Opened again while it was going: bring it back.
                if wanted && !nsh_core::element::reduce_motion() {
                    progress.spring(1.0, enter);
                } else if wanted {
                    progress.set(1.0);
                }
                return;
            }
            if wanted {
                shown.set(true);
                if nsh_core::element::reduce_motion() {
                    progress.set(1.0);
                    return;
                }
                progress.set(0.0);
                progress.spring(1.0, enter);
            } else if nsh_core::element::reduce_motion() {
                progress.set(0.0);
                shown.set(false);
            } else {
                progress.timing(0.0, duration, Easing::EaseOut);
                let later = shown;
                set_timeout(
                    Duration::from_millis(u64::from(duration as u32) + 40),
                    move || {
                        if !open.get_untracked().unwrap_or_else(|| own.get_untracked()) {
                            later.set(false);
                        }
                    },
                );
            }
        });
    }

    /// Whether it is open, as `open` or its own state says.
    pub(crate) fn open(&self) -> bool {
        self.open.get().unwrap_or_else(|| self.own.get())
    }

    /// Whether it is still mounted (during the exit too), as a signal for
    /// `when`: a component body that reads it once never runs again.
    pub(crate) fn shown(&self) -> Signal<bool> {
        self.shown
    }

    /// 0 away, 1 there.
    pub(crate) fn progress(&self) -> AnimatedValue {
        self.progress
    }

    /// The user asks for `open`: its own state follows unless the app
    /// controls it (the app does the closing then).
    pub(crate) fn request(&self, open: bool) {
        if self.open.get_untracked().is_none() {
            self.own.set(open);
        }
    }
}

/// The top layer every overlay of the library is drawn in: a `position:
/// fixed` overlay filling the root, above the page and above scroll content
/// whatever clips it (documented by NSH's Overlay). Sheets, action sheets,
/// alerts, the context menu and its preview all use it, so an overlay opened
/// from a row inside a scroll view paints over the page on every platform.
pub(crate) fn layer() -> Overlay {
    overlay().absolute().inset_0().focusable(false)
}

/// The backdrop: black, at the opacity `opacity` gives, taking the presses
/// that are not on the panel.
pub(crate) fn backdrop(opacity: &AnimatedNode, on_press: impl Fn() + 'static) -> Overlay {
    layer()
        .bg(rgba(0x000000ff))
        .bind_opacity(opacity)
        .on_press(on_press)
}

/// Beyond the window: where a sheet enters from.
pub(crate) fn offscreen() -> f32 {
    nsh_core::element::window().height.0 + 80.0
}

/// The design system's sheet spring.
pub(crate) fn sheet_spring() -> Spring {
    spring(
        crate::tokens::motion::SHEET_DAMPING,
        crate::tokens::motion::SHEET_STIFFNESS,
    )
}

#[cfg(test)]
mod tests {
    use super::sheet_spring;

    /// A sheet's top edge, in points above the bottom of the screen, every 30 ms
    /// from its release at rest offscreen. The 284.5 pt rest height and the
    /// curve are fitted to iOS's sheet in `research/ios-reference/motion/motion-sheet.mp4`
    /// (30 fps; unit damping ratio, stiffness 282, the curve uses 280). Tolerance 1 pt:
    /// the fit's own residual is about 3.5 pt rms, so this pins the curve, not the clip.
    const IOS_TOP_EDGE_PT: [f32; 17] = [
        0.0, 25.9, 75.6, 126.4, 169.6, 203.4, 228.4, 246.3, 258.8, 267.4, 273.2, 277.1, 279.7,
        281.4, 282.5, 283.2, 283.7,
    ];
    const REST_HEIGHT_PT: f32 = 284.5;

    #[test]
    fn the_sheet_entrance_follows_the_fitted_ios_trajectory() {
        let spring = sheet_spring();
        for (sample, expected) in IOS_TOP_EDGE_PT.iter().enumerate() {
            let ms = 30.0 * sample as f32;
            let top = REST_HEIGHT_PT * spring.progress(ms);
            assert!(
                (top - expected).abs() <= 1.0,
                "{ms} ms: {top:.1} pt vs {expected:.1} pt"
            );
        }
    }
}
