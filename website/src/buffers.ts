import { Buffers } from "./types";

export function initBuffers(gl: WebGL2RenderingContext): Buffers | null {
    const positionBuffer = initPositionBuffer(gl);

    if (positionBuffer == null) { 
        console.error("position buffer was null");
        return null;
    }

    const uvBuffer = initUVBuffer(gl);

    if (uvBuffer == null) { 
        console.error("uv buffer was null");
        return null;
    }

    return {
        position: positionBuffer,
        uvs: uvBuffer,
    }
}

function initPositionBuffer(gl: WebGL2RenderingContext): WebGLBuffer | null {
    const positionBuffer = gl.createBuffer();

    if (positionBuffer == null) {
        console.error("position buffer was null");
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    return positionBuffer;
}

function initUVBuffer(gl: WebGL2RenderingContext): WebGLBuffer | null {
    const uvBuffer = gl.createBuffer();

    if (uvBuffer == null) {
        console.error("uv buffer was null");
        return null;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);

    const uvs = [1.0, 0.0, 0.0, 0.0, 1.0, 1.0, 0.0, 1.0];

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvs), gl.STATIC_DRAW);

    return uvBuffer;
}
