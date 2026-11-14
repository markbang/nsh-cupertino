//! A Cupertino (iOS) design system for [Native Shell](https://nsh.dev) apps:
//! semantic tokens and components that look and behave like iOS's.
//!
//! - [`tokens`] is the source of truth: Apple's semantic colors with light,
//!   dark and high-contrast values, the type scale, spacing, radii, hairline
//!   and motion.
//! - `theme/theme.json` is generated from them and is what an app's `nsh.json`
//!   `"theme"` points at, so TSX classes and `token()` read the same values.
//! - [`Theme`] wraps the app: it installs the tokens and swaps in the
//!   high-contrast values when the app asks for them.
//! - The components take variants, sizes and states, never colors: see the
//!   README's list.
//!
//! ```ignore
//! use nsh_core::prelude::*;
//! use nsh_cupertino::{NavPage, Section, ListTile, nav_page, section, list_tile};
//!
//! nav_page().title("Settings").large_title("Settings").child(
//!     section().header("Account").child(
//!         list_tile().title("Name").accessory("chevron"),
//!     ),
//! )
//! ```

pub mod button;
pub mod field;
pub mod icon;
pub mod indicator;
pub mod list;
pub mod navigation;
pub mod scroll;
pub mod switch;
pub mod theme;
pub mod theme_file;
pub mod tokens;

pub use button::{Button, ButtonElement, ButtonEvent, ButtonProps, button};
pub use field::{
    SearchField, SearchFieldElement, SearchFieldEvent, SearchFieldProps, TextField,
    TextFieldElement, TextFieldEvent, TextFieldProps, search_field, text_field,
};
pub use icon::{NAMES as ICON_NAMES, icon, icon_stroke, svg_markup};
pub use indicator::{
    ActivityIndicator, ActivityIndicatorElement, ActivityIndicatorProps, activity_indicator,
};
pub use list::{
    List, ListElement, ListProps, ListTile, ListTileElement, ListTileEvent, ListTileProps, Section,
    SectionElement, SectionProps, list, list_tile, section,
};
pub use navigation::{
    NavPage, NavPageElement, NavPageEvent, NavPageProps, NavigationBar, NavigationBarElement,
    NavigationBarEvent, NavigationBarProps, nav_page, navigation_bar,
};
pub use scroll::{ScrollView, ScrollViewElement, ScrollViewProps, scroll_view};
pub use switch::{Switch, SwitchElement, SwitchEvent, SwitchProps, switch};
pub use theme::{Theme, ThemeElement, ThemeProps, theme};
pub use tokens::TextStyle;

use nsh_core::prelude::*;

/// The crate's UI set: what TSX imports from `"cupertino"`.
#[native_module("cupertino")]
fn native(registry: &mut Registry) {
    registry
        .register::<Theme>()
        .register::<NavigationBar>()
        .register::<NavPage>()
        .register::<List>()
        .register::<Section>()
        .register::<ListTile>()
        .register::<Button>()
        .register::<TextField>()
        .register::<SearchField>()
        .register::<Switch>()
        .register::<ActivityIndicator>()
        .register::<ScrollView>();
}
