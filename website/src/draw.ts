import { Buffers, ProgramInfo } from "./types";

export function render(gl: WebGL2RenderingContext, programInfo: ProgramInfo, buffers: Buffers) {
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clearDepth(1.0);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    setPositionAttribute(gl, programInfo, buffers);

    gl.useProgram(programInfo.program);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function setPositionAttribute(gl: WebGL2RenderingContext, programInfo: ProgramInfo, buffers: Buffers) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);

    gl.vertexAttribPointer(
        programInfo.attribLocations.vertexPosition,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
}