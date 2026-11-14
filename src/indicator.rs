//! [`ActivityIndicator`]: iOS's spinner, eight blades fading in turn.

use nsh_core::{AccessibilityRole, element::KeyframeTiming, geometry::deg, prelude::*};

use crate::tokens;

/// The props of [`ActivityIndicator`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ActivityIndicatorProps {
    /// The spinner's box in points (20 unless set): the blades scale with it.
    pub size: Prop<Option<f32>>,
    /// The token the blades are drawn in (`tertiary-label` unless set).
    pub color: Prop<Option<SharedString>>,
    /// What screen readers say ("Loading" unless set).
    pub label: Prop<Option<SharedString>>,
    /// It runs (`true` unless set): paused, it shows a still frame.
    pub animating: Prop<Option<bool>>,
}

/// iOS's activity indicator: eight rounded blades, each fading as the next
/// brightens, one turn per 800 ms, drawn natively.
///
/// With reduced motion it shows a still frame instead of turning, and its
/// role is a progress indicator either way.
#[component]
pub fn ActivityIndicator(props: ActivityIndicatorProps) -> impl IntoElement {
    let size = props.size.get_untracked().unwrap_or(20.0).clamp(8.0, 80.0);
    let color = props.color;
    let label = props.label;
    let animating = props.animating.get_untracked().unwrap_or(true);
    let still = !animating || nsh_core::element::reduce_motion();
    let blade = size * 0.125;
    let shaft = size * 0.3;
    let inset = size * 0.22;

    let mut spinner = view()
        .size(px(size))
        .flex_none()
        .role(AccessibilityRole::Progressbar)
        .label(label.get_untracked().unwrap_or_else(|| "Loading".into()));

    for index in 0..8u8 {
        // Each blade peaks in its turn, then decays: iOS's 12 o'clock blade
        // leading a trail.
        let phase = animated_value(1.0);
        if still {
            phase.set(1.0 - 0.75 * f32::from(index) / 7.0);
        } else {
            let mut frames = Vec::with_capacity(8);
            for step in 0..8u8 {
                let distance = (step + 7 - index) % 8;
                frames.push(Keyframe::new(1.0 - 0.75 * f32::from(distance) / 7.0));
            }
            let _ = phase.keyframes(frames, KeyframeTiming::new(800.0).infinite());
        }
        spinner = spinner.child(
            view()
                .absolute()
                .size(px(size))
                .items_center()
                .justify_start()
                .rotate(deg(f32::from(index) * 45.0))
                .child(
                    view()
                        .w(px(blade))
                        .h(px(shaft))
                        .mt(px(inset * 0.35))
                        .rounded_full()
                        .bind_opacity(&phase)
                        .bg(move || match color.get() {
                            Some(name) => tokens::system(&name),
                            None => tokens::tertiary_label(),
                        }),
                ),
        );
    }
    spinner
}
