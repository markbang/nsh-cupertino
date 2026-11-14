//! The icons the components draw: SF Symbols' shapes, as SVG, in the element's
//! text color (`currentColor`), so they follow the theme and the contrast
//! setting.
//!
//! NSH has no SF Symbols: these are the handful of shapes the components need,
//! stroked the way SF Symbols draws them for controls (2 pt at 24 pt).

use nsh_core::{element::ImageSrc, prelude::*};

/// The names [`icon`] knows.
pub const NAMES: &[&str] = &[
    "chevron.left",
    "chevron.right",
    "chevron.down",
    "chevron.up",
    "checkmark",
    "magnifyingglass",
    "xmark.circle.fill",
    "eye",
    "eye.slash",
    "person",
    "bell",
    "envelope",
    "sun.max",
    "moon",
    "circle.lefthalf.filled",
    "square.grid.2x2",
    "list.bullet",
    "slider.horizontal.3",
    "info.circle",
    "sparkles",
    "arrow.up.right",
];

fn markup(name: &str) -> Option<&'static str> {
    let body = match name {
        "chevron.left" => r#"<path d="M15 4.5 7.5 12 15 19.5"/>"#,
        "chevron.right" => r#"<path d="M9 4.5 16.5 12 9 19.5"/>"#,
        "chevron.down" => r#"<path d="M4.5 8.5 12 16l7.5-7.5"/>"#,
        "chevron.up" => r#"<path d="M4.5 15.5 12 8l7.5 7.5"/>"#,
        "checkmark" => r#"<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>"#,
        "magnifyingglass" => r#"<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4 21 21"/>"#,
        "xmark.circle.fill" => {
            r#"<circle cx="12" cy="12" r="9.5"/><path d="M8.5 8.5 15.5 15.5M15.5 8.5 8.5 15.5"/>"#
        }
        "eye" => {
            r#"<path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/>"#
        }
        "eye.slash" => {
            r#"<path d="M2.5 12S6 6.2 12 6.2 21.5 12 21.5 12 18 17.8 12 17.8 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.8"/><path d="M3.5 20.5 20.5 3.5"/>"#
        }
        "person" => {
            r#"<circle cx="12" cy="8" r="4"/><path d="M4.5 20c1.4-4 4-6 7.5-6s6.1 2 7.5 6"/>"#
        }
        "bell" => {
            r#"<path d="M6.2 9.2a5.8 5.8 0 0 1 11.6 0c0 4.6 1.7 5.6 1.7 5.6H4.5s1.7-1 1.7-5.6Z"/><path d="M10 19a2 2 0 0 0 4 0"/>"#
        }
        "envelope" => {
            r#"<rect x="2.8" y="5.5" width="18.4" height="13" rx="2.4"/><path d="m3.6 7 8.4 6 8.4-6"/>"#
        }
        "sun.max" => {
            r#"<circle cx="12" cy="12" r="4.4"/><path d="M12 2.2v2.2M12 19.6v2.2M2.2 12h2.2M19.6 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M5.1 18.9l1.6-1.6M17.3 6.7l1.6-1.6"/>"#
        }
        "moon" => r#"<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4 8.6 8.6 0 1 0 20 14.5Z"/>"#,
        "circle.lefthalf.filled" => {
            r#"<circle cx="12" cy="12" r="9.2"/><path d="M12 2.8v18.4"/><path d="M12 2.8a9.2 9.2 0 0 1 0 18.4Z" fill="currentColor"/>"#
        }
        "square.grid.2x2" => {
            r#"<rect x="3.2" y="3.2" width="7.6" height="7.6" rx="1.8"/><rect x="13.2" y="3.2" width="7.6" height="7.6" rx="1.8"/><rect x="3.2" y="13.2" width="7.6" height="7.6" rx="1.8"/><rect x="13.2" y="13.2" width="7.6" height="7.6" rx="1.8"/>"#
        }
        "list.bullet" => {
            r#"<path d="M8.5 6.5h12M8.5 12h12M8.5 17.5h12"/><circle cx="3.8" cy="6.5" r="1.2" fill="currentColor"/><circle cx="3.8" cy="12" r="1.2" fill="currentColor"/><circle cx="3.8" cy="17.5" r="1.2" fill="currentColor"/>"#
        }
        "slider.horizontal.3" => {
            r#"<path d="M3 7.5h18M3 16.5h18"/><circle cx="9" cy="7.5" r="2.2"/><circle cx="15.5" cy="16.5" r="2.2"/>"#
        }
        "info.circle" => {
            r#"<circle cx="12" cy="12" r="9.2"/><path d="M12 11v6"/><circle cx="12" cy="7.6" r="1.1" fill="currentColor"/>"#
        }
        "sparkles" => {
            r#"<path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 17.9l-1.7-5.5L4.8 10.7 10.3 9Z"/><path d="M18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8Z"/>"#
        }
        "arrow.up.right" => r#"<path d="M6.5 17.5 17 7M9.5 6.5H17.5V14.5"/>"#,
        _ => return None,
    };
    Some(body)
}

/// A 24 × 24 SVG for `name`, drawn in the element's text color with a
/// `stroke` point line; an unknown name draws nothing (`NAMES` lists the ones
/// that draw).
pub fn svg_markup(name: &str, stroke: f32) -> String {
    let body = markup(name).unwrap_or("");
    format!(
        r#"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="{stroke}" stroke-linecap="round" stroke-linejoin="round">{body}</svg>"#
    )
}

/// The icon `name`, `size` points square; unknown names are an empty icon.
pub fn icon(name: &str, size: f32) -> Svg {
    icon_stroke(name, size, 2.4)
}

/// [`icon`] with its line `stroke` points at 24 (2.4 is SF Symbols' regular
/// weight; a chevron beside a title is heavier).
pub fn icon_stroke(name: &str, size: f32, stroke: f32) -> Svg {
    svg(ImageSrc::svg_markup(&svg_markup(name, stroke)))
        .size(px(size))
        .flex_none()
}
