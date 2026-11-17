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
        "bloom",
        "lift",
        "chroma",
        "blur",
        "taps",
        "inner",
        "edge",
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
