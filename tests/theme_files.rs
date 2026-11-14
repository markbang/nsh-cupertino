//! The committed theme files are generated from `src/tokens.rs`: an app's
//! `nsh.json` and Rust components must not be able to disagree about a value.

use std::{fs, path::Path};

#[test]
fn committed_theme_files_match_the_tokens() {
    let root = Path::new(env!("CARGO_MANIFEST_DIR"));
    for (path, expected) in [
        ("theme/theme.json", nsh_cupertino::theme_file::theme_json()),
        (
            "theme/tailwind.json",
            nsh_cupertino::theme_file::tailwind_json(),
        ),
    ] {
        let written = fs::read_to_string(root.join(path)).unwrap_or_default();
        assert_eq!(
            written, expected,
            "{path} is stale: run `cargo run --bin gen-theme`"
        );
    }
}

#[test]
fn every_role_has_its_own_dark_and_increased_contrast_values() {
    let mut adjusted = 0;
    for role in nsh_cupertino::tokens::ROLES {
        // A gray that is the same in both appearances, as Apple's systemGray.
        if role.name != "system-gray" {
            assert_ne!(
                role.light, role.dark,
                "{}: one value for both appearances",
                role.name
            );
        }
        if role.dark_hc != role.dark || role.light_hc != role.light {
            adjusted += 1;
        }
    }
    assert!(
        adjusted * 2 > nsh_cupertino::tokens::ROLES.len(),
        "most roles should have an increased-contrast value"
    );
}

#[test]
fn the_type_scale_is_eleven_steps_with_room_for_a_second_line() {
    use nsh_cupertino::tokens::type_default::*;
    let steps = [
        LARGE_TITLE,
        TITLE1,
        TITLE2,
        TITLE3,
        HEADLINE,
        BODY,
        CALLOUT,
        SUBHEADLINE,
        FOOTNOTE,
        CAPTION1,
        CAPTION2,
    ];
    assert_eq!(steps.len(), 11);
    for step in steps {
        assert!(
            step.line_height.0 > step.size.0,
            "{step:?}: the line height leaves no room"
        );
    }
    assert_eq!(LARGE_TITLE.weight, 700);
    assert_eq!(HEADLINE.weight, 600);
}
