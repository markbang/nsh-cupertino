//! [`ActivityIndicator`]: iOS's spinner, eight blades fading in turn.

use nsh_core::{AccessibilityRole, element::KeyframeTiming, geometry::deg, prelude::*};

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
