// The Liquid Glass material's shader is a constant in `src/glass.rs`: this
// compiles it (naga, the validator wgpu and browsers share) and checks that
// every uniform the components set is one the program declares, so a typo
// fails here rather than silently falling back to the material.

use nsh_core::shader::Shader;

#[test]
fn the_glass_shader_compiles_with_the_uniforms_the_components_set() {
    let shader = Shader::compile(nsh_cupertino::glass_source()).expect("the glass shader compiles");
    let declared: Vec<&str> = shader.uniforms().iter().map(|field| &*field.name).collect();
    for name in [
        "tint",
        "radii",
        "other_radii",
        "first",
        "second",
        "count",
        "progress",
        "spacing",
        "light",
        "bevel",
        "thickness",
        "lens",
        "specular",
        "chroma",
        "blur",
        "taps",
        "adapt",
        "dark",
        "tilt",
        "saturation",
        "frost_opacity",
        "frost_clamp",
        "frost_weight",
        "rim_shade",
        "rim_light",
        "body_shade",
        "reveal",
        "morph",
        "anchor",
        "min_radius",
        "margin",
        "shadow",
        "light_lift",
        "roundness",
        "body",
        "shadow_offset",
        "shadow_sigma",
        "two_scale_tint",
        "two_scale_alpha",
    ] {
        assert!(
            declared.contains(&name),
            "the program declares `{name}`: {declared:?}"
        );
    }
    assert!(
        shader
            .inputs()
            .contains(nsh_core::shader::ShaderInput::Backdrop)
    );
    assert!(!shader.animated(), "a static glass draws once");
}

// The web tab bar's layers (ghost opaque, frost at α2, tint at β) must give back
// the measured two-scale fit: k2 = (1 − β)·α2, k1 = (1 − β)·(1 − α2), t = β·tint.
#[test]
fn the_two_scale_layers_give_back_the_measured_fit() {
    use nsh_cupertino::tokens::bar;
    for (fit, beta, alpha, tint) in [
        (bar::LIGHT, 0.668, 0.791, 250.2),
        (bar::DARK, 0.356, 0.784, 102.8),
    ] {
        let b = fit.tint_alpha();
        let a = fit.frost_alpha();
        assert!((b - beta).abs() < 1e-3, "β {b}, expected {beta}");
        assert!((a - alpha).abs() < 1e-3, "α2 {a}, expected {alpha}");
        assert!(
            (fit.tint_level() - tint).abs() < 0.1,
            "tint {}",
            fit.tint_level()
        );
        assert!(((1.0 - b) * a - fit.frost).abs() < 1e-6);
        assert!(((1.0 - b) * (1.0 - a) - fit.ghost).abs() < 1e-6);
        assert!((b * fit.tint_level() - fit.offset).abs() < 1e-3);
    }
    assert!((bar::reduced_level(false) - 251.80).abs() < 0.01);
    assert!((bar::reduced_level(true) - 36.58).abs() < 0.01);
}
