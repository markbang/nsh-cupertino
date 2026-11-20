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
    "xmark",
    "magnifyingglass",
    "xmark.circle.fill",
    "ellipsis",
    "plus",
    "eye",
    "eye.slash",
    "person",
    "person.crop.circle",
    "bell",
    "envelope",
    "envelope.open",
    "paperplane",
    "tray",
    "archivebox",
    "square.and.arrow.up",
    "doc.on.doc",
    "trash",
    "flag",
    "flag.fill",
    "paperclip",
    "folder",
    "square.and.pencil",
    "pencil",
    "clock",
    "calendar",
    "arrow.clockwise",
    "arrowshape.turn.up.left",
    "arrowshape.turn.up.right",
    "link",
    "key",
    "line.3.horizontal.decrease",
    "sun.max",
    "moon",
    "cloud",
    "circle.lefthalf.filled",
    "square.grid.2x2",
    "list.bullet",
    "slider.horizontal.3",
    "info.circle",
    "sparkles",
    "exclamationmark.triangle",
    "checkmark.circle",
    "doc",
    "photo",
    "arrow.up.right",
    "arrow.up.right.square",
    "chevron.up.down",
    "palette",
    "globe",
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
        "xmark" => r#"<path d="M5.8 5.8 18.2 18.2M18.2 5.8 5.8 18.2"/>"#,
        "ellipsis" => {
            r#"<circle cx="5.4" cy="12" r="1.5" fill="currentColor"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/><circle cx="18.6" cy="12" r="1.5" fill="currentColor"/>"#
        }
        "plus" => r#"<path d="M12 4.8v14.4M4.8 12h14.4"/>"#,
        "person.crop.circle" => {
            r#"<circle cx="12" cy="12" r="9"/><circle cx="12" cy="9.8" r="3"/><path d="M5.6 18.4c1.3-2.9 3.5-4.4 6.4-4.4s5.1 1.5 6.4 4.4"/>"#
        }
        "envelope.open" => {
            r#"<path d="M3.5 10.6 12 4l8.5 6.6v7.9a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z"/><path d="m3.8 10.8 8.2 5.8 8.2-5.8"/>"#
        }
        "paperplane" => {
            r#"<path d="M20.8 3.2 10.6 13.4"/><path d="M20.8 3.2 14.4 21l-3.8-7.6L3 9.6Z"/>"#
        }
        "tray" => {
            r#"<path d="M5.4 4.4h13.2l2 9.1v4.3a2 2 0 0 1-2 2H5.4a2 2 0 0 1-2-2v-4.3Z"/><path d="M3.3 13.5h4.2l1.4 2.7h6.2l1.4-2.7h4.2"/>"#
        }
        "archivebox" => {
            r#"<rect x="3" y="4.2" width="18" height="4.6" rx="1.4"/><path d="M4.6 8.8v9a2 2 0 0 0 2 2h10.8a2 2 0 0 0 2-2v-9"/><path d="M9.6 12.8h4.8"/>"#
        }
        "square.and.arrow.up" => {
            r#"<path d="M12 15V3.8"/><path d="m7.6 8 4.4-4.4L16.4 8"/><path d="M8 10.5H6.2a2 2 0 0 0-2 2v7.3a2 2 0 0 0 2 2h11.6a2 2 0 0 0 2-2v-7.3a2 2 0 0 0-2-2H16"/>"#
        }
        "doc.on.doc" => {
            r#"<rect x="8" y="8" width="12.4" height="12.4" rx="2.4"/><path d="M16 8V5.6a2.4 2.4 0 0 0-2.4-2.4H5.6a2.4 2.4 0 0 0-2.4 2.4v8a2.4 2.4 0 0 0 2.4 2.4H8"/>"#
        }
        "trash" => {
            r#"<path d="M4.5 6.8h15"/><path d="M9 6.8V4.4h6v2.4"/><path d="m6.4 6.8.9 12.4a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9l.9-12.4"/><path d="M10.4 10.8v6M13.6 10.8v6"/>"#
        }
        "flag" => r#"<path d="M6 21V3.6"/><path d="M6 4.2h11.4l-2.3 3.9 2.3 3.9H6"/>"#,
        "flag.fill" => {
            r#"<path d="M6 21V3.6"/><path d="M6 4.2h11.4l-2.3 3.9 2.3 3.9H6Z" fill="currentColor"/>"#
        }
        "paperclip" => {
            r#"<path d="M18.4 11.4 11.8 18a4.2 4.2 0 0 1-6-6l6.6-6.6a3 3 0 0 1 4.2 4.2l-6.6 6.6a1.8 1.8 0 0 1-2.5-2.5l6-6"/>"#
        }
        "folder" => {
            r#"<path d="M3 7.4a2 2 0 0 1 2-2h4l2 2.4h8a2 2 0 0 1 2 2v8.8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/>"#
        }
        "square.and.pencil" => {
            r#"<path d="M11 5.5H5.2a2 2 0 0 0-2 2v11.3a2 2 0 0 0 2 2h11.3a2 2 0 0 0 2-2V13"/><path d="M17.8 3.4a2.2 2.2 0 0 1 3.1 3.1l-7.4 7.4-3.6.6.6-3.6Z"/>"#
        }
        "pencil" => {
            r#"<path d="m4 20 .8-4.2L16.4 4.2a2.1 2.1 0 0 1 3 3L7.8 18.8Z"/><path d="m14.6 6 3.4 3.4"/>"#
        }
        "clock" => r#"<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.6 2.2"/>"#,
        "calendar" => {
            r#"<rect x="3.2" y="5.2" width="17.6" height="15.6" rx="2.4"/><path d="M3.2 10h17.6M8.4 3.4v3.6M15.6 3.4v3.6"/>"#
        }
        "arrow.clockwise" => {
            r#"<path d="M20.4 12a8.4 8.4 0 1 1-2.7-6.2"/><path d="M20.6 3.8v4.6h-4.6"/>"#
        }
        "arrowshape.turn.up.left" => {
            r#"<path d="m8.5 4.8-5 5 5 5"/><path d="M3.5 9.8h9.2a5.6 5.6 0 0 1 5.6 5.6v3.8"/>"#
        }
        "arrowshape.turn.up.right" => {
            r#"<path d="m15.5 4.8 5 5-5 5"/><path d="M20.5 9.8h-9.2a5.6 5.6 0 0 0-5.6 5.6v3.8"/>"#
        }
        "link" => {
            r#"<path d="m9.6 14.4 4.8-4.8"/><path d="M11.2 7.2 13 5.4a3.6 3.6 0 0 1 5.1 5.1l-1.8 1.8"/><path d="M12.8 16.8 11 18.6a3.6 3.6 0 0 1-5.1-5.1l1.8-1.8"/>"#
        }
        "key" => {
            r#"<circle cx="8.4" cy="8.4" r="4.2"/><path d="M11.4 11.4 20 20"/><path d="m17 17 1.8-1.8"/>"#
        }
        "line.3.horizontal.decrease" => r#"<path d="M3.5 6.5h17M6 12h12M9.5 17.5h5"/>"#,
        "cloud" => {
            r#"<path d="M7.4 18.4h10a3.9 3.9 0 0 0 .5-7.8 5.6 5.6 0 0 0-10.8-1.4 4.7 4.7 0 0 0 .3 9.2Z"/>"#
        }
        "exclamationmark.triangle" => {
            r#"<path d="M13.2 4.2 21.2 18a2 2 0 0 1-1.7 3H4.5a2 2 0 0 1-1.7-3l8-13.8a1.4 1.4 0 0 1 2.4 0Z"/><path d="M12 9.4v4.6"/><circle cx="12" cy="17" r="1.1" fill="currentColor"/>"#
        }
        "checkmark.circle" => {
            r#"<circle cx="12" cy="12" r="9"/><path d="m7.6 12.4 3.2 3.2 5.8-6.2"/>"#
        }
        "doc" => {
            r#"<path d="M6 3.4h7.4L19 8.6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5.4a2 2 0 0 1 2-2Z"/><path d="M13 3.6v5.4h5.6"/>"#
        }
        "photo" => {
            r#"<rect x="3" y="4.6" width="18" height="14.8" rx="2.4"/><circle cx="8.6" cy="10" r="1.6"/><path d="m4.4 17.6 5.2-5.2 3.4 3.4 2.6-2.6 4 4"/>"#
        }
        "arrow.up.right" => r#"<path d="M6.5 17.5 17 7M9.5 6.5H17.5V14.5"/>"#,
        "arrow.up.right.square" => {
            r#"<rect x="3.5" y="3.5" width="17" height="17" rx="3.6"/><path d="M8.6 15.4 15.4 8.6M9.4 8.4h6.2v6.2"/>"#
        }
        "chevron.up.down" => r#"<path d="m7.5 9.5 4.5-4.5 4.5 4.5M7.5 14.5l4.5 4.5 4.5-4.5"/>"#,
        "palette" => {
            r#"<path d="M12 3a9 9 0 0 0 0 18c1.3 0 1.9-.9 1.9-1.8 0-1-.7-1.6-.7-2.5 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3Z"/><circle cx="7.3" cy="11" r="1.1" fill="currentColor"/><circle cx="9.9" cy="7.2" r="1.1" fill="currentColor"/><circle cx="14.6" cy="7.2" r="1.1" fill="currentColor"/>"#
        }
        "globe" => {
            r#"<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3Z"/>"#
        }
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
