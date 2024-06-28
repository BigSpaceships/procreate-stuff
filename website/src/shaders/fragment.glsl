precision highp float;

varying vec2 vVertexPosition;

void main() {
    gl_FragColor = vec4(vVertexPosition.xy, 1.0, 1.0);
}
