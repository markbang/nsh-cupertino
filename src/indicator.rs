//! [`ActivityIndicator`]: iOS's spinner, eight blades fading in turn, and the
//! small crescent a button shows while it loads.

use nsh_core::{
    AccessibilityRole,
    element::{ImageSrc, KeyframeTiming},
    geometry::deg,
    prelude::*,
};

use crate::tokens;

/// The blades' alphas, as `CupertinoActivityIndicator` paints them
/// (`_kAlphaValues`, 0–255): the tick at the front is brightest, the four
/// behind it dimmest.
const ALPHAS: [u8; 8] = [47, 47, 47, 47, 72, 97, 122, 147];

/// The props of [`ActivityIndicator`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ActivityIndicatorProps {
    /// The spinner's box in points (20 unless set): the blades scale with it.
    pub size: Prop<Option<f32>>,
    /// The token the blades are drawn in (`activity-tick` unless set).
    pub color: Prop<Option<SharedString>>,
    /// What screen readers say. Name the task ("Checking mail"), as the
    /// guidelines ask, rather than the fact that something loads.
    pub label: Prop<Option<SharedString>>,
    /// It runs (`true` unless set): stopped, it shows a still frame.
    pub animating: Prop<Option<bool>>,
}

/// iOS's activity indicator: eight rounded blades, each at its own opacity, the
/// whole set turning one step (45°) every 1/8 s, one turn per second
/// (`CupertinoActivityIndicator`).
///
/// With reduced motion it shows a still frame instead of turning, and its role
/// is a progress indicator either way.
#[component]
pub fn ActivityIndicator(props: ActivityIndicatorProps) -> impl IntoElement {
    let size = props.size.get_untracked().unwrap_or(20.0).clamp(8.0, 80.0);
    let color = props.color;
    let label = props.label;
    let animating = props.animating.get_untracked().unwrap_or(true);
    let still = !animating || nsh_core::element::reduce_motion();
    // `tickFundamentalShape`: 1/10 of the diameter wide, 2/3 of the radius long,
    // with a corner radius of 1/20 of it.
    let blade = size / 10.0;
    let length = size * 2.0 / 3.0;
    let corner = size / 20.0;

    let mut blades = view()
        .size(px(size))
        .flex_none()
        .role(AccessibilityRole::Progressbar)
        .optional_label(label);

    for index in 0..8u8 {
        blades = blades.child(
            view()
                .absolute()
                .size(px(size))
                .items_center()
                .child(
                    view()
                        .w(px(blade))
                        .h(px(length))
                        .rounded(px(corner))
                        .opacity(f32::from(ALPHAS[usize::from(index)]) / 255.0)
                        .bg(move || match color.get() {
                            Some(name) => tokens::system(&name),
                            None => tokens::activity_tick(),
                        }),
                )
                .rotate(deg(f32::from(index) * 45.0)),
        );
    }

    if still {
        return blades.into_element();
    }
    // One turn a second, in eight steps, as the painter moves the bright tick.
    let turn = animated_value(0.0);
    let _ = turn.keyframes(
        [Keyframe::new(0.0), Keyframe::new(360.0)],
        KeyframeTiming::new(tokens::motion::SPIN_MS)
            .easing(Easing::Steps(8, StepPosition::JumpEnd))
            .infinite(),
    );
    blades.bind_rotate(&turn).into_element()
}

/// Cohub Mobile's small loader (`ui/Loader.tsx`, `sm`): the mascot's cheek, an
/// open arc, turning in place once every 900 ms.
const CHEEK: &str = "M 685 574 C 671 577, 656 590, 649 603 C 633 636, 649 672, 681 678 C 704 682, 736 663, 733 647 C 730 636, 718 633, 707 641 C 699 648, 689 648, 681 642 C 663 626, 686 595, 707 607 C 721 614, 735 603, 731 588 C 728 576, 703 568, 685 574";
/// The square the cheek is centred in, so the turn is about its middle.
const CHEEK_VIEW: &str = "626 567 117 117";
const CRESCENT_SPIN_MS: f32 = 900.0;
/// Reduce Motion's pulse of the same loader (`Loader.tsx` `PULSE`, 1200 ms).
const CRESCENT_PULSE_MS: f32 = 1200.0;

/// A button's crescent: the cheek in `currentColor`, so it takes the label's
/// colour. Under reduced motion it pulses in opacity instead of turning.
pub(crate) fn crescent(size: f32) -> impl IntoElement {
    let glyph = svg(ImageSrc::svg_markup(&format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="{CHEEK_VIEW}"><path d="{CHEEK}" fill="currentColor"/></svg>"#
    )))
    .size(px(size))
    .flex_none()
    .text_color(tokens::on_tint);
    let root = view()
        .size(px(size))
        .flex_none()
        .role(AccessibilityRole::Progressbar)
        .child(glyph);
    if nsh_core::element::reduce_motion() {
        let (frames, timing) = crescent_pulse();
        let opacity = animated_value(0.35);
        let _ = opacity.keyframes(frames, timing);
        return root.bind_opacity(&opacity).into_element();
    }
    let turn = animated_value(0.0);
    let _ = turn.keyframes(
        [Keyframe::new(0.0), Keyframe::new(360.0)],
        KeyframeTiming::new(CRESCENT_SPIN_MS)
            .easing(Easing::Linear)
            .infinite(),
    );
    root.bind_rotate(&turn).into_element()
}

/// The pulse's keyframes and timing: opacity 0.35, 1 at the middle, 0.35 again.
fn crescent_pulse() -> (Vec<Keyframe>, KeyframeTiming) {
    (
        vec![
            Keyframe::at(0.0, 0.35),
            Keyframe::at(0.5, 1.0),
            Keyframe::at(1.0, 0.35),
        ],
        KeyframeTiming::new(CRESCENT_PULSE_MS)
            .easing(Easing::EaseInOut)
            .infinite(),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reduced_motion_pulses_the_crescent_over_1_2_s() {
        let (frames, timing) = crescent_pulse();
        assert_eq!(timing.duration_ms, 1200.0);
        assert_eq!(timing.easing, Easing::EaseInOut);
        assert_eq!(timing.iterations, None);
        assert_eq!(
            frames,
            [
                Keyframe::at(0.0, 0.35),
                Keyframe::at(0.5, 1.0),
                Keyframe::at(1.0, 0.35),
            ]
        );
    }
}
