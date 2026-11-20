//! The demo's Rust half: a tile in the gallery (`DemoTile`) and the press
//! counter the gallery shows (`Count`). Everything visual comes from
//! `nsh-cupertino`, imported from `"cupertino"`.

mod mascot;

pub use mascot::{Mascot, MascotProps};

use nsh_core::prelude::*;
use nsh_cupertino::list_tile;

/// The crate's UI set: what `App.tsx` imports from `"cupertino-demo/native"`.
#[native_module("cupertino-demo/native")]
fn native(registry: &mut Registry) {
    registry
        .register::<DemoTile>()
        .register::<Mascot>()
        .class::<Count>();
}

/// The props of [`DemoTile`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct DemoTileProps {
    /// The page's id, reported with `onPress`.
    pub page: Prop<SharedString>,
    /// The row's title.
    pub title: Prop<SharedString>,
    /// A line under the title.
    pub blurb: Prop<Option<SharedString>>,
    /// The leading icon's name.
    pub icon: Prop<Option<SharedString>>,
    /// The token the icon is drawn in.
    pub tint: Prop<Option<SharedString>>,
    /// The last row of its group draws no hairline.
    pub last: Prop<Option<bool>>,
}

/// The events of a [`DemoTile`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum DemoTileEvent {
    /// The tile was pressed: the page it opens.
    Open(String),
}

/// A gallery row: a Cupertino `ListTile` with a chevron, reported by page id.
#[component]
pub fn DemoTile(props: DemoTileProps, cx: Scope<DemoTileEvent>) -> impl IntoElement {
    let page = props.page.clone();
    list_tile()
        .title(props.title.get_untracked())
        .subtitle(props.blurb.get_untracked())
        .leading(props.icon.get_untracked())
        .leading_color(props.tint.get_untracked())
        .accessory("chevron")
        .separator(!props.last.get_untracked().unwrap_or(false))
        .on_press(move || cx.emit(DemoTileEvent::Open(page.get_untracked().to_string())))
}

/// Presses counted in Rust, shown by the gallery.
#[class]
pub struct Count {
    presses: u32,
}

#[class]
impl Count {
    /// A count at zero.
    pub fn new() -> Self {
        Count { presses: 0 }
    }

    /// Adds one and returns the total.
    pub fn add(&mut self) -> u32 {
        self.presses += 1;
        self.presses
    }

    /// The total.
    #[getter]
    pub fn presses(&self) -> u32 {
        self.presses
    }
}
