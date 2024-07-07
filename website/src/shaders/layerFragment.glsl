precision highp float;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform sampler2D uSampler;

// uniform vec4 uBackgroundColor;
// uniform int uBlendMode;
// uniform float uOpacity;

void main() {
    gl_FragColor = texture2D(uSampler, vUVCoord);
}
