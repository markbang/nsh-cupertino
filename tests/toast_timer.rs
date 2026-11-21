//! A toast's time: 3.2 s for a neutral toast and 5 s for a danger one (Cohub
//! Mobile's `toast-queue.ts`), none for a sticky one; a finger on the card
//! pauses it, and release resumes it with the time left, at least 1.5 s.

use std::time::{Duration, SystemTime};

use nsh_core::{Size, element::Root, geometry::px, prelude::*, time::Clock};
use nsh_cupertino::{theme, toast, toast_layer};
use nsh_engine::EngineConfig;
use nsh_testing::Headless;

/// The app takes the toast out of its layer when it leaves, as it would.
fn page(card: fn(Signal<bool>) -> AnyElement) -> impl IntoElement {
    let shown = signal(true);
    theme().child(view().w_full().h_full().justify_end().child(when(
        move || shown.get(),
        move || toast_layer().child(card(shown)),
    )))
}

#[component]
fn Neutral() -> impl IntoElement {
    page(|shown| {
        toast()
            .title("Saved")
            .on_expire(move || shown.set(false))
            .into_element()
    })
}

#[component]
fn Danger() -> impl IntoElement {
    page(|shown| {
        toast()
            .title("Saved")
            .tone("danger")
            .on_expire(move || shown.set(false))
            .into_element()
    })
}

#[component]
fn Sticky() -> impl IntoElement {
    page(|shown| {
        toast()
            .title("Saved")
            .sticky(true)
            .on_expire(move || shown.set(false))
            .into_element()
    })
}

fn start<T: Component>() -> Headless
where
    T::Props: Default,
{
    start_showing::<T>("Saved")
}

fn start_showing<T: Component>(text: &str) -> Headless
where
    T::Props: Default,
{
    let mut config = EngineConfig::new(Root::of::<T>());
    config.viewport = Size::new(px(390.0), px(844.0));
    config.clock = Clock::manual(SystemTime::UNIX_EPOCH + Duration::from_secs(1_800_000_000));
    let mut app = Headless::start(config).expect("the page starts");
    app.wait_for(&format!("text:{text}"))
        .expect("the toast shows");
    app
}

fn ms(n: u64) -> Duration {
    Duration::from_millis(n)
}

#[test]
fn neutral_toast_leaves_after_3_2_seconds() {
    let mut app = start::<Neutral>();
    app.run_for(ms(3000)).unwrap();
    assert!(app.shows("Saved"), "still shown at 3.0 s");
    app.run_for(ms(1000)).unwrap();
    assert!(!app.shows("Saved"), "gone after 3.2 s and its fade");
}

#[test]
fn danger_toast_stays_five_seconds() {
    let mut app = start::<Danger>();
    app.run_for(ms(4500)).unwrap();
    assert!(app.shows("Saved"), "still shown at 4.5 s");
    app.run_for(ms(1000)).unwrap();
    assert!(!app.shows("Saved"), "gone after 5 s and its fade");
}

#[test]
fn sticky_toast_has_no_timer() {
    let mut app = start::<Sticky>();
    app.run_for(ms(30_000)).unwrap();
    assert!(app.shows("Saved"), "a sticky toast stays");
}

#[test]
fn holding_the_card_pauses_and_release_resumes_with_the_time_left() {
    let mut app = start::<Neutral>();
    app.run_for(ms(1000)).unwrap();
    app.drag_and_hold("text:Saved", Point::new(px(0.0), px(0.0)))
        .unwrap();
    app.run_for(ms(10_000)).unwrap();
    assert!(app.shows("Saved"), "a held toast does not leave");
    app.drop_held().unwrap();
    app.run_for(ms(1500)).unwrap();
    assert!(app.shows("Saved"), "released with 2.2 s left: still shown");
    app.run_for(ms(2000)).unwrap();
    assert!(!app.shows("Saved"), "then it leaves, not restarted");
}

#[test]
fn a_swipe_in_progress_pauses_the_time() {
    let mut app = start::<Neutral>();
    app.drag_and_hold("text:Saved", Point::new(px(-30.0), px(0.0)))
        .unwrap();
    app.run_for(ms(10_000)).unwrap();
    assert!(app.shows("Saved"), "a toast under a finger does not leave");
    app.drop_held().unwrap();
}

#[test]
fn release_gives_at_least_one_and_a_half_seconds() {
    let mut app = start::<Neutral>();
    app.run_for(ms(2800)).unwrap();
    app.drag_and_hold("text:Saved", Point::new(px(0.0), px(0.0)))
        .unwrap();
    app.run_for(ms(1000)).unwrap();
    app.drop_held().unwrap();
    app.run_for(ms(1000)).unwrap();
    assert!(
        app.shows("Saved"),
        "released with 0.4 s left: 1.5 s, not 0.4"
    );
    app.run_for(ms(800)).unwrap();
    assert!(!app.shows("Saved"), "then it leaves");
}

/// Two toasts in one layer: the back one is `Behind`, the front one `Front`.
fn two_toasts() -> impl IntoElement {
    let behind = signal(true);
    let front = signal(true);
    theme().child(view().w_full().h_full().justify_end().child(when(
        move || behind.get() || front.get(),
        move || {
            toast_layer()
                .child(when(
                    move || behind.get(),
                    move || {
                        toast()
                            .title("Behind")
                            .depth(1.0)
                            .on_expire(move || behind.set(false))
                    },
                ))
                .child(when(
                    move || front.get(),
                    move || toast().title("Front").on_expire(move || front.set(false)),
                ))
        },
    )))
}

#[component]
fn Stack() -> impl IntoElement {
    two_toasts()
}

#[test]
fn holding_the_front_card_pauses_the_toast_behind_it() {
    let mut app = start_showing::<Stack>("Front");
    app.run_for(ms(1000)).unwrap();
    app.drag_and_hold("text:Front", Point::new(px(0.0), px(0.0)))
        .unwrap();
    app.run_for(ms(10_000)).unwrap();
    assert!(
        app.shows("Behind"),
        "the back toast keeps its time while the front is held"
    );
    app.drop_held().unwrap();
    app.run_for(ms(1500)).unwrap();
    assert!(app.shows("Behind"), "released with 2.2 s left: still shown");
    app.run_for(ms(1000)).unwrap();
    assert!(
        !app.shows("Behind"),
        "then it leaves, with the time it had left"
    );
}
