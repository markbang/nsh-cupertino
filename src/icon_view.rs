//! [`Icon`]: an icon on its own, for the parts a row, a bar or a page draws.

use nsh_core::{AccessibilityRole, prelude::*};

use crate::{icon::icon_stroke, tokens};

/// The props of [`Icon`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct IconProps {
    /// The shape's name ([`crate::icon::NAMES`]).
    pub name: Prop<Option<SharedString>>,
    /// Its side in points (20 unless set).
    pub size: Prop<Option<f32>>,
    /// Its line weight at 24 pt (2.4, SF Symbols' regular, unless set; 1.9
    /// draws the thin line of a control's glyph).
    pub stroke: Prop<Option<f32>>,
    /// The token it is drawn in (`label` unless set): `secondary-label`,
    /// `system-blue`, `system-red`, ...
    pub tint: Prop<Option<SharedString>>,
    /// What screen readers say; leave it out for a shape a control around it
    /// already names.
    pub label: Prop<Option<SharedString>>,
}

/// An icon on its own: a flag, a paperclip, a chevron. It follows the theme,
/// the appearance and the contrast setting like every other part, and its
/// name and tint may change while it shows.
#[component]
pub fn Icon(props: IconProps) -> impl IntoElement {
    let name = props.name;
    let tint = props.tint;
    let label = props.label;
    let size = props.size.get_untracked().unwrap_or(20.0);
    let stroke = props.stroke.get_untracked().unwrap_or(2.4);
    let named = props.label.get_untracked().is_some();
    dynamic(move || {
        icon_stroke(&name.get().unwrap_or_default(), size, stroke)
            .text_color(match tint.get() {
                Some(name) => tokens::system(&name),
                None => tokens::label(),
            })
            .when(named, |v| {
                v.role(AccessibilityRole::Image).optional_label(label.get())
            })
    })
}
