precision highp float;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform sampler2D uSampler;
uniform sampler2D uCurrentTexture;

uniform int uBlendMode;
uniform float uOpacity;

void main() {
    gl_FragColor = texture2D(uSampler, vUVCoord) * 0.2 + texture2D(uCurrentTexture, vUVCoord);
}
