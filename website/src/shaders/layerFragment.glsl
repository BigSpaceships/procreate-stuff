precision highp float;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform sampler2D uSampler;
uniform sampler2D uCurrentTexture;

uniform int uBlendMode;
uniform float uOpacity;

// blend modes (taken from https://github.com/Avarel/silicate/blob/master/src/shader.wgsl)

// util
vec3 comp(vec3 col, float alpha) {
    return col * (1.0 - alpha);
}

float stdalpha(float previous, float source) {
    return previous + source - previous * source;
}

// hsl
float lum(vec3 c) {
    return dot(c, vec3(0.3, 0.59, 0.11)); // wait what
}

vec3 clip_color(vec3 c) {
    float l = lum(c);
    float n = min(min(c.x, c.y), c.z);
    float x = max(max(c.x, c.y), c.z);
    vec3 z = c;
    if (n < 0.0) {
        z = l + (((c - l) * l) / (l - n));
    }
    if (x > 1.0) {
        z = l + (((z - l) * (1.0 - l)) / (x - l));
    }
    return clamp(z, vec3(0.0), vec3(1.0));
}

vec3 set_lum(vec3 c, float l) {
    float d = l - lum(c);
    return clip_color(c + d);
}

float sat(vec3 c) {
    float n = min(min(c.x, c.y), c.z);
    float x = max(max(c.x, c.y), c.z);
    return x - n;
}

vec3 set_sat(vec3 cb, float s) {
    float mb = min(min(cb.x, cb.y), cb.z);
    float sb = sat(cb);
    // Equivalent (modulo rounding errors) to setting the
    // smallest (R,G,B) component to 0, the largest to <ssat>,
    // and interpolating the "middle" component based on its
    // original value relative to the smallest/largest.
    if (sb > 0.0) {
        return (cb - mb) * s / sb;
    } else {
        return vec3(0.0);
    }
}

vec3 color(vec3 b, vec3 s) {
    return set_lum(s.xyz, lum(b.xyz));
}

vec3 luminosity(vec3 b, vec3 s) {
    return set_lum(b.xyz, lum(s.xyz));
}

vec3 hue(vec3 b, vec3 s) {
    return set_lum(set_sat(s.xyz, sat(b.xyz)), lum(b.xyz));
}

vec3 saturation(vec3 b, vec3 s) {
    return set_lum(set_sat(b.xyz, sat(s.xyz)), lum(b.xyz));
}

// rgb modes
vec3 normal(vec3 b, vec3 s) {
    return s;
}

vec3 multiply(vec3 b, vec3 s) {
    return s * b;
}

vec3 divide(vec3 b, vec3 s) {
    return b / s;
}

vec3 screen(vec3 b, vec3 s) {
    return s + b - s * b;
}

vec3 add(vec3 b, vec3 s) {
    return s + b;
}

vec3 hard_light(vec3 b, vec3 s) {
    return mix(
        screen(b, 2.0 * s - 1.0),
        multiply(b, s * 2.0),
        step(s, vec3(0.5))
    );
}

vec3 overlay(vec3 b, vec3 s) {
    return hard_light(s, b);
}

vec3 darken(vec3 b, vec3 s) {
    return min(s, b);
}

vec3 lighten(vec3 b, vec3 s) {
    return max(s, b);
}

vec3 difference(vec3 b, vec3 s) {
    return abs(b - s);
}

vec3 subtract(vec3 b, vec3 s) {
    return b - s;
}

vec3 linear_burn(vec3 b, vec3 s) {
    return max(b + s - 1.0, vec3(0.0));
}

vec3 linear_dodge(vec3 b, vec3 s) {
    return min(b + s, vec3(1.0));
}

vec3 linear_light(vec3 b, vec3 s) {
    return mix(
        linear_dodge(b, 2.0 * (s - 0.5)),
        linear_burn(b, 2.0 * s),
        step(s, vec3(0.5))
    );
}

vec3 exclusion(vec3 b, vec3 s) {
    return b + s - 2.0 * b * s;
}

vec3 color_dodge(vec3 b, vec3 s) {
    return mix(
        vec3(1.0),
        min(vec3(1.0), b / (1.0 - s)),
        step(s, vec3(1.0))
    );
}

vec3 color_burn(vec3 b, vec3 s) {
    return mix(
        1.0 - min(vec3(1.0), (1.0 - b) / s),
        vec3(0.0),
        step(s, vec3(0.0))
    );
}

vec3 soft_light(vec3 b, vec3 s) {
    return mix(
        sqrt(b) * (2.0 * s - 1.0) + 2.0 * b * (1.0 - s),
        2.0 * b * s + b * b * (1.0 - 2.0 * s),
        step(s, vec3(0.5))
    );
}

vec3 vivid_light(vec3 b, vec3 s) {
    return mix(
        color_dodge(b, 2.0 * (s - 0.5)),
        color_burn(b, 2.0 * s),
        step(s, vec3(0.5))
    );
}

vec3 hard_mix(vec3 b, vec3 s) {
    return mix(
        vec3(1.0),
        vec3(0.0),
        step(vivid_light(b, s), vec3(0.5))
    );
}

vec3 pin_light(vec3 b, vec3 s) {
    return mix(
        lighten(b, 2.0 * (s - 0.5)),
        darken(b, 2.0 * s),
        step(s, vec3(0.5))
    );
}

vec3 lighter_color(vec3 b, vec3 s) {
    if (lum(b) < lum(s)) {
        return s;
    } else {
        return b;
    }
}

vec3 darker_color(vec3 b, vec3 s) {
    if (lum(b) < lum(s)) {
        return b;
    } else {
        return s;
    }
}

// actual fragment shader

vec4 premultiplied_blend(vec4 previous, vec4 source, vec4 target) {
    return clamp(vec4(
            target.rgb * target.w * previous.w + comp(source.xyz, previous.w) + comp(previous.xyz, target.w),
            stdalpha(previous.a, source.a)
        ), vec4(0.0), vec4(1.0));
}

void main() {
    vec4 base = texture2D(uCurrentTexture, vUVCoord);
    vec4 top = texture2D(uSampler, vUVCoord);

    vec4 bg = vec4(clamp(base.rgb / base.a, vec3(0.0), vec3(1.0)), base.a);
    vec4 fg = vec4(clamp(top.rgb / top.a, vec3(0.0), vec3(1.0)), top.a * uOpacity);

    vec3 targetColor = vec3(0.0);

    if (uBlendMode == 1) {
        targetColor = multiply(bg.rgb, fg.rgb);
    } else if (uBlendMode == 2) {
        targetColor = screen(bg.rgb, fg.rgb);
    } else if (uBlendMode == 3) {
        targetColor = add(bg.rgb, fg.rgb);
    } else if (uBlendMode == 4) {
        targetColor = lighten(bg.rgb, fg.rgb);
    } else if (uBlendMode == 5) {
        targetColor = exclusion(bg.rgb, fg.rgb);
    } else if (uBlendMode == 6) {
        targetColor = difference(bg.rgb, fg.rgb);
    } else if (uBlendMode == 7) {
        targetColor = subtract(bg.rgb, fg.rgb);
    } else if (uBlendMode == 8) {
        targetColor = linear_burn(bg.rgb, fg.rgb);
    } else if (uBlendMode == 9) {
        targetColor = color_dodge(bg.rgb, fg.rgb);
    } else if (uBlendMode == 10) {
        targetColor = color_burn(bg.rgb, fg.rgb);
    } else if (uBlendMode == 11) {
        targetColor = overlay(bg.rgb, fg.rgb);
    } else if (uBlendMode == 12) {
        targetColor = hard_light(bg.rgb, fg.rgb);
    } else if (uBlendMode == 13) {
        targetColor = color(bg.rgb, fg.rgb);
    } else if (uBlendMode == 14) {
        targetColor = luminosity(bg.rgb, fg.rgb);
    } else if (uBlendMode == 15) {
        targetColor = hue(bg.rgb, fg.rgb);
    } else if (uBlendMode == 16) {
        targetColor = saturation(bg.rgb, fg.rgb);
    } else if (uBlendMode == 17) {
        targetColor = soft_light(bg.rgb, fg.rgb);
    } else if (uBlendMode == 19) { // no 18 for some reason (i think it's normal)
        targetColor = darken(bg.rgb, fg.rgb);
    } else if (uBlendMode == 20) {
        targetColor = hard_mix(bg.rgb, fg.rgb);
    } else if (uBlendMode == 21) {
        targetColor = vivid_light(bg.rgb, fg.rgb);
    } else if (uBlendMode == 22) {
        targetColor = linear_light(bg.rgb, fg.rgb);
    } else if (uBlendMode == 23) {
        targetColor = pin_light(bg.rgb, fg.rgb);
    } else if (uBlendMode == 24) {
        targetColor = lighter_color(bg.rgb, fg.rgb);
    } else if (uBlendMode == 25) {
        targetColor = darker_color(bg.rgb, fg.rgb);
    } else if (uBlendMode == 26) {
        targetColor = divide(bg.rgb, fg.rgb);
    } else if (uBlendMode == 27) {
        targetColor = normal(bg.rgb, fg.rgb);
    }

    targetColor = clamp(targetColor, vec3(0.0), vec3(1.0));

    gl_FragColor = premultiplied_blend(base, top, vec4(targetColor, fg.a));
}
