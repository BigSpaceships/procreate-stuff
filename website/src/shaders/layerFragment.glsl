precision highp float;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform sampler2D uSampler;
uniform sampler2D uCurrentTexture;

uniform int uBlendMode;
uniform float uOpacity;

vec3 comp(vec3 col, float alpha) {
    return col * (1.0 - alpha);
}

float stdalpha(float previous, float source) {
    return previous + source - previous * source;
}

vec4 premultiplied_blend(vec4 previous, vec4 source, vec4 target) {
    return clamp(vec4(
        target.xyz * target.w * previous.w + comp(source.xyz, previous.w) + comp(previous.xyz, target.w),
        stdalpha(previous.a, source.a)
    ), vec4(0.0), vec4(1.0));
}

vec4 blendColors(vec4 base, vec4 top, float opacity) {
    float alpha = top.w + base.w * (1.0 - top.w);

    vec3 col = top.xyz * top.w + base.xyz * base.w * (1.0 - top.w);
    return vec4(col / alpha, alpha);
}

void main() {
    vec4 base = texture2D(uCurrentTexture, vUVCoord);
    vec4 top = texture2D(uSampler, vUVCoord);

    gl_FragColor = premultiplied_blend(base, top, vec4(top.xyz, top.w * uOpacity));
}
