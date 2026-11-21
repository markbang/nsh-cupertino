//! The mascot the empty and error states draw: Cohub Mobile's brand mark,
//! as SVG, in the ink and face of its icon. The demo draws it (it is the
//! app's artwork, not the library's); the states take it as their picture.

use nsh_core::{
    AccessibilityRole,
    element::{ImageSrc, KeyframeTiming, dark, reduce_motion},
    prelude::*,
};

/// The props of [`Mascot`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct MascotProps {
    /// Its side in points (92 unless set).
    pub size: Prop<Option<f32>>,
    /// `"idle"` (the default) or `"worried"`: the brows of a failed load.
    pub mood: Prop<Option<SharedString>>,
}

/// The mascot: its face in white on the ink outline, with the icon's orange
/// rim in dark appearance, where the ink would vanish into the page.
#[component]
pub fn Mascot(props: MascotProps) -> impl IntoElement {
    let size = props.size.get_untracked().unwrap_or(92.0);
    let worried = props.mood.get_untracked().as_deref() == Some("worried");
    svg(move || ImageSrc::svg_markup(&mascot_markup(worried, nsh_core::element::dark())))
        .size(px(size))
}

fn mascot_markup(worried: bool, dark: bool) -> String {
    let rim = if dark {
        format!(
            r##"<path d="{OUTLINE}" fill="none" stroke="#fa7b23" stroke-width="18" stroke-linejoin="round"/>"##
        )
    } else {
        String::new()
    };
    let eyes = if worried {
        format!(
            r##"<path d="{WORRIED_EYES}" fill="{INK}"/><path d="{WORRIED_BROWS}" fill="none" stroke="{INK}" stroke-width="18" stroke-linecap="round"/>"##
        )
    } else {
        format!(r##"<path d="{LEFT_EYE}" fill="{INK}"/><path d="{RIGHT_EYE}" fill="{INK}"/>"##)
    };
    format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 147 716 716">{rim}<path d="{OUTLINE}" fill="{INK}"/><path d="{FACE}" fill="{FACE_WHITE}"/><path d="{CHEEK}" fill="{INK}"/>{eyes}</svg>"##
    )
}

const INK: &str = "#08090b";
const FACE_WHITE: &str = "#ffffff";
const OUTLINE: &str = "M 602 180 C 560 185, 526 201, 495 230 C 482 243, 480 244, 474 242 C 471 241, 465 239, 460 237 C 395 213, 314 240, 271 300 C 245 336, 235 375, 240 420 L 241 437 232 448 C 201 483, 181 520, 173 561 C 169 578, 169 614, 173 630 C 199 749, 346 841, 496 832 C 617 825, 753 765, 811 693 C 847 648, 865 591, 863 524 C 861 461, 842 413, 802 370 C 781 346, 782 348, 782 339 C 776 271, 746 223, 694 196 C 668 183, 630 176, 602 180";
const FACE: &str = "M 596 232 C 553 235, 514 266, 496 310 C 493 318, 490 323, 487 323 C 487 323, 482 320, 478 315 C 452 292, 430 283, 400 283 C 343 282, 295 322, 285 377 C 283 392, 284 402, 290 434 C 294 455, 294 453, 285 464 C 244 510, 230 561, 244 614 C 262 688, 324 739, 411 755 C 526 776, 703 734, 756 674 C 796 629, 810 557, 793 489 C 783 449, 765 415, 735 382 C 722 368, 723 370, 717 339 C 711 308, 709 302, 703 289 C 684 249, 645 228, 596 232";
const CHEEK: &str = "M 685 574 C 671 577, 656 590, 649 603 C 633 636, 649 672, 681 678 C 704 682, 736 663, 733 647 C 730 636, 718 633, 707 641 C 699 648, 689 648, 681 642 C 663 626, 686 595, 707 607 C 721 614, 735 603, 731 588 C 728 576, 703 568, 685 574";
const LEFT_EYE: &str = "M 420 480 C 406 485, 398 499, 397 520 C 395 567, 428 601, 455 581 C 480 561, 471 496, 440 482 C 435 480, 425 479, 420 480";
const RIGHT_EYE: &str =
    "M 599 436 C 576 444, 569 482, 586 516 C 603 551, 641 550, 649 513 C 658 471, 628 425, 599 436";
const WORRIED_EYES: &str = "M433 498 C451 498 460 518 460 540 C460 562 449 576 433 576 C417 576 406 562 406 540 C406 518 415 498 433 498 Z M612 456 C630 456 640 474 640 496 C640 518 629 532 612 532 C596 532 585 518 585 496 C585 474 594 456 612 456 Z";
const CLOSED_EYES: &str = "M397 540 Q433 512 472 524 M578 498 Q612 468 652 478";
const WORRIED_BROWS: &str = "M392 474 Q424 462 456 434 M580 402 Q618 408 654 428";

/// The props of [`MascotLoader`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct MascotLoaderProps {
    /// Its side in points (72 unless set). It bobs by 7 % of that, at least 2 pt.
    pub size: Prop<Option<f32>>,
    /// What screen readers say. Name the task ("Loading files"), not the spinner.
    pub label: Prop<Option<SharedString>>,
}

/// Cohub Mobile's `MascotLoader` (`ui/Mascot.tsx`): the busy state of a region
/// whose content is the screen's point. The mascot bobs once a 900 ms breath,
/// glances left, right and ahead, and blinks at uneven gaps. Under Reduce Motion
/// it stays still and keeps the blink, a crossfade rather than movement.
#[component]
pub fn MascotLoader(props: MascotLoaderProps) -> impl IntoElement {
    let size = props.size.get_untracked().unwrap_or(72.0);
    let label = props.label;
    let still = reduce_motion();
    let lift = bob_lift(size);

    let open_eyes = animated_value(1.0);
    let _ = open_eyes.keyframes(blink_frames(1.0, 0.0), blink_timing());
    let shut_eyes = animated_value(0.0);
    let _ = shut_eyes.keyframes(blink_frames(0.0, 1.0), blink_timing());

    let mut face = view().absolute().top(px(lift)).size(px(size)).child(
        svg(move || ImageSrc::svg_markup(&face_layer(dark())))
            .absolute()
            .inset_0(),
    );
    if !still {
        let bob = animated_value(0.0);
        let _ = bob.keyframes(bob_frames(lift), bob_timing());
        face = face.bind_translate_y(&bob);
    }

    let mut glance = view().absolute().inset_0();
    if !still {
        let x = animated_value(0.0);
        let _ = x.keyframes(glance_frames(size, |(x, _)| x), glance_timing());
        let y = animated_value(0.0);
        let _ = y.keyframes(glance_frames(size, |(_, y)| y), glance_timing());
        glance = glance.bind_translate_x(&x).bind_translate_y(&y);
    }
    let open_layer = view().absolute().inset_0().bind_opacity(&open_eyes).child(
        glance.child(
            svg(ImageSrc::svg_markup(&open_eyes_layer()))
                .absolute()
                .inset_0(),
        ),
    );
    let closed_layer = view().absolute().inset_0().bind_opacity(&shut_eyes).child(
        svg(ImageSrc::svg_markup(&closed_eyes_layer()))
            .absolute()
            .inset_0(),
    );

    view()
        .size(px(size))
        .flex_none()
        .role(AccessibilityRole::Progressbar)
        .optional_label(label)
        .child(face.child(open_layer).child(closed_layer))
        .into_element()
}

/// The bob's amplitude: `max(2, round(size × 0.07))` points (`Mascot.tsx`).
fn bob_lift(size: f32) -> f32 {
    (size * 0.07).round().max(2.0)
}

/// The bob: up by `lift` at the middle of its 900 ms breath, back at both ends.
fn bob_frames(lift: f32) -> Vec<Keyframe> {
    vec![
        Keyframe::at(0.0, 0.0),
        Keyframe::at(0.5, -lift),
        Keyframe::at(1.0, 0.0),
    ]
}

fn bob_timing() -> KeyframeTiming {
    KeyframeTiming::new(900.0)
        .easing(Easing::EaseInOut)
        .infinite()
}

/// Blink gaps (`loops.blinkGaps`) and the eyes shut for each (`loops.blink`).
const BLINK_GAPS_MS: [f32; 3] = [2900.0, 4700.0, 3500.0];
const BLINK_MS: f32 = 130.0;
/// Each lid closes and opens over this long, so a blink reads as a blink.
const LID_MS: f32 = 20.0;

fn blink_cycle() -> f32 {
    BLINK_GAPS_MS.iter().sum::<f32>() + BLINK_GAPS_MS.len() as f32 * BLINK_MS
}

/// One cycle of a blink: `open` while the eyes are open, `shut` while closed.
fn blink_frames(open: f32, shut: f32) -> Vec<Keyframe> {
    let cycle = blink_cycle();
    let at = |ms: f32, value: f32| Keyframe::at(ms / cycle, value);
    let mut frames = vec![at(0.0, open)];
    let mut start = 0.0;
    for gap in BLINK_GAPS_MS {
        start += gap;
        frames.push(at(start, open));
        frames.push(at(start + LID_MS, shut));
        frames.push(at(start + BLINK_MS - LID_MS, shut));
        start += BLINK_MS;
        frames.push(at(start, open));
    }
    frames
}

fn blink_timing() -> KeyframeTiming {
    KeyframeTiming::new(blink_cycle())
        .easing(Easing::Linear)
        .infinite()
}

/// Where the eyes look, in the icon's 1024 grid: up and to each side, then ahead.
const GLANCES: [(f32, f32); 3] = [(-16.0, -12.0), (16.0, -12.0), (0.0, 0.0)];
/// The grid the glances are drawn in (the mascot's view box is 716 wide).
const GLANCE_GRID: f32 = 716.0;
/// Each glance is held this long, and the eyes take this long to move to the next.
const GLANCE_HOLD_MS: f32 = 800.0;
const GLANCE_MOVE_MS: f32 = 120.0;

fn glance_cycle() -> f32 {
    GLANCE_HOLD_MS * GLANCES.len() as f32
}

/// One axis of the glance cycle, scaled from the icon grid to `size` points.
fn glance_frames(size: f32, axis: fn((f32, f32)) -> f32) -> Vec<Keyframe> {
    let cycle = glance_cycle();
    let scale = size / GLANCE_GRID;
    let look = |index: usize| axis(GLANCES[index % GLANCES.len()]) * scale;
    let mut frames = vec![Keyframe::at(0.0, look(0))];
    for index in 0..GLANCES.len() {
        let hold = GLANCE_HOLD_MS * (index + 1) as f32;
        frames.push(Keyframe::at((hold - GLANCE_MOVE_MS) / cycle, look(index)));
        frames.push(Keyframe::at(hold / cycle, look(index + 1)));
    }
    frames
}

fn glance_timing() -> KeyframeTiming {
    KeyframeTiming::new(glance_cycle())
        .easing(Easing::EaseInOut)
        .infinite()
}

/// The mascot's layers, each drawn in the view box: the face under the eyes,
/// the open eyes, and the closed eyes that the blink crossfades to.
fn face_layer(dark: bool) -> String {
    let rim = if dark {
        format!(
            r##"<path d="{OUTLINE}" fill="none" stroke="#fa7b23" stroke-width="18" stroke-linejoin="round"/>"##
        )
    } else {
        String::new()
    };
    loader_art(&format!(
        r##"{rim}<path d="{OUTLINE}" fill="{INK}"/><path d="{FACE}" fill="{FACE_WHITE}"/><path d="{CHEEK}" fill="{INK}"/>"##
    ))
}

fn open_eyes_layer() -> String {
    loader_art(&format!(
        r##"<path d="{LEFT_EYE}" fill="{INK}"/><path d="{RIGHT_EYE}" fill="{INK}"/>"##
    ))
}

fn closed_eyes_layer() -> String {
    loader_art(&format!(
        r##"<path d="{CLOSED_EYES}" fill="none" stroke="{INK}" stroke-width="24" stroke-linecap="round"/>"##
    ))
}

fn loader_art(body: &str) -> String {
    format!(r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="160 147 716 716">{body}</svg>"##)
}

#[cfg(test)]
mod tests {
    use super::*;
    use nsh_core::element::sample_easing;

    /// The value of the keyframe that sits at `ms` into a cycle of `cycle` ms.
    fn value_at(frames: &[Keyframe], cycle: f32, ms: f32) -> f32 {
        frames
            .iter()
            .find(|frame| (frame.offset.unwrap() * cycle - ms).abs() < 0.01)
            .unwrap_or_else(|| panic!("no keyframe at {ms} ms"))
            .value
    }

    #[test]
    fn the_bob_lifts_7_percent_of_the_size_at_least_2_pt() {
        assert_eq!(bob_lift(72.0), 5.0);
        assert_eq!(bob_lift(36.0), 3.0);
        assert_eq!(bob_lift(20.0), 2.0);
    }

    #[test]
    fn the_bob_is_at_rest_at_0_and_900_ms_and_up_at_450_ms() {
        let frames = bob_frames(5.0);
        assert_eq!(value_at(&frames, 900.0, 0.0), 0.0);
        assert_eq!(value_at(&frames, 900.0, 450.0), -5.0);
        assert_eq!(value_at(&frames, 900.0, 900.0), 0.0);
        let timing = bob_timing();
        assert_eq!(timing.duration_ms, 900.0);
        assert_eq!(timing.easing, Easing::EaseInOut);
        assert_eq!(timing.iterations, None);
    }

    /// The bob sampled every 30 ms over one breath: each keyframe segment
    /// runs the timing's easing over its half of the breath.
    fn sampled_breath(frames: &[Keyframe], timing: &KeyframeTiming) -> Vec<f32> {
        let curve = sample_easing(timing.easing, 16);
        let mut out = vec![frames[0].value];
        for pair in frames.windows(2) {
            let (from, to) = (pair[0].value, pair[1].value);
            out.extend(curve.iter().skip(1).map(|e| from + (to - from) * e));
        }
        out
    }

    #[test]
    fn the_bob_sampled_every_30_ms_has_at_least_8_samples_a_breath() {
        let trace = sampled_breath(&bob_frames(5.0), &bob_timing());
        assert_eq!(trace.len(), 31);
        assert!(trace.len() > 8);
        assert_eq!(trace[0], 0.0);
        assert_eq!(trace[15], -5.0);
        assert_eq!(trace[30], 0.0);
        // CSS ease-in-out at 60, 150 and 210 ms, times the 5 pt lift.
        for (index, expected) in [(2, -0.177), (5, -1.159), (7, -2.213)] {
            assert!(
                (trace[index] - expected).abs() < 0.005,
                "{} ms: {} vs {expected}",
                index * 30,
                trace[index]
            );
        }
    }

    #[test]
    fn the_eyes_close_for_130_ms_at_uneven_gaps() {
        let cycle = blink_cycle();
        assert_eq!(cycle, 11_490.0);
        let open = blink_frames(1.0, 0.0);
        assert_eq!(value_at(&open, cycle, 0.0), 1.0);
        assert_eq!(value_at(&open, cycle, 2_900.0), 1.0);
        assert_eq!(value_at(&open, cycle, 2_920.0), 0.0);
        assert_eq!(value_at(&open, cycle, 3_010.0), 0.0);
        assert_eq!(value_at(&open, cycle, 3_030.0), 1.0);
        assert_eq!(value_at(&open, cycle, 7_730.0), 1.0);
        assert_eq!(value_at(&open, cycle, 7_750.0), 0.0);
        assert_eq!(value_at(&open, cycle, 7_860.0), 1.0);
        assert_eq!(value_at(&open, cycle, 11_360.0), 1.0);
        assert_eq!(value_at(&open, cycle, 11_380.0), 0.0);
        assert_eq!(value_at(&open, cycle, 11_490.0), 1.0);
        let timing = blink_timing();
        assert_eq!(timing.duration_ms, cycle);
        assert_eq!(timing.easing, Easing::Linear);
    }

    #[test]
    fn the_eyes_glance_every_800_ms_and_move_in_120_ms() {
        let size = 72.0;
        let scale = size / GLANCE_GRID;
        let x = glance_frames(size, |(x, _)| x);
        let cycle = glance_cycle();
        assert_eq!(cycle, 2_400.0);
        assert_eq!(value_at(&x, cycle, 0.0), -16.0 * scale);
        assert_eq!(value_at(&x, cycle, 680.0), -16.0 * scale);
        assert_eq!(value_at(&x, cycle, 800.0), 16.0 * scale);
        assert_eq!(value_at(&x, cycle, 1_480.0), 16.0 * scale);
        assert_eq!(value_at(&x, cycle, 1_600.0), 0.0);
        assert_eq!(value_at(&x, cycle, 2_280.0), 0.0);
        assert_eq!(value_at(&x, cycle, 2_400.0), -16.0 * scale);
        let y = glance_frames(size, |(_, y)| y);
        assert_eq!(value_at(&y, cycle, 0.0), -12.0 * scale);
        assert_eq!(value_at(&y, cycle, 1_600.0), 0.0);
        assert_eq!(glance_timing().easing, Easing::EaseInOut);
    }
}
