//! [`GlassMenu`]: a glass button whose shape grows into the menu it opens,
//! as iOS 26's pull-down menus do.
//!
//! The motion is fitted to the iOS reference clip
//! `research/ios-reference/motion/motion-menu.mp4` (`tools/fit-glass-menu.py`):
//! the shape's size and horizontal place on one spring, a separate drop that
//! carries it down and back, corners that stay round until late, the items
//! fading in once the blob has become a panel and cut by its shape, the
//! menu's measured fill as the body from the first frame with the glass only
//! at its rim, and a close that holds, then shrinks to 0.94 and fades as one
//! layer.

use std::time::Duration;

use nsh_base::{PopoverEvent, popover};
use nsh_core::{
    AccessibilityRole, TransformKind,
    animation::{Driver, sample_driver},
    element::{AnimatedNode, ElementRef, Timing, reduce_motion},
    prelude::*,
};

use crate::{
    context_menu::{MENU_BLUR, menu_fill},
    glass::{self, GlassSpec, GlassVariant, Press},
    icon::icon,
    tokens::{self, type_default},
};

/// The open panel's corner radius, in points (the iOS reference, ±3 pt).
pub(crate) const RADIUS: f32 = 28.0;

/// Room around the panel for the glass to overshoot into and its shadow to
/// fall in, in points (the shadow: 9 pt down, σ 18 pt).
const PAD: f32 = 48.0;

/// The panel's top sits this far up from the button's bottom: on the
/// button's centre line, where the iOS menu opens (a 44 pt button).
const OVERLAP: f32 = 22.0;

/// The timing of the morph, all fitted to the iOS clip; times in ms from the
/// press.
pub(crate) mod motion {
    use nsh_core::element::{Easing, Spring, Timing};

    use crate::overlay::spring;

    /// The shape's width, height and horizontal centre: ζ 0.76, k 380.
    pub(crate) fn shape() -> Spring {
        spring(0.76, 380.0)
    }

    /// The drop, in points: `DROP_PT` × (fast − slow), two critically damped
    /// springs released together. Their gap is a bump: 69 pt at about
    /// 100 ms, under 1 pt after 500 ms.
    pub(crate) const DROP_PT: f32 = 380.0;

    /// The drop's fast and slow springs.
    pub(crate) fn drop() -> [Spring; 2] {
        [spring(1.0, 540.0), spring(1.0, 270.0)]
    }

    /// The corners: a capsule's until 180 ms, the panel's 28 pt by 410 ms.
    pub(crate) fn corners() -> Timing {
        Timing {
            delay_ms: 180.0,
            ..Timing::new(230.0, Easing::EaseInOut)
        }
    }

    /// The blob phase: no item shows before this, in ms from the press (the
    /// clip has none at 107 ms and its items in at 274).
    pub(crate) const BLOB_MS: f32 = 170.0;

    /// The items fade in after the blob phase, in by 260 ms.
    pub(crate) fn items() -> Timing {
        Timing {
            delay_ms: BLOB_MS,
            ..Timing::new(90.0, Easing::EaseOut)
        }
    }

    /// The body's share of the menu's fill from the first frame: the clip's
    /// blob at 107 ms is white at α 0.27 over the bars (per bar 0.24-0.30),
    /// 0.45 of the settled 0.60.
    pub(crate) const BODY_FROM: f32 = 0.45;

    /// The body reaches the whole fill by the clip's frame 5 (274 ms: α 0.57,
    /// per bar 0.55-0.63).
    pub(crate) fn body() -> Timing {
        Timing {
            delay_ms: 110.0,
            ..Timing::new(160.0, Easing::EaseInOut)
        }
    }

    /// A part of the open menu a close moves.
    #[derive(Debug, Clone, Copy, PartialEq)]
    #[cfg_attr(
        not(test),
        expect(
            dead_code,
            reason = "the close moves neither alone; the tests pin that"
        )
    )]
    pub(crate) enum Part {
        /// The whole menu's opacity: its fill, rim, shadow and items as one
        /// layer.
        Menu,
        /// The body's share of the fill.
        Body,
        /// The items' opacity.
        Items,
        /// The shrink to `CLOSE_SCALE`, 0 to 1.
        Shrink,
    }

    impl Part {
        /// Its value in the open menu.
        pub(crate) fn open(self) -> f32 {
            if self == Part::Shrink { 0.0 } else { 1.0 }
        }
    }

    /// The close: what it moves, to what, and how, from the open menu (all
    /// at 1, the shrink at 0). Only the menu's opacity fades: the fill never
    /// drops out under the items, so the page never shows through the menu
    /// while its items still do.
    pub(crate) fn close() -> [(Part, f32, Timing); 2] {
        [
            (Part::Menu, 0.0, close_fade()),
            (Part::Shrink, 1.0, close_shrink()),
        ]
    }

    /// The close: it holds for 70 ms, then fades over 60 ms.
    pub(crate) fn close_fade() -> Timing {
        Timing {
            delay_ms: 70.0,
            ..Timing::new(60.0, Easing::EaseIn)
        }
    }

    /// The close's shrink to `CLOSE_SCALE`, with its shift, after the same
    /// hold.
    pub(crate) fn close_shrink() -> Timing {
        Timing {
            delay_ms: 70.0,
            ..Timing::new(30.0, Easing::EaseOut)
        }
    }

    /// The scale the close shrinks to.
    pub(crate) const CLOSE_SCALE: f32 = 0.94;
    /// How far the close moves it down and across, in points.
    pub(crate) const CLOSE_SHIFT: [f32; 2] = [-5.0, 17.0];
    /// The whole close, in ms: then the menu is gone.
    pub(crate) const CLOSE_MS: f32 = 130.0;

    /// The menu's shadow, fitted to the clip's frame 12 below, beside and
    /// above the panel over the page (`tools/fit-glass-menu.py`): black at
    /// this alpha, offset down and blurred by these points (CSS blur, twice
    /// the Gaussian's σ of 18 pt).
    pub(crate) const SHADOW: (f32, f32, f32) = (0.115, 9.0, 36.0);

    /// Reduce Motion: a cross-fade of this long, in and out.
    pub(crate) fn fade() -> Timing {
        Timing::new(150.0, Easing::EaseOut)
    }
}

/// The value a driver moves `from` to, `ms` after it starts: the curve the
/// platform runs ([`sample_driver`]).
pub(crate) fn value_at(driver: Driver, from: f32, ms: f32) -> f32 {
    if ms <= 0.0 {
        return from;
    }
    let samples = sample_driver(driver, from, f64::from(ms) / 1000.0, 2);
    samples.last().copied().unwrap_or(from)
}

pub(crate) fn spring_driver(spring: Spring, to: f32) -> Driver {
    Driver::Spring {
        to,
        stiffness: spring.stiffness,
        damping: spring.damping,
        mass: spring.mass,
        velocity: spring.velocity,
        frame_rate: spring.frame_rate,
    }
}

pub(crate) fn timing_driver(timing: Timing, to: f32) -> Driver {
    Driver::Timing {
        to,
        duration_ms: timing.duration_ms,
        easing: timing.easing,
        delay_ms: timing.delay_ms,
        frame_rate: timing.frame_rate,
    }
}

/// One item of a [`GlassMenu`].
#[derive(Debug, Clone, Default, PartialEq, JsObject)]
pub struct GlassMenuAction {
    /// Reported with `onAction` when it is chosen.
    pub id: SharedString,
    /// What the row says.
    pub title: SharedString,
    /// An icon before the title, by name ([`crate::icon::NAMES`]).
    #[prop(skip_none)]
    pub icon: Option<SharedString>,
    /// A second, smaller line under the title.
    #[prop(skip_none)]
    pub detail: Option<SharedString>,
    /// Starts a new group with this header above the item; `""` starts one
    /// without a header.
    #[prop(skip_none)]
    pub section: Option<SharedString>,
    /// Red text: it destroys something.
    #[prop(default)]
    pub destructive: bool,
    /// Dimmed and not choosable.
    #[prop(default)]
    pub disabled: bool,
}

impl GlassMenuAction {
    /// An item of `id`, titled `title`.
    pub fn new(id: impl Into<SharedString>, title: impl Into<SharedString>) -> Self {
        Self {
            id: id.into(),
            title: title.into(),
            ..Self::default()
        }
    }

    /// An icon before its title.
    pub fn icon(mut self, icon: impl Into<SharedString>) -> Self {
        self.icon = Some(icon.into());
        self
    }

    /// A second line under its title.
    pub fn detail(mut self, detail: impl Into<SharedString>) -> Self {
        self.detail = Some(detail.into());
        self
    }

    /// Starts a group, under `header` (`""`: no header).
    pub fn section(mut self, header: impl Into<SharedString>) -> Self {
        self.section = Some(header.into());
        self
    }

    /// Red: it destroys something.
    pub fn destructive(mut self, destructive: bool) -> Self {
        self.destructive = destructive;
        self
    }

    /// Dimmed and not choosable.
    pub fn disabled(mut self, disabled: bool) -> Self {
        self.disabled = disabled;
        self
    }
}

/// The props of [`GlassMenu`].
#[derive(Debug, Clone, PartialEq, Props)]
pub struct GlassMenuProps {
    /// The button's icon, by name ([`crate::icon::NAMES`]); `ellipsis`
    /// unless set.
    pub icon: Prop<Option<SharedString>>,
    /// What screen readers call the button (`More` unless set).
    pub label: Prop<Option<SharedString>>,
    /// Its items; an item with a `section` starts a new group.
    #[prop(default)]
    pub actions: Prop<Vec<GlassMenuAction>>,
    /// `"start"` (the default) lines the menu up with the button's leading
    /// edge, `"end"` with its trailing one.
    pub align: Prop<Option<SharedString>>,
    /// Open (controlled): the app owns it and follows `onOpenChange`.
    pub open: Prop<Option<bool>>,
    /// Holds the opening still this many milliseconds after the press, for
    /// frame-by-frame comparisons; not for apps.
    #[doc(hidden)]
    pub frame_ms: Prop<Option<f32>>,
    /// Holds it open, this many milliseconds into its close; not for apps.
    #[doc(hidden)]
    pub close_frame_ms: Prop<Option<f32>>,
}

/// The events of a [`GlassMenu`].
#[derive(Debug, Clone, PartialEq, Event)]
pub enum GlassMenuEvent {
    /// It asks to open or close: set `open` to follow.
    #[args(open)]
    OpenChange(bool),
    /// The item with this `id` was chosen.
    #[args(id)]
    Action(String),
}

/// The animated values of one menu.
#[derive(Clone, Copy)]
struct Morph {
    /// The shape, 0 (the button) to 1 (the panel).
    grow: AnimatedValue,
    /// The drop's springs.
    fast: AnimatedValue,
    slow: AnimatedValue,
    /// 1: a capsule's corners, 0: the panel's.
    round: AnimatedValue,
    /// The items' opacity.
    items: AnimatedValue,
    /// The body's share of the menu's fill.
    body: AnimatedValue,
    /// The whole menu's opacity.
    fade: AnimatedValue,
    /// The close, 0 to 1.
    shrink: AnimatedValue,
    /// The button's centre from the panel's, and its size over the panel's
    /// less one, set at each opening: what the items and the fallback move
    /// and scale by.
    dx: AnimatedValue,
    dy: AnimatedValue,
    sx: AnimatedValue,
    sy: AnimatedValue,
    /// The button: hidden while its shape is the menu's.
    button: AnimatedValue,
}

impl Morph {
    fn new() -> Self {
        Self {
            grow: animated_value(0.0),
            fast: animated_value(0.0),
            slow: animated_value(0.0),
            round: animated_value(1.0),
            items: animated_value(0.0),
            body: animated_value(motion::BODY_FROM),
            fade: animated_value(0.0),
            shrink: animated_value(0.0),
            dx: animated_value(0.0),
            dy: animated_value(0.0),
            sx: animated_value(0.0),
            sy: animated_value(0.0),
            button: animated_value(1.0),
        }
    }

    /// 1 − grow: how far the shape still is from the panel.
    fn left(&self) -> AnimatedNode {
        self.grow.mul(-1.0).add(1.0)
    }

    /// The items' and the fallback's place and scale on the shape now.
    fn follow_x(&self) -> AnimatedNode {
        self.left().mul(&self.dx)
    }

    fn follow_y(&self) -> AnimatedNode {
        self.left().mul(&self.dy)
    }

    fn scale_x(&self) -> AnimatedNode {
        self.left().mul(&self.sx).add(1.0)
    }

    fn scale_y(&self) -> AnimatedNode {
        self.left().mul(&self.sy).add(1.0)
    }

    fn part(&self, part: motion::Part) -> AnimatedValue {
        match part {
            motion::Part::Menu => self.fade,
            motion::Part::Body => self.body,
            motion::Part::Items => self.items,
            motion::Part::Shrink => self.shrink,
        }
    }

    /// The panel's own move: the drop while it opens, the shift while it
    /// closes.
    fn shift_x(&self) -> AnimatedNode {
        self.shrink.mul(motion::CLOSE_SHIFT[0])
    }

    fn shift_y(&self) -> AnimatedNode {
        self.fast
            .sub(&self.slow)
            .mul(motion::DROP_PT)
            .add(&self.shrink.mul(motion::CLOSE_SHIFT[1]))
    }

    fn scale(&self) -> AnimatedNode {
        self.shrink
            .interpolate(&[0.0, 1.0], &[1.0, motion::CLOSE_SCALE])
    }

    /// The opening, from the button to the panel; held at `frame` ms when
    /// given, or open and `close` ms into its close.
    fn open(&self, frame: Option<f32>, close: Option<f32>) {
        if let Some(ms) = close {
            self.open(Some(10_000.0), None);
            for (part, to, timing) in motion::close() {
                self.part(part)
                    .set(value_at(timing_driver(timing, to), part.open(), ms));
            }
            return;
        }
        self.shrink.set(0.0);
        self.button.set(0.0);
        if reduce_motion() {
            self.grow.set(1.0);
            self.round.set(0.0);
            self.items.set(1.0);
            self.body.set(1.0);
            self.fast.set(0.0);
            self.slow.set(0.0);
            self.fade.set(0.0);
            let _ = self.fade.timing_with(1.0, motion::fade());
            return;
        }
        self.fade.set(1.0);
        let [fast, slow] = motion::drop();
        let moves = [
            (self.grow, 0.0, 1.0, Move::Spring(motion::shape())),
            (self.fast, 0.0, 1.0, Move::Spring(fast)),
            (self.slow, 0.0, 1.0, Move::Spring(slow)),
            (self.round, 1.0, 0.0, Move::Timing(motion::corners())),
            (self.items, 0.0, 1.0, Move::Timing(motion::items())),
            (
                self.body,
                motion::BODY_FROM,
                1.0,
                Move::Timing(motion::body()),
            ),
        ];
        for (value, from, to, how) in moves {
            match (frame, how) {
                (Some(ms), how) => value.set(value_at(how.driver(to), from, ms)),
                (None, Move::Spring(spring)) => {
                    value.set(from);
                    let _ = value.spring(to, spring);
                }
                (None, Move::Timing(timing)) => {
                    value.set(from);
                    let _ = value.timing_with(to, timing);
                }
            }
        }
    }

    /// The close: hold, shrink and fade (a fade alone with Reduce Motion).
    fn close(&self) {
        if reduce_motion() {
            let _ = self.fade.timing_with(0.0, motion::fade());
            return;
        }
        for (part, to, timing) in motion::close() {
            let _ = self.part(part).timing_with(to, timing);
        }
    }

    /// Gone: the button shows its glass again.
    fn closed(&self) {
        self.fade.set(0.0);
        if reduce_motion() {
            self.button.set(1.0);
        } else {
            let _ = self.button.timing_with(1.0, motion::fade());
        }
    }
}

/// How a value of the morph moves.
#[derive(Clone, Copy)]
enum Move {
    Spring(Spring),
    Timing(Timing),
}

impl Move {
    fn driver(self, to: f32) -> Driver {
        match self {
            Move::Spring(spring) => spring_driver(spring, to),
            Move::Timing(timing) => timing_driver(timing, to),
        }
    }
}

/// A glass button that opens a menu out of its own shape, anchored to it on
/// phones and desktops alike.
///
/// A press opens it: the button's glass grows into the panel, with 28 pt
/// corners, and the items fade in after the shape. A press outside, Escape,
/// the Android back button or a chosen item close it: it holds a moment,
/// then shrinks to 0.94 and fades. The keyboard focus moves to the first
/// item when it opens and back to the button when it closes (desktops);
/// screen readers hear a menu of menuitems and the button's expanded state.
/// Reduce Motion cross-fades it.
#[component]
pub fn GlassMenu(props: GlassMenuProps, cx: Scope<GlassMenuEvent>) -> impl IntoElement {
    let own = signal(false);
    let controlled = props.open;
    let wanted = computed(move || controlled.get().unwrap_or_else(|| own.get()));
    let request = move |next: bool| {
        if controlled.get_untracked().is_none() {
            own.set(next);
        }
        cx.emit(GlassMenuEvent::OpenChange(next));
    };

    let morph = Morph::new();
    let frame = props.frame_ms;
    let close_frame = props.close_frame_ms;
    // The popover is up from the press until the close has run.
    let mounted = signal(false);
    let closing = signal(false);
    let started = stored(false);
    // Each close is one generation: a reopening cancels the one before.
    let generation = stored(0_u32);
    let from = signal([0.0_f32, 0.0, 44.0, 44.0]);
    let to = signal([0.0_f32; 4]);
    let button_ref = element_ref();
    let first_item = element_ref();

    effect(move || {
        let wanted = wanted.get();
        untracked(|| {
            if wanted {
                generation.replace(generation.get() + 1);
                if closing.get() {
                    // Opened again while it went: back as it is now.
                    closing.set(false);
                    morph.shrink.set(0.0);
                    morph.fade.set(1.0);
                } else if !mounted.get() {
                    started.replace(false);
                    mounted.set(true);
                }
            } else if mounted.get() && !closing.get() {
                closing.set(true);
                morph.close();
                let this = generation.get();
                set_timeout(
                    Duration::from_millis(motion::CLOSE_MS as u64 + 20),
                    move || {
                        if generation.get() == this && closing.get_untracked() {
                            closing.set(false);
                            mounted.set(false);
                            morph.closed();
                        }
                    },
                );
            }
        });
    });

    // The panel is placed: measure the button and start from its shape.
    let placed = move |bounds: Bounds<Points>| {
        if started.get() {
            return;
        }
        started.replace(true);
        let size = bounds.size;
        spawn(async move {
            let Some(button) = button_ref.measure().await else {
                morph.open(frame.get_untracked(), close_frame.get_untracked());
                return;
            };
            let (w, h) = (size.width.0.max(1.0), size.height.0.max(1.0));
            let (bw, bh) = (
                button.frame.size.width.0.max(1.0),
                button.frame.size.height.0.max(1.0),
            );
            let x = button.page.x.0 - bounds.origin.x.0;
            let y = button.page.y.0 - bounds.origin.y.0;
            from.set([x + PAD, y + PAD, bw, bh]);
            to.set([PAD, PAD, w, h]);
            morph.dx.set(x + bw / 2.0 - w / 2.0);
            morph.dy.set(y + bh / 2.0 - h / 2.0);
            morph.sx.set(bw / w - 1.0);
            morph.sy.set(bh / h - 1.0);
            morph.open(frame.get_untracked(), close_frame.get_untracked());
        });
    };

    let label = props
        .label
        .get_untracked()
        .unwrap_or_else(|| SharedString::from("More"));
    let icon_name = props
        .icon
        .get_untracked()
        .unwrap_or_else(|| SharedString::from("ellipsis"));
    let press = Press::new();
    let (held, released) = (press, press);
    let trigger = nsh_base::button()
        .relative()
        .w(px(44.0))
        .h(px(44.0))
        .rounded_full()
        .items_center()
        .justify_center()
        .accessibility_label(label)
        .role(AccessibilityRole::Button)
        .bind_scale(&press.scale())
        .on_press_down(move || held.down())
        .on_press_up(move || released.up())
        .child(
            view()
                .absolute()
                .inset_0()
                .bind_opacity(&morph.button)
                .child(glass::layer(
                    GlassSpec::capsule().variant(GlassVariant::Interactive),
                    Some(press),
                )),
        )
        .child(
            view()
                .element_ref(&button_ref)
                .absolute()
                .inset_0()
                .items_center()
                .justify_center()
                .pointer_events(PointerEvents::None)
                .bind_opacity(&morph.button)
                .child(icon(&icon_name, 20.0).text_color(tokens::label())),
        );

    let actions = props.actions;
    let align = match props.align.get_untracked().as_deref() {
        Some("end") => Align::End,
        _ => Align::Start,
    };

    popover()
        .open(move || Some(mounted.get()))
        .placement(Placement::Bottom)
        .align(align)
        .offset(px(-OVERLAP))
        .margin(px(16.0))
        .on_open_change(move |event: &PopoverEvent| {
            if let PopoverEvent::OpenChange(next, _) = event {
                request(*next);
            }
        })
        .on_open(move || first_item.focus())
        .on_position(move |event: &PopoverEvent| {
            if let PopoverEvent::Position(_, bounds, _) = event {
                placed(*bounds);
            }
        })
        .trigger(trigger)
        .children([panel(
            morph,
            from,
            to,
            first_item,
            actions.get_untracked(),
            closing,
            move |id: SharedString| {
                cx.emit(GlassMenuEvent::Action(id.to_string()));
                request(false);
            },
        )])
}

/// The menu's fill and shadow without the shader: the measured fill of the
/// iOS menu (`ContextMenu`'s, re-checked on the clip), its blur and the
/// clip's shadow, scaled from the button's box.
fn fallback_fill(morph: Morph) -> View {
    let (alpha, offset, blur) = motion::SHADOW;
    view()
        .absolute()
        .inset_0()
        .rounded(px(RADIUS))
        .bg(move || menu_fill(nsh_core::element::dark()))
        .backdrop_blur(px(MENU_BLUR))
        .shadow([nsh_core::BoxShadow {
            offset_y: px(offset),
            blur: px(blur),
            color: Hsla::black().opacity(alpha).into(),
            ..nsh_core::BoxShadow::default()
        }])
        .bind_translate_x(&morph.follow_x())
        .bind_translate_y(&morph.follow_y())
        .bind_transform(TransformKind::ScaleX, &morph.scale_x())
        .bind_transform(TransformKind::ScaleY, &morph.scale_y())
}

/// The rows' colour: red for a destructive item.
fn row_color(destructive: bool) -> Hsla {
    if destructive {
        tokens::system_red()
    } else {
        tokens::label()
    }
}

/// The open menu: its body, the menu's fill with glass at the rim, growing
/// out of the button's shape, and its items, cut by the growing shape.
fn panel(
    morph: Morph,
    from: Signal<[f32; 4]>,
    to: Signal<[f32; 4]>,
    first_item: ElementRef,
    actions: Vec<GlassMenuAction>,
    closing: Signal<bool>,
    chosen: impl Fn(SharedString) + Clone + 'static,
) -> AnyElement {
    let shader = glass::shader_draws();
    let (alpha, offset, blur) = motion::SHADOW;
    // A disc of 24 pt blurs as a Gaussian of σ 11 pt: the menu's blur.
    let spec = GlassSpec::rounded(RADIUS)
        .blur(tokens::glass::BAR_BLUR)
        .soft_shadow(PAD, alpha, offset, blur / 2.0)
        .menu_body(
            [menu_fill(false), menu_fill(true)],
            morph.body.animated_node(),
        )
        .grow(
            from,
            to,
            RADIUS,
            morph.grow.animated_node(),
            morph.round.animated_node(),
        );
    // With the shader, one layer draws the growing shape, its fill, rim and
    // shadow, in a box with room around the panel. Without it, the fill is
    // all there is, scaled from the button's box: its corners scale with it.
    let material = if shader {
        view()
            .absolute()
            .top(px(-PAD))
            .left(px(-PAD))
            .right(px(-PAD))
            .bottom(px(-PAD))
            .child(glass::layer(spec, None))
    } else {
        fallback_fill(morph)
    };

    let mut items = view()
        .px(px(6.0))
        .py(px(10.0))
        .w(px(250.0))
        .bind_opacity(&morph.items)
        .bind_translate_x(&morph.follow_x())
        .bind_translate_y(&morph.follow_y())
        .bind_scale(&morph.scale_x());
    let mut focus_set = false;
    for (index, action) in actions.into_iter().enumerate() {
        if let Some(header) = action.section.clone() {
            if index > 0 {
                items = items.child(
                    view()
                        .h(tokens::separator_thickness)
                        .my(px(8.5))
                        .mx(px(14.0))
                        .bg(tokens::separator),
                );
            }
            if !header.is_empty() {
                items = items.child(
                    view()
                        .h(px(32.0))
                        .pb(px(6.0))
                        .px(px(22.0))
                        .justify_center()
                        .child(
                            text(header)
                                .text_size(type_default::FOOTNOTE.size)
                                .line_height(type_default::FOOTNOTE.line_height)
                                .text_color(tokens::secondary_label),
                        ),
                );
            }
        }
        let id = action.id.clone();
        let color = row_color(action.destructive);
        let chosen = chosen.clone();
        let mut label = view().flex_1().child(
            text(action.title.clone())
                .text_size(type_default::BODY.size)
                .line_height(px(22.0))
                .text_color(color),
        );
        let detailed = action.detail.is_some();
        if let Some(detail) = action.detail.clone() {
            label = label.child(
                text(detail)
                    .text_size(type_default::FOOTNOTE.size)
                    .line_height(px(18.0))
                    .text_color(tokens::secondary_label),
            );
        }
        let mut row = nsh_base::button()
            .role(AccessibilityRole::Menuitem)
            .accessibility_label(action.title.clone())
            .disabled(action.disabled)
            .flex_row()
            .items_center()
            .gap(px(12.0))
            .min_h(px(42.0))
            .px(px(20.0))
            .rounded(px(RADIUS - 6.0))
            .active(|s| s.bg(tokens::fill))
            .pointer_events(move || {
                if closing.get() {
                    PointerEvents::None
                } else {
                    PointerEvents::Auto
                }
            })
            .on_press(move || chosen(id.clone()))
            .child(
                view()
                    .w(px(26.0))
                    .items_center()
                    .child(match action.icon.clone() {
                        Some(name) => icon(&name, 20.0).text_color(color).into_element(),
                        None => view().into_element(),
                    }),
            )
            .child(label);
        if detailed {
            row = row.pt(px(14.0)).pb(px(7.0));
        }
        if !focus_set && !action.disabled {
            row = row.element_ref(&first_item);
            focus_set = true;
        }
        items = items.child(row);
    }
    // The items are cut by the growing shape, drawn in the glass's box.
    let content = if shader {
        glass::clip(
            from,
            to,
            RADIUS,
            morph.grow.animated_node(),
            morph.round.animated_node(),
        )
        .m(px(-PAD))
        .p(px(PAD))
        .child(items)
        .into_element()
    } else {
        items.into_element()
    };

    view()
        .relative()
        .role(AccessibilityRole::Menu)
        .bind_opacity(&morph.fade)
        .bind_translate_x(&morph.shift_x())
        .bind_translate_y(&morph.shift_y())
        .bind_scale(&morph.scale())
        .child(material)
        .child(content)
        .into_element()
}

#[cfg(test)]
mod tests {
    //! The morph sampled every 30 ms, as the platform runs it
    //! ([`sample_driver`]), against the curves fitted to the iOS clip
    //! (`python3 tools/fit-glass-menu.py --rust` prints them), and the fit
    //! against the clip's own frames.

    use super::{motion, spring_driver, timing_driver, value_at};

    /// The fitted curves at 0, 30, … 600 ms after the press.
    const GROW: [f32; 21] = [
        0.0000, 0.1264, 0.3708, 0.6099, 0.7941, 0.9152, 0.9836, 1.0154, 1.0251, 1.0235, 1.0177,
        1.0114, 1.0063, 1.0028, 1.0008, 0.9998, 0.9994, 0.9994, 0.9995, 0.9997, 0.9998,
    ];
    const DROP: [f32; 21] = [
        0.0000, 25.3600, 55.9111, 69.5780, 68.6496, 59.7355, 48.0661, 36.6794, 26.9473, 19.2448,
        13.4485, 9.2388, 6.2606, 4.1955, 2.7859, 1.8359, 1.2021, 0.7828, 0.5074, 0.3275, 0.2107,
    ];
    const ROUNDNESS: [f32; 21] = [
        1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 0.9661, 0.8591, 0.6819, 0.4626,
        0.2523, 0.0969, 0.0148, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000,
    ];
    const ITEMS: [f32; 21] = [
        0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.0000, 0.1776, 0.6230, 0.9245, 1.0000, 1.0000,
        1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
    ];
    const BODY: [f32; 21] = [
        0.4500, 0.4500, 0.4500, 0.4500, 0.4542, 0.5210, 0.6663, 0.8390, 0.9607, 1.0000, 1.0000,
        1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000, 1.0000,
    ];
    /// The close at 0, 30, … 150 ms.
    const CLOSE_OPACITY: [f32; 6] = [1.0000, 1.0000, 1.0000, 0.8438, 0.2603, 0.0000];
    const CLOSE_SCALE: [f32; 6] = [1.0000, 1.0000, 1.0000, 0.9494, 0.9400, 0.9400];

    /// The clip's panel at rest and the 44 pt button it grows from, in pt.
    const REST: [f32; 4] = [250.1, 375.6, 139.6, 342.4];
    const SOURCE: [f32; 4] = [44.0, 44.0, 29.1, 155.5];

    fn grow(ms: f32) -> f32 {
        value_at(spring_driver(motion::shape(), 1.0), 0.0, ms)
    }

    fn drop(ms: f32) -> f32 {
        let [fast, slow] = motion::drop();
        let fast = value_at(spring_driver(fast, 1.0), 0.0, ms);
        let slow = value_at(spring_driver(slow, 1.0), 0.0, ms);
        motion::DROP_PT * (fast - slow)
    }

    fn check(name: &str, expected: &[f32], tolerance: f32, actual: impl Fn(f32) -> f32) {
        for (sample, want) in expected.iter().enumerate() {
            let ms = 30.0 * sample as f32;
            let got = actual(ms);
            assert!(
                (got - want).abs() <= tolerance,
                "{name} at {ms} ms: {got:.4} against the fit's {want:.4} (±{tolerance})"
            );
        }
    }

    /// The shape: within 1 pt of the fit over the clip's 331.6 pt of height.
    #[test]
    fn the_shape_follows_the_fitted_spring_every_30_ms() {
        check("the shape", &GROW, 1.0 / 331.6, grow);
    }

    #[test]
    fn the_drop_follows_the_fitted_bump_every_30_ms() {
        check("the drop (pt)", &DROP, 1.0, drop);
    }

    #[test]
    fn the_corners_and_the_items_follow_the_fit_every_30_ms() {
        check("the roundness", &ROUNDNESS, 0.01, |ms| {
            value_at(timing_driver(motion::corners(), 0.0), 1.0, ms)
        });
        check("the items' opacity", &ITEMS, 0.01, items);
        check("the body's share of the fill", &BODY, 0.01, body);
    }

    fn items(ms: f32) -> f32 {
        value_at(timing_driver(motion::items(), 1.0), 0.0, ms)
    }

    fn body(ms: f32) -> f32 {
        value_at(timing_driver(motion::body(), 1.0), motion::BODY_FROM, ms)
    }

    fn fill_alpha(ms: f32) -> f32 {
        nsh_core::Rgba::from(crate::context_menu::menu_fill(false)).a * body(ms)
    }

    /// No item shows while the shape is a blob: none before 170 ms, as the
    /// clip has none at 107 ms; all of them by its frame 5 (274 ms).
    #[test]
    fn no_item_shows_before_the_blob_phase_ends() {
        for ms in (0..=170).step_by(10) {
            let shown = items(ms as f32);
            assert!(shown == 0.0, "items at {ms} ms: {shown}");
        }
        assert!(items(274.0) >= 0.999, "items at 274 ms: {}", items(274.0));
    }

    /// The body is the measured fill from the first frame: white at the
    /// clip's blob's α (frame 0, 107 ms: 0.27, per bar 0.24-0.30) from t = 0
    /// through the blob phase, the settled fill's (frame 5 on: per bar
    /// 0.54-0.63, mean 0.567 at frame 12) by 274 ms; the shadow the clip's
    /// fit (`tools/fit-glass-menu.py`).
    #[test]
    fn the_body_is_the_measured_fill_from_the_first_frame() {
        for ms in (0..=107).step_by(10).chain([107]) {
            let alpha = fill_alpha(ms as f32);
            assert!(
                (0.24..=0.31).contains(&alpha),
                "the blob's fill at {ms} ms: α {alpha:.3}, the clip's 0.24-0.30"
            );
        }
        for ms in [274.0, 407.0, 600.0] {
            let alpha = fill_alpha(ms);
            assert!(
                (0.54..=0.63).contains(&alpha),
                "the fill at {ms} ms: α {alpha:.3}, the clip's 0.54-0.63"
            );
        }
        let white = nsh_core::Rgba::from(crate::context_menu::menu_fill(false));
        assert!(
            white.r > 0.99 && white.g > 0.99 && white.b > 0.99,
            "{white:?}"
        );
        assert_eq!(motion::SHADOW, (0.115, 9.0, 36.0));
    }

    /// One part's value `ms` into the close, from the open menu's.
    fn closing(part: motion::Part, ms: f32) -> f32 {
        motion::close()
            .into_iter()
            .filter(|(moved, _, _)| *moved == part)
            .fold(part.open(), |value, (_, to, timing)| {
                value_at(timing_driver(timing, to), value, ms)
            })
    }

    /// The close fades the menu as one layer: the fill and the items have
    /// one opacity at every 30 ms (and every 10), so the page never shows
    /// through the fill while the items still show.
    #[test]
    fn the_fill_and_the_items_fade_as_one_layer() {
        use motion::Part;
        for ms in (0..=150).step_by(10) {
            let ms = ms as f32;
            let menu = closing(Part::Menu, ms);
            let fill = menu * closing(Part::Body, ms);
            let items = menu * closing(Part::Items, ms);
            assert!(
                (fill - items).abs() < 1e-6,
                "{ms} ms into the close: the fill at {fill:.3}, the items at {items:.3}"
            );
        }
        assert_eq!(closing(Part::Menu, motion::CLOSE_MS), 0.0);
    }

    #[test]
    fn the_close_holds_then_shrinks_and_fades_within_130_ms() {
        check("the close's opacity", &CLOSE_OPACITY, 0.01, |ms| {
            value_at(timing_driver(motion::close_fade(), 0.0), 1.0, ms)
        });
        check("the close's scale", &CLOSE_SCALE, 0.002, |ms| {
            let shrink = value_at(timing_driver(motion::close_shrink(), 1.0), 0.0, ms);
            1.0 + (motion::CLOSE_SCALE - 1.0) * shrink
        });
        let fade = motion::close_fade();
        let shrink = motion::close_shrink();
        assert!(fade.delay_ms + fade.duration_ms <= motion::CLOSE_MS);
        assert!(shrink.delay_ms + shrink.duration_ms <= motion::CLOSE_MS);
    }

    /// The fit against the clip's frames that differ (`tools/fit-glass-menu.py`):
    /// width and centre within 4 pt and the centre's height within 6 pt;
    /// height within 20 pt, as frame 0's blob has no sharp bottom over the
    /// page (±8 px of shadow) and frame 5 is measured to 9 pt.
    #[test]
    fn the_fit_matches_the_ios_frames() {
        // ms from the press; the panel's width, height, centre x and y in pt.
        let frames: [(f32, [f32; 4]); 3] = [
            (107.0, [190.1, 265.6, 111.4, 360.2]),
            (273.7, [254.7, 392.0, 141.9, 363.3]),
            (407.0, [250.6, 375.6, 139.8, 340.6]),
        ];
        for (ms, ios) in frames {
            let p = grow(ms);
            let shape: Vec<f32> = (0..4)
                .map(|i| SOURCE[i] + (REST[i] - SOURCE[i]) * p)
                .collect();
            let model = [shape[0], shape[1], shape[2], shape[3] + drop(ms)];
            for (i, (name, tolerance)) in [("width", 4.0), ("height", 20.0), ("x", 4.0), ("y", 6.0)]
                .into_iter()
                .enumerate()
            {
                assert!(
                    (model[i] - ios[i]).abs() <= tolerance,
                    "{name} at {ms} ms: {:.1} pt against iOS's {:.1} (±{tolerance})",
                    model[i],
                    ios[i]
                );
            }
        }
    }
}
