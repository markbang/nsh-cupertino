//! The generated theme files: shadcn `cssVars` for `nsh.json`'s `"theme"`,
//! and the fragment for its `"tailwind"`.
//!
//! [`theme_json`] builds them from [`crate::tokens`], so the data files an app
//! points at and the values Rust components read cannot drift:
//! `cargo run --bin gen-theme` writes them, and a test checks the committed
//! files.

use crate::tokens::{ALIASES, ROLES, materials, metrics, radius, type_default};

/// `#rrggbbaa`, as a JSON string.
fn hex(argb: u32) -> String {
    format!("\"#{argb:08x}\"")
}

/// `{ "k": value, ... }`, one entry per line, at `indent` and closed at
/// `close`; `value`s are JSON already.
fn object(entries: &[(String, String)], indent: usize, close: usize) -> String {
    let mut out = String::from("{\n");
    for (i, (key, value)) in entries.iter().enumerate() {
        out.push_str(&" ".repeat(indent));
        out.push_str(&format!("\"{key}\": {value}"));
        out.push_str(if i + 1 == entries.len() { "\n" } else { ",\n" });
    }
    out.push_str(&" ".repeat(close));
    out.push('}');
    out
}

const STEPS: [(&str, crate::tokens::TextStyle); 11] = [
    ("large-title", type_default::LARGE_TITLE),
    ("title1", type_default::TITLE1),
    ("title2", type_default::TITLE2),
    ("title3", type_default::TITLE3),
    ("headline", type_default::HEADLINE),
    ("body", type_default::BODY),
    ("callout", type_default::CALLOUT),
    ("subheadline", type_default::SUBHEADLINE),
    ("footnote", type_default::FOOTNOTE),
    ("caption1", type_default::CAPTION1),
    ("caption2", type_default::CAPTION2),
];

/// The lengths and plain numbers of the theme, as CSS writes them: each read
/// from the token that names it, so the file and the components cannot differ.
fn numbers() -> Vec<(&'static str, String)> {
    use crate::tokens::{motion, radius, space};
    let px = |value: f32| format!("{value}px");
    let plain = |value: f32| format!("{value}");
    vec![
        ("space-1", px(space::HALF.0)),
        ("space-2", px(space::ONE.0)),
        ("space-3", px(space::ONE_HALF.0)),
        ("space-4", px(space::TWO.0)),
        ("space-5", px(space::TWO_HALF.0)),
        ("space-6", px(space::THREE.0)),
        ("space-11", px(space::TARGET.0)),
        ("row-height", px(metrics::ROW_HEIGHT)),
        ("nav-height", px(metrics::NAV_HEIGHT)),
        ("large-title-height", px(metrics::LARGE_TITLE_HEIGHT)),
        ("nav-edge", px(metrics::NAV_EDGE)),
        ("row-edge", px(metrics::ROW_EDGE)),
        ("row-trailing", px(metrics::ROW_TRAILING)),
        ("section-edge", px(metrics::SECTION_EDGE)),
        ("leading-size", px(metrics::LEADING_SIZE)),
        ("leading-gap", px(metrics::LEADING_GAP)),
        ("switch-width", px(metrics::SWITCH_WIDTH)),
        ("switch-height", px(metrics::SWITCH_HEIGHT)),
        ("switch-thumb", px(metrics::SWITCH_THUMB)),
        ("switch-thumb-width", px(metrics::SWITCH_THUMB_WIDTH)),
        ("search-height", px(metrics::SEARCH_HEIGHT)),
        ("radius-row", px(radius::ROW.0)),
        ("radius-group", px(radius::GROUP.0)),
        ("radius-sheet", px(radius::SHEET.0)),
        ("radius-button", px(radius::BUTTON.0)),
        ("radius-search", px(radius::SEARCH.0)),
        ("radius-switch", px(radius::SWITCH.0)),
        ("motion-push-damping", plain(motion::PUSH_DAMPING)),
        ("motion-push-stiffness", plain(motion::PUSH_STIFFNESS)),
        ("motion-sheet-damping", plain(motion::SHEET_DAMPING)),
        ("motion-sheet-stiffness", plain(motion::SHEET_STIFFNESS)),
        ("motion-press-opacity", plain(motion::PRESS_OPACITY)),
        ("motion-press-scale", plain(motion::PRESS_SCALE)),
        ("motion-quick", plain(motion::QUICK_MS)),
        ("motion-base", plain(motion::BASE_MS)),
        ("motion-push-duration", plain(motion::PUSH_MS)),
        ("motion-thumb", plain(motion::THUMB_MS)),
    ]
}

/// The theme file (`nsh.json` `"theme"`): every semantic color role, the
/// shadcn aliases NSH's own classes and `nsh/base` use, the type scale, the
/// spacing, radii and motion tokens. High-contrast values are applied at run
/// time by [`crate::Theme`]: the format has no contrast axis.
pub fn theme_json() -> String {
    let mut theme: Vec<(String, String)> = vec![
        ("radius".into(), format!("\"{}px\"", radius::ROW.0)),
        ("hairline".into(), "\"0.33px\"".into()),
    ];
    for (name, step) in STEPS {
        theme.push((format!("text-{name}"), format!("\"{}px\"", step.size.0)));
        theme.push((
            format!("leading-{name}"),
            format!("\"{}px\"", step.line_height.0),
        ));
    }
    for (name, value) in numbers() {
        theme.push((name.to_owned(), format!("\"{value}\"")));
    }

    for material in materials::ALL {
        theme.push((
            format!("material-{}-blur", material.name),
            format!("\"{}px\"", material.blur),
        ));
    }

    let mut light: Vec<(String, String)> = ROLES
        .iter()
        .map(|role| (role.name.to_owned(), hex(role.light)))
        .collect();
    light.extend(
        materials::ALL
            .iter()
            .map(|material| (format!("material-{}", material.name), hex(material.light))),
    );
    let mut dark: Vec<(String, String)> = ROLES
        .iter()
        .map(|role| (role.name.to_owned(), hex(role.dark)))
        .collect();
    dark.extend(
        materials::ALL
            .iter()
            .map(|material| (format!("material-{}", material.name), hex(material.dark))),
    );
    for appearance in [&mut light, &mut dark] {
        for (alias, target) in ALIASES {
            appearance.push(((*alias).to_owned(), format!("\"var(--{target})\"")));
        }
        appearance.push(("primary-foreground".to_owned(), "\"#ffffffff\"".into()));
    }

    let css_vars = object(
        &[
            ("theme".into(), object(&theme, 6, 4)),
            ("light".into(), object(&light, 6, 4)),
            ("dark".into(), object(&dark, 6, 4)),
        ],
        4,
        2,
    );
    format!("{{\n  \"cssVars\": {css_vars}\n}}\n")
}

/// The `"tailwind"` fragment of `nsh.json`: the radii and type sizes as
/// classes (`rounded-row`, `text-title2`), which the theme file's tokens
/// cannot name as utilities.
pub fn tailwind_json() -> String {
    let mut sizes: Vec<(String, String)> = Vec::new();
    for (name, step) in STEPS {
        let ratio = if step.size.0 > 0.0 {
            step.line_height.0 / step.size.0
        } else {
            1.0
        };
        sizes.push((
            match name {
                "large-title" => "largeTitle".to_owned(),
                other => other.to_owned(),
            },
            format!("[{}, {ratio:.3}]", step.size.0),
        ));
    }
    let tailwind = object(
        &[
            (
                "radius".into(),
                object(
                    &[
                        ("row".to_owned(), radius::ROW.0.to_string()),
                        ("sheet".to_owned(), radius::SHEET.0.to_string()),
                        ("button".to_owned(), radius::BUTTON.0.to_string()),
                        ("search".to_owned(), radius::SEARCH.0.to_string()),
                    ],
                    6,
                    4,
                ),
            ),
            ("fontSize".into(), object(&sizes, 6, 4)),
            (
                "fontWeight".into(),
                object(
                    &[
                        ("regular".to_owned(), "400".to_owned()),
                        ("medium".to_owned(), "500".to_owned()),
                        ("semibold".to_owned(), "600".to_owned()),
                        ("bold".to_owned(), "700".to_owned()),
                    ],
                    6,
                    4,
                ),
            ),
        ],
        4,
        2,
    );
    format!("{}\n", object(&[("tailwind".to_owned(), tailwind)], 2, 0))
}
