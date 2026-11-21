//! The mascot the empty and error states draw: Cohub Mobile's brand mark,
//! as SVG, in the ink and face of its icon. The demo draws it (it is the
//! app's artwork, not the library's); the states take it as their picture.

use nsh_core::{element::ImageSrc, prelude::*};

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
const WORRIED_BROWS: &str = "M392 474 Q424 462 456 434 M580 402 Q618 408 654 428";
