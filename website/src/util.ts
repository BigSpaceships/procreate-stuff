import { Buffers, LayerProgramInfo, ProgramInfo } from "./types";

export function setPositionAttribute(gl: WebGL2RenderingContext, programInfo: ProgramInfo | LayerProgramInfo, buffers: Buffers) {
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

export function setUVAttribute(gl: WebGL2RenderingContext, programInfo: LayerProgramInfo | ProgramInfo, buffers: Buffers) {
    const numComponents = 2;
    const type = gl.FLOAT;
    const normalize = false;
    const stride = 0;
    const offset = 0;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.uvs);

    gl.vertexAttribPointer(
        programInfo.attribLocations.uvCoord,
        numComponents,
        type,
        normalize,
        stride,
        offset,
    );

    gl.enableVertexAttribArray(programInfo.attribLocations.uvCoord);
}

export async function loadTexture(gl: WebGL2RenderingContext, src: string | ImageBitmap, texture: WebGLTexture | null = null): Promise<WebGLTexture | null> {
    if (texture == null) {
        texture = gl.createTexture();

        if (texture == null) {
            return null;
        }
    }

    if (src instanceof ImageBitmap) {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);

        return texture;
    }

    return new Promise(resolve => {
        const image = new Image();

        image.onload = () => {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

            resolve(texture);
        }
        image.src = src;
    })
}
