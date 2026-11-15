//! [`DatePicker`]: iOS's inline calendar and its wheel.

use std::rc::Rc;

use chrono::{DateTime, Datelike, Duration, Months, NaiveDate, Utc};
use nsh_base::{PopoverEvent, button, popover};
use nsh_core::{AccessibilityRole, prelude::*};

use crate::{
    icon::icon_stroke,
    picker::{PickerEvent, picker},
    tokens::{self, radius, type_default},
};

/// The props of a [`DatePicker`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct DatePickerProps {
    /// The day, `YYYY-MM-DD` (controlled): the app owns it and sets it in
    /// `onChange`.
    pub value: Prop<Option<SharedString>>,
    /// The day at first, while `value` is not set.
    pub default_value: Prop<Option<SharedString>>,
    /// `"inline"` (a calendar, the default), `"compact"` (a button that
    /// opens the calendar) or `"wheel"` (three turning columns).
    pub variant: Prop<Option<SharedString>>,
    /// What screen readers call it.
    pub label: Prop<Option<SharedString>>,
}

/// The events of a [`DatePicker`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum DatePickerEvent {
    /// Another day was chosen, as `YYYY-MM-DD`.
    #[args(value)]
    Change(String),
}

/// A calendar with month arrows, an optional compact trigger and a wheel.
///
/// The calendar shows the month around the chosen day, six weeks of days in
/// the user's language and week start; the chosen day is a filled circle and
/// today's number is tinted. The wheel turns the month, day and year, and
/// keeps the day within the month it lands in.
#[component]
pub fn DatePicker(props: DatePickerProps, cx: Scope<DatePickerEvent>) -> impl IntoElement {
    let today = today();
    let initial = props
        .value
        .get_untracked()
        .or(props.default_value.get_untracked())
        .and_then(|value| parse_date(&value))
        .unwrap_or(today);
    let selected = signal(initial);
    let showing = signal(first_of_month(initial));
    let value_prop = props.value;
    let selected_effect = selected;
    let showing_effect = showing;
    effect(move || {
        if let Some(value) = value_prop.get()
            && let Some(date) = parse_date(&value)
        {
            selected_effect.set(date);
            showing_effect.set(first_of_month(date));
        }
    });

    let variant = props
        .variant
        .get_untracked()
        .unwrap_or_else(|| "inline".into());
    let language = nsh_core::element::locale().language().to_owned();
    let first_day = nsh_core::element::locale_settings().first_day_of_week;
    let label = props.label.get_untracked().unwrap_or_else(|| "Date".into());
    let picked: Rc<dyn Fn(NaiveDate)> = {
        Rc::new(move |date| {
            selected.set(date);
            if first_of_month(date) != showing.get_untracked() {
                showing.set(first_of_month(date));
            }
            cx.emit(DatePickerEvent::Change(format_date(date)));
        })
    };

    match variant.as_str() {
        "wheel" => view()
            .flex_col()
            .w_full()
            .gap(px(8.0))
            .role(AccessibilityRole::Group)
            .label(label.clone())
            .child(wheels(selected, &language, today, {
                let picked = picked.clone();
                move |date| picked(date)
            }))
            .into_element(),
        "compact" => {
            let open = signal(false);
            let popup_language = language.clone();
            let calendar = calendar(selected, showing, today, &language, first_day, {
                let picked = picked.clone();
                move |date| {
                    picked(date);
                    open.set(false);
                }
            });
            view()
                .role(AccessibilityRole::Group)
                .label(label.clone())
                .child(
                    popover()
                        .open(move || Some(open.get()))
                        .on_open_change(move |event: &PopoverEvent| {
                            if let PopoverEvent::OpenChange(next, _) = event {
                                open.set(*next);
                            }
                        })
                        .trigger(
                            button()
                                .min_h(px(44.0))
                                .px(px(12.0))
                                .rounded(px(9.0))
                                .bg(tokens::tertiary_fill)
                                .flex_row()
                                .items_center()
                                .gap(px(8.0))
                                .accessibility_label(label.clone())
                                .child(
                                    text(move || format_short(selected.get(), &popup_language))
                                        .text_size(type_default::BODY.size)
                                        .text_color(tokens::label),
                                )
                                .child(
                                    icon_stroke("chevron.right", 12.0, 2.5)
                                        .text_color(tokens::secondary_label),
                                ),
                        )
                        .popup_style(|s| {
                            s.p(px(12.0))
                                .rounded(px(radius::SHEET.0))
                                .bg(tokens::secondary_system_background)
                                .shadow([nsh_core::BoxShadow {
                                    offset_y: px(10.0),
                                    blur: px(40.0),
                                    color: rgba(0x00000033).into(),
                                    ..nsh_core::BoxShadow::default()
                                }])
                        })
                        .child(calendar),
                )
                .into_element()
        }
        _ => view()
            .w_full()
            .role(AccessibilityRole::Group)
            .label(label.clone())
            .child(calendar(selected, showing, today, &language, first_day, {
                let picked = picked.clone();
                move |date| picked(date)
            }))
            .into_element(),
    }
}

/// Today, from the engine's wall clock: the platform's own time source, so
/// this works in the browser too (where `std`'s clocks do not exist).
fn today() -> NaiveDate {
    let millis = nsh_core::time::unix_ms() as i64;
    DateTime::<Utc>::from_timestamp_millis(millis)
        .map(|at| at.date_naive())
        .unwrap_or_else(|| NaiveDate::from_ymd_opt(1970, 1, 1).unwrap_or_default())
}

fn parse_date(value: &str) -> Option<NaiveDate> {
    NaiveDate::parse_from_str(value, "%Y-%m-%d").ok()
}

fn format_date(date: NaiveDate) -> String {
    date.format("%Y-%m-%d").to_string()
}

fn first_of_month(date: NaiveDate) -> NaiveDate {
    NaiveDate::from_ymd_opt(date.year(), date.month(), 1).unwrap_or(date)
}

fn month_name(month: u32, language: &str) -> &'static str {
    const EN: [&str; 12] = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];
    const ZH: [&str; 12] = [
        "1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月",
    ];
    let names = if language == "zh" { ZH } else { EN };
    names[(month.clamp(1, 12) - 1) as usize]
}

fn format_short(date: NaiveDate, language: &str) -> String {
    if language == "zh" {
        format!("{}年{}月{}日", date.year(), date.month(), date.day())
    } else {
        format!(
            "{} {}, {}",
            &month_name(date.month(), language)[..3],
            date.day(),
            date.year()
        )
    }
}

fn weekdays(first_day: nsh_core::element::Weekday, language: &str) -> [&'static str; 7] {
    const EN: [&str; 7] = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
    const ZH: [&str; 7] = ["日", "一", "二", "三", "四", "五", "六"];
    let names = if language == "zh" { ZH } else { EN };
    let start = (first_day as u32 % 7) as usize;
    let mut out = [""; 7];
    for (i, slot) in out.iter_mut().enumerate() {
        *slot = names[(start + i) % 7];
    }
    out
}

fn calendar(
    selected: Signal<NaiveDate>,
    showing: Signal<NaiveDate>,
    today: NaiveDate,
    language: &str,
    first_day: nsh_core::element::Weekday,
    on_pick: impl Fn(NaiveDate) + 'static,
) -> impl IntoElement {
    let language = language.to_owned();
    let header_language = language.clone();
    let on_pick = Rc::new(on_pick);
    let header = view()
        .flex_row()
        .items_center()
        .justify_between()
        .h(px(44.0))
        .child(
            text(move || {
                let month = showing.get();
                if header_language == "zh" {
                    format!(
                        "{}年{}",
                        month.year(),
                        month_name(month.month(), &header_language)
                    )
                } else {
                    format!(
                        "{} {}",
                        month_name(month.month(), &header_language),
                        month.year()
                    )
                }
            })
            .text_size(type_default::HEADLINE.size)
            .font_weight(FontWeight(600))
            .text_color(tokens::label),
        )
        .child(
            view()
                .flex_row()
                .gap(px(2.0))
                .child(
                    button()
                        .size(px(36.0))
                        .items_center()
                        .justify_center()
                        .rounded_full()
                        .accessibility_label("Previous month")
                        .active(|s| s.bg(tokens::fill))
                        .on_press(move || {
                            let month = showing.get_untracked();
                            showing.set(month - Months::new(1));
                        })
                        .child(
                            icon_stroke("chevron.left", 13.0, 2.5).text_color(tokens::system_blue),
                        ),
                )
                .child(
                    button()
                        .size(px(36.0))
                        .items_center()
                        .justify_center()
                        .rounded_full()
                        .accessibility_label("Next month")
                        .active(|s| s.bg(tokens::fill))
                        .on_press(move || {
                            let month = showing.get_untracked();
                            showing.set(month + Months::new(1));
                        })
                        .child(
                            icon_stroke("chevron.right", 13.0, 2.5).text_color(tokens::system_blue),
                        ),
                ),
        );

    let mut week = view().flex_row().w_full();
    for name in weekdays(first_day, &language) {
        week = week.child(
            view().flex_1().items_center().h(px(24.0)).child(
                text(name)
                    .text_size(type_default::CAPTION1.size)
                    .text_color(tokens::secondary_label),
            ),
        );
    }

    let grid = dynamic({
        let language = language.clone();
        let on_pick = on_pick.clone();
        move || {
            let month = showing.get();
            let offset = {
                let start = (first_day as u32 % 7) as i64;
                let weekday = month.weekday().num_days_from_sunday() as i64;
                (weekday - start).rem_euclid(7)
            };
            let grid_start = month - Duration::days(offset);
            let mut grid = view().flex_col().w_full();
            for row in 0..6 {
                let mut line = view().flex_row().w_full();
                for column in 0..7 {
                    let date = grid_start + Duration::days(row * 7 + column);
                    let in_month = date.month() == month.month();
                    let is_selected = selected.get() == date;
                    let is_today = date == today;
                    let pick = on_pick.clone();
                    line = line.child(
                        button()
                            .flex_1()
                            .h(px(40.0))
                            .items_center()
                            .justify_center()
                            .rounded_full()
                            .accessibility_label(format_short(date, &language))
                            .selected(is_selected)
                            .active(|s| s.bg(tokens::fill))
                            .on_press(move || pick(date))
                            .child(
                                view()
                                    .size(px(32.0))
                                    .items_center()
                                    .justify_center()
                                    .rounded_full()
                                    .when(is_selected, |v| v.bg(tokens::system_blue()))
                                    .child(
                                        text(format!("{}", date.day()))
                                            .text_size(type_default::BODY.size)
                                            .text_color(move || {
                                                if is_selected {
                                                    rgba(0xffff_ffff).into()
                                                } else if !in_month {
                                                    tokens::tertiary_label()
                                                } else if is_today {
                                                    tokens::system_blue()
                                                } else {
                                                    tokens::label()
                                                }
                                            }),
                                    ),
                            ),
                    );
                }
                grid = grid.child(line);
            }
            grid
        }
    });

    view()
        .flex_col()
        .w_full()
        .gap(px(2.0))
        .child(header)
        .child(week)
        .child(grid)
}

fn wheels(
    selected: Signal<NaiveDate>,
    language: &str,
    _today: NaiveDate,
    on_pick: impl Fn(NaiveDate) + 'static,
) -> impl IntoElement {
    let language = language.to_owned();
    let now = selected.get();
    let year = now.year();
    let years: Vec<i32> = (year - 60..=year + 60).collect();
    let pick = Rc::new(on_pick);
    let month_items = (1..=12)
        .map(|month| {
            crate::picker::PickerItem::new(
                format!("{month:02}"),
                month_name(month, &language).to_string(),
            )
        })
        .collect::<Vec<_>>();
    let year_items = years
        .iter()
        .map(|year| crate::picker::PickerItem::new(year.to_string(), year.to_string()))
        .collect::<Vec<_>>();
    let day_count = days_in_month(now.year(), now.month());
    let day_items = (1..=day_count)
        .map(|day| crate::picker::PickerItem::new(format!("{day:02}"), day.to_string()))
        .collect::<Vec<_>>();

    let compose = {
        let pick = pick.clone();
        move |date: NaiveDate| pick(date)
    };
    let compose_month = compose.clone();
    let compose_day = compose.clone();
    let compose_year = compose;

    view()
        .flex_row()
        .w_full()
        .gap(px(4.0))
        .child(
            view().flex_grow(2.0).child(
                picker()
                    .items(month_items)
                    .value(format!("{:02}", now.month()))
                    .label("Month")
                    .height(180.0)
                    .on_change(move |event: &PickerEvent| {
                        let PickerEvent::Change(value, _) = event;
                        let month = value.parse::<u32>().unwrap_or(1);
                        let day = selected
                            .get_untracked()
                            .day()
                            .min(days_in_month(selected.get_untracked().year(), month));
                        if let Some(date) =
                            NaiveDate::from_ymd_opt(selected.get_untracked().year(), month, day)
                        {
                            compose_month(date);
                        }
                    }),
            ),
        )
        .child(
            view().flex_1().child(
                picker()
                    .items(day_items)
                    .value(format!("{:02}", now.day()))
                    .label("Day")
                    .height(180.0)
                    .on_change(move |event: &PickerEvent| {
                        let PickerEvent::Change(value, _) = event;
                        let day = value.parse::<u32>().unwrap_or(1);
                        let current = selected.get_untracked();
                        if let Some(date) =
                            NaiveDate::from_ymd_opt(current.year(), current.month(), day)
                        {
                            compose_day(date);
                        }
                    }),
            ),
        )
        .child(
            view().flex_1().child(
                picker()
                    .items(year_items)
                    .value(year.to_string())
                    .label("Year")
                    .height(180.0)
                    .on_change(move |event: &PickerEvent| {
                        let PickerEvent::Change(value, _) = event;
                        let year = value.parse::<i32>().unwrap_or(now.year());
                        let current = selected.get_untracked();
                        let day = current.day().min(days_in_month(year, current.month()));
                        if let Some(date) = NaiveDate::from_ymd_opt(year, current.month(), day) {
                            compose_year(date);
                        }
                    }),
            ),
        )
}

fn days_in_month(year: i32, month: u32) -> u32 {
    let (next_year, next_month) = if month == 12 {
        (year + 1, 1)
    } else {
        (year, month + 1)
    };
    let first_next = NaiveDate::from_ymd_opt(next_year, next_month, 1)
        .unwrap_or_else(|| NaiveDate::from_ymd_opt(year, month, 1).unwrap());
    let first = NaiveDate::from_ymd_opt(year, month, 1).unwrap_or(first_next);
    (first_next - first).num_days() as u32
}
