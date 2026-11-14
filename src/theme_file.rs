//! The generated theme files: shadcn `cssVars` for `nsh.json`'s `"theme"`,
//! and the fragment for its `"tailwind"`.
//!
//! [`theme_json`] builds them from [`crate::tokens`], so the data files an app
//! points at and the values Rust components read cannot drift:
//! `cargo run --bin gen-theme` writes them, and a test checks the committed
//! files.

use crate::tokens::{ALIASES, ROLES, type_default};

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

/// The lengths and plain numbers of the theme, as CSS writes them.
const NUMBERS: [(&str, &str); 35] = [
    ("space-1", "4px"),
    ("space-2", "8px"),
    ("space-3", "12px"),
    ("space-4", "16px"),
    ("space-5", "20px"),
    ("space-6", "24px"),
    ("space-11", "44px"),
    ("row-height", "44px"),
    ("nav-height", "44px"),
    ("large-title-height", "52px"),
    ("nav-edge", "16px"),
    ("row-edge", "20px"),
    ("row-trailing", "14px"),
    ("section-edge", "16px"),
    ("leading-size", "28px"),
    ("leading-gap", "16px"),
    ("switch-width", "51px"),
    ("switch-height", "31px"),
    ("switch-thumb", "27px"),
    ("search-height", "36px"),
    ("radius-row", "10px"),
    ("radius-sheet", "14px"),
    ("radius-button", "12px"),
    ("radius-search", "9px"),
    ("radius-switch", "15.5px"),
    ("motion-push-damping", "0.86"),
    ("motion-push-stiffness", "300"),
    ("motion-sheet-damping", "0.8"),
    ("motion-sheet-stiffness", "400"),
    ("motion-press-opacity", "0.4"),
    ("motion-press-scale", "0.97"),
    ("motion-quick", "150"),
    ("motion-base", "300"),
    ("motion-push-duration", "500"),
    ("motion-thumb", "200"),
];

/// The theme file (`nsh.json` `"theme"`): every semantic color role, the
/// shadcn aliases NSH's own classes and `nsh/base` use, the type scale, the
/// spacing, radii and motion tokens. High-contrast values are applied at run
/// time by [`crate::Theme`]: the format has no contrast axis.
pub fn theme_json() -> String {
    let mut theme: Vec<(String, String)> = vec![
        ("radius".into(), "\"10px\"".into()),
        ("hairline".into(), "\"0.33px\"".into()),
    ];
    for (name, step) in STEPS {
        theme.push((format!("text-{name}"), format!("\"{}px\"", step.size.0)));
        theme.push((
            format!("leading-{name}"),
            format!("\"{}px\"", step.line_height.0),
        ));
    }
    for (name, value) in NUMBERS {
        theme.push((name.to_owned(), format!("\"{value}\"")));
    }

    let mut light: Vec<(String, String)> = ROLES
        .iter()
        .map(|role| (role.name.to_owned(), hex(role.light)))
        .collect();
    let mut dark: Vec<(String, String)> = ROLES
        .iter()
        .map(|role| (role.name.to_owned(), hex(role.dark)))
        .collect();
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
                        ("row".to_owned(), "10".to_owned()),
                        ("sheet".to_owned(), "14".to_owned()),
                        ("button".to_owned(), "12".to_owned()),
                        ("search".to_owned(), "9".to_owned()),
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
