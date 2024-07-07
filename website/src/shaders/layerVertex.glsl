precision highp float;

attribute vec4 aVertexPosition;
attribute vec2 aUVCoord;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform mat4 uProjectionMatrix;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;
    vUVCoord = aUVCoord;
}
