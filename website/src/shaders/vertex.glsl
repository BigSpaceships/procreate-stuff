precision highp float;

attribute vec4 aVertexPosition;
varying vec2 vVertexPosition;

uniform mat4 uProjectionMatrix;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;
    vVertexPosition = aVertexPosition.xy;
}
