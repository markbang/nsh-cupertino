//! `GlassMenu`'s behaviour for keyboards and screen readers: the button says
//! it has a menu and whether it is open, the menu is a menu of menuitems, the
//! focus moves to the first item and back to the button, Escape and a chosen
//! item close it.

use std::time::{Duration, SystemTime};

use nsh_core::{Command, Size, element::Root, geometry::px, platform::Os, prelude::*, time::Clock};
use nsh_cupertino::{ContextAction, glass_menu, theme};
use nsh_engine::EngineConfig;
use nsh_testing::Headless;

#[component]
fn Page() -> impl IntoElement {
    let chosen = signal(String::from("none"));
    theme().child(
        view()
            .w_full()
            .h_full()
            .p(px(40.0))
            .gap(px(12.0))
            .child(
                glass_menu()
                    .label("Sort")
                    .actions(vec![
                        ContextAction::new("pin", "Pin").icon("pin"),
                        ContextAction::new("share", "Share"),
                        ContextAction::new("delete", "Delete").destructive(true),
                    ])
                    .on_action(move |id: &String| chosen.set(id.clone())),
            )
            .child(text(move || format!("chose {}", chosen.get()))),
    )
}

fn start(os: Os) -> Headless {
    let mut config = EngineConfig::new(Root::of::<Page>());
    config.viewport = Size::new(px(402.0), px(874.0));
    config.environment.os = os;
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_800_000_000));
    let mut app = Headless::start(config).expect("the page starts");
    app.wait_for("text:chose none").expect("the page shows");
    app
}

const BUTTON: &str = "role:button[Sort]";

fn open(app: &mut Headless) {
    app.press(BUTTON).expect("the button takes the press");
    app.run_for(Duration::from_millis(600)).unwrap();
}

fn expanded(app: &Headless) -> Option<bool> {
    app.screen()
        .accessibility_state(BUTTON)
        .expect("the button is on screen")
        .expanded
}

fn focused_on(app: &Headless, selector: &str) -> bool {
    let target = app
        .screen()
        .press_target(selector)
        .expect("the selector parses")
        .unwrap_or_else(|| panic!("{selector} is on screen"));
    app.screen()
        .commands()
        .iter()
        .rev()
        .find(|(_, command)| matches!(command, Command::Focus))
        .is_some_and(|(id, _)| *id == target)
}

#[test]
fn the_button_reports_a_menu_and_whether_it_is_open() {
    let mut app = start(Os::Ios);
    let state = app.screen().accessibility_state(BUTTON).unwrap();
    assert!(state.has_popup, "the button says it opens a menu");
    assert_eq!(state.expanded, Some(false));
    open(&mut app);
    assert_eq!(expanded(&app), Some(true));
}

#[test]
fn the_open_menu_is_a_menu_of_menuitems() {
    let mut app = start(Os::Ios);
    assert_eq!(app.screen().count("role:menu").unwrap(), 0);
    open(&mut app);
    assert_eq!(app.screen().count("role:menu").unwrap(), 1);
    for name in ["Pin", "Share", "Delete"] {
        assert_eq!(
            app.screen()
                .count(&format!("role:menuitem[{name}]"))
                .unwrap(),
            1,
            "{name} is a menuitem"
        );
    }
}

#[test]
fn opening_moves_the_focus_to_the_first_item() {
    let mut app = start(Os::MacOs);
    open(&mut app);
    assert!(
        focused_on(&app, "role:menuitem[Pin]"),
        "the last focus command went to the first item"
    );
}

#[test]
fn escape_closes_it_and_the_focus_goes_back_to_the_button() {
    let mut app = start(Os::MacOs);
    open(&mut app);
    app.press_key("escape").unwrap();
    app.run_for(Duration::from_millis(400)).unwrap();
    assert_eq!(
        app.screen().count("role:menu").unwrap(),
        0,
        "the menu is gone"
    );
    assert_eq!(expanded(&app), Some(false));
    assert!(
        focused_on(&app, BUTTON),
        "the focus went back to the button"
    );
}

#[test]
fn a_chosen_item_is_reported_and_closes_the_menu() {
    let mut app = start(Os::Ios);
    open(&mut app);
    app.press("role:menuitem[Share]").unwrap();
    app.run_for(Duration::from_millis(400)).unwrap();
    assert!(app.shows("chose share"));
    assert_eq!(app.screen().count("role:menu").unwrap(), 0);
    assert_eq!(expanded(&app), Some(false));
}

#[test]
fn the_menu_stays_until_its_close_has_run() {
    let mut app = start(Os::Ios);
    open(&mut app);
    let pressed = app.clock().now();
    // The step runs frames until the close's animations are done.
    app.press_key("escape").unwrap();
    let ran = app.clock().now() - pressed;
    assert!(ran < Duration::from_millis(150), "{ran:?}");
    assert_eq!(
        app.screen().count("role:menu").unwrap(),
        1,
        "still there {ran:?} into the close"
    );
    app.run_for(Duration::from_millis(100)).unwrap();
    assert_eq!(app.screen().count("role:menu").unwrap(), 0);
}
