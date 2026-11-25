//! The semantic tokens of the Cupertino design system: the single source of
//! truth for colors, type, spacing, radii and motion.
//!
//! Colors follow Apple's semantic roles, each with four appearances: light,
//! dark, light high contrast and dark high contrast. The values are the ones
//! the iOS system colors have (`UIColor.systemBackground` and friends, as
//! `cupertino_ui/lib/src/colors.dart` carries them; see `NOTICE`).
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
    // Liquid Glass fills: the tint a glass surface mixes over its blurred
    // backdrop. Thinner than `materials`, because the lens carries part of the
    // separation; the increased-contrast values are near opaque, as the HIG
    // asks of glass it cannot guarantee contrast over.
    // The values are iOS 27's `glassEffect(.regular)`, read from the
    // calibrated presets in `liquid_glass_widgets` (MIT): #87F8F8F8 in light
    // (53 % white) and #1FFFFFFF in dark (12 % white; the material is lighter
    // than what lies behind it, not a black slab).
    "glass-regular" = 0xf8f8_f887, 0xffff_ff24, 0xf8f8_f8f2, 0xffff_ff4d;
    "glass-clear" = 0xffff_ff38, 0xffff_ff0d, 0xffff_ffd9, 0xffff_ff33;
    "glass-thick" = 0xf8f8_f8ad, 0xffff_ff33, 0xf8f8_f8f7, 0xffff_ff66;
    // Status and control colors. The defaults are the system's, so an app that
    // sets no preset draws what it always did: the cohub preset replaces them.
    "on-tint" = 0xffff_ffff, 0xffff_ffff, 0xffff_ffff, 0xffff_ffff;
    "switch-on" = 0x34c7_59ff, 0x30d1_58ff, 0x248a_3dff, 0x30db_5bff;
    "switch-off" = 0x7878_8028, 0x7878_8051, 0x7878_803d, 0x7878_8066;
    "success" = 0x34c7_59ff, 0x30d1_58ff, 0x248a_3dff, 0x30db_5bff;
    "success-soft" = 0x34c7_591f, 0x30d1_581f, 0x248a_3d1f, 0x30db_5b1f;
    "warning" = 0xff95_00ff, 0xff9f_0aff, 0xc934_00ff, 0xffb3_40ff;
    "warning-soft" = 0xff95_001f, 0xff9f_0a1f, 0xc934_001f, 0xffb3_401f;
    "info" = 0x007a_ffff, 0x0a84_ffff, 0x0040_ddff, 0x409c_ffff;
    "info-soft" = 0x007a_ff1f, 0x0a84_ff1f, 0x0040_dd1f, 0x409c_ff1f;
    "danger-soft" = 0xff3b_301f, 0xff45_3a1f, 0xd700_151f, 0xff69_611f;
    "danger" = 0xff3b_30ff, 0xff45_3aff, 0xd700_15ff, 0xff69_61ff;
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
    "system-gray" = 0x8e8e_93ff, 0x8e8e_93ff, 0x6c6c_70ff, 0xaeae_b2ff;
    "system-gray2" = 0xaeae_b2ff, 0x6363_66ff, 0x8e8e_93ff, 0x7c7c_80ff;
    "system-gray3" = 0xc7c7_ccff, 0x4848_4aff, 0xaeae_b2ff, 0x5454_56ff;
    "system-gray4" = 0xd1d1_d6ff, 0x3a3a_3cff, 0xbcbc_c0ff, 0x4444_46ff;
    "system-gray5" = 0xe5e5_eaff, 0x2c2c_2eff, 0xd8d8_dcff, 0x3636_38ff;
    "system-gray6" = 0xf2f2_f7ff, 0x1c1c_1eff, 0xebeb_f0ff, 0x2424_26ff;
    "link" = 0x007a_ffff, 0x0984_ffff, 0x007a_ffff, 0x0984_ffff;
    // Not UIKit roles: cupertino_ui's own values, inspected on iOS.
    "section-header-footer" = 0x6c6c_6cff, 0x8e8e_92ff, 0x4a4a_4dff, 0xb0b0_b7ff;
    "clear-button" = 0x0000_0033, 0xffff_ff33, 0x0000_0059, 0xffff_ff59;
    "text-field-disabled-background" = 0xfafa_faff, 0x0505_05ff, 0xfafa_faff, 0x0505_05ff;
    "activity-tick" = 0x3c3c_44ff, 0xebeb_f5ff, 0x0000_00ff, 0xffff_ffff;
}

/// The cohub theme preset: Cohub Mobile's palette over the system roles it
/// names (`src/design/tokens.ts` in cohub-mobile: `lightPalette` and
/// `darkPalette`). The increased-contrast values are the standard ones.
pub const COHUB_PRESET: &[Role] = &[
    preset_role("system-background", 0xf6f3_eeff, 0x1212_14ff),
    preset_role("system-blue", 0xbf3f_00ff, 0xff8a_3dff),
    preset_role("system-red", 0xbf2b_3cff, 0xf278_7fff),
    preset_role("system-grouped-background", 0xf6f3_eeff, 0x1212_14ff),
    preset_role(
        "secondary-system-grouped-background",
        0xffff_ffff,
        0x1c1c_1eff,
    ),
    preset_role("secondary-system-background", 0xffff_ffff, 0x6464_6aff),
    preset_role("system-gray5", 0xefeb_e4ff, 0x2c2c_2eff),
    preset_role("label", 0x1613_0fff, 0xf2f2_f7ff),
    preset_role("secondary-label", 0x4a45_3eff, 0xd1d1_d6ff),
    preset_role("on-tint", 0xffff_ffff, 0x1c0d_02ff),
    preset_role("switch-on", 0xbf3f_00ff, 0xff8a_3dff),
    preset_role("switch-off", 0xbfbc_bbff, 0x5353_57ff),
    preset_role("success", 0x1c7a_4aff, 0x62c9_94ff),
    preset_role("success-soft", 0xe6f5_ecff, 0x1b31_27ff),
    preset_role("warning", 0x8a60_10ff, 0xe6b8_5cff),
    preset_role("warning-soft", 0xfdf3_d8ff, 0x362d_1bff),
    preset_role("info", 0x3a68_a8ff, 0x83a9_e8ff),
    preset_role("info-soft", 0xe9f0_fbff, 0x1f2b_3fff),
    preset_role("danger-soft", 0xfdea_ecff, 0x3a20_24ff),
    preset_role("danger", 0xbf2b_3cff, 0xf278_7fff),
];

const fn preset_role(name: &'static str, light: u32, dark: u32) -> Role {
    Role {
        name,
        light,
        dark,
        light_hc: light,
        dark_hc: dark,
    }
}

/// The preset named `name`: `cohub` is [`COHUB_PRESET`]; none for any other.
pub fn preset(name: &str) -> Option<&'static [Role]> {
    match name {
        "cohub" => Some(COHUB_PRESET),
        _ => None,
    }
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
    ("destructive", "danger"),
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
    /// The red of a destructive row, its tile and its title; the cohub preset sets it.
    danger => "danger";
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
    /// A lighter gray.
    system_gray2 => "system-gray2";
    /// A lighter gray still.
    system_gray3 => "system-gray3";
    /// The gray a pressed row fills with.
    system_gray4 => "system-gray4";
    /// A very light gray.
    system_gray5 => "system-gray5";
    /// The lightest gray, the grouped background in light.
    system_gray6 => "system-gray6";
    /// A link.
    link => "link";
    /// A grouped section's header and footer text.
    section_header_footer => "section-header-footer";
    /// A field's clear button, 20 % of the text color.
    clear_button => "clear-button";
    /// A disabled text field's background.
    text_field_disabled_background => "text-field-disabled-background";
    /// The activity indicator's blades.
    activity_tick => "activity-tick";
}

/// The text on a system color (`button(for: .filled)`): white, unless a
/// preset sets `on-tint`.
pub fn on_tint() -> Hsla {
    system("on-tint")
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

/// `configured` points as a separator's thickness on a display of
/// `pixel_ratio` device pixels per point: never thinner than one device
/// pixel, and a whole number of them.
///
/// 0.33 pt is one pixel at @3x; at 1x it would round to nothing, which is
/// what left rows on a 1x display without a separator.
pub fn hairline_for(configured: f32, pixel_ratio: f32) -> f32 {
    let ratio = pixel_ratio.max(1.0);
    (configured * ratio).max(1.0).round() / ratio
}

/// The separator's thickness on this display: [`hairline`], at least one
/// device pixel (`hairline_for`). Reading it follows the display's scale.
pub fn separator_thickness() -> Points {
    px(hairline_for(
        length("hairline", 0.33).0,
        nsh_core::element::pixel_ratio(),
    ))
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
    /// 13 / 18, regular: a list row's subtitle (Cohub Mobile's `text-caption`).
    pub const SUBTITLE: TextStyle = super::style(13.0, 18.0, 400, -0.08);
}

// --- The platform's type face ----------------------------------------------

/// The face list the app draws with, as CSS writes `fontFamily`: first the
/// platform's own Latin face, then the CJK face whose glyphs and widths match
/// it, then the system's last resort. Characters a face lacks come from the
/// next one (Android 10+, the web, CoreText).
///
/// The Apple platforms name none: their system font (SF Pro, PingFang for
/// Chinese) is the face the type scale was drawn for. Android's Roboto is
/// close to it but sets Chinese with Noto Sans CJK, and the phone's own
/// default may pick another language's glyphs (Japanese forms for the same
/// code points); naming the Simplified Chinese face keeps the shapes the
/// design expects and the widths its layout assumed.
pub fn font_family() -> Option<&'static str> {
    match nsh_core::element::os() {
        nsh_core::platform::Os::Ios | nsh_core::platform::Os::MacOs => None,
        nsh_core::platform::Os::Android => {
            Some("Roboto, 'Noto Sans CJK SC', 'Noto Sans SC', 'Noto Sans', sans-serif")
        }
        nsh_core::platform::Os::Windows => Some(
            "'Segoe UI Variable Text', 'Segoe UI', 'Microsoft YaHei UI', 'Microsoft YaHei', sans-serif",
        ),
        nsh_core::platform::Os::Linux => {
            Some("Inter, Cantarell, 'DejaVu Sans', 'Noto Sans CJK SC', 'Noto Sans', sans-serif")
        }
        nsh_core::platform::Os::Web => Some(
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans CJK SC', \
             'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        ),
    }
}

/// Whether the type scale's tracking was drawn for the face in use: only on
/// the Apple platforms, whose system font is the one the values were measured
/// against. Roboto and Noto carry their own spacing, and the design's
/// tracking would loosen or crowd them.
pub fn tracking_applies() -> bool {
    matches!(
        nsh_core::element::os(),
        nsh_core::platform::Os::Ios | nsh_core::platform::Os::MacOs
    )
}

/// `style`'s tracking where the app draws it: the design's on Apple's system
/// font, none on the other platforms' faces ([`tracking_applies`]).
pub fn tracking(style: TextStyle) -> Points {
    if tracking_applies() {
        style.tracking
    } else {
        px(0.0)
    }
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
    /// 13 / 18, a list row's subtitle.
    pub subtitle: TextStyle,
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
            subtitle: step("subtitle", type_default::SUBTITLE),
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

    /// 10 pt: a grouped text field.
    pub const ROW: Points = px(10.0);
    /// 20 pt: a grouped card of rows (`rounded-md` in Cohub Mobile's settings).
    pub const GROUP: Points = px(20.0);
    /// 8 pt: a leading icon's tile (`rounded-xs`).
    pub const TILE: Points = px(8.0);
    /// 14 pt: a sheet.
    pub const SHEET: Points = px(14.0);
    /// 26 pt: a large button, a capsule of its 52 pt height.
    pub const BUTTON: Points = px(26.0);
    /// 22 pt: a search field, a capsule of its 44 pt height.
    pub const SEARCH: Points = px(22.0);
    /// 14 pt: a switch track, a capsule of its 28 pt height.
    pub const SWITCH: Points = px(14.0);
}

/// The motion of the design system: springs, durations, presses.
///
/// iOS moves things with springs, not curves: a page pushes in with a spring
/// that settles without bouncing (`damping` 0.86 of critical, stiffness 300),
/// a sheet with a critically damped one (1.0 / 280, fitted to iOS's sheet
/// recording, `research/ios-reference/motion/motion-sheet.mp4`). Presses are
/// opacity, not scale, for buttons and rows; cards may scale to
/// [`PRESS_SCALE`]. Every motion is skipped when the user asks for less motion.
pub mod motion {
    /// The damping ratio of a pushed page, of critical damping.
    pub const PUSH_DAMPING: f32 = 0.86;
    /// The stiffness of a pushed page.
    pub const PUSH_STIFFNESS: f32 = 300.0;
    /// The damping ratio of a sheet's entrance and detents: critical.
    pub const SHEET_DAMPING: f32 = 1.0;
    /// The stiffness of a sheet's entrance and detents.
    pub const SHEET_STIFFNESS: f32 = 280.0;
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
    /// 120 ms: a button fading to its pressed opacity (`kFadeOutDuration`).
    pub const PRESS_FADE_IN_MS: f32 = 120.0;
    /// 180 ms: a button fading back (`kFadeInDuration`).
    pub const PRESS_FADE_OUT_MS: f32 = 180.0;
    /// 1000 ms: one turn of the activity indicator's eight blades.
    pub const SPIN_MS: f32 = 1000.0;
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
    /// A text field's smallest height.
    pub const FIELD_HEIGHT: f32 = 44.0;
    /// A list row's smallest height, without a subtitle (52 pt, `GroupRow`).
    pub const ROW_HEIGHT: f32 = 52.0;
    /// A list row's smallest height, with a subtitle: the iOS reference's
    /// two-line row, 57.5 pt.
    pub const ROW_HEIGHT_SUBTITLE: f32 = 57.5;
    /// A top-aligned row's height (`ListTile`'s `align="top"`): 60 pt in the
    /// iOS reference's Notifications row.
    pub const ROW_HEIGHT_TOP: f32 = 60.0;
    /// A top-aligned row's inset above and below its content: 8 pt, where
    /// the title and the switch start.
    pub const ROW_TOP_INSET: f32 = 8.0;
    /// A row's leading and trailing inset from the card's edge (16 pt).
    pub const ROW_EDGE: f32 = 16.0;
    /// A row's trailing inset.
    pub const ROW_TRAILING: f32 = 16.0;
    /// A leading icon's tile: 30 pt, as Cohub Mobile's `GroupTile`.
    pub const LEADING_SIZE: f32 = 30.0;
    /// Between a leading tile and the title: 12 pt, so the text starts 58 pt
    /// from the card's edge, where the separator starts too.
    pub const LEADING_GAP: f32 = 12.0;
    /// A leading icon's glyph, in its tile.
    pub const LEADING_GLYPH: f32 = 18.0;
    /// A grouped section's margin from the screen's edge: 16 pt, as Cohub
    /// Mobile's settings groups (`px-4` in `ui.tsx`'s `SettingsGroup`).
    pub const SECTION_EDGE: f32 = 16.0;
    /// A section header's inset from the screen's edge: 32 pt in the iOS
    /// reference, the card's edge plus a row's inset.
    pub const SECTION_HEADER_EDGE: f32 = 32.0;
    /// Above a section's group (`_kDefaultInsetGroupedRowsMargin`'s top).
    pub const SECTION_TOP: f32 = 20.0;
    /// Above a section's header (`_kInsetGroupedDefaultHeaderMargin`).
    pub const HEADER_TOP: f32 = 16.0;
    /// Between a section's header and its group, and between its group and
    /// its footer: 23 pt from a header's cap height to its group, as the iOS
    /// reference measures it.
    pub const HEADER_BOTTOM: f32 = 10.0;
    /// Below a section's footer.
    pub const FOOTER_BOTTOM: f32 = 10.0;
    /// Between a row's title and its subtitle (`_kNotchedTitleToSubtitle`).
    pub const TITLE_SUBTITLE_GAP: f32 = 3.0;
    /// A switch's track.
    pub const SWITCH_WIDTH: f32 = 63.0;
    /// A switch's track height.
    pub const SWITCH_HEIGHT: f32 = 28.0;
    /// A switch's thumb, its height.
    pub const SWITCH_THUMB: f32 = 24.0;
    /// A switch's thumb, its width.
    pub const SWITCH_THUMB_WIDTH: f32 = 37.0;
    /// A search field's height.
    pub const SEARCH_HEIGHT: f32 = 44.0;
    /// A large button: 52 pt, as Cohub Mobile's primary button (`min-h-13`).
    pub const BUTTON_LARGE: f32 = 52.0;
    /// A medium button.
    pub const BUTTON_MEDIUM: f32 = 32.0;
    /// A small button.
    pub const BUTTON_SMALL: f32 = 28.0;
    /// A section header's text size: 13 pt by the iOS reference's pixels (the
    /// cohub code says 17 pt; the pixels win).
    pub const SECTION_HEADER_SIZE: f32 = 13.0;
    /// The widest a sheet's panel gets: wider windows centre it as a card
    /// (an iPad form sheet's width; the panel is full width on a phone).
    pub const SHEET_MAX_WIDTH: f32 = 640.0;
}

/// The materials of the functional layer: the fills and blur radii a bar or a
/// sheet uses over content. Glass belongs to the floating layer only (HIG,
/// `materials.md`, `liquid-glass.md`); content keeps a solid background.
///
/// The fills are translucent, over the blur: `regular` is what a bar uses over
/// scrolling content, `thin` and `ultra_thin` let more through for media, and
/// `thick` carries text. The numbers follow the layering idea and the blur
/// distances of Lenso UI's material recipes (see `NOTICE`), rounded to the
/// values iOS's own bars read as.
pub mod materials {
    use nsh_core::{Hsla, color::rgba};

    /// One material: its fill in light and dark, and the blur radius.
    #[derive(Debug, Clone, Copy, PartialEq)]
    pub struct Material {
        /// The token name (`regular`).
        pub name: &'static str,
        /// Light appearance.
        pub light: u32,
        /// Dark appearance.
        pub dark: u32,
        /// Light appearance, increased contrast (more opaque).
        pub light_hc: u32,
        /// Dark appearance, increased contrast.
        pub dark_hc: u32,
        /// The blur radius, in points.
        pub blur: f32,
    }

    impl Material {
        /// The fill for `dark` and `high_contrast`.
        pub fn fill(self, dark: bool, high_contrast: bool) -> Hsla {
            match (dark, high_contrast) {
                (false, false) => rgba(self.light).into(),
                (true, false) => rgba(self.dark).into(),
                (false, true) => rgba(self.light_hc).into(),
                (true, true) => rgba(self.dark_hc).into(),
            }
        }
    }

    /// Every material, thinnest first.
    pub const ALL: &[Material] = &[
        Material {
            name: "ultra-thin",
            light: 0xffff_ffb3,
            dark: 0x0000_00b3,
            light_hc: 0xffff_ffd9,
            dark_hc: 0x0000_00d9,
            blur: 20.0,
        },
        Material {
            name: "thin",
            light: 0xffff_ffcc,
            dark: 0x0000_00cc,
            light_hc: 0xffff_ffe6,
            dark_hc: 0x0000_00e6,
            blur: 25.0,
        },
        Material {
            name: "regular",
            light: 0xffff_ffd9,
            dark: 0x1c1c_1ee6,
            light_hc: 0xffff_fff0,
            dark_hc: 0x1c1c_1ef7,
            blur: 25.0,
        },
        Material {
            name: "thick",
            light: 0xffff_fff0,
            dark: 0x1c1c_1ef7,
            light_hc: 0xffff_fffa,
            dark_hc: 0x1c1c_1efc,
            blur: 30.0,
        },
        Material {
            name: "chrome",
            light: 0xffff_ffbf,
            dark: 0x1c1c_1ee6,
            light_hc: 0xffff_ffe0,
            dark_hc: 0x1c1c_1ef2,
            blur: 25.0,
        },
    ];

    /// The material named `name`, `regular` when there is none.
    pub fn get(name: &str) -> Material {
        ALL.iter()
            .find(|material| material.name == name)
            .copied()
            .unwrap_or(ALL[2])
    }

    /// The fill of the material `name` in the appearance shown.
    pub fn fill(name: &str, dark: bool, high_contrast: bool) -> Hsla {
        get(name).fill(dark, high_contrast)
    }

    /// The blur radius of the material `name`.
    pub fn blur(name: &str) -> nsh_core::geometry::Points {
        nsh_core::geometry::px(get(name).blur)
    }
}

/// The numbers of the Liquid Glass material: the height field of the lens, the
/// specular rim, the press and the merge.
///
/// The behaviour follows Apple's *Liquid Glass* (WWDC25 "Meet Liquid Glass",
/// HIG *Materials* and *Liquid Glass*): a rim that refracts what lies outside
/// the shape, a specular highlight that follows the light, an adaptive tint,
/// and clear/regular variants. The numbers are this crate's, tuned against
/// screenshots; `NOTICE` lists the implementations they were checked against.
pub mod glass {
    /// The width of the lensed rim, in points: inside it the height field
    /// rises from the edge to the flat middle.
    pub const BEVEL: f32 = 10.0;
    /// How far a ray shifts at the very rim, in points: a paraxial lens of
    /// 1.24 through 32 pt of glass bends by `(n - 1) * thickness`. Unmeasured
    /// on iOS: under the composer the side rims show content from further in
    /// while the top rim leans outward, so not even the sign is settled
    /// (`research/ios-reference/mapping.md`, section 8).
    pub const THICKNESS: f32 = 8.0;
    /// The magnification of the picture under the sheet at rest: none. Colour
    /// bars scrolled under iOS 27's composer keep their joins within 0.5 px
    /// 400 px from its centre (m = 1.000 ± 0.002, light and dark), where 0.8 %
    /// would move them 3 px.
    pub const LENS: f32 = 0.0;
    /// The blur radius of the material, in points: small, so the detail under
    /// a control survives (the scroll edge effect carries the dissolve).
    pub const BLUR: f32 = 5.0;
    /// The blur of a floating bar, in points (24). The shader samples a disc of
    /// this radius, so its σ is 0.456 × 24 ≈ 11 pt: the iOS pull-down menu's
    /// measured σ, 10 pt in light and 12 pt in dark (`tools/measure-glass-ios.py`).
    pub const BAR_BLUR: f32 = 24.0;
    /// The strength of the specular rim.
    pub const SPECULAR: f32 = 0.7;
    /// The chromatic separation of the rim, in points (one pixel at @3x).
    pub const CHROMA: f32 = 0.0;
    /// The direction the light comes from, in degrees: iOS 27 lights its light
    /// material from below and its dark one from above.
    pub const LIGHT: f32 = 90.0;
    /// The light of the dark appearance, in degrees.
    pub const LIGHT_DARK: f32 = 270.0;
    /// Rec. 709 saturation of the backdrop (iOS 27: 2.1 light, 1.4 dark).
    pub const SATURATION: f32 = 2.1;
    /// See [`SATURATION`].
    pub const SATURATION_DARK: f32 = 1.4;
    /// The frost in light: opacity, clamp and weight, [1.0, 0.0, 0.0], a plain
    /// blur. The iOS menu's light glass fits a plain blur best: no luminance-weighted ghost.
    pub const FROST: [f32; 3] = [1.0, 0.0, 0.0];
    /// The frost in dark: opacity, clamp and weight, [0.4, 0.0, 5.0]. The iOS
    /// menu's dark glass fits a ghost weighted 5 toward bright texels, held at the
    /// brighter of ghost and blur: 10 % less residual than a plain blur.
    pub const FROST_DARK: [f32; 3] = [0.4, 0.0, 5.0];
    /// The hairline's darkening, and the rim light's strength.
    pub const RIM: [f32; 2] = [1.0, 1.0];
    /// See [`RIM`], dark. Unmeasured: the tab bar's dark rim peaks are equal
    /// at the top and bottom (102 and 101 of 255), so no lit-side excess shows
    /// there; the strength itself is not measured.
    pub const RIM_DARK: [f32; 2] = [1.0, 1.15];
    /// How far a bright backdrop is pulled down (dark glass only).
    pub const BODY_SHADE: f32 = 0.32;
    /// The radius of a minimized floating bar, in points.
    pub const MIN_RADIUS: f32 = 25.0;
    /// How far content scrolls before a floating bar's glass is fully shown.
    pub const REVEAL_DISTANCE: f32 = 26.0;
    /// The alpha of a `tinted` glass fill. Unmeasured: no tinted glass control
    /// is in the iOS shots or clips.
    pub const TINTED_ALPHA: f32 = 0.16;

    /// The token names of the fills: `glass-regular`, `glass-clear`,
    /// `glass-thick`.
    pub const REGULAR: &str = "glass-regular";
    /// See [`REGULAR`].
    pub const CLEAR: &str = "glass-clear";
    /// See [`REGULAR`].
    pub const THICK: &str = "glass-thick";

    /// What a press drives its animated value to.
    pub const PRESS_HELD: f32 = 1.0;
    /// The magnification while held (1.92 %). Unmeasured: the iOS press clip
    /// (`motion-press`) shows only solid buttons, no glass press.
    pub const PRESS_LENS: f32 = 0.0192;
    /// The squash of the surface while held.
    pub const PRESS_SCALE: f32 = 0.965;
    /// The spring a press runs on (`~250 ms` to rest).
    pub const PRESS_DAMPING: f32 = 0.72;
    /// See [`PRESS_DAMPING`].
    pub const PRESS_STIFFNESS: f32 = 420.0;
    /// The spring a release runs on.
    pub const RELEASE_DAMPING: f32 = 0.86;
    /// See [`RELEASE_DAMPING`].
    pub const RELEASE_STIFFNESS: f32 = 300.0;
    /// The spring a [`crate::GlassGroup`] merges on.
    pub const MERGE_DAMPING: f32 = 0.78;
    /// See [`MERGE_DAMPING`].
    pub const MERGE_STIFFNESS: f32 = 340.0;
}

/// The fill of the glass material `name` in the appearance and contrast
/// shown: a token, so [`crate::Theme`]'s `contrast="high"` swaps in the
/// near-opaque values.
pub fn glass_fill(name: &str) -> Hsla {
    let role = role(name).unwrap_or(&ROLES[0]);
    color(name, role.adaptive())
}
