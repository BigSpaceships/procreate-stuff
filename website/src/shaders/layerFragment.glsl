precision highp float;

varying vec2 vVertexPosition;

uniform vec4 uBackgroundColor;
uniform int uBlendMode;
uniform float uOpacity;

void main() {
    // if (uBlendMode != -1) {
        gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0);
    // }
}
