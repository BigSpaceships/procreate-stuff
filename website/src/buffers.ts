import { Buffers } from "./types";

export function initBuffers(gl: WebGL2RenderingContext): Buffers | null {
    const positionBuffer = initPositionBuffer(gl);

    if (positionBuffer == null) return null;

    return {
        position: positionBuffer
    }
}

function initPositionBuffer(gl: WebGL2RenderingContext): WebGLBuffer | null {
    const positionBuffer = gl.createBuffer();

    if (positionBuffer == null) return null;

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}
