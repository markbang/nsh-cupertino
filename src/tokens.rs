//! The semantic tokens of the Cupertino design system: the single source of
//! truth for colors, type, spacing, radii and motion.
//!
//! Colors follow Apple's semantic roles, each with four appearances: light,
//! dark, light high contrast and dark high contrast. The values are the ones
//! the iOS system colors have (`UIColor.systemBackground` and friends, as
//! `cupertino_ui/lib/src/colors.dart` carries them).
//!
//! `theme/theme.json` is generated from this file (`cargo run --bin gen-theme`)
//! and is what an app's `nsh.json` `"theme"` points at, so Rust, TSX classes
//! and `token()` read one set of values. The theme format has a light and a
//! dark value only: the high-contrast values ship here and [`Theme`] applies
//! them at run time ([`high_contrast_tokens`]).
//!
//! [`Theme`]: crate::Theme

use nsh_core::{
    Hsla,
    color::rgba,
    element::{AdaptiveColor, Tokens},
    geometry::{Points, px},
};

/// A color role: the values of its four appearances, packed `0xRRGGBBAA`.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Role {
    /// The token name, as `nsh.json`'s theme and classes write it (`system-blue`).
    pub name: &'static str,
    /// Light appearance.
    pub light: u32,
    /// Dark appearance.
    pub dark: u32,
    /// Light appearance, increased contrast.
    pub light_hc: u32,
    /// Dark appearance, increased contrast.
    pub dark_hc: u32,
}

impl Role {
    /// The light and dark values, for an [`AdaptiveColor`] the platform
    /// switches by itself.
    pub fn adaptive(self) -> AdaptiveColor {
        AdaptiveColor::new(rgba(self.light), rgba(self.dark))
    }

    /// The value for `dark` and `high_contrast`.
    pub fn value(self, dark: bool, high_contrast: bool) -> Hsla {
        match (dark, high_contrast) {
            (false, false) => rgba(self.light).into(),
            (true, false) => rgba(self.dark).into(),
            (false, true) => rgba(self.light_hc).into(),
            (true, true) => rgba(self.dark_hc).into(),
        }
    }
}

macro_rules! roles {
    ($($(#[$doc:meta])* $name:literal = $light:literal, $dark:literal, $light_hc:literal, $dark_hc:literal;)*) => {
        /// Every color role, in the order Apple groups them.
        pub const ROLES: &[Role] = &[
            $(Role { name: $name, light: $light, dark: $dark, light_hc: $light_hc, dark_hc: $dark_hc },)*
        ];
    };
}

roles! {
    // Backgrounds.
    "system-background" = 0xffff_ffff, 0x0000_00ff, 0xffff_ffff, 0x0000_00ff;
    "secondary-system-background" = 0xf2f2_f7ff, 0x1c1c_1eff, 0xebeb_f0ff, 0x2424_26ff;
    "tertiary-system-background" = 0xffff_ffff, 0x2c2c_2eff, 0xffff_ffff, 0x3636_38ff;
    // Grouped backgrounds.
    "system-grouped-background" = 0xf2f2_f7ff, 0x0000_00ff, 0xebeb_f0ff, 0x0000_00ff;
    "secondary-system-grouped-background" = 0xffff_ffff, 0x1c1c_1eff, 0xffff_ffff, 0x2424_26ff;
    "tertiary-system-grouped-background" = 0xf2f2_f7ff, 0x2c2c_2eff, 0xebeb_f0ff, 0x3636_38ff;
    // Labels.
    "label" = 0x0000_00ff, 0xffff_ffff, 0x0000_00ff, 0xffff_ffff;
    "secondary-label" = 0x3c3c_4399, 0xebeb_f599, 0x3c3c_43ad, 0xebeb_f5ad;
    "tertiary-label" = 0x3c3c_434c, 0xebeb_f54c, 0x3c3c_4360, 0xebeb_f560;
    "quaternary-label" = 0x3c3c_432d, 0xebeb_f528, 0x3c3c_4342, 0xebeb_f53d;
    "placeholder-text" = 0x3c3c_434c, 0xebeb_f54c, 0x3c3c_4360, 0xebeb_f560;
    // Separators.
    "separator" = 0x3c3c_4349, 0x5454_5899, 0x3c3c_435e, 0x5454_58ad;
    "opaque-separator" = 0xc6c6_c8ff, 0x3838_3aff, 0xc6c6_c8ff, 0x3838_3aff;
    // Fills.
    "fill" = 0x7878_8033, 0x7878_805b, 0x7878_8047, 0x7878_8070;
    "secondary-fill" = 0x7878_8028, 0x7878_8051, 0x7878_803d, 0x7878_8066;
    "tertiary-fill" = 0x7676_801e, 0x7676_803d, 0x7676_8033, 0x7676_8051;
    "quaternary-fill" = 0x7474_8014, 0x7676_802d, 0x7474_8028, 0x7676_8042;
    // System colors.
    "system-blue" = 0x007a_ffff, 0x0a84_ffff, 0x0040_ddff, 0x409c_ffff;
    "system-green" = 0x34c7_59ff, 0x30d1_58ff, 0x248a_3dff, 0x30db_5bff;
    "system-red" = 0xff3b_30ff, 0xff45_3aff, 0xd700_15ff, 0xff69_61ff;
    "system-orange" = 0xff95_00ff, 0xff9f_0aff, 0xc934_00ff, 0xffb3_40ff;
    "system-yellow" = 0xffcc_00ff, 0xffda_0aff, 0xa05a_00ff, 0xffd4_26ff;
    "system-purple" = 0xaf52_deff, 0xbf5a_f2ff, 0x8944_abff, 0xda8f_ffff;
    "system-pink" = 0xff2d_55ff, 0xff37_5fff, 0xd30f_45ff, 0xff64_82ff;
    "system-teal" = 0x5ac8_faff, 0x64d2_ffff, 0x0071_a4ff, 0x70d7_ffff;
    "system-indigo" = 0x5856_d6ff, 0x5e5c_e6ff, 0x3634_a3ff, 0x7d7a_ffff;
    "system-gray" = 0x8e8e_93ff, 0x8e8e_93ff, 0x8e8e_93ff, 0x8e8e_93ff;
    "link" = 0x007a_ffff, 0x0984_ffff, 0x007a_ffff, 0x0984_ffff;
}

/// Role names [`Role::name`] of the shadcn tokens `nsh/base` and NSH's classes
/// use, so stock components and `bg-background` follow the same values.
pub const ALIASES: &[(&str, &str)] = &[
    ("background", "system-background"),
    ("foreground", "label"),
    ("card", "secondary-system-grouped-background"),
    ("card-foreground", "label"),
    ("popover", "secondary-system-background"),
    ("popover-foreground", "label"),
    ("primary", "system-blue"),
    ("secondary", "secondary-fill"),
    ("secondary-foreground", "label"),
    ("muted", "secondary-system-background"),
    ("muted-foreground", "secondary-label"),
    ("accent", "fill"),
    ("accent-foreground", "label"),
    ("destructive", "system-red"),
    ("border", "separator"),
    ("input", "separator"),
    ("ring", "system-blue"),
    ("selection", "system-blue"),
];

/// The role named `name`, when it is one.
pub fn role(name: &str) -> Option<&'static Role> {
    ROLES.iter().find(|role| role.name == name)
}

/// The value of the token `name` in the appearance the app shows, falling
/// back to `fallback` when the app's theme left it out.
///
/// Reading a token is reactive: [`nsh_base::theme`] follows the theme, and
/// `dark` follows the appearance.
pub fn color(name: &str, fallback: AdaptiveColor) -> Hsla {
    let color = nsh_base::theme().color(name).unwrap_or(fallback);
    if nsh_core::element::dark() {
        color.dark
    } else {
        color.light
    }
}

/// The role `name`, in the appearance the app shows.
pub fn system(name: &str) -> Hsla {
    let role = role(name).unwrap_or(&ROLES[0]);
    color(name, role.adaptive())
}

macro_rules! tokens {
    ($($(#[$doc:meta])* $fn_name:ident => $name:literal;)*) => {
        $(
            $(#[$doc])*
            pub fn $fn_name() -> Hsla { system($name) }
        )*
    };
}

tokens! {
    /// The main background of the interface.
    system_background => "system-background";
    /// A background layered on [`system_background`].
    secondary_system_background => "secondary-system-background";
    /// A background layered on [`secondary_system_background`].
    tertiary_system_background => "tertiary-system-background";
    /// The background of grouped content, such as a settings list.
    system_grouped_background => "system-grouped-background";
    /// The background of a group in grouped content: its rows' surface.
    secondary_system_grouped_background => "secondary-system-grouped-background";
    /// A group layered on [`secondary_system_grouped_background`].
    tertiary_system_grouped_background => "tertiary-system-grouped-background";
    /// Text and icons of primary content.
    label => "label";
    /// Secondary text: subtitles, values.
    secondary_label => "secondary-label";
    /// Tertiary text: hints under a row, a chevron.
    tertiary_label => "tertiary-label";
    /// Quaternary text: disabled content.
    quaternary_label => "quaternary-label";
    /// Placeholder text of a field.
    placeholder_text => "placeholder-text";
    /// A hairline a little of what it covers shows through.
    separator => "separator";
    /// A hairline that hides what it covers.
    opaque_separator => "opaque-separator";
    /// An overlay fill for thin, small shapes.
    fill => "fill";
    /// An overlay fill for medium shapes.
    secondary_fill => "secondary-fill";
    /// An overlay fill for larger shapes.
    tertiary_fill => "tertiary-fill";
    /// An overlay fill for large areas of complex content.
    quaternary_fill => "quaternary-fill";
    /// The tint for the app's main actions.
    system_blue => "system-blue";
    /// Green: on, success.
    system_green => "system-green";
    /// Red: destructive actions and errors.
    system_red => "system-red";
    /// Orange: warnings.
    system_orange => "system-orange";
    /// Yellow: attention.
    system_yellow => "system-yellow";
    /// Purple.
    system_purple => "system-purple";
    /// Pink.
    system_pink => "system-pink";
    /// Teal.
    system_teal => "system-teal";
    /// Indigo.
    system_indigo => "system-indigo";
    /// Gray.
    system_gray => "system-gray";
    /// A link.
    link => "link";
}

/// White, for text on a system color (`button(for: .filled)` in both
/// appearances).
pub fn on_tint() -> Hsla {
    rgba(0xffff_ffff).into()
}

/// The tokens the high-contrast appearances set, over `base`: every role and
/// alias at its increased-contrast value for `dark`.
pub fn high_contrast_tokens(base: &Tokens, dark: bool) -> Tokens {
    let mut tokens = base.clone();
    for role in ROLES {
        tokens.set_color(role.name, role.value(dark, true).into());
    }
    for (alias, role) in ALIASES {
        let value = role_by_name(role).map_or(system_blue_value(dark), |r| r.value(dark, true));
        tokens.set_color(alias, value.into());
    }
    // White stays white: text on a tint does not change with contrast.
    tokens.set_color("primary-foreground", rgba(0xffff_ffff).into());
    tokens
}

fn system_blue_value(dark: bool) -> Hsla {
    role("system-blue").map_or(rgba(0x007a_ffff).into(), |r| r.value(dark, true))
}

fn role_by_name(name: &str) -> Option<&'static Role> {
    role(name)
}

/// A length token: the app's theme's value when it sets one, else the
/// design system's.
pub fn length(name: &str, fallback: f32) -> Points {
    px(nsh_base::theme().number(name).unwrap_or(fallback))
}

/// The hairline a separator is drawn with: 0.33 pt, as iOS draws it at @3x.
pub fn hairline() -> Points {
    length("hairline", 0.33)
}

// --- Type ------------------------------------------------------------------

/// One step of the type scale: size, line height, weight and tracking, in
/// points.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TextStyle {
    /// The font size.
    pub size: Points,
    /// The line height.
    pub line_height: Points,
    /// The font weight (200–800).
    pub weight: u16,
    /// The tracking, in points.
    pub tracking: Points,
}

const fn style(size: f32, line_height: f32, weight: u16, tracking: f32) -> TextStyle {
    TextStyle {
        size: px(size),
        line_height: px(line_height),
        weight,
        tracking: px(tracking),
    }
}

/// The eleven steps of Apple's type scale, at their default sizes.
pub mod type_default {
    use super::TextStyle;

    /// 34 / 41, bold.
    pub const LARGE_TITLE: TextStyle = super::style(34.0, 41.0, 700, 0.38);
    /// 28 / 34, regular.
    pub const TITLE1: TextStyle = super::style(28.0, 34.0, 400, 0.36);
    /// 22 / 28, regular.
    pub const TITLE2: TextStyle = super::style(22.0, 28.0, 400, 0.35);
    /// 20 / 25, regular.
    pub const TITLE3: TextStyle = super::style(20.0, 25.0, 400, 0.38);
    /// 17 / 22, semibold.
    pub const HEADLINE: TextStyle = super::style(17.0, 22.0, 600, -0.41);
    /// 17 / 22, regular.
    pub const BODY: TextStyle = super::style(17.0, 22.0, 400, -0.41);
    /// 16 / 21, regular.
    pub const CALLOUT: TextStyle = super::style(16.0, 21.0, 400, -0.32);
    /// 15 / 20, regular.
    pub const SUBHEADLINE: TextStyle = super::style(15.0, 20.0, 400, -0.24);
    /// 13 / 18, regular.
    pub const FOOTNOTE: TextStyle = super::style(13.0, 18.0, 400, -0.08);
    /// 12 / 16, regular.
    pub const CAPTION1: TextStyle = super::style(12.0, 16.0, 400, 0.0);
    /// 11 / 13, regular.
    pub const CAPTION2: TextStyle = super::style(11.0, 13.0, 400, 0.07);
}

/// The type scale, as the app's theme sets it.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TypeScale {
    /// 34 / 41, bold.
    pub large_title: TextStyle,
    /// 28 / 34.
    pub title1: TextStyle,
    /// 22 / 28.
    pub title2: TextStyle,
    /// 20 / 25.
    pub title3: TextStyle,
    /// 17 / 22, semibold.
    pub headline: TextStyle,
    /// 17 / 22.
    pub body: TextStyle,
    /// 16 / 21.
    pub callout: TextStyle,
    /// 15 / 20.
    pub subheadline: TextStyle,
    /// 13 / 18.
    pub footnote: TextStyle,
    /// 12 / 16.
    pub caption1: TextStyle,
    /// 11 / 13.
    pub caption2: TextStyle,
}

impl TypeScale {
    /// The scale the theme sets, over the defaults.
    pub fn from_theme() -> Self {
        let step = |name: &str, default: TextStyle| TextStyle {
            size: length(&format!("text-{name}"), default.size.0),
            line_height: length(&format!("leading-{name}"), default.line_height.0),
            ..default
        };
        Self {
            large_title: step("large-title", type_default::LARGE_TITLE),
            title1: step("title1", type_default::TITLE1),
            title2: step("title2", type_default::TITLE2),
            title3: step("title3", type_default::TITLE3),
            headline: step("headline", type_default::HEADLINE),
            body: step("body", type_default::BODY),
            callout: step("callout", type_default::CALLOUT),
            subheadline: step("subheadline", type_default::SUBHEADLINE),
            footnote: step("footnote", type_default::FOOTNOTE),
            caption1: step("caption1", type_default::CAPTION1),
            caption2: step("caption2", type_default::CAPTION2),
        }
    }
}

/// The four-point spacing scale iOS uses, plus the 44-point touch target.
pub mod space {
    use nsh_core::geometry::{Points, px};

    /// 4 pt.
    pub const HALF: Points = px(4.0);
    /// 8 pt.
    pub const ONE: Points = px(8.0);
    /// 12 pt.
    pub const ONE_HALF: Points = px(12.0);
    /// 16 pt: a screen's margin, a row's leading inset.
    pub const TWO: Points = px(16.0);
    /// 20 pt.
    pub const TWO_HALF: Points = px(20.0);
    /// 24 pt.
    pub const THREE: Points = px(24.0);
    /// 44 pt: the smallest touch target on iOS.
    pub const TARGET: Points = px(44.0);
}

/// Corner radii, as iOS rounds them (the corners are continuous, which the
/// platforms draw where they support superellipses).
pub mod radius {
    use nsh_core::geometry::{Points, px};

    /// 10 pt: a row in a grouped list, a grouped text field.
    pub const ROW: Points = px(10.0);
    /// 14 pt: a sheet.
    pub const SHEET: Points = px(14.0);
    /// 12 pt: a large button.
    pub const BUTTON: Points = px(12.0);
    /// 9 pt: a search field.
    pub const SEARCH: Points = px(9.0);
    /// 15.5 pt: a switch track.
    pub const SWITCH: Points = px(15.5);
}

/// The motion of the design system: springs, durations, presses.
///
/// iOS moves things with springs, not curves: a page pushes in with a spring
/// that settles without bouncing (`damping` 0.86 of critical, stiffness 300),
/// a sheet with a softer one (0.8 / 400). Presses are opacity, not scale, for
/// buttons and rows; cards may scale to [`PRESS_SCALE`]. Every motion is
/// skipped when the user asks for less motion.
pub mod motion {
    /// The damping ratio of a pushed page, of critical damping.
    pub const PUSH_DAMPING: f32 = 0.86;
    /// The stiffness of a pushed page.
    pub const PUSH_STIFFNESS: f32 = 300.0;
    /// The damping ratio of a sheet's detents.
    pub const SHEET_DAMPING: f32 = 0.8;
    /// The stiffness of a sheet's detents.
    pub const SHEET_STIFFNESS: f32 = 400.0;
    /// The opacity of a pressed button or row (`CupertinoButton.pressedOpacity`).
    pub const PRESS_OPACITY: f32 = 0.4;
    /// The scale of a pressed card or tile.
    pub const PRESS_SCALE: f32 = 0.97;
    /// 150 ms: a title fading, a press.
    pub const QUICK_MS: f32 = 150.0;
    /// 300 ms: a color, a sheet dismissing.
    pub const BASE_MS: f32 = 300.0;
    /// 500 ms: a page pushing in (`kTransitionDuration`).
    pub const PUSH_MS: f32 = 500.0;
    /// 500 ms: a sheet presenting.
    pub const SHEET_MS: f32 = 500.0;
    /// 200 ms: a switch's thumb.
    pub const THUMB_MS: f32 = 200.0;
}

/// The metrics iOS components are laid out with.
pub mod metrics {
    /// A navigation bar's height, below the status bar.
    pub const NAV_HEIGHT: f32 = 44.0;
    /// The height a large title adds below a navigation bar.
    pub const LARGE_TITLE_HEIGHT: f32 = 52.0;
    /// A navigation bar's side padding.
    pub const NAV_EDGE: f32 = 16.0;
    /// How wide the system back button's target is.
    pub const BACK_TARGET: f32 = 50.0;
    /// A list row's smallest height, without a subtitle.
    pub const ROW_HEIGHT: f32 = 44.0;
    /// A list row's smallest height, with a subtitle.
    pub const ROW_HEIGHT_SUBTITLE: f32 = 48.0;
    /// A row's leading inset.
    pub const ROW_EDGE: f32 = 20.0;
    /// A row's trailing inset.
    pub const ROW_TRAILING: f32 = 14.0;
    /// A leading icon's box.
    pub const LEADING_SIZE: f32 = 28.0;
    /// Between a leading icon and the title.
    pub const LEADING_GAP: f32 = 16.0;
    /// A grouped section's margin from the screen's edge.
    pub const SECTION_EDGE: f32 = 16.0;
    /// Above a section's first group.
    pub const SECTION_TOP: f32 = 22.0;
    /// A switch's track.
    pub const SWITCH_WIDTH: f32 = 51.0;
    /// A switch's track height.
    pub const SWITCH_HEIGHT: f32 = 31.0;
    /// A switch's thumb.
    pub const SWITCH_THUMB: f32 = 27.0;
    /// A search field's height.
    pub const SEARCH_HEIGHT: f32 = 36.0;
    /// A button's default minimum size.
    pub const BUTTON_LARGE: f32 = 44.0;
}
