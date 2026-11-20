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

pub mod action_sheet;
pub mod alert;
pub mod button;
pub mod chip;
pub mod context_menu;
pub mod date_picker;
pub mod field;
pub mod glass;
pub mod icon;
pub mod icon_view;
pub mod indicator;
pub mod list;
pub mod navigation;
pub mod overlay;
pub mod picker;
pub mod refresh;
pub mod scroll;
pub mod scroll_edge;
pub mod segmented;
pub mod sheet;
pub mod slider;
pub mod swipe;
pub mod switch;
pub mod tab_bar;
pub mod theme;
pub mod theme_file;
pub mod tokens;

pub use action_sheet::{
    ActionSheet, ActionSheetElement, ActionSheetEvent, ActionSheetProps, SheetAction, action_sheet,
};
pub use alert::{
    AlertDialog, AlertDialogElement, AlertDialogEvent, AlertDialogProps, DialogAction, alert_dialog,
};
pub use button::{Button, ButtonElement, ButtonEvent, ButtonProps, button};
pub use chip::{FilterChip, FilterChipEvent, FilterChipProps, StatusPill, StatusPillProps};
pub use context_menu::{
    ContextAction, ContextMenu, ContextMenuElement, ContextMenuEvent, ContextMenuProps,
    context_menu,
};
pub use date_picker::{
    DatePicker, DatePickerElement, DatePickerEvent, DatePickerProps, date_picker,
};
pub use field::{
    SearchField, SearchFieldElement, SearchFieldEvent, SearchFieldProps, TextField,
    TextFieldElement, TextFieldEvent, TextFieldProps, search_field, text_field,
};
pub use glass::{
    Glass, GlassButton, GlassButtonElement, GlassButtonEvent, GlassButtonProps, GlassElement,
    GlassGroup, GlassGroupElement, GlassGroupProps, GlassProps, GlassQuality, GlassRect, GlassSpec,
    GlassVariant, glass, glass_button, glass_group, source as glass_source,
};
pub use icon::{NAMES as ICON_NAMES, icon, icon_stroke, svg_markup};
pub use icon_view::{Icon, IconProps};
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
pub use picker::{Picker, PickerElement, PickerEvent, PickerItem, PickerProps, picker};
pub use refresh::{
    RefreshView, RefreshViewElement, RefreshViewEvent, RefreshViewProps, refresh_view,
};
pub use scroll::{ScrollView, ScrollViewElement, ScrollViewProps, scroll_view};
pub use scroll_edge::{
    Edge as ScrollEdgePosition, ScrollEdge, ScrollEdgeElement, ScrollEdgeProps, ScrollEdgeSpec,
    scroll_edge,
};
pub use segmented::{
    SegmentItem, SegmentedControl, SegmentedControlElement, SegmentedControlEvent,
    SegmentedControlProps, segmented_control,
};
pub use sheet::{Sheet, SheetElement, SheetEvent, SheetProps, sheet};
pub use slider::{Slider, SliderElement, SliderEvent, SliderProps, slider};
pub use swipe::{SwipeAction, SwipeRow, SwipeRowElement, SwipeRowEvent, SwipeRowProps, swipe_row};
pub use switch::{Switch, SwitchElement, SwitchEvent, SwitchProps, switch};
pub use tab_bar::{
    GlassTabBar, GlassTabBarElement, GlassTabBarEvent, GlassTabBarProps, TabBar, TabBarElement,
    TabBarEvent, TabBarProps, TabItem, tab_bar,
};
pub use theme::{Theme, ThemeElement, ThemeProps, theme};
pub use tokens::TextStyle;

use nsh_core::prelude::*;

/// The crate's UI set: what TSX imports from `"cupertino"`.
#[native_module("cupertino")]
fn native(registry: &mut Registry) {
    registry
        .register::<Theme>()
        .register::<Icon>()
        .register::<NavigationBar>()
        .register::<NavPage>()
        .register::<List>()
        .register::<Section>()
        .register::<ListTile>()
        .register::<Button>()
        .register::<TextField>()
        .register::<SearchField>()
        .register::<Switch>()
        .register::<FilterChip>()
        .register::<StatusPill>()
        .register::<ActivityIndicator>()
        .register::<ScrollView>()
        .register::<Sheet>()
        .register::<ActionSheet>()
        .register::<AlertDialog>()
        .register::<ContextMenu>()
        .register::<Picker>()
        .register::<DatePicker>()
        .register::<SegmentedControl>()
        .register::<Slider>()
        .register::<TabBar>()
        .register::<SwipeRow>()
        .register::<RefreshView>()
        .register::<Glass>()
        .register::<GlassButton>()
        .register::<GlassGroup>()
        .register::<GlassTabBar>()
        .register::<ScrollEdge>();
}
