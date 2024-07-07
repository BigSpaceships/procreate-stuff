precision highp float;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform sampler2D uSampler;

void main() {
    gl_FragColor = texture2D(uSampler, vUVCoord);
}
