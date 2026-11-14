//! A Cupertino (iOS) design system for [Native Shell](https://nsh.dev) apps:
//! semantic tokens and components that look and behave like iOS's.
//!
//! [`tokens`] is the source of truth (Apple's semantic colors with light, dark
//! and high-contrast values, the type scale, spacing, radii, hairline and
//! motion); `theme/theme.json` is generated from it; [`Theme`] installs the
//! tokens and follows the appearance and a contrast setting.

pub mod theme;
pub mod theme_file;
pub mod tokens;

pub use theme::{Theme, ThemeElement, ThemeProps, theme};
pub use tokens::TextStyle;

use nsh_core::prelude::*;

/// The crate's UI set: what TSX imports from `"cupertino"`.
#[native_module("cupertino")]
fn native(registry: &mut Registry) {
    registry.register::<Theme>();
}
