//! Writes the generated theme files (`theme/theme.json`, `theme/tailwind.json`),
//! which an app's `nsh.json` points at.
//!
//! `cargo run --bin gen-theme` writes them; `--check` exits 1 when the files
//! on disk differ (CI runs it after a build).

use std::{fs, path::Path, process::ExitCode};

fn targets() -> [(&'static str, String); 2] {
    [
        ("theme/theme.json", nsh_cupertino::theme_file::theme_json()),
        (
            "theme/tailwind.json",
            nsh_cupertino::theme_file::tailwind_json(),
        ),
    ]
}

fn main() -> ExitCode {
    let check = std::env::args().any(|arg| arg == "--check");
    let mut stale = false;
    for (path, contents) in targets() {
        if check {
            let current = fs::read_to_string(path).unwrap_or_default();
            if current != contents {
                eprintln!("{path} is out of date: run `cargo run --bin gen-theme`");
                stale = true;
            }
            continue;
        }
        if let Some(parent) = Path::new(path).parent() {
            fs::create_dir_all(parent).expect("the directory is writable");
        }
        fs::write(path, &contents).expect("the file is writable");
        println!("wrote {path}");
    }
    if stale {
        ExitCode::FAILURE
    } else {
        ExitCode::SUCCESS
    }
}
