//! [`Theme`]: the app's Cupertino tokens, including the high-contrast
//! appearances the theme file format cannot carry.

use nsh_core::{
    element::{Children, Tokens, set_tokens, tokens as current},
    prelude::*,
};

use crate::theme_file::theme_json;
use crate::tokens::{self, ALIASES, ROLES, high_contrast_tokens};

/// The Cupertino tokens on their own (`nsh.json` `"theme"` points at the same
/// values, in `theme/theme.json`).
pub fn base_tokens() -> Tokens {
    nsh_base::Theme::from_json(&theme_json())
        .expect("the generated theme parses")
        .into_tokens()
}

/// `base` with the Cupertino tokens it leaves out: the app's own values win,
/// where both name a token.
pub fn merged(base: &Tokens) -> Tokens {
    let cupertino = base_tokens();
    let mut tokens = base.clone();
    for role in ROLES {
        if tokens.color(role.name).is_none()
            && let Some(color) = cupertino.color(role.name)
        {
            tokens.set_color(role.name, color);
        }
    }
    for (alias, target) in ALIASES {
        if tokens.color(alias).is_none()
            && let Some(color) = tokens.color(target)
        {
            tokens.set_color(alias, color);
        }
    }
    if tokens.color("primary-foreground").is_none() {
        tokens.set_color(
            "primary-foreground",
            nsh_core::element::AdaptiveColor::rgb(0xffffff, 0xffffff),
        );
    }
    // The numbers and fonts the components lay out with; an app may set its own.
    for role in ROLES {
        let _ = role;
    }
    let mut names: Vec<&str> = Vec::new();
    for name in [
        "radius",
        "hairline",
        "row-height",
        "nav-height",
        "large-title-height",
        "nav-edge",
        "row-edge",
        "row-trailing",
        "section-edge",
        "leading-size",
        "leading-gap",
        "switch-width",
        "switch-height",
        "switch-thumb",
        "search-height",
        "radius-row",
        "radius-group",
        "radius-sheet",
        "radius-button",
        "radius-search",
        "radius-switch",
        "motion-press-opacity",
        "motion-press-scale",
        "motion-quick",
        "motion-base",
    ] {
        names.push(name);
    }
    for name in names {
        if tokens.number(name).is_none()
            && let Some(value) = cupertino.number(name)
        {
            tokens.set_number(name, value);
        }
    }
    tokens
}

/// The props of [`Theme`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct ThemeProps {
    /// `"high"` for the increased-contrast colors, `"normal"` (the default)
    /// for the standard ones. Follow the user's setting.
    pub contrast: Prop<Option<SharedString>>,
    /// A colour preset over the system roles (`"cohub"`, see
    /// [`crate::tokens::preset`]); none keeps the system colours.
    pub preset: Prop<Option<SharedString>>,
    /// The app's content.
    pub children: Prop<Children>,
}

/// Upgrades the app's tokens to the Cupertino ones and follows the appearance
/// and the contrast setting: `"high"` swaps in the high-contrast values of
/// the roles, the aliases and the shadcn tokens, so Rust components and TSX
/// classes change together.
///
/// Wrap the app once, at the root. Contrast is the app's to decide (`nsh` has
/// no contrast signal of its own yet); an app reads the platform's
/// `prefers-contrast` where it has one and passes the signal here.
#[component]
pub fn Theme(props: ThemeProps) -> impl IntoElement {
    let base = current();
    effect(move || {
        let dark = nsh_core::element::dark();
        let merged = merged(&base);
        let mut tokens = match props.contrast.get().as_deref() {
            Some("high") => high_contrast_tokens(&merged, dark),
            _ => merged,
        };
        if let Some(roles) = props.preset.get().as_deref().and_then(tokens::preset) {
            for role in roles {
                tokens.set_color(role.name, role.adaptive());
            }
        }
        set_tokens(tokens);
    });
    // The platform's own faces, inherited by every text inside: the app's too.
    view()
        .flex_1()
        .when_some(tokens::font_family(), |view, family| {
            view.font_family(family)
        })
        .child(props.children)
}
