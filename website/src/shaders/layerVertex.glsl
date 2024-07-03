precision highp float;

attribute vec4 aVertexPosition;
varying vec2 vVertexPosition;

void main() {
    gl_Position = aVertexPosition;
    vVertexPosition = aVertexPosition.xy;
}
