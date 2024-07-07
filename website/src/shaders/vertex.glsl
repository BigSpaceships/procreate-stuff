precision highp float;

attribute vec4 aVertexPosition;
attribute vec2 aUVCoord;

varying vec2 vVertexPosition;
varying vec2 vUVCoord;

uniform mat4 uProjectionMatrix;
uniform sampler2D uSampler;

void main() {
    gl_Position = uProjectionMatrix * aVertexPosition;
    vVertexPosition = aVertexPosition.xy;

    vUVCoord = aUVCoord;
}
