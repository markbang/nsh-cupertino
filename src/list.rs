//! [`List`], [`Section`] and [`ListTile`]: the inset-grouped lists iOS draws
//! settings and detail screens with.

use nsh_base::button;
use nsh_core::{AccessibilityRole, element::Children, prelude::*};

use crate::{
    icon::{icon, icon_stroke},
    tokens::{self, metrics, radius, type_default},
};

/// The props of [`List`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ListProps {
    /// The sections: [`Section`]s, and anything else the page shows.
    pub children: Prop<Children>,
    /// The background behind the sections (`system-grouped-background` unless
    /// set).
    pub background: Prop<Option<SharedString>>,
    /// Scrolls itself (on unless `false`): `false` inside a [`crate::NavPage`],
    /// whose scroll already runs the page, so the sections come as they are.
    pub scroll: Prop<Option<bool>>,
}

/// A whole scrolling page of grouped sections: the background, the safe area
/// and the sections' margins, with iOS's bouncing.
///
/// It scrolls itself, so give it a bounded height (`flex_1` in a page).
#[component]
pub fn List(props: ListProps) -> impl IntoElement {
    let background = props.background;
    let scrolls = props.scroll.get_untracked().unwrap_or(true);
    let sections = view()
        .w_full()
        .flex_col()
        .role(AccessibilityRole::List)
        .child(props.children);
    if !scrolls {
        return sections.into_element();
    }
    scroll()
        .flex_1()
        .bounces(true)
        .child(
            view()
                .w_full()
                .pb_safe_area_plus(px(24.0))
                .bg(move || match background.get().as_deref() {
                    Some(name) => tokens::system(name),
                    None => tokens::system_grouped_background(),
                })
                .child(sections),
        )
        .into_element()
}

/// The props of [`Section`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct SectionProps {
    /// The group's heading: 20 pt bold, as `CupertinoListSection.insetGrouped`
    /// draws it.
    pub header: Prop<Option<SharedString>>,
    /// A note under the group, 13 pt in the header/footer color.
    pub footer: Prop<Option<SharedString>>,
    /// The rows.
    pub children: Prop<Children>,
}

/// A group of rows on one rounded surface, 10 pt corners, with an optional
/// header above and footer below.
///
/// Rows draw their own hairline ([`ListTile`]'s `separator`): set it to `false`
/// on the group's last row.
#[component]
pub fn Section(props: SectionProps) -> impl IntoElement {
    let header = props.header;
    let footer = props.footer;
    view()
        .flex_col()
        .child(when(
            move || header.get().is_some(),
            move || {
                view()
                    .pt(px(metrics::HEADER_TOP))
                    .px(px(metrics::SECTION_EDGE))
                    .pb(px(metrics::HEADER_BOTTOM))
                    .child(
                        text(move || header.get().unwrap_or_default())
                            .text_size(px(metrics::SECTION_HEADER_SIZE))
                            .line_height(px(metrics::SECTION_HEADER_SIZE * 1.2))
                            .font_weight(FontWeight::BOLD)
                            .text_color(tokens::label)
                            .role(AccessibilityRole::Header)
                            .accessibility_level(2),
                    )
            },
        ))
        .child(
            view()
                .flex_col()
                .mx(px(metrics::SECTION_EDGE))
                .mt(px(metrics::SECTION_TOP))
                .rounded(px(radius::ROW.0))
                .overflow_hidden()
                .bg(tokens::secondary_system_grouped_background)
                .role(AccessibilityRole::Group)
                .child(props.children),
        )
        .child(when(
            move || footer.get().is_some(),
            move || {
                view()
                    .px(px(metrics::SECTION_EDGE))
                    .pt(px(metrics::HEADER_BOTTOM))
                    .pb(px(metrics::FOOTER_BOTTOM))
                    .child(
                        text(move || footer.get().unwrap_or_default())
                            .text_size(type_default::FOOTNOTE.size)
                            .line_height(type_default::FOOTNOTE.line_height)
                            .text_color(tokens::section_header_footer),
                    )
            },
        ))
}

/// The props of [`ListTile`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ListTileProps {
    /// The row's title, 17 pt.
    pub title: Prop<Option<SharedString>>,
    /// A line under the title, 12 pt in the secondary label color.
    pub subtitle: Prop<Option<SharedString>>,
    /// An icon leading the title, by name ([`crate::icon::NAMES`]).
    pub leading: Prop<Option<SharedString>>,
    /// The token the leading icon is drawn in (`system-blue` unless set).
    pub leading_color: Prop<Option<SharedString>>,
    /// The accessory at the trailing edge: `"chevron"`, `"checkmark"` or
    /// `"none"`. Left out, a row that can be pressed shows a chevron.
    pub accessory: Prop<Option<SharedString>>,
    /// A checkmark shows while this holds (a selection list), and it is the
    /// row's state for screen readers.
    pub checked: Prop<Option<bool>>,
    /// The title is red: a destructive action.
    pub destructive: Prop<Option<bool>>,
    /// The hairline under the row (on unless `false`): leave the last row of
    /// a group without one.
    pub separator: Prop<Option<bool>>,
    /// Dimmed and not pressable.
    pub disabled: Prop<Option<bool>>,
    /// A control at the trailing edge, after the accessory: a switch, a value.
    /// iOS's settings rows are this shape (`<ListTile title="Wi-Fi"><Switch/></ListTile>`).
    pub children: Prop<Children>,
}

/// The events of a [`ListTile`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum ListTileEvent {
    /// The row was pressed.
    Press,
}

/// A row: a title, an optional subtitle, an optional leading icon and an
/// accessory, 44 pt tall at least (48 with a subtitle), with the pressed
/// highlight iOS uses (`systemGrey4` while the finger is down).
#[component]
pub fn ListTile(props: ListTileProps, cx: Scope<ListTileEvent>) -> impl IntoElement {
    let disabled = {
        let disabled = props.disabled;
        move || disabled.get().unwrap_or(false)
    };
    let destructive = {
        let destructive = props.destructive;
        move || destructive.get().unwrap_or(false)
    };
    let has_leading = props.leading.get_untracked().is_some();
    let has_subtitle = props.subtitle.get_untracked().is_some();
    let leading = props.leading;
    let leading_color = props.leading_color;
    let title = props.title;
    let subtitle = props.subtitle;
    let title_label = props.title;
    let subtitle_label = props.subtitle;
    let accessory = props.accessory;
    let checked = props.checked;
    let separator = props.separator;
    let leading_inset = if has_leading {
        metrics::ROW_EDGE + metrics::LEADING_SIZE + metrics::LEADING_GAP
    } else {
        metrics::ROW_EDGE
    };

    view()
        .flex_col()
        .w_full()
        .child(
            button()
                .w_full()
                .flex_col()
                .active(|s| s.bg(tokens::system_gray4))
                .on_press(move || {
                    if !disabled() {
                        cx.emit(ListTileEvent::Press);
                    }
                })
                .role(AccessibilityRole::Button)
                .disabled(disabled())
                .selected(move || props.checked.get().unwrap_or(false))
                .accessibility_label(move || {
                    Some(
                        match subtitle_label.get() {
                            Some(subtitle) => {
                                format!("{}. {subtitle}", title_label.get().unwrap_or_default())
                            }
                            None => title_label.get().unwrap_or_default().to_string(),
                        }
                        .into(),
                    )
                })
                .child(
                    view()
                        .w_full()
                        .flex_row()
                        .items_center()
                        .min_h(px(if has_subtitle {
                            metrics::ROW_HEIGHT_SUBTITLE
                        } else {
                            metrics::ROW_HEIGHT
                        }))
                        .pl(px(if has_leading {
                            metrics::ROW_TRAILING
                        } else {
                            metrics::ROW_EDGE
                        }))
                        .pr(px(metrics::ROW_TRAILING))
                        .gap(px(metrics::LEADING_GAP))
                        .when(has_leading, |v| {
                            v.child(
                                view()
                                    .size(px(metrics::LEADING_SIZE))
                                    .items_center()
                                    .justify_center()
                                    .child(
                                        icon(&leading.get_untracked().unwrap_or_default(), 22.0)
                                            .text_color(move || match leading_color.get() {
                                                Some(name) => tokens::system(&name),
                                                None => tokens::system_blue(),
                                            }),
                                    ),
                            )
                        })
                        .child(
                            view()
                                .flex_1()
                                .flex_col()
                                .gap(px(metrics::TITLE_SUBTITLE_GAP))
                                .child(
                                    text(move || title.get().unwrap_or_default())
                                        .text_size(type_default::BODY.size)
                                        .line_height(type_default::BODY.line_height)
                                        .letter_spacing(type_default::BODY.tracking)
                                        .text_color(move || {
                                            if disabled() {
                                                tokens::tertiary_label()
                                            } else if destructive() {
                                                tokens::system_red()
                                            } else {
                                                tokens::label()
                                            }
                                        })
                                        .truncate(),
                                )
                                .child(when(
                                    move || subtitle.get().is_some(),
                                    move || {
                                        text(move || subtitle.get().unwrap_or_default())
                                            .text_size(type_default::SUBTITLE.size)
                                            .line_height(type_default::SUBTITLE.line_height)
                                            .letter_spacing(type_default::SUBTITLE.tracking)
                                            .text_color(tokens::secondary_label)
                                            .truncate()
                                    },
                                )),
                        )
                        .child(accessory_view(&accessory, &checked))
                        .child(props.children),
                ),
        )
        .child(when(
            move || separator.get().unwrap_or(true),
            move || {
                view()
                    .test_id("separator")
                    .h(tokens::separator_thickness)
                    .ml(px(leading_inset))
                    .bg(tokens::separator)
            },
        ))
}

fn accessory_view(
    accessory: &Prop<Option<SharedString>>,
    checked: &Prop<Option<bool>>,
) -> impl IntoElement {
    let tick = *accessory;
    let tick_checked = *checked;
    let chevron = *accessory;
    view()
        .flex_row()
        .items_center()
        .child(when(
            move || tick.get().as_deref() == Some("checkmark") && tick_checked.get() == Some(true),
            move || icon_stroke("checkmark", 18.0, 3.0).text_color(tokens::system_blue),
        ))
        .child(when(
            move || !matches!(chevron.get().as_deref(), Some("checkmark") | Some("none")),
            move || {
                // `CupertinoListTileChevron`: the text size, systemGrey2.
                icon_stroke("chevron.right", 17.0, 2.2).text_color(tokens::system_gray2)
            },
        ))
}
